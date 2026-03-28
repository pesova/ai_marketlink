import { Request, Response, NextFunction } from "express";
import whatsappAuthService from "../services/whatsappAuth.service";
import {
  sendTextMessage,
  sendTypingIndicator,
} from "../services/whatsapp.service";
import env from "../../../config/env";
import { Vendor } from "../../../models";
import { parseIncomingMessage } from "../services/message_parser";
import ChatService from "../../../services/ChatService";
import {
  clearPendingAction,
  getPendingAction,
  getSession,
  resetUserState,
  savePendingAction,
  saveSession,
  WhatsAppSession,
} from "../storage/pending_actions";
import {
  isCancelMessage,
  isConfirmDeliveryMessage,
  isStatusMessage,
  isVendorMenuMessage,
} from "../config/keywords";
import {
  formatOrderStatus,
  formatProductList,
  formatVendorBalance,
} from "../utils/templates";
import { OrderService } from "../../../services";
import PaymentService from "../../../services/PaymentService";

export const verifyWebhook = (req: Request, res: Response) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    return res.send(challenge as string);
  }
  return res.sendStatus(403);
};

export const handleIncomingMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.sendStatus(200);

  try {
    const message = parseIncomingMessage(req.body);
    if (!message) return;
    await sendTypingIndicator(message.from, message.messageId);

    const phone = whatsappAuthService.normalizePhone(message.from);
    const session = await getSession(phone);
    if (session.role === "unknown") {
      const identified = await identifyUser(phone, session);
      if (!identified) return; // sent "please register" message
    }

    if (message.type === "text") {
      if (isCancelMessage(message.text)) {
        await resetUserState(phone);
        await sendTextMessage(
          phone,
          `All cleared! You're back at the main menu.\n\n How can I help you today?`,
        );
        return;
      }

      if (isStatusMessage(message.text)) {
        await handleOrderStatus(phone, session);
        return;
      }

      // ── STEP 4: Global delivery confirm ─────────────────────────
      if (isConfirmDeliveryMessage(message.text) && session.currentOrderId) {
        await handleConfirmDelivery(phone, session);
        return;
      }
    }
    if (message.type === "interaction") {
      // return await handleInteraction(message.interactionId, message.from);
      return;
    }

    const pending = await getPendingAction(phone);
    const text = message.text;

    if (pending?.type === "PRODUCT_SELECTION") {
      await handleProductSelection(phone, session, text);
      return;
    }

    if (pending?.type === "DELIVERY_ADDRESS") {
      await handleDeliveryAddress(phone, session, text);
      return;
    }

    if (pending?.type === "VENDOR_ACTION") {
      await handleVendorAction(phone, session, text);
      return;
    }

    if (
      message.type === "text" &&
      isVendorMenuMessage(text) &&
      session.vendorId
    ) {
      await showVendorMenu(phone, session);
      return;
    }

    const { message: aiReply, products } = await ChatService.chat(
      session.userId!,
      text,
    );

    await sendTextMessage(phone, aiReply);

    if (products && products.length > 0) {
      // Store results and set pending action
      session.searchResults = products;
      session.step = "AWAITING_SELECTION";
      await saveSession(session);
      await savePendingAction(phone, {
        type: "PRODUCT_SELECTION",
        payload: { products },
      });

      await sendTextMessage(
        phone,
        formatProductList(products) +
          `\n\nReply with a *number* to select, or keep chatting to refine your search.\n_Reply *cancel* to start over._`,
      );
    }

  } catch (err) {
    console.error("WhatsApp webhook error:", err);
  }
};

async function identifyUser(
  phone: string,
  session: WhatsAppSession,
): Promise<boolean> {
  const user = await whatsappAuthService.findUserByPhone(phone);

  if (!user) {
    await sendTextMessage(
      phone,
      `👋 Welcome to *AI MarketLink*!\n\nI couldn't find an account linked to your number.\n\n🔗 Register at ${process.env.FRONTEND_URL}\n\nOnce registered, come back and chat with me!`,
    );
    return false;
  }

  session.userId = user._id.toString();
  session.email = user.email;
  const vendor = await Vendor.findOne({ userId: user._id }).lean();

  if (vendor) {
    session.vendorId = vendor._id.toString();
    session.role = "vendor";
  } else {
    session.role = "buyer";
  }

  await saveSession(session);

  await sendTextMessage(
    phone,
    `👋 Welcome back, *${user.name}*! ${vendor ? "🏪 Vendor account detected." : ""}\n\n${vendor ? "\n\nReply *vendor menu* to manage your store." : ""}`,
  );

  return true;
}

async function handleProductSelection(
  phone: string,
  session: WhatsAppSession,
  text: string,
) {
  const products = session.searchResults ?? [];

  // Try numeric selection first
  const index = parseInt(text.trim()) - 1;
  const selected = !isNaN(index) ? products[index] : null;  
  if (!selected) {
    await sendTextMessage(
      phone,
      `Please reply with a number between *1* and *${products.length}*.\n\n_Or reply *cancel* to start over._`,
    );
    return;
  }

  session.selectedProduct = selected;
  session.step = "AWAITING_DELIVERY_ADDRESS";
  await saveSession(session);

  // Swap pending action to delivery address
  await savePendingAction(phone, {
    type: "DELIVERY_ADDRESS",
    payload: {
      productId: selected._id,
      productName: selected.name,
      price: selected.price,
    },
  });

  await sendTextMessage(
    phone,
    `✅ Great choice!\n\n*${selected.name}*\n💰 ₦${Number(selected.price).toLocaleString()}\n\nPlease send your *delivery address*:\n\n_Reply *cancel* to start over._`,
  );
}

async function handleDeliveryAddress(
  phone: string,
  session: WhatsAppSession,
  address: string,
) {
  if (address.trim().length < 5) {
    await sendTextMessage(
      phone,
      "📍 Please provide a more detailed delivery address.",
    );
    return;
  }

  const product = session.selectedProduct;
  if (!product) {
    await resetUserState(phone);
    await sendTextMessage(
      phone,
      "⚠️ Session expired. Please start your search again.",
    );
    return;
  }

  try {
    const order = await OrderService.createOrder(session.userId!, {
      productId: product._id,
      quantity: 1,
      deliveryAddress: address,
    });
    
    const { paymentUrl, transactionRef } = await PaymentService.initiatePayment(
      order._id.toString(),
      session.userId!,
      session.email!,
    );

    session.currentOrderId = order._id.toString();
    session.step = "ORDER_CREATED";
    await saveSession(session);
    await clearPendingAction(phone); // no more pending — waiting for payment

    await sendTextMessage(
      phone,
      `🛒 *Order Created Successfully!*\n\n` +
        `📦 Product: ${product.name}\n` +
        `💰 Amount: ₦${Number(product.price).toLocaleString()}\n` +
        `📍 Address: ${address}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💳 *Complete your payment:*\n${paymentUrl}\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Important:*\n` +
        `• Order reference: ${transactionRef}\n` +
        `Your funds will be held in *escrow* until you confirm delivery.\n\n` +
        `Reply *status* anytime to check your order.`,
    );
  } catch (err: any) {
        const userMessage = err?.message?.includes("Only")
      ? `❌ ${err.message}`
      : "❌ Could not create your order. Please try again.";

    await sendTextMessage(phone, userMessage);
    // Keep pending action so they can retry with same product
  }
}

async function handleOrderStatus(phone: string, session: WhatsAppSession) {
  try {
    const orders = await OrderService.getBuyerOrders(session.userId!);

    if (!orders.length) {
      await sendTextMessage(
        phone,
        "You don't have any orders yet.\n\nTell me what you'd like to buy!",
      );
      return;
    }

    const latest = orders[0];
    await sendTextMessage(phone, formatOrderStatus(latest));
  } catch (err) {
    await sendTextMessage(
      phone,
      "⚠️ Could not fetch your orders. Please try again.",
    );
  }
}

async function handleConfirmDelivery(phone: string, session: WhatsAppSession) {
  try {
    await OrderService.confirmDelivery(
      session.currentOrderId!,
      session.userId!,
    );

    session.currentOrderId = undefined;
    session.step = "AWAITING_INTENT";
    await saveSession(session);

    await sendTextMessage(
      phone,
      `🎉 *Delivery Confirmed!*\n\nPayment has been released to the vendor.\n\nThank you for shopping on AI MarketLink! 🛍️\n\nWhat else can I help you find?`,
    );
  } catch (err: any) {
    console.error("Confirm delivery error:", err?.message);
    await sendTextMessage(
      phone,
      `❌ ${err?.message || "Could not confirm delivery. Please try again."}`,
    );
  }
}

async function showVendorMenu(phone: string, session: WhatsAppSession) {
  session.step = "VENDOR_MENU";
  await saveSession(session);
  await savePendingAction(phone, { type: "VENDOR_ACTION", payload: {} });

  await sendTextMessage(
    phone,
    `🏪 *Vendor Menu*\n\n` +
      `Reply with a number:\n\n` +
      `*1.* 📋 View my orders\n` +
      `*2.* 🚚 Mark order as shipped\n` +
      `*3.* 📬 Mark order as delivered\n` +
      `*4.* 💰 View my balance\n` +
      `*5.* 🛍️ Switch to buyer mode\n\n` +
      `_Reply *cancel* to exit menu_`,
  );
}

async function handleVendorAction(
  phone: string,
  session: WhatsAppSession,
  text: string,
) {
  if (session.step === "VENDOR_AWAITING_DELIVERED_ID") {
    await handleMarkDelivered(phone, session, text);
    return;
  }

  // Sub-step: awaiting order ID to ship
  if (session.step === "VENDOR_AWAITING_SHIP_ID") {
    await handleMarkShipped(phone, session, text);
    return;
  }

  const choice = text.trim();

  if (choice === "1") {
    const orders = await OrderService.getVendorOrders(session.vendorId!);
    if (!orders.length) {
      await sendTextMessage(phone, "You don't have any orders yet.");
    } else {
      const list = orders
        .slice(0, 5)
        .map(
          (o: any, i: number) =>
            `*${i + 1}.* Order #${o._id.toString().slice(-6)}\n` +
            `   Status: ${o.status}\n` +
            `   Amount: ₦${Number(o.totalAmount).toLocaleString()}`,
        )
        .join("\n\n");
      await sendTextMessage(phone, `📋 *Your Recent Orders*\n\n${list}`);
    }
    await showVendorMenu(phone, session);
  } else if (choice === "2") {
    // Mark as shipped
    session.step = "VENDOR_AWAITING_SHIP_ID";
    await saveSession(session);
    await sendTextMessage(
      phone,
      `🚚 Enter the *Order ID* to mark as shipped:\n\n_Reply *cancel* to go back_`,
    );
  } else if (choice === "3") {
    session.step = "VENDOR_AWAITING_DELIVERED_ID";
    await saveSession(session);
    await sendTextMessage(
      phone,
      `📬 Enter the *Order ID* to mark as *delivered* (buyer confirms next):\n\n_Reply *cancel* to go back_`,
    );
  } else if (choice === "4") {
    // View balance
    const vendor = (await Vendor.findById(session.vendorId).lean()) as any;
    if (vendor) {
      await sendTextMessage(phone, formatVendorBalance(vendor.balance));
    }
    await showVendorMenu(phone, session);
  } else if (choice === "5") {
    // Switch to buyer mode
    await clearPendingAction(phone);
    session.step = "AWAITING_INTENT";
    await saveSession(session);
    await sendTextMessage(
      phone,
      `🛍️ Switched to buyer mode!\n\nWhat are you looking for today?`,
    );
  } else {
    await sendTextMessage(
      phone,
      `Please reply with *1*–*5*.\n\n_Reply *cancel* to exit._`,
    );
  }
}

async function handleMarkShipped(
  phone: string,
  session: WhatsAppSession,
  orderId: string,
) {
  try {
    await OrderService.markShipped(orderId.trim(), session.vendorId!);

    session.step = "VENDOR_MENU";
    await saveSession(session);

    await sendTextMessage(
      phone,
      `✅ Order *#${orderId.slice(-6)}* marked as shipped!\n\nWhen the buyer receives it, use *Vendor menu → 3* to mark delivered (starts confirmation / auto-release window).`,
    );
    await showVendorMenu(phone, session);
  } catch (err: any) {
    console.error("Mark shipped error:", err?.message);
    await sendTextMessage(
      phone,
      `❌ ${err?.message || "Could not update order. Check the Order ID and try again."}`,
    );
  }
}

async function handleMarkDelivered(
  phone: string,
  session: WhatsAppSession,
  orderId: string,
) {
  try {
    await OrderService.markDelivered(orderId.trim(), session.vendorId!);

    session.step = "VENDOR_MENU";
    await saveSession(session);

    await sendTextMessage(
      phone,
      `✅ Order *#${orderId.slice(-6)}* marked as delivered — awaiting buyer confirmation.`,
    );
    await showVendorMenu(phone, session);
  } catch (err: any) {
    console.error("Mark delivered error:", err?.message);
    await sendTextMessage(
      phone,
      `❌ ${err?.message || "Could not update order. Ship first, then mark delivered."}`,
    );
  }
}

export default { verifyWebhook, handleIncomingMessage };

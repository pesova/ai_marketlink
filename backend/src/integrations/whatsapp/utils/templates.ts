export function formatProductList(products: any[]): string {
  const list = products
    .map(
      (p, i) =>
        `*${i + 1}.* ${p.name}\n` +
        `   💰 ₦${Number(p.price).toLocaleString()}\n`
    )
    .join('\n\n');

  return `🛍️ *Here's what I found:*\n\n${list}`;
}

const STATUS_EMOJI: Record<string, string> = {
  PENDING_PAYMENT: '⏳ Awaiting payment',
  PAID_IN_ESCROW: '🔒 Payment secured in escrow',
  SHIPPED: '🚚 On its way to you!',
  DELIVERED_PENDING_CONFIRMATION: '📦 Delivered — reply *confirm* to release payment',
  COMPLETED: '✅ Order complete',
  CANCELLED: '❌ Cancelled',
};

export function formatOrderStatus(order: any): string {
  const statusLabel = STATUS_EMOJI[order.status] ?? order.status;
  const product = order.product?.name ?? 'Product';
  const amount = Number(order.totalAmount).toLocaleString();

  return (
    `📋 *Latest Order*\n\n` +
    `Order ID: #${order._id.toString().slice(-6)}\n` +
    `Product: ${product}\n` +
    `Amount: ₦${amount}\n` +
    `Status: ${statusLabel}\n\n` +
    `_Reply *cancel* to start over_`
  );
}

export function formatVendorBalance(balance: { escrow: number; available: number }): string {
  return (
    `💰 *Your Balance*\n\n` +
    `🔒 In Escrow: ₦${Number(balance?.escrow ?? 0).toLocaleString()}\n` +
    `✅ Available: ₦${Number(balance?.available ?? 0).toLocaleString()}`
  );
}
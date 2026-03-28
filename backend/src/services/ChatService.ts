import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Types } from "mongoose";
import env from "../config/env";
import { ChatHistory } from "../models/ChatHistory";
import { ChatSession, IChatSession } from "../models/ChatSession";
import VectorService from "../infrastructure/vector/VectorService";

const SUMMARY_THRESHOLD = 10;

const llm = new ChatOpenAI({
  apiKey: env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
  temperature: 0.7,
});

const summaryLlm = new ChatOpenAI({
  apiKey: env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
  temperature: 0,
});

class ChatService {
  /**
   * Retrieve or create a chat session for a user.
   */
  private async getOrCreateSession(
    userId: Types.ObjectId,
  ): Promise<IChatSession> {
    let session = await ChatSession.findOne({ userId });
    const now = new Date();
    if (session) {
      const ageMs = now.getTime() - session.createdAt.getTime();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      if (ageMs > ONE_DAY_MS) {
        await this.archiveSession(session);
        session = await ChatSession.create({
          userId,
          messages: [],
          summary: null,
        });
      } else {
        console.log(
          "Found existing ChatSession for user",
          userId.toString(),
          "Message count:",
          session.messages.length,
        );
      }
    } else {
      session = await ChatSession.create({
        userId,
        messages: [],
        summary: null,
      });
    }
    return session;
  }

  /** Summarize the conversation when it reaches the threshold. */
  private async summarizeSession(session: IChatSession): Promise<IChatSession> {
    const conversationText = session.messages
      .map((msg) =>
        msg.role === "user"
          ? `Buyer: ${msg.content}`
          : `Assistant: ${msg.content}`,
      )
      .join("\n");
    const prompt = `Summarize this shopping conversation in 2-3 sentences, focusing on what the buyer is looking for:\n\n${conversationText}`;

    const summaryResponse = await summaryLlm.invoke([
      new SystemMessage(
        "You are a helpful assistant that summarizes conversations concisely.",
      ),
      new HumanMessage(prompt),
    ]);
    session.summary = (summaryResponse as any).content;
    // Archive existing messages before clearing
    await this.archiveSession(session);
    session.messages = [];
    await session.save();
    return session;
  }

  /** Archive old session messages into ChatHistory */
  private async archiveSession(session: IChatSession): Promise<void> {
    const { userId, messages } = session;
    const toStore = [...messages]; // only user and assistant messages

    await ChatHistory.updateOne(
      { userId },
      { $push: { messages: { $each: toStore } } },
      { upsert: true },
    );
  }

  /**
   * MVP: structured filters for backend ranking (§7) — best-effort JSON from the user message.
   */
  private async extractPurchaseFilters(userMessage: string): Promise<{
    product?: string | null;
    max_price?: number | null;
    color?: string | null;
    category?: string | null;
    location?: string | null;
  } | null> {
    try {
      const r = await summaryLlm.invoke([
        new SystemMessage(
          `You extract shopping search filters for a Nigerian marketplace. Respond with ONLY a JSON object, no markdown, keys:
{"product": string or null, "max_price": number or null, "color": string or null, "category": string or null, "location": string or null}
max_price is in Nigerian Naira (numeric). Use null when unknown.`,
        ),
        new HumanMessage(userMessage),
      ]);
      const text = String((r as any).content ?? "").trim();
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/,"");
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  // Simple intent detection for purchase queries
  private isPurchaseIntent(message: string): boolean {
    const keywords = [
      "buy",
      "purchase",
      "order",
      "price",
      "cost",
      "how much",
      "want",
      "need",
      "looking for",
      "show me",
    ];
    const lower = message.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  }

  /** Main chat interaction */
  public async chat(userId: string, userMessage: string) {
    const objId = new Types.ObjectId(userId);
    let session = await this.getOrCreateSession(objId);

    if (session.messages.length >= SUMMARY_THRESHOLD) {
      session = await this.summarizeSession(session);
    }

    // Determine if the user is asking about a product
    const intent = this.isPurchaseIntent(userMessage);
    let products: any[] = [];
    let productContext = "";
    if (intent) {
      const filters = await this.extractPurchaseFilters(userMessage);
      const searchText = [
        filters?.product,
        filters?.color,
        filters?.category,
        filters?.location,
        userMessage,
      ]
        .filter(Boolean)
        .join(" ");
      products = await VectorService.searchProducts(searchText, 8);
      if (filters?.max_price != null && typeof filters.max_price === "number") {
        products = products.filter((p: any) => Number(p.price) <= filters.max_price!);
      }
      if (
        filters?.color &&
        typeof filters.color === "string" &&
        filters.color.length > 1
      ) {
        const c = filters.color.toLowerCase();
        products = products.filter((p: any) => {
          const blob = `${p.name ?? ""} ${p.description ?? ""}`.toLowerCase();
          return blob.includes(c);
        });
      }
      productContext =
        products && products.length > 0
          ? products
              .map(
                (p: any, i: number) =>
                  `${i + 1}. ${p.name} — ₦${p.price} — ${p.category} — ${p.description}`,
              )
              .join("\n")
          : "No matching products found.";
    }

    // Build system message
    const systemParts = [];
    systemParts.push(
      `You are AI MarketLink's friendly shopping assistant.

        Your primary goal is to help users discover and buy products easily.

        CORE BEHAVIOR:
        - You can answer general questions and engage in normal conversation.
        - ALWAYS answer the user's question clearly and helpfully first, no matter the topic.
        - However, you should naturally guide the conversation back to helping the user find, compare, or buy products — but ONLY when it feels relevant or not forced..

        CRITICAL RULES — follow these strictly:
        1. You ALWAYS have access to real product listings. NEVER say products are unavailable, out of stock, or not found unless the Product Context below explicitly contains "No matching products found."
        2. When products are listed in the Product Context, present them enthusiastically with name, price, and a short description.
        3. Do NOT make up products. Only reference what is in the Product Context.
        4. If the user asks something unrelated (e.g. jokes, life advice, random topics), respond briefly but then smoothly steer the conversation back to shopping or ask if they are looking for any product.
        5. Keep tone conversational, warm, and helpful — like a smart, friendly Nigerian market vendor.
        6. Avoid long off-topic discussions. Keep non-shopping responses short and redirect.

        EXAMPLES OF REDIRECTION:
        - "Haha, that's funny 😄 By the way, are you looking for anything to buy today?"
        - "I can help with that! Also, if you need any products, I can find the best options for you."
        - "Nice question! While you're here, I can also help you get great deals on anything you need."

        Remember: You are not just a chatbot — you are a shopping assistant focused on helping users find products.`,
    );

    if (session.summary) {
      systemParts.push(`Previous conversation summary: ${session.summary}`);
    }
    if (intent) {
      systemParts.push(
        products && products.length > 0
          ? `AVAILABLE PRODUCTS (these are real listings — present them to the buyer):\n${productContext}`
          : `Product Context: No matching products found.`,
      );
    }
    const systemMessage = new SystemMessage(systemParts.join("\n\n"));
    const priorMessages = session.messages.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );

    const userHuman = new HumanMessage(userMessage);
    const llmMessages = [systemMessage, ...priorMessages, userHuman];

    const assistantResponse = await llm.invoke(llmMessages);

    // Store both user and assistant messages
    const now = new Date();
    session.messages.push({
      role: "user",
      content: userMessage,
      createdAt: now,
    });
    session.messages.push({
      role: "assistant",
      content: (assistantResponse as any).content,
      createdAt: now,
    });
    await session.save();
    // Also persist to ChatHistory
    await ChatHistory.updateOne(
      { userId: objId },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: userMessage, createdAt: now },
              {
                role: "assistant",
                content: (assistantResponse as any).content,
                createdAt: now,
              },
            ],
          },
        },
      },
      { upsert: true },
    );

    return {
      message: (assistantResponse as any).content,
      products,
      sessionId: session._id.toString(),
    };
  }

  public async getHistory(userId: string) {
    const session = await ChatSession.findOne({ userId });
    const historyDoc = await ChatHistory.findOne({ userId });
    const pastMessages = historyDoc ? historyDoc.messages : [];
    if (!session) {
      return { messages: pastMessages, summary: null };
    }
    return {
      messages: [...pastMessages, ...session.messages],
      summary: session.summary,
    };
  }

  /** Clear chat history */
  public async clearHistory(userId: string) {
    await ChatSession.findOneAndUpdate(
      { userId },
      { $set: { messages: [], summary: null } },
    );
    await ChatHistory.deleteMany({ userId });
  }
}

export default new ChatService();

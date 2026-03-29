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
          `You extract shopping search filters for buyers using a chat-only product assistant in Nigeria. Respond with ONLY a JSON object, no markdown, keys:
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
          : "";
    }

    const authorizedListingsBlock =
      products.length > 0
        ? productContext
        : "None. For this reply there are zero seller listings you are allowed to cite.";

    // Build system message
    const systemParts = [];
    systemParts.push(
      `You are AI MarketLink's friendly shopping assistant. Users discover products ONLY through this chat — there is no separate catalog, browse screen, or marketplace UI to visit.

        CATALOG BOUNDARY (non-negotiable on every message):
        - You work ONLY from seller inventory returned for this chat turn (see AUTHORIZED LISTINGS). You must NEVER name, price, compare, recommend, or describe specific commercial products, brands, models, shops, or deals except by copying details from AUTHORIZED LISTINGS below.
        - Do NOT use the open web, training data, or "general knowledge" to suggest or invent products. If a product is not in AUTHORIZED LISTINGS, it does not exist for you.
        - If AUTHORIZED LISTINGS is "None" or empty: for shopping or product questions, say you don't have matching listings right now and invite them to describe what they need differently in chat (e.g. product type, budget in naira, color, use case). Do NOT tell them to browse, open a shop, or search elsewhere in the app — that does not exist. Give zero example product names, brands, or prices. You may still chat about non-shopping topics without naming products to sell.
        - Conversation history and summaries are context only; they do NOT add products. Only AUTHORIZED LISTINGS may be quoted for items for sale.
        - When listings are present, you may present them with name, price (₦), and short description taken only from those lines.

        Tone: warm, conversational Nigerian market vendor energy. Keep off-topic replies brief; you may gently invite them to keep chatting and say what they're looking for, without claiming you can suggest items outside AUTHORIZED LISTINGS.`,
    );

    if (session.summary) {
      systemParts.push(`Previous conversation summary: ${session.summary}`);
    }

    systemParts.push(
      `AUTHORIZED LISTINGS (the ONLY items you may mention; each numbered line is one seller listing):\n${authorizedListingsBlock}`,
    );

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

  /**
   * Append a single assistant line (e.g. payment confirmed) without invoking the LLM.
   * Keeps ChatSession + ChatHistory in sync with normal chat.
   */
  public async appendAssistantMessage(userId: string, content: string): Promise<void> {
    const objId = new Types.ObjectId(userId);
    let session = await ChatSession.findOne({ userId: objId });
    const now = new Date();
    const entry = { role: "assistant" as const, content, createdAt: now };

    if (!session) {
      session = await ChatSession.create({
        userId: objId,
        messages: [entry],
        summary: null,
      });
    } else {
      session.messages.push(entry);
      await session.save();
    }

    await ChatHistory.updateOne(
      { userId: objId },
      { $push: { messages: entry } },
      { upsert: true },
    );
  }
}

export default new ChatService();

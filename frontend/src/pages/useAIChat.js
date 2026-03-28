// useAIChat.js — AI MarketLink
// Uses real backend chat API + real products from backend
import { useState, useCallback, useRef } from "react";
import { chatAPI, productsAPI, isLoggedIn } from "../utils/api";

/* ── Category detector for mock fallback ── */
const detectCategory = (text) => {
  const t = (text || "").toLowerCase();
  if (t.match(/phone|samsung|iphone|tecno|infinix|mobile|handset/)) return "Phones & Accessories";
  if (t.match(/dress|cloth|ankara|fashion|wear|shirt|trouser|blouse/)) return "Fashion & Clothing";
  if (t.match(/laptop|computer|earbuds|speaker|tv|television/)) return "Electronics";
  if (t.match(/food|tomato|groceries|rice|vegetable|pepper|yam/)) return "Food & Groceries";
  if (t.match(/beauty|skin|cream|shea|lotion|makeup|hair/)) return "Beauty & Health";
  if (t.match(/baby|kid|child|infant|diaper/)) return "Baby & Kids";
  if (t.match(/car|auto|vehicle|engine|tyre/)) return "Automobile Parts";
  if (t.match(/chair|furniture|sofa|bed|table/)) return "Home & Furniture";
  return null;
};

const extractPrice = (text) => {
  const t = (text || "").toLowerCase();
  const kMatch = t.match(/(\d+)\s*k\b/);
  if (kMatch) return parseInt(kMatch[1]) * 1000;
  const mMatch = t.match(/(\d+)\s*m\b/);
  if (mMatch) return parseInt(mMatch[1]) * 1000000;
  const underMatch = t.match(/under\s*[₦#]?\s*(\d[\d,]+)/);
  if (underMatch) return parseInt(underMatch[1].replace(/,/g, ""));
  return null;
};

/* ── Mock fallback ── */
const mockFallback = (userText, allMessages) => {
  const lower = (userText || "").toLowerCase().trim();
  const isGreeting = allMessages.filter(m => m.from === "user").length === 0 ||
    ["hi","hello","hey","good morning","good afternoon","yo","sup"].includes(lower);

  if (isGreeting) {
    return {
      message: "Hey! 👋 Welcome to AI MarketLink. I'm Markie, your shopping assistant. What are you looking to buy today?",
      intent: "greeting", readyToShow: false, filters: {},
      suggestions: ["I need a phone", "Show me fashion", "Food & groceries", "Something for my home"],
    };
  }

  let category = detectCategory(userText);
  let maxPrice  = extractPrice(userText);

  if (!category || !maxPrice) {
    for (const msg of [...allMessages].reverse()) {
      if (!category) category = detectCategory(msg.text || "") || msg.filters?.category || null;
      if (!maxPrice) maxPrice = extractPrice(msg.text || "") || msg.filters?.maxPrice || null;
      if (category && maxPrice) break;
    }
  }

  if (category && !maxPrice) {
    return {
      message: `What's your budget for ${category.toLowerCase()}?`,
      intent: "clarify_budget", readyToShow: false, filters: { category },
      suggestions: ["Under ₦10,000", "Under ₦50,000", "Under ₦100,000", "Above ₦100,000"],
    };
  }

  if (category && maxPrice) {
    return {
      message: `Here are the best ${category.toLowerCase()} under ₦${maxPrice.toLocaleString()} from verified vendors. All purchases are escrow-protected! 🛡️`,
      intent: "show_products", readyToShow: true, filters: { category, maxPrice },
      suggestions: ["Show me cheaper", "Different category?", "How does escrow work?"],
    };
  }

  return {
    message: "What are you looking to buy today?",
    intent: "clarify_product", readyToShow: false, filters: {},
    suggestions: ["Phones & Accessories", "Fashion & Clothing", "Electronics", "Food & Groceries"],
  };
};

/* ── Fetch real products from backend ── */
const fetchRealProducts = async (filters = {}) => {
  try {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.maxPrice)  params.maxPrice  = filters.maxPrice;
    if (filters.minPrice)  params.minPrice  = filters.minPrice;
    if (filters.query)     params.q         = filters.query;

    // Use search if we have a query, otherwise getAll with filters
    let data;
    if (filters.query) {
      data = await productsAPI.search(filters.query, 20);
    } else {
      data = await productsAPI.getAll(params);
    }

    // Backend returns { success: true, data: { products: [...], total: N } }
    // or { success: true, data: [...] }
    const products = data.data?.products || data.data || [];
    return Array.isArray(products) ? products : [];
  } catch {
    return []; // Fall back to mock products if API fails
  }
};

/* ── Mock products fallback ── */
const MOCK_PRODUCTS = [
  { id:1,  name:"Samsung Galaxy A55",   category:"Phones & Accessories", price:285000, vendor:"TechZone Lagos",  rating:4.7, reviews:128, stock:5,  description:"6.6\" AMOLED, 50MP camera, 5000mAh battery." },
  { id:2,  name:"Ankara Midi Dress",    category:"Fashion & Clothing",   price:12500,  vendor:"Adaeze Styles",  rating:4.9, reviews:87,  stock:12, description:"Hand-crafted Ankara fabric." },
  { id:3,  name:"Wireless Earbuds Pro", category:"Electronics",          price:18000,  vendor:"GadgetHub NG",   rating:4.5, reviews:203, stock:8,  description:"ANC, 30hr battery." },
  { id:4,  name:"Shea Butter Set",      category:"Beauty & Health",      price:4500,   vendor:"NaturalGlow",    rating:5.0, reviews:64,  stock:20, description:"100% pure shea butter." },
  { id:5,  name:"Ergonomic Chair",      category:"Home & Furniture",     price:65000,  vendor:"FurnishPro",     rating:4.3, reviews:41,  stock:3,  description:"Lumbar support." },
  { id:6,  name:"iPhone 14 Pro",        category:"Phones & Accessories", price:850000, vendor:"iStore Abuja",   rating:4.8, reviews:312, stock:2,  description:"48MP, A16 Bionic." },
  { id:7,  name:"Fresh Tomatoes (5kg)", category:"Food & Groceries",     price:3200,   vendor:"FarmDirect",     rating:4.6, reviews:55,  stock:50, description:"Fresh from Plateau State." },
  { id:8,  name:"HP Laptop 14\"",       category:"Electronics",          price:320000, vendor:"LaptopWorld",    rating:4.4, reviews:91,  stock:6,  description:"i5, 8GB RAM, 256GB SSD." },
  { id:9,  name:"Baby Feeding Set",     category:"Baby & Kids",          price:8500,   vendor:"TinyTots",       rating:4.8, reviews:76,  stock:15, description:"BPA-free bottles." },
  { id:10, name:"Car Engine Oil 5L",    category:"Automobile Parts",     price:22000,  vendor:"AutoParts NG",   rating:4.5, reviews:38,  stock:25, description:"Full synthetic 5W-30." },
];

/* ── Filter mock products ── */
const filterMockProducts = (filters, userText) => {
  let results = MOCK_PRODUCTS.filter(p => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.maxPrice  && p.price > filters.maxPrice)     return false;
    if (filters.minPrice  && p.price < filters.minPrice)     return false;
    return true;
  });
  if (!results.length) {
    const words = (userText || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
    results = MOCK_PRODUCTS.filter(p =>
      words.some(w => p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w))
    );
  }
  return results;
};

export function useAIChat() {
  const [messages, setMessages] = useState([{
    id: 1, from: "ai",
    text: "Hey! 👋 Welcome to AI MarketLink. I'm Markie, your shopping assistant. What are you looking to buy today?",
    suggestions: ["I need a phone", "Show me fashion", "Food & groceries", "Something for my home"],
    products: [], filters: {},
  }]);
  const [isTyping, setIsTyping]   = useState(false);
  const [error, setError]         = useState(null);
  const messagesRef               = useRef(messages);
  messagesRef.current             = messages;

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isTyping) return;

    const userMsg = { id: Date.now(), from: "user", text: userText, products: [], suggestions: [], filters: {} };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    const currentMessages = [...messagesRef.current, userMsg];

    let aiText = "";
    let filters = {};
    let readyToShow = false;
    let suggestions = [];

    try {
      if (isLoggedIn()) {
        // ── Use real backend chat API ──
        const res = await chatAPI.sendMessage(userText);
        // Backend returns { success: true, data: { message, products, filters } }
        const chatData = res.data || res;
        aiText      = chatData.message || chatData.reply || chatData.text || "";
        filters     = chatData.filters || {};
        readyToShow = !!(chatData.products?.length > 0 || chatData.showProducts);
        suggestions = chatData.suggestions || [];

        // If backend returned products directly, use them
        if (chatData.products?.length > 0) {
          const aiMsg = {
            id: Date.now() + 1, from: "ai",
            text: aiText,
            rawResponse: JSON.stringify(res),
            suggestions,
            products: chatData.products,
            filters,
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      } else {
        // ── Not logged in: use mock fallback ──
        const parsed = mockFallback(userText, currentMessages);
        aiText      = parsed.message;
        filters     = parsed.filters || {};
        readyToShow = parsed.readyToShow;
        suggestions = parsed.suggestions || [];
      }
    } catch {
      // API failed — use mock
      const parsed = mockFallback(userText, currentMessages);
      aiText      = parsed.message;
      filters     = parsed.filters || {};
      readyToShow = parsed.readyToShow;
      suggestions = parsed.suggestions || [];
    }

    // Fetch real products if ready to show
    let products = [];
    if (readyToShow) {
      products = await fetchRealProducts(filters);
      if (!products.length) {
        products = filterMockProducts(filters, userText);
      }
    }

    setMessages(prev => [...prev, {
      id: Date.now() + 1, from: "ai",
      text: aiText,
      suggestions,
      products,
      filters,
    }]);

    setIsTyping(false);
  }, [isTyping]);

  const clearChat = () => {
    setMessages([{
      id: 1, from: "ai",
      text: "Hey! 👋 Chat cleared. What are you looking to buy today?",
      suggestions: ["I need a phone", "Show me fashion", "Food & groceries", "Something for my home"],
      products: [], filters: {},
    }]);
    setError(null);
  };

  return { messages, isTyping, error, sendMessage, clearChat };
}
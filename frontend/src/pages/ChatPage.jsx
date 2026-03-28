import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";
import ProductDetailModal from "./ProductDetailModal";
import { sendChatMessage, getHistory, clearHistory } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import { fetchProductById } from "../services/productService";

/* ── Icons ── */
const IconSend     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
const IconBot      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="13" rx="3"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/><circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none"/><path d="M9 18h6"/></svg>);
const IconOrders   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>);
const IconPackage  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconExpand   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>);
const IconRefresh  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconTrash    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>);
const IconX        = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconMic      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>);
const IconAttach   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);

const SUGGESTIONS = [
  "I need a phone under ₦50,000",
  "Show me Ankara fashion",
  "Laptop for school under ₦300k",
  "Skin care products",
  "Fresh food delivery",
  "Baby items",
];

/* ── Fallback color palette for products without images ── */
const FALLBACK_COLORS = ["#d4a017","#4ade80","#60a5fa","#f472b6","#a78bfa","#34d399"];
const getFallbackColor = (id) => FALLBACK_COLORS[(id?.charCodeAt(0) ?? 0) % FALLBACK_COLORS.length];

/* ── Product card inline in chat ── */
const ChatProduct = ({ p, onView, busy }) => {
  const [imgError, setImgError] = useState(false);
  const fallbackColor = getFallbackColor(p._id || p.id);

  return (
    <div
      className={`cp-inline-card${busy ? " cp-inline-card--busy" : ""}`}
      onClick={() => !busy && onView(p)}
      style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
    >
      <div className="cp-inline-card__img" style={!p.imageUrl || imgError ? { background: `${fallbackColor}18` } : {}}>
        {p.imageUrl && !imgError ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
          />
        ) : (
          <span style={{ color: fallbackColor }}><IconPackage /></span>
        )}
      </div>
      <div className="cp-inline-card__info">
        <div className="cp-inline-card__name">{p.name}</div>
        <div className="cp-inline-card__price">₦{Number(p.price).toLocaleString()}</div>
        {(typeof p.vendor === "string" && p.vendor) || (p.vendor?.businessName) ? (
          <div className="cp-inline-card__vendor">
            {typeof p.vendor === "string" ? p.vendor : (p.vendor?.businessName || "")}
          </div>
        ) : p.category ? (
          <div className="cp-inline-card__vendor" style={{ textTransform: "capitalize" }}>{p.category}</div>
        ) : null}
      </div>
      <div className="cp-inline-card__arrow">→</div>
    </div>
  );
};

/* ── Network Background ── */
const NetworkBg = () => (
  <svg className="cp-bg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
    <g stroke="#4ade80" strokeWidth="0.5" opacity="0.15">
      <line x1="200" y1="150" x2="450" y2="200"/><line x1="450" y1="200" x2="680" y2="160"/>
      <line x1="680" y1="160" x2="900" y2="220"/><line x1="900" y1="220" x2="1150" y2="180"/>
      <line x1="200" y1="150" x2="180" y2="380"/><line x1="450" y1="200" x2="420" y2="400"/>
      <line x1="700" y1="380" x2="920" y2="420"/><line x1="920" y1="420" x2="1180" y2="400"/>
      <line x1="300" y1="550" x2="600" y2="520"/><line x1="600" y1="520" x2="850" y2="560"/>
    </g>
    <g fill="#4ade80" opacity="0.3">
      {[[200,150],[450,200],[680,160],[900,220],[1150,180],[420,400],[700,380],[920,420],[300,550],[600,520],[850,560]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2"/>
      ))}
    </g>
  </svg>
);

/* ── Bot Avatar small ── */
const BotAvatarSm = () => (
  <div className="cp-bot-avatar">
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#1e2530"/>
      <circle cx="20" cy="16" r="8" fill="#2a3140"/>
      <path d="M8 38c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#2a3140"/>
      <circle cx="16" cy="15" r="1.8" fill="#e5e7eb"/>
      <circle cx="24" cy="15" r="1.8" fill="#e5e7eb"/>
      <path d="M16 19 Q20 22 24 19" stroke="#e5e7eb" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
    <div className="cp-bot-avatar__dot"/>
  </div>
);

/* ── Utility: build message objects from raw history entries ── */
let _msgIdCounter = 0;
const newId = () => `msg_${++_msgIdCounter}_${Date.now()}`;

const buildMessagesFromHistory = (historyItems) => {
  // Pair up user+assistant messages so products can be attached to assistant messages
  const msgs = [];
  for (let i = 0; i < historyItems.length; i++) {
    const item = historyItems[i];
    if (item.role === "user") {
      msgs.push({ id: newId(), from: "user", text: item.content });
    } else {
      msgs.push({
        id: newId(),
        from: "ai",
        text: item.content,
        products: [], // History API doesn't return products per message
        suggestions: [],
      });
    }
  }
  return msgs;
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [messages, setMessages]     = useState([]);
  const [isTyping, setIsTyping]     = useState(false);
  const [error, setError]           = useState("");
  const [input, setInput]           = useState("");
  const [selected, setSelected]     = useState(null);
  const [productFetchLoading, setProductFetchLoading] = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef              = useRef(null);
  const inputRef                    = useRef(null);

  /* ── Load chat history on mount ── */
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await getHistory();
        if (res?.success && res?.data?.messages?.length > 0) {
          const last50 = res.data.messages.slice(-50);
          const builtMessages = buildMessagesFromHistory(last50);
          setMessages(builtMessages);
        } else {
          // No history — show welcome message
          setMessages([{
            id: newId(),
            from: "ai",
            text: "👋 Hi! I'm MarketLink AI. Tell me what you're looking for and I'll find the best products for you.",
            products: [],
            suggestions: [],
          }]);
        }
      } catch {
        // On history load failure, just show welcome message silently
        setMessages([{
          id: newId(),
          from: "ai",
          text: "👋 Hi! I'm MarketLink AI. Tell me what you're looking for and I'll find the best products for you.",
          products: [],
          suggestions: [],
        }]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    setError("");

    // Optimistically add user message
    const userMsg = { id: newId(), from: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await sendChatMessage(text);

      if (res?.success && res?.data) {
        const { message, products = [] } = res.data;

        const aiMsg = {
          id: newId(),
          from: "ai",
          text: message || "Here are some results for you.",
          products: products, // May be empty array — handled in render
          suggestions: [],
        };

        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: newId(),
          from: "ai",
          text: "Sorry, something went wrong. Please try again.",
          products: [],
          suggestions: [],
        },
      ]);
      setError("");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = async () => {
    setError("");
    try {
      await clearHistory();
      setMessages([{
        id: newId(),
        from: "ai",
        text: "👋 Hi! I'm MarketLink AI. Tell me what you're looking for and I'll find the best products for you.",
        products: [],
        suggestions: [],
      }]);
    } catch {
      setError("Could not clear chat. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const isFirstLoad = messages.length <= 1;

  const openProductFromChat = async (p) => {
    const raw = p?._id ?? p?.id;
    const idStr = raw != null ? String(raw) : "";
    if (!idStr) return;
    setProductFetchLoading(true);
    try {
      const full = await fetchProductById(idStr);
      setSelected(full);
    } catch {
      setSelected(p);
    } finally {
      setProductFetchLoading(false);
    }
  };

  return (
    <div className="cp-root">
      <NetworkBg />

      {/* ── TOPBAR ── */}
      <header className="cp-topbar">
        <button className="cp-topbar__logo" onClick={() => navigate("/")}>
          <span className="cp-logo-ai">AI</span>
          <span className="cp-logo-name">MarketLink</span>
        </button>
        <div className="cp-topbar__right">
          <button className="cp-logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <button type="button" className="cp-cart-btn" title="My orders" onClick={() => navigate("/orders")}>
            <IconOrders />
          </button>
        </div>
      </header>

      {/* ── CHAT PANEL ── */}
      <main className="cp-main">
        <div className={`cp-panel${expanded ? " expanded" : ""}`}>

          {/* Panel Header */}
          <div className="cp-panel__header">
            <BotAvatarSm />
            <div className="cp-panel__info">
              <div className="cp-panel__name">MarketLink AI</div>
              <div className="cp-panel__sub">Offshore Shopping Expert</div>
            </div>
            <div className="cp-panel__actions">
              <button className="cp-hdr-btn" title="Expand" onClick={() => setExpanded(e => !e)}>
                <IconExpand />
                <span>Expand</span>
              </button>
              <button className="cp-hdr-btn" title="Clear chat" onClick={clearChat}>
                <IconTrash />
                <span>Clear</span>
              </button>
              <button className="cp-hdr-btn" title="Restart" onClick={clearChat}>
                <IconRefresh />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="cp-messages">
            {/* History loading skeleton */}
            {historyLoading && (
              <div className="cp-msg cp-msg--ai">
                <BotAvatarSm />
                <div className="cp-msg__content">
                  <div className="cp-msg__bubble cp-msg__bubble--typing">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}

            {!historyLoading && messages.map(msg => (
              <div key={msg.id} className={`cp-msg cp-msg--${msg.from}`}>
                {msg.from === "ai" && <BotAvatarSm />}
                <div className="cp-msg__content">
                  <div className="cp-msg__bubble">{msg.text}</div>

                  {/* Inline product cards — only shown when products array is non-empty */}
                  {msg.from === "ai" && msg.products?.length > 0 && (
                    <div className="cp-msg__products">
                      {msg.products.slice(0, 4).map(p => (
                        <ChatProduct key={p._id || p.id} p={p} onView={openProductFromChat} busy={productFetchLoading} />
                      ))}
                      {msg.products.length > 4 && (
                        <div className="cp-msg__more">+{msg.products.length - 4} more products found</div>
                      )}
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {msg.from === "ai" && msg.suggestions?.length > 0 && (
                    <div className="cp-msg__chips">
                      {msg.suggestions.map((s, i) => (
                        <button key={i} className="cp-chip"
                          onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="cp-msg cp-msg--ai">
                <BotAvatarSm />
                <div className="cp-msg__content">
                  <div className="cp-msg__bubble cp-msg__bubble--typing">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="cp-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (first load only) */}
          {!historyLoading && isFirstLoad && (
            <div className="cp-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="cp-suggestion"
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="cp-input-area">
            <button className="cp-input-btn" title="Attach"><IconAttach /></button>
            <input
              ref={inputRef}
              className="cp-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your message..."
              disabled={isTyping || historyLoading}
            />
            <button
              className={`cp-send-btn${input.trim() && !isTyping ? " active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim() || isTyping || historyLoading}
            >
              <IconSend />
            </button>
          </div>
          <p className="cp-disclaimer">
            MarketLink AI is an AI assistant. Responses are informational — not financial or legal advice.
          </p>
        </div>
      </main>

      {productFetchLoading && (
        <div className="cp-toast cp-toast--subtle" role="status">Loading product details…</div>
      )}

      {/* Product detail + buy (order + payment redirect) */}
      <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
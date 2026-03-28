import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ordersAPI, isLoggedIn } from "../utils/api";

/* ── Icons ── */
const IconArrowLeft  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const IconPackage    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconShield     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/><polyline points="9 12 11 14 15 10"/></svg>);
const IconCheck      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>);
const IconLoader     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const IconSearch     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconEye        = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);

const STATUS_MAP = {
  PENDING_PAYMENT:              { label:"Awaiting Payment", color:"#6b7280", bg:"rgba(107,114,128,.12)" },
  PAID_IN_ESCROW:               { label:"In Escrow",        color:"#d4a017", bg:"rgba(212,160,23,.12)"  },
  SHIPPED:                      { label:"Shipped",          color:"#60a5fa", bg:"rgba(96,165,250,.12)"  },
  DELIVERED_PENDING_CONFIRMATION:{ label:"Confirm Delivery",color:"#a78bfa", bg:"rgba(167,139,250,.12)" },
  COMPLETED:                    { label:"Completed",        color:"#4ade80", bg:"rgba(74,222,128,.12)"  },
  CANCELLED:                    { label:"Cancelled",        color:"#f87171", bg:"rgba(248,113,113,.12)" },
};

const MOCK_ORDERS = [
  { _id:"ORD-001", product:{ name:"Samsung Galaxy A55", imageUrl:null }, vendor:{ businessName:"TechZone Lagos" }, amount:285000, status:"SHIPPED",        createdAt:"2026-03-20T10:00:00Z" },
  { _id:"ORD-002", product:{ name:"Ankara Midi Dress",  imageUrl:null }, vendor:{ businessName:"Adaeze Styles"  }, amount:12500,  status:"PAID_IN_ESCROW", createdAt:"2026-03-19T14:00:00Z" },
  { _id:"ORD-003", product:{ name:"Shea Butter Set",    imageUrl:null }, vendor:{ businessName:"NaturalGlow"    }, amount:4500,   status:"COMPLETED",      createdAt:"2026-03-15T09:00:00Z" },
  { _id:"ORD-004", product:{ name:"HP Laptop 14\"",     imageUrl:null }, vendor:{ businessName:"LaptopWorld"    }, amount:320000, status:"DELIVERED_PENDING_CONFIRMATION", createdAt:"2026-03-18T16:00:00Z" },
];

export default function BuyerOrders() {
  const navigate              = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast]     = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordersAPI.getBuyerOrders();
        setOrders(data.data?.orders || data.data || MOCK_ORDERS);
      } catch {
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleConfirmDelivery = async (orderId) => {
    setConfirming(orderId);
    try {
      await ordersAPI.confirmDelivery(orderId);
      setOrders(os => os.map(o => o._id === orderId ? { ...o, status:"COMPLETED" } : o));
      showToast("Delivery confirmed! Funds released to vendor.");
    } catch {
      showToast("Failed to confirm. Please try again.");
    } finally {
      setConfirming(null);
    }
  };

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

  const S = {
    root: { minHeight:"100vh", background:"#13171e", color:"#f0f4f8", fontFamily:"'DM Sans',sans-serif" },
    topbar: { display:"flex", alignItems:"center", gap:"12px", padding:"16px 24px", borderBottom:"1px solid rgba(255,255,255,.06)", background:"rgba(0,0,0,.3)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:50 },
    back: { background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:"8px", width:"34px", height:"34px", display:"flex", alignItems:"center", justifyContent:"center", color:"#f0f4f8", cursor:"pointer" },
    logoAI: { fontWeight:800, fontSize:".88rem", background:"linear-gradient(135deg,#d4a017,#f0bc2e)", color:"#0a2e1a", padding:"2px 8px", borderRadius:"5px", fontFamily:"'Syne',sans-serif" },
    logoName: { fontWeight:700, fontSize:".9rem", color:"#f0f4f8", fontFamily:"'Syne',sans-serif" },
    title: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"1rem", color:"#f0f4f8", marginLeft:"8px" },
    content: { maxWidth:"800px", margin:"0 auto", padding:"28px 20px" },
    filters: { display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap" },
    filterBtn: (active) => ({ padding:"6px 14px", borderRadius:"50px", border:`1px solid ${active?"rgba(212,160,23,.4)":"rgba(255,255,255,.1)"}`, background:active?"rgba(212,160,23,.12)":"transparent", color:active?"#d4a017":"#9ca3af", fontSize:".75rem", fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }),
    card: { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"12px", padding:"16px", marginBottom:"10px", display:"flex", alignItems:"center", gap:"14px", cursor:"pointer", transition:"all .2s ease" },
    img: (color) => ({ width:"48px", height:"48px", borderRadius:"10px", background:color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"rgba(255,255,255,.6)" }),
    orderInfo: { flex:1, minWidth:0 },
    orderName: { fontWeight:600, fontSize:".88rem", color:"#f0f4f8", marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
    orderMeta: { fontSize:".74rem", color:"#6b7280", marginBottom:"4px" },
    orderAmount: { fontSize:".85rem", fontWeight:700, color:"#4ade80" },
    badge: (status) => ({ display:"inline-block", fontSize:".65rem", fontWeight:700, padding:"2px 9px", borderRadius:"50px", background:STATUS_MAP[status]?.bg||"rgba(107,114,128,.12)", color:STATUS_MAP[status]?.color||"#9ca3af", whiteSpace:"nowrap" }),
    confirmBtn: { display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", borderRadius:"8px", border:"none", background:"linear-gradient(135deg,#d4a017,#f0bc2e)", color:"#0a2e1a", fontSize:".75rem", fontWeight:700, cursor:"pointer", flexShrink:0, fontFamily:"'DM Sans',sans-serif" },
    viewBtn: { display:"flex", alignItems:"center", gap:"5px", padding:"7px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#9ca3af", fontSize:".75rem", cursor:"pointer", flexShrink:0, fontFamily:"'DM Sans',sans-serif" },
    empty: { textAlign:"center", padding:"60px 20px", color:"#6b7280" },
    toast: { position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:"#1a1f28", border:"1px solid rgba(255,255,255,.12)", color:"#f0f4f8", padding:"10px 18px", borderRadius:"9px", fontSize:".82rem", fontWeight:500, zIndex:200, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"7px", boxShadow:"0 8px 24px rgba(0,0,0,.4)" },
  };

  const colors = ["rgba(212,160,23,.15)","rgba(74,222,128,.15)","rgba(96,165,250,.15)","rgba(167,139,250,.15)","rgba(248,113,113,.15)"];

  return (
    <div style={S.root}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      <header style={S.topbar}>
        <button style={S.back} onClick={() => navigate("/chat")}><IconArrowLeft /></button>
        <span style={S.logoAI}>AI</span>
        <span style={S.logoName}>MarketLink</span>
        <span style={S.title}>My Orders</span>
      </header>

      <div style={S.content}>
        {/* Filters */}
        <div style={S.filters}>
          {["ALL","PAID_IN_ESCROW","SHIPPED","DELIVERED_PENDING_CONFIRMATION","COMPLETED","CANCELLED"].map(f => (
            <button key={f} style={S.filterBtn(filter===f)} onClick={() => setFilter(f)}>
              {f==="ALL" ? "All Orders" : STATUS_MAP[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={S.empty}><IconLoader /> Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize:"2.5rem", marginBottom:"12px" }}>📦</div>
            <div style={{ fontSize:".9rem", marginBottom:"6px", color:"#f0f4f8" }}>No orders found</div>
            <div style={{ fontSize:".8rem" }}>Start shopping to see your orders here</div>
          </div>
        ) : (
          filtered.map((o, i) => {
            const s = STATUS_MAP[o.status] || { label:o.status, color:"#9ca3af" };
            const needsConfirm = o.status === "DELIVERED_PENDING_CONFIRMATION" || o.status === "SHIPPED";
            return (
              <div key={o._id} style={S.card}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.07)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.04)"}>
                <div style={S.img(colors[i % colors.length])}>
                  <IconPackage />
                </div>
                <div style={S.orderInfo}>
                  <div style={S.orderName}>{o.product?.name || "Product"}</div>
                  <div style={S.orderMeta}>{o.vendor?.businessName || "Vendor"} · {new Date(o.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={S.orderAmount}>₦{(o.amount||0).toLocaleString()}</span>
                    <span style={S.badge(o.status)}>{s.label}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                  {needsConfirm && (
                    <button style={S.confirmBtn} onClick={e => { e.stopPropagation(); handleConfirmDelivery(o._id); }} disabled={confirming===o._id}>
                      {confirming===o._id ? <IconLoader /> : <IconCheck />}
                      Confirm
                    </button>
                  )}
                  <button style={S.viewBtn} onClick={() => navigate(`/orders/${o._id}`)}>
                    <IconEye /> View
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Escrow note */}
        <div style={{ display:"flex", alignItems:"center", gap:"7px", marginTop:"20px", padding:"10px 14px", background:"rgba(74,222,128,.04)", border:"1px solid rgba(74,222,128,.1)", borderRadius:"9px", fontSize:".74rem", color:"#6b7280" }}>
          <IconShield /><span>All orders are escrow-protected — your money is safe until you confirm delivery</span>
        </div>
      </div>

      {toast && <div style={S.toast}><IconCheck />{toast}</div>}
    </div>
  );
}
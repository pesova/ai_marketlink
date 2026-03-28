import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ordersAPI } from "../utils/api";

/* ── Icons ── */
const IconArrowLeft = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const IconShield    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/><polyline points="9 12 11 14 15 10"/></svg>);
const IconCheck     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>);
const IconPackage   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconTruck     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>);
const IconLoader    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const IconLock      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconDollar    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);

const ESCROW_STEPS = [
  { key:"PENDING_PAYMENT",               label:"Order Placed",       Icon:IconPackage, desc:"Waiting for payment"             },
  { key:"PAID_IN_ESCROW",                label:"Payment Secured",    Icon:IconLock,    desc:"Funds held safely in escrow"     },
  { key:"SHIPPED",                       label:"Order Shipped",      Icon:IconTruck,   desc:"Vendor has shipped your order"   },
  { key:"DELIVERED_PENDING_CONFIRMATION",label:"Confirm Delivery",   Icon:IconCheck,   desc:"Tap confirm when you receive it" },
  { key:"COMPLETED",                     label:"Funds Released",     Icon:IconDollar,  desc:"Vendor received payment"         },
];

const STATUS_ORDER = ["PENDING_PAYMENT","PAID_IN_ESCROW","SHIPPED","DELIVERED_PENDING_CONFIRMATION","COMPLETED"];

const MOCK_ORDER = {
  _id:"ORD-004", status:"DELIVERED_PENDING_CONFIRMATION",
  amount:320000, createdAt:"2026-03-18T16:00:00Z",
  product:{ name:"HP Laptop 14\"", description:"i5, 8GB RAM, 256GB SSD.", price:320000, imageUrl:null },
  vendor:{ businessName:"LaptopWorld", phoneNumber:"+234 800 000 0000" },
  deliveryAddress:{ fullName:"Wisdom Stephen", phone:"+234 812 345 6789", street:"14 Bode Thomas Street", city:"Lagos", state:"Lagos" },
};

export default function OrderDetail() {
  const navigate          = useNavigate();
  const { orderId }       = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordersAPI.getById(orderId);
        setOrder(data.data || MOCK_ORDER);
      } catch {
        setOrder(MOCK_ORDER);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await ordersAPI.confirmDelivery(orderId);
      setOrder(o => ({ ...o, status:"COMPLETED" }));
      showToast("Delivery confirmed! Funds released to vendor.");
    } catch {
      showToast("Failed to confirm. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const currentStep = order ? STATUS_ORDER.indexOf(order.status) : 0;
  const needsConfirm = order?.status === "DELIVERED_PENDING_CONFIRMATION" || order?.status === "SHIPPED";

  const S = {
    root: { minHeight:"100vh", background:"#13171e", color:"#f0f4f8", fontFamily:"'DM Sans',sans-serif" },
    topbar: { display:"flex", alignItems:"center", gap:"12px", padding:"16px 24px", borderBottom:"1px solid rgba(255,255,255,.06)", background:"rgba(0,0,0,.3)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:50 },
    back: { background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:"8px", width:"34px", height:"34px", display:"flex", alignItems:"center", justifyContent:"center", color:"#f0f4f8", cursor:"pointer" },
    logoAI: { fontWeight:800, fontSize:".88rem", background:"linear-gradient(135deg,#d4a017,#f0bc2e)", color:"#0a2e1a", padding:"2px 8px", borderRadius:"5px", fontFamily:"'Syne',sans-serif" },
    logoName: { fontWeight:700, fontSize:".9rem", color:"#f0f4f8", fontFamily:"'Syne',sans-serif" },
    content: { maxWidth:"640px", margin:"0 auto", padding:"28px 20px", display:"flex", flexDirection:"column", gap:"16px" },
    card: { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"14px", overflow:"hidden" },
    cardHead: { padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,.06)", fontSize:".78rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".06em" },
    cardBody: { padding:"16px 18px" },
    orderId: { fontFamily:"'Courier New',monospace", fontSize:".8rem", color:"#6b7280", marginBottom:"4px" },
    amount: { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#4ade80", marginBottom:"6px" },
    // Escrow tracker
    tracker: { display:"flex", flexDirection:"column", gap:"0" },
    trackerStep: (done, current) => ({ display:"flex", gap:"12px", alignItems:"flex-start", opacity: done || current ? 1 : 0.4 }),
    trackerLeft: { display:"flex", flexDirection:"column", alignItems:"center", width:"32px" },
    trackerDot: (done, current) => ({ width:"32px", height:"32px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: done ? "linear-gradient(135deg,#d4a017,#f0bc2e)" : current ? "rgba(212,160,23,.15)" : "rgba(255,255,255,.06)", border: current ? "1.5px solid #d4a017" : "1.5px solid rgba(255,255,255,.1)", color: done ? "#0a2e1a" : current ? "#d4a017" : "#6b7280", flexShrink:0 }),
    trackerLine: (done) => ({ width:"2px", flex:1, minHeight:"20px", background: done ? "rgba(212,160,23,.3)" : "rgba(255,255,255,.06)", margin:"2px 0" }),
    trackerText: { paddingBottom:"18px", flex:1 },
    trackerLabel: (done, current) => ({ fontSize:".85rem", fontWeight:600, color: done ? "#f0f4f8" : current ? "#d4a017" : "#6b7280", marginBottom:"2px" }),
    trackerDesc:  { fontSize:".73rem", color:"#6b7280" },
    // Confirm button
    confirmBtn: { width:"100%", padding:"14px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#d4a017,#f0bc2e)", color:"#0a2e1a", fontSize:".92rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", fontFamily:"'DM Sans',sans-serif" },
    toast: { position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:"#1a1f28", border:"1px solid rgba(255,255,255,.12)", color:"#f0f4f8", padding:"10px 18px", borderRadius:"9px", fontSize:".82rem", fontWeight:500, zIndex:200, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"7px" },
  };

  if (loading) return (
    <div style={{ ...S.root, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <IconLoader />
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      <header style={S.topbar}>
        <button style={S.back} onClick={() => navigate("/orders")}><IconArrowLeft /></button>
        <span style={S.logoAI}>AI</span>
        <span style={S.logoName}>MarketLink</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"1rem", color:"#f0f4f8", marginLeft:"8px" }}>Order Detail</span>
      </header>

      <div style={S.content}>

        {/* Order Summary */}
        <div style={S.card}>
          <div style={S.cardHead}>Order Summary</div>
          <div style={S.cardBody}>
            <div style={S.orderId}>{order._id}</div>
            <div style={S.amount}>₦{(order.amount||0).toLocaleString()}</div>
            <div style={{ fontSize:".78rem", color:"#6b7280" }}>
              Placed {new Date(order.createdAt).toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </div>
          </div>
        </div>

        {/* Product */}
        <div style={S.card}>
          <div style={S.cardHead}>Product</div>
          <div style={{ ...S.cardBody, display:"flex", gap:"12px", alignItems:"center" }}>
            <div style={{ width:"52px", height:"52px", borderRadius:"10px", background:"rgba(212,160,23,.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#d4a017" }}>
              <IconPackage />
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:".9rem", color:"#f0f4f8", marginBottom:"3px" }}>{order.product?.name}</div>
              <div style={{ fontSize:".78rem", color:"#6b7280" }}>{order.vendor?.businessName}</div>
            </div>
          </div>
        </div>

        {/* Escrow Tracker */}
        <div style={S.card}>
          <div style={{ ...S.cardHead, display:"flex", alignItems:"center", gap:"6px" }}>
            <IconShield /> Escrow Status Tracker
          </div>
          <div style={{ ...S.cardBody }}>
            <div style={S.tracker}>
              {ESCROW_STEPS.map((step, i) => {
                const done    = i < currentStep;
                const current = i === currentStep;
                const isLast  = i === ESCROW_STEPS.length - 1;
                return (
                  <div key={step.key} style={S.trackerStep(done, current)}>
                    <div style={S.trackerLeft}>
                      <div style={S.trackerDot(done, current)}>
                        {done ? <IconCheck /> : <step.Icon />}
                      </div>
                      {!isLast && <div style={S.trackerLine(done)} />}
                    </div>
                    <div style={S.trackerText}>
                      <div style={S.trackerLabel(done, current)}>{step.label}</div>
                      <div style={S.trackerDesc}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div style={S.card}>
            <div style={S.cardHead}>Delivery Address</div>
            <div style={S.cardBody}>
              <div style={{ fontWeight:600, fontSize:".88rem", color:"#f0f4f8", marginBottom:"4px" }}>{order.deliveryAddress.fullName}</div>
              <div style={{ fontSize:".82rem", color:"#9ca3af", lineHeight:1.6 }}>
                {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delivery Button */}
        {needsConfirm && order.status !== "COMPLETED" && (
          <button style={S.confirmBtn} onClick={handleConfirm} disabled={confirming}>
            {confirming ? <><IconLoader /> Confirming...</> : <><IconCheck /> Confirm Delivery</>}
          </button>
        )}

        {order.status === "COMPLETED" && (
          <div style={{ textAlign:"center", padding:"16px", background:"rgba(74,222,128,.06)", border:"1px solid rgba(74,222,128,.15)", borderRadius:"12px", fontSize:".84rem", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px" }}>
            <IconCheck /> Order completed — funds released to vendor
          </div>
        )}
      </div>

      {toast && <div style={S.toast}><IconCheck />{toast}</div>}
    </div>
  );
}
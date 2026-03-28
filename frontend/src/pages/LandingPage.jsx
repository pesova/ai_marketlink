import { useState } from "react";
import AuthModal from "./AuthModal";
import Marketlink from "../assets/Marketlink.jpg";

const S = {
  root: {
    minHeight: "100vh",
    width: "100%",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
    color: "#f0f4f8",
    position: "relative",
    overflow: "auto",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(20,25,35,0.85)", //
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  logoAI: {
    fontWeight: 800,
    fontSize: "0.9rem",
    background: "linear-gradient(135deg, #d4a017, #f0bc2e)",
    color: "#0a2e1a",
    padding: "2px 8px",
    borderRadius: "5px",
    fontFamily: "'Syne', sans-serif",
  },
  logoName: {
    fontWeight: 700,
    fontSize: "0.92rem",
    color: "#f0f4f8",
    fontFamily: "'Syne', sans-serif",
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  loginBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#9ca3af",
    fontSize: "0.8rem",
    fontWeight: 500,
    padding: "6px 16px",
    borderRadius: "7px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
  },
  card: {
    background: "rgba(20,25,35,0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "36px 28px",
    width: "100%",
    maxWidth: "440px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    backdropFilter: "blur(16px)",
  },
  avatarWrap: {
    position: "relative",
    width: "80px",
    height: "80px",
    marginBottom: "20px",
  },
  avatarCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(145deg, #1e2530, #252d3a)",
    border: "1.5px solid #343d50",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    overflow: "hidden",
    position: "relative",
  },
  avatarFace: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  avatarEyes: {
    display: "flex",
    gap: "8px",
  },
  avatarEye: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#e5e7eb",
  },
  avatarMouth: {
    width: "14px",
    height: "5px",
    borderRadius: "0 0 8px 8px",
    border: "1.5px solid #e5e7eb",
    borderTop: "none",
  },
  avatarTie: {
    width: "10px",
    height: "12px",
    background: "#d4a017",
    clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 50% 75%, 0% 100%)",
  },
  onlineDot: {
    position: "absolute",
    bottom: "3px",
    right: "3px",
    width: "13px",
    height: "13px",
    borderRadius: "50%",
    background: "#4ade80",
    border: "2px solid #1a1f28",
    boxShadow: "0 0 7px #4ade80",
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.45rem",
    fontWeight: 800,
    color: "#f0f4f8",
    textAlign: "center",
    marginBottom: "8px",
  },
  cardDesc: {
    fontSize: "0.82rem",
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.65,
    maxWidth: "320px",
    marginBottom: "20px",
  },
  cardPrompt: {
    fontSize: "0.75rem",
    color: "#6b7280",
    marginBottom: "12px",
    textAlign: "center",
    letterSpacing: "0.03em",
  },
  options: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    width: "100%",
    padding: "13px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "11px",
    textAlign: "left",
    color: "#f0f4f8",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  optionIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    flexShrink: 0,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
  },
  optionTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#f0f4f8",
    marginBottom: "1px",
  },
  optionSub: {
    fontSize: "0.72rem",
    color: "#6b7280",
  },
  optionTag: {
    fontSize: "0.6rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "50px",
    background: "rgba(212,160,23,0.12)",
    color: "#d4a017",
    border: "1px solid rgba(212,160,23,0.2)",
    whiteSpace: "nowrap",
    flexShrink: 0,
    marginLeft: "auto",
  },
  trust: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "0.72rem",
    color: "#6b7280",
    width: "100%",
    background: "rgba(74,222,128,0.04)",
    border: "1px solid rgba(74,222,128,0.1)",
    borderRadius: "8px",
    padding: "8px 11px",
  },
  disclaimer: {
    marginTop: "14px",
    fontSize: "0.68rem",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    maxWidth: "380px",
  },
  bgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)),
      url(${Marketlink})
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.4,
    zIndex: -1,
  },
  whatsappFab: {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 18px",
    background: "#25D366",
    color: "#fff",
    borderRadius: "999px",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 18px rgba(37, 211, 102, 0.45)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
};

const WHATSAPP_HREF = `https://wa.me/2348024280757?text=${encodeURIComponent(
  "Hi! I'm reaching out from the AI MarketLink website. I'd like to learn more about shopping, selling, or escrow-protected payments. Could you help me get started?"
)}`;

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab]   = useState("login");

  const open = (tab) => { setAuthTab(tab); setAuthOpen(true); };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={S.root}>
        <div style={S.bgOverlay}></div>

        {/* TOPBAR */}
        <header style={S.topbar}>
          <div style={S.logo}>
            <span style={S.logoAI}>AI</span>
            <span style={S.logoName}>MarketLink</span>
          </div>
          <div style={S.topbarRight}>
            <button style={S.loginBtn} onClick={() => open("login")}
              onMouseEnter={e => { e.target.style.borderColor="#d4a017"; e.target.style.color="#d4a017"; }}
              onMouseLeave={e => { e.target.style.borderColor="rgba(255,255,255,0.2)"; e.target.style.color="#9ca3af"; }}>
              Log in
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main style={S.main}>
          <div style={S.card}>

            {/* Avatar */}
            <div style={S.avatarWrap}>
              <div style={S.avatarCircle}>
                <div style={S.avatarFace}>
                  <div style={S.avatarEyes}>
                    <div style={S.avatarEye} />
                    <div style={S.avatarEye} />
                  </div>
                  <div style={S.avatarMouth} />
                </div>
                <div style={S.avatarTie} />
              </div>
              <div style={S.onlineDot} />
            </div>

            <h1 style={S.cardTitle}>Meet MarketLink AI</h1>
            <p style={S.cardDesc}>
              Your trusted African shopping assistant — discover products via AI,
              buy and sell with escrow-protected payments.
            </p>

            <p style={S.cardPrompt}>I'm here to help. Are you...</p>

            <div style={S.options}>
              <button style={S.option}
                onClick={() => open("signup")}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; }}>
                <div style={S.optionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <div>
                  <div style={S.optionTitle}>Shopping & Buying</div>
                  <div style={S.optionSub}>Discover products via AI chat</div>
                </div>
              </button>

              <button style={S.option}
                onClick={() => open("signup")}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; }}>
                <div style={S.optionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="17" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 4h14l1 5H4L5 4z"/>
                    <path d="M3 9h18v1a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3V9z"/>
                    <path d="M5 13v7h14v-7"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.optionTitle}>Selling Products</div>
                  <div style={S.optionSub}>List & manage my storefront</div>
                </div>
                <span style={S.optionTag}>Escrow</span>
              </button>
            </div>

            <div style={S.trust}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.6" width="13" height="13" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              <span>All payments held in escrow — your money is safe until delivery</span>
            </div>
          </div>

          <p style={S.disclaimer}>
            MarketLink AI is an AI assistant. Responses are informational — not financial or legal advice.
          </p>
        </main>

        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          style={S.whatsappFab}
          aria-label="Chat on WhatsApp"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 22px rgba(37, 211, 102, 0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(37, 211, 102, 0.45)";
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#fff"
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
            />
          </svg>
          Chat on WhatsApp
        </a>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
      </div>
    </>
  );
}
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../utils/api";

const IconCheck  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polyline points="20 6 9 17 4 12"/></svg>);
const IconLoader = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const IconMail   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconX      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="28" height="28"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

export default function VerifyEmail() {
  const navigate               = useNavigate();
  const [searchParams]         = useSearchParams();
  const emailFromUrl           = searchParams.get("email") || "";

  const [email, setEmail]      = useState(emailFromUrl);
  const [token, setToken]      = useState("");
  const [digits, setDigits]    = useState(["","","","","",""]);
  const [loading, setLoading]  = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus]    = useState(null); // "success" | "error"
  const [message, setMessage]  = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs              = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    const code = digits.join("");
    if (code.length === 6 && !digits.includes("")) {
      handleVerify(code);
    }
  }, [digits]);

  const handleDigitChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[i] = val.slice(-1);
    setDigits(newDigits);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (code) => {
    if (!email || !code) return;
    setLoading(true);
    try {
      await authAPI.verifyEmail(email, code);
      setStatus("success");
      setMessage("Email verified successfully! Redirecting...");
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Invalid or expired code. Please try again.");
      setDigits(["","","","","",""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    try {
      await authAPI.resendVerification(email);
      setCountdown(60);
      setStatus(null);
      setMessage("");
      setDigits(["","","","","",""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setMessage(err.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const S = {
    root: { minHeight:"100vh", background:"#13171e", color:"#f0f4f8", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 20px" },
    card: { background:"rgba(20,25,35,.9)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"18px", padding:"40px 32px", width:"100%", maxWidth:"420px", display:"flex", flexDirection:"column", alignItems:"center", gap:"0", boxShadow:"0 24px 64px rgba(0,0,0,.6)", backdropFilter:"blur(16px)" },
    iconWrap: (type) => ({ width:"72px", height:"72px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px", background: type==="success" ? "linear-gradient(135deg,#d4a017,#f0bc2e)" : type==="error" ? "rgba(248,113,113,.15)" : "rgba(212,160,23,.12)", border: type==="error" ? "1.5px solid rgba(248,113,113,.3)" : "1.5px solid rgba(212,160,23,.2)", color: type==="success" ? "#0a2e1a" : type==="error" ? "#f87171" : "#d4a017" }),
    title: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.4rem", color:"#f0f4f8", marginBottom:"8px", textAlign:"center" },
    sub: { fontSize:".84rem", color:"#9ca3af", textAlign:"center", lineHeight:1.65, marginBottom:"28px", maxWidth:"300px" },
    emailField: { width:"100%", marginBottom:"20px" },
    emailLabel: { fontSize:".76rem", fontWeight:600, color:"#9ca3af", marginBottom:"5px", display:"block" },
    emailInput: { width:"100%", padding:"10px 13px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:"9px", color:"#f0f4f8", fontSize:".86rem", outline:"none", fontFamily:"'DM Sans',sans-serif" },
    digits: { display:"flex", gap:"8px", marginBottom:"20px" },
    digit: { width:"44px", height:"52px", borderRadius:"10px", border:"1.5px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.04)", color:"#f0f4f8", fontSize:"1.3rem", fontWeight:700, textAlign:"center", outline:"none", fontFamily:"'Syne',sans-serif", transition:"all .2s ease" },
    digitFocus: { border:"1.5px solid #d4a017", background:"rgba(212,160,23,.08)", boxShadow:"0 0 0 3px rgba(212,160,23,.1)" },
    verifyBtn: { width:"100%", padding:"13px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#d4a017,#f0bc2e)", color:"#0a2e1a", fontSize:".9rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", fontFamily:"'DM Sans',sans-serif", marginBottom:"14px" },
    resendBtn: { background:"none", border:"none", color: countdown > 0 ? "#6b7280" : "#d4a017", fontSize:".78rem", cursor: countdown > 0 ? "default" : "pointer", fontFamily:"'DM Sans',sans-serif" },
    statusMsg: (type) => ({ width:"100%", padding:"10px 14px", borderRadius:"9px", fontSize:".82rem", textAlign:"center", background: type==="success" ? "rgba(74,222,128,.08)" : "rgba(248,113,113,.08)", border: `1px solid ${type==="success" ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)"}`, color: type==="success" ? "#4ade80" : "#f87171", marginBottom:"12px" }),
    logo: { display:"flex", alignItems:"center", gap:"7px", marginBottom:"28px" },
    logoAI: { fontWeight:800, fontSize:".9rem", background:"linear-gradient(135deg,#d4a017,#f0bc2e)", color:"#0a2e1a", padding:"2px 8px", borderRadius:"5px", fontFamily:"'Syne',sans-serif" },
    logoName: { fontWeight:700, fontSize:".92rem", color:"#f0f4f8", fontFamily:"'Syne',sans-serif" },
  };

  return (
    <div style={S.root}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}`}</style>

      <div style={S.card}>
        <div style={S.logo}>
          <span style={S.logoAI}>AI</span>
          <span style={S.logoName}>MarketLink</span>
        </div>

        <div style={S.iconWrap(status)}>
          {status === "success" ? <IconCheck /> : status === "error" ? <IconX /> : <IconMail />}
        </div>

        <h1 style={S.title}>
          {status === "success" ? "Email Verified!" : "Verify Your Email"}
        </h1>
        <p style={S.sub}>
          {status === "success"
            ? "Your account is ready. Redirecting you to the marketplace..."
            : `We sent a 6-digit code to ${email || "your email"}. Enter it below to verify your account.`
          }
        </p>

        {status !== "success" && (
          <>
            {/* Email input if not pre-filled */}
            {!emailFromUrl && (
              <div style={S.emailField}>
                <label style={S.emailLabel}>Email Address</label>
                <input style={S.emailInput} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
            )}

            {/* 6-digit code inputs */}
            <div style={S.digits} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  style={S.digit}
                  type="number"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.style.cssText = Object.entries(S.digitFocus).map(([k,v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';')}
                  onBlur={e => { e.target.style.border="1.5px solid rgba(255,255,255,.1)"; e.target.style.background="rgba(255,255,255,.04)"; e.target.style.boxShadow="none"; }}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Status message */}
            {message && <div style={S.statusMsg(status)}>{message}</div>}

            {/* Verify button */}
            <button style={S.verifyBtn} onClick={() => handleVerify(digits.join(""))} disabled={loading || digits.join("").length < 6}>
              {loading ? <><IconLoader /> Verifying...</> : <><IconCheck /> Verify Email</>}
            </button>

            {/* Resend */}
            <button style={S.resendBtn} onClick={handleResend} disabled={resending || countdown > 0}>
              {resending ? "Sending..." : countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive it? Resend code"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";
import { AuthContext } from "../context/AuthContext";

/* ── Icons ── */
const IconX = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconEye = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IconMail = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconUser = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconPhone = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconLock = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconBuilding = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconFileText = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconMapPin = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconShield = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconCheck = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconArrowLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconUpload = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const IconLoader = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className="am-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconAlertCircle = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ── Field ── */
const Field = ({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  required,
}) => {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div className="am-field">
      {label && (
        <label className="am-label">
          {label}
          {required && <span className="am-req">*</span>}
        </label>
      )}
      <div className="am-input-wrap">
        {Icon && (
          <span className="am-input-icon">
            <Icon />
          </span>
        )}
        <input
          className="am-input"
          type={isPw ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          required={required}
          autoComplete="off"
        />
        {isPw && (
          <button
            type="button"
            className="am-eye"
            onClick={() => setShow((s) => !s)}
          >
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Upload ── */
const UploadField = ({ label, name, value, onChange, hint }) => {
  const ref = useRef();
  return (
    <div className="am-field">
      <label className="am-label">
        {label}
        <span className="am-req">*</span>
      </label>
      <div
        className={`am-upload${value ? " done" : ""}`}
        onClick={() => ref.current.click()}
      >
        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files[0]) onChange(name, e.target.files[0]);
          }}
        />
        <span className="am-upload__icon">
          {value ? <IconCheck /> : <IconUpload />}
        </span>
        <span className="am-upload__text">
          {value ? value.name : `Upload ${label}`}
        </span>
        {hint && !value && <span className="am-upload__hint">{hint}</span>}
      </div>
    </div>
  );
};

/* ── Role selector ── */
const RoleSelector = ({ value, onChange }) => (
  <div className="am-roles">
    {[
      { val: "buyer", title: "Shop & Buy", sub: "Find products via AI" },
      { val: "vendor", title: "Sell Products", sub: "List & manage my store" },
    ].map((r) => (
      <button
        key={r.val}
        type="button"
        className={`am-role${value === r.val ? " active" : ""}`}
        onClick={() => onChange("role", r.val)}
      >
        <span className="am-role__title">{r.title}</span>
        <span className="am-role__sub">{r.sub}</span>
        {value === r.val && (
          <span className="am-role__check">
            <IconCheck />
          </span>
        )}
      </button>
    ))}
  </div>
);

/* ── Feedback screen ── */
const FeedbackScreen = ({
  type,
  title,
  name,
  message,
  validationErrors,
  role,
  ctaLabel,
  onContinue,
}) => (
  <div className={`am-feedback am-feedback--${type}`}>
    {type === "success" && (
      <div className="am-feedback__particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="am-particle" style={{ "--i": i }} />
        ))}
      </div>
    )}
    <div className={`am-feedback__icon am-feedback__icon--${type}`}>
      {type === "success" ? <IconCheck /> : <IconAlertCircle />}
    </div>
    {type === "success" && (
      <div className="am-feedback__stars">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="am-feedback__star"
            style={{ "--d": `${i * 0.15}s` }}
          >
            <IconStar />
          </span>
        ))}
      </div>
    )}
    <h2 className="am-feedback__title">{title}</h2>
    {name && <p className="am-feedback__name">{name}</p>}
    <p className="am-feedback__msg">{message}</p>
    {Array.isArray(validationErrors) && validationErrors.length > 0 && (
      <ul
        style={{
          marginTop: "8px",
          marginBottom: "6px",
          paddingLeft: "18px",
          textAlign: "left",
        }}
      >
        {validationErrors.map((item, idx) => (
          <li key={`${item.field || "error"}-${idx}`} style={{ marginBottom: "4px" }}>
            {item.field ? `${item.field}: ` : ""}
            {item.message || "Invalid value"}
          </li>
        ))}
      </ul>
    )}
    <button className="am-feedback__btn" onClick={onContinue}>
      {type === "success" ? (
        <>
          <span>{ctaLabel || (role === "vendor" ? "Go to Dashboard" : "Start Shopping")}</span>
          <IconArrowRight />
        </>
      ) : (
        <span>Try Again</span>
      )}
    </button>
  </div>
);

/* ── Main Modal ── */
export default function AuthModal({ isOpen, onClose, defaultTab = "login" }) {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [forgotPw, setForgotPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationMeta, setVerificationMeta] = useState(null);
  const [verificationNotice, setVerificationNotice] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    businessName: "",
    cacNumber: "",
    address: "",
    idType: "",
    cacDocument: null,
    idDocument: null,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const getValidationErrors = (err) =>
    Array.isArray(err?.response?.data?.errors) ? err.response.data.errors : [];

  useEffect(() => {
    setFeedback(null);
    setLoading(false);
    setForgotPw(false);
    setForgotSent(false);
    setForgotEmail("");
    setShowVerifyEmail(false);
    setVerificationToken("");
    setVerificationMeta(null);
    setVerificationNotice("");
    setForm((f) => ({
      ...f,
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      role: "buyer",
      businessName: "",
      cacNumber: "",
      address: "",
      idType: "",
      cacDocument: null,
      idDocument: null,
    }));
  }, [tab, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await auth.login(form.email, form.password);
      const role = user?.role || "buyer";
      setFeedback({
        type: "success",
        title: "Welcome Back!",
        name: user?.name || user?.fullName || form.email,
        role,
        message:
          role === "vendor"
            ? "Heading to your vendor dashboard."
            : "Ready to start shopping!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        title: "Login Failed",
        message: err?.response?.data?.message || err.message || "Invalid email or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyerSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.register({
        name: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword || form.password,
        phoneNumber: form.phoneNumber,
      });
      setVerificationMeta({
        email: form.email,
        role: "buyer",
        name: form.fullName,
      });
      setVerificationToken("");
      setVerificationNotice("");
      setShowVerifyEmail(true);
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      setFeedback({
        type: "error",
        title: "Registration Failed",
        message: err?.response?.data?.message || err.message || "Something went wrong.",
        validationErrors,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.onboardVendor({
        name: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword || form.password,
        firstName: form.fullName.split(" ")[0],
        lastName: form.fullName.split(" ").slice(1).join(" ") || form.fullName,
        businessName: form.businessName,
        nin: form.cacNumber,
        phoneNumber: form.phoneNumber,
      });
      setVerificationMeta({
        email: form.email,
        role: "vendor",
        name: form.businessName,
      });
      setVerificationToken("");
      setVerificationNotice("");
      setShowVerifyEmail(true);
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      setFeedback({
        type: "error",
        title: "Registration Failed",
        message: err?.response?.data?.message || err.message || "Something went wrong.",
        validationErrors,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: wire to authService once implemented there
      // We still show success either way for security.
      setForgotSent(true);
    } catch (err) {
      setForgotSent(true); // Show success anyway for security
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!verificationMeta?.email) return;

    setLoading(true);
    try {
      const verifiedUser = await auth.verifyEmail(
        verificationMeta.email,
        verificationToken
      );
      setShowVerifyEmail(false);
      setFeedback({
        type: "success",
        title: "Email Verified!",
        name: verificationMeta.name,
        role: verificationMeta.role,
        ctaLabel: "Proceed to Login",
        action: "go-login",
        message:
          "Your email is verified successfully. Please log in to continue.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        title: "Verification Failed",
        message:
          err?.response?.data?.message ||
          err.message ||
          "Invalid or expired verification token.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationMeta?.email) return;
    setLoading(true);
    try {
      await auth.resendVerification(verificationMeta.email);
      setVerificationNotice(
        `A new verification token was sent to ${verificationMeta.email}.`
      );
    } catch (err) {
      setVerificationNotice(
        err?.response?.data?.message || err.message || "Could not resend token. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackContinue = () => {
    if (feedback.type === "success") {
      if (feedback.action === "go-login") {
        setFeedback(null);
        setTab("login");
        return;
      }
      onClose();
      navigate(feedback.role === "vendor" ? "/vendor/dashboard" : "/chat");
    } else setFeedback(null);
  };

  return (
    <div
      className="am-overlay"
      onClick={(e) => e.target === e.currentTarget && !feedback && onClose()}
    >
      <div className="am-modal">
        {feedback && (
          <FeedbackScreen {...feedback} onContinue={handleFeedbackContinue} />
        )}

        <button className="am-close" onClick={onClose}>
          <IconX />
        </button>

        <div className="am-brand">
          <span className="am-brand__ai">AI</span>
          <span className="am-brand__name">MarketLink</span>
        </div>

        {/* ── FORGOT PASSWORD ── */}
        {showVerifyEmail ? (
          <div className="am-body">
            <button
              className="am-back"
              onClick={() => {
                setShowVerifyEmail(false);
                setTab("signup");
              }}
            >
              <IconArrowLeft /> Back
            </button>
            <h2 className="am-title">Verify Your Email</h2>
            <p className="am-sub">
              Enter the verification token sent to{" "}
              <strong>{verificationMeta?.email}</strong>
            </p>
            <form onSubmit={handleVerifyEmail} className="am-form">
              <Field
                icon={IconMail}
                label="Verification Token"
                name="verificationToken"
                placeholder="e.g. 123456"
                value={verificationToken}
                onChange={(_, v) => setVerificationToken(v)}
                required
              />
              <button
                type="submit"
                className="am-btn am-btn--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconLoader />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
              <button
                type="button"
                className="am-btn"
                onClick={handleResendVerification}
                disabled={loading}
              >
                Resend Token
              </button>
              {verificationNotice && (
                <p className="am-sub" style={{ marginTop: "8px" }}>
                  {verificationNotice}
                </p>
              )}
            </form>
          </div>
        ) : forgotPw ? (
          <div className="am-body">
            <button className="am-back" onClick={() => setForgotPw(false)}>
              <IconArrowLeft /> Back
            </button>
            {forgotSent ? (
              <div className="am-forgot-sent">
                <div className="am-forgot-sent__icon">
                  <IconMail />
                </div>
                <h3>Check Your Email</h3>
                <p>
                  We sent a reset link to <strong>{forgotEmail}</strong>
                </p>
                <button
                  className="am-btn am-btn--primary"
                  onClick={() => {
                    setForgotPw(false);
                  }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <h2 className="am-title">Reset Password</h2>
                <p className="am-sub">
                  Enter your email and we'll send a reset link
                </p>
                <form onSubmit={handleForgot} className="am-form">
                  <Field
                    icon={IconMail}
                    name="forgotEmail"
                    placeholder="your@email.com"
                    type="email"
                    value={forgotEmail}
                    onChange={(_, v) => setForgotEmail(v)}
                    required
                  />
                  <button
                    type="submit"
                    className="am-btn am-btn--primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <IconLoader />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : /* ── VENDOR Signup ── */
        tab === "signup" ? (
          <div className="am-body">
            <h2 className="am-title">Create Account</h2>
            <p className="am-sub">Join Africa's trust-first marketplace</p>
            <div className="am-tabs">
              <button className="am-tab" onClick={() => setTab("login")}>
                Log In
              </button>
              <button className="am-tab am-tab--active">Sign Up</button>
            </div>
            <form
              onSubmit={form.role === "vendor" ? handleVendorSignup : handleBuyerSignup}
              className="am-form"
            >
              <RoleSelector
                value={form.role}
                onChange={(k, v) => {
                  set(k, v);
                }}
              />
              <Field
                icon={IconUser}
                label="Full Name"
                name="fullName"
                placeholder="Your full name"
                value={form.fullName}
                onChange={set}
                required
              />
              <Field
                icon={IconMail}
                label="Email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set}
                type="email"
                required
              />
              <Field
                icon={IconPhone}
                label="Phone"
                name="phoneNumber"
                placeholder="+234 800 000 0000"
                value={form.phoneNumber}
                onChange={set}
                required
              />
              <Field
                icon={IconLock}
                label="Password"
                name="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set}
                type="password"
                required
              />
              <Field
                icon={IconLock}
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Min. 8 characters"
                value={form.confirmPassword}
                onChange={set}
                type="password"
                required
              />
              {form.role === "vendor" && (
                <>
                  <Field
                    icon={IconBuilding}
                    label="Business Name"
                    name="businessName"
                    placeholder="e.g. Adaeze Fashion Hub"
                    value={form.businessName}
                    onChange={set}
                    required
                  />
                  <Field
                    icon={IconFileText}
                    label="NIN"
                    name="cacNumber"
                    placeholder="11-digit NIN"
                    value={form.cacNumber}
                    onChange={set}
                    required
                  />
                </>
              )}
              <button
                type="submit"
                className="am-btn am-btn--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconLoader />
                    Processing...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            <p className="am-switch">
              Already have an account?{" "}
              <button onClick={() => setTab("login")}>Log in</button>
            </p>
          </div>
        ) : (
          /* ── LOGIN ── */
          <div className="am-body">
            <h2 className="am-title">Welcome Back</h2>
            <p className="am-sub">Log in to your MarketLink account</p>
            <div className="am-tabs">
              <button className="am-tab am-tab--active">Log In</button>
              <button className="am-tab" onClick={() => setTab("signup")}>
                Sign Up
              </button>
            </div>
            <form onSubmit={handleLogin} className="am-form">
              <Field
                icon={IconMail}
                label="Email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set}
                type="email"
                required
              />
              <Field
                icon={IconLock}
                label="Password"
                name="password"
                placeholder="Your password"
                value={form.password}
                onChange={set}
                type="password"
                required
              />
              <div className="am-forgot-link">
                <button type="button" onClick={() => setForgotPw(true)}>
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                className="am-btn am-btn--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconLoader />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>
            <p className="am-switch">
              No account?{" "}
              <button onClick={() => setTab("signup")}>Sign up free</button>
            </p>
          </div>
        )}

        <div className="am-trust">
          <IconShield /> <span>Escrow Protected</span>
          <IconLock /> <span>SSL Secured</span>
        </div>
      </div>
    </div>
  );
}

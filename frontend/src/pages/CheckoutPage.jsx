import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrderOrThrow } from "../services/orderService";
import { initiatePayment } from "../services/paymentService";
import { normalizeCheckoutProduct } from "../utils/checkoutProduct";
import { openPaymentInNewTab } from "../utils/openPaymentLink";
import "./CheckoutPage.css";

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconPackage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function summaryColorKey(product) {
  return String(product?.id ?? product?._id ?? "0");
}

const OrderSummary = ({ product, qty, lineSubtotal, amountDue }) => {
  const colors = ["#1a6b3c", "#d4a017", "#2d9e5f", "#b8860b"];
  const pidKey = summaryColorKey(product);
  const colorIdx = Math.abs(pidKey.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) % colors.length;
  const color = colors[colorIdx];
  const vendorStr = typeof product.vendor === "string" ? product.vendor : "Vendor";
  const initials = vendorStr.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "V";

  return (
    <div className="ck-summary">
      <h3 className="ck-summary__title">Order summary</h3>
      <div className="ck-summary__product">
        <div className="ck-summary__img" style={product.imageUrl ? {} : { background: `${color}18` }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color }}>
              <IconPackage />
            </span>
          )}
        </div>
        <div className="ck-summary__info">
          <div className="ck-summary__name">{product.name}</div>
          <div className="ck-summary__cat">{product.category}</div>
          <div className="ck-summary__vendor">
            <span className="ck-vendor-dot" style={{ background: color }}>
              {initials}
            </span>
            {vendorStr}
          </div>
          <div className="ck-summary__rating">
            <IconStar />
            {product.rating ?? "—"} <span>({product.reviews ?? 0} reviews)</span>
          </div>
        </div>
      </div>
      <div className="ck-summary__breakdown">
        <div className="ck-breakdown-row">
          <span>Price × {qty}</span>
          <span>₦{(product.price * qty).toLocaleString()}</span>
        </div>
        <div className="ck-breakdown-row ck-breakdown-row--total">
          <span>{amountDue != null ? "Amount due" : "Estimated total"}</span>
          <span>₦{(amountDue != null ? amountDue : lineSubtotal).toLocaleString()}</span>
        </div>
        {amountDue != null && (
          <p className="ck-review-muted" style={{ fontSize: 13, marginTop: 8 }}>
            Charged amount matches your order on the server.
          </p>
        )}
      </div>
      <div className="ck-escrow-box">
        <div className="ck-escrow-box__header">
          <IconShield />
          <span>Escrow protection</span>
        </div>
        <div className="ck-escrow-steps">
          {["You pay — funds held securely", "Vendor ships", "You confirm delivery", "Vendor gets paid"].map(
            (s, i) => (
              <div key={s} className="ck-escrow-step">
                <span className="ck-escrow-step__num">{i + 1}</span>
                <span>{s}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

function EmptyCheckout({ navigate }) {
  return (
    <div className="ck-root">
      <header className="ck-topbar">
        <button type="button" className="ck-back-btn" onClick={() => navigate(-1)}>
          <IconArrowLeft />
        </button>
        <div className="ck-logo">
          <span className="ck-logo__mark">AI</span>
          <span className="ck-logo__text">MarketLink</span>
        </div>
      </header>
      <div className="ck-layout" style={{ justifyContent: "center", padding: "3rem 1rem" }}>
        <div className="ck-card" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
          <h2 className="ck-card__title">No product selected</h2>
          <p style={{ opacity: 0.85, marginBottom: "1.5rem" }}>
            Open a product from chat or the catalog, then use <strong>Buy now</strong>.
          </p>
          <button type="button" className="ck-btn ck-btn--gold ck-btn--full" onClick={() => navigate("/chat")}>
            Go to chat
          </button>
          <button
            type="button"
            className="ck-btn ck-btn--ghost ck-btn--full"
            style={{ marginTop: 12 }}
            onClick={() => navigate("/chat")}
          >
            Browse products
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const product = useMemo(() => {
    const raw = location.state?.product;
    return raw ? normalizeCheckoutProduct(raw, raw.qty ?? 1) : null;
  }, [location.state]);

  const qty = product?.qty ?? 1;
  const lineSubtotal = product ? product.price * qty : 0;

  const [loading, setLoading] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentOpenedHint, setPaymentOpenedHint] = useState(false);
  const [manualPaymentUrl, setManualPaymentUrl] = useState("");

  const amountDue = pendingOrder?.totalAmount ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product?._id && !product?.id) return;
    const addr = deliveryAddress.trim();
    if (addr.length < 5) {
      setCheckoutError("Please enter your full delivery address (at least 5 characters).");
      return;
    }
    setCheckoutError("");
    setPaymentOpenedHint(false);
    setManualPaymentUrl("");
    setLoading(true);
    try {
      const order = await createOrderOrThrow({
        productId: String(product._id ?? product.id),
        quantity: qty,
        deliveryAddress: addr,
      });
      setPendingOrder(order);
      const orderId = order?._id ? String(order._id) : "";
      if (!orderId) throw new Error("Order created but no order ID returned.");

      const body = await initiatePayment(orderId, {});
      const paymentUrl = body?.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error(body?.message || "No payment link returned.");
      }
      const { opened } = openPaymentInNewTab(paymentUrl);
      if (opened) {
        setPaymentOpenedHint(true);
      } else {
        setManualPaymentUrl(paymentUrl);
        setCheckoutError("Pop-up blocked. Use the link below or allow pop-ups for this site.");
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.message || err.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return <EmptyCheckout navigate={navigate} />;
  }

  return (
    <div className="ck-root">
      <header className="ck-topbar">
        <button type="button" className="ck-back-btn" onClick={() => navigate(-1)}>
          <IconArrowLeft />
        </button>
        <div className="ck-logo">
          <span className="ck-logo__mark">AI</span>
          <span className="ck-logo__text">MarketLink</span>
        </div>
        <div className="ck-topbar__secure">
          <IconLock /> Secure checkout
        </div>
      </header>

      {checkoutError && (
        <div style={{ maxWidth: 900, margin: "0 auto 1rem", padding: "0 1rem", color: "#b71c1c", fontSize: 14 }}>
          {checkoutError}
        </div>
      )}

      <div className="ck-layout">
        <div className="ck-forms">
          <div className="ck-card">
            <div className="ck-card__header">
              <IconMapPin />
              <h2 className="ck-card__title">Delivery address</h2>
            </div>
            <p className="ck-review-muted" style={{ marginBottom: "1rem", fontSize: 14 }}>
              Enter where we should deliver this order. Payment opens in a <strong>new tab</strong>.
            </p>
            <form onSubmit={handleSubmit} className="ck-form">
              <div className="ck-form-field">
                <label className="ck-label">
                  Full delivery address <span>*</span>
                </label>
                <textarea
                  className="ck-input"
                  style={{ minHeight: 120, resize: "vertical", lineHeight: 1.45 }}
                  placeholder="e.g. 12 Adeola Odeku St, Victoria Island, Lagos. Phone: +234…"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {paymentOpenedHint && (
                <p style={{ color: "#1a6b3c", fontSize: 14, marginBottom: "1rem" }} role="status">
                  Payment page opened in a new tab. Complete checkout there — you can keep this page open.
                </p>
              )}
              {manualPaymentUrl && (
                <p style={{ marginBottom: "1rem", fontSize: 14 }}>
                  <a href={manualPaymentUrl} target="_blank" rel="noopener noreferrer">
                    Open payment page
                  </a>
                </p>
              )}
              <button type="submit" className="ck-btn ck-btn--gold ck-btn--full ck-btn--lg" disabled={loading}>
                {loading ? "Creating order…" : `Pay ₦${(amountDue ?? lineSubtotal).toLocaleString()} — opens new tab`}
              </button>
              <p className="ck-confirm-note" style={{ marginTop: "0.75rem" }}>
                By paying, you agree to escrow terms. Funds stay protected until you confirm delivery.
              </p>
            </form>
          </div>
        </div>
        <div className="ck-sidebar">
          <OrderSummary product={product} qty={qty} lineSubtotal={lineSubtotal} amountDue={amountDue} />
        </div>
      </div>
    </div>
  );
}

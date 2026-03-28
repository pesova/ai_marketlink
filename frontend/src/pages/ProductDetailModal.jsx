import { useState, useEffect } from "react";
import "./ProductDetailModal.css";
import { createOrderOrThrow } from "../services/orderService";
import { initiatePayment } from "../services/paymentService";
import { openPaymentInNewTab } from "../utils/openPaymentLink";

/* ── Icons ── */
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconPackage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 5v3h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pd-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const GALLERY_COLORS = [
  { bg: "#e8f5ee", accent: "#1a6b3c" },
  { bg: "#fef9e7", accent: "#d4a017" },
  { bg: "#e8f0fe", accent: "#3b82f6" },
  { bg: "#fce8e8", accent: "#ef4444" },
];

function mongoIdString(p) {
  const raw = p?._id ?? p?.id;
  if (raw == null) return "";
  if (typeof raw === "object" && raw.$oid) return String(raw.$oid);
  return String(raw);
}

export default function ProductDetailModal({ product, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [deliveryAddressOnly, setDeliveryAddressOnly] = useState("");
  const [paymentOpenedHint, setPaymentOpenedHint] = useState(false);
  const [manualPaymentUrl, setManualPaymentUrl] = useState("");

  const pid = mongoIdString(product);

  useEffect(() => {
    setBuyError("");
    setBuyLoading(false);
    setActiveImg(0);
    setDeliveryAddressOnly("");
    setPaymentOpenedHint(false);
    setManualPaymentUrl("");
  }, [pid]);

  if (!product) return null;

  const colors = ["#1a6b3c", "#d4a017", "#2d9e5f", "#b8860b", "#0f4a2a", "#3b82f6"];
  const pidKey = pid || String(product.name ?? "0");
  const accentIdx = Math.abs(pidKey.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) % colors.length;
  const accentColor = colors[accentIdx];
  const vendorStr =
    typeof product.vendor === "string"
      ? product.vendor
      : product.vendor?.businessName ||
        [product.vendor?.firstName, product.vendor?.lastName].filter(Boolean).join(" ").trim() ||
        "Vendor";
  const initials =
    vendorStr
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "V";
  const stock = product.quantity ?? product.stock ?? 0;

  const gallerySlides = product.images?.length > 0
    ? product.images
    : product.imageUrl
      ? [{ url: product.imageUrl }]
      : GALLERY_COLORS.map((c, i) => ({ type: "placeholder", bg: c.bg, accent: c.accent, index: i }));

  const handlePrev = () =>
    setActiveImg((i) => (i - 1 + gallerySlides.length) % gallerySlides.length);
  const handleNext = () => setActiveImg((i) => (i + 1) % gallerySlides.length);

  const handleBuyNow = async (e) => {
    e.preventDefault();
    setBuyError("");
    if (!pid) {
      setBuyError("This product is missing an ID. Try another listing.");
      return;
    }
    if (stock < 1) return;

    const deliveryAddress = deliveryAddressOnly.trim();
    if (deliveryAddress.length < 5) {
      setBuyError("Please enter your full delivery address (at least 5 characters).");
      return;
    }

    setBuyLoading(true);
    setPaymentOpenedHint(false);
    setManualPaymentUrl("");
    try {
      const order = await createOrderOrThrow({
        productId: pid,
        quantity: 1,
        deliveryAddress,
      });
      const orderId = order?._id ? String(order._id) : "";
      if (!orderId) throw new Error("Order created but no order ID returned.");

      const body = await initiatePayment(orderId, {});
      const payData = body?.data;
      const paymentUrl = payData?.paymentUrl;
      if (!paymentUrl) {
        throw new Error(body?.message || "No payment link returned. Try again.");
      }
      const { opened } = openPaymentInNewTab(paymentUrl);
      if (opened) {
        setPaymentOpenedHint(true);
      } else {
        setManualPaymentUrl(paymentUrl);
        setBuyError("Pop-up blocked. Open the payment link below or allow pop-ups for this site.");
      }
    } catch (err) {
      setBuyError(err.response?.data?.message || err.message || "Could not start checkout.");
    } finally {
      setBuyLoading(false);
    }
  };

  const deliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div
      className="pd-overlay"
      role="presentation"
      onClick={(ev) => ev.target === ev.currentTarget && !buyLoading && onClose()}
    >
      <div className="pd-modal">
        <button type="button" className="pd-close" onClick={() => !buyLoading && onClose()} aria-label="Close">
          <IconX />
        </button>

        <div className="pd-gallery">
          <div
            className="pd-gallery__main"
            style={{ background: gallerySlides[activeImg]?.bg || "#e8f5ee" }}
          >
            {gallerySlides[activeImg]?.url ? (
              <img src={gallerySlides[activeImg].url} alt={product.name} className="pd-gallery__img" />
            ) : (
              <div className="pd-gallery__placeholder">
                <span style={{ color: gallerySlides[activeImg]?.accent || accentColor }}>
                  <IconPackage />
                </span>
                <span
                  className="pd-gallery__placeholder-label"
                  style={{ color: gallerySlides[activeImg]?.accent || accentColor }}
                >
                  {product.name}
                </span>
              </div>
            )}

            {gallerySlides.length > 1 && (
              <>
                <button type="button" className="pd-gallery__arrow pd-gallery__arrow--left" onClick={handlePrev}>
                  <IconChevronLeft />
                </button>
                <button type="button" className="pd-gallery__arrow pd-gallery__arrow--right" onClick={handleNext}>
                  <IconChevronRight />
                </button>
              </>
            )}

            <div className={`pd-stock-badge${stock <= 3 ? " low" : ""}${stock === 0 ? " low" : ""}`}>
              {stock === 0 ? "Out of stock" : stock <= 3 ? `Only ${stock} left` : "In Stock"}
            </div>
          </div>

          <div className="pd-gallery__thumbs">
            {gallerySlides.map((slide, i) => (
              <button
                type="button"
                key={i}
                className={`pd-thumb${activeImg === i ? " active" : ""}`}
                onClick={() => setActiveImg(i)}
                style={{ background: slide.bg || "#e8f5ee" }}
              >
                {slide.url ? (
                  <img src={slide.url} alt="" />
                ) : (
                  <span style={{ color: slide.accent || accentColor }}>
                    <IconPackage />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pd-gallery__dots">
            {gallerySlides.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`pd-dot${activeImg === i ? " active" : ""}`}
                onClick={() => setActiveImg(i)}
              />
            ))}
          </div>
        </div>

        <div className="pd-details">
          <div className="pd-details__scroll">
            <span className="pd-cat">{product.category}</span>
            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-rating-row">
              <div className="pd-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`pd-star${i <= Math.round(product.rating || 4.5) ? " on" : ""}`}>
                    <IconStar />
                  </span>
                ))}
              </div>
              <span className="pd-rating-val">{product.rating || "4.5"}</span>
              <span className="pd-rating-count">({product.reviews || 0} reviews)</span>
            </div>

            <div className="pd-price-block">
              <div className="pd-price">₦{Number(product.price || 0).toLocaleString()}</div>
              <div className={`pd-stock-text${stock <= 3 ? " low" : ""}`}>
                {stock === 0 ? "Out of stock" : stock <= 3 ? `⚠ Only ${stock} units left` : `${stock} units available`}
              </div>
            </div>

            <div className="pd-section">
              <h3 className="pd-section__title">Description</h3>
              <p className="pd-desc">{product.description}</p>
            </div>

            <div className="pd-delivery">
              <div className="pd-delivery__icon">
                <IconTruck />
              </div>
              <div className="pd-delivery__body">
                <div className="pd-delivery__label">Estimated delivery</div>
                <div className="pd-delivery__date">
                  By <strong>{deliveryDate()}</strong>
                </div>
                <div className="pd-delivery__note">
                  <IconMapPin /> Coordinated with the vendor after payment
                </div>
              </div>
            </div>

            <div className="pd-buy-form">
              <h3 className="pd-section__title">Delivery address</h3>
              <p className="pd-buy-form__hint">
                Enter where we should deliver this order (include city, state, and phone if you can). Payment opens in a <strong>new tab</strong>.
              </p>
              <label className="pd-buy-form__label">
                Full delivery address <span>*</span>
                <textarea
                  className="pd-buy-form__textarea"
                  value={deliveryAddressOnly}
                  onChange={(ev) => setDeliveryAddressOnly(ev.target.value)}
                  placeholder="e.g. 12 Adeola Odeku St, Victoria Island, Lagos. Phone: +234…"
                  rows={4}
                  required
                  disabled={buyLoading}
                />
              </label>
              {paymentOpenedHint && (
                <p className="pd-buy-form__success" role="status">
                  Payment page opened in a new tab. Complete checkout there — you can keep this window open.
                </p>
              )}
              {manualPaymentUrl && (
                <p className="pd-buy-form__manual-link">
                  <a href={manualPaymentUrl} target="_blank" rel="noopener noreferrer">
                    Open payment page
                  </a>
                </p>
              )}
            </div>

            <div className="pd-escrow">
              <div className="pd-escrow__header">
                <span className="pd-escrow__icon">
                  <IconShield />
                </span>
                <span className="pd-escrow__title">Escrow payment protection</span>
              </div>
              <div className="pd-escrow__steps">
                {[
                  "You pay — funds held securely on platform",
                  "Vendor ships your order",
                  "You confirm delivery",
                  "Vendor receives payment",
                ].map((s, i) => (
                  <div key={i} className="pd-escrow__step">
                    <span className="pd-escrow__step-num">{i + 1}</span>
                    <span className="pd-escrow__step-text">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form className="pd-cta" onSubmit={handleBuyNow}>
            {buyError && <div className="pd-buy-error">{buyError}</div>}
            <button
              type="submit"
              className="pd-btn pd-btn--buy pd-btn--buy-full"
              disabled={stock === 0 || buyLoading}
            >
              {buyLoading ? (
                <>
                  <IconLoader /> Starting payment…
                </>
              ) : (
                <>
                  <IconZap /> Buy now — ₦{Number(product.price || 0).toLocaleString()}
                </>
              )}
            </button>
          </form>

          <div className="pd-vendor-strip">
            <div className="pd-vendor-strip__avatar" style={{ background: accentColor }}>
              {initials}
            </div>
            <div className="pd-vendor-strip__info">
              <span className="pd-vendor-strip__name">{vendorStr}</span>
              <span className="pd-vendor-strip__badge">
                <IconShield /> Verified vendor
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./VendorProfile.css";

/* ── Icons ── */
const IconArrowLeft  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const IconShield     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/><polyline points="9 12 11 14 15 10"/></svg>);
const IconEdit       = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconCamera     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const IconStar       = ({ size=14 }) => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width:size,height:size}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IconPackage    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconPhone      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const IconMail       = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconMapPin     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconInstagram  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>);
const IconWhatsapp   = () => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>);
const IconTwitter    = () => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const IconCheck      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconX          = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconUser       = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconShoppingBag= () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const IconAlertCircle= () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconFileText   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);

/* ── Mock Data ── */
const MOCK_VENDOR = {
  name:"Adaeze Okonkwo", businessName:"Adaeze Fashion Hub",
  email:"adaeze@fashionhub.ng", phone:"+234 812 345 6789",
  address:"23 Bode Thomas Street, Surulere, Lagos",
  cacNumber:"RC-1234567", idType:"National ID (NIN)",
  bio:"Premium African fashion curator. Specialising in Ankara, Adire, and Aso-Oke fabrics. Over 5 years experience. All items handpicked and quality-verified.",
  instagram:"@adaeze.fashion", whatsapp:"+2348123456789", twitter:"@adaezefashion",
  joinDate:"January 2026", rating:4.9, totalReviews:47, totalSales:134,
  verified:true, idVerified:true, cacVerified:true, banner:null, avatar:null,
};
const MOCK_PRODUCTS = [
  { id:1, name:"Ankara Midi Dress",  price:12500, category:"Fashion & Clothing", stock:15, available:true  },
  { id:2, name:"Adire Print Blouse", price:8000,  category:"Fashion & Clothing", stock:8,  available:true  },
  { id:3, name:"Aso-Oke Head Wrap",  price:5500,  category:"Fashion & Clothing", stock:20, available:false },
  { id:4, name:"Boubou Kaftan Set",  price:22000, category:"Fashion & Clothing", stock:5,  available:true  },
];
const MOCK_REVIEWS = [
  { id:1, buyer:"Chioma A.",   rating:5, comment:"Quality is excellent! The Ankara fabric is genuine and stitching is perfect. Will buy again.", date:"Mar 18, 2026" },
  { id:2, buyer:"Kemi O.",     rating:5, comment:"Fast delivery and the blouse fits perfectly. Adaeze is very responsive too.", date:"Mar 15, 2026" },
  { id:3, buyer:"Ngozi E.",    rating:4, comment:"Beautiful kaftan set. Colours are vibrant. Slight delay in shipping but overall great experience.", date:"Mar 10, 2026" },
  { id:4, buyer:"Fatima I.",   rating:5, comment:"Best fabric quality I have found online. The head wrap is stunning. Highly recommended vendor.", date:"Mar 5, 2026" },
  { id:5, buyer:"Blessing N.", rating:5, comment:"Adaeze Fashion Hub never disappoints. Third time buying and always a great experience.", date:"Feb 28, 2026" },
];

/* ── Star Rating ── */
const StarRating = ({ rating, size=14 }) => (
  <div className="vp-stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.round(rating) ? "#f0bc2e" : "#e5e7eb", display:"flex" }}>
        <IconStar size={size} />
      </span>
    ))}
  </div>
);

/* ── Edit Modal ── */
const EditProfileModal = ({ vendor, onClose, onSave }) => {
  const [form, setForm] = useState({ ...vendor });
  const avatarRef = useRef(); const bannerRef = useRef();
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  return (
    <div className="vp-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="vp-modal">
        <div className="vp-modal__header">
          <h2 className="vp-modal__title">Edit Profile</h2>
          <button className="vp-modal__close" onClick={onClose}><IconX /></button>
        </div>
        <div className="vp-modal__body">
          <div className="vp-edit-media">
            <div className="vp-edit-avatar-wrap">
              <div className="vp-edit-avatar" onClick={() => avatarRef.current.click()}>
                {form.avatar ? <img src={URL.createObjectURL(form.avatar)} alt="" /> : <IconUser />}
                <div className="vp-edit-avatar__overlay"><IconCamera /></div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={e => e.target.files[0] && set("avatar", e.target.files[0])} />
              <span>Profile Photo</span>
            </div>
            <div className="vp-edit-banner-wrap">
              <div className="vp-edit-banner" onClick={() => bannerRef.current.click()}
                style={{ backgroundImage: form.banner ? `url(${URL.createObjectURL(form.banner)})` : "none" }}>
                {!form.banner && <><IconCamera /><span>Upload Banner</span></>}
                {form.banner && <div className="vp-edit-banner__overlay"><IconCamera /> Change</div>}
              </div>
              <input ref={bannerRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={e => e.target.files[0] && set("banner", e.target.files[0])} />
            </div>
          </div>
          <div className="vp-edit-grid">
            {[
              { k:"name",         label:"Full Name",        ph:"Your full name" },
              { k:"businessName", label:"Business Name",    ph:"Business name" },
              { k:"phone",        label:"Phone",            ph:"+234..." },
              { k:"email",        label:"Email",            ph:"email@example.com", type:"email" },
              { k:"instagram",    label:"Instagram",        ph:"@handle" },
              { k:"whatsapp",     label:"WhatsApp",         ph:"+234..." },
              { k:"twitter",      label:"Twitter / X",      ph:"@handle" },
            ].map(f => (
              <div className="vp-edit-field" key={f.k}>
                <label>{f.label}</label>
                <input type={f.type||"text"} value={form[f.k]||""} placeholder={f.ph} onChange={e => set(f.k, e.target.value)} />
              </div>
            ))}
            <div className="vp-edit-field vp-edit-field--full">
              <label>Business Address</label>
              <input value={form.address||""} placeholder="Full business address" onChange={e => set("address", e.target.value)} />
            </div>
            <div className="vp-edit-field vp-edit-field--full">
              <label>Bio</label>
              <textarea value={form.bio||""} placeholder="Tell buyers about your business..." rows={3} onChange={e => set("bio", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="vp-modal__footer">
          <button className="vp-btn vp-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="vp-btn vp-btn--gold" onClick={() => { onSave(form); onClose(); }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

/* ── Switch Role Modal ── */
const SwitchRoleModal = ({ targetRole, onClose, onConfirm }) => (
  <div className="vp-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
    <div className="vp-confirm">
      <div className={`vp-confirm__icon${targetRole==="buyer"?" blue":""}`}>
        {targetRole === "buyer" ? <IconShoppingBag /> : <IconShield />}
      </div>
      <h3 className="vp-confirm__title">Switch to {targetRole === "buyer" ? "Buyer" : "Vendor"} Mode?</h3>
      <p className="vp-confirm__msg">
        {targetRole === "buyer"
          ? "You'll be switched to buyer mode. Your vendor store, products and orders remain saved. Switch back anytime."
          : "You'll be switched back to vendor mode with all your store data intact."
        }
      </p>
      <div className="vp-confirm__pills">
        {["Store data preserved","Orders history kept","Switch back anytime"].map((p,i) => (
          <span key={i} className="vp-confirm__pill"><IconCheck />{p}</span>
        ))}
      </div>
      <div className="vp-confirm__btns">
        <button className="vp-btn vp-btn--ghost" onClick={onClose}>Cancel</button>
        <button className={`vp-btn${targetRole==="buyer"?" vp-btn--blue":" vp-btn--gold"}`} onClick={onConfirm}>
          Switch to {targetRole === "buyer" ? "Buyer" : "Vendor"} Mode
        </button>
      </div>
    </div>
  </div>
);

/* ── Main Page ── */
export default function VendorProfile() {
  const navigate = useNavigate();
  const [vendor, setVendor]       = useState(MOCK_VENDOR);
  const [showEdit, setShowEdit]   = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast]         = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSwitch = () => {
    setShowSwitch(false);
    showToast("Switched to buyer mode");
    setTimeout(() => navigate("/chat"), 800);
  };

  const ratingBreakdown = [5,4,3,2,1].map(r => ({
    stars:r,
    count: MOCK_REVIEWS.filter(rv => rv.rating===r).length,
    pct: Math.round((MOCK_REVIEWS.filter(rv => rv.rating===r).length / MOCK_REVIEWS.length)*100),
  }));

  return (
    <div className="vp-root">

      {/* TOPBAR */}
      <header className="vp-topbar">
        <button className="vp-back-btn" onClick={() => navigate("/vendor/dashboard")}><IconArrowLeft /></button>
        <div className="vp-logo">
          <span className="vp-logo__mark">AI</span>
          <span className="vp-logo__text">MarketLink</span>
        </div>
        <div className="vp-topbar__actions">
          <button className="vp-btn vp-btn--switch" onClick={() => setShowSwitch(true)}>
            <IconShoppingBag /> Switch to Buyer
          </button>
          <button className="vp-btn vp-btn--gold-sm" onClick={() => setShowEdit(true)}>
            <IconEdit /> Edit Profile
          </button>
        </div>
      </header>

      {/* BANNER */}
      <div className="vp-banner">
        {vendor.banner
          ? <img src={URL.createObjectURL(vendor.banner)} alt="banner" />
          : <div className="vp-banner__default" />
        }
      </div>

      {/* PROFILE HEADER */}
      <div className="vp-profile-header">
        <div className="vp-profile-header__inner">
          <div className="vp-avatar-wrap">
            <div className="vp-avatar">
              {vendor.avatar
                ? <img src={URL.createObjectURL(vendor.avatar)} alt={vendor.name} />
                : <span>{vendor.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</span>
              }
            </div>
            {vendor.verified && <div className="vp-avatar__badge" title="Verified"><IconShield /></div>}
          </div>
          <div className="vp-profile-header__info">
            <div className="vp-profile-header__row">
              <div>
                <h1 className="vp-name">{vendor.name}</h1>
                <p className="vp-biz">{vendor.businessName}</p>
              </div>
              <div className="vp-badges">
                {vendor.verified && <span className="vp-badge vp-badge--green"><IconShield /> Verified Vendor</span>}
                <span className="vp-badge vp-badge--gray">Since {vendor.joinDate}</span>
              </div>
            </div>
            <p className="vp-bio">{vendor.bio}</p>
            <div className="vp-pstats">
              {[
                { val: vendor.rating,        label:"Rating"   },
                { val: vendor.totalReviews,  label:"Reviews"  },
                { val: vendor.totalSales,    label:"Sales"    },
                { val: MOCK_PRODUCTS.length, label:"Products" },
              ].map((s,i,arr) => (
                <>
                  <div className="vp-pstat" key={s.label}>
                    <div className="vp-pstat__val">{s.val}</div>
                    <div className="vp-pstat__label">{s.label}</div>
                  </div>
                  {i < arr.length-1 && <div key={`sep-${i}`} className="vp-pstat__sep" />}
                </>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="vp-content">

        {/* LEFT SIDEBAR */}
        <aside className="vp-sidebar">

          {/* Business Info */}
          <div className="vp-card">
            <h3 className="vp-card__title">Business Info</h3>
            <div className="vp-info-list">
              {[
                { Icon:IconPhone,    label:"Phone",      val:vendor.phone   },
                { Icon:IconMail,     label:"Email",      val:vendor.email   },
                { Icon:IconMapPin,   label:"Address",    val:vendor.address },
                { Icon:IconFileText, label:"CAC Number", val:vendor.cacNumber },
              ].map((item,i) => (
                <div key={i} className="vp-info-item">
                  <span className="vp-info-item__icon"><item.Icon /></span>
                  <div>
                    <div className="vp-info-item__label">{item.label}</div>
                    <div className="vp-info-item__val">{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification */}
          <div className="vp-card">
            <h3 className="vp-card__title">Verification</h3>
            <div className="vp-verify-list">
              {[
                { label:"Identity",   done:vendor.idVerified,  note:vendor.idType },
                { label:"CAC Doc",    done:vendor.cacVerified, note:"Business registered" },
                { label:"Phone",      done:true,               note:vendor.phone },
                { label:"Email",      done:true,               note:vendor.email },
              ].map((v,i) => (
                <div key={i} className={`vp-verify-item${v.done?" done":""}`}>
                  <div className={`vp-verify-item__icon${v.done?" done":""}`}>
                    {v.done ? <IconCheck /> : <IconAlertCircle />}
                  </div>
                  <div className="vp-verify-item__body">
                    <div className="vp-verify-item__label">{v.label}</div>
                    <div className="vp-verify-item__note">{v.note}</div>
                  </div>
                  <span className={`vp-verify-badge${v.done?" done":""}`}>{v.done?"Verified":"Pending"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="vp-card">
            <h3 className="vp-card__title">Contact & Social</h3>
            <div className="vp-social-list">
              {vendor.instagram && (
                <a href={`https://instagram.com/${vendor.instagram.replace("@","")}`} target="_blank" rel="noreferrer" className="vp-social vp-social--ig">
                  <IconInstagram /><span>{vendor.instagram}</span>
                </a>
              )}
              {vendor.whatsapp && (
                <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="vp-social vp-social--wa">
                  <IconWhatsapp /><span>{vendor.whatsapp}</span>
                </a>
              )}
              {vendor.twitter && (
                <a href={`https://twitter.com/${vendor.twitter.replace("@","")}`} target="_blank" rel="noreferrer" className="vp-social vp-social--tw">
                  <IconTwitter /><span>{vendor.twitter}</span>
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <div className="vp-main">
          <div className="vp-tabs">
            <button className={`vp-tab${activeTab==="products"?" active":""}`} onClick={() => setActiveTab("products")}>
              Products ({MOCK_PRODUCTS.length})
            </button>
            <button className={`vp-tab${activeTab==="reviews"?" active":""}`} onClick={() => setActiveTab("reviews")}>
              Reviews ({MOCK_REVIEWS.length})
            </button>
          </div>

          {activeTab === "products" && (
            <div className="vp-products-grid">
              {MOCK_PRODUCTS.map(p => (
                <div key={p.id} className="vp-product-card">
                  <div className="vp-product-card__img">
                    <span className="vp-product-card__icon"><IconPackage /></span>
                    <span className={`vp-product-card__badge${p.available?" on":""}`}>
                      {p.available ? "Available" : "Hidden"}
                    </span>
                  </div>
                  <div className="vp-product-card__body">
                    <span className="vp-product-card__cat">{p.category}</span>
                    <div className="vp-product-card__name">{p.name}</div>
                    <div className="vp-product-card__foot">
                      <span className="vp-product-card__price">₦{p.price.toLocaleString()}</span>
                      <span className="vp-product-card__stock">Qty: {p.stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="vp-reviews">
              <div className="vp-rating-summary">
                <div className="vp-rating-summary__left">
                  <div className="vp-rating-summary__big">{vendor.rating}</div>
                  <StarRating rating={vendor.rating} size={20} />
                  <div className="vp-rating-summary__count">{vendor.totalReviews} reviews</div>
                </div>
                <div className="vp-rating-summary__bars">
                  {ratingBreakdown.map(r => (
                    <div key={r.stars} className="vp-rating-bar">
                      <span className="vp-rating-bar__num">{r.stars}</span>
                      <span style={{color:"#f0bc2e",display:"flex"}}><IconStar size={12}/></span>
                      <div className="vp-rating-bar__track">
                        <div className="vp-rating-bar__fill" style={{width:`${r.pct}%`}} />
                      </div>
                      <span className="vp-rating-bar__count">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="vp-review-list">
                {MOCK_REVIEWS.map(r => (
                  <div key={r.id} className="vp-review">
                    <div className="vp-review__top">
                      <div className="vp-review__avatar">{r.buyer[0]}</div>
                      <div className="vp-review__meta">
                        <div className="vp-review__buyer">{r.buyer}</div>
                        <div className="vp-review__date">{r.date}</div>
                      </div>
                      <StarRating rating={r.rating} size={13} />
                    </div>
                    <p className="vp-review__comment">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && <EditProfileModal vendor={vendor} onClose={() => setShowEdit(false)} onSave={v => { setVendor(v); showToast("Profile updated!"); }} />}
      {showSwitch && <SwitchRoleModal targetRole="buyer" onClose={() => setShowSwitch(false)} onConfirm={handleSwitch} />}
      {toast && <div className="vp-toast"><IconCheck />{toast}</div>}
    </div>
  );
}
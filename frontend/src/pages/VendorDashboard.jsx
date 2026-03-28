import { useState, useRef, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./VendorDashboard.css";
import { AuthContext } from "../context/AuthContext";
import {
  VENDOR_PRODUCT_CATEGORIES,
  fetchVendorProfile,
  fetchVendorProducts,
  fetchVendorOrders,
  fetchVendorBalance,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  markVendorOrderShipped,
  markVendorOrderDelivered,
} from "../services/vendorService";

/* ── Icons ── */
const IconHome      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const IconPackage   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconShoppingBag=()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const IconLock      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/></svg>);
const IconDollar    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconBell      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const IconPlus      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IconEdit      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconTrash     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const IconX         = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconUpload    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>);
const IconCheck     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconTrendUp   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const IconArrowLeft = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
const IconEye       = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconUser      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconCalendar  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IconShield    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/><polyline points="9 12 11 14 15 10"/></svg>);
const IconStar      = () => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

function categoryLabel(value) {
  return VENDOR_PRODUCT_CATEGORIES.find((c) => c.value === value)?.label || value || "—";
}

function mapProductFromApi(p) {
  const qty = p.quantity ?? 0;
  return {
    id: p._id,
    name: p.name,
    description: p.description,
    price: p.price,
    qty,
    category: categoryLabel(p.category),
    categoryValue: p.category,
    imageUrl: p.imageUrl || "",
    available: qty > 0,
    createdAt: p.createdAt,
  };
}

function mapOrderFromApi(o) {
  const productName =
    typeof o.product === "object" && o.product?.name ? o.product.name : "—";
  const buyerName =
    typeof o.buyer === "object" && o.buyer?.name ? o.buyer.name : "—";
  const rawId = o._id != null ? String(o._id) : "";
  return {
    id: rawId,
    displayId: rawId ? `…${rawId.slice(-6).toUpperCase()}` : "—",
    product: productName,
    buyer: buyerName,
    amount: o.totalAmount,
    status: o.status,
    date: o.createdAt
      ? new Date(o.createdAt).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
  };
}

function mapVendorProfile(vendorDoc) {
  const u = vendorDoc?.user || {};
  const name =
    u.name ||
    `${vendorDoc?.firstName || ""} ${vendorDoc?.lastName || ""}`.trim() ||
    "Vendor";
  return {
    name,
    businessName: vendorDoc?.businessName || "",
    email: u.email || "",
    phone: vendorDoc?.phoneNumber || "",
    joinDate: vendorDoc?.createdAt
      ? new Date(vendorDoc.createdAt).toLocaleDateString("en-NG", {
          month: "long",
          year: "numeric",
        })
      : "",
    verified: true,
    avatar: u.avatar || null,
  };
}

const STATUS_LABELS = {
  PENDING_PAYMENT:         { label:"Awaiting Payment", color:"gray"   },
  PAID_IN_ESCROW:          { label:"In Escrow",        color:"gold"   },
  SHIPPED:                 { label:"Shipped",          color:"blue"   },
  DELIVERED_PENDING_CONFIRMATION: { label:"Confirming", color:"purple"},
  COMPLETED:               { label:"Completed",        color:"green"  },
  CANCELLED:               { label:"Cancelled",        color:"red"    },
};

/* ── Add Product Modal ── */
const emptyProductForm = () => ({
  name: "",
  description: "",
  price: "",
  qty: "",
  category: "",
  imageFile: null,
});

const formStateForEdit = (editProduct) =>
  editProduct
    ? {
        name: editProduct.name || "",
        description: editProduct.description || "",
        price: editProduct.price != null ? String(editProduct.price) : "",
        qty: editProduct.qty != null ? String(editProduct.qty) : "",
        category: editProduct.categoryValue || "",
        imageFile: null,
      }
    : emptyProductForm();

const AddProductModal = ({ onClose, onSave, editProduct, submitting }) => {
  const imgRef = useRef();
  const [form, setForm] = useState(() => formStateForEdit(editProduct));
  const [localError, setLocalError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (!editProduct && !form.imageFile) {
      setLocalError("Please upload a product image.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      qty: Number(form.qty),
      category: form.category,
      imageFile: form.imageFile,
    };
    if (payload.price <= 0 || Number.isNaN(payload.price)) {
      setLocalError("Enter a valid price.");
      return;
    }
    if (payload.qty < 0 || Number.isNaN(payload.qty)) {
      setLocalError("Enter a valid stock quantity.");
      return;
    }
    try {
      await onSave(payload, editProduct);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not save product.";
      setLocalError(msg);
    }
  };

  const hasPreview =
    form.imageFile ||
    (editProduct?.imageUrl && !form.imageFile);

  return (
    <div className="vd-modal-overlay" onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}>
      <div className="vd-modal">
        <div className="vd-modal__header">
          <h2 className="vd-modal__title">{editProduct ? "Edit Product" : "Add New Product"}</h2>
          <button type="button" className="vd-modal__close" onClick={onClose} disabled={submitting}><IconX /></button>
        </div>
        <form onSubmit={handleSubmit} className="vd-modal__form">

          <div className="vd-form-field">
            <label className="vd-form-label">Product Image {editProduct ? "" : <span>*</span>}</label>
            <div
              className={`vd-img-upload${hasPreview ? " has-img" : ""}`}
              onClick={() => !submitting && imgRef.current?.click()}
            >
              <input
                ref={imgRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files[0]) set("imageFile", e.target.files[0]);
                }}
              />
              {form.imageFile ? (
                <div className="vd-img-upload__preview">
                  <img src={URL.createObjectURL(form.imageFile)} alt="preview" />
                  <span className="vd-img-upload__change">Click to change</span>
                </div>
              ) : editProduct?.imageUrl ? (
                <div className="vd-img-upload__preview">
                  <img src={editProduct.imageUrl} alt="Current" />
                  <span className="vd-img-upload__change">Click to replace image (not sent yet)</span>
                </div>
              ) : (
                <>
                  <span className="vd-img-upload__icon"><IconUpload /></span>
                  <span className="vd-img-upload__text">Click to upload product image</span>
                  <span className="vd-img-upload__hint">JPG, PNG — required for new products</span>
                </>
              )}
            </div>
            {editProduct && (
              <p className="vd-form-hint" style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                Updating the image requires a new listing API; edits apply name, price, stock, and category only.
              </p>
            )}
          </div>

          <div className="vd-form-row">
            <div className="vd-form-field">
              <label className="vd-form-label">Product Name <span>*</span></label>
              <input className="vd-form-input" placeholder="e.g. Ankara Midi Dress" value={form.name} onChange={(e) => set("name", e.target.value)} required disabled={submitting} />
            </div>
            <div className="vd-form-field">
              <label className="vd-form-label">Category <span>*</span></label>
              <select className="vd-form-input vd-form-select" value={form.category} onChange={(e) => set("category", e.target.value)} required disabled={submitting}>
                <option value="">Select category</option>
                {VENDOR_PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="vd-form-field">
            <label className="vd-form-label">Description <span>*</span></label>
            <textarea className="vd-form-input vd-form-textarea" placeholder="Describe your product in detail..." value={form.description} onChange={(e) => set("description", e.target.value)} required rows={3} disabled={submitting} />
          </div>

          <div className="vd-form-row">
            <div className="vd-form-field">
              <label className="vd-form-label">Price (₦) <span>*</span></label>
              <input className="vd-form-input" type="number" placeholder="e.g. 12500" value={form.price} onChange={(e) => set("price", e.target.value)} required min="1" disabled={submitting} />
            </div>
            <div className="vd-form-field">
              <label className="vd-form-label">Quantity in stock <span>*</span></label>
              <input className="vd-form-input" type="number" placeholder="e.g. 10" value={form.qty} onChange={(e) => set("qty", e.target.value)} required min="0" disabled={submitting} />
            </div>
          </div>

          {localError && (
            <div className="vd-form-error" style={{ color: "#c62828", fontSize: 14 }}>{localError}</div>
          )}

          <div className="vd-modal__footer">
            <button type="button" className="vd-btn vd-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="vd-btn vd-btn--gold" disabled={submitting}>
              {submitting ? "Saving…" : editProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Dashboard ── */
export default function VendorDashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [balance, setBalance] = useState({ escrow: 0, available: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saveProductSubmitting, setSaveProductSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [toast, setToast] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3800);
  };

  const refreshProducts = useCallback(async () => {
    const list = await fetchVendorProducts();
    setProducts((list || []).map(mapProductFromApi));
  }, []);

  const refreshOrders = useCallback(async () => {
    const list = await fetchVendorOrders();
    setOrders((list || []).map(mapOrderFromApi));
  }, []);

  const refreshBalance = useCallback(async () => {
    const b = await fetchVendorBalance();
    setBalance({
      escrow: typeof b?.escrow === "number" ? b.escrow : 0,
      available: typeof b?.available === "number" ? b.available : 0,
    });
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [profile, productList, orderList, b] = await Promise.all([
        fetchVendorProfile(),
        fetchVendorProducts(),
        fetchVendorOrders(),
        fetchVendorBalance(),
      ]);
      setVendorProfile(mapVendorProfile(profile));
      setProducts((productList || []).map(mapProductFromApi));
      setOrders((orderList || []).map(mapOrderFromApi));
      setBalance({
        escrow: typeof b?.escrow === "number" ? b.escrow : 0,
        available: typeof b?.available === "number" ? b.available : 0,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load dashboard";
      setToast(msg);
      setTimeout(() => setToast(""), 4000);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const profile =
    vendorProfile || {
      name: "…",
      businessName: "",
      email: "",
      verified: false,
      avatar: null,
    };

  /* Escrow / available from ledger API; revenue approximated from orders */
  const escrowTotal = balance.escrow;
  const availableTotal = balance.available;
  const totalRevenue = orders
    .filter((o) =>
      ["COMPLETED", "PAID_IN_ESCROW", "SHIPPED", "DELIVERED_PENDING_CONFIRMATION"].includes(
        o.status,
      ),
    )
    .reduce((s, o) => s + o.amount, 0);
  const totalOrders = orders.length;

  const handleSaveProduct = async (payload, editing) => {
    setSaveProductSubmitting(true);
    try {
      if (editing) {
        await updateVendorProduct(editing.id, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          category: payload.category,
          quantity: payload.qty,
        });
        showToast("Product updated successfully");
      } else {
        await createVendorProduct({
          name: payload.name,
          description: payload.description,
          price: payload.price,
          category: payload.category,
          quantity: payload.qty,
          imageFile: payload.imageFile,
        });
        showToast("Product added successfully");
      }
      await refreshProducts();
      setShowAddModal(false);
      setEditProduct(null);
    } finally {
      setSaveProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteVendorProduct(id);
      setDeleteConfirm(null);
      showToast("Product deleted");
      await refreshProducts();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Delete failed");
    }
  };

  const handleToggleAvailable = async (p) => {
    const nextQty = p.qty > 0 ? 0 : 1;
    try {
      await updateVendorProduct(p.id, { quantity: nextQty });
      await refreshProducts();
      showToast(nextQty > 0 ? "Product marked in stock" : "Product marked out of stock");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Update failed");
    }
  };

  const handleMarkShipped = async (orderId) => {
    try {
      await markVendorOrderShipped(orderId);
      await refreshOrders();
      await refreshBalance();
      showToast("Order marked as shipped");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Could not update order");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await markVendorOrderDelivered(orderId);
      await refreshOrders();
      await refreshBalance();
      showToast("Marked delivered — buyer can confirm receipt");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Could not update order");
    }
  };

  /* Mark notif read */
  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read:true })));

  const filteredOrders = orderFilter === "ALL" ? orders : orders.filter(o => o.status === orderFilter);

  const SECTIONS = [
    { id:"overview",      label:"Overview",      Icon:IconHome },
    { id:"products",      label:"Products",      Icon:IconPackage },
    { id:"orders",        label:"Orders",        Icon:IconShoppingBag },
    { id:"escrow",        label:"Escrow",        Icon:IconLock },
    { id:"notifications", label:"Notifications", Icon:IconBell },
  ];

  return (
    <div className="vd-root">

      {/* ── TOPBAR ── */}
      <header className="vd-topbar">
        <div className="vd-topbar__left">
          <button className="vd-back-btn" onClick={() => navigate("/")}><IconArrowLeft /></button>
          <div className="vd-logo">
            <span className="vd-logo__mark">AI</span>
            <span className="vd-logo__text">MarketLink</span>
          </div>
          <span className="vd-topbar__sep" />
          <span className="vd-topbar__title">Vendor Dashboard</span>
        </div>
        <div className="vd-topbar__right">
          <button className="vd-logout-btn" onClick={handleLogout}>
            Logout
          </button>
          {/* Notification bell */}
          <div className="vd-notif-wrap">
            <button className="vd-icon-btn" onClick={() => setShowNotifs(s => !s)}>
              <IconBell />
              {unreadCount > 0 && <span className="vd-badge">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="vd-notif-dropdown">
                <div className="vd-notif-dropdown__header">
                  <span>Notifications</span>
                  <button onClick={markAllRead} className="vd-notif-mark-read">Mark all read</button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className={`vd-notif-item${n.read ? "" : " unread"}`}
                    onClick={() => setNotifications(ns => ns.map(x => x.id===n.id ? {...x,read:true} : x))}>
                    <div className={`vd-notif-item__dot vd-notif-item__dot--${n.type}`} />
                    <div className="vd-notif-item__body">
                      <div className="vd-notif-item__title">{n.title}</div>
                      <div className="vd-notif-item__msg">{n.msg}</div>
                      <div className="vd-notif-item__time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vendor profile */}
          <button type="button" className="vd-profile-btn" onClick={() => navigate("/vendor/profile")}>
            <div className="vd-profile-btn__avatar">
              {profile.avatar ? <img src={profile.avatar} alt="" /> : <IconUser />}
            </div>
            <div className="vd-profile-btn__info">
              <span className="vd-profile-btn__name">{profile.name}</span>
              <span className="vd-profile-btn__biz">{profile.businessName || "Vendor"}</span>
            </div>
            {profile.verified && <span className="vd-verified-badge"><IconShield /></span>}
          </button>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <nav className="vd-nav">
        {SECTIONS.map(s => (
          <button key={s.id} className={`vd-nav-btn${activeSection===s.id?" active":""}`}
            onClick={() => setActiveSection(s.id)}>
            <s.Icon />
            <span>{s.label}</span>
            {s.id==="notifications" && unreadCount > 0 && <span className="vd-nav-badge">{unreadCount}</span>}
          </button>
        ))}
      </nav>

      {/* ── CONTENT ── */}
      <main className="vd-main">
        {dashboardLoading && (
          <div className="vd-section" style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.85 }}>
            Loading your dashboard…
          </div>
        )}

        {/* ════ OVERVIEW ════ */}
        {!dashboardLoading && activeSection === "overview" && (
          <section className="vd-section">
            <div className="vd-section__head">
              <h2 className="vd-section__title">Overview</h2>
              <p className="vd-section__sub">Welcome back, {profile.name.split(" ")[0]}</p>
            </div>

            {/* Stats grid */}
            <div className="vd-stats">
              {[
                { Icon:IconLock,        label:"In Escrow",     val:`₦${escrowTotal.toLocaleString()}`,    color:"gold",   sub:"Awaiting delivery confirmation" },
                { Icon:IconDollar,      label:"Available",     val:`₦${availableTotal.toLocaleString()}`, color:"green",  sub:"Ready for withdrawal" },
                { Icon:IconTrendUp,     label:"Total Revenue", val:`₦${totalRevenue.toLocaleString()}`,   color:"blue",   sub:"All time earnings" },
                { Icon:IconShoppingBag, label:"Total Orders",  val:totalOrders,                            color:"purple", sub:`${products.length} active products` },
              ].map((s,i) => (
                <div className="vd-stat-card" key={i} style={{ "--delay": `${i*0.08}s` }}>
                  <div className={`vd-stat-card__icon vd-stat-card__icon--${s.color}`}><s.Icon /></div>
                  <div className="vd-stat-card__body">
                    <div className="vd-stat-card__val">{s.val}</div>
                    <div className="vd-stat-card__label">{s.label}</div>
                    <div className="vd-stat-card__sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent orders quick view */}
            <div className="vd-card">
              <div className="vd-card__head">
                <h3 className="vd-card__title">Recent Orders</h3>
                <button className="vd-link-btn" onClick={() => setActiveSection("orders")}>View all</button>
              </div>
              <div className="vd-table-wrap">
                <table className="vd-table">
                  <thead><tr><th>Order ID</th><th>Product</th><th>Buyer</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.slice(0,4).map(o => {
                      const s = STATUS_LABELS[o.status] || { label: o.status, color:"gray" };
                      return (
                        <tr key={o.id}>
                          <td className="vd-table__id">{o.displayId}</td>
                          <td>{o.product}</td>
                          <td>{o.buyer}</td>
                          <td className="vd-table__amount">₦{o.amount.toLocaleString()}</td>
                          <td><span className={`vd-status vd-status--${s.color}`}>{s.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick product preview */}
            <div className="vd-card">
              <div className="vd-card__head">
                <h3 className="vd-card__title">Your Products</h3>
                <button className="vd-link-btn" onClick={() => setActiveSection("products")}>Manage</button>
              </div>
              <div className="vd-products-mini">
                {products.map(p => (
                  <div key={p.id} className="vd-product-mini">
                    <div className="vd-product-mini__img">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <IconPackage />}
                    </div>
                    <div className="vd-product-mini__info">
                      <div className="vd-product-mini__name">{p.name}</div>
                      <div className="vd-product-mini__price">₦{p.price.toLocaleString()}</div>
                    </div>
                    <span className={`vd-avail-dot${p.available?" on":""}`} title={p.available?"Available":"Unavailable"} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════ PRODUCTS ════ */}
        {!dashboardLoading && activeSection === "products" && (
          <section className="vd-section">
            <div className="vd-section__head">
              <div>
                <h2 className="vd-section__title">Products</h2>
                <p className="vd-section__sub">{products.length} products listed</p>
              </div>
              <button className="vd-btn vd-btn--gold" onClick={() => { setEditProduct(null); setShowAddModal(true); }}>
                <IconPlus /> Add Product
              </button>
            </div>
            <div className="vd-products-grid">
              {products.map(p => (
                <div key={p.id} className="vd-product-card">
                  <div className="vd-product-card__img">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} />
                      : <div className="vd-product-card__placeholder"><IconPackage /></div>
                    }
                    <span className={`vd-product-card__avail${p.available?" on":""}`}>
                      {p.available ? "Available" : "Hidden"}
                    </span>
                  </div>
                  <div className="vd-product-card__body">
                    <span className="vd-product-card__cat">{p.category}</span>
                    <h3 className="vd-product-card__name">{p.name}</h3>
                    <p className="vd-product-card__desc">{p.description}</p>
                    <div className="vd-product-card__meta">
                      <div>
                        <div className="vd-product-card__price">₦{p.price.toLocaleString()}</div>
                        <div className="vd-product-card__qty">Qty: {p.qty}</div>
                      </div>
                      <div className="vd-product-card__period">
                        <IconCalendar />
                        <span>
                          {p.createdAt
                            ? `Listed ${new Date(p.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="vd-product-card__actions">
                      <button type="button" className="vd-icon-btn-sm" title="Toggle availability" onClick={() => handleToggleAvailable(p)}>
                        <IconEye />
                      </button>
                      <button className="vd-icon-btn-sm" title="Edit" onClick={() => { setEditProduct(p); setShowAddModal(true); }}>
                        <IconEdit />
                      </button>
                      <button className="vd-icon-btn-sm vd-icon-btn-sm--danger" title="Delete" onClick={() => setDeleteConfirm(p.id)}>
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {products.length === 0 && (
                <div className="vd-empty">
                  <IconPackage />
                  <h3>No products yet</h3>
                  <p>Add your first product to start selling</p>
                  <button className="vd-btn vd-btn--gold" onClick={() => setShowAddModal(true)}><IconPlus /> Add Product</button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════ ORDERS ════ */}
        {!dashboardLoading && activeSection === "orders" && (
          <section className="vd-section">
            <div className="vd-section__head">
              <div>
                <h2 className="vd-section__title">Orders</h2>
                <p className="vd-section__sub">{orders.length} total orders</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="vd-order-filters">
              {["ALL","PENDING_PAYMENT","PAID_IN_ESCROW","SHIPPED","DELIVERED_PENDING_CONFIRMATION","COMPLETED","CANCELLED"].map(f => (
                <button key={f} className={`vd-filter-tab${orderFilter===f?" active":""}`} onClick={() => setOrderFilter(f)}>
                  {f === "ALL" ? "All Orders" : STATUS_LABELS[f]?.label || f}
                  <span className="vd-filter-tab__count">
                    {f === "ALL" ? orders.length : orders.filter(o => o.status===f).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="vd-card">
              <div className="vd-table-wrap">
                <table className="vd-table">
                  <thead>
                    <tr>
                      <th>Order ID</th><th>Product</th><th>Buyer</th>
                      <th>Amount</th><th>Date</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => {
                      const s = STATUS_LABELS[o.status] || { label:o.status, color:"gray" };
                      return (
                        <tr key={o.id}>
                          <td className="vd-table__id">{o.displayId}</td>
                          <td>{o.product}</td>
                          <td>{o.buyer}</td>
                          <td className="vd-table__amount">₦{o.amount.toLocaleString()}</td>
                          <td className="vd-table__date">{o.date}</td>
                          <td><span className={`vd-status vd-status--${s.color}`}>{s.label}</span></td>
                          <td>
                            {o.status === "PAID_IN_ESCROW" && (
                              <button type="button" className="vd-action-btn" onClick={() => handleMarkShipped(o.id)}>
                                Mark Shipped
                              </button>
                            )}
                            {o.status === "SHIPPED" && (
                              <button type="button" className="vd-action-btn" onClick={() => handleMarkDelivered(o.id)}>
                                Mark Delivered
                              </button>
                            )}
                            {!["PAID_IN_ESCROW", "SHIPPED"].includes(o.status) && (
                              <span className="vd-table__na">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && (
                  <div className="vd-table-empty">No orders in this category</div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ════ ESCROW ════ */}
        {!dashboardLoading && activeSection === "escrow" && (
          <section className="vd-section">
            <div className="vd-section__head">
              <h2 className="vd-section__title">Escrow Balance</h2>
              <p className="vd-section__sub">Your payment protection overview</p>
            </div>

            {/* Escrow summary cards */}
            <div className="vd-escrow-cards">
              <div className="vd-escrow-card vd-escrow-card--gold">
                <div className="vd-escrow-card__icon"><IconLock /></div>
                <div className="vd-escrow-card__val">₦{escrowTotal.toLocaleString()}</div>
                <div className="vd-escrow-card__label">Held in Escrow</div>
                <div className="vd-escrow-card__note">Released when buyers confirm delivery</div>
              </div>
              <div className="vd-escrow-card vd-escrow-card--green">
                <div className="vd-escrow-card__icon"><IconDollar /></div>
                <div className="vd-escrow-card__val">₦{availableTotal.toLocaleString()}</div>
                <div className="vd-escrow-card__label">Available Balance</div>
                <div className="vd-escrow-card__note">Ready for withdrawal to your bank</div>
              </div>
              <div className="vd-escrow-card vd-escrow-card--blue">
                <div className="vd-escrow-card__icon"><IconTrendUp /></div>
                <div className="vd-escrow-card__val">₦{totalRevenue.toLocaleString()}</div>
                <div className="vd-escrow-card__label">Total Revenue</div>
                <div className="vd-escrow-card__note">Lifetime earnings across all orders</div>
              </div>
            </div>

            {/* Escrow explanation */}
            <div className="vd-escrow-info">
              <div className="vd-escrow-info__icon"><IconShield /></div>
              <div>
                <h3 className="vd-escrow-info__title">How Escrow Protects You</h3>
                <p className="vd-escrow-info__text">When a buyer pays, funds stay in escrow. Mark the order shipped, then mark it delivered when it reaches the buyer. After they confirm (or after the auto-release window), funds move to your available balance.</p>
              </div>
            </div>

            {/* Escrow transactions */}
            <div className="vd-card">
              <div className="vd-card__head">
                <h3 className="vd-card__title">Escrow Transactions</h3>
              </div>
              <div className="vd-table-wrap">
                <table className="vd-table">
                  <thead><tr><th>Order ID</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.map(o => {
                      const s = STATUS_LABELS[o.status] || { label:o.status, color:"gray" };
                      return (
                        <tr key={o.id}>
                          <td className="vd-table__id">{o.displayId}</td>
                          <td>{o.product}</td>
                          <td className="vd-table__amount">₦{o.amount.toLocaleString()}</td>
                          <td><span className={`vd-status vd-status--${s.color}`}>{s.label}</span></td>
                          <td className="vd-table__date">{o.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ════ NOTIFICATIONS ════ */}
        {!dashboardLoading && activeSection === "notifications" && (
          <section className="vd-section">
            <div className="vd-section__head">
              <div>
                <h2 className="vd-section__title">Notifications</h2>
                <p className="vd-section__sub">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <button className="vd-btn vd-btn--ghost" onClick={markAllRead}>Mark all as read</button>
              )}
            </div>
            <div className="vd-notifs-list">
              {notifications.length === 0 && (
                <p className="vd-section__sub" style={{ padding: "2rem", textAlign: "center" }}>No notifications yet.</p>
              )}
              {notifications.map(n => (
                <div key={n.id} className={`vd-notif-full${n.read ? "" : " unread"}`}
                  onClick={() => setNotifications(ns => ns.map(x => x.id===n.id ? {...x,read:true} : x))}>
                  <div className={`vd-notif-full__dot vd-notif-item__dot--${n.type}`} />
                  <div className="vd-notif-full__body">
                    <div className="vd-notif-full__title">{n.title}</div>
                    <div className="vd-notif-full__msg">{n.msg}</div>
                    <div className="vd-notif-full__time">{n.time}</div>
                  </div>
                  {!n.read && <span className="vd-notif-full__unread-dot" />}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── ADD/EDIT PRODUCT MODAL ── */}
      {showAddModal && (
        <AddProductModal
          key={editProduct?.id ? String(editProduct.id) : "new-product"}
          onClose={() => { if (!saveProductSubmitting) { setShowAddModal(false); setEditProduct(null); } }}
          onSave={handleSaveProduct}
          editProduct={editProduct}
          submitting={saveProductSubmitting}
        />
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="vd-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="vd-confirm" onClick={e => e.stopPropagation()}>
            <div className="vd-confirm__icon"><IconTrash /></div>
            <h3 className="vd-confirm__title">Delete Product?</h3>
            <p className="vd-confirm__msg">This action cannot be undone. The product will be permanently removed.</p>
            <div className="vd-confirm__btns">
              <button className="vd-btn vd-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="vd-btn vd-btn--danger" onClick={() => handleDeleteProduct(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className="vd-toast"><IconCheck />{toast}</div>}
    </div>
  );
}
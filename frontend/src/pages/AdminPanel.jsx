import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../utils/api";
import "./AdminPanel.css";

/* ── Icons ── */
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const IconRelease = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ORDER_STATUS_MAP = {
  PENDING_PAYMENT: { label: "Pending payment", color: "purple" },
  PAID_IN_ESCROW: { label: "In escrow", color: "gold" },
  SHIPPED: { label: "Shipped", color: "blue" },
  DELIVERED_PENDING_CONFIRMATION: { label: "Awaiting confirmation", color: "blue" },
  COMPLETED: { label: "Completed", color: "green" },
  CANCELLED: { label: "Cancelled", color: "gray" },
};

const ESCROW_STATUS_MAP = {
  INITIATED: { label: "Initiated", color: "purple" },
  HOLDING: { label: "Holding", color: "gold" },
  RELEASED: { label: "Released", color: "green" },
  REFUNDED: { label: "Refunded", color: "gray" },
};

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function shortId(id) {
  const s = String(id || "");
  return s.length <= 10 ? s : `…${s.slice(-8)}`;
}

function vendorLabel(v) {
  if (!v) return "—";
  if (v.businessName) return v.businessName;
  return [v.firstName, v.lastName].filter(Boolean).join(" ") || "—";
}

/* ── Dispute / escrow resolution ── */
const DisputeModal = ({ row, onClose, onResolve }) => {
  const [decision, setDecision] = useState("vendor");
  const [note, setNote] = useState("");

  return (
    <div className="ad-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal">
        <div className="ad-modal__header">
          <h3 className="ad-modal__title">Escrow action — order {shortId(row.orderId)}</h3>
          <button type="button" className="ad-modal__close" onClick={onClose}>
            <IconX />
          </button>
        </div>
        <div className="ad-modal__body">
          <div className="ad-dispute-info">
            <div className="ad-dispute-row">
              <span>Order</span>
              <strong>{row.orderId}</strong>
            </div>
            <div className="ad-dispute-row">
              <span>Product</span>
              <strong>{row.product}</strong>
            </div>
            <div className="ad-dispute-row">
              <span>Amount</span>
              <strong>₦{Number(row.amount).toLocaleString()}</strong>
            </div>
            <div className="ad-dispute-row">
              <span>Buyer</span>
              <strong>{row.buyer}</strong>
            </div>
            <div className="ad-dispute-row">
              <span>Vendor</span>
              <strong>{row.vendor}</strong>
            </div>
            <div className="ad-dispute-row">
              <span>Escrow status</span>
              <strong>{ESCROW_STATUS_MAP[row.escrowStatus]?.label || row.escrowStatus}</strong>
            </div>
          </div>
          <div className="ad-modal__warning" style={{ marginTop: 12 }}>
            <IconAlert />
            <span>
              Refund buyer marks the order cancelled and escrow refunded. Release sends funds to the vendor and completes the order.
            </span>
          </div>
          <div className="ad-form-field">
            <label className="ad-form-label">Decision</label>
            <div className="ad-decision-btns">
              <button
                type="button"
                className={`ad-decision-btn${decision === "buyer" ? " active-buyer" : ""}`}
                onClick={() => setDecision("buyer")}
              >
                Refund buyer
              </button>
              <button
                type="button"
                className={`ad-decision-btn${decision === "vendor" ? " active-vendor" : ""}`}
                onClick={() => setDecision("vendor")}
              >
                Release to vendor
              </button>
            </div>
          </div>
          <div className="ad-form-field">
            <label className="ad-form-label">
              Admin note <span>*</span>
            </label>
            <textarea
              className="ad-form-input ad-form-textarea"
              placeholder="Document why you are taking this action…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="ad-modal__footer">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            disabled={!note.trim()}
            onClick={() => {
              onResolve(row, decision, note);
              onClose();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ReleaseFundsModal = ({ row, onClose, onConfirm }) => (
  <div className="ad-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="ad-modal ad-modal--sm">
      <div className="ad-modal__header">
        <h3 className="ad-modal__title">Release escrow</h3>
        <button type="button" className="ad-modal__close" onClick={onClose}>
          <IconX />
        </button>
      </div>
      <div className="ad-modal__body">
        <p className="ad-modal__text">
          Release <strong>₦{Number(row.amount).toLocaleString()}</strong> to the vendor for order{" "}
          <strong>{shortId(row.orderId)}</strong>? The order will be marked completed.
        </p>
      </div>
      <div className="ad-modal__footer">
        <button type="button" className="ad-btn ad-btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={() => {
            onConfirm(row.orderId);
            onClose();
          }}
        >
          <IconRelease /> Release
        </button>
      </div>
    </div>
  </div>
);

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [escrows, setEscrows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [txnSearch, setTxnSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [txnFilter, setTxnFilter] = useState("ALL");
  const [disputeModal, setDisputeModal] = useState(null);
  const [releaseModal, setReleaseModal] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [escRes, ordRes, usrRes, venRes] = await Promise.all([
        adminAPI.getEscrows(),
        adminAPI.getOrders(1, 500),
        adminAPI.getUsers(1, 500),
        adminAPI.getVendors(1, 500),
      ]);

      setEscrows(Array.isArray(escRes.data) ? escRes.data : []);
      setOrders(ordRes.data?.orders ?? []);
      setUsersTotal(usrRes.data?.total ?? usrRes.data?.users?.length ?? 0);
      setVendors(venRes.data?.vendors ?? []);
    } catch (e) {
      setLoadError(e.message || "Failed to load admin data. Check that you are logged in as an admin.");
      showToast(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const orderIdToEscrow = useMemo(() => {
    const m = {};
    for (const e of escrows) {
      const oid = e.order?._id ?? e.order;
      if (oid) m[String(oid)] = e;
    }
    return m;
  }, [escrows]);

  const transactionRows = useMemo(() => {
    return orders.map((o) => {
      const e = orderIdToEscrow[String(o._id)];
      const inEscrow = e && (e.status === "HOLDING" || e.status === "INITIATED");
      return {
        id: String(o._id),
        orderId: String(o._id),
        buyer: o.buyer?.name || o.buyer?.email || "—",
        vendor: vendorLabel(o.vendor),
        product: o.product?.name || "—",
        amount: o.totalAmount ?? 0,
        escrow: inEscrow ? e.amount : 0,
        escrowStatus: e?.status,
        status: o.status,
        date: formatDate(o.createdAt),
      };
    });
  }, [orders, orderIdToEscrow]);

  /** Initiated + holding — shown in overview; only HOLDING is actionable via API */
  const attentionEscrows = useMemo(
    () => escrows.filter((e) => e.status === "HOLDING" || e.status === "INITIATED"),
    [escrows],
  );

  const holdingOnly = useMemo(() => escrows.filter((e) => e.status === "HOLDING"), [escrows]);

  const escrowActionRows = useMemo(() => {
    return attentionEscrows.map((e) => {
      const oid = String(e.order?._id ?? e.order ?? "");
      return {
        id: String(e._id),
        orderId: oid,
        buyer: e.buyer?.name || e.buyer?.email || "—",
        vendor: vendorLabel(e.vendor),
        product: e.order?.product?.name || "—",
        amount: e.amount,
        escrowStatus: e.status,
        orderStatus: e.order?.status,
        date: formatDate(e.createdAt),
      };
    });
  }, [attentionEscrows]);

  const vendorRows = useMemo(
    () =>
      vendors.map((v) => ({
        id: String(v._id),
        name: [v.firstName, v.lastName].filter(Boolean).join(" ") || v.user?.name || "—",
        business: v.businessName || "—",
        email: v.user?.email || "—",
        joinDate: formatDate(v.createdAt),
      })),
    [vendors],
  );

  const holdingTotal = useMemo(
    () => escrows.filter((e) => e.status === "HOLDING").reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [escrows],
  );

  const completedRevenue = useMemo(
    () =>
      orders.filter((o) => o.status === "COMPLETED").reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
    [orders],
  );

  const openEscrowCount = attentionEscrows.length;

  const handleResolveDispute = async (row, decision, note) => {
    const action = decision === "buyer" ? "refund" : "release";
    try {
      await adminAPI.resolveDispute(row.orderId, action);
      showToast(action === "refund" ? "Buyer refund processed" : "Funds released to vendor");
      await loadData();
    } catch (e) {
      showToast(e.message || "Action failed");
    }
  };

  const handleReleaseFunds = async (orderId) => {
    try {
      await adminAPI.resolveDispute(orderId, "release");
      showToast("Funds released to vendor");
      await loadData();
    } catch (e) {
      showToast(e.message || "Release failed");
    }
  };

  const filteredTxns = transactionRows
    .filter((t) => txnFilter === "ALL" || t.status === txnFilter)
    .filter(
      (t) =>
        !txnSearch ||
        t.id.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.buyer.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.vendor.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.product.toLowerCase().includes(txnSearch.toLowerCase()),
    );

  const filteredVendors = vendorRows.filter(
    (v) =>
      !vendorSearch ||
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.business.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.email.toLowerCase().includes(vendorSearch.toLowerCase()),
  );

  const NAV = [
    { id: "overview", label: "Overview", Icon: IconHome },
    { id: "transactions", label: "Orders", Icon: IconDollar },
    { id: "escrow", label: "Escrow", Icon: IconLock },
    { id: "vendors", label: "Vendors", Icon: IconUsers },
    { id: "disputes", label: "Escrow actions", Icon: IconAlert },
  ];

  if (loading) {
    return (
      <div className="ad-root" style={{ alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ fontFamily: "DM Sans, sans-serif", color: "#6b8c77" }}>Loading admin data…</p>
      </div>
    );
  }

  return (
    <div className="ad-root">
      <aside className="ad-sidebar">
        <div className="ad-sidebar__brand">
          <span className="ad-brand__mark">AI</span>
          <span className="ad-brand__text">MarketLink</span>
          <span className="ad-brand__admin">ADMIN</span>
        </div>

        <nav className="ad-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`ad-nav-btn${activeSection === n.id ? " active" : ""}`}
              onClick={() => setActiveSection(n.id)}
            >
              <n.Icon />
              <span>{n.label}</span>
              {n.id === "disputes" && openEscrowCount > 0 && (
                <span className="ad-nav-badge">{openEscrowCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar__footer">
          <button type="button" className="ad-sidebar__logout" onClick={() => navigate("/")}>
            <IconLogout /> Back to site
          </button>
        </div>
      </aside>

      <div className="ad-main">
        <header className="ad-topbar">
          <div className="ad-topbar__title">{NAV.find((n) => n.id === activeSection)?.label}</div>
          <div className="ad-topbar__right" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              className="ad-icon-btn ad-icon-btn--verify"
              title="Refresh"
              onClick={() => loadData()}
            >
              <IconRefresh />
            </button>
            <div className="ad-admin-tag">
              <IconShield />
              Super admin
            </div>
          </div>
        </header>

        <div className="ad-content">
          {loadError && (
            <div className="ad-card ad-card--alert" style={{ marginBottom: 16 }}>
              <p style={{ margin: 0, color: "#b91c1c" }}>{loadError}</p>
            </div>
          )}

          {activeSection === "overview" && (
            <div className="ad-section">
              <div className="ad-stats-grid">
                {[
                  {
                    Icon: IconUsers,
                    label: "Registered users",
                    val: usersTotal.toLocaleString(),
                    color: "blue",
                    sub: "All accounts",
                  },
                  {
                    Icon: IconShield,
                    label: "Vendors",
                    val: vendors.length,
                    color: "green",
                    sub: "Onboarded stores",
                  },
                  {
                    Icon: IconDollar,
                    label: "Completed order value",
                    val: `₦${completedRevenue.toLocaleString()}`,
                    color: "gold",
                    sub: "Sum of completed orders",
                  },
                  {
                    Icon: IconLock,
                    label: "In escrow (holding)",
                    val: `₦${holdingTotal.toLocaleString()}`,
                    color: "purple",
                    sub: "Active escrow",
                  },
                  {
                    Icon: IconTrendUp,
                    label: "Orders",
                    val: orders.length,
                    color: "teal",
                    sub: "Loaded page",
                  },
                  {
                    Icon: IconAlert,
                    label: "Escrow queue",
                    val: openEscrowCount,
                    color: "red",
                    sub: "Initiated or holding",
                  },
                ].map((s, i) => (
                  <div key={i} className={`ad-stat-card ad-stat-card--${s.color}`}>
                    <div className="ad-stat-card__icon">
                      <s.Icon />
                    </div>
                    <div className="ad-stat-card__val">{s.val}</div>
                    <div className="ad-stat-card__label">{s.label}</div>
                    <div className="ad-stat-card__sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="ad-card">
                <div className="ad-card__head">
                  <h3 className="ad-card__title">Recent orders</h3>
                  <button type="button" className="ad-link-btn" onClick={() => setActiveSection("transactions")}>
                    View all
                  </button>
                </div>
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Buyer</th>
                        <th>Vendor</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionRows.slice(0, 6).map((t) => {
                        const st = ORDER_STATUS_MAP[t.status] || { label: t.status, color: "gray" };
                        return (
                          <tr key={t.id}>
                            <td className="ad-td-id">{shortId(t.id)}</td>
                            <td>{t.buyer}</td>
                            <td>{t.vendor}</td>
                            <td className="ad-td-amount">₦{Number(t.amount).toLocaleString()}</td>
                            <td>
                              <span className={`ad-status ad-status--${st.color}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {transactionRows.length === 0 && <div className="ad-table-empty">No orders yet</div>}
                </div>
              </div>

              {openEscrowCount > 0 && (
                <div className="ad-card ad-card--alert">
                  <div className="ad-card__head">
                    <h3 className="ad-card__title">
                      <IconAlert /> {openEscrowCount} escrow record{openEscrowCount > 1 ? "s" : ""} need attention
                    </h3>
                    <button type="button" className="ad-link-btn" onClick={() => setActiveSection("disputes")}>
                      Open queue
                    </button>
                  </div>
                  <div className="ad-disputes-mini">
                    {escrowActionRows.slice(0, 4).map((d) => (
                      <div key={d.id} className="ad-dispute-mini">
                        <span className="ad-dispute-mini__id">{shortId(d.orderId)}</span>
                        <span className="ad-dispute-mini__product">{d.product}</span>
                        <span className="ad-dispute-mini__amount">₦{Number(d.amount).toLocaleString()}</span>
                        <span className="ad-dispute-mini__reason">{ESCROW_STATUS_MAP[d.escrowStatus]?.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "transactions" && (
            <div className="ad-section">
              <div className="ad-toolbar">
                <div className="ad-search-box">
                  <IconSearch />
                  <input
                    placeholder="Search orders, buyer, vendor, product…"
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    className="ad-search-input"
                  />
                </div>
                <div className="ad-filter-tabs">
                  {["ALL", "PENDING_PAYMENT", "PAID_IN_ESCROW", "SHIPPED", "COMPLETED", "CANCELLED"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`ad-filter-tab${txnFilter === f ? " active" : ""}`}
                      onClick={() => setTxnFilter(f)}
                    >
                      {f === "ALL" ? "All" : ORDER_STATUS_MAP[f]?.label || f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ad-card">
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Buyer</th>
                        <th>Vendor</th>
                        <th>Product</th>
                        <th>Total</th>
                        <th>Escrow</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxns.map((t) => {
                        const st = ORDER_STATUS_MAP[t.status] || { label: t.status, color: "gray" };
                        const canRelease =
                          t.escrow > 0 && t.escrowStatus === "HOLDING" && t.status === "PAID_IN_ESCROW";
                        return (
                          <tr key={t.id}>
                            <td className="ad-td-id">{shortId(t.id)}</td>
                            <td>{t.buyer}</td>
                            <td>{t.vendor}</td>
                            <td className="ad-td-product">{t.product}</td>
                            <td className="ad-td-amount">₦{Number(t.amount).toLocaleString()}</td>
                            <td className="ad-td-escrow">
                              {t.escrow > 0 ? `₦${Number(t.escrow).toLocaleString()}` : "—"}
                            </td>
                            <td>
                              <span className={`ad-status ad-status--${st.color}`}>{st.label}</span>
                            </td>
                            <td className="ad-td-date">{t.date}</td>
                            <td>
                              {canRelease && (
                                <div className="ad-action-group">
                                  <button
                                    type="button"
                                    className="ad-icon-btn ad-icon-btn--release"
                                    title="Release escrow"
                                    onClick={() => setReleaseModal(t)}
                                  >
                                    <IconRelease />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredTxns.length === 0 && <div className="ad-table-empty">No orders match</div>}
                </div>
              </div>
            </div>
          )}

          {activeSection === "escrow" && (
            <div className="ad-section">
              <div className="ad-escrow-cards">
                {[
                  {
                    label: "Holding (live)",
                    val: `₦${holdingTotal.toLocaleString()}`,
                    color: "gold",
                    Icon: IconLock,
                    sub: "EscrowTransaction status HOLDING",
                  },
                  {
                    label: "Queue (init + holding)",
                    val: openEscrowCount,
                    color: "green",
                    Icon: IconDollar,
                    sub: "Awaiting admin or flow",
                  },
                  {
                    label: "All escrow rows",
                    val: escrows.length,
                    color: "blue",
                    Icon: IconTrendUp,
                    sub: "Loaded from API",
                  },
                ].map((c, i) => (
                  <div key={i} className={`ad-escrow-card ad-escrow-card--${c.color}`}>
                    <div className="ad-escrow-card__icon">
                      <c.Icon />
                    </div>
                    <div className="ad-escrow-card__val">{c.val}</div>
                    <div className="ad-escrow-card__label">{c.label}</div>
                    <div className="ad-escrow-card__sub">{c.sub}</div>
                  </div>
                ))}
              </div>

              <div className="ad-card">
                <div className="ad-card__head">
                  <h3 className="ad-card__title">All escrow transactions</h3>
                </div>
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Escrow</th>
                        <th>Order</th>
                        <th>Buyer</th>
                        <th>Vendor</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Escrow status</th>
                        <th>Order status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escrows.map((e) => {
                        const oid = String(e.order?._id ?? e.order ?? "");
                        const es = ESCROW_STATUS_MAP[e.status] || { label: e.status, color: "gray" };
                        const os = ORDER_STATUS_MAP[e.order?.status] || {
                          label: e.order?.status || "—",
                          color: "gray",
                        };
                        const canAct = e.status === "HOLDING";
                        return (
                          <tr key={String(e._id)}>
                            <td className="ad-td-id">{shortId(e._id)}</td>
                            <td className="ad-td-id">{shortId(oid)}</td>
                            <td>{e.buyer?.name || e.buyer?.email || "—"}</td>
                            <td>{vendorLabel(e.vendor)}</td>
                            <td className="ad-td-product">{e.order?.product?.name || "—"}</td>
                            <td className="ad-td-amount">₦{Number(e.amount).toLocaleString()}</td>
                            <td>
                              <span className={`ad-status ad-status--${es.color}`}>{es.label}</span>
                            </td>
                            <td>
                              <span className={`ad-status ad-status--${os.color}`}>{os.label}</span>
                            </td>
                            <td>
                              {canAct && (
                                <div className="ad-action-group">
                                  <button
                                    type="button"
                                    className="ad-icon-btn ad-icon-btn--release"
                                    title="Refund / release"
                                    onClick={() =>
                                      setDisputeModal({
                                        id: String(e._id),
                                        orderId: oid,
                                        buyer: e.buyer?.name || e.buyer?.email,
                                        vendor: vendorLabel(e.vendor),
                                        product: e.order?.product?.name || "—",
                                        amount: e.amount,
                                        escrowStatus: e.status,
                                      })
                                    }
                                  >
                                    <IconShield />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {escrows.length === 0 && <div className="ad-table-empty">No escrow records</div>}
                </div>
              </div>
            </div>
          )}

          {activeSection === "vendors" && (
            <div className="ad-section">
              <div className="ad-toolbar">
                <div className="ad-search-box">
                  <IconSearch />
                  <input
                    placeholder="Search vendors…"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="ad-search-input"
                  />
                </div>
                <div className="ad-vendor-summary">
                  <span className="ad-vsumm">
                    <span className="ad-vsumm__dot green" />
                    Total: {vendors.length}
                  </span>
                </div>
              </div>
              <div className="ad-card">
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Contact name</th>
                        <th>Business</th>
                        <th>Email</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVendors.map((v) => (
                        <tr key={v.id}>
                          <td className="ad-td-id">{shortId(v.id)}</td>
                          <td className="ad-td-name">{v.name}</td>
                          <td>{v.business}</td>
                          <td className="ad-td-email">{v.email}</td>
                          <td className="ad-td-date">{v.joinDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredVendors.length === 0 && <div className="ad-table-empty">No vendors found</div>}
                </div>
              </div>
            </div>
          )}

          {activeSection === "disputes" && (
            <div className="ad-section">
              <p style={{ color: "#6b8c77", marginBottom: 16, maxWidth: 640 }}>
                Queue lists <strong>INITIATED</strong> and <strong>HOLDING</strong> escrows. Refund and release only apply
                when status is <strong>HOLDING</strong> (payment settled). API:{" "}
                <code style={{ fontSize: "0.85em" }}>POST /api/admin/dispute</code>.
              </p>
              <div className="ad-dispute-cards">
                <div className="ad-dstat ad-dstat--red">
                  <IconAlert />
                  <span className="ad-dstat__val">{openEscrowCount}</span>
                  <span className="ad-dstat__label">In queue</span>
                </div>
                <div className="ad-dstat ad-dstat--gold">
                  <IconDollar />
                  <span className="ad-dstat__val">
                    ₦{holdingOnly.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString()}
                  </span>
                  <span className="ad-dstat__label">Holding amount</span>
                </div>
              </div>

              <div className="ad-disputes-list">
                {escrowActionRows.map((d) => (
                  <div key={d.id} className="ad-dispute-card">
                    <div className="ad-dispute-card__header">
                      <div className="ad-dispute-card__ids">
                        <span className="ad-dispute-card__id">Escrow {shortId(d.id)}</span>
                        <span className="ad-dispute-card__txn">→ order {shortId(d.orderId)}</span>
                      </div>
                      <span className={`ad-status ${d.escrowStatus === "HOLDING" ? "ad-status--gold" : "ad-status--purple"}`}>
                        {ESCROW_STATUS_MAP[d.escrowStatus]?.label || d.escrowStatus}
                      </span>
                    </div>
                    <div className="ad-dispute-card__body">
                      <div className="ad-dispute-card__product">{d.product}</div>
                      <div className="ad-dispute-card__meta">
                        <span>
                          Buyer: <strong>{d.buyer}</strong>
                        </span>
                        <span>
                          Vendor: <strong>{d.vendor}</strong>
                        </span>
                        <span>
                          Amount:{" "}
                          <strong className="ad-td-amount">₦{Number(d.amount).toLocaleString()}</strong>
                        </span>
                        <span>
                          Date: <strong>{d.date}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="ad-dispute-card__actions">
                      {d.escrowStatus === "HOLDING" ? (
                        <>
                          <button
                            type="button"
                            className="ad-btn ad-btn--gold ad-btn--sm"
                            onClick={() => setDisputeModal(d)}
                          >
                            Refund or release
                          </button>
                          <button
                            type="button"
                            className="ad-btn ad-btn--ghost ad-btn--sm"
                            onClick={() => setReleaseModal({ orderId: d.orderId, amount: d.amount })}
                          >
                            Quick release
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.82rem", color: "#6b8c77" }}>
                          Awaiting payment confirmation — no admin release yet
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {escrowActionRows.length === 0 && (
                  <div className="ad-card" style={{ padding: 24 }}>
                    No initiated or holding escrows. You&apos;re all caught up.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {disputeModal && (
        <DisputeModal row={disputeModal} onClose={() => setDisputeModal(null)} onResolve={handleResolveDispute} />
      )}
      {releaseModal && (
        <ReleaseFundsModal
          row={releaseModal}
          onClose={() => setReleaseModal(null)}
          onConfirm={handleReleaseFunds}
        />
      )}

      {toast && (
        <div className="ad-toast">
          <IconCheck />
          {toast}
        </div>
      )}
    </div>
  );
}


// src/pages/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserOrders, confirmBuyerDelivery } from '../services/orderService';
import { initiatePayment } from '../services/paymentService';
import { openPaymentInNewTab } from '../utils/openPaymentLink';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './OrdersPage.css';

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
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

const IconOrdersEmpty = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const STATUS_META = {
  PENDING_PAYMENT: { label: 'Awaiting payment', className: 'ord-badge ord-badge--pending' },
  PAID_IN_ESCROW: { label: 'Paid — in escrow', className: 'ord-badge ord-badge--escrow' },
  SHIPPED: { label: 'Shipped', className: 'ord-badge ord-badge--ship' },
  DELIVERED_PENDING_CONFIRMATION: { label: 'Confirm delivery', className: 'ord-badge ord-badge--ship' },
  COMPLETED: { label: 'Completed', className: 'ord-badge ord-badge--done' },
  CANCELLED: { label: 'Cancelled', className: 'ord-badge ord-badge--cancel' },
};

function formatNgn(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return '—';
  return `₦${x.toLocaleString()}`;
}

function shortOrderId(id) {
  const s = String(id || '');
  if (s.length <= 8) return s;
  return `…${s.slice(-8)}`;
}

function formatOrderedAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

function OrderCard({ order, payingId, paymentLinks, confirmingId, onPay, onConfirmDelivery }) {
  const product = order.product || {};
  const vendor = order.vendor || {};
  const status = STATUS_META[order.status] || {
    label: String(order.status || '—').replace(/_/g, ' '),
    className: 'ord-badge ord-badge--pending',
  };
  const vendorName = vendor.businessName || 'Vendor';
  const isPendingPay = order.status === 'PENDING_PAYMENT';
  const canConfirmReceipt =
    order.status === 'DELIVERED_PENDING_CONFIRMATION' || order.status === 'SHIPPED';
  const orderKey = String(order._id ?? '');
  const payUrl = paymentLinks[orderKey];
  const paying = payingId === orderKey;

  return (
    <article className="ord-card">
      <div className="ord-card__top">
        <div className={`ord-card__img${product.imageUrl ? '' : ' ord-card__img--fallback'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name || 'Product'} />
          ) : (
            <IconPackage />
          )}
        </div>
        <div className="ord-card__meta">
          <div className="ord-card__title-row">
            <div>
              <div className="ord-card__name">{product.name || 'Product'}</div>
              {product.category ? <div className="ord-card__cat">{product.category}</div> : null}
            </div>
            <span className={status.className}>{status.label}</span>
          </div>
          <div className="ord-card__vendor">
            <span className="ord-card__vendor-dot" aria-hidden />
            {vendorName}
          </div>
        </div>
      </div>
      <div className="ord-card__body">
        <div className="ord-card__row">
          <span className="ord-card__label">Order</span>
          <span style={{ fontWeight: 600, fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem' }}>
            {shortOrderId(order._id)}
          </span>
        </div>
        <div className="ord-card__row">
          <span className="ord-card__label">Qty × unit</span>
          <span>
            {order.quantity ?? 1} × {formatNgn(order.unitPrice ?? product.price)}
          </span>
        </div>
        <div className="ord-card__row">
          <span className="ord-card__label">Total</span>
          <span className="ord-card__total">{formatNgn(order.totalAmount)}</span>
        </div>
        <div className="ord-card__row ord-card__row--muted">
          <span>Placed</span>
          <span>{formatOrderedAt(order.createdAt)}</span>
        </div>
        {order.deliveryAddress ? (
          <div className="ord-card__address">
            <IconMapPin />
            <span>{order.deliveryAddress}</span>
          </div>
        ) : null}
        {order.interswitchTransactionRef || order.interswitchRef ? (
          <div className="ord-card__refs">
            {order.interswitchTransactionRef ? (
              <div>Transaction ref: {order.interswitchTransactionRef}</div>
            ) : null}
            {!order.interswitchTransactionRef && order.interswitchRef ? (
              <div>Payment ref: {order.interswitchRef}</div>
            ) : null}
          </div>
        ) : null}
        {isPendingPay ? (
          <div className="ord-pay-row">
            <button type="button" className="ord-pay-btn" disabled={paying} onClick={() => onPay(order)}>
              {paying ? 'Opening payment…' : 'Complete payment'}
            </button>
            {payUrl ? (
              <p className="ord-pay-fallback">
                Pop-up blocked?{' '}
                <a href={payUrl} target="_blank" rel="noopener noreferrer">
                  Open payment link
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
        {canConfirmReceipt ? (
          <div className="ord-pay-row">
            <button
              type="button"
              className="ord-pay-btn ord-pay-btn--confirm"
              disabled={confirmingId === orderKey}
              onClick={() => onConfirmDelivery(order)}
            >
              {confirmingId === orderKey ? 'Confirming…' : 'Confirm delivery — release escrow'}
            </button>
            {order.status === 'SHIPPED' ? (
              <p className="ord-pay-fallback" style={{ marginTop: 8 }}>
                You can confirm as soon as you receive the package. If the vendor marked it delivered, funds release
                after you confirm.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [payError, setPayError] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [paymentLinks, setPaymentLinks] = useState({});

  const loadOrders = useCallback(async () => {
    setLoadError('');
    setPayError('');
    setLoading(true);
    try {
      const data = await fetchUserOrders();
      setOrders(data.items || []);
    } catch (err) {
      console.error('Failed to load orders', err);
      setLoadError(err.response?.data?.message || err.message || 'Could not load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleConfirmDelivery = async (order) => {
    const id = order?._id != null ? String(order._id) : '';
    if (!id) return;
    setConfirmingId(id);
    setPayError('');
    try {
      await confirmBuyerDelivery(id);
      await loadOrders();
    } catch (err) {
      console.error(err);
      setPayError(err.response?.data?.message || err.message || 'Could not confirm delivery.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handlePay = async (order) => {
    const id = order?._id != null ? String(order._id) : '';
    if (!id) return;
    setPayingId(id);
    setPayError('');
    try {
      const body = await initiatePayment(id, {});
      const paymentUrl = body?.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error(body?.message || 'No payment link returned.');
      }
      const { opened } = openPaymentInNewTab(paymentUrl);
      if (!opened) {
        setPaymentLinks((prev) => ({ ...prev, [id]: paymentUrl }));
      }
    } catch (err) {
      console.error(err);
      setPayError(err.response?.data?.message || err.message || 'Could not start payment.');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="ord-page">
      <header className="ord-topbar">
        <button type="button" className="ord-back-btn" onClick={() => navigate('/chat')} aria-label="Back to chat">
          <IconArrowLeft />
        </button>
        <div className="ord-logo">
          <span className="ord-logo__mark">AI</span>
          <span className="ord-logo__text">MarketLink</span>
        </div>
        <span className="ord-topbar__badge">{orders.length} order{orders.length === 1 ? '' : 's'}</span>
      </header>

      <main className="ord-main">
        <div className="ord-header">
          <h1 className="ord-title">My orders</h1>
          <p className="ord-sub">
            Track purchases, escrow status, and complete any pending payments. Funds stay protected until you confirm delivery.
          </p>
        </div>

        {loadError ? (
          <div className="ord-alert ord-alert--error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={loadOrders}>
              Try again
            </button>
          </div>
        ) : null}

        {payError ? (
          <div className="ord-alert ord-alert--error" role="alert">
            <span>{payError}</span>
            <button type="button" onClick={() => setPayError('')}>
              Dismiss
            </button>
          </div>
        ) : null}

        {orders.length === 0 && !loadError ? (
          <div className="ord-empty">
            <div className="ord-empty__icon">
              <IconOrdersEmpty />
            </div>
            <h2>No orders yet</h2>
            <p>Chat with MarketLink AI to find products and check out when you&apos;re ready.</p>
            <button type="button" className="ord-empty__cta" onClick={() => navigate('/chat')}>
              Go to chat
            </button>
          </div>
        ) : null}

        {orders.length > 0 ? (
          <div className="ord-list">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                payingId={payingId}
                confirmingId={confirmingId}
                paymentLinks={paymentLinks}
                onPay={handlePay}
                onConfirmDelivery={handleConfirmDelivery}
              />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Orders;

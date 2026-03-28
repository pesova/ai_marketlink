/**
 * Open Interswitch (or other) checkout in a new browser tab.
 * @returns {{ opened: boolean }} false if likely pop-up blocked.
 */
export function openPaymentInNewTab(paymentUrl) {
  if (!paymentUrl || typeof paymentUrl !== "string") {
    return { opened: false };
  }
  const win = window.open(paymentUrl, "_blank", "noopener,noreferrer");
  if (!win) {
    return { opened: false };
  }
  try {
    win.focus();
  } catch {
    /* ignore */
  }
  return { opened: true };
}

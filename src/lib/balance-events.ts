export const CUSTOMER_BALANCE_UPDATED_EVENT = "matrix-qa-customer-balance-updated";

export function notifyCustomerBalanceUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CUSTOMER_BALANCE_UPDATED_EVENT));
  }
}

export function subscribeToCustomerBalanceUpdates(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CUSTOMER_BALANCE_UPDATED_EVENT, listener);
  return () => window.removeEventListener(CUSTOMER_BALANCE_UPDATED_EVENT, listener);
}

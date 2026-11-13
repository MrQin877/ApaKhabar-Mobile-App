// Invalidate views of the existing stored session after authentication changes.
const listeners = new Set<() => void>();
export function sessionChanged() { listeners.forEach(listener => listener()); }
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

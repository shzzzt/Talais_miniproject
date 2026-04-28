/**
 * Legacy NavigationTracker shim. Inertia handles route logging server-side
 * via the activitylog observer + the AuditTrail middleware, so the client-side
 * tracker is a no-op. Kept as a default export for backward import compatibility.
 */
export default function NavigationTracker() {
    return null;
}

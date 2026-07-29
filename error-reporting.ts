type ReportedErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Reports a client-side error.
 *
 * This currently logs to the console. Wire in a real error-tracking
 * provider here (e.g. Sentry, Highlight, Bugsnag) when you add one —
 * this is the single call site every error boundary funnels through.
 */
export function reportClientError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ReportedErrorOptions = {},
) {
  if (typeof window === "undefined") return;
  console.error(error, {
    source: "react_error_boundary",
    route: window.location.pathname,
    mechanism: options.mechanism ?? "react_error_boundary",
    handled: options.handled ?? false,
    severity: options.severity ?? "error",
    ...context,
  });
}

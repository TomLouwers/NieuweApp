type AnalyticsEvent = {
  name: string;
  props?: Record<string, unknown>;
};

export async function trackEvent(evt: AnalyticsEvent): Promise<void> {
  // no-op scaffold; integrate later
  if (process.env.NODE_ENV === "development") {
    try { console.debug("[analytics]", evt.name, evt.props || {}); } catch {}
  }
}


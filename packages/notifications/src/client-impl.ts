export interface NotificationClientConfig {
  baseUrl: string;
  fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
}

export interface NotificationClient {
  markRead(notificationIds: string[]): Promise<void>;
  markAllRead(): Promise<void>;
  getPreferences(): Promise<PreferencesResponse>;
  updatePreferences(prefs: Record<string, Record<string, boolean>>): Promise<void>;
}

export interface PreferencesResponse {
  preferences: {
    notificationType: string;
    channel: string;
    enabled: boolean;
  }[];
}

export function createNotificationClient(config: NotificationClientConfig): NotificationClient {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const base = config.baseUrl.replace(/\/$/, "");

  async function request(path: string, options?: RequestInit): Promise<Response> {
    const res = await fetchFn(`${base}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`Notification API error (${res.status}): ${text}`);
    }
    return res;
  }

  return {
    async markRead(notificationIds: string[]): Promise<void> {
      await request("/mark-read", {
        method: "POST",
        body: JSON.stringify({ notificationIds }),
      });
    },

    async markAllRead(): Promise<void> {
      await request("/mark-read", {
        method: "POST",
        body: JSON.stringify({ all: true }),
      });
    },

    async getPreferences(): Promise<PreferencesResponse> {
      const res = await request("/preferences");
      return res.json() as Promise<PreferencesResponse>;
    },

    async updatePreferences(prefs: Record<string, Record<string, boolean>>): Promise<void> {
      const updates = Object.entries(prefs).flatMap(([notificationType, channels]) =>
        Object.entries(channels).map(([channel, enabled]) => ({
          notificationType,
          channel,
          enabled,
        })),
      );
      await request("/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: updates }),
      });
    },
  };
}

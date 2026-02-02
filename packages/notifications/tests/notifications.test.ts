import { describe, test, expect } from "bun:test";
import { defineNotification } from "../src/define.ts";
import { createNotificationClient } from "../src/client-impl.ts";

describe("defineNotification", () => {
  test("returns the definition as-is (identity function)", () => {
    const def = defineNotification({
      key: "welcome",
      channels: {
        "in-app": (data: { userName: string }) => ({
          title: `Welcome, ${data.userName}!`,
          body: "Get started.",
        }),
      },
    });

    expect(def.key).toBe("welcome");
    expect(def.channels["in-app"]).toBeFunction();
    expect(def.channels["in-app"]!({ userName: "Alice" })).toEqual({
      title: "Welcome, Alice!",
      body: "Get started.",
    });
  });

  test("supports critical flag", () => {
    const def = defineNotification({
      key: "magic-link",
      critical: true,
      channels: {
        email: (data: { url: string }) => ({
          subject: "Sign in",
          html: `<a href="${data.url}">Sign in</a>`,
          text: `Sign in: ${data.url}`,
        }),
      },
    });

    expect(def.critical).toBe(true);
  });
});

describe("createNotificationClient", () => {
  test("markRead sends correct request", async () => {
    let capturedUrl = "";
    let capturedBody = "";

    const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      capturedBody = init?.body as string;
      return new Response(null, { status: 200 });
    };

    const client = createNotificationClient({
      baseUrl: "/api/notifications",
      fetch: mockFetch,
    });

    await client.markRead(["id-1", "id-2"]);

    expect(capturedUrl).toBe("/api/notifications/mark-read");
    expect(JSON.parse(capturedBody)).toEqual({
      notificationIds: ["id-1", "id-2"],
    });
  });

  test("markAllRead sends correct request", async () => {
    let capturedBody = "";

    const mockFetch = async (_input: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return new Response(null, { status: 200 });
    };

    const client = createNotificationClient({
      baseUrl: "/api/notifications",
      fetch: mockFetch,
    });

    await client.markAllRead();

    expect(JSON.parse(capturedBody)).toEqual({ all: true });
  });

  test("getPreferences returns parsed response", async () => {
    const mockPrefs = {
      preferences: [
        { notificationType: "welcome", channel: "email", enabled: true },
      ],
    };

    const mockFetch = async () => {
      return new Response(JSON.stringify(mockPrefs), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = createNotificationClient({
      baseUrl: "/api/notifications",
      fetch: mockFetch,
    });

    const result = await client.getPreferences();
    expect(result).toEqual(mockPrefs);
  });

  test("updatePreferences flattens nested prefs", async () => {
    let capturedBody = "";

    const mockFetch = async (_input: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return new Response(null, { status: 200 });
    };

    const client = createNotificationClient({
      baseUrl: "/api/notifications",
      fetch: mockFetch,
    });

    await client.updatePreferences({
      welcome: { email: true, "in-app": false },
    });

    const body = JSON.parse(capturedBody);
    expect(body.preferences).toEqual([
      { notificationType: "welcome", channel: "email", enabled: true },
      { notificationType: "welcome", channel: "in-app", enabled: false },
    ]);
  });

  test("throws on non-OK response", async () => {
    const mockFetch = async () => {
      return new Response("Not Found", { status: 404 });
    };

    const client = createNotificationClient({
      baseUrl: "/api/notifications",
      fetch: mockFetch,
    });

    expect(client.markRead(["id-1"])).rejects.toThrow(
      "Notification API error (404)",
    );
  });
});

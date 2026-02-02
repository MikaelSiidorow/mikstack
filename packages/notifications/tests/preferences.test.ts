import { describe, test, expect } from "bun:test";
import { resolveChannelEnabled } from "../src/preferences.ts";
import type { PreferenceRow, DefaultPreferences } from "../src/types.ts";

const defaults: DefaultPreferences = {
  enabledChannels: ["email", "in-app"],
};

function pref(
  notificationType: string,
  channel: string,
  enabled: boolean,
): PreferenceRow {
  return {
    id: crypto.randomUUID(),
    userId: "user-1",
    notificationType,
    channel,
    enabled,
    updatedAt: new Date(),
  };
}

describe("resolveChannelEnabled", () => {
  test("returns true when channel is in system defaults", () => {
    expect(resolveChannelEnabled([], defaults, "welcome", "email")).toBe(true);
    expect(resolveChannelEnabled([], defaults, "welcome", "in-app")).toBe(true);
  });

  test("returns false when channel is not in system defaults", () => {
    expect(resolveChannelEnabled([], defaults, "welcome", "sms")).toBe(false);
  });

  test("exact match (type + channel) takes highest priority", () => {
    const prefs = [
      pref("welcome", "email", false), // Exact: disable email for welcome
      pref("*", "email", true), // Wildcard: enable email globally
    ];
    expect(resolveChannelEnabled(prefs, defaults, "welcome", "email")).toBe(
      false,
    );
  });

  test("type + wildcard channel takes second priority", () => {
    const prefs = [
      pref("welcome", "*", false), // Disable all channels for welcome
      pref("*", "email", true), // Enable email globally
    ];
    expect(resolveChannelEnabled(prefs, defaults, "welcome", "email")).toBe(
      false,
    );
  });

  test("wildcard type + specific channel takes third priority", () => {
    const prefs = [pref("*", "email", false)]; // Disable email globally
    expect(resolveChannelEnabled(prefs, defaults, "welcome", "email")).toBe(
      false,
    );
    // in-app should still use defaults
    expect(resolveChannelEnabled(prefs, defaults, "welcome", "in-app")).toBe(
      true,
    );
  });

  test("more specific preference overrides less specific", () => {
    const prefs = [
      pref("*", "email", false), // Disable email globally
      pref("magic-link", "email", true), // But enable for magic-link
    ];
    expect(
      resolveChannelEnabled(prefs, defaults, "magic-link", "email"),
    ).toBe(true);
    expect(resolveChannelEnabled(prefs, defaults, "welcome", "email")).toBe(
      false,
    );
  });

  test("user can opt out of specific notification type", () => {
    const prefs = [pref("marketing", "*", false)];
    expect(
      resolveChannelEnabled(prefs, defaults, "marketing", "email"),
    ).toBe(false);
    expect(
      resolveChannelEnabled(prefs, defaults, "marketing", "in-app"),
    ).toBe(false);
    // Other types still use defaults
    expect(resolveChannelEnabled(prefs, defaults, "welcome", "email")).toBe(
      true,
    );
  });
});

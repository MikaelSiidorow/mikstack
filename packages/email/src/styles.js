/** @import { StyleProps } from "./types.d.ts" */

/** Properties where numeric values should NOT get 'px' appended */
const UNITLESS_PROPERTIES = new Set(["fontWeight", "lineHeight"]);

/**
 * Convert a camelCase string to kebab-case.
 * @param {string} str
 * @returns {string}
 */
export function camelToKebab(str) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Format a CSS property value, auto-adding 'px' for numeric values.
 * @param {string} prop - The camelCase property name
 * @param {string | number} value
 * @returns {string}
 */
export function formatValue(prop, value) {
  if (typeof value === "number" && !UNITLESS_PROPERTIES.has(prop)) {
    return `${value}px`;
  }
  return String(value);
}

/**
 * Format a padding value. Handles number, [vertical, horizontal], and [top, right, bottom, left] tuples.
 * @param {number | [number, number] | [number, number, number, number] | string} padding
 * @returns {string}
 */
export function formatPadding(padding) {
  if (Array.isArray(padding)) {
    if (padding.length === 4) {
      return `${padding[0]}px ${padding[1]}px ${padding[2]}px ${padding[3]}px`;
    }
    return `${padding[0]}px ${padding[1]}px`;
  }
  if (typeof padding === "number") {
    return `${padding}px`;
  }
  return padding;
}

/**
 * Convert a style object to an inline CSS string.
 * Expects a clean CSS-only object (prop/style separation happens at component level).
 * @param {StyleProps} styles
 * @returns {string}
 */
export function styleObjectToString(styles) {
  const parts = [];
  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (key === "padding") {
      parts.push(
        `padding:${formatPadding(/** @type {number | [number, number] | [number, number, number, number] | string} */ (value))}`,
      );
    } else {
      parts.push(
        `${camelToKebab(key)}:${formatValue(key, /** @type {string | number} */ (value))}`,
      );
    }
  }
  return parts.join(";");
}

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render an attributes object to an HTML attribute string.
 * @param {Record<string, string>} attrs
 * @returns {string}
 */
export function renderAttrs(attrs) {
  const parts = [];
  for (const [key, value] of Object.entries(attrs)) {
    parts.push(` ${key}="${escapeHtml(String(value))}"`);
  }
  return parts.join("");
}

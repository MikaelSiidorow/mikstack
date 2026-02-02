import { describe, test, expect } from "bun:test";
import {
  camelToKebab,
  formatValue,
  formatPadding,
  styleObjectToString,
  escapeHtml,
  renderAttrs,
} from "./styles.js";

describe("camelToKebab", () => {
  test("converts camelCase to kebab-case", () => {
    expect(camelToKebab("fontSize")).toBe("font-size");
    expect(camelToKebab("backgroundColor")).toBe("background-color");
    expect(camelToKebab("borderTopWidth")).toBe("border-top-width");
  });

  test("leaves lowercase strings unchanged", () => {
    expect(camelToKebab("color")).toBe("color");
    expect(camelToKebab("margin")).toBe("margin");
  });

  test("handles empty string", () => {
    expect(camelToKebab("")).toBe("");
  });
});

describe("formatValue", () => {
  test("adds px to numeric values", () => {
    expect(formatValue("fontSize", 16)).toBe("16px");
    expect(formatValue("padding", 20)).toBe("20px");
    expect(formatValue("width", 600)).toBe("600px");
  });

  test("does not add px to unitless properties", () => {
    expect(formatValue("fontWeight", 700)).toBe("700");
    expect(formatValue("lineHeight", 1.5)).toBe("1.5");
  });

  test("passes strings through unchanged", () => {
    expect(formatValue("color", "#333")).toBe("#333");
    expect(formatValue("fontFamily", "Arial, sans-serif")).toBe("Arial, sans-serif");
    expect(formatValue("width", "100%")).toBe("100%");
  });

  test("handles zero", () => {
    expect(formatValue("margin", 0)).toBe("0px");
    expect(formatValue("fontWeight", 0)).toBe("0");
  });
});

describe("formatPadding", () => {
  test("formats number with px", () => {
    expect(formatPadding(20)).toBe("20px");
    expect(formatPadding(0)).toBe("0px");
  });

  test("formats [vertical, horizontal] tuple", () => {
    expect(formatPadding([12, 24])).toBe("12px 24px");
    expect(formatPadding([0, 10])).toBe("0px 10px");
  });

  test("formats [top, right, bottom, left] tuple", () => {
    expect(formatPadding([32, 24, 0, 24])).toBe("32px 24px 0px 24px");
    expect(formatPadding([16, 24, 32, 24])).toBe("16px 24px 32px 24px");
  });

  test("passes string through unchanged", () => {
    expect(formatPadding("10px 20px 30px")).toBe("10px 20px 30px");
  });
});

describe("styleObjectToString", () => {
  test("converts style object to inline CSS", () => {
    const result = styleObjectToString({ fontSize: 16, color: "#333" });
    expect(result).toBe("font-size:16px;color:#333");
  });

  test("handles padding tuple", () => {
    const result = styleObjectToString({ padding: [12, 24] });
    expect(result).toBe("padding:12px 24px");
  });

  test("handles padding number", () => {
    const result = styleObjectToString({ padding: 20 });
    expect(result).toBe("padding:20px");
  });

  test("renders maxWidth as CSS (filtering is component responsibility)", () => {
    const result = styleObjectToString({ maxWidth: 600, color: "red" });
    expect(result).toBe("max-width:600px;color:red");
  });

  test("filters out undefined and null values", () => {
    const result = styleObjectToString({
      fontSize: 16,
      color: /** @type {any} */ (undefined),
      backgroundColor: /** @type {any} */ (null),
    });
    expect(result).toBe("font-size:16px");
  });

  test("returns empty string for empty object", () => {
    expect(styleObjectToString({})).toBe("");
  });

  test("handles unitless properties", () => {
    const result = styleObjectToString({ fontWeight: 700, lineHeight: 1.5 });
    expect(result).toBe("font-weight:700;line-height:1.5");
  });
});

describe("escapeHtml", () => {
  test("escapes ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  test("escapes angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  test("escapes double quotes", () => {
    expect(escapeHtml('a "b" c')).toBe("a &quot;b&quot; c");
  });

  test("escapes all special characters together", () => {
    expect(escapeHtml('<a href="x&y">')).toBe("&lt;a href=&quot;x&amp;y&quot;&gt;");
  });

  test("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("returns plain text unchanged", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
  });
});

describe("renderAttrs", () => {
  test("renders attributes to HTML string", () => {
    expect(renderAttrs({ target: "_blank" })).toBe(' target="_blank"');
  });

  test("renders multiple attributes", () => {
    const result = renderAttrs({ target: "_blank", rel: "noopener" });
    expect(result).toBe(' target="_blank" rel="noopener"');
  });

  test("escapes attribute values", () => {
    expect(renderAttrs({ title: 'a "b" c' })).toBe(' title="a &quot;b&quot; c"');
  });

  test("returns empty string for empty object", () => {
    expect(renderAttrs({})).toBe("");
  });
});

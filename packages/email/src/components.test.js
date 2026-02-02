import { describe, test, expect } from "bun:test";
import {
  html,
  body,
  section,
  row,
  column,
  text,
  button,
  image,
  link,
  divider,
  raw,
} from "./components.js";

describe("html", () => {
  test("creates html node with body child", () => {
    const bodyNode = body([text("Hello")]);
    const node = html(bodyNode);
    expect(node.type).toBe("html");
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe(bodyNode);
  });

  test("extracts lang and dir as props", () => {
    const node = html(body([text("Hello")]), { lang: "ar", dir: "rtl" });
    expect(node.props.lang).toBe("ar");
    expect(node.props.dir).toBe("rtl");
  });
});

describe("body", () => {
  test("creates body node with children array", () => {
    const child = text("Hello");
    const node = body([child]);
    expect(node.type).toBe("body");
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe(child);
  });

  test("normalizes single child to array", () => {
    const child = text("Hello");
    const node = body(child);
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe(child);
  });

  test("extracts maxWidth as prop", () => {
    const node = body([text("Hello")], { maxWidth: 600 });
    expect(node.props.maxWidth).toBe(600);
  });
});

describe("section", () => {
  test("creates section node", () => {
    const node = section([text("A"), text("B")]);
    expect(node.type).toBe("section");
    expect(node.children).toHaveLength(2);
  });

  test("applies styles", () => {
    const node = section([text("A")], { padding: 20, backgroundColor: "#f5f5f5" });
    expect(node.styles.padding).toBe(20);
    expect(node.styles.backgroundColor).toBe("#f5f5f5");
  });

  test("extracts attr as prop", () => {
    const node = section([text("A")], { attr: { id: "header" } });
    expect(node.props.attr).toEqual({ id: "header" });
  });

  test("keeps maxWidth as CSS style (only body extracts it as prop)", () => {
    const node = section([text("A")], { maxWidth: 400 });
    expect(node.styles.maxWidth).toBe(400);
    expect(node.props.maxWidth).toBeUndefined();
  });
});

describe("row", () => {
  test("creates row node with column children", () => {
    const col1 = column([text("A")]);
    const col2 = column([text("B")]);
    const node = row([col1, col2]);
    expect(node.type).toBe("row");
    expect(node.children).toHaveLength(2);
  });
});

describe("column", () => {
  test("creates column node", () => {
    const node = column([text("A")]);
    expect(node.type).toBe("column");
    expect(node.children).toHaveLength(1);
  });

  test("keeps width as CSS style, not prop", () => {
    const node = column([text("A")], { width: "50%" });
    expect(node.styles.width).toBe("50%");
    expect(node.props.width).toBeUndefined();
  });
});

describe("text", () => {
  test("creates text node with string content", () => {
    const node = text("Hello");
    expect(node.type).toBe("text");
    expect(node.children).toEqual(["Hello"]);
  });

  test("separates styles from props", () => {
    const node = text("Hello", { fontSize: 16, color: "#333", dir: "rtl" });
    expect(node.styles.fontSize).toBe(16);
    expect(node.styles.color).toBe("#333");
    expect(node.props.dir).toBe("rtl");
  });
});

describe("button", () => {
  test("creates button node with label and href", () => {
    const node = button("Click me", { href: "https://example.com" });
    expect(node.type).toBe("button");
    expect(node.children).toEqual(["Click me"]);
    expect(node.props.href).toBe("https://example.com");
  });

  test("separates styles from props", () => {
    const node = button("Click", {
      href: "https://example.com",
      backgroundColor: "#007bff",
      color: "#ffffff",
      padding: [12, 24],
    });
    expect(node.props.href).toBe("https://example.com");
    expect(node.styles.backgroundColor).toBe("#007bff");
    expect(node.styles.color).toBe("#ffffff");
    expect(node.styles.padding).toEqual([12, 24]);
  });
});

describe("image", () => {
  test("creates image node with src", () => {
    const node = image({ src: "logo.png", alt: "Logo" });
    expect(node.type).toBe("image");
    expect(node.props.src).toBe("logo.png");
    expect(node.props.alt).toBe("Logo");
    expect(node.children).toHaveLength(0);
  });

  test("extracts width and height as props, not styles", () => {
    const node = image({ src: "logo.png", alt: "Logo", width: 200, height: 50 });
    expect(node.props.width).toBe(200);
    expect(node.props.height).toBe(50);
    // width/height should NOT be in styles for image
    expect(node.styles.width).toBeUndefined();
    expect(node.styles.height).toBeUndefined();
  });

  test("keeps other CSS as styles", () => {
    const node = image({ src: "logo.png", alt: "", width: 200, borderRadius: 8 });
    expect(node.props.width).toBe(200);
    expect(node.styles.borderRadius).toBe(8);
  });
});

describe("link", () => {
  test("creates link node with string content", () => {
    const node = link("Click here", { href: "https://example.com" });
    expect(node.type).toBe("link");
    expect(node.children).toEqual(["Click here"]);
    expect(node.props.href).toBe("https://example.com");
  });

  test("creates link node wrapping a child node", () => {
    const child = text("Click");
    const node = link(child, { href: "https://example.com" });
    expect(node.children[0]).toBe(child);
  });
});

describe("divider", () => {
  test("creates divider node", () => {
    const node = divider();
    expect(node.type).toBe("divider");
    expect(node.children).toHaveLength(0);
  });

  test("accepts style props", () => {
    const node = divider({ borderColor: "#ccc", borderWidth: 2 });
    expect(node.styles.borderColor).toBe("#ccc");
    expect(node.styles.borderWidth).toBe(2);
  });
});

describe("raw", () => {
  test("creates raw node with HTML content", () => {
    const node = raw("<b>Bold</b>");
    expect(node.type).toBe("raw");
    expect(node.children).toEqual(["<b>Bold</b>"]);
  });
});

describe("validation", () => {
  test("button throws on missing href", () => {
    expect(() => button("Click", /** @type {any} */ ({}))).toThrow(
      "button: 'href' prop is required",
    );
  });

  test("button throws on non-string label", () => {
    expect(() =>
      button(/** @type {any} */ (text("Click")), { href: "https://example.com" }),
    ).toThrow("button: 'label' must be a string");
  });

  test("image throws on missing src", () => {
    expect(() => image(/** @type {any} */ ({}))).toThrow("image: 'src' prop is required");
  });

  test("link throws on missing href", () => {
    expect(() => link("Click", /** @type {any} */ ({}))).toThrow("link: 'href' prop is required");
  });
});

describe("composition", () => {
  test("spread composition works", () => {
    const base = { fontSize: 16 };
    const bold = { fontWeight: /** @type {const} */ ("bold") };
    const node = text("Hello", { ...base, ...bold });
    expect(node.styles.fontSize).toBe(16);
    expect(node.styles.fontWeight).toBe("bold");
  });

  test("nested structure is correct", () => {
    const email = html(
      body([section([text("Hello"), text("World")], { padding: 20 })], { maxWidth: 600 }),
      { lang: "en" },
    );
    expect(email.type).toBe("html");
    expect(email.props.lang).toBe("en");

    const bodyNode = /** @type {import("./types.d.ts").EmailNode} */ (email.children[0]);
    expect(bodyNode.type).toBe("body");
    expect(bodyNode.props.maxWidth).toBe(600);

    const sectionNode = /** @type {import("./types.d.ts").EmailNode} */ (bodyNode.children[0]);
    expect(sectionNode.type).toBe("section");
    expect(sectionNode.styles.padding).toBe(20);
    expect(sectionNode.children).toHaveLength(2);
  });
});

import { describe, test, expect } from "bun:test";
import { render } from "./render.js";
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

describe("render text", () => {
  test("renders text as paragraph with default margin", () => {
    const output = render(text("Hello"));
    expect(output).toContain("<p");
    expect(output).toContain("margin:0");
    expect(output).toContain("Hello");
    expect(output).toContain("</p>");
  });

  test("applies styles", () => {
    const output = render(text("Hello", { fontSize: 16, color: "#333" }));
    expect(output).toContain("font-size:16px");
    expect(output).toContain("color:#333");
  });

  test("escapes HTML in content", () => {
    const output = render(text("<script>alert('xss')</script>"));
    expect(output).toContain("&lt;script&gt;");
    expect(output).not.toContain("<script>");
  });

  test("applies dir attribute", () => {
    const output = render(text("مرحبا", { dir: "rtl" }));
    expect(output).toContain('dir="rtl"');
  });
});

describe("render button", () => {
  test("renders VML conditional and CSS fallback", () => {
    const output = render(button("Click me", { href: "https://example.com" }));
    expect(output).toContain("<!--[if mso]>");
    expect(output).toContain("v:roundrect");
    expect(output).toContain("<!--[if !mso]><!-->");
    expect(output).toContain('<a href="https://example.com"');
    expect(output).toContain("Click me");
    expect(output).toContain("display:inline-block");
  });

  test("applies custom colors", () => {
    const output = render(
      button("Go", {
        href: "https://example.com",
        backgroundColor: "#ff0000",
        color: "#000000",
      }),
    );
    expect(output).toContain("background-color:#ff0000");
    expect(output).toContain("color:#000000");
    expect(output).toContain('fillcolor="#ff0000"');
  });

  test("applies padding tuple", () => {
    const output = render(button("Go", { href: "https://example.com", padding: [12, 24] }));
    expect(output).toContain("padding:12px 24px");
  });

  test("applies custom border-radius", () => {
    const output = render(button("Go", { href: "https://example.com", borderRadius: 8 }));
    expect(output).toContain("border-radius:8px");
  });
});

describe("render image", () => {
  test("renders img with defaults", () => {
    const output = render(image({ src: "logo.png", alt: "Logo" }));
    expect(output).toContain('<img src="logo.png"');
    expect(output).toContain('alt="Logo"');
    expect(output).toContain("display:block");
    expect(output).toContain("border:0");
  });

  test("renders dimensions as both HTML attributes and CSS", () => {
    const output = render(image({ src: "logo.png", alt: "Logo", width: 200, height: 50 }));
    // HTML attributes (for Outlook)
    expect(output).toContain('width="200"');
    expect(output).toContain('height="50"');
    // CSS (for modern clients)
    expect(output).toContain("width:200px");
    expect(output).toContain("height:50px");
  });

  test("renders empty alt when not provided", () => {
    const output = render(image({ src: "logo.png" }));
    expect(output).toContain('alt=""');
  });
});

describe("render link", () => {
  test("renders anchor with string content", () => {
    const output = render(link("Click", { href: "https://example.com" }));
    expect(output).toContain('<a href="https://example.com"');
    expect(output).toContain("Click</a>");
  });

  test("renders anchor wrapping child node", () => {
    const child = text("Click");
    const output = render(link(child, { href: "https://example.com" }));
    expect(output).toContain('<a href="https://example.com"');
    expect(output).toContain("<p");
  });

  test("applies styles", () => {
    const output = render(link("Click", { href: "https://example.com", color: "#007bff" }));
    expect(output).toContain("color:#007bff");
  });
});

describe("render section", () => {
  test("renders as tr>td", () => {
    const output = render(section([text("Hello")]));
    expect(output).toContain("<tr>");
    expect(output).toContain("<td");
    expect(output).toContain("</td>");
    expect(output).toContain("</tr>");
  });

  test("applies styles to td", () => {
    const output = render(section([text("Hello")], { padding: 20, backgroundColor: "#f5f5f5" }));
    expect(output).toContain("padding:20px");
    expect(output).toContain("background-color:#f5f5f5");
  });
});

describe("render row and column", () => {
  test("renders row with nested table", () => {
    const output = render(row([column([text("A")]), column([text("B")])]));
    expect(output).toContain("<tr>");
    expect(output).toContain('role="presentation"');
    expect(output).toContain("width:100%");
  });

  test("column has vertical-align:top default", () => {
    const output = render(column([text("A")]));
    expect(output).toContain("vertical-align:top");
  });
});

describe("render divider", () => {
  test("renders border-based divider", () => {
    const output = render(divider());
    expect(output).toContain("border-top:");
    expect(output).toContain("#cccccc");
  });

  test("applies custom border color and width", () => {
    const output = render(divider({ borderColor: "#ff0000", borderWidth: 2 }));
    expect(output).toContain("2px solid #ff0000");
  });
});

describe("render raw", () => {
  test("passes through unescaped HTML", () => {
    const output = render(raw("<b>Bold</b>"));
    expect(output).toBe("<b>Bold</b>");
  });
});

describe("render body", () => {
  test("renders centered table wrapper", () => {
    const output = render(body([text("Hello")]));
    expect(output).toContain("margin:0;padding:0");
    expect(output).toContain('role="article"');
    expect(output).toContain("margin:0 auto");
  });

  test("applies maxWidth", () => {
    const output = render(body([text("Hello")], { maxWidth: 500 }));
    expect(output).toContain("max-width:500px");
    expect(output).toContain('width="500"');
  });

  test("renders Outlook ghost table", () => {
    const output = render(body([text("Hello")], { maxWidth: 600 }));
    expect(output).toContain("<!--[if mso]>");
    expect(output).toContain('width="600"');
    expect(output).toContain("<!--[if mso]></td></tr></table><![endif]-->");
  });
});

describe("render html", () => {
  test("renders DOCTYPE and full structure", () => {
    const output = render(html(body([text("Hello")])));
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("<html");
    expect(output).toContain("xmlns:v=");
    expect(output).toContain("xmlns:o=");
    expect(output).toContain("<head>");
    expect(output).toContain('charset="utf-8"');
    expect(output).toContain("x-apple-disable-message-reformatting");
    expect(output).toContain("format-detection");
    expect(output).toContain("PixelsPerInch");
    expect(output).toContain("</html>");
  });

  test("applies lang and dir", () => {
    const output = render(html(body([text("مرحبا")]), { lang: "ar", dir: "rtl" }));
    expect(output).toContain('lang="ar"');
    expect(output).toContain('dir="rtl"');
  });
});

describe("render full email", () => {
  test("renders complete email structure", () => {
    const email = html(
      body(
        [
          section(
            [text("Welcome", { fontSize: 24, fontWeight: "bold" }), text("Thanks for signing up")],
            { padding: 20, backgroundColor: "#f5f5f5" },
          ),
          section(
            [
              text("Click below to verify:"),
              button("Verify Email", {
                href: "https://example.com/verify",
                backgroundColor: "#007bff",
                color: "#ffffff",
                padding: [12, 24],
                borderRadius: 4,
              }),
            ],
            { padding: 20 },
          ),
        ],
        { maxWidth: 600 },
      ),
    );

    const output = render(email);
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("Welcome");
    expect(output).toContain("Thanks for signing up");
    expect(output).toContain("Verify Email");
    expect(output).toContain("https://example.com/verify");
    expect(output).toContain("font-size:24px");
    expect(output).toContain("font-weight:bold");
    expect(output).toContain("background-color:#f5f5f5");
    expect(output).toContain("padding:12px 24px");
  });
});

describe("pretty printing", () => {
  test("adds indentation and newlines", () => {
    const output = render(text("Hello"), { pretty: true });
    expect(output).toContain("\n");
  });

  test("full email is indented", () => {
    const email = html(body([section([text("Hello")])]));
    const output = render(email, { pretty: true });
    const lines = output.split("\n");
    expect(lines.length).toBeGreaterThan(5);
    // Should have indented lines
    expect(lines.some((line) => line.startsWith("  "))).toBe(true);
  });
});

describe("plain text rendering", () => {
  test("strips HTML and returns plain text", () => {
    const output = render(text("Hello world"), { plainText: true });
    expect(output).toBe("Hello world");
  });

  test("renders button as label (url)", () => {
    const output = render(button("Click me", { href: "https://example.com" }), { plainText: true });
    expect(output).toBe("Click me (https://example.com)");
  });

  test("renders image as [alt]", () => {
    const output = render(image({ src: "logo.png", alt: "Logo" }), {
      plainText: true,
    });
    expect(output).toBe("[Logo]");
  });

  test("renders divider as ---", () => {
    const output = render(divider(), { plainText: true });
    expect(output).toBe("---");
  });

  test("renders full email as plain text", () => {
    const email = html(
      body([
        section([
          text("Welcome"),
          text("Thanks for signing up"),
          button("Verify", { href: "https://example.com" }),
        ]),
      ]),
    );
    const output = render(email, { plainText: true });
    expect(output).toContain("Welcome");
    expect(output).toContain("Thanks for signing up");
    expect(output).toContain("Verify (https://example.com)");
  });
});

describe("custom attributes", () => {
  test("applies attr to section", () => {
    const output = render(section([text("Hello")], { attr: { id: "header" } }));
    expect(output).toContain('id="header"');
  });

  test("applies attr to button", () => {
    const output = render(
      button("Click", {
        href: "https://example.com",
        attr: { target: "_blank", rel: "noopener" },
      }),
    );
    expect(output).toContain('target="_blank"');
    expect(output).toContain('rel="noopener"');
  });
});

describe("deeply nested structures", () => {
  test("renders deeply nested content", () => {
    const email = html(body([section([row([column([text("Col 1")]), column([text("Col 2")])])])]));
    const output = render(email);
    expect(output).toContain("Col 1");
    expect(output).toContain("Col 2");
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("</html>");
  });
});

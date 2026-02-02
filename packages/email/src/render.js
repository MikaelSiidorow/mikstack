/** @import { EmailNode, HtmlNode, BodyNode, SectionNode, RowNode, ColumnNode, TextNode, ButtonNode, ImageNode, LinkNode, DividerNode, RawNode, RenderOptions, StyleProps } from "./types.d.ts" */

import { styleObjectToString, escapeHtml, renderAttrs, formatPadding } from "./styles.js";

/**
 * @typedef {{ pretty: boolean, indent: number }} RenderContext
 */

const TABLE_ATTRS = ' role="presentation" cellpadding="0" cellspacing="0" border="0"';

/**
 * Generate indentation string.
 * @param {RenderContext} ctx
 * @returns {string}
 */
function ind(ctx) {
  if (!ctx.pretty) return "";
  return "  ".repeat(ctx.indent);
}

/**
 * Generate newline if pretty printing.
 * @param {RenderContext} ctx
 * @returns {string}
 */
function nl(ctx) {
  return ctx.pretty ? "\n" : "";
}

/**
 * Build a style attribute string from defaults + user styles.
 * @param {Readonly<StyleProps>} styles
 * @param {Record<string, string>} [defaults]
 * @returns {string}
 */
function styleAttr(styles, defaults) {
  const defaultCSS = defaults
    ? Object.entries(defaults)
        .map(([k, v]) => `${k}:${v}`)
        .join(";")
    : "";
  const customCSS = styleObjectToString(styles);
  const combined = [defaultCSS, customCSS].filter(Boolean).join(";");
  return combined ? ` style="${combined}"` : "";
}

/**
 * Get custom HTML attributes string.
 * @param {{ attr?: Record<string, string> }} props
 * @returns {string}
 */
function customAttrs(props) {
  return props.attr ? renderAttrs(props.attr) : "";
}

/**
 * Render children nodes.
 * @param {readonly (EmailNode | string)[]} children
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderChildren(children, ctx) {
  return children
    .map((child) => {
      if (typeof child === "string") return child;
      return renderNode(child, ctx);
    })
    .join("");
}

// --- Plain text renderers ---

/**
 * Render a node as plain text.
 * @param {EmailNode} node
 * @returns {string}
 */
function renderPlainText(node) {
  switch (node.type) {
    case "html":
    case "body":
    case "section":
    case "row":
    case "column":
      return renderPlainTextChildren(node.children);
    case "text":
      return renderPlainTextChildren(node.children) + "\n\n";
    case "button":
      return `${renderPlainTextChildren(node.children)} (${node.props.href})\n\n`;
    case "image":
      return node.props.alt ? `[${node.props.alt}]\n\n` : "";
    case "link":
      return `${renderPlainTextChildren(node.children)} (${node.props.href})`;
    case "divider":
      return "---\n\n";
    case "raw":
      return renderPlainTextChildren(node.children);
  }
}

/**
 * @param {readonly (EmailNode | string)[]} children
 * @returns {string}
 */
function renderPlainTextChildren(children) {
  return children
    .map((child) => {
      if (typeof child === "string") return child;
      return renderPlainText(child);
    })
    .join("");
}

// --- HTML renderers ---

/**
 * @param {HtmlNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderHtml(node, ctx) {
  const lang = node.props.lang ? ` lang="${escapeHtml(node.props.lang)}"` : "";
  const dir = node.props.dir ? ` dir="${escapeHtml(node.props.dir)}"` : "";
  const attrs = customAttrs(node.props);
  const c1 = { ...ctx, indent: ctx.indent + 1 };
  const c2 = { ...ctx, indent: ctx.indent + 2 };

  return (
    `<!DOCTYPE html>${nl(ctx)}` +
    `<html${lang}${dir} xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"${attrs}>${nl(ctx)}` +
    `${ind(c1)}<head>${nl(ctx)}` +
    `${ind(c2)}<meta charset="utf-8">${nl(ctx)}` +
    `${ind(c2)}<meta name="viewport" content="width=device-width, initial-scale=1">${nl(ctx)}` +
    `${ind(c2)}<meta http-equiv="X-UA-Compatible" content="IE=edge">${nl(ctx)}` +
    `${ind(c2)}<meta name="x-apple-disable-message-reformatting">${nl(ctx)}` +
    `${ind(c2)}<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">${nl(ctx)}` +
    `${ind(c2)}<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->${nl(ctx)}` +
    `${ind(c1)}</head>${nl(ctx)}` +
    renderChildren(node.children, c1) +
    `</html>`
  );
}

/**
 * @param {BodyNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderBody(node, ctx) {
  const maxWidth = node.props.maxWidth;
  const maxWidthValue =
    typeof maxWidth === "number"
      ? `${maxWidth}px`
      : typeof maxWidth === "string"
        ? maxWidth
        : "600px";
  const maxWidthNum =
    typeof maxWidth === "number"
      ? maxWidth
      : typeof maxWidth === "string"
        ? parseInt(maxWidth, 10)
        : 600;
  const style = styleObjectToString(node.styles);
  const bodyStyle = style ? `;${style}` : "";
  const attrs = customAttrs(node.props);
  const c1 = { ...ctx, indent: ctx.indent + 1 };
  const c2 = { ...ctx, indent: ctx.indent + 2 };
  const c3 = { ...ctx, indent: ctx.indent + 3 };

  return (
    `${ind(ctx)}<body style="margin:0;padding:0;word-spacing:normal${bodyStyle}"${attrs}>${nl(ctx)}` +
    `${ind(c1)}<div role="article" aria-roledescription="email" style="font-size:medium;font-family:Arial,sans-serif">${nl(ctx)}` +
    `${ind(c2)}<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${maxWidthNum}" align="center" style="width:${maxWidthValue}"><tr><td><![endif]-->${nl(ctx)}` +
    `${ind(c2)}<table${TABLE_ATTRS} style="margin:0 auto;max-width:${maxWidthValue};width:100%">${nl(ctx)}` +
    renderChildren(node.children, c3) +
    `${ind(c2)}</table>${nl(ctx)}` +
    `${ind(c2)}<!--[if mso]></td></tr></table><![endif]-->${nl(ctx)}` +
    `${ind(c1)}</div>${nl(ctx)}` +
    `${ind(ctx)}</body>`
  );
}

/**
 * @param {SectionNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderSection(node, ctx) {
  const style = styleAttr(node.styles);
  const attrs = customAttrs(node.props);
  const c1 = { ...ctx, indent: ctx.indent + 1 };
  const c2 = { ...ctx, indent: ctx.indent + 2 };

  return (
    `${ind(ctx)}<tr>${nl(ctx)}` +
    `${ind(c1)}<td${style}${attrs}>${nl(ctx)}` +
    renderChildren(node.children, c2) +
    `${ind(c1)}</td>${nl(ctx)}` +
    `${ind(ctx)}</tr>${nl(ctx)}`
  );
}

/**
 * @param {RowNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderRow(node, ctx) {
  const style = styleAttr(node.styles);
  const attrs = customAttrs(node.props);
  const c1 = { ...ctx, indent: ctx.indent + 1 };
  const c2 = { ...ctx, indent: ctx.indent + 2 };
  const c3 = { ...ctx, indent: ctx.indent + 3 };
  const c4 = { ...ctx, indent: ctx.indent + 4 };

  return (
    `${ind(ctx)}<tr>${nl(ctx)}` +
    `${ind(c1)}<td${style}${attrs}>${nl(ctx)}` +
    `${ind(c2)}<table${TABLE_ATTRS} width="100%" style="width:100%">${nl(ctx)}` +
    `${ind(c3)}<tr>${nl(ctx)}` +
    renderChildren(node.children, c4) +
    `${ind(c3)}</tr>${nl(ctx)}` +
    `${ind(c2)}</table>${nl(ctx)}` +
    `${ind(c1)}</td>${nl(ctx)}` +
    `${ind(ctx)}</tr>${nl(ctx)}`
  );
}

/**
 * @param {ColumnNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderColumn(node, ctx) {
  const style = styleAttr(node.styles, { "vertical-align": "top" });
  const attrs = customAttrs(node.props);
  const c1 = { ...ctx, indent: ctx.indent + 1 };

  return (
    `${ind(ctx)}<td${style}${attrs}>${nl(ctx)}` +
    renderChildren(node.children, c1) +
    `${ind(ctx)}</td>${nl(ctx)}`
  );
}

/**
 * @param {TextNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderText(node, ctx) {
  const style = styleAttr(node.styles, { margin: "0" });
  const dir = node.props.dir ? ` dir="${escapeHtml(node.props.dir)}"` : "";
  const attrs = customAttrs(node.props);
  const content = node.children
    .map((c) => (typeof c === "string" ? escapeHtml(c) : renderNode(c, ctx)))
    .join("");

  return `${ind(ctx)}<p${style}${dir}${attrs}>${content}</p>${nl(ctx)}`;
}

/**
 * @param {ButtonNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderButton(node, ctx) {
  const href = escapeHtml(node.props.href);
  const label = node.children.map((c) => (typeof c === "string" ? escapeHtml(c) : "")).join("");
  const bgColor = node.styles.backgroundColor || "#007bff";
  const textColor = node.styles.color || "#ffffff";
  const borderRadius = node.styles.borderRadius;
  const borderRadiusValue =
    typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius || "4px";
  const padding = node.styles.padding;
  const paddingValue =
    padding !== undefined
      ? formatPadding(/** @type {number | [number, number] | string} */ (padding))
      : "12px 24px";
  const attrs = customAttrs(node.props);

  const customStyle = styleObjectToString({
    ...node.styles,
    backgroundColor: undefined,
    color: undefined,
    borderRadius: undefined,
    padding: undefined,
  });
  const extraStyle = customStyle ? `;${customStyle}` : "";

  return (
    `${ind(ctx)}<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:auto;v-text-anchor:middle;width:auto" arcsize="10%" fillcolor="${bgColor}"><w:anchorlock/><center style="color:${textColor};font-family:Arial,sans-serif;font-size:16px;font-weight:bold">${label}</center></v:roundrect><![endif]-->${nl(ctx)}` +
    `${ind(ctx)}<!--[if !mso]><!-->${nl(ctx)}` +
    `${ind(ctx)}<a href="${href}" style="display:inline-block;background-color:${bgColor};color:${textColor};border-radius:${borderRadiusValue};padding:${paddingValue};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;text-align:center${extraStyle}"${attrs}>${label}</a>${nl(ctx)}` +
    `${ind(ctx)}<!--<![endif]-->${nl(ctx)}`
  );
}

/**
 * width/height are extracted as props by the image component (not CSS styles),
 * so we output them as both HTML attributes (Outlook) and CSS (modern clients).
 * @param {ImageNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderImage(node, ctx) {
  const src = escapeHtml(node.props.src);
  const alt = node.props.alt ? ` alt="${escapeHtml(node.props.alt)}"` : ' alt=""';
  const width = node.props.width;
  const height = node.props.height;
  const widthHtmlAttr = width !== undefined ? ` width="${width}"` : "";
  const heightHtmlAttr = height !== undefined ? ` height="${height}"` : "";

  /** @type {Record<string, string>} */
  const defaults = { display: "block", border: "0" };
  if (width !== undefined) {
    defaults["width"] = typeof width === "number" ? `${width}px` : String(width);
  }
  if (height !== undefined) {
    defaults["height"] = typeof height === "number" ? `${height}px` : String(height);
  }

  const style = styleAttr(node.styles, defaults);
  const attrs = customAttrs(node.props);

  return `${ind(ctx)}<img src="${src}"${alt}${widthHtmlAttr}${heightHtmlAttr}${style}${attrs}>${nl(ctx)}`;
}

/**
 * @param {LinkNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderLink(node, ctx) {
  const href = escapeHtml(node.props.href);
  const style = styleAttr(node.styles);
  const attrs = customAttrs(node.props);
  const content = node.children
    .map((c) => (typeof c === "string" ? escapeHtml(c) : renderNode(c, ctx)))
    .join("");

  return `${ind(ctx)}<a href="${href}"${style}${attrs}>${content}</a>${nl(ctx)}`;
}

/**
 * @param {DividerNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderDivider(node, ctx) {
  const borderColor = node.styles.borderColor || "#cccccc";
  const borderWidth = node.styles.borderWidth;
  const borderWidthValue =
    typeof borderWidth === "number" ? `${borderWidth}px` : borderWidth || "1px";
  const attrs = customAttrs(node.props);
  const c1 = { ...ctx, indent: ctx.indent + 1 };
  const c2 = { ...ctx, indent: ctx.indent + 2 };

  return (
    `${ind(ctx)}<tr>${nl(ctx)}` +
    `${ind(c1)}<td style="padding:0"${attrs}>${nl(ctx)}` +
    `${ind(c2)}<div style="border-top:${borderWidthValue} solid ${borderColor};font-size:1px;line-height:1px">&nbsp;</div>${nl(ctx)}` +
    `${ind(c1)}</td>${nl(ctx)}` +
    `${ind(ctx)}</tr>${nl(ctx)}`
  );
}

/**
 * @param {RawNode} node
 * @returns {string}
 */
function renderRaw(node) {
  return node.children.map((c) => (typeof c === "string" ? c : "")).join("");
}

// --- Dispatch via switch for discriminated union narrowing ---

/**
 * Dispatch to the correct renderer for a node.
 * The switch narrows the EmailNode union to the specific variant,
 * so each renderer receives properly typed data — no casts needed.
 * @param {EmailNode} node
 * @param {RenderContext} ctx
 * @returns {string}
 */
function renderNode(node, ctx) {
  switch (node.type) {
    case "html":
      return renderHtml(node, ctx);
    case "body":
      return renderBody(node, ctx);
    case "section":
      return renderSection(node, ctx);
    case "row":
      return renderRow(node, ctx);
    case "column":
      return renderColumn(node, ctx);
    case "text":
      return renderText(node, ctx);
    case "button":
      return renderButton(node, ctx);
    case "image":
      return renderImage(node, ctx);
    case "link":
      return renderLink(node, ctx);
    case "divider":
      return renderDivider(node, ctx);
    case "raw":
      return renderRaw(node);
  }
}

/**
 * Render an email node tree to an HTML string.
 * @param {EmailNode} node - Root email node
 * @param {RenderOptions} [options] - Render options
 * @returns {string}
 */
export function render(node, options = {}) {
  if (options.plainText) {
    return renderPlainText(node).trim();
  }

  /** @type {RenderContext} */
  const ctx = {
    pretty: options.pretty || false,
    indent: 0,
  };

  return renderNode(node, ctx);
}

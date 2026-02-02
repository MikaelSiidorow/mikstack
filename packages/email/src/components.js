/** @import { EmailNode, StyleProps, HtmlNode, BodyNode, SectionNode, RowNode, ColumnNode, TextNode, ButtonNode, ImageNode, LinkNode, DividerNode, RawNode, HtmlProps, BodyProps, SectionProps, RowProps, ColumnProps, TextProps, ButtonProps, ImageProps, LinkProps, DividerProps } from "./types.d.ts" */

// --- Per-component prop key sets ---
// Each component declares which keys from the combined user object
// are semantic props (HTML attributes, structural values) vs CSS styles.
// Everything NOT in the set becomes a CSS style property.

/** @type {ReadonlySet<string>} */
const ATTR_ONLY = new Set(["attr"]);

/** @type {ReadonlySet<string>} */
const HTML_PROP_KEYS = new Set(["lang", "dir", "attr"]);

/** @type {ReadonlySet<string>} */
const BODY_PROP_KEYS = new Set(["maxWidth", "attr"]);

/** @type {ReadonlySet<string>} */
const TEXT_PROP_KEYS = new Set(["dir", "attr"]);

/** @type {ReadonlySet<string>} */
const BUTTON_PROP_KEYS = new Set(["href", "attr"]);

/** @type {ReadonlySet<string>} */
const IMAGE_PROP_KEYS = new Set(["src", "alt", "width", "height", "attr"]);

/** @type {ReadonlySet<string>} */
const LINK_PROP_KEYS = new Set(["href", "attr"]);

/**
 * Ensure children is always an array.
 * @param {EmailNode | EmailNode[] | string | (EmailNode | string)[]} children
 * @returns {(EmailNode | string)[]}
 */
function normalizeChildren(children) {
  if (Array.isArray(children)) return children;
  return [children];
}

/**
 * Extract CSS styles from a combined props+styles object.
 * Keys in `propKeys` are skipped; everything else is treated as CSS.
 * @param {Record<string, unknown>} combined
 * @param {ReadonlySet<string>} propKeys
 * @returns {StyleProps}
 */
function extractStyles(combined, propKeys) {
  /** @type {Record<string, unknown>} */
  const styles = {};
  for (const [key, value] of Object.entries(combined)) {
    if (!propKeys.has(key)) {
      styles[key] = value;
    }
  }
  return /** @type {StyleProps} */ (styles);
}

/**
 * Root document wrapper. Produces DOCTYPE + html + head + body.
 * @param {EmailNode} body
 * @param {HtmlProps} [props]
 * @returns {HtmlNode}
 */
export function html(body, props = {}) {
  return /** @type {const} */ ({
    type: "html",
    props: { lang: props.lang, dir: props.dir, attr: props.attr },
    styles: extractStyles(props, HTML_PROP_KEYS),
    children: [body],
  });
}

/**
 * Email body container. Produces centered table wrapper.
 * @param {EmailNode | EmailNode[]} children
 * @param {BodyProps} [props]
 * @returns {BodyNode}
 */
export function body(children, props = {}) {
  return /** @type {const} */ ({
    type: "body",
    props: { maxWidth: props.maxWidth, attr: props.attr },
    styles: extractStyles(props, BODY_PROP_KEYS),
    children: normalizeChildren(children),
  });
}

/**
 * Content section. Produces table row with cell.
 * @param {EmailNode | EmailNode[]} children
 * @param {SectionProps} [props]
 * @returns {SectionNode}
 */
export function section(children, props = {}) {
  return /** @type {const} */ ({
    type: "section",
    props: { attr: props.attr },
    styles: extractStyles(props, ATTR_ONLY),
    children: normalizeChildren(children),
  });
}

/**
 * Horizontal layout row. Produces table row with multiple cells.
 * @param {EmailNode | EmailNode[]} columns
 * @param {RowProps} [props]
 * @returns {RowNode}
 */
export function row(columns, props = {}) {
  return /** @type {const} */ ({
    type: "row",
    props: { attr: props.attr },
    styles: extractStyles(props, ATTR_ONLY),
    children: normalizeChildren(columns),
  });
}

/**
 * Column in a row. Produces table cell.
 * @param {EmailNode | EmailNode[]} children
 * @param {ColumnProps} [props]
 * @returns {ColumnNode}
 */
export function column(children, props = {}) {
  return /** @type {const} */ ({
    type: "column",
    props: { attr: props.attr },
    styles: extractStyles(props, ATTR_ONLY),
    children: normalizeChildren(children),
  });
}

/**
 * Text content. Produces paragraph element.
 * @param {string} content
 * @param {TextProps} [props]
 * @returns {TextNode}
 */
export function text(content, props = {}) {
  return /** @type {const} */ ({
    type: "text",
    props: { dir: props.dir, attr: props.attr },
    styles: extractStyles(props, TEXT_PROP_KEYS),
    children: [content],
  });
}

/**
 * Call-to-action button. Produces VML + CSS button for Outlook compatibility.
 * @param {string} label
 * @param {ButtonProps} props
 * @returns {ButtonNode}
 */
export function button(label, props) {
  if (typeof label !== "string") {
    throw new Error("button: 'label' must be a string");
  }
  if (typeof props?.href !== "string") {
    throw new Error("button: 'href' prop is required");
  }
  return /** @type {const} */ ({
    type: "button",
    props: { href: props.href, attr: props.attr },
    styles: extractStyles(props, BUTTON_PROP_KEYS),
    children: [label],
  });
}

/**
 * Image element. Produces img with proper email defaults.
 * @param {ImageProps} props
 * @returns {ImageNode}
 */
export function image(props) {
  if (typeof props?.src !== "string") {
    throw new Error("image: 'src' prop is required");
  }
  return /** @type {const} */ ({
    type: "image",
    props: {
      src: props.src,
      alt: props.alt,
      width: props.width,
      height: props.height,
      attr: props.attr,
    },
    styles: extractStyles(props, IMAGE_PROP_KEYS),
    children: [],
  });
}

/**
 * Hyperlink. Wraps string or child node.
 * @param {string | EmailNode} content
 * @param {LinkProps} props
 * @returns {LinkNode}
 */
export function link(content, props) {
  if (typeof props?.href !== "string") {
    throw new Error("link: 'href' prop is required");
  }
  return /** @type {const} */ ({
    type: "link",
    props: { href: props.href, attr: props.attr },
    styles: extractStyles(props, LINK_PROP_KEYS),
    children: [content],
  });
}

/**
 * Horizontal divider. Produces border-based divider.
 * @param {DividerProps} [props]
 * @returns {DividerNode}
 */
export function divider(props = {}) {
  return /** @type {const} */ ({
    type: "divider",
    props: { attr: props.attr },
    styles: extractStyles(props, ATTR_ONLY),
    children: [],
  });
}

/**
 * Raw HTML passthrough. Content is not escaped.
 * @param {string} htmlContent
 * @returns {RawNode}
 */
export function raw(htmlContent) {
  return /** @type {const} */ ({
    type: "raw",
    props: {},
    styles: {},
    children: [htmlContent],
  });
}

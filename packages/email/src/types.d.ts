// --- Style Properties ---

export interface StyleProps {
  backgroundColor?: string;
  border?: string;
  borderBottom?: string;
  borderColor?: string;
  borderLeft?: string;
  borderRadius?: number | string;
  borderRight?: string;
  borderTop?: string;
  borderWidth?: number | string;
  color?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontStyle?: "normal" | "italic";
  fontWeight?: "normal" | "bold" | number;
  height?: number | string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  margin?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
  marginTop?: number | string;
  maxWidth?: number | string;
  padding?: number | [number, number] | [number, number, number, number] | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  paddingTop?: number | string;
  textAlign?: "left" | "center" | "right";
  textDecoration?: "none" | "underline";
  verticalAlign?: "top" | "middle" | "bottom";
  width?: number | string;
}

// --- Node Prop Types (internal shape after extraction) ---

export interface AttrOnlyProps {
  attr?: Record<string, string>;
}

export interface HtmlNodeProps {
  lang?: string;
  dir?: "ltr" | "rtl";
  attr?: Record<string, string>;
}

export interface BodyNodeProps {
  maxWidth?: number | string;
  attr?: Record<string, string>;
}

export interface TextNodeProps {
  dir?: "ltr" | "rtl";
  attr?: Record<string, string>;
}

export interface ButtonNodeProps {
  href: string;
  attr?: Record<string, string>;
}

export interface ImageNodeProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  attr?: Record<string, string>;
}

export interface LinkNodeProps {
  href: string;
  attr?: Record<string, string>;
}

// --- Email Node Variants ---

interface BaseNode<T extends string, P> {
  readonly type: T;
  readonly props: Readonly<P>;
  readonly styles: Readonly<StyleProps>;
  readonly children: readonly (EmailNode | string)[];
}

export type HtmlNode = BaseNode<"html", HtmlNodeProps>;
export type BodyNode = BaseNode<"body", BodyNodeProps>;
export type SectionNode = BaseNode<"section", AttrOnlyProps>;
export type RowNode = BaseNode<"row", AttrOnlyProps>;
export type ColumnNode = BaseNode<"column", AttrOnlyProps>;
export type TextNode = BaseNode<"text", TextNodeProps>;
export type ButtonNode = BaseNode<"button", ButtonNodeProps>;
export type ImageNode = BaseNode<"image", ImageNodeProps>;
export type LinkNode = BaseNode<"link", LinkNodeProps>;
export type DividerNode = BaseNode<"divider", AttrOnlyProps>;
export type RawNode = BaseNode<"raw", Record<string, never>>;

export type EmailNode =
  | HtmlNode
  | BodyNode
  | SectionNode
  | RowNode
  | ColumnNode
  | TextNode
  | ButtonNode
  | ImageNode
  | LinkNode
  | DividerNode
  | RawNode;

// --- Component Props (public API — style + semantic mixed) ---

export interface HtmlProps extends StyleProps {
  lang?: string;
  dir?: "ltr" | "rtl";
  attr?: Record<string, string>;
}

export interface BodyProps extends StyleProps {
  maxWidth?: number | string;
  attr?: Record<string, string>;
}

export interface SectionProps extends StyleProps {
  attr?: Record<string, string>;
}

export interface RowProps extends StyleProps {
  attr?: Record<string, string>;
}

export interface ColumnProps extends StyleProps {
  attr?: Record<string, string>;
}

export interface TextProps extends StyleProps {
  dir?: "ltr" | "rtl";
  attr?: Record<string, string>;
}

export interface ButtonProps extends StyleProps {
  href: string;
  attr?: Record<string, string>;
}

export interface ImageProps extends StyleProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  attr?: Record<string, string>;
}

export interface LinkProps extends StyleProps {
  href: string;
  attr?: Record<string, string>;
}

export interface DividerProps extends StyleProps {
  attr?: Record<string, string>;
}

// --- Render Options ---

export interface RenderOptions {
  pretty?: boolean;
  plainText?: boolean;
}

// --- Component Functions ---

export function html(body: EmailNode, props?: HtmlProps): HtmlNode;

export function body(children: EmailNode | EmailNode[], props?: BodyProps): BodyNode;

export function section(children: EmailNode | EmailNode[], props?: SectionProps): SectionNode;

export function row(columns: EmailNode | EmailNode[], props?: RowProps): RowNode;

export function column(children: EmailNode | EmailNode[], props?: ColumnProps): ColumnNode;

export function text(content: string, props?: TextProps): TextNode;

export function button(label: string, props: ButtonProps): ButtonNode;

export function image(props: ImageProps): ImageNode;

export function link(content: string | EmailNode, props: LinkProps): LinkNode;

export function divider(props?: DividerProps): DividerNode;

export function raw(html: string): RawNode;

// --- Render Function ---

export function render(node: EmailNode, options?: RenderOptions): string;

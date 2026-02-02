declare module '@mikstack/email' {
	/**
	 * Render an email node tree to an HTML string.
	 * @param node - Root email node
	 * @param options - Render options
	 * */
	export function render(node: EmailNode, options?: RenderOptions): string;
	/**
	 * Root document wrapper. Produces DOCTYPE + html + head + body.
	 * */
	export function html(body: EmailNode, props?: HtmlProps): HtmlNode;
	/**
	 * Email body container. Produces centered table wrapper.
	 * */
	export function body(children: EmailNode | EmailNode[], props?: BodyProps): BodyNode;
	/**
	 * Content section. Produces table row with cell.
	 * */
	export function section(children: EmailNode | EmailNode[], props?: SectionProps): SectionNode;
	/**
	 * Horizontal layout row. Produces table row with multiple cells.
	 * */
	export function row(columns: EmailNode | EmailNode[], props?: RowProps): RowNode;
	/**
	 * Column in a row. Produces table cell.
	 * */
	export function column(children: EmailNode | EmailNode[], props?: ColumnProps): ColumnNode;
	/**
	 * Text content. Produces paragraph element.
	 * */
	export function text(content: string, props?: TextProps): TextNode;
	/**
	 * Call-to-action button. Produces VML + CSS button for Outlook compatibility.
	 * */
	export function button(label: string, props: ButtonProps): ButtonNode;
	/**
	 * Image element. Produces img with proper email defaults.
	 * */
	export function image(props: ImageProps): ImageNode;
	/**
	 * Hyperlink. Wraps string or child node.
	 * */
	export function link(content: string | EmailNode, props: LinkProps): LinkNode;
	/**
	 * Horizontal divider. Produces border-based divider.
	 * */
	export function divider(props?: DividerProps): DividerNode;
	/**
	 * Raw HTML passthrough. Content is not escaped.
	 * */
	export function raw(htmlContent: string): RawNode;
  // --- Style Properties ---

  interface StyleProps {
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

  interface AttrOnlyProps {
	attr?: Record<string, string>;
  }

  interface HtmlNodeProps {
	lang?: string;
	dir?: "ltr" | "rtl";
	attr?: Record<string, string>;
  }

  interface BodyNodeProps {
	maxWidth?: number | string;
	attr?: Record<string, string>;
  }

  interface TextNodeProps {
	dir?: "ltr" | "rtl";
	attr?: Record<string, string>;
  }

  interface ButtonNodeProps {
	href: string;
	attr?: Record<string, string>;
  }

  interface ImageNodeProps {
	src: string;
	alt?: string;
	width?: number | string;
	height?: number | string;
	attr?: Record<string, string>;
  }

  interface LinkNodeProps {
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

  type HtmlNode = BaseNode<"html", HtmlNodeProps>;
  type BodyNode = BaseNode<"body", BodyNodeProps>;
  type SectionNode = BaseNode<"section", AttrOnlyProps>;
  type RowNode = BaseNode<"row", AttrOnlyProps>;
  type ColumnNode = BaseNode<"column", AttrOnlyProps>;
  type TextNode = BaseNode<"text", TextNodeProps>;
  type ButtonNode = BaseNode<"button", ButtonNodeProps>;
  type ImageNode = BaseNode<"image", ImageNodeProps>;
  type LinkNode = BaseNode<"link", LinkNodeProps>;
  type DividerNode = BaseNode<"divider", AttrOnlyProps>;
  type RawNode = BaseNode<"raw", Record<string, never>>;

  type EmailNode =
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

  interface HtmlProps extends StyleProps {
	lang?: string;
	dir?: "ltr" | "rtl";
	attr?: Record<string, string>;
  }

  interface BodyProps extends StyleProps {
	maxWidth?: number | string;
	attr?: Record<string, string>;
  }

  interface SectionProps extends StyleProps {
	attr?: Record<string, string>;
  }

  interface RowProps extends StyleProps {
	attr?: Record<string, string>;
  }

  interface ColumnProps extends StyleProps {
	attr?: Record<string, string>;
  }

  interface TextProps extends StyleProps {
	dir?: "ltr" | "rtl";
	attr?: Record<string, string>;
  }

  interface ButtonProps extends StyleProps {
	href: string;
	attr?: Record<string, string>;
  }

  interface ImageProps extends StyleProps {
	src: string;
	alt?: string;
	width?: number | string;
	height?: number | string;
	attr?: Record<string, string>;
  }

  interface LinkProps extends StyleProps {
	href: string;
	attr?: Record<string, string>;
  }

  interface DividerProps extends StyleProps {
	attr?: Record<string, string>;
  }

  // --- Render Options ---

  interface RenderOptions {
	pretty?: boolean;
	plainText?: boolean;
  }

	export {};
}

//# sourceMappingURL=index.d.ts.map
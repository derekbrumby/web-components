/**
 * @file email-builder.js
 * @version 1.0.0
 *
 * Visual email layout builder web component with drag-and-drop blocks and a
 * contextual settings panel. Inspired by modern marketing email builders, it
 * provides a palette of reusable blocks (paragraph, image, button, social) that
 * can be arranged vertically. Selecting a block reveals its settings, while the
 * Settings tab exposes global design options like content width and colours.
 *
 * Usage:
 * ```html
 * <script type="module" src="./src/email-builder.js"></script>
 *
 * <wc-email-builder></wc-email-builder>
 * ```
 */

(() => {
  /**
   * @typedef {"title" | "paragraph" | "list" | "image" | "button" | "table" | "divider" | "spacer" | "social" | "html" | "video" | "icons" | "menu" | "sticker" | "gif"} BlockType
   */

  /**
   * @typedef BaseBlock
   * @property {string} id
   * @property {string} padding
   * @property {string} margin
   * @property {string} width
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "title";
   *   text: string;
   *   align: "left" | "center" | "right";
   *   level: "h1" | "h2" | "h3";
   *   color: string;
   * }} TitleBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "paragraph";
   *   content: string;
   *   align: "left" | "center" | "right";
   *   color: string;
   * }} ParagraphBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "list";
   *   items: string[];
   *   ordered: boolean;
   *   align: "left" | "center" | "right";
   * }} ListBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "image";
   *   url: string;
   *   alt: string;
   *   align: "left" | "center" | "right";
   *   autoWidth: boolean;
   *   borderRadius: string;
   * }} ImageBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "button";
   *   label: string;
   *   url: string;
   *   background: string;
   *   color: string;
   *   borderRadius: string;
   *   align: "left" | "center" | "right";
   * }} ButtonBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "table";
   *   rows: string[][];
   *   header: boolean;
   *   align: "left" | "center" | "right";
   * }} TableBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "divider";
   *   color: string;
   *   thickness: string;
   *   style: "solid" | "dashed" | "dotted";
   * }} DividerBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "spacer";
   *   height: string;
   * }} SpacerBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "social";
   *   items: { label: string; url: string; icon: string }[];
   *   align: "left" | "center" | "right";
   * }} SocialBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "html";
   *   markup: string;
   * }} HtmlBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "video";
   *   url: string;
   *   thumbnail: string;
   *   caption: string;
   * }} VideoBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "icons";
   *   items: { label: string; icon: string; url: string }[];
   *   align: "left" | "center" | "right";
   * }} IconsBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "menu";
   *   items: { label: string; url: string }[];
   *   align: "left" | "center" | "right";
   * }} MenuBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "sticker";
   *   text: string;
   *   background: string;
   *   color: string;
   * }} StickerBlock
   */

  /**
   * @typedef {BaseBlock & {
   *   type: "gif";
   *   url: string;
   *   alt: string;
   * }} GifBlock
   */

  /**
   * @typedef {TitleBlock | ParagraphBlock | ListBlock | ImageBlock | ButtonBlock | TableBlock | DividerBlock | SpacerBlock | SocialBlock | HtmlBlock | VideoBlock | IconsBlock | MenuBlock | StickerBlock | GifBlock} BlockConfig
   */

  const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

  const SOCIAL_TEMPLATE = /** @type {const} */ ([
    { label: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
    { label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' },
    { label: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
  ]);

  const BLOCK_DEFS = /** @type {const} */ ({
    title: {
      label: 'Title',
      description: 'Introduce a new section with a headline.',
      icon: '🅣',
      create() {
        return /** @type {TitleBlock} */ ({
          type: 'title',
          id: createId(),
          text: 'Add a headline for this section',
          align: 'center',
          level: 'h1',
          color: '#0f172a',
          padding: '1.5rem 1.5rem 1rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    paragraph: {
      label: 'Paragraph',
      description: 'Add text content to your email.',
      icon: '📝',
      create() {
        return /** @type {ParagraphBlock} */ ({
          type: 'paragraph',
          id: createId(),
          content: "I'm a new paragraph block.",
          align: 'left',
          color: '#1f2937',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    list: {
      label: 'List',
      description: 'Highlight multiple bullet points.',
      icon: '☰',
      create() {
        return /** @type {ListBlock} */ ({
          type: 'list',
          id: createId(),
          items: ['First benefit', 'Second benefit', 'Third benefit'],
          ordered: false,
          align: 'left',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    image: {
      label: 'Image',
      description: 'Drop in hosted campaign imagery.',
      icon: '🖼️',
      create() {
        return /** @type {ImageBlock} */ ({
          type: 'image',
          id: createId(),
          url: '',
          alt: 'Campaign visual',
          align: 'center',
          autoWidth: true,
          borderRadius: '12px',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    button: {
      label: 'Button',
      description: 'Add a call-to-action button.',
      icon: '🔘',
      create() {
        return /** @type {ButtonBlock} */ ({
          type: 'button',
          id: createId(),
          label: 'Button',
          url: '#',
          background: '#6d28d9',
          color: '#ffffff',
          borderRadius: '999px',
          align: 'center',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    table: {
      label: 'Table',
      description: 'Organise data in rows and columns.',
      icon: '📊',
      create() {
        return /** @type {TableBlock} */ ({
          type: 'table',
          id: createId(),
          rows: [
            ['Feature', 'Status'],
            ['Email automation', 'Enabled'],
            ['Customer journey', 'Draft'],
          ],
          header: true,
          align: 'center',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    divider: {
      label: 'Divider',
      description: 'Visually separate sections of content.',
      icon: '➖',
      create() {
        return /** @type {DividerBlock} */ ({
          type: 'divider',
          id: createId(),
          color: 'rgba(148, 163, 184, 0.75)',
          thickness: '2px',
          style: 'solid',
          padding: '0.5rem 1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    spacer: {
      label: 'Spacer',
      description: 'Add breathing room between blocks.',
      icon: '⬛',
      create() {
        return /** @type {SpacerBlock} */ ({
          type: 'spacer',
          id: createId(),
          height: '32px',
          padding: '0',
          margin: '0',
          width: '100%',
        });
      },
    },
    social: {
      label: 'Social',
      description: 'Link out to your social profiles.',
      icon: '💬',
      create() {
        return /** @type {SocialBlock} */ ({
          type: 'social',
          id: createId(),
          align: 'center',
          items: SOCIAL_TEMPLATE.map((item) => ({ ...item })),
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    html: {
      label: 'HTML',
      description: 'Inject custom HTML snippets.',
      icon: '</>',
      create() {
        return /** @type {HtmlBlock} */ ({
          type: 'html',
          id: createId(),
          markup: '<p style="margin:0;">Add custom HTML content.</p>',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    video: {
      label: 'Video',
      description: 'Link to hosted video content.',
      icon: '🎬',
      create() {
        return /** @type {VideoBlock} */ ({
          type: 'video',
          id: createId(),
          url: 'https://example.com/watch',
          thumbnail: '',
          caption: 'Watch the latest demo',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    icons: {
      label: 'Icons',
      description: 'Feature compact icon callouts.',
      icon: '⭐',
      create() {
        return /** @type {IconsBlock} */ ({
          type: 'icons',
          id: createId(),
          items: [
            { label: 'Fast setup', icon: '⚡', url: '#' },
            { label: 'Secure', icon: '🔒', url: '#' },
            { label: 'Support', icon: '💬', url: '#' },
          ],
          align: 'center',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    menu: {
      label: 'Menu',
      description: 'Build a simple navigation menu.',
      icon: '📑',
      create() {
        return /** @type {MenuBlock} */ ({
          type: 'menu',
          id: createId(),
          items: [
            { label: 'About', url: '#' },
            { label: 'Features', url: '#' },
            { label: 'Pricing', url: '#' },
          ],
          align: 'center',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    sticker: {
      label: 'Sticker',
      description: 'Draw attention with a fun sticker.',
      icon: '🏷️',
      create() {
        return /** @type {StickerBlock} */ ({
          type: 'sticker',
          id: createId(),
          text: 'New arrival',
          background: '#fef08a',
          color: '#92400e',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
    gif: {
      label: 'GIF',
      description: 'Embed an animated GIF.',
      icon: '🎞️',
      create() {
        return /** @type {GifBlock} */ ({
          type: 'gif',
          id: createId(),
          url: '',
          alt: 'Animated moment',
          padding: '1.25rem',
          margin: '0',
          width: '100%',
        });
      },
    },
  });

  const ICON_PATHS = /** @type {const} */ ({
    twitter:
      'M22.46 6c-.77.35-1.6.59-2.46.7a4.3 4.3 0 0 0 1.88-2.38 8.59 8.59 0 0 1-2.72 1.06 4.28 4.28 0 0 0-7.29 3.9 12.14 12.14 0 0 1-8.8-4.46 4.27 4.27 0 0 0 1.32 5.7 4.24 4.24 0 0 1-1.94-.54v.05a4.28 4.28 0 0 0 3.44 4.2 4.3 4.3 0 0 1-1.93.07 4.29 4.29 0 0 0 4 2.97A8.58 8.58 0 0 1 2 19.54a12.11 12.11 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.38-.01-.57A8.7 8.7 0 0 0 24 5.1a8.54 8.54 0 0 1-2.54.7Z',
    linkedin:
      'M20.45 20.45h-3.55v-5.41c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85v5.51H9.49V9h3.41v1.56h.05c.47-.89 1.63-1.82 3.36-1.82 3.59 0 4.26 2.36 4.26 5.43v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.1 20.45H3.58V9h3.52v11.45ZM22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.24.8 24 1.77 24h20.46c.97 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0Z',
    instagram:
      'M12 7.09a4.91 4.91 0 1 0 0 9.82 4.91 4.91 0 0 0 0-9.82Zm0 8.1a3.19 3.19 0 1 1 0-6.38 3.19 3.19 0 0 1 0 6.38Zm6.23-8.26a1.15 1.15 0 1 1-2.29 0 1.15 1.15 0 0 1 2.29 0ZM22.94 7.4a7.25 7.25 0 0 0-1.98-3.22 7.25 7.25 0 0 0-3.22-1.99C16.55 1.5 9.45 1.5 7.26 2.19a7.25 7.25 0 0 0-3.22 1.98 7.25 7.25 0 0 0-1.99 3.22C1.5 9.45 1.5 14.55 2.19 16.74a7.25 7.25 0 0 0 1.98 3.22 7.25 7.25 0 0 0 3.22 1.99C9.45 22.5 14.55 22.5 16.74 21.81a7.25 7.25 0 0 0 3.22-1.98 7.25 7.25 0 0 0 1.99-3.22c.69-2.19.69-7.29 0-9.48ZM21 16.09a5.32 5.32 0 0 1-1.18 1.94 5.32 5.32 0 0 1-1.94 1.18c-1.3.5-6.57.5-7.88 0a5.32 5.32 0 0 1-1.94-1.18A5.32 5.32 0 0 1 7.88 16.1c-.5-1.3-.5-6.57 0-7.88A5.32 5.32 0 0 1 9.06 6.3a5.32 5.32 0 0 1 1.94-1.18c1.3-.5 6.57-.5 7.88 0A5.32 5.32 0 0 1 20.82 7.1a5.32 5.32 0 0 1 1.18 1.94c.5 1.3.5 6.57 0 7.88Z',
  });

  const DEFAULT_SETTINGS = {
    width: 600,
    align: 'center',
    background: '#f9fafb',
    canvasBackground: '#ffffff',
  };

  /**
   * Generate a label element + input pair.
   *
   * @template {HTMLElement} T
   * @param {string} label
   * @param {T} input
   * @param {string} description
   * @returns {HTMLDivElement}
   */
  const makeField = (label, input, description = '') => {
    const wrapper = document.createElement('div');
    wrapper.className = 'field';
    const labelEl = document.createElement('label');
    labelEl.className = 'field-label';
    labelEl.textContent = label;
    const hint = document.createElement('p');
    hint.className = 'field-description';
    hint.textContent = description;
    labelEl.appendChild(hint);
    labelEl.appendChild(input);
    wrapper.appendChild(labelEl);
    return wrapper;
  };

  class WcEmailBuilder extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #canvas;
    /** @type {HTMLElement} */
    #palettePanel;
    /** @type {HTMLElement} */
    #palette;
    /** @type {HTMLElement} */
    #paletteHelper;
    /** @type {HTMLElement} */
    #panel;
    /** @type {HTMLElement} */
    #panelContent;
    /** @type {HTMLElement} */
    #dropIndicator;
    /** @type {HTMLButtonElement[]} */
    #tabButtons;
    /** @type {{ blocks: BlockConfig[]; selected: string | null; settings: typeof DEFAULT_SETTINGS }} */
    #state;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#state = {
        blocks: [],
        selected: null,
        settings: clone(DEFAULT_SETTINGS),
      };

      const style = document.createElement('style');
      style.textContent = `
        :host {
          --wc-email-builder-border: 1px solid rgba(148, 163, 184, 0.4);
          --wc-email-builder-radius: 1rem;
          --wc-email-builder-accent: #7c3aed;
          --wc-email-builder-accent-soft: rgba(124, 58, 237, 0.14);
          --wc-email-builder-text: #0f172a;
          --wc-email-builder-muted: #475569;
          --wc-email-builder-surface: rgba(255, 255, 255, 0.9);
          --wc-email-builder-control-bg: rgba(148, 163, 184, 0.12);
          --wc-email-builder-card-bg: rgba(255, 255, 255, 0.98);
          --wc-email-builder-input-bg: rgba(248, 250, 252, 0.95);
          --wc-email-builder-outline: 2px solid rgba(124, 58, 237, 0.32);
          color-scheme: light dark;
          display: block;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: var(--wc-email-builder-text);
          line-height: 1.5;
        }

        * {
          box-sizing: border-box;
        }

        .app {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 1rem;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.2rem;
          border: var(--wc-email-builder-border);
          border-radius: calc(var(--wc-email-builder-radius) - 0.25rem);
          background: var(--wc-email-builder-surface);
          backdrop-filter: blur(18px);
        }

        .toolbar-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .toolbar-actions {
          display: flex;
          gap: 0.75rem;
        }

        .toolbar-actions button {
          appearance: none;
          border: none;
          border-radius: 999px;
          padding: 0.45rem 0.95rem;
          font: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          background: var(--wc-email-builder-control-bg);
          color: inherit;
          cursor: pointer;
          transition: background-color 140ms ease, color 140ms ease;
        }

        .toolbar-actions button.primary {
          background: var(--wc-email-builder-accent);
          color: #fff;
        }

        .workspace {
          display: grid;
          grid-template-columns: minmax(16rem, 18rem) minmax(0, 1fr) minmax(18rem, 22rem);
          gap: 1rem;
          align-items: start;
        }

        .palette-panel {
          border: var(--wc-email-builder-border);
          border-radius: var(--wc-email-builder-radius);
          background: var(--wc-email-builder-surface);
          backdrop-filter: blur(18px);
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 28rem;
        }

        .palette-header {
          padding: 1.1rem 1.25rem 0.5rem;
          display: grid;
          gap: 0.35rem;
        }

        .palette-header h2 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .palette-header p {
          margin: 0;
          color: var(--wc-email-builder-muted);
          font-size: 0.8rem;
        }

        .palette-body {
          padding: 0 1.25rem 1.25rem;
          display: grid;
          gap: 1rem;
          overflow: auto;
          align-content: start;
        }

        .palette-helper {
          margin: 0;
          font-size: 0.8rem;
          color: var(--wc-email-builder-muted);
        }

        .canvas-wrapper {
          position: relative;
          border: var(--wc-email-builder-border);
          border-radius: var(--wc-email-builder-radius);
          background: var(--wc-email-builder-surface);
          padding: 2.25rem 1.5rem;
          min-height: 28rem;
        }

        .canvas {
          background: var(--canvas-background, #fff);
          border-radius: 0.75rem;
          margin-inline: auto;
          padding: 2rem;
          max-width: 100%;
          display: grid;
          gap: 1.25rem;
        }

        .canvas.is-empty {
          border: 2px dashed rgba(148, 163, 184, 0.5);
          display: grid;
          place-items: center;
          text-align: center;
          color: var(--wc-email-builder-muted);
        }

        .canvas-drop-hint {
          display: grid;
          gap: 0.35rem;
        }

        .canvas-drop-hint strong {
          font-weight: 600;
          color: var(--wc-email-builder-text);
        }

        .canvas-block {
          border-radius: 0.75rem;
          border: 1px solid transparent;
          background: var(--wc-email-builder-card-bg);
          box-shadow: 0 18px 40px -36px rgba(15, 23, 42, 0.45);
          cursor: grab;
          position: relative;
          outline: none;
        }

        .canvas-drop-indicator {
          border-top: 2px dashed var(--wc-email-builder-accent);
          margin: 0.5rem 0;
          pointer-events: none;
        }

        .canvas-block[aria-selected="true"] {
          border-color: var(--wc-email-builder-accent);
          box-shadow: 0 0 0 4px var(--wc-email-builder-accent-soft);
        }

        .canvas-block:hover {
          border-color: rgba(124, 58, 237, 0.25);
        }

        .block-actions {
          position: absolute;
          inset: 0.45rem 0.45rem auto auto;
          display: flex;
          gap: 0.4rem;
        }

        .block-actions button {
          border: none;
          background: rgba(15, 23, 42, 0.82);
          color: #fff;
          width: 1.85rem;
          height: 1.85rem;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.85rem;
          cursor: pointer;
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .canvas-block:hover .block-actions button,
        .canvas-block[aria-selected="true"] .block-actions button {
          opacity: 1;
        }

        .block-actions button:focus-visible {
          outline: var(--wc-email-builder-outline);
          outline-offset: 2px;
        }

        .title-block {
          text-align: var(--block-align, center);
        }

        .title-block-heading {
          margin: 0;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          line-height: 1.2;
        }

        .paragraph-block {
          color: var(--block-color, #1f2937);
          text-align: var(--block-align, left);
          line-height: 1.6;
          font-size: 1rem;
        }

        .list-block {
          text-align: var(--block-align, left);
        }

        .list-block ul,
        .list-block ol {
          margin: 0;
          padding-inline-start: 1.25rem;
          display: inline-block;
          text-align: left;
        }

        .list-block li {
          margin-bottom: 0.35rem;
        }

        .image-block {
          width: 100%;
          display: grid;
          justify-items: var(--block-align, center);
        }

        .image-block img {
          max-width: 100%;
          border-radius: var(--block-radius, 12px);
        }

        .image-placeholder {
          border: 2px dashed rgba(148, 163, 184, 0.5);
          padding: 1.5rem;
          border-radius: inherit;
          text-align: center;
          color: var(--wc-email-builder-muted);
        }

        .button-block {
          display: grid;
          justify-items: var(--block-align, center);
        }

        .button-block a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.75rem;
          border-radius: var(--block-radius, 999px);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          background: var(--block-background, #6d28d9);
          color: var(--block-color, #fff);
        }

        .table-block {
          display: grid;
          justify-items: var(--block-align, center);
        }

        .table-block table {
          border-collapse: collapse;
          min-width: min(100%, 520px);
          width: 100%;
          background: rgba(148, 163, 184, 0.08);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .table-block th,
        .table-block td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.3);
          text-align: left;
        }

        .table-block tr:last-child td {
          border-bottom: none;
        }

        .divider-block {
          width: 100%;
          border-top: var(--divider-thickness, 2px) var(--divider-style, solid)
            var(--divider-color, rgba(148, 163, 184, 0.75));
        }

        .spacer-block {
          width: 100%;
          background: repeating-linear-gradient(
            90deg,
            rgba(148, 163, 184, 0.12),
            rgba(148, 163, 184, 0.12) 8px,
            transparent 8px,
            transparent 16px
          );
          border-radius: 0.75rem;
        }

        .html-block {
          display: block;
          color: inherit;
        }

        .video-block {
          display: grid;
          gap: 0.5rem;
        }

        .video-block-link {
          display: block;
          border-radius: 0.75rem;
          overflow: hidden;
          position: relative;
          text-decoration: none;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .video-block-link img,
        .video-placeholder {
          width: 100%;
          display: block;
          aspect-ratio: 16 / 9;
          object-fit: cover;
        }

        .video-placeholder {
          background: rgba(124, 58, 237, 0.08);
          color: var(--wc-email-builder-muted);
          display: grid;
          place-items: center;
          font-weight: 600;
        }

        .video-caption {
          margin: 0;
          font-size: 0.85rem;
          color: var(--wc-email-builder-muted);
        }

        .icons-block {
          display: grid;
          justify-items: var(--block-align, center);
        }

        .icons-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
          width: 100%;
        }

        .icons-item {
          display: grid;
          gap: 0.35rem;
          padding: 0.85rem;
          border-radius: 0.75rem;
          background: rgba(124, 58, 237, 0.08);
          color: inherit;
          text-decoration: none;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }

        .icons-symbol {
          font-size: 1.5rem;
        }

        .icons-label {
          font-weight: 600;
          font-size: 0.85rem;
        }

        .menu-block {
          display: flex;
          justify-content: var(--block-align, center);
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .menu-block a {
          text-decoration: none;
          font-weight: 600;
          color: inherit;
        }

        .social-block {
          display: grid;
          justify-items: var(--block-align, center);
        }

        .social-list {
          display: flex;
          gap: 0.75rem;
        }

        .social-list a {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 999px;
          background: rgba(124, 58, 237, 0.12);
          color: var(--wc-email-builder-accent);
          display: grid;
          place-items: center;
          text-decoration: none;
        }

        .sticker-block {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          background: var(--sticker-bg, #fef08a);
          color: var(--sticker-color, #92400e);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.7rem;
        }

        .gif-block {
          display: grid;
          justify-items: center;
          gap: 0.5rem;
        }

        .gif-block img {
          max-width: 100%;
          border-radius: 0.75rem;
        }

        .gif-placeholder {
          width: 100%;
          padding: 1.25rem;
          text-align: center;
          border: 2px dashed rgba(148, 163, 184, 0.5);
          border-radius: 0.75rem;
          color: var(--wc-email-builder-muted);
        }

        @media (prefers-color-scheme: dark) {
          :host {
            --wc-email-builder-text: #e2e8f0;
            --wc-email-builder-muted: #94a3b8;
            --wc-email-builder-surface: rgba(15, 23, 42, 0.82);
            --wc-email-builder-control-bg: rgba(148, 163, 184, 0.22);
            --wc-email-builder-card-bg: rgba(15, 23, 42, 0.92);
            --wc-email-builder-input-bg: rgba(30, 41, 59, 0.9);
          }

          .canvas-block {
            box-shadow: 0 24px 48px -30px rgba(15, 23, 42, 0.85);
          }

          .palette button {
            background: rgba(30, 41, 59, 0.92);
          }

          .video-placeholder {
            background: rgba(124, 58, 237, 0.22);
          }

          .icons-item {
            background: rgba(124, 58, 237, 0.22);
            border-color: rgba(124, 58, 237, 0.4);
          }
        }

        .panel {
          border: var(--wc-email-builder-border);
          border-radius: var(--wc-email-builder-radius);
          background: var(--wc-email-builder-surface);
          backdrop-filter: blur(18px);
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 28rem;
        }

        .panel-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }

        .panel-tabs button {
          appearance: none;
          border: none;
          background: transparent;
          padding: 0.9rem 0.75rem;
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--wc-email-builder-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 140ms ease, border-color 140ms ease;
        }

        .panel-tabs button.is-active {
          color: var(--wc-email-builder-accent);
          border-color: currentColor;
        }

        .panel-content {
          padding: 1.25rem;
          overflow: auto;
          display: grid;
          gap: 1rem;
        }

        .panel-section {
          display: grid;
          gap: 0.75rem;
        }

        .panel-section h3 {
          margin: 0;
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--wc-email-builder-muted);
        }

        .palette {
          display: grid;
          gap: 0.75rem;
        }

        .palette button {
          appearance: none;
          border: var(--wc-email-builder-border);
          border-radius: 0.9rem;
          background: var(--wc-email-builder-card-bg);
          padding: 0.85rem;
          display: grid;
          gap: 0.35rem;
          cursor: grab;
          text-align: left;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }

        .palette button:hover,
        .palette button:focus-visible {
          border-color: rgba(124, 58, 237, 0.45);
          box-shadow: 0 12px 32px -24px rgba(79, 70, 229, 0.55);
          outline: none;
        }

        .palette button span {
          display: block;
        }

        .palette button .label {
          font-weight: 600;
        }

        .palette button .description {
          font-size: 0.8rem;
          color: var(--wc-email-builder-muted);
        }

        .field {
          display: grid;
          gap: 0.35rem;
        }

        .field-label {
          font-size: 0.8rem;
          font-weight: 600;
          display: grid;
          gap: 0.25rem;
        }

        .field-description {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--wc-email-builder-muted);
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          padding: 0.55rem 0.65rem;
          border-radius: 0.6rem;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: var(--wc-email-builder-input-bg);
          font: inherit;
          color: var(--wc-email-builder-text);
        }

        .field textarea {
          min-height: 6rem;
        }

        .inline-options {
          display: flex;
          gap: 0.5rem;
        }

        .inline-options button {
          flex: 1;
          border: 1px solid rgba(148, 163, 184, 0.6);
          border-radius: 0.6rem;
          background: rgba(248, 250, 252, 0.9);
          padding: 0.5rem 0.65rem;
          font: inherit;
          cursor: pointer;
        }

        .inline-options button.is-active {
          border-color: var(--wc-email-builder-accent);
          background: var(--wc-email-builder-accent-soft);
          color: var(--wc-email-builder-accent);
        }

        .social-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .social-item svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .empty-settings {
          text-align: center;
          color: var(--wc-email-builder-muted);
          display: grid;
          gap: 0.35rem;
        }
      `;

      const app = document.createElement('div');
      app.className = 'app';

      const toolbar = document.createElement('header');
      toolbar.className = 'toolbar';
      toolbar.innerHTML = `
        <div>
          <p class="toolbar-title">New campaign</p>
          <p class="toolbar-subtitle" style="margin:0;font-size:0.8rem;color:var(--wc-email-builder-muted);">Design your responsive email content</p>
        </div>
        <div class="toolbar-actions">
          <button type="button">Preview</button>
          <button type="button" class="primary">Export</button>
        </div>
      `;

      const exportButton = toolbar.querySelector('.toolbar-actions .primary');
      if (exportButton instanceof HTMLButtonElement) {
        exportButton.addEventListener('click', () => this.#exportHtml());
      }

      const workspace = document.createElement('div');
      workspace.className = 'workspace';

      this.#palettePanel = document.createElement('aside');
      this.#palettePanel.className = 'palette-panel';

      const paletteHeader = document.createElement('div');
      paletteHeader.className = 'palette-header';
      const paletteTitle = document.createElement('h2');
      paletteTitle.textContent = 'Blocks';
      const paletteDescription = document.createElement('p');
      paletteDescription.textContent = 'Drag blocks into the canvas or click to insert them.';
      paletteHeader.append(paletteTitle, paletteDescription);

      const paletteBody = document.createElement('div');
      paletteBody.className = 'palette-body';

      this.#palette = document.createElement('div');
      this.#palette.className = 'palette';

      this.#paletteHelper = document.createElement('p');
      this.#paletteHelper.className = 'palette-helper';
      this.#paletteHelper.textContent = 'Drag or click a block to start composing your email.';

      paletteBody.append(this.#palette, this.#paletteHelper);
      this.#palettePanel.append(paletteHeader, paletteBody);

      const canvasWrapper = document.createElement('section');
      canvasWrapper.className = 'canvas-wrapper';

      this.#canvas = document.createElement('div');
      this.#canvas.className = 'canvas is-empty';
      this.#canvas.setAttribute('role', 'list');
      this.#canvas.setAttribute('aria-label', 'Email content');

      this.#dropIndicator = document.createElement('div');
      this.#dropIndicator.className = 'canvas-drop-indicator';
      this.#dropIndicator.hidden = true;

      this.#canvas.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move';
        }
        const dropIndex = this.#getDropIndex(event);
        this.#showDropIndicator(dropIndex);
      });

      this.#canvas.addEventListener('drop', (event) => {
        event.preventDefault();
        this.#hideDropIndicator();
        const dataTransfer = event.dataTransfer;
        const data = dataTransfer ? dataTransfer.getData('text/plain') : '';
        if (!data) return;
        const blocks = this.#state.blocks.slice();
        const dropIndex = this.#getDropIndex(event);
        if (data.startsWith('palette:')) {
          const type = /** @type {BlockType} */ (data.split(':')[1]);
          const definition = BLOCK_DEFS[type];
          if (!definition) return;
          const newBlock = definition.create();
          blocks.splice(dropIndex, 0, newBlock);
          this.#state.blocks = blocks;
          this.#state.selected = newBlock.id;
          this.#render();
          this.#emitChange('block:add', { id: newBlock.id, type });
          return;
        }

        if (data.startsWith('block:')) {
          const id = data.split(':')[1];
          const currentIndex = blocks.findIndex((item) => item.id === id);
          if (currentIndex === -1) return;
          const [moved] = blocks.splice(currentIndex, 1);
          const targetIndex = dropIndex > currentIndex ? dropIndex - 1 : dropIndex;
          blocks.splice(targetIndex, 0, moved);
          this.#state.blocks = blocks;
          this.#renderBlocks();
          this.#emitChange('block:reorder', { id, to: targetIndex });
        }
      });

      this.#canvas.addEventListener('dragleave', (event) => {
        const related = /** @type {Node | null} */ (event.relatedTarget);
        if (!related || !this.#canvas.contains(related)) {
          this.#hideDropIndicator();
        }
      });

      this.addEventListener('dragend', () => {
        this.#hideDropIndicator();
      });

      this.#canvas.addEventListener('click', (event) => {
        const blockEl = /** @type {HTMLElement | null} */ (
          event.target instanceof HTMLElement ? event.target.closest('[data-block-id]') : null
        );
        if (!blockEl) {
          this.#state.selected = null;
          this.#render();
          return;
        }
        const id = blockEl.getAttribute('data-block-id');
        if (id) {
          this.#state.selected = id;
          this.#render();
        }
      });

      const dropHint = document.createElement('div');
      dropHint.className = 'canvas-drop-hint';
      dropHint.innerHTML = `
        <strong>Drop blocks here</strong>
        <span>Use the Blocks panel to start designing your email layout.</span>
      `;
      this.#canvas.append(dropHint);

      canvasWrapper.append(this.#canvas);

      this.#panel = document.createElement('aside');
      this.#panel.className = 'panel';

      const tabs = document.createElement('div');
      tabs.className = 'panel-tabs';
      const tabNames = ['Content', 'Rows', 'Settings'];
      this.#tabButtons = tabNames.map((name, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        if (index === 0) button.classList.add('is-active');
        button.addEventListener('click', () => {
          this.#tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
          this.#renderPanel(name.toLowerCase());
        });
        tabs.append(button);
        return button;
      });

      this.#panelContent = document.createElement('div');
      this.#panelContent.className = 'panel-content';

      this.#panel.append(tabs, this.#panelContent);

      workspace.append(this.#palettePanel, canvasWrapper, this.#panel);
      app.append(toolbar, workspace);

      this.#root.append(style, app);

      this.#renderPalette();
      this.#renderPanel('content');
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'application');
      }
      this.#render();
    }

    /**
     * Current blocks rendered in the canvas.
     * @returns {BlockConfig[]}
     */
    get blocks() {
      return clone(this.#state.blocks);
    }

    /**
     * Replace the entire block collection with a new array.
     * @param {BlockConfig[]} value
     */
    set blocks(value) {
      if (!Array.isArray(value)) {
        return;
      }
      this.#state.blocks = value.map((block) => this.#normaliseBlock(block));
      this.#state.selected = null;
      this.#render();
      this.#emitChange('blocks:set');
    }

    /**
     * Current global design settings.
     */
    get settings() {
      return clone(this.#state.settings);
    }

    /**
     * Apply new global design settings.
     * @param {Partial<typeof DEFAULT_SETTINGS>} value
     */
    set settings(value) {
      if (!value || typeof value !== 'object') {
        return;
      }
      const next = { ...DEFAULT_SETTINGS };
      if (typeof value.width === 'number' && Number.isFinite(value.width)) {
        next.width = value.width;
      }
      const align = /** @type {any} */ (value.align);
      if (align === 'left' || align === 'center' || align === 'right') {
        next.align = align;
      }
      if (typeof value.background === 'string') {
        next.background = value.background;
      }
      if (typeof value.canvasBackground === 'string') {
        next.canvasBackground = value.canvasBackground;
      }
      this.#state.settings = next;
      this.#render();
      this.#emitChange('settings:set');
    }

    /**
     * Calculate the index where a dragged block should be inserted based on the drop event.
     * @param {DragEvent} event
     */
    #getDropIndex(event) {
      const blockElements = Array.from(
        this.#canvas.querySelectorAll('[data-block-id]')
      );
      if (blockElements.length === 0) {
        return 0;
      }
      const { clientY } = event;
      for (let index = 0; index < blockElements.length; index += 1) {
        const rect = blockElements[index].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          return index;
        }
      }
      return blockElements.length;
    }

    /**
     * Show a visual indicator for the current drop target.
     * @param {number} index
     */
    #showDropIndicator(index) {
      if (!this.#dropIndicator) {
        return;
      }
      const indicator = this.#dropIndicator;
      const children = Array.from(this.#canvas.children).filter(
        (child) => child !== indicator
      );
      const beforeNode = children[index] ?? null;
      indicator.hidden = false;
      if (beforeNode) {
        this.#canvas.insertBefore(indicator, beforeNode);
      } else {
        this.#canvas.append(indicator);
      }
    }

    /** Hide the drop indicator. */
    #hideDropIndicator() {
      if (!this.#dropIndicator) {
        return;
      }
      this.#dropIndicator.hidden = true;
      if (this.#dropIndicator.parentElement) {
        this.#dropIndicator.parentElement.removeChild(this.#dropIndicator);
      }
    }

    /**
     * Remove a block from the state.
     * @param {string} id
     */
    #deleteBlock(id) {
      this.#state.blocks = this.#state.blocks.filter((block) => block.id !== id);
      if (this.#state.selected === id) {
        this.#state.selected = null;
      }
      this.#render();
      this.#emitChange('block:delete', { id });
    }

    /**
     * Renders the block palette and settings panel for the selected tab.
     * @param {"content" | "rows" | "settings"} tab
     */
    #renderPanel(tab) {
      this.#panelContent.innerHTML = '';
      if (tab === 'rows') {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-settings';
        placeholder.innerHTML = `
          <strong>Preset rows coming soon</strong>
          <span>Use the Content tab to drag blocks or adjust design settings.</span>
        `;
        this.#panelContent.append(placeholder);
        return;
      }

      if (tab === 'settings') {
        this.#renderGlobalSettings();
        return;
      }

      if (this.#state.selected) {
        this.#renderBlockSettings();
      } else {
        this.#renderContentOverview();
      }
    }

    /**
     * Normalise an arbitrary block payload.
     * @param {any} block
     * @returns {BlockConfig}
     */
    #normaliseBlock(block) {
      const candidate = block && typeof block === 'object' ? { ...block } : {};
      const id = typeof candidate.id === 'string' && candidate.id ? candidate.id : createId();
      const type = candidate.type;
      switch (type) {
        case 'title': {
          const box = this.#normaliseBoxModel(candidate, {
            padding: '1.5rem 1.5rem 1rem',
            margin: '0',
            width: '100%',
          });
          const level = candidate.level;
          const resolvedLevel = level === 'h1' || level === 'h2' || level === 'h3' ? level : 'h1';
          return {
            type: 'title',
            id,
            text: typeof candidate.text === 'string' ? candidate.text : 'Add a headline for this section',
            align: this.#normaliseAlign(candidate.align, 'center'),
            level: resolvedLevel,
            color: typeof candidate.color === 'string' ? candidate.color : '#0f172a',
            ...box,
          };
        }
        case 'paragraph':
          return {
            type: 'paragraph',
            id,
            content: typeof candidate.content === 'string' ? candidate.content : "I'm a new paragraph block.",
            align: this.#normaliseAlign(candidate.align, 'left'),
            color: typeof candidate.color === 'string' ? candidate.color : '#1f2937',
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'list': {
          const items = Array.isArray(candidate.items)
            ? candidate.items.map((item) => (typeof item === 'string' ? item : String(item)))
            : ['First benefit', 'Second benefit', 'Third benefit'];
          return {
            type: 'list',
            id,
            items,
            ordered: Boolean(candidate.ordered),
            align: this.#normaliseAlign(candidate.align, 'left'),
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        }
        case 'image':
          return {
            type: 'image',
            id,
            url: typeof candidate.url === 'string' ? candidate.url : '',
            alt: typeof candidate.alt === 'string' ? candidate.alt : 'Campaign visual',
            align: this.#normaliseAlign(candidate.align, 'center'),
            autoWidth: typeof candidate.autoWidth === 'boolean' ? candidate.autoWidth : true,
            borderRadius: typeof candidate.borderRadius === 'string' ? candidate.borderRadius : '12px',
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'button':
          return {
            type: 'button',
            id,
            label: typeof candidate.label === 'string' ? candidate.label : 'Button',
            url: typeof candidate.url === 'string' ? candidate.url : '#',
            background: typeof candidate.background === 'string' ? candidate.background : '#6d28d9',
            color: typeof candidate.color === 'string' ? candidate.color : '#ffffff',
            borderRadius: typeof candidate.borderRadius === 'string' ? candidate.borderRadius : '999px',
            align: this.#normaliseAlign(candidate.align, 'center'),
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'table': {
          const rows = Array.isArray(candidate.rows) && candidate.rows.length
            ? candidate.rows
                .filter((row) => Array.isArray(row) && row.length)
                .map((row) => row.map((cell) => (typeof cell === 'string' ? cell : String(cell))))
            : [
                ['Feature', 'Status'],
                ['Email automation', 'Enabled'],
                ['Customer journey', 'Draft'],
              ];
          const box = this.#normaliseBoxModel(candidate, {
            padding: '1.25rem',
            margin: '0',
            width: '100%',
          });
          return {
            type: 'table',
            id,
            rows,
            header: Boolean(candidate.header),
            align: this.#normaliseAlign(candidate.align, 'center'),
            ...box,
          };
        }
        case 'divider':
          return {
            type: 'divider',
            id,
            color: typeof candidate.color === 'string' ? candidate.color : 'rgba(148, 163, 184, 0.75)',
            thickness: typeof candidate.thickness === 'string' ? candidate.thickness : '2px',
            style:
              candidate.style === 'dashed' || candidate.style === 'dotted' || candidate.style === 'solid'
                ? candidate.style
                : 'solid',
            ...this.#normaliseBoxModel(candidate, {
              padding: '0.5rem 1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'spacer':
          return {
            type: 'spacer',
            id,
            height: typeof candidate.height === 'string' ? candidate.height : '32px',
            ...this.#normaliseBoxModel(candidate, {
              padding: '0',
              margin: '0',
              width: '100%',
            }),
          };
        case 'social': {
          const items = Array.isArray(candidate.items) && candidate.items.length
            ? candidate.items.map((item) => {
                const source = item && typeof item === 'object' ? item : {};
                const iconKey = typeof source.icon === 'string' ? source.icon : undefined;
                const icon = iconKey && ICON_PATHS[iconKey] ? iconKey : 'twitter';
                return {
                  label: typeof source.label === 'string' ? source.label : 'Social',
                  url: typeof source.url === 'string' ? source.url : '#',
                  icon,
                };
              })
            : SOCIAL_TEMPLATE.map((item) => ({ ...item }));
          return {
            type: 'social',
            id,
            items,
            align: this.#normaliseAlign(candidate.align, 'center'),
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        }
        case 'html':
          return {
            type: 'html',
            id,
            markup:
              typeof candidate.markup === 'string'
                ? candidate.markup
                : '<p style="margin:0;">Add custom HTML content.</p>',
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'video':
          return {
            type: 'video',
            id,
            url: typeof candidate.url === 'string' ? candidate.url : 'https://example.com/watch',
            thumbnail: typeof candidate.thumbnail === 'string' ? candidate.thumbnail : '',
            caption: typeof candidate.caption === 'string' ? candidate.caption : 'Watch the latest demo',
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'icons': {
          const items = Array.isArray(candidate.items) && candidate.items.length
            ? candidate.items.map((item) => {
                const payload = item && typeof item === 'object' ? item : {};
                return {
                  label: typeof payload.label === 'string' ? payload.label : 'Feature',
                  icon: typeof payload.icon === 'string' ? payload.icon : '⭐',
                  url: typeof payload.url === 'string' ? payload.url : '#',
                };
              })
            : [
                { label: 'Fast setup', icon: '⚡', url: '#' },
                { label: 'Secure', icon: '🔒', url: '#' },
                { label: 'Support', icon: '💬', url: '#' },
              ];
          return {
            type: 'icons',
            id,
            items,
            align: this.#normaliseAlign(candidate.align, 'center'),
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        }
        case 'menu': {
          const items = Array.isArray(candidate.items) && candidate.items.length
            ? candidate.items.map((item) => {
                const payload = item && typeof item === 'object' ? item : {};
                return {
                  label: typeof payload.label === 'string' ? payload.label : 'Menu item',
                  url: typeof payload.url === 'string' ? payload.url : '#',
                };
              })
            : [
                { label: 'About', url: '#' },
                { label: 'Features', url: '#' },
                { label: 'Pricing', url: '#' },
              ];
          return {
            type: 'menu',
            id,
            items,
            align: this.#normaliseAlign(candidate.align, 'center'),
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        }
        case 'sticker':
          return {
            type: 'sticker',
            id,
            text: typeof candidate.text === 'string' ? candidate.text : 'New arrival',
            background: typeof candidate.background === 'string' ? candidate.background : '#fef08a',
            color: typeof candidate.color === 'string' ? candidate.color : '#92400e',
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        case 'gif':
          return {
            type: 'gif',
            id,
            url: typeof candidate.url === 'string' ? candidate.url : '',
            alt: typeof candidate.alt === 'string' ? candidate.alt : 'Animated moment',
            ...this.#normaliseBoxModel(candidate, {
              padding: '1.25rem',
              margin: '0',
              width: '100%',
            }),
          };
        default:
          const fallback = BLOCK_DEFS.paragraph.create();
          return { ...fallback, id };
      }
    }

    /**
     * Clamp alignment values to a supported option.
     * @param {any} value
     * @param {"left" | "center" | "right"} fallback
     * @returns {"left" | "center" | "right"}
     */
    #normaliseAlign(value, fallback) {
      return value === 'left' || value === 'center' || value === 'right' ? value : fallback;
    }

    /**
     * Normalise box model values for a block.
     * @param {any} candidate
     * @param {{ padding: string; margin: string; width: string }} defaults
     */
    #normaliseBoxModel(candidate, defaults) {
      const padding =
        candidate && typeof candidate.padding === 'string' && candidate.padding.trim().length
          ? candidate.padding
          : defaults.padding;
      const margin =
        candidate && typeof candidate.margin === 'string'
          ? candidate.margin
          : defaults.margin;
      const width =
        candidate && typeof candidate.width === 'string' && candidate.width.trim().length
          ? candidate.width
          : defaults.width;
      return { padding, margin, width };
    }

    /**
     * Emit a snapshot change event to consumers.
     * @param {string} type
     * @param {Record<string, any>} [detail]
     */
    #emitChange(type, detail = {}) {
      const event = new CustomEvent('change', {
        detail: {
          type,
          ...detail,
          blocks: this.blocks,
          settings: this.settings,
        },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }

    /** Render the block palette list. */
    #renderPalette() {
      if (!this.#palette) {
        return;
      }
      this.#palette.innerHTML = '';
      (/** @type {BlockType[]} */ (Object.keys(BLOCK_DEFS))).forEach((type) => {
        const def = BLOCK_DEFS[type];
        const button = document.createElement('button');
        button.type = 'button';
        button.draggable = true;
        button.innerHTML = `
          <span class="label">${def.icon} ${def.label}</span>
          <span class="description">${def.description}</span>
        `;
        button.addEventListener('dragstart', (event) => {
          const dataTransfer = event.dataTransfer;
          if (dataTransfer) {
            dataTransfer.setData('text/plain', `palette:${type}`);
            dataTransfer.setDragImage(button, 32, 32);
          }
        });
        button.addEventListener('click', () => {
          const block = def.create();
          this.#state.blocks = [...this.#state.blocks, block];
          this.#state.selected = block.id;
          this.#render();
          this.#tabButtons.forEach((btn) => {
            const text = btn.textContent ? btn.textContent.toLowerCase() : '';
            btn.classList.toggle('is-active', text === 'content');
          });
          this.#renderPanel('content');
          this.#emitChange('block:add', { id: block.id, type: block.type, source: 'click' });
        });
        this.#palette.append(button);
      });

      if (this.#paletteHelper) {
        this.#paletteHelper.hidden = this.#state.blocks.length > 0;
      }
    }

    /** Render placeholder guidance when no block is selected. */
    #renderContentOverview() {
      const section = document.createElement('section');
      section.className = 'panel-section';
      const heading = document.createElement('h3');
      heading.textContent = 'Content';
      section.append(heading);

      const helper = document.createElement('p');
      helper.className = 'field-description';
      helper.textContent = 'Select a block on the canvas to edit its properties. Use the Blocks panel to add more content.';
      section.append(helper);

      this.#panelContent.append(section);
    }

    /** Render the block-specific settings for the selected block. */
    #renderBlockSettings() {
      const block = this.#state.blocks.find((item) => item.id === this.#state.selected);
      if (!block) {
        this.#state.selected = null;
        this.#renderPanel('content');
        return;
      }
      const section = document.createElement('section');
      section.className = 'panel-section';
      const heading = document.createElement('h3');
      heading.textContent = `${BLOCK_DEFS[block.type].label} properties`;
      section.append(heading);

      switch (block.type) {
        case 'title':
          this.#renderTitleSettings(section, block);
          break;
        case 'paragraph':
          this.#renderParagraphSettings(section, block);
          break;
        case 'list':
          this.#renderListSettings(section, block);
          break;
        case 'image':
          this.#renderImageSettings(section, block);
          break;
        case 'button':
          this.#renderButtonSettings(section, block);
          break;
        case 'table':
          this.#renderTableSettings(section, block);
          break;
        case 'divider':
          this.#renderDividerSettings(section, block);
          break;
        case 'spacer':
          this.#renderSpacerSettings(section, block);
          break;
        case 'social':
          this.#renderSocialSettings(section, block);
          break;
        case 'html':
          this.#renderHtmlSettings(section, block);
          break;
        case 'video':
          this.#renderVideoSettings(section, block);
          break;
        case 'icons':
          this.#renderIconsSettings(section, block);
          break;
        case 'menu':
          this.#renderMenuSettings(section, block);
          break;
        case 'sticker':
          this.#renderStickerSettings(section, block);
          break;
        case 'gif':
          this.#renderGifSettings(section, block);
          break;
        default:
          break;
      }

      const backButton = document.createElement('button');
      backButton.type = 'button';
      backButton.textContent = '← Back to blocks';
      backButton.style.justifySelf = 'start';
      backButton.style.padding = '0.45rem 0.75rem';
      backButton.style.borderRadius = '0.6rem';
      backButton.style.border = '1px solid rgba(148,163,184,0.6)';
      backButton.style.background = 'rgba(248, 250, 252, 0.9)';
      backButton.style.cursor = 'pointer';
      backButton.addEventListener('click', () => {
        this.#state.selected = null;
        this.#renderPanel('content');
      });

      this.#panelContent.append(section, backButton);
    }

    /** Render the global design settings. */
    #renderGlobalSettings() {
      const section = document.createElement('section');
      section.className = 'panel-section';
      const heading = document.createElement('h3');
      heading.textContent = 'Design settings';
      section.append(heading);

      const widthInput = document.createElement('input');
      widthInput.type = 'range';
      widthInput.min = '420';
      widthInput.max = '760';
      widthInput.value = String(this.#state.settings.width);
      widthInput.addEventListener('input', () => {
        this.#state.settings.width = Number(widthInput.value);
        this.#renderBlocks();
        this.#emitChange('settings:update', { property: 'width' });
      });
      const widthField = makeField('Content area width', widthInput, `${widthInput.value}px`);
      widthInput.addEventListener('input', () => {
        widthField.querySelector('.field-description').textContent = `${widthInput.value}px`;
      });

      const alignField = document.createElement('div');
      alignField.className = 'field';
      const alignLabel = document.createElement('span');
      alignLabel.className = 'field-label';
      alignLabel.textContent = 'Content alignment';
      const alignOptions = document.createElement('div');
      alignOptions.className = 'inline-options';
      (['left', 'center', 'right']).forEach((value) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        if (this.#state.settings.align === value) {
          btn.classList.add('is-active');
        }
        btn.addEventListener('click', () => {
          this.#state.settings.align = /** @type {"left" | "center" | "right"} */ (value);
          Array.from(alignOptions.children).forEach((child) =>
            child.classList.toggle('is-active', child === btn)
          );
          this.#renderBlocks();
          this.#emitChange('settings:update', { property: 'align' });
        });
        alignOptions.append(btn);
      });
      alignField.append(alignLabel, alignOptions);

      const backgroundInput = document.createElement('input');
      backgroundInput.type = 'color';
      backgroundInput.value = this.#state.settings.background;
      backgroundInput.addEventListener('input', () => {
        this.#state.settings.background = backgroundInput.value;
        this.#renderBlocks();
        this.#emitChange('settings:update', { property: 'background' });
      });
      const backgroundField = makeField(
        'Workspace background',
        backgroundInput,
        'Applied behind the email canvas.'
      );

      const canvasBackgroundInput = document.createElement('input');
      canvasBackgroundInput.type = 'color';
      canvasBackgroundInput.value = this.#state.settings.canvasBackground;
      canvasBackgroundInput.addEventListener('input', () => {
        this.#state.settings.canvasBackground = canvasBackgroundInput.value;
        this.#renderBlocks();
        this.#emitChange('settings:update', { property: 'canvasBackground' });
      });
      const canvasBackgroundField = makeField(
        'Email background',
        canvasBackgroundInput,
        'Applied inside the email canvas area.'
      );

      section.append(widthField, alignField, backgroundField, canvasBackgroundField);
      this.#panelContent.append(section);
    }

    /**
     * @param {HTMLElement} section
     * @param {TitleBlock} block
     */
    #renderTitleSettings(section, block) {
      const textInput = document.createElement('textarea');
      textInput.value = block.text;
      textInput.rows = 2;
      textInput.addEventListener('input', () => {
        block.text = textInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'text' });
      });
      section.append(makeField('Heading text', textInput, 'Displayed as the section headline.'));

      const levelSelect = document.createElement('select');
      ['h1', 'h2', 'h3'].forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.toUpperCase();
        if (block.level === value) {
          option.selected = true;
        }
        levelSelect.append(option);
      });
      levelSelect.addEventListener('change', () => {
        block.level = /** @type {"h1" | "h2" | "h3"} */ (levelSelect.value);
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'level' });
      });
      section.append(makeField('Heading level', levelSelect, 'Choose the semantic heading size.'));

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = block.color;
      colorInput.addEventListener('input', () => {
        block.color = colorInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'color' });
      });
      section.append(makeField('Text colour', colorInput, 'Applies to this heading only.'));

      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {ParagraphBlock} block
     */
    #renderParagraphSettings(section, block) {
      const contentInput = document.createElement('textarea');
      contentInput.value = block.content;
      contentInput.addEventListener('input', () => {
        block.content = contentInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'content' });
      });
      section.append(makeField('Text', contentInput, 'Update the paragraph copy.'));

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = block.color;
      colorInput.addEventListener('input', () => {
        block.color = colorInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'color' });
      });
      section.append(makeField('Text colour', colorInput, 'Applies to this paragraph only.'));

      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {ListBlock} block
     */
    #renderListSettings(section, block) {
      const itemsInput = document.createElement('textarea');
      itemsInput.value = block.items.join('\n');
      itemsInput.rows = Math.max(3, block.items.length + 1);
      itemsInput.addEventListener('change', () => {
        const next = itemsInput.value
          .split('\n')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        block.items = next.length ? next : ['List item'];
        itemsInput.value = block.items.join('\n');
        itemsInput.rows = Math.max(3, block.items.length + 1);
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'items' });
      });
      section.append(
        makeField(
          'List items',
          itemsInput,
          'One entry per line. Empty lines are ignored.'
        )
      );

      const orderedToggle = document.createElement('input');
      orderedToggle.type = 'checkbox';
      orderedToggle.checked = block.ordered;
      orderedToggle.addEventListener('change', () => {
        block.ordered = orderedToggle.checked;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'ordered' });
      });
      const orderedField = document.createElement('label');
      orderedField.className = 'field';
      orderedField.style.alignItems = 'center';
      orderedField.style.display = 'flex';
      orderedField.style.gap = '0.5rem';
      orderedField.append(orderedToggle, document.createTextNode('Numbered list'));
      section.append(orderedField);

      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {ImageBlock} block
     */
    #renderImageSettings(section, block) {
      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.placeholder = 'https://example.com/image.png';
      urlInput.value = block.url;
      urlInput.addEventListener('change', () => {
        block.url = urlInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'url' });
      });
      section.append(makeField('Image URL', urlInput, 'Supports remote images.'));

      const altInput = document.createElement('input');
      altInput.type = 'text';
      altInput.value = block.alt;
      altInput.addEventListener('input', () => {
        block.alt = altInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'alt' });
      });
      section.append(makeField('Alt text', altInput, 'Displayed if the image cannot load.'));

      const radiusInput = document.createElement('input');
      radiusInput.type = 'text';
      radiusInput.value = block.borderRadius;
      radiusInput.addEventListener('change', () => {
        block.borderRadius = radiusInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'borderRadius' });
      });
      section.append(makeField('Rounded corners', radiusInput, 'Accepts any CSS border-radius value.'));

      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {ButtonBlock} block
     */
    #renderButtonSettings(section, block) {
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = block.label;
      labelInput.addEventListener('input', () => {
        block.label = labelInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'label' });
      });
      section.append(makeField('Button label', labelInput, 'Text shown on the button.'));

      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.placeholder = 'https://example.com';
      urlInput.value = block.url;
      urlInput.addEventListener('change', () => {
        block.url = urlInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'url' });
      });
      section.append(makeField('Destination URL', urlInput, 'Where people are sent on click.'));

      const backgroundInput = document.createElement('input');
      backgroundInput.type = 'color';
      backgroundInput.value = block.background;
      backgroundInput.addEventListener('input', () => {
        block.background = backgroundInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'background' });
      });
      section.append(makeField('Background colour', backgroundInput, 'Button fill colour.'));

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = block.color;
      colorInput.addEventListener('input', () => {
        block.color = colorInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'color' });
      });
      section.append(makeField('Text colour', colorInput, 'Button text colour.'));

      const radiusInput = document.createElement('input');
      radiusInput.type = 'text';
      radiusInput.value = block.borderRadius;
      radiusInput.addEventListener('change', () => {
        block.borderRadius = radiusInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'borderRadius' });
      });
      section.append(makeField('Border radius', radiusInput, 'Any CSS length value.'));

      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {TableBlock} block
     */
    #renderTableSettings(section, block) {
      const tableInput = document.createElement('textarea');
      tableInput.value = block.rows.map((row) => row.join(' | ')).join('\n');
      tableInput.rows = Math.max(3, block.rows.length + 1);
      tableInput.addEventListener('change', () => {
        const lines = tableInput.value
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const nextRows = lines.map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean));
        block.rows = nextRows.length ? nextRows : [['Column 1', 'Column 2']];
        tableInput.value = block.rows.map((row) => row.join(' | ')).join('\n');
        tableInput.rows = Math.max(3, block.rows.length + 1);
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'rows' });
      });
      section.append(
        makeField(
          'Table rows',
          tableInput,
          'Use the format "Cell 1 | Cell 2" per line to define each row.'
        )
      );

      const headerToggle = document.createElement('input');
      headerToggle.type = 'checkbox';
      headerToggle.checked = block.header;
      headerToggle.addEventListener('change', () => {
        block.header = headerToggle.checked;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'header' });
      });
      const headerField = document.createElement('label');
      headerField.className = 'field';
      headerField.style.display = 'flex';
      headerField.style.alignItems = 'center';
      headerField.style.gap = '0.5rem';
      headerField.append(headerToggle, document.createTextNode('Treat first row as header'));
      section.append(headerField);

      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {DividerBlock} block
     */
    #renderDividerSettings(section, block) {
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = block.color;
      colorInput.addEventListener('input', () => {
        block.color = colorInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'color' });
      });
      section.append(makeField('Divider colour', colorInput, 'Line colour.'));

      const thicknessInput = document.createElement('input');
      thicknessInput.type = 'text';
      thicknessInput.value = block.thickness;
      thicknessInput.placeholder = '2px';
      thicknessInput.addEventListener('change', () => {
        const value = thicknessInput.value.trim() || '1px';
        block.thickness = value;
        thicknessInput.value = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'thickness' });
      });
      section.append(makeField('Thickness', thicknessInput, 'CSS border width for the divider.'));

      const styleSelect = document.createElement('select');
      ['solid', 'dashed', 'dotted'].forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        if (block.style === value) {
          option.selected = true;
        }
        styleSelect.append(option);
      });
      styleSelect.addEventListener('change', () => {
        block.style = /** @type {"solid" | "dashed" | "dotted"} */ (styleSelect.value);
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'style' });
      });
      section.append(makeField('Line style', styleSelect, 'Choose the divider appearance.'));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {SpacerBlock} block
     */
    #renderSpacerSettings(section, block) {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '160';
      const parsed = parseInt(block.height, 10);
      slider.value = Number.isFinite(parsed) ? String(parsed) : '32';
      const field = makeField('Spacer height', slider, `${slider.value}px tall gap.`);
      slider.addEventListener('input', () => {
        const value = `${slider.value}px`;
        block.height = value;
        field.querySelector('.field-description').textContent = `${slider.value}px tall gap.`;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'height' });
      });
      section.append(field);

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {SocialBlock} block
     */
    #renderSocialSettings(section, block) {
      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      block.items.forEach((item, index) => {
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = item.label;
        labelInput.addEventListener('input', () => {
          item.label = labelInput.value;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].label` });
        });

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = item.url;
        urlInput.addEventListener('change', () => {
          item.url = urlInput.value;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].url` });
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'field';
        const legend = document.createElement('span');
        legend.className = 'field-label';
        legend.textContent = `${item.label || 'Social'} link`;
        wrapper.append(legend);

        const row = document.createElement('div');
        row.className = 'social-item';

        const iconPreview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconPreview.setAttribute('viewBox', '0 0 24 24');
        iconPreview.setAttribute('aria-hidden', 'true');
        {
          const initialIcon = ICON_PATHS[item.icon] ? ICON_PATHS[item.icon] : ICON_PATHS.twitter;
          iconPreview.innerHTML = `<path fill="currentColor" d="${initialIcon}" />`;
        }
        iconPreview.style.color = 'var(--wc-email-builder-accent)';

        const select = document.createElement('select');
        ['twitter', 'linkedin', 'instagram'].forEach((value) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
          if (item.icon === value) {
            option.selected = true;
          }
          select.append(option);
        });
        select.addEventListener('change', () => {
          item.icon = select.value;
          const path = ICON_PATHS[item.icon] ? ICON_PATHS[item.icon] : ICON_PATHS.twitter;
          iconPreview.innerHTML = `<path fill="currentColor" d="${path}" />`;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].icon` });
        });

        row.append(iconPreview, select);
        wrapper.append(row, makeField('Label', labelInput, 'Shown as a tooltip.'), makeField('URL', urlInput, 'Destination link.'));
        section.append(wrapper);
      });

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {HtmlBlock} block
     */
    #renderHtmlSettings(section, block) {
      const markupInput = document.createElement('textarea');
      markupInput.value = block.markup;
      markupInput.rows = 6;
      markupInput.addEventListener('change', () => {
        block.markup = markupInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'markup' });
      });
      section.append(
        makeField(
          'HTML markup',
          markupInput,
          'Paste inline HTML. Scripts are stripped when rendered.'
        )
      );

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {VideoBlock} block
     */
    #renderVideoSettings(section, block) {
      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.placeholder = 'https://example.com/watch';
      urlInput.value = block.url;
      urlInput.addEventListener('change', () => {
        block.url = urlInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'url' });
      });
      section.append(makeField('Video URL', urlInput, 'Links out to the hosted video.'));

      const thumbnailInput = document.createElement('input');
      thumbnailInput.type = 'url';
      thumbnailInput.placeholder = 'https://example.com/preview.jpg';
      thumbnailInput.value = block.thumbnail;
      thumbnailInput.addEventListener('change', () => {
        block.thumbnail = thumbnailInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'thumbnail' });
      });
      section.append(makeField('Thumbnail URL', thumbnailInput, 'Optional image preview.'));

      const captionInput = document.createElement('input');
      captionInput.type = 'text';
      captionInput.value = block.caption;
      captionInput.addEventListener('input', () => {
        block.caption = captionInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'caption' });
      });
      section.append(makeField('Caption', captionInput, 'Shown below the video preview.'));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {IconsBlock} block
     */
    #renderIconsSettings(section, block) {
      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      block.items.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'field';
        const legend = document.createElement('span');
        legend.className = 'field-label';
        legend.textContent = `Icon ${index + 1}`;
        wrapper.append(legend);

        const iconRow = document.createElement('div');
        iconRow.style.display = 'grid';
        iconRow.style.gridTemplateColumns = 'minmax(0,1fr) minmax(0,1fr)';
        iconRow.style.gap = '0.5rem';

        const iconInput = document.createElement('input');
        iconInput.type = 'text';
        iconInput.maxLength = 2;
        iconInput.value = item.icon;
        iconInput.addEventListener('input', () => {
          item.icon = iconInput.value || '⭐';
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].icon` });
        });

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = item.label;
        labelInput.addEventListener('input', () => {
          item.label = labelInput.value;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].label` });
        });

        iconRow.append(iconInput, labelInput);

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = item.url;
        urlInput.addEventListener('change', () => {
          item.url = urlInput.value;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].url` });
        });

        wrapper.append(iconRow, makeField('Link URL', urlInput, 'Optional link target.'));
        section.append(wrapper);
      });

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {MenuBlock} block
     */
    #renderMenuSettings(section, block) {
      section.append(this.#makeAlignField(block, (value) => {
        block.align = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'align' });
      }));

      block.items.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'field';
        const legend = document.createElement('span');
        legend.className = 'field-label';
        legend.textContent = `Menu item ${index + 1}`;
        wrapper.append(legend);

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = item.label;
        labelInput.addEventListener('input', () => {
          item.label = labelInput.value;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].label` });
        });

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = item.url;
        urlInput.addEventListener('change', () => {
          item.url = urlInput.value;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].url` });
        });

        wrapper.append(makeField('Label', labelInput, 'Visible navigation label.'), makeField('URL', urlInput, 'Destination link.'));
        section.append(wrapper);
      });

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {StickerBlock} block
     */
    #renderStickerSettings(section, block) {
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.value = block.text;
      textInput.addEventListener('input', () => {
        block.text = textInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'text' });
      });
      section.append(makeField('Sticker text', textInput, 'Short attention-grabbing label.'));

      const bgInput = document.createElement('input');
      bgInput.type = 'color';
      bgInput.value = block.background;
      bgInput.addEventListener('input', () => {
        block.background = bgInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'background' });
      });
      section.append(makeField('Background colour', bgInput, 'Sticker fill colour.'));

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = block.color;
      colorInput.addEventListener('input', () => {
        block.color = colorInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'color' });
      });
      section.append(makeField('Text colour', colorInput, 'Sticker text colour.'));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * @param {HTMLElement} section
     * @param {GifBlock} block
     */
    #renderGifSettings(section, block) {
      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.placeholder = 'https://example.com/animated.gif';
      urlInput.value = block.url;
      urlInput.addEventListener('change', () => {
        block.url = urlInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'url' });
      });
      section.append(makeField('GIF URL', urlInput, 'Link to the hosted GIF.'));

      const altInput = document.createElement('input');
      altInput.type = 'text';
      altInput.value = block.alt;
      altInput.addEventListener('input', () => {
        block.alt = altInput.value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'alt' });
      });
      section.append(makeField('Alt text', altInput, 'Accessibility description for the animation.'));

      this.#renderBoxModelControls(section, block);
    }

    /**
     * Render shared box model controls for a block.
     * @param {HTMLElement} section
     * @param {BlockConfig} block
     */
    #renderBoxModelControls(section, block) {
      const widthInput = document.createElement('input');
      widthInput.type = 'text';
      widthInput.value = block.width;
      widthInput.placeholder = '100%';
      widthInput.addEventListener('change', () => {
        const value = widthInput.value.trim() || '100%';
        block.width = value;
        widthInput.value = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'width' });
      });

      const paddingInput = document.createElement('input');
      paddingInput.type = 'text';
      paddingInput.value = block.padding;
      paddingInput.placeholder = '1.25rem';
      paddingInput.addEventListener('change', () => {
        const value = paddingInput.value.trim() || '0';
        block.padding = value;
        paddingInput.value = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'padding' });
      });

      const marginInput = document.createElement('input');
      marginInput.type = 'text';
      marginInput.value = block.margin;
      marginInput.placeholder = '0';
      marginInput.addEventListener('change', () => {
        const value = marginInput.value.trim() || '0';
        block.margin = value;
        marginInput.value = value;
        this.#renderBlocks();
        this.#emitChange('block:update', { id: block.id, property: 'margin' });
      });

      section.append(
        makeField('Width', widthInput, 'CSS width value (e.g. 100%, 480px).'),
        makeField('Padding', paddingInput, 'CSS padding applied to the block container.'),
        makeField('Margin', marginInput, 'CSS margin applied to the block container.')
      );
    }

    /**
     * Render a shared alignment control for blocks.
     * @template {{ align: "left" | "center" | "right" }} T
     * @param {T} block
     * @param {(value: "left" | "center" | "right") => void} onChange
     */
    #makeAlignField(block, onChange) {
      const alignField = document.createElement('div');
      alignField.className = 'field';
      const alignLabel = document.createElement('span');
      alignLabel.className = 'field-label';
      alignLabel.textContent = 'Alignment';
      const alignOptions = document.createElement('div');
      alignOptions.className = 'inline-options';
      (['left', 'center', 'right']).forEach((value) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        if (block.align === value) {
          btn.classList.add('is-active');
        }
        btn.addEventListener('click', () => {
          block.align = /** @type {"left" | "center" | "right"} */ (value);
          Array.from(alignOptions.children).forEach((child) =>
            child.classList.toggle('is-active', child === btn)
          );
          onChange(block.align);
        });
        alignOptions.append(btn);
      });
      alignField.append(alignLabel, alignOptions);
      return alignField;
    }

    /** Render canvas blocks. */
    #renderBlocks() {
      this.#hideDropIndicator();
      this.style.setProperty('--canvas-background', this.#state.settings.canvasBackground);
      const wrapper = this.#canvas.parentElement;
      if (wrapper instanceof HTMLElement) {
        wrapper.style.background = this.#state.settings.background;
      }
      this.#canvas.style.maxWidth = `${this.#state.settings.width}px`;
      this.#canvas.style.justifyItems = this.#state.settings.align;
      this.#canvas.innerHTML = '';
      if (this.#state.blocks.length === 0) {
        this.#canvas.classList.add('is-empty');
        const hint = document.createElement('div');
        hint.className = 'canvas-drop-hint';
        hint.innerHTML = `
          <strong>Drop blocks here</strong>
          <span>Use the Blocks panel to start designing your email layout.</span>
        `;
        this.#canvas.append(hint);
        return;
      }

      this.#canvas.classList.remove('is-empty');

      this.#state.blocks.forEach((block, index) => {
        const blockEl = document.createElement('article');
        blockEl.className = 'canvas-block';
        blockEl.draggable = true;
        blockEl.setAttribute('data-block-id', block.id);
        blockEl.setAttribute('role', 'listitem');
        blockEl.setAttribute('aria-posinset', String(index + 1));
        blockEl.setAttribute('aria-setsize', String(this.#state.blocks.length));
        blockEl.setAttribute('aria-label', `${block.type} block`);
        blockEl.setAttribute('aria-selected', String(this.#state.selected === block.id));

        blockEl.style.padding = block.padding || '0';
        blockEl.style.margin = block.margin || '0';
        blockEl.style.width = block.width || '100%';

        blockEl.addEventListener('dragstart', (event) => {
          const dataTransfer = event.dataTransfer;
          if (dataTransfer) {
            dataTransfer.setData('text/plain', `block:${block.id}`);
            dataTransfer.setDragImage(blockEl, 32, 32);
          }
        });

        const actions = document.createElement('div');
        actions.className = 'block-actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.setAttribute('aria-label', 'Delete block');
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          this.#deleteBlock(block.id);
        });
        actions.append(deleteBtn);

        blockEl.append(actions, this.#renderBlock(block));
        this.#canvas.append(blockEl);
      });
    }

    /**
     * @param {BlockConfig} block
     */
    #renderBlock(block) {
      switch (block.type) {
        case 'title': {
          const wrapper = document.createElement('div');
          wrapper.className = 'title-block';
          wrapper.style.setProperty('--block-align', block.align);
          const heading = document.createElement(block.level);
          heading.textContent = block.text;
          heading.className = 'title-block-heading';
          heading.style.color = block.color;
          wrapper.append(heading);
          return wrapper;
        }
        case 'paragraph': {
          const paragraph = document.createElement('div');
          paragraph.className = 'paragraph-block';
          paragraph.style.setProperty('--block-align', block.align);
          paragraph.style.setProperty('--block-color', block.color);
          paragraph.textContent = block.content;
          return paragraph;
        }
        case 'list': {
          const wrapper = document.createElement('div');
          wrapper.className = 'list-block';
          wrapper.style.setProperty('--block-align', block.align);
          const list = document.createElement(block.ordered ? 'ol' : 'ul');
          block.items.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            list.append(li);
          });
          wrapper.append(list);
          return wrapper;
        }
        case 'image': {
          const wrapper = document.createElement('div');
          wrapper.className = 'image-block';
          wrapper.style.setProperty('--block-align', block.align);
          wrapper.style.setProperty('--block-radius', block.borderRadius);
          if (block.url) {
            const img = document.createElement('img');
            img.src = block.url;
            img.alt = block.alt;
            img.style.width = block.autoWidth ? '100%' : 'auto';
            wrapper.append(img);
          } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = '<strong>Drop an image</strong><br /><small>Paste a URL to display it.</small>';
            wrapper.append(placeholder);
          }
          return wrapper;
        }
        case 'button': {
          const wrapper = document.createElement('div');
          wrapper.className = 'button-block';
          wrapper.style.setProperty('--block-align', block.align);
          wrapper.style.setProperty('--block-background', block.background);
          wrapper.style.setProperty('--block-color', block.color);
          wrapper.style.setProperty('--block-radius', block.borderRadius);
          const anchor = document.createElement('a');
          anchor.href = block.url || '#';
          anchor.textContent = block.label || 'Button';
          anchor.setAttribute('role', 'button');
          wrapper.append(anchor);
          return wrapper;
        }
        case 'table': {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-block';
          wrapper.style.setProperty('--block-align', block.align);
          const table = document.createElement('table');
          if (block.rows.length) {
            block.rows.forEach((row, index) => {
              const tr = document.createElement('tr');
              row.forEach((cell) => {
                const cellEl = document.createElement(index === 0 && block.header ? 'th' : 'td');
                cellEl.textContent = cell;
                tr.append(cellEl);
              });
              table.append(tr);
            });
          }
          wrapper.append(table);
          return wrapper;
        }
        case 'divider': {
          const divider = document.createElement('div');
          divider.className = 'divider-block';
          divider.style.setProperty('--divider-color', block.color);
          divider.style.setProperty('--divider-thickness', block.thickness);
          divider.style.setProperty('--divider-style', block.style);
          return divider;
        }
        case 'spacer': {
          const spacer = document.createElement('div');
          spacer.className = 'spacer-block';
          spacer.style.height = block.height;
          return spacer;
        }
        case 'social': {
          const wrapper = document.createElement('div');
          wrapper.className = 'social-block';
          wrapper.style.setProperty('--block-align', block.align);
          const list = document.createElement('div');
          list.className = 'social-list';
          block.items.forEach((item) => {
            const link = document.createElement('a');
            link.href = item.url || '#';
            link.title = item.label;
            link.setAttribute('aria-label', item.label);
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.setAttribute('aria-hidden', 'true');
            const iconPath = ICON_PATHS[item.icon] ? ICON_PATHS[item.icon] : ICON_PATHS.twitter;
            icon.innerHTML = `<path fill="currentColor" d="${iconPath}" />`;
            link.append(icon);
            list.append(link);
          });
          wrapper.append(list);
          return wrapper;
        }
        case 'html': {
          const wrapper = document.createElement('div');
          wrapper.className = 'html-block';
          wrapper.innerHTML = this.#sanitiseHtml(block.markup);
          return wrapper;
        }
        case 'video': {
          const wrapper = document.createElement('div');
          wrapper.className = 'video-block';
          const anchor = document.createElement('a');
          anchor.href = block.url || '#';
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.className = 'video-block-link';
          if (block.thumbnail) {
            const img = document.createElement('img');
            img.src = block.thumbnail;
            img.alt = block.caption || 'Video preview';
            anchor.append(img);
          } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'video-placeholder';
            placeholder.textContent = 'Video preview';
            anchor.append(placeholder);
          }
          wrapper.append(anchor);
          if (block.caption) {
            const caption = document.createElement('p');
            caption.className = 'video-caption';
            caption.textContent = block.caption;
            wrapper.append(caption);
          }
          return wrapper;
        }
        case 'icons': {
          const wrapper = document.createElement('div');
          wrapper.className = 'icons-block';
          wrapper.style.setProperty('--block-align', block.align);
          const list = document.createElement('div');
          list.className = 'icons-list';
          block.items.forEach((item) => {
            const card = document.createElement('a');
            card.href = item.url || '#';
            card.className = 'icons-item';
            const symbol = document.createElement('span');
            symbol.className = 'icons-symbol';
            symbol.textContent = item.icon;
            const label = document.createElement('span');
            label.className = 'icons-label';
            label.textContent = item.label;
            card.append(symbol, label);
            list.append(card);
          });
          wrapper.append(list);
          return wrapper;
        }
        case 'menu': {
          const wrapper = document.createElement('nav');
          wrapper.className = 'menu-block';
          wrapper.style.setProperty('--block-align', block.align);
          block.items.forEach((item) => {
            const link = document.createElement('a');
            link.href = item.url || '#';
            link.textContent = item.label;
            wrapper.append(link);
          });
          return wrapper;
        }
        case 'sticker': {
          const sticker = document.createElement('div');
          sticker.className = 'sticker-block';
          sticker.style.setProperty('--sticker-bg', block.background);
          sticker.style.setProperty('--sticker-color', block.color);
          sticker.textContent = block.text;
          return sticker;
        }
        case 'gif': {
          const wrapper = document.createElement('div');
          wrapper.className = 'gif-block';
          if (block.url) {
            const img = document.createElement('img');
            img.src = block.url;
            img.alt = block.alt;
            img.loading = 'lazy';
            wrapper.append(img);
          } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'gif-placeholder';
            placeholder.textContent = 'Paste a GIF URL to display it.';
            wrapper.append(placeholder);
          }
          return wrapper;
        }
        default:
          return document.createElement('div');
      }
    }

    /**
     * Remove unsafe tags and event handlers from custom HTML snippets.
     * @param {string} markup
     */
    #sanitiseHtml(markup) {
      const template = document.createElement('template');
      template.innerHTML = markup;
      template.content.querySelectorAll('script').forEach((node) => node.remove());
      template.content.querySelectorAll('*').forEach((element) => {
        Array.from(element.attributes).forEach((attr) => {
          if (attr.name.toLowerCase().startsWith('on')) {
            element.removeAttribute(attr.name);
          }
        });
      });
      return template.innerHTML;
    }

    /**
     * Escape HTML special characters within a text node.
     * @param {string} value
     */
    #escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    /** Escape attribute values. */
    #escapeAttr(value) {
      return this.#escapeHtml(value);
    }

    /**
     * Format margin/padding/width styles for export.
     * @param {BaseBlock} block
     */
    #formatBoxStyles(block) {
      const styles = [];
      if (block.margin) {
        styles.push(`margin:${block.margin}`);
      }
      if (block.padding) {
        styles.push(`padding:${block.padding}`);
      }
      if (block.width) {
        styles.push(`width:${block.width}`);
      }
      return styles.join(';');
    }

    /**
     * Convert a block configuration into HTML markup for export.
     * @param {BlockConfig} block
     */
    #blockToHtml(block) {
      const style = this.#formatBoxStyles(block);
      const styleAttr = style ? ` style="${this.#escapeAttr(style)}"` : '';
      const wrap = (content) => `<div${styleAttr}>${content}</div>`;
      switch (block.type) {
        case 'title': {
          const heading = `<${block.level} style="margin:0;text-align:${block.align};color:${this.#escapeAttr(
            block.color
          )};font-family:inherit;">${this.#escapeHtml(block.text)}</${block.level}>`;
          return wrap(heading);
        }
        case 'paragraph': {
          const paragraph = `<p style="margin:0;text-align:${block.align};color:${this.#escapeAttr(
            block.color
          )};line-height:1.6;">${this.#escapeHtml(block.content)}</p>`;
          return wrap(paragraph);
        }
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul';
          const items = block.items
            .map((item) => `<li style="margin-bottom:0.35rem;">${this.#escapeHtml(item)}</li>`)
            .join('');
          const list = `<${tag} style="margin:0;padding-left:1.25rem;">${items}</${tag}>`;
          const inner = `<div style="text-align:${block.align};">${list}</div>`;
          return wrap(inner);
        }
        case 'image': {
          if (!block.url) {
            return wrap(
              '<div style="color:#94a3b8;font-style:italic;text-align:center;">Image placeholder</div>'
            );
          }
          const styles = [`max-width:100%`, `border-radius:${this.#escapeAttr(block.borderRadius)}`];
          if (block.autoWidth) {
            styles.push('width:100%');
          }
          const img = `<img src="${this.#escapeAttr(block.url)}" alt="${this.#escapeAttr(
            block.alt
          )}" style="${this.#escapeAttr(styles.join(';'))}" />`;
          const inner = `<div style="text-align:${block.align};">${img}</div>`;
          return wrap(inner);
        }
        case 'button': {
          const buttonStyles = [
            'display:inline-block',
            'padding:0.85rem 1.75rem',
            `background:${this.#escapeAttr(block.background)}`,
            `color:${this.#escapeAttr(block.color)}`,
            `border-radius:${this.#escapeAttr(block.borderRadius)}`,
            'text-decoration:none',
            'font-weight:600'
          ].join(';');
          const anchor = `<a href="${this.#escapeAttr(block.url || '#')}" style="${this.#escapeAttr(
            buttonStyles
          )}">${this.#escapeHtml(block.label)}</a>`;
          const inner = `<div style="text-align:${block.align};">${anchor}</div>`;
          return wrap(inner);
        }
        case 'table': {
          const rows = block.rows
            .map((row, rowIndex) => {
              const cellTag = rowIndex === 0 && block.header ? 'th' : 'td';
              const cells = row
                .map(
                  (cell) =>
                    `<${cellTag} style="padding:0.75rem 1rem;border-bottom:1px solid #e2e8f0;text-align:left;">${this.#escapeHtml(
                      cell
                    )}</${cellTag}>`
                )
                .join('');
              return `<tr>${cells}</tr>`;
            })
            .join('');
          const table = `<table style="border-collapse:collapse;width:100%;">${rows}</table>`;
          const inner = `<div style="text-align:${block.align};">${table}</div>`;
          return wrap(inner);
        }
        case 'divider': {
          const divider = `<hr style="border:none;border-top:${this.#escapeAttr(
            block.thickness
          )} ${this.#escapeAttr(block.style)} ${this.#escapeAttr(block.color)};margin:0;" />`;
          return wrap(divider);
        }
        case 'spacer':
          return wrap(`<div style="height:${this.#escapeAttr(block.height)};"></div>`);
        case 'social': {
          const links = block.items
            .map((item) => {
              const text = item.label || item.icon || 'Social';
              return `<a href="${this.#escapeAttr(item.url || '#')}" style="display:inline-block;margin-right:12px;padding:0.5rem 0.75rem;border-radius:999px;background:#ede9fe;color:#6d28d9;text-decoration:none;font-weight:600;">${this.#escapeHtml(
                text
              )}</a>`;
            })
            .join('');
          const inner = `<div style="text-align:${block.align};">${links}</div>`;
          return wrap(inner);
        }
        case 'html':
          return wrap(this.#sanitiseHtml(block.markup));
        case 'video': {
          const preview = block.thumbnail
            ? `<img src="${this.#escapeAttr(block.thumbnail)}" alt="${this.#escapeAttr(
                block.caption || 'Video preview'
              )}" style="max-width:100%;border-radius:0.75rem;" />`
            : '<span style="display:inline-block;padding:1rem 1.5rem;border-radius:0.75rem;background:#f3f4f6;">Video preview</span>';
          const caption = block.caption
            ? `<p style="margin:0.5rem 0 0;color:#475569;font-size:0.85rem;">${this.#escapeHtml(block.caption)}</p>`
            : '';
          const anchor = `<a href="${this.#escapeAttr(block.url || '#')}" style="text-decoration:none;color:inherit;">${preview}</a>`;
          return wrap(`${anchor}${caption}`);
        }
        case 'icons': {
          const cards = block.items
            .map(
              (item) =>
                `<a href="${this.#escapeAttr(item.url || '#')}" style="display:inline-block;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid #e5e7eb;margin:0.25rem;text-decoration:none;color:inherit;">` +
                `<span style="font-size:1.5rem;">${this.#escapeHtml(item.icon)}</span>` +
                `<span style="display:block;font-weight:600;margin-top:0.25rem;">${this.#escapeHtml(item.label)}</span>` +
                `</a>`
            )
            .join('');
          const inner = `<div style="text-align:${block.align};">${cards}</div>`;
          return wrap(inner);
        }
        case 'menu': {
          const items = block.items
            .map(
              (item) =>
                `<a href="${this.#escapeAttr(item.url || '#')}" style="margin-right:1.25rem;text-decoration:none;color:inherit;font-weight:600;">${this.#escapeHtml(
                  item.label
                )}</a>`
            )
            .join('');
          const inner = `<nav style="text-align:${block.align};">${items}</nav>`;
          return wrap(inner);
        }
        case 'sticker': {
          const sticker = `<span style="display:inline-block;padding:0.35rem 0.85rem;border-radius:999px;background:${this.#escapeAttr(
            block.background
          )};color:${this.#escapeAttr(block.color)};font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-size:0.7rem;">${this.#escapeHtml(
            block.text
          )}</span>`;
          return wrap(sticker);
        }
        case 'gif': {
          if (!block.url) {
            return wrap(
              '<div style="color:#94a3b8;font-style:italic;text-align:center;">GIF placeholder</div>'
            );
          }
          const img = `<img src="${this.#escapeAttr(block.url)}" alt="${this.#escapeAttr(
            block.alt
          )}" style="max-width:100%;border-radius:0.75rem;" />`;
          return wrap(img);
        }
        default:
          return '';
      }
    }

    /** Trigger an HTML file download of the current layout. */
    #exportHtml() {
      const blockMarkup = this.#state.blocks.map((block) => this.#blockToHtml(block)).join('\n');
      const workspaceStyle = [
        'margin:0',
        `padding:32px`,
        `background:${this.#state.settings.background}`,
        'font-family:Arial,Helvetica,sans-serif',
        'color:#0f172a'
      ].join(';');
      const canvasStyle = [
        'margin:0 auto',
        `max-width:${this.#state.settings.width}px`,
        `background:${this.#state.settings.canvasBackground}`,
        'padding:32px',
        'border-radius:12px',
        'display:grid',
        'gap:24px',
        `justify-items:${this.#state.settings.align}`
      ].join(';');
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Email export</title>
</head>
<body style="${this.#escapeAttr(workspaceStyle)}">
  <div style="${this.#escapeAttr(canvasStyle)}">
    ${blockMarkup || '<p style="margin:0;">Add content to your email.</p>'}
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'email.html';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }

    /** Trigger a full rerender. */
    #render() {
      this.#renderBlocks();
      this.#renderPalette();
      const activeButton = this.#tabButtons.find((btn) => btn.classList.contains('is-active'));
      const activeTab =
        activeButton && activeButton.textContent
          ? activeButton.textContent.toLowerCase()
          : 'content';
      this.#renderPanel(/** @type {"content" | "rows" | "settings"} */ (activeTab));
    }
  }

  if (!customElements.get('wc-email-builder')) {
    customElements.define('wc-email-builder', WcEmailBuilder);
  }
})();

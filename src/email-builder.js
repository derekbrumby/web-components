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
   * @typedef {"paragraph" | "image" | "button" | "social"} BlockType
   */

  /**
   * @typedef ParagraphBlock
   * @property {"paragraph"} type
   * @property {string} id
   * @property {string} content
   * @property {"left" | "center" | "right"} align
   * @property {string} color
   */

  /**
   * @typedef ImageBlock
   * @property {"image"} type
   * @property {string} id
   * @property {string} url
   * @property {string} alt
   * @property {"left" | "center" | "right"} align
   * @property {boolean} autoWidth
   * @property {string} borderRadius
   */

  /**
   * @typedef ButtonBlock
   * @property {"button"} type
   * @property {string} id
   * @property {string} label
   * @property {string} url
   * @property {string} background
   * @property {string} color
   * @property {string} borderRadius
   * @property {"left" | "center" | "right"} align
   */

  /**
   * @typedef SocialBlock
   * @property {"social"} type
   * @property {string} id
   * @property {{ label: string; url: string; icon: string }[]} items
   * @property {"left" | "center" | "right"} align
   */

  /**
   * @typedef {ParagraphBlock | ImageBlock | ButtonBlock | SocialBlock} BlockConfig
   */

  const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

  const SOCIAL_TEMPLATE = /** @type {const} */ ([
    { label: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
    { label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' },
    { label: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
  ]);

  const BLOCK_DEFS = /** @type {const} */ ({
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
          --wc-email-builder-outline: 2px solid rgba(124, 58, 237, 0.32);
          display: block;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: var(--wc-email-builder-text);
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
          padding: 1.25rem;
          border: 1px solid transparent;
          background: #ffffff;
          box-shadow: 0 18px 40px -36px rgba(15, 23, 42, 0.45);
          cursor: grab;
          position: relative;
          outline: none;
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

        .paragraph-block {
          color: var(--block-color, #1f2937);
          text-align: var(--block-align, left);
          line-height: 1.6;
          font-size: 1rem;
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
          background: rgba(255, 255, 255, 0.9);
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
          background: rgba(255, 255, 255, 0.85);
          font: inherit;
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

      this.#canvas.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move';
        }
      });

      this.#canvas.addEventListener('drop', (event) => {
        event.preventDefault();
        const data = event.dataTransfer?.getData('text/plain');
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
        case 'paragraph':
          return {
            type: 'paragraph',
            id,
            content: typeof candidate.content === 'string' ? candidate.content : "I'm a new paragraph block.",
            align: this.#normaliseAlign(candidate.align, 'left'),
            color: typeof candidate.color === 'string' ? candidate.color : '#1f2937',
          };
        case 'image':
          return {
            type: 'image',
            id,
            url: typeof candidate.url === 'string' ? candidate.url : '',
            alt: typeof candidate.alt === 'string' ? candidate.alt : 'Campaign visual',
            align: this.#normaliseAlign(candidate.align, 'center'),
            autoWidth: typeof candidate.autoWidth === 'boolean' ? candidate.autoWidth : true,
            borderRadius: typeof candidate.borderRadius === 'string' ? candidate.borderRadius : '12px',
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
          };
        case 'social': {
          const items = Array.isArray(candidate.items) && candidate.items.length
            ? candidate.items.map((item) => ({
                label: typeof item?.label === 'string' ? item.label : 'Social',
                url: typeof item?.url === 'string' ? item.url : '#',
                icon: ICON_PATHS[/** @type {keyof typeof ICON_PATHS} */ (item?.icon)] ? item.icon : 'twitter',
              }))
            : SOCIAL_TEMPLATE.map((item) => ({ ...item }));
          return {
            type: 'social',
            id,
            items,
            align: this.#normaliseAlign(candidate.align, 'center'),
          };
        }
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
          event.dataTransfer?.setData('text/plain', `palette:${type}`);
          event.dataTransfer?.setDragImage(button, 32, 32);
        });
        button.addEventListener('click', () => {
          const block = def.create();
          this.#state.blocks = [...this.#state.blocks, block];
          this.#state.selected = block.id;
          this.#render();
          this.#tabButtons.forEach((btn) =>
            btn.classList.toggle('is-active', btn.textContent?.toLowerCase() === 'content')
          );
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
        case 'paragraph':
          this.#renderParagraphSettings(section, block);
          break;
        case 'image':
          this.#renderImageSettings(section, block);
          break;
        case 'button':
          this.#renderButtonSettings(section, block);
          break;
        case 'social':
          this.#renderSocialSettings(section, block);
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
        iconPreview.innerHTML = `<path fill="currentColor" d="${ICON_PATHS[item.icon] ?? ICON_PATHS.twitter}" />`;
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
          iconPreview.innerHTML = `<path fill="currentColor" d="${ICON_PATHS[item.icon]}" />`;
          this.#renderBlocks();
          this.#emitChange('block:update', { id: block.id, property: `items[${index}].icon` });
        });

        row.append(iconPreview, select);
        wrapper.append(row, makeField('Label', labelInput, 'Shown as a tooltip.'), makeField('URL', urlInput, 'Destination link.'));
        section.append(wrapper);
      });
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

        blockEl.addEventListener('dragstart', (event) => {
          event.dataTransfer?.setData('text/plain', `block:${block.id}`);
          event.dataTransfer?.setDragImage(blockEl, 32, 32);
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
        case 'paragraph': {
          const paragraph = document.createElement('div');
          paragraph.className = 'paragraph-block';
          paragraph.style.setProperty('--block-align', block.align);
          paragraph.style.setProperty('--block-color', block.color);
          paragraph.textContent = block.content;
          return paragraph;
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
            placeholder.style.border = '2px dashed rgba(148,163,184,0.5)';
            placeholder.style.padding = '1.5rem';
            placeholder.style.borderRadius = 'inherit';
            placeholder.style.textAlign = 'center';
            placeholder.style.color = 'var(--wc-email-builder-muted)';
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
            icon.innerHTML = `<path fill="currentColor" d="${ICON_PATHS[item.icon] ?? ICON_PATHS.twitter}" />`;
            link.append(icon);
            list.append(link);
          });
          wrapper.append(list);
          return wrapper;
        }
        default:
          return document.createElement('div');
      }
    }

    /** Trigger a full rerender. */
    #render() {
      this.#renderBlocks();
      this.#renderPalette();
      const activeTab = this.#tabButtons.find((btn) => btn.classList.contains('is-active'))?.textContent?.toLowerCase() ?? 'content';
      this.#renderPanel(/** @type {"content" | "rows" | "settings"} */ (activeTab));
    }
  }

  if (!customElements.get('wc-email-builder')) {
    customElements.define('wc-email-builder', WcEmailBuilder);
  }
})();

/**
 * @file item.js
 * @version 1.0.0
 *
 * Flexible content rows inspired by the shadcn/ui Item primitive. The module
 * registers a family of custom elements for composing media, titles,
 * descriptions, headers, footers, and action areas in a compact layout. Each
 * element exposes CSS custom properties and parts for theming without
 * introducing any runtime dependencies.
 */

(() => {
  if (customElements.get('wc-item')) {
    return;
  }

  /**
   * Normalise a string token against an allowed set.
   *
   * @param {string | null} value
   * @param {Set<string>} tokens
   * @param {string} fallback
   */
  const normaliseToken = (value, tokens, fallback) => {
    if (typeof value !== 'string') {
      return fallback;
    }

    const token = value.trim().toLowerCase();
    return tokens.has(token) ? token : fallback;
  };

  const ITEM_VARIANTS = new Set(['default', 'outline', 'muted']);
  const ITEM_SIZES = new Set(['default', 'sm']);
  const MEDIA_VARIANTS = new Set(['default', 'icon', 'image']);

  /**
   * Structured container for arranging media, content, and actions.
   */
  class WcItem extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    static get observedAttributes() {
      return ['variant', 'size', 'interactive'];
    }

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-item-background: rgba(248, 250, 252, 0.85);
            --wc-item-foreground: rgb(15, 23, 42);
            --wc-item-muted-foreground: rgba(71, 85, 105, 0.92);
            --wc-item-border-color: rgba(148, 163, 184, 0.45);
            --wc-item-hover-border-color: rgba(99, 102, 241, 0.35);
            --wc-item-hover-shadow: 0 22px 44px -34px rgba(15, 23, 42, 0.35);
            --wc-item-radius: 0.9rem;
            --wc-item-padding-block: 0.85rem;
            --wc-item-padding-inline: 1rem;
            --wc-item-gap: 0.75rem;
            display: block;
            color: var(--wc-item-foreground);
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="surface"] {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--wc-item-gap);
            padding-block: var(--wc-item-padding-block);
            padding-inline: var(--wc-item-padding-inline);
            border-radius: var(--wc-item-radius);
            background: var(--wc-item-background);
            border: 1px solid var(--wc-item-border-color);
            color: inherit;
            text-decoration: none;
            min-inline-size: 0;
            transition: border-color 160ms ease, box-shadow 160ms ease,
              background-color 160ms ease;
          }

          :host(:where(:hover, :focus-within)) [part="surface"] {
            border-color: var(--wc-item-hover-border-color);
            box-shadow: var(--wc-item-hover-shadow);
          }

          :host(:focus-visible) [part="surface"] {
            outline: 3px solid rgba(99, 102, 241, 0.45);
            outline-offset: 3px;
          }

          :host([interactive]) [part="surface"] {
            cursor: pointer;
          }

          :host([variant="outline"]) [part="surface"] {
            background: transparent;
            border-color: rgba(148, 163, 184, 0.6);
          }

          :host([variant="muted"]) {
            color: rgba(30, 41, 59, 0.96);
          }

          :host([variant="muted"]) [part="surface"] {
            background: rgba(226, 232, 240, 0.55);
            border-color: rgba(203, 213, 225, 0.9);
          }

          :host([size="sm"]) {
            font-size: 0.925rem;
          }

          :host([size="sm"]) [part="surface"] {
            --wc-item-gap: 0.6rem;
            --wc-item-padding-block: 0.55rem;
            --wc-item-padding-inline: 0.75rem;
          }

          ::slotted(*) {
            min-inline-size: 0;
            color: inherit;
          }

          ::slotted(a) {
            color: inherit;
            text-decoration: none;
            display: contents;
          }

          ::slotted(wc-item-content),
          ::slotted(wc-item-header),
          ::slotted(wc-item-footer) {
            flex: 1 1 auto;
          }

          ::slotted(wc-item-footer) {
            flex-basis: 100%;
          }

          ::slotted(wc-item-actions) {
            flex: 0 0 auto;
            margin-inline-start: auto;
          }

          ::slotted(wc-item-media) {
            flex: 0 0 auto;
          }
        </style>
        <div part="surface">
          <slot></slot>
        </div>
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }

      this.#applyVariant();
      this.#applySize();
      this.#syncInteractive();
    }

    /** @param {string} name */
    attributeChangedCallback(name) {
      if (name === 'variant') {
        this.#applyVariant();
      } else if (name === 'size') {
        this.#applySize();
      } else if (name === 'interactive') {
        this.#syncInteractive();
      }
    }

    #applyVariant() {
      const value = this.getAttribute('variant');
      const next = normaliseToken(value, ITEM_VARIANTS, 'default');

      if (next === 'default') {
        if (value !== null && value !== 'default') {
          this.removeAttribute('variant');
        }
      } else if (value !== next) {
        this.setAttribute('variant', next);
      }
    }

    #applySize() {
      const value = this.getAttribute('size');
      const next = normaliseToken(value, ITEM_SIZES, 'default');

      if (next === 'default') {
        if (value !== null && value !== 'default') {
          this.removeAttribute('size');
        }
      } else if (value !== next) {
        this.setAttribute('size', next);
      }
    }

    #syncInteractive() {
      if (this.hasAttribute('interactive')) {
        if (!this.hasAttribute('tabindex')) {
          this.setAttribute('tabindex', '0');
        }
      } else if (this.getAttribute('tabindex') === '0') {
        this.removeAttribute('tabindex');
      }
    }
  }

  /**
   * Stack titles and descriptions within an item.
   */
  class WcItemContent extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            min-inline-size: 0;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="content"] {
            display: flex;
            flex-direction: column;
            gap: var(--wc-item-content-gap, 0.4rem);
            min-inline-size: 0;
          }
        </style>
        <div part="content">
          <slot></slot>
        </div>
      `;
    }
  }

  /**
   * Optional media slot for icons, avatars, or images.
   */
  class WcItemMedia extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    static get observedAttributes() {
      return ['variant'];
    }

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 0 0 auto;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="media"] {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--wc-item-media-radius, 0.75rem);
            background: var(--wc-item-media-background, rgba(226, 232, 240, 0.65));
            color: inherit;
            min-width: 2.25rem;
            min-height: 2.25rem;
            overflow: hidden;
          }

          :host([variant="icon"]) [part="media"] {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: var(--wc-item-media-radius, 0.85rem);
            background: var(--wc-item-media-background, rgba(226, 232, 240, 0.45));
          }

          :host([variant="image"]) [part="media"] {
            width: 3rem;
            height: 3rem;
            background: transparent;
          }

          :host([variant="image"]) ::slotted(img),
          :host([variant="image"]) ::slotted(picture),
          :host([variant="image"]) ::slotted(video),
          :host([variant="image"]) ::slotted(svg) {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        </style>
        <div part="media">
          <slot></slot>
        </div>
      `;
    }

    connectedCallback() {
      this.#applyVariant();
    }

    /** @param {string} name */
    attributeChangedCallback(name) {
      if (name === 'variant') {
        this.#applyVariant();
      }
    }

    #applyVariant() {
      const value = this.getAttribute('variant');
      const next = normaliseToken(value, MEDIA_VARIANTS, 'default');

      if (next === 'default') {
        if (value !== null && value !== 'default') {
          this.removeAttribute('variant');
        }
      } else if (value !== next) {
        this.setAttribute('variant', next);
      }
    }
  }

  /**
   * Title text rendered with a semibold weight.
   */
  class WcItemTitle extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="title"] {
            margin: 0;
            font: inherit;
            font-weight: 600;
            line-height: 1.3;
          }
        </style>
        <p part="title">
          <slot></slot>
        </p>
      `;
    }
  }

  /**
   * Secondary description text styled with muted foreground colour.
   */
  class WcItemDescription extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="description"] {
            margin: 0;
            color: var(--wc-item-muted-foreground, rgba(71, 85, 105, 0.92));
            font-size: 0.95em;
            line-height: 1.5;
          }
        </style>
        <p part="description">
          <slot></slot>
        </p>
      `;
    }
  }

  /**
   * Container for right-aligned buttons or other interactive controls.
   */
  class WcItemActions extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 0 0 auto;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="actions"] {
            display: inline-flex;
            align-items: center;
            justify-content: flex-end;
            gap: var(--wc-item-actions-gap, 0.5rem);
            min-height: 2rem;
          }
        </style>
        <div part="actions">
          <slot></slot>
        </div>
      `;
    }
  }

  /**
   * Optional header section to pin imagery or supporting content above the row.
   */
  class WcItemHeader extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 1 0 100%;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="header"] {
            display: block;
            width: 100%;
            border-radius: calc(var(--wc-item-radius, 0.9rem) - 0.2rem);
            overflow: hidden;
          }
        </style>
        <div part="header">
          <slot></slot>
        </div>
      `;
    }
  }

  /**
   * Optional footer spanning the full width of the item.
   */
  class WcItemFooter extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 1 0 100%;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="footer"] {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: var(--wc-item-footer-gap, 0.65rem);
            padding-top: var(--wc-item-footer-padding, 0.35rem);
          }
        </style>
        <footer part="footer">
          <slot></slot>
        </footer>
      `;
    }
  }

  /**
   * Group wrapper that keeps adjacent items evenly spaced.
   */
  class WcItemGroup extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="group"] {
            display: flex;
            flex-direction: column;
            gap: var(--wc-item-group-gap, 0.75rem);
          }
        </style>
        <div part="group">
          <slot></slot>
        </div>
      `;
    }
  }

  /**
   * Visual separator placed between grouped items.
   */
  class WcItemSeparator extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 1 0 100%;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="separator"] {
            margin: 0;
            border: none;
            border-top: 1px solid rgba(148, 163, 184, 0.35);
          }
        </style>
        <hr part="separator" />
      `;
    }
  }

  customElements.define('wc-item', WcItem);
  customElements.define('wc-item-content', WcItemContent);
  customElements.define('wc-item-media', WcItemMedia);
  customElements.define('wc-item-title', WcItemTitle);
  customElements.define('wc-item-description', WcItemDescription);
  customElements.define('wc-item-actions', WcItemActions);
  customElements.define('wc-item-header', WcItemHeader);
  customElements.define('wc-item-footer', WcItemFooter);
  customElements.define('wc-item-group', WcItemGroup);
  customElements.define('wc-item-separator', WcItemSeparator);
})();

/**
 * @file card.js
 * @version 1.0.0
 *
 * Lightweight card layout primitives that mirror the shadcn/ui card API while
 * staying framework agnostic. The module registers a suite of custom elements
 * for composing surfaces with headers, content, footers, and action areas. All
 * elements expose CSS custom properties and parts for fine-grained theming and
 * respond to the surrounding colour scheme without additional runtime
 * dependencies.
 */

(() => {
  if (customElements.get('wc-card')) {
    return;
  }

  /**
   * Upgrades a property that may have been set before the custom element was
   * defined so the setter runs during construction.
   *
   * @param {HTMLElement & Record<string, unknown>} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  /**
   * Clamp a heading level to the range 1 → 6.
   *
   * @param {number} value
   */
  const clampHeadingLevel = (value) => {
    if (Number.isNaN(value)) {
      return 2;
    }
    return Math.min(6, Math.max(1, Math.round(value)));
  };

  /**
   * Card surface with slots for header, content, and footer primitives.
   */
  class WcCard extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --card-background: rgba(255, 255, 255, 0.85);
            --card-foreground: #0f172a;
            --card-border-color: rgba(148, 163, 184, 0.35);
            --card-radius: 1rem;
            --card-padding: 1.5rem;
            --card-gap: 1.5rem;
            --card-shadow: 0 28px 54px -32px rgba(15, 23, 42, 0.35);
            display: block;
            color: var(--card-foreground);
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="surface"] {
            background: var(--card-background);
            border: 1px solid var(--card-border-color);
            border-radius: var(--card-radius);
            padding: var(--card-padding);
            display: grid;
            gap: var(--card-gap);
            box-shadow: var(--card-shadow);
            color: inherit;
          }

          ::slotted(*) {
            color: inherit;
          }
        </style>
        <article part="surface">
          <slot></slot>
        </article>
      `;
    }
  }

  /**
   * Header container that stacks titles, descriptions, and actions.
   */
  class WcCardHeader extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: grid;
            gap: 0.75rem;
          }

          header {
            display: grid;
            gap: 0.5rem;
            align-items: start;
          }

          ::slotted(wc-card-title) {
            margin: 0;
          }

          ::slotted(wc-card-description) {
            margin: 0;
          }

          ::slotted(wc-card-action) {
            justify-self: end;
          }
        </style>
        <header part="header">
          <slot></slot>
        </header>
      `;
    }
  }

  /**
   * Main content area used for arbitrary children such as forms or prose.
   */
  class WcCardContent extends HTMLElement {
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

          [part="content"] {
            display: grid;
            gap: 1rem;
          }
        </style>
        <div part="content">
          <slot></slot>
        </div>
      `;
    }
  }

  /**
   * Footer container for buttons, secondary actions, or status text.
   */
  class WcCardFooter extends HTMLElement {
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

          footer {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
          }
        </style>
        <footer part="footer">
          <slot></slot>
        </footer>
      `;
    }
  }

  /**
   * Heading primitive that renders semantic headings with configurable levels.
   */
  class WcCardTitle extends HTMLElement {
    static get observedAttributes() {
      return ['level'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #heading;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
          }

          [part="title"] {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            letter-spacing: -0.01em;
            line-height: 1.35;
          }
        </style>
        <div part="title" role="heading" aria-level="2">
          <slot></slot>
        </div>
      `;

      this.#heading = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="title"]')
      );
    }

    connectedCallback() {
      upgradeProperty(this, 'level');
      this.#syncLevel();
    }

    attributeChangedCallback(name) {
      if (name === 'level') {
        this.#syncLevel();
      }
    }

    /**
     * Gets the heading level (1-6) used for the accessible `aria-level`.
     */
    get level() {
      const value = this.getAttribute('level');
      return value === null ? 2 : clampHeadingLevel(Number(value));
    }

    set level(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('level');
      } else {
        this.setAttribute('level', String(value));
      }
    }

    #syncLevel() {
      const level = clampHeadingLevel(Number(this.getAttribute('level') ?? '2'));
      this.#heading.setAttribute('aria-level', String(level));
    }
  }

  /**
   * Supporting copy typically rendered below the title.
   */
  class WcCardDescription extends HTMLElement {
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

          p {
            margin: 0;
            color: rgba(71, 85, 105, 0.95);
            line-height: 1.6;
            font-size: 0.95rem;
          }
        </style>
        <p part="description">
          <slot></slot>
        </p>
      `;
    }
  }

  /**
   * Top-right action area for links or subtle buttons.
   */
  class WcCardAction extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            justify-content: flex-end;
          }

          [part="action"] {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          ::slotted(a),
          ::slotted(button) {
            font: inherit;
          }
        </style>
        <div part="action">
          <slot></slot>
        </div>
      `;
    }
  }

  if (!customElements.get('wc-card-header')) {
    customElements.define('wc-card-header', WcCardHeader);
  }

  if (!customElements.get('wc-card-content')) {
    customElements.define('wc-card-content', WcCardContent);
  }

  if (!customElements.get('wc-card-footer')) {
    customElements.define('wc-card-footer', WcCardFooter);
  }

  if (!customElements.get('wc-card-title')) {
    customElements.define('wc-card-title', WcCardTitle);
  }

  if (!customElements.get('wc-card-description')) {
    customElements.define('wc-card-description', WcCardDescription);
  }

  if (!customElements.get('wc-card-action')) {
    customElements.define('wc-card-action', WcCardAction);
  }

  customElements.define('wc-card', WcCard);
})();

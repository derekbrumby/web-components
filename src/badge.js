/**
 * @file badge.js
 * @version 1.0.0
 *
 * Inline badge component for statuses, counters, and links. Supports multiple variants
 * inspired by the shadcn/ui badge along with CSS custom properties for fine-grained
 * theming. Provide an `href` attribute to render the badge as an accessible anchor.
 *
 * Usage:
 * ```html
 * <wc-badge variant="secondary">New release</wc-badge>
 * <wc-badge href="/billing">Billing</wc-badge>
 * ```
 */

(() => {
  /**
   * Ensure properties that were set before the element defined upgrade to attribute-backed setters.
   * @param {HTMLElement} element
   * @param {keyof HTMLElement} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * @param {string | null} value
   */
  const isInteractiveHref = (value) => typeof value === 'string' && value.trim().length > 0;

  class WcBadge extends HTMLElement {
    static get observedAttributes() {
      return ['variant', 'href', 'target', 'rel'];
    }

    /** @type {HTMLElement} */
    #surface;
    /** @type {HTMLSlotElement} */
    #slot;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          --wc-badge-background: rgba(79, 70, 229, 0.16);
          --wc-badge-color: #312e81;
          --wc-badge-border-color: transparent;
          --wc-badge-hover-background: rgba(79, 70, 229, 0.22);
          --wc-badge-hover-border-color: var(--wc-badge-border-color);
          --wc-badge-focus-ring-color: rgba(99, 102, 241, 0.45);
          --wc-badge-radius: 999px;
          --wc-badge-padding-inline: 0.55rem;
          --wc-badge-padding-block: 0.2rem;
          --wc-badge-font-size: 0.75rem;
          --wc-badge-font-weight: 600;
          --wc-badge-letter-spacing: 0.02em;
          --wc-badge-gap: 0.35rem;
          --wc-badge-min-width: auto;
          --wc-badge-min-height: auto;
          display: inline-flex;
          vertical-align: middle;
        }

        :host([hidden]) {
          display: none !important;
        }

        :host([variant="secondary"]) {
          --wc-badge-background: rgba(15, 23, 42, 0.08);
          --wc-badge-color: #0f172a;
          --wc-badge-border-color: transparent;
          --wc-badge-hover-background: rgba(15, 23, 42, 0.12);
          --wc-badge-hover-border-color: var(--wc-badge-border-color);
          --wc-badge-focus-ring-color: rgba(30, 64, 175, 0.4);
        }

        :host([variant="destructive"]) {
          --wc-badge-background: rgba(239, 68, 68, 0.15);
          --wc-badge-color: #b91c1c;
          --wc-badge-border-color: transparent;
          --wc-badge-hover-background: rgba(239, 68, 68, 0.22);
          --wc-badge-hover-border-color: var(--wc-badge-border-color);
          --wc-badge-focus-ring-color: rgba(248, 113, 113, 0.55);
        }

        :host([variant="outline"]) {
          --wc-badge-background: transparent;
          --wc-badge-color: #0f172a;
          --wc-badge-border-color: rgba(148, 163, 184, 0.75);
          --wc-badge-hover-background: rgba(148, 163, 184, 0.12);
          --wc-badge-hover-border-color: rgba(100, 116, 139, 0.9);
          --wc-badge-focus-ring-color: rgba(99, 102, 241, 0.4);
        }

        [part="surface"] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--wc-badge-gap);
          padding-inline: var(--wc-badge-padding-inline);
          padding-block: var(--wc-badge-padding-block);
          border-radius: var(--wc-badge-radius);
          border: 1px solid var(--wc-badge-border-color);
          background: var(--wc-badge-background);
          color: var(--wc-badge-color);
          font-size: var(--wc-badge-font-size);
          font-weight: var(--wc-badge-font-weight);
          letter-spacing: var(--wc-badge-letter-spacing);
          line-height: 1;
          min-inline-size: var(--wc-badge-min-width);
          min-block-size: var(--wc-badge-min-height);
          white-space: nowrap;
          text-decoration: none;
          text-transform: var(--wc-badge-text-transform, none);
          transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 120ms ease;
          box-shadow: var(--wc-badge-shadow, none);
        }

        :host([data-interactive="true"]) [part="surface"] {
          cursor: pointer;
        }

        :host([data-interactive="true"]) [part="surface"]:hover {
          background: var(--wc-badge-hover-background);
          border-color: var(--wc-badge-hover-border-color);
        }

        :host([data-interactive="true"]) [part="surface"]:active {
          transform: translateY(1px);
        }

        :host([data-interactive="true"]) [part="surface"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--wc-badge-focus-ring-color);
        }

        ::slotted(svg),
        ::slotted(span[role="img"]) {
          inline-size: 1em;
          block-size: 1em;
          flex-shrink: 0;
        }
      `;

      this.#slot = document.createElement('slot');
      const surface = document.createElement('span');
      surface.setAttribute('part', 'surface');
      surface.dataset.element = 'surface';
      surface.append(this.#slot);
      this.#surface = surface;

      root.append(style, surface);
    }

    connectedCallback() {
      upgradeProperty(this, 'variant');
      upgradeProperty(this, 'href');
      upgradeProperty(this, 'target');
      upgradeProperty(this, 'rel');
      this.#synchroniseSurface();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'href') {
        this.#synchroniseSurface();
        return;
      }

      if (name === 'target' || name === 'rel') {
        this.#updateInteractiveAttributes();
        return;
      }

      if (name === 'variant') {
        // No-op: styling handled purely through CSS attribute selectors.
      }
    }

    /** @returns {string} */
    get variant() {
      return this.getAttribute('variant') ?? 'default';
    }

    /** @param {string | null | undefined} value */
    set variant(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('variant');
      } else {
        this.setAttribute('variant', value);
      }
    }

    /** @returns {string | null} */
    get href() {
      return this.getAttribute('href');
    }

    /** @param {string | null | undefined} value */
    set href(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('href');
      } else {
        this.setAttribute('href', value);
      }
    }

    /** @returns {string | null} */
    get target() {
      return this.getAttribute('target');
    }

    /** @param {string | null | undefined} value */
    set target(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('target');
      } else {
        this.setAttribute('target', value);
      }
    }

    /** @returns {string | null} */
    get rel() {
      return this.getAttribute('rel');
    }

    /** @param {string | null | undefined} value */
    set rel(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('rel');
      } else {
        this.setAttribute('rel', value);
      }
    }

    #synchroniseSurface() {
      const href = this.getAttribute('href');
      const interactive = isInteractiveHref(href);
      const shouldBeLink = interactive;
      const currentElement = this.#surface;

      if (shouldBeLink && !(currentElement instanceof HTMLAnchorElement)) {
        const anchor = document.createElement('a');
        anchor.setAttribute('part', 'surface');
        anchor.dataset.element = 'surface';
        anchor.append(this.#slot);
        currentElement.replaceWith(anchor);
        this.#surface = anchor;
      } else if (!shouldBeLink && !(currentElement instanceof HTMLSpanElement)) {
        const span = document.createElement('span');
        span.setAttribute('part', 'surface');
        span.dataset.element = 'surface';
        span.append(this.#slot);
        currentElement.replaceWith(span);
        this.#surface = span;
      }

      this.toggleAttribute('data-interactive', interactive);

      if (this.#surface instanceof HTMLAnchorElement) {
        if (interactive) {
          this.#surface.href = href ?? '#';
        } else {
          this.#surface.removeAttribute('href');
        }
      }

      this.#updateInteractiveAttributes();
    }

    #updateInteractiveAttributes() {
      if (!(this.#surface instanceof HTMLAnchorElement)) {
        return;
      }

      const target = this.getAttribute('target');
      const rel = this.getAttribute('rel');

      if (target === null || target === '') {
        this.#surface.removeAttribute('target');
      } else {
        this.#surface.target = target;
      }

      if (rel === null || rel === '') {
        if (this.#surface.target === '_blank') {
          this.#surface.rel = 'noopener noreferrer';
        } else {
          this.#surface.removeAttribute('rel');
        }
      } else {
        this.#surface.rel = rel;
      }
    }
  }

  if (!customElements.get('wc-badge')) {
    customElements.define('wc-badge', WcBadge);
  }
})();

/**
 * @file button.js
 * @version 1.0.0
 *
 * Accessible, themeable button web component with multiple variants and sizes.
 * Inspired by the shadcn/ui button and designed for CDN delivery. Supports
 * anchor rendering via the `href` attribute and exposes CSS custom properties
 * plus the `::part(control)` selector for styling.
 *
 * Usage:
 * ```html
 * <wc-button variant="outline">Button</wc-button>
 * <wc-button variant="outline" size="icon" aria-label="Submit">
 *   <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
 *     <path d="M12 5v14m7-7H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
 *   </svg>
 * </wc-button>
 * ```
 */

(() => {
  /**
   * Upgrade a property that may have been set before the custom element
   * definition was registered.
   *
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
   * Normalises the variant attribute to a supported value.
   *
   * @param {string | null} value
   * @returns {"default" | "outline" | "ghost" | "destructive" | "secondary" | "link"}
   */
  const normaliseVariant = (value) => {
    switch ((value ?? '').toLowerCase()) {
      case 'outline':
      case 'ghost':
      case 'destructive':
      case 'secondary':
      case 'link':
        return /** @type {any} */ (value.toLowerCase());
      default:
        return 'default';
    }
  };

  /**
   * Normalises the size attribute to a supported value.
   *
   * @param {string | null} value
   * @returns {"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"}
   */
  const normaliseSize = (value) => {
    switch ((value ?? '').toLowerCase()) {
      case 'sm':
      case 'lg':
      case 'icon':
      case 'icon-sm':
      case 'icon-lg':
        return /** @type {any} */ (value.toLowerCase());
      default:
        return 'default';
    }
  };

  class WcButton extends HTMLElement {
    static get observedAttributes() {
      return ['variant', 'size', 'disabled', 'href', 'target', 'rel', 'type'];
    }

    /** @type {HTMLButtonElement | HTMLAnchorElement} */
    #control;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {(event: MouseEvent) => void} */
    #handleClick;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      this.#slot = document.createElement('slot');
      this.#handleClick = (event) => {
        if (this.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      };

      const style = document.createElement('style');
      style.textContent = `
        :host {
          --wc-button-font-family: inherit;
          --wc-button-font-weight: 500;
          --wc-button-font-size: 0.95rem;
          --wc-button-letter-spacing: 0;
          --wc-button-radius: 0.6rem;
          --wc-button-gap: 0.5rem;
          --wc-button-border-width: 1px;
          --wc-button-padding-inline: 1rem;
          --wc-button-padding-block: 0.55rem;
          --wc-button-min-inline-size: auto;
          --wc-button-min-block-size: 2.5rem;
          --wc-button-background: rgb(79, 70, 229);
          --wc-button-background-hover: rgb(67, 56, 202);
          --wc-button-foreground: rgb(250, 250, 255);
          --wc-button-foreground-hover: rgb(250, 250, 255);
          --wc-button-border-color: transparent;
          --wc-button-border-color-hover: transparent;
          --wc-button-focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.35);
          --wc-button-disabled-opacity: 0.6;
          --wc-button-shadow: none;
          --wc-button-shadow-hover: none;
          display: inline-flex;
          vertical-align: middle;
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="control"] {
          all: unset;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--wc-button-gap);
          padding-inline: var(--wc-button-padding-inline);
          padding-block: var(--wc-button-padding-block);
          min-inline-size: var(--wc-button-min-inline-size);
          min-block-size: var(--wc-button-min-block-size);
          border-radius: var(--wc-button-radius);
          border-width: var(--wc-button-border-width);
          border-style: solid;
          border-color: var(--wc-button-border-color);
          background: var(--wc-button-background);
          color: var(--wc-button-foreground);
          font-family: var(--wc-button-font-family);
          font-weight: var(--wc-button-font-weight);
          font-size: var(--wc-button-font-size);
          letter-spacing: var(--wc-button-letter-spacing);
          line-height: 1.2;
          cursor: pointer;
          user-select: none;
          transition:
            background-color 140ms ease,
            color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            transform 120ms ease;
          text-decoration: none;
          text-align: center;
          box-shadow: var(--wc-button-shadow);
        }

        :host(:where(:hover, :focus-visible)) [part="control"] {
          background: var(--wc-button-background-hover);
          color: var(--wc-button-foreground-hover);
          border-color: var(--wc-button-border-color-hover);
          box-shadow: var(--wc-button-shadow-hover);
        }

        [part="control"]:focus-visible {
          outline: none;
          box-shadow: var(--wc-button-focus-ring);
        }

        :host(:active) [part="control"] {
          transform: translateY(1px);
        }

        :host([data-disabled="true"]) [part="control"] {
          opacity: var(--wc-button-disabled-opacity);
          cursor: not-allowed;
          pointer-events: none;
          box-shadow: none;
          transform: none;
        }

        :host([data-variant="secondary"]) {
          --wc-button-background: rgba(15, 23, 42, 0.08);
          --wc-button-background-hover: rgba(15, 23, 42, 0.12);
          --wc-button-foreground: rgb(15, 23, 42);
          --wc-button-foreground-hover: rgb(15, 23, 42);
          --wc-button-border-color: transparent;
          --wc-button-border-color-hover: transparent;
        }

        :host([data-variant="outline"]) {
          --wc-button-background: transparent;
          --wc-button-background-hover: rgba(99, 102, 241, 0.08);
          --wc-button-foreground: rgb(30, 41, 59);
          --wc-button-foreground-hover: rgb(49, 46, 129);
          --wc-button-border-color: rgba(148, 163, 184, 0.8);
          --wc-button-border-color-hover: rgba(99, 102, 241, 0.6);
        }

        :host([data-variant="ghost"]) {
          --wc-button-background: transparent;
          --wc-button-background-hover: rgba(99, 102, 241, 0.12);
          --wc-button-foreground: rgb(49, 46, 129);
          --wc-button-foreground-hover: rgb(49, 46, 129);
          --wc-button-border-color: transparent;
          --wc-button-border-color-hover: transparent;
        }

        :host([data-variant="destructive"]) {
          --wc-button-background: rgb(220, 38, 38);
          --wc-button-background-hover: rgb(185, 28, 28);
          --wc-button-foreground: rgb(255, 245, 245);
          --wc-button-foreground-hover: rgb(255, 245, 245);
          --wc-button-border-color: transparent;
          --wc-button-border-color-hover: transparent;
          --wc-button-focus-ring: 0 0 0 3px rgba(239, 68, 68, 0.35);
        }

        :host([data-variant="link"]) {
          --wc-button-background: transparent;
          --wc-button-background-hover: transparent;
          --wc-button-foreground: rgb(67, 56, 202);
          --wc-button-foreground-hover: rgb(55, 48, 163);
          --wc-button-border-color: transparent;
          --wc-button-border-color-hover: transparent;
          --wc-button-padding-inline: 0;
          --wc-button-padding-block: 0;
          --wc-button-gap: 0.35rem;
        }

        :host([data-variant="link"]) [part="control"] {
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        :host([data-variant="link"]) :is([part="control"]:hover, [part="control"]:focus-visible) {
          text-decoration-thickness: 2px;
        }

        :host([data-variant="ghost"]) :is([part="control"]:hover, [part="control"]:focus-visible) {
          text-decoration: none;
        }

        :host([data-size="sm"]) {
          --wc-button-font-size: 0.875rem;
          --wc-button-padding-inline: 0.875rem;
          --wc-button-padding-block: 0.4rem;
          --wc-button-min-block-size: 2.25rem;
        }

        :host([data-size="lg"]) {
          --wc-button-font-size: 1rem;
          --wc-button-padding-inline: 1.25rem;
          --wc-button-padding-block: 0.7rem;
          --wc-button-min-block-size: 2.75rem;
        }

        :host([data-size="icon-sm"]),
        :host([data-size="icon"]),
        :host([data-size="icon-lg"]) {
          --wc-button-padding-inline: 0;
          --wc-button-padding-block: 0;
          --wc-button-gap: 0;
          --wc-button-min-inline-size: var(--wc-button-min-block-size);
        }

        :host([data-size="icon-sm"]) {
          --wc-button-min-block-size: 2rem;
        }

        :host([data-size="icon"]) {
          --wc-button-min-block-size: 2.25rem;
        }

        :host([data-size="icon-lg"]) {
          --wc-button-min-block-size: 2.5rem;
        }

        :host([data-size="icon-sm"]) [part="control"],
        :host([data-size="icon"]) [part="control"],
        :host([data-size="icon-lg"]) [part="control"] {
          padding: 0;
        }

        ::slotted(svg),
        ::slotted(span[role="img"]) {
          inline-size: 1em;
          block-size: 1em;
          flex-shrink: 0;
        }

        :host([data-size="icon-sm"]) ::slotted(svg),
        :host([data-size="icon"]) ::slotted(svg),
        :host([data-size="icon-lg"]) ::slotted(svg) {
          inline-size: 1.25em;
          block-size: 1.25em;
        }
      `;

      const control = document.createElement('button');
      control.setAttribute('part', 'control');
      control.type = 'button';
      control.append(this.#slot);
      control.addEventListener('click', this.#handleClick);

      root.append(style, control);
      this.#control = control;
    }

    connectedCallback() {
      this.#control.addEventListener('click', this.#handleClick);
      upgradeProperty(this, 'variant');
      upgradeProperty(this, 'size');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'href');
      upgradeProperty(this, 'target');
      upgradeProperty(this, 'rel');
      upgradeProperty(this, 'type');

      this.#syncVariant();
      this.#syncSize();
      this.#syncHref();
      this.#syncDisabled();
    }

    disconnectedCallback() {
      this.#control.removeEventListener('click', this.#handleClick);
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} _newValue
     */
    attributeChangedCallback(name, _oldValue, _newValue) {
      if (!this.isConnected) {
        return;
      }

      switch (name) {
        case 'variant':
          this.#syncVariant();
          break;
        case 'size':
          this.#syncSize();
          break;
        case 'disabled':
          this.#syncDisabled();
          break;
        case 'href':
        case 'target':
        case 'rel':
          this.#syncHref();
          break;
        case 'type':
          this.#syncType();
          break;
        default:
          break;
      }
    }

    /**
     * Programmatic focus forwards to the inner control.
     *
     * @param {FocusOptions} [options]
     */
    focus(options) {
      this.#control.focus(options);
    }

    /** Remove focus from the inner control. */
    blur() {
      this.#control.blur();
    }

    /** @returns {"default" | "outline" | "ghost" | "destructive" | "secondary" | "link"} */
    get variant() {
      return normaliseVariant(this.getAttribute('variant'));
    }

    /** @param {string | null | undefined} value */
    set variant(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('variant');
      } else {
        this.setAttribute('variant', value);
      }
    }

    /** @returns {"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"} */
    get size() {
      return normaliseSize(this.getAttribute('size'));
    }

    /** @param {string | null | undefined} value */
    set size(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('size');
      } else {
        this.setAttribute('size', value);
      }
    }

    /** @returns {boolean} */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /** @param {boolean | string | null | undefined} value */
    set disabled(value) {
      const next = value !== null && value !== undefined && value !== false && value !== 'false';
      if (next) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /** @returns {string} */
    get href() {
      return this.getAttribute('href') ?? '';
    }

    /** @param {string | null | undefined} value */
    set href(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('href');
      } else {
        this.setAttribute('href', value);
      }
    }

    /** @returns {string} */
    get target() {
      return this.getAttribute('target') ?? '';
    }

    /** @param {string | null | undefined} value */
    set target(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('target');
      } else {
        this.setAttribute('target', value);
      }
    }

    /** @returns {string} */
    get rel() {
      return this.getAttribute('rel') ?? '';
    }

    /** @param {string | null | undefined} value */
    set rel(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('rel');
      } else {
        this.setAttribute('rel', value);
      }
    }

    /**
     * Type attribute forwarded when the component renders a `<button>`.
     * @returns {"button" | "submit" | "reset"}
     */
    get type() {
      const value = (this.getAttribute('type') ?? '').toLowerCase();
      return value === 'submit' || value === 'reset' ? value : 'button';
    }

    /** @param {string | null | undefined} value */
    set type(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('type');
      } else {
        this.setAttribute('type', value);
      }
    }

    #syncVariant() {
      const variant = normaliseVariant(this.getAttribute('variant'));
      this.setAttribute('data-variant', variant);
    }

    #syncSize() {
      const size = normaliseSize(this.getAttribute('size'));
      this.setAttribute('data-size', size);
    }

    #syncDisabled() {
      const disabled = this.hasAttribute('disabled');
      this.toggleAttribute('data-disabled', disabled);

      if (this.#control instanceof HTMLButtonElement) {
        this.#control.disabled = disabled;
      } else if (this.#control instanceof HTMLAnchorElement) {
        if (disabled) {
          this.#control.setAttribute('aria-disabled', 'true');
          this.#control.setAttribute('tabindex', '-1');
        } else {
          this.#control.removeAttribute('aria-disabled');
          this.#control.removeAttribute('tabindex');
        }
      }
    }

    #syncHref() {
      const href = this.getAttribute('href');
      this.#updateControlTag(href ? 'a' : 'button');

      if (this.#control instanceof HTMLAnchorElement) {
        if (href) {
          this.#control.setAttribute('href', href);
        } else {
          this.#control.removeAttribute('href');
        }

        const target = this.getAttribute('target');
        if (target !== null) {
          this.#control.setAttribute('target', target);
        } else {
          this.#control.removeAttribute('target');
        }

        const rel = this.getAttribute('rel');
        if (rel !== null) {
          this.#control.setAttribute('rel', rel);
        } else {
          this.#control.removeAttribute('rel');
        }
      } else if (this.#control instanceof HTMLButtonElement) {
        this.#syncType();
        this.#control.removeAttribute('href');
        this.#control.removeAttribute('target');
        this.#control.removeAttribute('rel');
      }

      this.#syncDisabled();
    }

    #syncType() {
      if (this.#control instanceof HTMLButtonElement) {
        const value = (this.getAttribute('type') ?? '').toLowerCase();
        if (value === 'submit' || value === 'reset') {
          this.#control.type = value;
        } else {
          this.#control.type = 'button';
        }
      }
    }

    /**
     * Swap the internal control when toggling between button and anchor modes.
     *
     * @param {'button' | 'a'} tagName
     */
    #updateControlTag(tagName) {
      const currentTag = this.#control.tagName.toLowerCase();
      if (currentTag === tagName) {
        return;
      }

      const next = document.createElement(tagName);
      next.setAttribute('part', 'control');
      next.addEventListener('click', this.#handleClick);
      next.append(this.#slot);

      this.#control.removeEventListener('click', this.#handleClick);
      this.#control.replaceWith(next);
      this.#control = /** @type {HTMLButtonElement | HTMLAnchorElement} */ (next);
    }
  }

  if (!customElements.get('wc-button')) {
    customElements.define('wc-button', WcButton);
  }
})();

/**
 * @file pagination.js
 * @version 1.0.0
 *
 * Accessible pagination primitives for navigating between pages. The collection provides
 * a root container (<wc-pagination>) alongside structure elements for lists, items, and
 * interactive links. Inspired by the shadcn/ui pagination patterns, each piece exposes
 * CSS custom properties and ::part selectors for styling while emitting activation events
 * when links are triggered.
 */

(() => {
  /**
   * Upgrade a property that may have been set before the element definition ran.
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
   * Define a custom element when it has not already been registered.
   * @param {string} name
   * @param {CustomElementConstructor} constructor
   */
  const defineElement = (name, constructor) => {
    if (!customElements.get(name)) {
      customElements.define(name, constructor);
    }
  };

  class WcPagination extends HTMLElement {
    static get observedAttributes() {
      return ['label'];
    }

    /** @type {HTMLElement} */
    #nav;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="root"] {
          display: flex;
          align-items: center;
          justify-content: var(--wc-pagination-justify, center);
          inline-size: 100%;
        }
      `;

      const nav = document.createElement('nav');
      nav.setAttribute('part', 'root');
      nav.setAttribute('aria-label', 'Pagination');

      const slot = document.createElement('slot');
      nav.append(slot);

      this.#nav = nav;
      root.append(style, nav);
    }

    connectedCallback() {
      upgradeProperty(this, 'label');
      this.#syncLabel();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} _newValue
     */
    attributeChangedCallback(name, _oldValue, _newValue) {
      if (name === 'label') {
        this.#syncLabel();
      }
    }

    /** @returns {string} */
    get label() {
      return this.getAttribute('label') ?? 'Pagination';
    }

    /** @param {string | null | undefined} value */
    set label(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('label');
      } else {
        this.setAttribute('label', value);
      }
    }

    #syncLabel() {
      const label = this.getAttribute('label');
      this.#nav.setAttribute('aria-label', label && label.trim().length > 0 ? label : 'Pagination');
    }
  }

  class WcPaginationContent extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="content"] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: var(--wc-pagination-wrap, nowrap);
          gap: var(--wc-pagination-gap, 0.35rem);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        ::slotted(wc-pagination-item) {
          display: block;
        }
      `;

      const list = document.createElement('ul');
      list.setAttribute('part', 'content');
      list.setAttribute('role', 'list');
      const slot = document.createElement('slot');
      list.append(slot);

      root.append(style, list);
    }
  }

  class WcPaginationItem extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="item"] {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        ::slotted(*) {
          display: block;
        }
      `;

      const item = document.createElement('li');
      item.setAttribute('part', 'item');
      item.setAttribute('role', 'listitem');

      const slot = document.createElement('slot');
      item.append(slot);

      root.append(style, item);
    }
  }

  class WcPaginationLink extends HTMLElement {
    static get observedAttributes() {
      return ['href', 'target', 'rel', 'download', 'aria-label', 'aria-current', 'current', 'disabled'];
    }

    static get fallbackLabel() {
      return '';
    }

    /** @type {HTMLAnchorElement} */
    #anchor;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {(event: MouseEvent) => void} */
    #handleClick;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          color: inherit;
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="link"] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--wc-pagination-link-gap, 0.35rem);
          min-inline-size: var(--wc-pagination-min-width, 2.5rem);
          block-size: var(--wc-pagination-height, 2.25rem);
          padding-inline: var(--wc-pagination-padding-inline, 0.75rem);
          padding-block: var(--wc-pagination-padding-block, 0.25rem);
          border-radius: var(--wc-pagination-radius, 0.5rem);
          border: 1px solid var(--wc-pagination-border-color, rgba(148, 163, 184, 0.35));
          background: var(--wc-pagination-background, transparent);
          color: var(--wc-pagination-color, inherit);
          font: inherit;
          font-size: var(--wc-pagination-font-size, 0.95rem);
          font-weight: var(--wc-pagination-font-weight, 500);
          letter-spacing: var(--wc-pagination-letter-spacing, 0);
          line-height: 1;
          text-decoration: none;
          user-select: none;
          transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        [part="link"]:hover {
          background: var(--wc-pagination-hover-background, rgba(99, 102, 241, 0.12));
          color: var(--wc-pagination-hover-color, currentColor);
          border-color: var(--wc-pagination-hover-border-color, rgba(148, 163, 184, 0.45));
        }

        [part="link"]:focus-visible {
          outline: none;
          box-shadow: var(--wc-pagination-focus-ring, 0 0 0 2px rgba(67, 56, 202, 0.35));
        }

        :host([data-state="current"]) [part="link"] {
          background: var(--wc-pagination-active-background, rgba(79, 70, 229, 0.18));
          color: var(--wc-pagination-active-color, #3730a3);
          border-color: var(--wc-pagination-active-border-color, rgba(79, 70, 229, 0.45));
          cursor: default;
        }

        :host([data-disabled]) [part="link"] {
          background: var(--wc-pagination-disabled-background, rgba(148, 163, 184, 0.12));
          border-color: var(--wc-pagination-disabled-border-color, rgba(148, 163, 184, 0.2));
          color: var(--wc-pagination-disabled-color, rgba(100, 116, 139, 0.9));
          cursor: not-allowed;
          opacity: var(--wc-pagination-disabled-opacity, 0.6);
        }

        :host([data-disabled]) [part="link"]:hover {
          background: var(--wc-pagination-disabled-background, rgba(148, 163, 184, 0.12));
          color: var(--wc-pagination-disabled-color, rgba(100, 116, 139, 0.9));
          border-color: var(--wc-pagination-disabled-border-color, rgba(148, 163, 184, 0.2));
        }

        ::slotted(svg),
        ::slotted(span[role="img"]) {
          inline-size: 1em;
          block-size: 1em;
          flex-shrink: 0;
        }
      `;

      const anchor = document.createElement('a');
      anchor.setAttribute('part', 'link');
      anchor.setAttribute('role', 'link');

      const slot = document.createElement('slot');
      slot.setAttribute('part', 'label');
      anchor.append(slot);

      this.#anchor = anchor;
      this.#slot = slot;
      this.setFallbackLabel(/** @type {typeof WcPaginationLink} */ (this.constructor).fallbackLabel);

      this.#handleClick = (event) => {
        if (this.disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        this.#emitActivate('pointer', event);
      };

      anchor.addEventListener('click', this.#handleClick);
      anchor.addEventListener('keydown', (event) => {
        if (this.disabled) {
          return;
        }

        if (this.#anchor.hasAttribute('href')) {
          return;
        }

        if (event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          this.#emitActivate('keyboard', event);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          this.#emitActivate('keyboard', event);
        }
      });

      root.append(style, anchor);
    }

    connectedCallback() {
      upgradeProperty(this, 'href');
      upgradeProperty(this, 'target');
      upgradeProperty(this, 'rel');
      upgradeProperty(this, 'download');
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'current');
      upgradeProperty(this, 'disabled');
      this.#syncHref();
      this.#syncTarget();
      this.#syncRel();
      this.#syncDownload();
      this.#syncAriaLabel();
      this.#syncState();
      this.#syncAriaCurrent();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} _newValue
     */
    attributeChangedCallback(name, _oldValue, _newValue) {
      switch (name) {
        case 'href':
          this.#syncHref();
          break;
        case 'target':
          this.#syncTarget();
          break;
        case 'rel':
          this.#syncRel();
          break;
        case 'download':
          this.#syncDownload();
          break;
        case 'aria-label':
          this.#syncAriaLabel();
          break;
        case 'aria-current':
          this.#syncAriaCurrent();
          break;
        case 'current':
        case 'disabled':
          this.#syncState();
          break;
        default:
          break;
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

    /** @returns {string} */
    get download() {
      return this.getAttribute('download') ?? '';
    }

    /** @param {string | null | undefined} value */
    set download(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('download');
      } else {
        this.setAttribute('download', value);
      }
    }

    /** @returns {string} */
    get value() {
      return this.getAttribute('value') ?? '';
    }

    /** @param {string | null | undefined} value */
    set value(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('value');
      } else {
        this.setAttribute('value', value);
      }
    }

    /** @returns {boolean} */
    get current() {
      return this.hasAttribute('current');
    }

    /** @param {boolean | string | null | undefined} value */
    set current(value) {
      if (value === false || value === null || value === undefined) {
        this.removeAttribute('current');
      } else {
        this.setAttribute('current', '');
      }
    }

    /** @returns {boolean} */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /** @param {boolean | string | null | undefined} value */
    set disabled(value) {
      if (value === false || value === null || value === undefined) {
        this.removeAttribute('disabled');
      } else {
        this.setAttribute('disabled', '');
      }
    }

    /**
     * Update the default slot fallback text used when no children are provided.
     * @param {string} label
     */
    setFallbackLabel(label) {
      this.#slot.textContent = label ?? '';
    }

    #syncHref() {
      const href = this.getAttribute('href');
      if (href && href.trim().length > 0) {
        this.#anchor.setAttribute('href', href);
        this.#anchor.setAttribute('role', 'link');
      } else {
        this.#anchor.removeAttribute('href');
        this.#anchor.setAttribute('role', 'button');
      }
      this.#syncTabIndex();
    }

    #syncTarget() {
      const target = this.getAttribute('target');
      if (target && target.trim().length > 0) {
        this.#anchor.setAttribute('target', target);
      } else {
        this.#anchor.removeAttribute('target');
      }
    }

    #syncRel() {
      const rel = this.getAttribute('rel');
      if (rel && rel.trim().length > 0) {
        this.#anchor.setAttribute('rel', rel);
      } else {
        this.#anchor.removeAttribute('rel');
      }
    }

    #syncDownload() {
      const download = this.getAttribute('download');
      if (download && download.trim().length > 0) {
        this.#anchor.setAttribute('download', download);
      } else {
        this.#anchor.removeAttribute('download');
      }
    }

    #syncAriaLabel() {
      const ariaLabel = this.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim().length > 0) {
        this.#anchor.setAttribute('aria-label', ariaLabel);
      } else {
        this.#anchor.removeAttribute('aria-label');
      }
    }

    #syncState() {
      if (this.current) {
        this.setAttribute('data-state', 'current');
      } else {
        this.removeAttribute('data-state');
      }

      if (this.disabled) {
        this.setAttribute('data-disabled', '');
        this.#anchor.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('data-disabled');
        this.#anchor.removeAttribute('aria-disabled');
      }

      this.#syncAriaCurrent();
      this.#syncTabIndex();
    }

    #syncAriaCurrent() {
      const explicit = this.getAttribute('aria-current');
      if (explicit && explicit.trim().length > 0) {
        this.#anchor.setAttribute('aria-current', explicit);
      } else if (this.current) {
        this.#anchor.setAttribute('aria-current', 'page');
      } else {
        this.#anchor.removeAttribute('aria-current');
      }
    }

    #syncTabIndex() {
      const hasHref = this.#anchor.hasAttribute('href');
      if (this.disabled) {
        this.#anchor.setAttribute('tabindex', '-1');
        return;
      }

      if (hasHref) {
        this.#anchor.removeAttribute('tabindex');
      } else {
        this.#anchor.setAttribute('tabindex', '0');
      }
    }

    /**
     * Emit an activation event when the link is triggered.
     * @param {"pointer"|"keyboard"} source
     * @param {MouseEvent | KeyboardEvent} originalEvent
     */
    #emitActivate(source, originalEvent) {
      this.dispatchEvent(
        new CustomEvent('wc-pagination-activate', {
          bubbles: true,
          composed: true,
          detail: {
            source,
            value: this.value || null,
            href: this.#anchor.getAttribute('href'),
            current: this.current,
            disabled: this.disabled,
            originalEvent,
          },
        })
      );
    }
  }

  class WcPaginationPrevious extends WcPaginationLink {
    static get observedAttributes() {
      return [...super.observedAttributes, 'label'];
    }

    static get fallbackLabel() {
      return 'Previous';
    }

    constructor() {
      super();
      this.dataset.direction = 'previous';
      this.setFallbackLabel(WcPaginationPrevious.fallbackLabel);
    }

    connectedCallback() {
      super.connectedCallback();
      if (!this.hasAttribute('rel')) {
        this.rel = 'prev';
      }

      if (!this.hasAttribute('aria-label')) {
        this.setAttribute('aria-label', 'Go to previous page');
      }
      this.#syncLabel();
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'label') {
        this.#syncLabel();
        return;
      }

      super.attributeChangedCallback(name, oldValue, newValue);
    }

    /** @returns {string} */
    get label() {
      return this.getAttribute('label') ?? '';
    }

    /** @param {string | null | undefined} value */
    set label(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('label');
      } else {
        this.setAttribute('label', value);
      }
    }

    #syncLabel() {
      const label = this.getAttribute('label');
      this.setFallbackLabel(label && label.trim().length > 0 ? label : WcPaginationPrevious.fallbackLabel);
    }
  }

  class WcPaginationNext extends WcPaginationLink {
    static get observedAttributes() {
      return [...super.observedAttributes, 'label'];
    }

    static get fallbackLabel() {
      return 'Next';
    }

    constructor() {
      super();
      this.dataset.direction = 'next';
      this.setFallbackLabel(WcPaginationNext.fallbackLabel);
    }

    connectedCallback() {
      super.connectedCallback();
      if (!this.hasAttribute('rel')) {
        this.rel = 'next';
      }

      if (!this.hasAttribute('aria-label')) {
        this.setAttribute('aria-label', 'Go to next page');
      }
      this.#syncLabel();
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'label') {
        this.#syncLabel();
        return;
      }

      super.attributeChangedCallback(name, oldValue, newValue);
    }

    /** @returns {string} */
    get label() {
      return this.getAttribute('label') ?? '';
    }

    /** @param {string | null | undefined} value */
    set label(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('label');
      } else {
        this.setAttribute('label', value);
      }
    }

    #syncLabel() {
      const label = this.getAttribute('label');
      this.setFallbackLabel(label && label.trim().length > 0 ? label : WcPaginationNext.fallbackLabel);
    }
  }

  class WcPaginationEllipsis extends HTMLElement {
    static get observedAttributes() {
      return ['label'];
    }

    /** @type {HTMLSpanElement} */
    #srLabel;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="ellipsis"] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-inline-size: var(--wc-pagination-min-width, 2.5rem);
          block-size: var(--wc-pagination-height, 2.25rem);
          padding-inline: var(--wc-pagination-padding-inline, 0.75rem);
          padding-block: var(--wc-pagination-padding-block, 0.25rem);
          border-radius: var(--wc-pagination-radius, 0.5rem);
          border: 1px solid var(--wc-pagination-border-color, rgba(148, 163, 184, 0.35));
          background: var(--wc-pagination-ellipsis-background, rgba(148, 163, 184, 0.12));
          color: var(--wc-pagination-ellipsis-color, rgba(15, 23, 42, 0.7));
          font: inherit;
          font-size: var(--wc-pagination-font-size, 0.95rem);
          font-weight: var(--wc-pagination-font-weight, 500);
          letter-spacing: 0.08em;
          user-select: none;
        }

        [part="sr-label"] {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          clip-path: inset(50%);
          border: 0;
          white-space: nowrap;
        }
      `;

      const visual = document.createElement('span');
      visual.setAttribute('part', 'ellipsis');
      visual.setAttribute('aria-hidden', 'true');
      visual.textContent = '…';

      const srLabel = document.createElement('span');
      srLabel.setAttribute('part', 'sr-label');
      srLabel.textContent = 'More pages';

      this.#srLabel = srLabel;

      root.append(style, visual, srLabel);
    }

    connectedCallback() {
      upgradeProperty(this, 'label');
      this.#syncLabel();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} _newValue
     */
    attributeChangedCallback(name, _oldValue, _newValue) {
      if (name === 'label') {
        this.#syncLabel();
      }
    }

    /** @returns {string} */
    get label() {
      return this.getAttribute('label') ?? '';
    }

    /** @param {string | null | undefined} value */
    set label(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('label');
      } else {
        this.setAttribute('label', value);
      }
    }

    #syncLabel() {
      const label = this.getAttribute('label');
      this.#srLabel.textContent = label && label.trim().length > 0 ? label : 'More pages';
    }
  }

  defineElement('wc-pagination', WcPagination);
  defineElement('wc-pagination-content', WcPaginationContent);
  defineElement('wc-pagination-item', WcPaginationItem);
  defineElement('wc-pagination-link', WcPaginationLink);
  defineElement('wc-pagination-previous', WcPaginationPrevious);
  defineElement('wc-pagination-next', WcPaginationNext);
  defineElement('wc-pagination-ellipsis', WcPaginationEllipsis);
})();


/**
 * @file breadcrumb.js
 * @version 1.0.0
 *
 * Accessible breadcrumb navigation primitives inspired by the shadcn/ui
 * breadcrumb component. Ships a `<wc-breadcrumb>` root along with item,
 * link, separator, page, and ellipsis elements so authors can compose their
 * own hierarchy. Styling is controlled through CSS custom properties and
 * `::part` selectors. The elements register themselves on load and require
 * no external runtime dependencies.
 */

(() => {
  /**
   * Ensure properties assigned before upgrade run through the element's setter.
   * @template {HTMLElement} T
   * @param {T & Record<string, unknown>} element
   * @param {keyof T & string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  /**
   * Normalises potentially nullish values to strings.
   * @param {unknown} value
   * @returns {string}
   */
  const toString = (value) => (value == null ? '' : String(value));

  if (!customElements.get('wc-breadcrumb')) {
    class WcBreadcrumb extends HTMLElement {
      static get observedAttributes() {
        return ['label', 'aria-label', 'aria-labelledby'];
      }

      /** @type {HTMLElement} */
      #nav;

      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host {
              --wc-breadcrumb-gap: 0.4rem;
              --wc-breadcrumb-font-size: 0.875rem;
              --wc-breadcrumb-color: #475569;
              --wc-breadcrumb-page-color: #0f172a;
              --wc-breadcrumb-weight: 500;
              --wc-breadcrumb-padding: 0;
              display: block;
              color: var(--wc-breadcrumb-color);
              font-size: var(--wc-breadcrumb-font-size);
              font-weight: var(--wc-breadcrumb-weight);
            }

            :host([hidden]) {
              display: none !important;
            }

            [part="nav"] {
              display: block;
              width: 100%;
            }

            [part="list"] {
              margin: 0;
              padding: var(--wc-breadcrumb-padding);
              list-style: none;
              display: flex;
              align-items: center;
              gap: var(--wc-breadcrumb-gap);
              flex-wrap: wrap;
              color: inherit;
            }

            ::slotted(wc-breadcrumb-item) {
              color: inherit;
            }
          </style>
          <nav part="nav">
            <ol part="list">
              <slot></slot>
            </ol>
          </nav>
        `;
        this.#nav = /** @type {HTMLElement} */ (root.querySelector('[part="nav"]'));
      }

      connectedCallback() {
        upgradeProperty(this, 'label');
        this.#syncAccessibleName();
      }

      attributeChangedCallback() {
        this.#syncAccessibleName();
      }

      /**
       * Accessible label exposed as both a property and attribute.
       */
      get label() {
        return this.getAttribute('label') ?? '';
      }

      set label(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('label', next);
        } else {
          this.removeAttribute('label');
        }
      }

      #syncAccessibleName() {
        if (!this.#nav) return;
        const labelledby = this.getAttribute('aria-labelledby');
        if (labelledby) {
          this.#nav.setAttribute('aria-labelledby', labelledby);
        } else {
          this.#nav.removeAttribute('aria-labelledby');
        }

        const label = this.getAttribute('aria-label') ?? this.getAttribute('label') ?? 'Breadcrumb';
        if (labelledby) {
          this.#nav.removeAttribute('aria-label');
        } else {
          this.#nav.setAttribute('aria-label', label);
        }
      }
    }

    customElements.define('wc-breadcrumb', WcBreadcrumb);
  }

  if (!customElements.get('wc-breadcrumb-item')) {
    class WcBreadcrumbItem extends HTMLElement {
      /** @type {HTMLLIElement} */
      #item;

      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
          :host {
            display: contents;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="item"] {
            display: inline-flex;
            align-items: center;
            gap: var(--wc-breadcrumb-gap, 0.4rem);
            color: inherit;
            min-height: 1.75rem;
          }

          ::slotted(*) {
            color: inherit;
          }
        `;
        const item = document.createElement('li');
        item.setAttribute('part', 'item');
        const slot = document.createElement('slot');
        item.append(slot);

        root.append(style, item);
        this.#item = item;
      }

      connectedCallback() {
        this.#item.setAttribute('role', 'listitem');
      }
    }

    customElements.define('wc-breadcrumb-item', WcBreadcrumbItem);
  }

  if (!customElements.get('wc-breadcrumb-separator')) {
    class WcBreadcrumbSeparator extends HTMLElement {
      /** @type {HTMLLIElement} */
      #item;

      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host {
              display: contents;
            }

            :host([hidden]) {
              display: none !important;
            }

            [part="separator"] {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: var(--wc-breadcrumb-separator-color, #94a3b8);
              font: inherit;
              line-height: 1;
              min-width: 0.75rem;
              user-select: none;
            }

            ::slotted(svg),
            ::slotted(span[role="img"]) {
              width: 1em;
              height: 1em;
            }
          </style>
          <li part="separator" aria-hidden="true">
            <slot>/</slot>
          </li>
        `;
        this.#item = /** @type {HTMLLIElement} */ (root.querySelector('li'));
      }

      connectedCallback() {
        this.#item.setAttribute('role', 'presentation');
      }
    }

    customElements.define('wc-breadcrumb-separator', WcBreadcrumbSeparator);
  }

  if (!customElements.get('wc-breadcrumb-link')) {
    class WcBreadcrumbLink extends HTMLElement {
      static get observedAttributes() {
        return ['href', 'target', 'rel', 'download', 'aria-current'];
      }

      /** @type {HTMLAnchorElement} */
      #anchor;

      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host {
              display: inline-flex;
              color: inherit;
            }

            :host([hidden]) {
              display: none !important;
            }

            [part="link"] {
              display: inline-flex;
              align-items: center;
              gap: var(--wc-breadcrumb-link-gap, 0.35rem);
              padding: var(--wc-breadcrumb-link-padding, 0.1rem 0.3rem);
              border-radius: var(--wc-breadcrumb-link-radius, 0.5rem);
              font: inherit;
              color: var(--wc-breadcrumb-link-color, #2563eb);
              text-decoration: none;
              line-height: 1.1;
              background: var(--wc-breadcrumb-link-background, transparent);
              transition: color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
            }

            [part="link"]:hover {
              color: var(--wc-breadcrumb-link-hover-color, #1d4ed8);
              background: var(--wc-breadcrumb-link-hover-background, rgba(37, 99, 235, 0.08));
            }

            [part="link"]:focus-visible {
              outline: none;
              box-shadow: var(--wc-breadcrumb-link-focus-ring, 0 0 0 2px rgba(37, 99, 235, 0.35));
            }

            [part="link"][aria-current="page"],
            [part="link"][data-current="true"] {
              color: var(--wc-breadcrumb-current-color, var(--wc-breadcrumb-page-color, #0f172a));
              font-weight: var(--wc-breadcrumb-current-weight, 600);
              background: var(--wc-breadcrumb-current-background, rgba(15, 23, 42, 0.08));
            }

            ::slotted(*) {
              color: inherit;
            }
          </style>
          <a part="link">
            <slot></slot>
          </a>
        `;
        this.#anchor = /** @type {HTMLAnchorElement} */ (root.querySelector('a'));
      }

      connectedCallback() {
        upgradeProperty(this, 'href');
        upgradeProperty(this, 'target');
        upgradeProperty(this, 'rel');
        upgradeProperty(this, 'download');
        upgradeProperty(this, 'ariaCurrent');
        this.#syncAttributes();
      }

      attributeChangedCallback() {
        this.#syncAttributes();
      }

      /** @returns {string} */
      get href() {
        return this.getAttribute('href') ?? '';
      }

      set href(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('href', next);
        } else {
          this.removeAttribute('href');
        }
      }

      /** @returns {string} */
      get target() {
        return this.getAttribute('target') ?? '';
      }

      set target(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('target', next);
        } else {
          this.removeAttribute('target');
        }
      }

      /** @returns {string} */
      get rel() {
        return this.getAttribute('rel') ?? '';
      }

      set rel(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('rel', next);
        } else {
          this.removeAttribute('rel');
        }
      }

      /** @returns {string} */
      get download() {
        return this.getAttribute('download') ?? '';
      }

      set download(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('download', next);
        } else {
          this.removeAttribute('download');
        }
      }

      /** @returns {string} */
      get ariaCurrent() {
        return this.getAttribute('aria-current') ?? '';
      }

      set ariaCurrent(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('aria-current', next);
        } else {
          this.removeAttribute('aria-current');
        }
      }

      #syncAttributes() {
        if (!this.#anchor) return;

        const href = this.getAttribute('href');
        if (href) {
          this.#anchor.setAttribute('href', href);
        } else {
          this.#anchor.removeAttribute('href');
        }

        const target = this.getAttribute('target');
        if (target) {
          this.#anchor.setAttribute('target', target);
        } else {
          this.#anchor.removeAttribute('target');
        }

        const rel = this.getAttribute('rel');
        if (rel) {
          this.#anchor.setAttribute('rel', rel);
        } else {
          this.#anchor.removeAttribute('rel');
        }

        const download = this.getAttribute('download');
        if (download) {
          this.#anchor.setAttribute('download', download);
        } else {
          this.#anchor.removeAttribute('download');
        }

        const ariaCurrent = this.getAttribute('aria-current');
        if (ariaCurrent) {
          this.#anchor.setAttribute('aria-current', ariaCurrent);
          if (ariaCurrent === 'page') {
            this.#anchor.dataset.current = 'true';
          } else {
            this.#anchor.dataset.current = '';
          }
        } else {
          this.#anchor.removeAttribute('aria-current');
          delete this.#anchor.dataset.current;
        }
      }
    }

    customElements.define('wc-breadcrumb-link', WcBreadcrumbLink);
  }

  if (!customElements.get('wc-breadcrumb-page')) {
    class WcBreadcrumbPage extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host {
              display: inline-flex;
              align-items: center;
              color: var(--wc-breadcrumb-page-color, #0f172a);
              font-weight: var(--wc-breadcrumb-page-weight, 600);
            }

            :host([hidden]) {
              display: none !important;
            }

            [part="page"] {
              display: inline-flex;
              align-items: center;
              gap: var(--wc-breadcrumb-page-gap, 0.35rem);
              line-height: 1.1;
            }

            ::slotted(*) {
              color: inherit;
            }
          </style>
          <span part="page" aria-current="page">
            <slot></slot>
          </span>
        `;
      }
    }

    customElements.define('wc-breadcrumb-page', WcBreadcrumbPage);
  }

  if (!customElements.get('wc-breadcrumb-ellipsis')) {
    class WcBreadcrumbEllipsis extends HTMLElement {
      static get observedAttributes() {
        return ['label'];
      }

      /** @type {HTMLElement} */
      #icon;

      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: var(--wc-breadcrumb-ellipsis-color, #64748b);
            }

            :host([hidden]) {
              display: none !important;
            }

            [part="icon"] {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: var(--wc-breadcrumb-ellipsis-size, 1.25rem);
              height: var(--wc-breadcrumb-ellipsis-size, 1.25rem);
              border-radius: var(--wc-breadcrumb-ellipsis-radius, 0.5rem);
              background: var(--wc-breadcrumb-ellipsis-background, transparent);
            }

            svg {
              display: block;
              width: 100%;
              height: 100%;
              fill: currentColor;
            }

            ::slotted(*) {
              color: inherit;
            }
          </style>
          <span part="icon" aria-hidden="true">
            <slot>
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
                <circle cx="5" cy="12" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="19" cy="12" r="2"></circle>
              </svg>
            </slot>
          </span>
        `;
        this.#icon = /** @type {HTMLElement} */ (root.querySelector('[part="icon"]'));
      }

      connectedCallback() {
        this.#syncLabel();
      }

      attributeChangedCallback() {
        this.#syncLabel();
      }

      /**
       * Optional accessible label describing the collapsed state.
       */
      get label() {
        return this.getAttribute('label') ?? '';
      }

      set label(value) {
        const next = toString(value);
        if (next) {
          this.setAttribute('label', next);
        } else {
          this.removeAttribute('label');
        }
      }

      #syncLabel() {
        if (!this.#icon) return;
        const label = this.getAttribute('label');
        if (label) {
          this.#icon.setAttribute('aria-label', label);
        } else {
          this.#icon.removeAttribute('aria-label');
        }
      }
    }

    customElements.define('wc-breadcrumb-ellipsis', WcBreadcrumbEllipsis);
  }
})();

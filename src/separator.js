/**
 * @file separator.js
 * @version 1.0.0
 *
 * Accessible separator web component inspired by Radix UI's separator primitive. Supports
 * horizontal and vertical orientations, decorative presentation, and exposes styling hooks via CSS
 * custom properties and parts.
 *
 * Usage:
 * <wc-separator orientation="vertical"></wc-separator>
 */

(() => {
  /**
   * Ensures that properties set before definition upgrade to use the element's own accessors.
   *
   * @param {HTMLElement} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * Orientation tokens supported by the separator component.
   *
   * @type {ReadonlyArray<"horizontal" | "vertical">}
   */
  const ORIENTATIONS = ['horizontal', 'vertical'];

  /**
   * @typedef {"horizontal" | "vertical"} Orientation
   */

  /**
   * Structural separator element mirroring `<hr>` semantics while embracing flexible orientation
   * and decorative presentation. The component applies `role="separator"` by default and toggles it
   * off when marked as decorative to remain screen-reader friendly.
   *
   * @extends {HTMLElement}
   */
  class WcSeparator extends HTMLElement {
    static get observedAttributes() {
      return ['orientation', 'decorative'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #separator;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --separator-thickness: 1px;
            --separator-color: rgba(99, 102, 241, 0.4);
            --separator-length: 100%;
            --separator-radius: 999px;
            --separator-margin: 0;
            display: block;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="separator"] {
            display: block;
            background-color: var(--separator-color);
            border-radius: var(--separator-radius);
            margin: var(--separator-margin);
            inline-size: var(--separator-length);
            block-size: var(--separator-thickness);
          }

          :host([data-orientation="vertical"]) {
            display: inline-flex;
          }

          :host([data-orientation="vertical"]) [part="separator"] {
            inline-size: var(--separator-thickness);
            block-size: var(--separator-length);
            min-block-size: 100%;
          }
        </style>
        <div part="separator" aria-hidden="true"></div>
      `;

      this.#separator = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="separator"]')
      );
    }

    connectedCallback() {
      upgradeProperty(this, 'orientation');
      upgradeProperty(this, 'decorative');
      this.#syncOrientation();
      this.#syncAccessibility();
    }

    attributeChangedCallback(name) {
      if (name === 'orientation') {
        this.#syncOrientation();
        this.#syncAccessibility();
      } else if (name === 'decorative') {
        this.#syncAccessibility();
      }
    }

    /**
     * Orientation accessor controlling layout direction.
     *
     * @returns {Orientation}
     */
    get orientation() {
      const value = this.getAttribute('orientation');
      return ORIENTATIONS.includes(/** @type {Orientation} */ (value)) ? value : 'horizontal';
    }

    /**
     * @param {Orientation} value
     */
    set orientation(value) {
      if (!ORIENTATIONS.includes(value)) {
        value = 'horizontal';
      }

      if (value === 'horizontal') {
        this.removeAttribute('orientation');
      } else {
        this.setAttribute('orientation', value);
      }
    }

    /**
     * Whether the separator is purely decorative.
     */
    get decorative() {
      return this.hasAttribute('decorative');
    }

    /**
     * @param {boolean} value
     */
    set decorative(value) {
      if (value) {
        this.setAttribute('decorative', '');
      } else {
        this.removeAttribute('decorative');
      }
    }

    /**
     * Updates orientation-specific attributes and data markers.
     */
    #syncOrientation() {
      const orientation = this.orientation;
      this.setAttribute('data-orientation', orientation);
      if (!this.decorative) {
        if (orientation === 'vertical') {
          this.setAttribute('aria-orientation', 'vertical');
        } else {
          this.removeAttribute('aria-orientation');
        }
      }
    }

    /**
     * Manages accessibility semantics and `role` attributes based on the decorative flag.
     */
    #syncAccessibility() {
      const decorative = this.decorative;
      if (decorative) {
        this.setAttribute('role', 'presentation');
        this.setAttribute('aria-hidden', 'true');
        this.removeAttribute('aria-orientation');
      } else {
        this.setAttribute('role', 'separator');
        this.removeAttribute('aria-hidden');
        if (this.orientation === 'vertical') {
          this.setAttribute('aria-orientation', 'vertical');
        } else {
          this.removeAttribute('aria-orientation');
        }
      }

      this.#separator.setAttribute('aria-hidden', 'true');
    }
  }

  if (!customElements.get('wc-separator')) {
    customElements.define('wc-separator', WcSeparator);
  }
})();

/**
 * @file spinner.js
 * @version 1.0.0
 *
 * Accessible loading indicator web component that exposes customization hooks
 * for size, color, and animation speed via CSS custom properties. The element
 * mirrors the Radix UI Spinner experience while remaining dependency free.
 *
 * Usage:
 * <wc-spinner label="Fetching data"></wc-spinner>
 */

(() => {
  if (customElements.get('wc-spinner')) {
    return;
  }

  /**
   * Upgrades properties that might have been set before the element definition was registered.
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

  const DEFAULT_LABEL = 'Loading';

  /**
   * Lightweight animated spinner for representing busy states.
   */
  class WcSpinner extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'aria-label'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSpanElement} */
    #labelEl;
    /** @type {boolean} */
    #managesAriaLabel = false;
    /** @type {boolean} */
    #isSyncingAriaLabel = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-spinner-size: 1.5rem;
            --wc-spinner-stroke-width: 2.75;
            --wc-spinner-track-color: rgba(148, 163, 184, 0.35);
            --wc-spinner-color: currentColor;
            --wc-spinner-gap: 0.5rem;
            --wc-spinner-duration: 960ms;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--wc-spinner-gap);
            color: inherit;
            position: relative;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="icon"] {
            inline-size: var(--wc-spinner-size);
            block-size: var(--wc-spinner-size);
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          svg {
            inline-size: 100%;
            block-size: 100%;
            display: block;
            transform-origin: center;
            animation: wc-spinner-rotate var(--wc-spinner-duration) linear infinite;
          }

          circle[data-part="track"] {
            stroke: var(--wc-spinner-track-color);
          }

          circle[data-part="indicator"] {
            stroke: var(--wc-spinner-color);
            stroke-dasharray: 180 240;
            stroke-dashoffset: 0;
            animation: wc-spinner-dash calc(var(--wc-spinner-duration) * 0.9) ease-in-out infinite;
          }

          @keyframes wc-spinner-rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes wc-spinner-dash {
            0% {
              stroke-dasharray: 1 150;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 90 150;
              stroke-dashoffset: -35;
            }
            100% {
              stroke-dasharray: 90 150;
              stroke-dashoffset: -124;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            svg {
              animation-duration: calc(var(--wc-spinner-duration) * 1.6);
            }

            circle[data-part="indicator"] {
              animation: none;
            }
          }

          [part="label"] {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            clip-path: inset(50%);
            white-space: nowrap;
            border: 0;
          }

          :host([visual-label]) [part="label"] {
            position: static;
            inline-size: auto;
            block-size: auto;
            margin: 0;
            clip: auto;
            clip-path: none;
            white-space: normal;
            overflow: visible;
          }

          :host([visual-label]) ::slotted(*) {
            display: inline;
          }

          ::slotted(*) {
            margin: 0;
          }
        </style>
        <span part="icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" role="presentation">
            <circle
              data-part="track"
              cx="24"
              cy="24"
              r="20"
              stroke-width="var(--wc-spinner-stroke-width)"
              opacity="0.35"
            ></circle>
            <circle
              data-part="indicator"
              cx="24"
              cy="24"
              r="20"
              stroke-width="var(--wc-spinner-stroke-width)"
              stroke-linecap="round"
            ></circle>
          </svg>
        </span>
        <span part="label"></span>
        <slot></slot>
      `;

      this.#labelEl = /** @type {HTMLSpanElement} */ (this.#root.querySelector('[part="label"]'));
      this.#managesAriaLabel = !this.hasAttribute('aria-label');

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'status');
      }

      if (!this.hasAttribute('aria-live')) {
        this.setAttribute('aria-live', 'polite');
      }

      if (!this.hasAttribute('aria-busy')) {
        this.setAttribute('aria-busy', 'true');
      }
    }

    connectedCallback() {
      upgradeProperty(this, 'label');
      this.#syncLabel(this.getAttribute('label'));
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'label') {
        this.#syncLabel(newValue);
      } else if (name === 'aria-label') {
        if (this.#isSyncingAriaLabel) {
          return;
        }

        this.#managesAriaLabel = newValue == null;

        if (this.#managesAriaLabel) {
          this.#syncLabel(this.getAttribute('label'));
        }
      }
    }

    /**
     * Accessible text for the spinner. Reflected to the `label` attribute.
     */
    get label() {
      return this.getAttribute('label') ?? DEFAULT_LABEL;
    }

    set label(value) {
      if (value == null) {
        this.removeAttribute('label');
      } else {
        this.setAttribute('label', value);
      }
    }

    /**
     * @param {string | null} value
     */
    #syncLabel(value) {
      const labelText = value && value.trim().length > 0 ? value.trim() : DEFAULT_LABEL;
      this.#labelEl.textContent = labelText;
      if (this.#managesAriaLabel) {
        this.#isSyncingAriaLabel = true;
        this.setAttribute('aria-label', labelText);
        this.#isSyncingAriaLabel = false;
      }
    }
  }

  customElements.define('wc-spinner', WcSpinner);
})();

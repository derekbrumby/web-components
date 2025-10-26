/**
 * @file mockup-phone.js
 * @version 1.0.0
 *
 * Phone mockup web component inspired by daisyUI's mockup-phone. Renders an iPhone-like
 * frame with an optional wallpaper image or slotted content.
 *
 * Usage:
 * <wc-mockup-phone wallpaper="https://example.com/wallpaper.jpg"></wc-mockup-phone>
 */

(() => {
  /**
   * Upgrades a property that might have been set on an element instance before its
   * definition was registered. The value is re-assigned so the setter runs.
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

  class WcMockupPhone extends HTMLElement {
    static get observedAttributes() {
      return ['wallpaper', 'alt'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLImageElement} */
    #wallpaper;
    /** @type {HTMLSlotElement} */
    #slot;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --mockup-phone-aspect-ratio: 462 / 978;
            --mockup-phone-background: #000000;
            --mockup-phone-border-color: #6b6b6b;
            --mockup-phone-border-width: 5px;
            --mockup-phone-radius: 65px;
            --mockup-phone-radius-enhanced: 90px;
            --mockup-phone-padding: 6px;
            --mockup-phone-max-width: 462px;
            --mockup-phone-camera-background: #000000;
            --mockup-phone-camera-radius: 17px;
            --mockup-phone-camera-width: 28%;
            --mockup-phone-camera-height: 3.7%;
            --mockup-phone-camera-offset: 3%;
            display: inline-grid;
            box-sizing: border-box;
            aspect-ratio: var(--mockup-phone-aspect-ratio);
            background: var(--mockup-phone-background);
            border: var(--mockup-phone-border-width) solid var(--mockup-phone-border-color);
            border-radius: var(--mockup-phone-radius);
            padding: var(--mockup-phone-padding);
            justify-items: center;
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            width: 100%;
            max-width: var(--mockup-phone-max-width, 462px);
            position: relative;
            overflow: hidden;
          }

          @supports (corner-shape: superellipse(1.45)) {
            :host {
              corner-shape: superellipse(1.45);
              border-radius: var(--mockup-phone-radius-enhanced);
            }
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="camera"] {
            z-index: 1;
            background: var(--mockup-phone-camera-background);
            border-radius: var(--mockup-phone-camera-radius);
            grid-area: 1 / 1 / 2 / 2;
            width: var(--mockup-phone-camera-width);
            height: var(--mockup-phone-camera-height);
            margin-top: var(--mockup-phone-camera-offset);
            justify-self: center;
            align-self: start;
          }

          [part="display"] {
            border-radius: 54px;
            grid-area: 1 / 1 / 2 / 2;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: grid;
            justify-self: stretch;
            align-self: stretch;
          }

          @supports (corner-shape: superellipse(1.87)) {
            [part="display"] {
              corner-shape: superellipse(1.87);
              border-radius: 101px;
            }
          }

          [part="wallpaper"] {
            display: none;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          [part="wallpaper"][data-visible="true"] {
            display: block;
          }

          ::slotted(*) {
            place-self: center;
          }
        </style>
        <div part="camera" aria-hidden="true"></div>
        <div part="display">
          <img part="wallpaper" data-visible="false" alt="" />
          <slot></slot>
        </div>
      `;

      this.#wallpaper = /** @type {HTMLImageElement} */ (this.#root.querySelector('[part="wallpaper"]'));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
    }

    connectedCallback() {
      upgradeProperty(this, 'wallpaper');
      upgradeProperty(this, 'alt');
      this.#updateWallpaper();
    }

    /**
     * @param {string} name
     */
    attributeChangedCallback(name) {
      if (name === 'wallpaper' || name === 'alt') {
        this.#updateWallpaper();
      }
    }

    get wallpaper() {
      return this.getAttribute('wallpaper') ?? '';
    }

    set wallpaper(value) {
      if (value == null || value === '') {
        this.removeAttribute('wallpaper');
      } else {
        this.setAttribute('wallpaper', value);
      }
    }

    get alt() {
      return this.getAttribute('alt') ?? '';
    }

    set alt(value) {
      if (value == null) {
        this.removeAttribute('alt');
      } else {
        this.setAttribute('alt', value);
      }
    }

    #updateWallpaper() {
      const src = this.getAttribute('wallpaper');
      const alt = this.getAttribute('alt') ?? '';

      if (src) {
        this.#wallpaper.src = src;
        this.#wallpaper.alt = alt;
        this.#wallpaper.dataset.visible = 'true';
        this.#slot.hidden = true;
      } else {
        this.#wallpaper.removeAttribute('src');
        this.#wallpaper.alt = '';
        this.#wallpaper.dataset.visible = 'false';
        this.#slot.hidden = false;
      }
    }
  }

  if (!customElements.get('wc-mockup-phone')) {
    customElements.define('wc-mockup-phone', WcMockupPhone);
  }
})();

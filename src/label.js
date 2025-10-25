/**
 * @file label.js
 * @version 1.0.0
 *
 * Accessible label web component that mirrors the Radix UI label behavior while remaining
 * dependency free. The component associates content with native controls via the `for`
 * attribute or by nesting controls in the `slot="control"` slot.
 *
 * Usage:
 * <wc-label for="first-name">First name</wc-label>
 * <input id="first-name" type="text" />
 */

(() => {
  /**
   * Upgrades properties that might have been set before the element definition was registered.
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
   * Accessible label custom element that mirrors the semantics of `<label>` while exposing
   * ergonomic styling hooks and slot-based composition.
   *
   * @extends {HTMLElement}
   */
  class WcLabel extends HTMLElement {
    static get observedAttributes() {
      return ['for'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLLabelElement} */
    #label;
    /** @type {HTMLSlotElement} */
    #controlSlot;
    /** @type {(event: Event) => void} */
    #handleControlSlotChange;
    /** @type {(event: Event) => void} */
    #handleSelectStart;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --label-gap: 0.75rem;
            --label-gap-with-control: 0.75rem;
            --label-font-size: 0.95rem;
            --label-font-weight: 600;
            --label-line-height: 1.6;
            --label-color: inherit;
            --label-background: transparent;
            --label-padding-inline: 0;
            --label-padding-block: 0;
            --label-radius: 0;
            --label-cursor: pointer;
            --label-focus-outline: 2px solid rgba(129, 140, 248, 0.55);
            --label-focus-outline-offset: 4px;
            display: inline-block;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="label"] {
            display: inline-flex;
            align-items: center;
            gap: var(--label-gap);
            padding-inline: var(--label-padding-inline);
            padding-block: var(--label-padding-block);
            border-radius: var(--label-radius);
            font-size: var(--label-font-size);
            font-weight: var(--label-font-weight);
            line-height: var(--label-line-height);
            color: var(--label-color);
            background: var(--label-background);
            cursor: var(--label-cursor);
            transition: background 120ms ease, color 120ms ease;
          }

          :host([data-has-control]) [part="label"] {
            gap: var(--label-gap-with-control);
          }

          [part="label"]:focus-within {
            outline: var(--label-focus-outline);
            outline-offset: var(--label-focus-outline-offset);
          }

          [part="text"] {
            display: inline-flex;
            align-items: center;
            user-select: none;
          }

          ::slotted([slot="control"]) {
            font: inherit;
            color: inherit;
            user-select: auto;
          }
        </style>
        <label part="label">
          <span part="text"><slot></slot></span>
          <slot name="control" part="control"></slot>
        </label>
      `;

      this.#label = /** @type {HTMLLabelElement} */ (this.#root.querySelector('label'));
      this.#controlSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="control"]')
      );

      this.#handleControlSlotChange = () => {
        const controls = this.#controlSlot.assignedElements({ flatten: true });
        this.toggleAttribute('data-has-control', controls.length > 0);
      };

      this.#handleSelectStart = (event) => {
        const controls = this.#controlSlot.assignedElements({ flatten: true });
        const path = event.composedPath();
        const interactsWithControl = controls.some((element) => path.includes(element));
        if (!interactsWithControl) {
          event.preventDefault();
        }
      };
    }

    connectedCallback() {
      upgradeProperty(this, 'htmlFor');
      this.#syncForAttribute();
      this.#controlSlot.addEventListener('slotchange', this.#handleControlSlotChange);
      this.addEventListener('selectstart', this.#handleSelectStart);
      this.#handleControlSlotChange();
    }

    disconnectedCallback() {
      this.#controlSlot.removeEventListener('slotchange', this.#handleControlSlotChange);
      this.removeEventListener('selectstart', this.#handleSelectStart);
    }

    attributeChangedCallback(name, _oldValue, _newValue) {
      if (name === 'for') {
        this.#syncForAttribute();
      }
    }

    /**
     * Returns the slotted control element when available, otherwise resolves the associated
     * control via the `for` attribute.
     *
     * @returns {HTMLElement | null}
     */
    get control() {
      const controls = this.#controlSlot.assignedElements({ flatten: true });
      if (controls.length > 0) {
        return /** @type {HTMLElement} */ (controls[0]);
      }
      const target = this.htmlFor;
      return target ? this.ownerDocument?.getElementById(target) ?? null : null;
    }

    /**
     * Gets the target control identifier.
     */
    get htmlFor() {
      return this.getAttribute('for') ?? '';
    }

    set htmlFor(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('for');
      } else {
        this.setAttribute('for', String(value));
      }
    }

    #syncForAttribute() {
      const value = this.getAttribute('for');
      if (value) {
        this.#label.htmlFor = value;
      } else {
        this.#label.removeAttribute('for');
      }
    }
  }

  if (!customElements.get('wc-label')) {
    customElements.define('wc-label', WcLabel);
  }
})();

/**
 * @file toggle.js
 * @version 1.0.0
 *
 * Accessible toggle button web component inspired by the Radix UI Toggle.
 * Supports controlled and uncontrolled usage, keyboard interaction, and
 * customisable styling via CSS custom properties and parts.
 *
 * Usage:
 * <wc-toggle aria-label="Toggle italic">
 *   <span aria-hidden="true">I</span>
 * </wc-toggle>
 */

(() => {
  /**
   * Upgrades a property that may have been set before the custom element
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
   * Normalises boolean-like attribute values so both presence and explicit
   * string values such as "true" or "false" are respected.
   *
   * @param {string | null} value
   * @returns {boolean}
   */
  const booleanAttribute = (value) => value !== null && value !== 'false';

  class WcToggle extends HTMLElement {
    static get observedAttributes() {
      return ['pressed', 'default-pressed', 'disabled', 'aria-label', 'aria-labelledby'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #control;
    /** @type {boolean} */
    #pressed = false;
    /** @type {boolean} */
    #defaultPressed = false;
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #reflectingPressed = false;
    /** @type {boolean} */
    #reflectingDisabled = false;
    /** @type {boolean} */
    #dirty = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --toggle-size: 35px;
            --toggle-radius: 0.5rem;
            --toggle-background: #ffffff;
            --toggle-background-hover: rgba(196, 181, 253, 0.25);
            --toggle-background-on: rgba(165, 180, 252, 1);
            --toggle-foreground: rgba(76, 29, 149, 1);
            --toggle-foreground-on: rgba(49, 46, 129, 1);
            --toggle-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
            --toggle-focus-ring: 0 0 0 3px rgba(79, 70, 229, 0.35);
            display: inline-flex;
            vertical-align: middle;
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-disabled="true"]) {
            cursor: not-allowed;
            opacity: 0.65;
          }

          [part="control"] {
            all: unset;
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            inline-size: var(--toggle-size);
            block-size: var(--toggle-size);
            border-radius: var(--toggle-radius);
            background: var(--toggle-background);
            color: var(--toggle-foreground);
            box-shadow: var(--toggle-shadow);
            transition: background-color 160ms ease, color 160ms ease, transform 120ms ease;
            cursor: pointer;
          }

          :host(:where(:hover, :focus-within)) [part="control"] {
            background: var(--toggle-background-hover);
          }

          :host([data-state="on"]) [part="control"] {
            background: var(--toggle-background-on);
            color: var(--toggle-foreground-on);
          }

          [part="control"]:focus-visible {
            outline: none;
            box-shadow: var(--toggle-focus-ring);
          }

          [part="label"] {
            display: contents;
          }

          :host([data-disabled="true"]) [part="control"] {
            cursor: not-allowed;
            box-shadow: none;
          }
        </style>
        <button part="control" type="button" aria-pressed="false">
          <span part="label">
            <slot></slot>
          </span>
        </button>
      `;
      this.#control = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector('button[part="control"]')
      );
      this.#control.addEventListener('click', (event) => {
        if (this.#disabled) {
          event.preventDefault();
          return;
        }
        this.toggle();
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'pressed');
      upgradeProperty(this, 'defaultPressed');
      upgradeProperty(this, 'disabled');

      this.#defaultPressed = booleanAttribute(this.getAttribute('default-pressed'));

      if (this.hasAttribute('pressed')) {
        this.#setPressed(booleanAttribute(this.getAttribute('pressed')), { fromAttribute: true });
        this.#dirty = true;
      } else {
        this.#setPressed(this.#defaultPressed, { fromAttribute: true });
      }

      this.#setDisabled(booleanAttribute(this.getAttribute('disabled')), { fromAttribute: true });
      this.#syncAccessibleName();
    }

    /**
     * The current pressed state.
     */
    get pressed() {
      return this.#pressed;
    }

    set pressed(value) {
      const next = typeof value === 'string' ? value !== 'false' : Boolean(value);
      if (next) {
        this.setAttribute('pressed', '');
      } else {
        this.removeAttribute('pressed');
      }
    }

    /**
     * Initial pressed state used when uncontrolled. Update and call `reset()` to
     * reapply the value after user interaction.
     */
    get defaultPressed() {
      return this.#defaultPressed;
    }

    set defaultPressed(value) {
      const next = typeof value === 'string' ? value !== 'false' : Boolean(value);
      if (next) {
        this.setAttribute('default-pressed', '');
      } else {
        this.removeAttribute('default-pressed');
      }
    }

    /**
     * Disables the toggle and removes it from the tab order.
     */
    get disabled() {
      return this.#disabled;
    }

    set disabled(value) {
      const next = typeof value === 'string' ? value !== 'false' : Boolean(value);
      if (next) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'pressed': {
          if (this.#reflectingPressed) {
            return;
          }
          const next = booleanAttribute(newValue);
          this.#setPressed(next, { fromAttribute: true });
          this.#dirty = true;
          break;
        }
        case 'default-pressed': {
          this.#defaultPressed = booleanAttribute(newValue);
          if (!this.hasAttribute('pressed') && !this.#dirty) {
            this.#setPressed(this.#defaultPressed, { fromAttribute: true });
          }
          break;
        }
        case 'disabled': {
          if (this.#reflectingDisabled) {
            return;
          }
          const next = booleanAttribute(newValue);
          this.#setDisabled(next, { fromAttribute: true });
          break;
        }
        case 'aria-label':
        case 'aria-labelledby': {
          this.#syncAccessibleName();
          break;
        }
      }
    }

    /**
     * Toggles the pressed state. Pass a boolean to force the target value.
     *
     * @param {boolean} [force]
     */
    toggle(force) {
      if (this.#disabled) {
        return;
      }
      const next = typeof force === 'boolean' ? force : !this.#pressed;
      this.#setPressed(next, { user: true, emit: true });
    }

    /**
     * Resets the component back to the default pressed state. If the `pressed`
     * attribute is present it will be removed so the element resumes
     * uncontrolled behaviour.
     */
    reset() {
      if (this.hasAttribute('pressed')) {
        this.removeAttribute('pressed');
      }
      this.#dirty = false;
      this.#setPressed(this.#defaultPressed, { fromAttribute: true });
    }

    /**
     * Applies the next pressed state and updates DOM reflection.
     *
     * @param {boolean} next
     * @param {{ fromAttribute?: boolean; user?: boolean; emit?: boolean }} [options]
     */
    #setPressed(next, options = {}) {
      const { fromAttribute = false, user = false, emit = false } = options;
      if (this.#pressed === next) {
        return;
      }
      this.#pressed = next;
      this.setAttribute('data-state', next ? 'on' : 'off');
      this.#control.setAttribute('aria-pressed', next ? 'true' : 'false');
      if (!fromAttribute) {
        this.#reflectingPressed = true;
        if (next) {
          this.setAttribute('pressed', '');
        } else {
          this.removeAttribute('pressed');
        }
        this.#reflectingPressed = false;
      }
      if (user) {
        this.#dirty = true;
      }
      if (emit) {
        this.dispatchEvent(
          new CustomEvent('pressed-change', {
            detail: { pressed: next },
            bubbles: true,
            composed: true
          })
        );
      }
    }

    /**
     * Updates the disabled state and reflects it to DOM attributes.
     *
     * @param {boolean} next
     * @param {{ fromAttribute?: boolean }} [options]
     */
    #setDisabled(next, options = {}) {
      const { fromAttribute = false } = options;
      if (this.#disabled === next) {
        return;
      }
      this.#disabled = next;
      this.#control.disabled = next;
      if (next) {
        this.setAttribute('data-disabled', 'true');
        this.#control.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('data-disabled');
        this.#control.removeAttribute('aria-disabled');
      }
      if (!fromAttribute) {
        this.#reflectingDisabled = true;
        if (next) {
          this.setAttribute('disabled', '');
        } else {
          this.removeAttribute('disabled');
        }
        this.#reflectingDisabled = false;
      }
    }

    /**
     * Mirrors accessible naming attributes onto the internal button control.
     */
    #syncAccessibleName() {
      const ariaLabel = this.getAttribute('aria-label');
      if (ariaLabel !== null) {
        this.#control.setAttribute('aria-label', ariaLabel);
      } else {
        this.#control.removeAttribute('aria-label');
      }
      const ariaLabelledby = this.getAttribute('aria-labelledby');
      if (ariaLabelledby !== null) {
        this.#control.setAttribute('aria-labelledby', ariaLabelledby);
      } else {
        this.#control.removeAttribute('aria-labelledby');
      }
    }
  }

  if (!customElements.get('wc-toggle')) {
    customElements.define('wc-toggle', WcToggle);
  }
})();

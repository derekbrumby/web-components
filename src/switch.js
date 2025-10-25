/**
 * @file switch.js
 * @version 1.0.0
 *
 * Accessible binary toggle web component inspired by the Radix UI Switch.
 * Supports controlled and uncontrolled usage patterns, keyboard interaction,
 * and form association without external dependencies.
 *
 * Usage:
 * <wc-switch checked>Airplane mode</wc-switch>
 */

(() => {
  /**
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
   * @returns {boolean}
   */
  const booleanAttribute = (value) => value !== null && value !== 'false';

  class WcSwitch extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
      return ['checked', 'disabled', 'required', 'name', 'value'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {ElementInternals | null} */
    #internals;
    /** @type {boolean} */
    #checked = false;
    /** @type {boolean} */
    #defaultChecked = false;
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #required = false;
    /** @type {string} */
    #value = 'on';

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --switch-width: 42px;
            --switch-height: 25px;
            --switch-padding: 2px;
            --switch-radius: 999px;
            --switch-track-background: rgba(15, 23, 42, 0.18);
            --switch-track-background-checked: rgba(15, 23, 42, 0.9);
            --switch-thumb-size: 21px;
            --switch-thumb-background: #ffffff;
            --switch-thumb-shadow: 0 2px 4px rgba(15, 23, 42, 0.3);
            --switch-focus-ring: 0 0 0 4px rgba(79, 70, 229, 0.3);
            --switch-gap: 0.75rem;
            --switch-label-color: inherit;
            display: inline-flex;
            align-items: center;
            gap: var(--switch-gap);
            cursor: pointer;
            user-select: none;
            touch-action: manipulation;
            color: var(--switch-label-color);
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-disabled="true"]) {
            cursor: not-allowed;
            opacity: 0.6;
          }

          :host(:focus-visible) {
            outline: none;
          }

          :host(:focus-visible) [part="control"] {
            box-shadow: var(--switch-focus-ring);
          }

          [part="root"] {
            display: inline-flex;
            align-items: center;
            gap: var(--switch-gap);
          }

          [part="label"]::slotted(*) {
            color: inherit;
          }

          [part="control"] {
            position: relative;
            inline-size: var(--switch-width);
            block-size: var(--switch-height);
            padding: var(--switch-padding);
            border-radius: var(--switch-radius);
            background: var(--switch-track-background);
            transition: background 140ms ease;
          }

          [part="thumb"] {
            position: absolute;
            inset-block-start: var(--switch-padding);
            inset-inline-start: var(--switch-padding);
            inline-size: var(--switch-thumb-size);
            block-size: var(--switch-thumb-size);
            border-radius: 50%;
            background: var(--switch-thumb-background);
            box-shadow: var(--switch-thumb-shadow);
            transition: transform 140ms ease;
            will-change: transform;
          }

          :host([data-state="checked"]) [part="control"] {
            background: var(--switch-track-background-checked);
          }

          :host([data-state="checked"]) [part="thumb"] {
            transform: translateX(calc(var(--switch-width) - var(--switch-thumb-size) - (var(--switch-padding) * 2)));
          }
        </style>
        <div part="root">
          <div part="control" aria-hidden="true">
            <div part="thumb"></div>
          </div>
          <slot part="label"></slot>
        </div>
      `;

      this.#internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      if (this.#internals) {
        this.#internals.role = 'switch';
      }
    }

    connectedCallback() {
      upgradeProperty(this, 'checked');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'required');
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'name');

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'switch');
      }

      this.tabIndex = this.#disabled ? -1 : 0;

      this.addEventListener('click', this.#handleClick);
      this.addEventListener('keydown', this.#handleKeyDown);
      this.addEventListener('pointerdown', this.#handlePointerDown);

      this.#defaultChecked = this.hasAttribute('checked');
      this.#updateState({ emit: false, reflect: false });
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.#handleClick);
      this.removeEventListener('keydown', this.#handleKeyDown);
      this.removeEventListener('pointerdown', this.#handlePointerDown);
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'checked': {
          const next = booleanAttribute(newValue);
          this.#setChecked(next, { reflect: false, emit: false });
          break;
        }
        case 'disabled': {
          const next = booleanAttribute(newValue);
          if (next !== this.#disabled) {
            this.#disabled = next;
            this.tabIndex = this.#disabled ? -1 : 0;
            if (this.#disabled) {
              this.setAttribute('aria-disabled', 'true');
              if (this.#internals) {
                this.#internals.ariaDisabled = 'true';
              }
            } else {
              this.removeAttribute('aria-disabled');
              if (this.#internals) {
                this.#internals.ariaDisabled = null;
              }
            }
            this.toggleAttribute('data-disabled', this.#disabled);
          }
          break;
        }
        case 'required': {
          const next = booleanAttribute(newValue);
          if (next !== this.#required) {
            this.#required = next;
            this.#updateValidity();
          }
          break;
        }
        case 'value': {
          if (typeof newValue === 'string') {
            this.#value = newValue;
            this.#updateState({ emit: false, reflect: false });
          }
          break;
        }
        case 'name': {
          this.#updateState({ emit: false, reflect: false });
          break;
        }
        default:
          break;
      }
    }

    /**
     * @returns {boolean}
     */
    get checked() {
      return this.#checked;
    }

    /**
     * @param {boolean} value
     */
    set checked(value) {
      this.#setChecked(Boolean(value), { emit: false });
    }

    /**
     * @returns {boolean}
     */
    get disabled() {
      return this.#disabled;
    }

    /**
     * @param {boolean} value
     */
    set disabled(value) {
      this.toggleAttribute('disabled', Boolean(value));
    }

    /**
     * @returns {boolean}
     */
    get required() {
      return this.#required;
    }

    /**
     * @param {boolean} value
     */
    set required(value) {
      this.toggleAttribute('required', Boolean(value));
    }

    /**
     * @returns {string}
     */
    get value() {
      return this.#value;
    }

    /**
     * @param {string} value
     */
    set value(value) {
      this.setAttribute('value', value);
    }

    /**
     * @returns {string}
     */
    get name() {
      return this.getAttribute('name') || '';
    }

    /**
     * @param {string} value
     */
    set name(value) {
      this.setAttribute('name', value);
    }

    /**
     * Toggles the switch state. Provide a boolean to force a particular value.
     *
     * @param {boolean} [force]
     */
    toggle(force) {
      if (this.#disabled) {
        return;
      }
      const next = typeof force === 'boolean' ? force : !this.#checked;
      this.#setChecked(next, { emit: true });
    }

    formResetCallback() {
      this.#setChecked(this.#defaultChecked, { emit: false });
    }

    /**
     * @param {'restore' | 'autocomplete'} _mode
     * @param {string} value
     */
    formStateRestoreCallback(_mode, value) {
      this.#setChecked(value === this.#value, { emit: false });
    }

    #handleClick = (event) => {
      if (this.#disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const composedPath = event.composedPath();
      const interactive = composedPath.find((node) => {
        return (
          node instanceof HTMLElement &&
          (node.tagName === 'A' || node.tagName === 'BUTTON' || node.tagName === 'INPUT')
        );
      });
      if (interactive && interactive !== this) {
        return;
      }
      this.toggle();
    };

    /**
     * @param {KeyboardEvent} event
     */
    #handleKeyDown = (event) => {
      if (this.#disabled) {
        return;
      }
      const { key } = event;
      if (key === ' ' || key === 'Spacebar') {
        event.preventDefault();
        this.toggle();
      } else if (key === 'Enter') {
        event.preventDefault();
        this.toggle();
      } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
        event.preventDefault();
        this.toggle(false);
      } else if (key === 'ArrowRight' || key === 'ArrowUp') {
        event.preventDefault();
        this.toggle(true);
      }
    };

    /**
     * @param {PointerEvent} event
     */
    #handlePointerDown = (event) => {
      if (this.#disabled) {
        return;
      }
      if (event.pointerType === 'mouse') {
        event.preventDefault();
      }
      this.focus();
    };

    /**
     * @param {boolean} next
     * @param {{ emit?: boolean; reflect?: boolean }} [options]
     */
    #setChecked(next, options) {
      const { emit = false, reflect = true } = options || {};
      if (next === this.#checked) {
        return;
      }
      this.#checked = next;
      this.#updateState({ emit, reflect });
    }

    /**
     * @param {{ emit?: boolean; reflect?: boolean }} [options]
     */
    #updateState(options) {
      const { emit = false, reflect = true } = options || {};
      if (reflect) {
        this.toggleAttribute('checked', this.#checked);
      }
      this.setAttribute('data-state', this.#checked ? 'checked' : 'unchecked');
      if (this.#internals) {
        this.#internals.ariaChecked = this.#checked ? 'true' : 'false';
      }
      this.setAttribute('aria-checked', this.#checked ? 'true' : 'false');
      if (this.#internals) {
        this.#internals.setFormValue(
          this.#checked ? this.#value : null,
          this.#checked ? this.#value : null,
        );
      }
      this.#updateValidity();
      if (emit) {
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    #updateValidity() {
      if (!this.#internals) {
        return;
      }
      if (this.#required && !this.#checked) {
        this.#internals.setValidity({ valueMissing: true }, 'Please enable this option.', this);
      } else {
        this.#internals.setValidity({});
      }
    }
  }

  if (!customElements.get('wc-switch')) {
    customElements.define('wc-switch', WcSwitch);
  }
})();

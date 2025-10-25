/**
 * @file checkbox.js
 * @version 1.0.0
 *
 * Accessible tri-state checkbox web component inspired by the Radix UI Checkbox.
 * Supports uncontrolled and controlled usage, keyboard interaction, and form association.
 *
 * Usage:
 * <wc-checkbox checked>Accept terms and conditions.</wc-checkbox>
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

  class WcCheckbox extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
      return ['checked', 'indeterminate', 'disabled', 'required', 'value'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #control;
    /** @type {HTMLElement} */
    #label;
    /** @type {ElementInternals | null} */
    #internals;
    /** @type {boolean} */
    #checked = false;
    /** @type {boolean} */
    #indeterminate = false;
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #required = false;
    /** @type {string} */
    #value = 'on';
    /** @type {boolean} */
    #defaultChecked = false;
    /** @type {boolean} */
    #defaultIndeterminate = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --checkbox-size: 25px;
            --checkbox-radius: 6px;
            --checkbox-border-width: 1px;
            --checkbox-border-color: rgba(99, 102, 241, 0.45);
            --checkbox-background: #ffffff;
            --checkbox-background-checked: #4f46e5;
            --checkbox-background-indeterminate: #4f46e5;
            --checkbox-foreground: #ffffff;
            --checkbox-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
            --checkbox-focus-ring: 0 0 0 4px rgba(79, 70, 229, 0.25);
            --checkbox-gap: 0.75rem;
            --checkbox-label-color: inherit;
            display: inline-flex;
            align-items: center;
            gap: var(--checkbox-gap);
            cursor: pointer;
            user-select: none;
            touch-action: manipulation;
            position: relative;
            color: inherit;
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
            box-shadow: var(--checkbox-focus-ring);
          }

          [part="root"] {
            display: inline-flex;
            align-items: center;
            gap: var(--checkbox-gap);
          }

          [part="control"] {
            inline-size: var(--checkbox-size);
            block-size: var(--checkbox-size);
            border-radius: var(--checkbox-radius);
            border: var(--checkbox-border-width) solid var(--checkbox-border-color);
            background: var(--checkbox-background);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--checkbox-shadow);
            transition: background 160ms ease, border-color 160ms ease, transform 120ms ease;
            color: var(--checkbox-foreground);
          }

          :host([data-state="checked"]) [part="control"] {
            background: var(--checkbox-background-checked);
            border-color: var(--checkbox-background-checked);
          }

          :host([data-state="indeterminate"]) [part="control"] {
            background: var(--checkbox-background-indeterminate);
            border-color: var(--checkbox-background-indeterminate);
          }

          [part="indicator"] {
            inline-size: 100%;
            block-size: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transform: scale(0);
            transition: transform 140ms ease;
            color: inherit;
            position: relative;
          }

          [part="indicator"] svg {
            inline-size: 70%;
            block-size: 70%;
            stroke: currentColor;
            stroke-width: 2.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }

          [part="indicator"]::after {
            content: '';
            position: absolute;
            inline-size: 60%;
            block-size: 2px;
            background: currentColor;
            border-radius: 1px;
            opacity: 0;
            transform: scaleX(0.75);
            transition: opacity 140ms ease;
          }

          :host([data-state="checked"]) [part="indicator"] {
            transform: scale(1);
          }

          :host([data-state="checked"]) [part="indicator"]::after {
            opacity: 0;
          }

          :host([data-state="checked"]) [part="indicator"] svg {
            opacity: 1;
          }

          :host([data-state="indeterminate"]) [part="indicator"] {
            transform: scale(1);
          }

          :host([data-state="indeterminate"]) [part="indicator"]::after {
            opacity: 1;
          }

          :host([data-state="indeterminate"]) [part="indicator"] svg {
            opacity: 0;
          }

          :host([data-disabled="true"]) [part="control"] {
            box-shadow: none;
          }

          :host([data-disabled="true"]) [part="label"] {
            color: rgba(15, 23, 42, 0.55);
          }

          [part="label"] {
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--checkbox-label-color);
          }
        </style>
        <div part="root">
          <div part="control" aria-hidden="true">
            <span part="indicator" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <polyline points="5 13 9 17 19 7"></polyline>
              </svg>
            </span>
          </div>
          <span id="label" part="label"><slot></slot></span>
        </div>
      `;

      this.#control = /** @type {HTMLElement} */ (this.#root.querySelector('[part="control"]'));
      this.#label = /** @type {HTMLElement} */ (this.#root.getElementById('label'));

      this.#internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      if (this.#internals) {
        this.#internals.role = 'checkbox';
        if (this.#label) {
          this.#internals.ariaLabelledBy = 'label';
        }
      } else {
        this.setAttribute('role', 'checkbox');
        if (this.#label) {
          this.setAttribute('aria-labelledby', 'label');
        }
      }
    }

    connectedCallback() {
      upgradeProperty(this, 'checked');
      upgradeProperty(this, 'indeterminate');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'required');
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'name');

      this.addEventListener('click', this.#handleClick);
      this.addEventListener('keydown', this.#handleKeyDown);
      this.addEventListener('keyup', this.#handleKeyUp);
      this.addEventListener('mousedown', this.#handlePointerDown);

      if (!this.hasAttribute('tabindex')) {
        this.tabIndex = this.disabled ? -1 : 0;
      }

      this.#defaultChecked = this.checked;
      this.#defaultIndeterminate = this.indeterminate;

      this.#render();
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.#handleClick);
      this.removeEventListener('keydown', this.#handleKeyDown);
      this.removeEventListener('keyup', this.#handleKeyUp);
      this.removeEventListener('mousedown', this.#handlePointerDown);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'checked': {
          this.#checked = booleanAttribute(newValue);
          if (this.#checked) {
            this.#indeterminate = false;
          }
          break;
        }
        case 'indeterminate': {
          this.#indeterminate = booleanAttribute(newValue);
          if (this.#indeterminate) {
            this.#checked = false;
          }
          break;
        }
        case 'disabled': {
          this.#disabled = booleanAttribute(newValue);
          break;
        }
        case 'required': {
          this.#required = booleanAttribute(newValue);
          break;
        }
        case 'value': {
          this.#value = newValue ?? 'on';
          break;
        }
        default:
          break;
      }

      if (name === 'disabled' && !this.hasAttribute('tabindex')) {
        this.tabIndex = this.#disabled ? -1 : 0;
      }

      this.#render();
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
      if (value) {
        this.setAttribute('checked', '');
      } else {
        this.removeAttribute('checked');
      }
    }

    /**
     * @returns {boolean}
     */
    get indeterminate() {
      return this.#indeterminate;
    }

    /**
     * @param {boolean} value
     */
    set indeterminate(value) {
      if (value) {
        this.setAttribute('indeterminate', '');
      } else {
        this.removeAttribute('indeterminate');
      }
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
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
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
      if (value) {
        this.setAttribute('required', '');
      } else {
        this.removeAttribute('required');
      }
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
     * Returns the associated form, if any.
     *
     * @returns {HTMLFormElement | null}
     */
    get form() {
      return this.#internals?.form ?? null;
    }

    /**
     * Imperatively toggle the checkbox state.
     *
     * @param {boolean} [force]
     */
    toggle(force) {
      if (this.disabled) {
        return;
      }
      const previousChecked = this.checked;
      const previousIndeterminate = this.indeterminate;
      const shouldCheck =
        typeof force === 'boolean'
          ? force
          : this.indeterminate
            ? true
            : !this.checked;
      this.indeterminate = false;
      this.checked = shouldCheck;
      const changed =
        previousChecked !== this.checked || previousIndeterminate !== this.indeterminate;
      if (changed) {
        this.#emitChange();
      }
    }

    formDisabledCallback(disabled) {
      this.disabled = disabled;
    }

    formResetCallback() {
      this.indeterminate = this.#defaultIndeterminate;
      this.checked = this.#defaultChecked;
    }

    /**
     * @param {string | null} state
     * @param {string} _mode
     */
    formStateRestoreCallback(state, _mode) {
      if (state === 'checked') {
        this.indeterminate = false;
        this.checked = true;
      } else {
        this.checked = false;
        this.indeterminate = state === 'indeterminate';
      }
    }

    /**
     * @returns {string}
     */
    get name() {
      return this.getAttribute('name') ?? '';
    }

    /**
     * @param {string} value
     */
    set name(value) {
      this.setAttribute('name', value);
    }

    #handleClick = (event) => {
      if (this.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      this.focus();
      this.toggle();
    };

    #handleKeyDown = (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
      }
    };

    #handleKeyUp = (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.toggle();
      }
    };

    #handlePointerDown = () => {
      if (!this.disabled) {
        this.focus();
      }
    };

    #emitChange() {
      this.#render();
      const inputEvent = new Event('input', { bubbles: true, composed: true });
      this.dispatchEvent(inputEvent);
      const changeEvent = new Event('change', { bubbles: true });
      this.dispatchEvent(changeEvent);
    }

    #render() {
      const state = this.#indeterminate
        ? 'indeterminate'
        : this.#checked
          ? 'checked'
          : 'unchecked';
      this.setAttribute('data-state', state);
      if (this.#disabled) {
        this.setAttribute('data-disabled', 'true');
      } else {
        this.removeAttribute('data-disabled');
      }

      const ariaChecked = this.#indeterminate ? 'mixed' : this.#checked ? 'true' : 'false';
      if (this.#internals) {
        this.#internals.ariaChecked = ariaChecked;
        this.#internals.ariaDisabled = this.#disabled ? 'true' : 'false';
        this.#internals.ariaRequired = this.#required ? 'true' : 'false';
        this.#internals.setValidity(
          this.#required && !this.#checked ? { valueMissing: true } : {},
          this.#required && !this.#checked ? 'Please check this box.' : ''
        );
        const formValue = this.#checked ? this.#value : null;
        const stateValue = this.#indeterminate ? 'indeterminate' : this.#checked ? 'checked' : null;
        this.#internals.setFormValue(formValue, stateValue);
        if ('states' in this.#internals) {
          const states = /** @type {DOMTokenList} */ (this.#internals.states);
          states.delete('indeterminate');
          if (this.#indeterminate) {
            states.add('indeterminate');
          }
        }
      } else {
        this.setAttribute('aria-checked', ariaChecked);
        this.setAttribute('aria-disabled', this.#disabled ? 'true' : 'false');
        this.setAttribute('aria-required', this.#required ? 'true' : 'false');
      }

      if (this.#control) {
        this.#control.setAttribute('data-state', state);
        this.#control.toggleAttribute('data-disabled', this.#disabled);
      }
    }
  }

  if (!customElements.get('wc-checkbox')) {
    customElements.define('wc-checkbox', WcCheckbox);
  }
})();

/**
 * @file input.js
 * @version 1.0.0
 *
 * Accessible, themeable text input web component inspired by the shadcn/ui input.
 * The element mirrors native `<input>` semantics, is form associated, and exposes
 * rich styling hooks through CSS custom properties and parts.
 */

(() => {
  /** @type {boolean} */
  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  /**
   * Upgrades a property that may have been set before the custom element
   * definition was registered.
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

  /** @type {Set<string>} */
  const BOOLEAN_ATTRIBUTES = new Set(['disabled', 'readonly', 'required', 'autofocus']);

  /** @type {Set<string>} */
  const REFLECTED_ATTRIBUTES = new Set([
    'value',
    'type',
    'placeholder',
    'name',
    'autocomplete',
    'autocapitalize',
    'autocorrect',
    'inputmode',
    'pattern',
    'min',
    'max',
    'step',
    'minlength',
    'maxlength',
    'enterkeyhint',
    'spellcheck',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-invalid',
    ...BOOLEAN_ATTRIBUTES
  ]);

  /**
   * Reflects a string attribute to the internal input control.
   *
   * @param {HTMLInputElement} input
   * @param {string} name
   * @param {string | null} value
   */
  const reflectAttribute = (input, name, value) => {
    if (BOOLEAN_ATTRIBUTES.has(name)) {
      if (value === null) {
        input.removeAttribute(name);
      } else {
        input.setAttribute(name, '');
      }
      return;
    }

    if (value === null || value === undefined) {
      input.removeAttribute(name);
    } else {
      input.setAttribute(name, value);
    }
  };

  /**
   * Accessible text input custom element that mirrors the behaviour of native inputs.
   *
   * @extends {HTMLElement}
   */
  class WcInput extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return Array.from(REFLECTED_ATTRIBUTES);
    }

    /** @type {ShadowRoot} */
    #root;

    /** @type {HTMLInputElement} */
    #input;

    /** @type {ElementInternals | undefined} */
    #internals;

    /** @type {string} */
    #defaultValue = '';

    /** @type {(event: InputEvent | Event) => void} */
    #handleInput;

    /** @type {(event: Event) => void} */
    #handleChange;

    /** @type {(event: Event) => void} */
    #handleInvalid;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals may be undefined in older DOM lib definitions.
        this.#internals = this.attachInternals();
      }

      this.#root.innerHTML = `
        <style>
          :host {
            --wc-input-font-family: inherit;
            --wc-input-font-size: 0.95rem;
            --wc-input-font-weight: 400;
            --wc-input-letter-spacing: normal;
            --wc-input-line-height: 1.45;
            --wc-input-radius: 0.65rem;
            --wc-input-padding-inline: 0.85rem;
            --wc-input-padding-block: 0.6rem;
            --wc-input-background: rgba(15, 23, 42, 0.02);
            --wc-input-background-hover: rgba(15, 23, 42, 0.05);
            --wc-input-background-disabled: rgba(148, 163, 184, 0.12);
            --wc-input-border: 1px solid rgba(148, 163, 184, 0.55);
            --wc-input-border-hover: 1px solid rgba(99, 102, 241, 0.5);
            --wc-input-border-focus: 2px solid rgba(99, 102, 241, 0.8);
            --wc-input-shadow-focus: 0 0 0 4px rgba(99, 102, 241, 0.2);
            --wc-input-color: inherit;
            --wc-input-placeholder: rgba(100, 116, 139, 0.85);
            --wc-input-caret-color: currentColor;
            --wc-input-transition-duration: 120ms;
            display: inline-flex;
            inline-size: var(--wc-input-inline-size, 100%);
            max-inline-size: 100%;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="container"] {
            position: relative;
            display: inline-flex;
            align-items: center;
            inline-size: 100%;
            min-inline-size: 0;
            border-radius: var(--wc-input-radius);
            background: var(--wc-input-background);
            border: var(--wc-input-border);
            transition: background-color var(--wc-input-transition-duration) ease,
              border-color var(--wc-input-transition-duration) ease,
              box-shadow var(--wc-input-transition-duration) ease;
          }

          :host(:where(:hover, :focus-within)) [part="container"] {
            background: var(--wc-input-background-hover);
            border: var(--wc-input-border-hover);
          }

          :host(:focus-within) [part="container"] {
            border: var(--wc-input-border-focus);
            box-shadow: var(--wc-input-shadow-focus);
          }

          :host([data-disabled="true"]) [part="container"] {
            background: var(--wc-input-background-disabled);
            border: var(--wc-input-border);
            cursor: not-allowed;
            opacity: 0.75;
          }

          input[part="input"] {
            all: unset;
            box-sizing: border-box;
            inline-size: 100%;
            min-inline-size: 0;
            font-family: var(--wc-input-font-family);
            font-size: var(--wc-input-font-size);
            font-weight: var(--wc-input-font-weight);
            letter-spacing: var(--wc-input-letter-spacing);
            line-height: var(--wc-input-line-height);
            padding-inline: var(--wc-input-padding-inline);
            padding-block: var(--wc-input-padding-block);
            color: var(--wc-input-color);
            caret-color: var(--wc-input-caret-color);
          }

          input[part="input"]::placeholder {
            color: var(--wc-input-placeholder);
            opacity: 1;
          }

          input[part="input"]:disabled {
            cursor: not-allowed;
          }

          input[part="input"]::-ms-clear {
            display: none;
          }

          :host([data-empty="true"])::after {
            content: '';
          }
        </style>
        <div part="container">
          <input part="input" />
        </div>
      `;

      this.#input = /** @type {HTMLInputElement} */ (this.#root.querySelector('input'));

      this.#input.type = this.getAttribute('type') ?? 'text';

      this.#handleInput = (event) => {
        event.stopPropagation();
        this.#setFormValue();
        this.#updateEmptyState();
        this.#updateFileState();

        if (this.#input.type !== 'file') {
          const value = this.#input.value;
          const attributeValue = this.getAttribute('value');
          if (attributeValue !== value) {
            this.setAttribute('value', value);
          }
        }

        if (typeof InputEvent !== 'undefined' && event instanceof InputEvent) {
          this.dispatchEvent(
            new InputEvent('input', {
              data: event.data ?? null,
              inputType: event.inputType,
              isComposing: event.isComposing,
              bubbles: true,
              composed: true
            })
          );
        } else {
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }
      };

      this.#handleChange = (event) => {
        event.stopPropagation();
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      };

      this.#handleInvalid = (event) => {
        event.stopPropagation();
        this.dispatchEvent(new Event('invalid', { bubbles: false }));
      };

      this.#input.addEventListener('input', this.#handleInput);
      this.#input.addEventListener('change', this.#handleChange);
      this.#input.addEventListener('invalid', this.#handleInvalid);

      this.#updateEmptyState();
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'type');
      upgradeProperty(this, 'placeholder');
      upgradeProperty(this, 'name');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'readonly');
      upgradeProperty(this, 'required');
      upgradeProperty(this, 'autocomplete');

      this.#defaultValue = this.value;
      this.#syncBooleanStates();
      this.#setFormValue();
      this.#updateEmptyState();
      this.#updateFileState();
    }

    disconnectedCallback() {
      this.#input.removeEventListener('input', this.#handleInput);
      this.#input.removeEventListener('change', this.#handleChange);
      this.#input.removeEventListener('invalid', this.#handleInvalid);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (!this.#input) {
        return;
      }

      switch (name) {
        case 'value': {
          const value = newValue ?? '';
          if (this.#input.type === 'file') {
            if (!value) {
              this.#input.value = '';
            }
          } else if (this.#input.value !== value) {
            this.#input.value = value;
          }
          this.#setFormValue();
          this.#updateEmptyState();
          this.#updateFileState();
          break;
        }
        case 'type': {
          this.#input.type = newValue ?? 'text';
          this.#setFormValue();
          this.#updateEmptyState();
          this.#updateFileState();
          break;
        }
        case 'disabled':
        case 'readonly':
        case 'required':
        case 'autofocus': {
          if (newValue === null) {
            this.#input.removeAttribute(name);
          } else {
            this.#input.setAttribute(name, '');
          }
          this.#syncBooleanStates();
          if (name === 'disabled' && newValue !== null) {
            this.#input.blur();
          }
          break;
        }
        default: {
          reflectAttribute(this.#input, name, newValue);
          break;
        }
      }
    }

    /** @returns {string} */
    get value() {
      return this.#input?.value ?? this.getAttribute('value') ?? '';
    }

    /** @param {string | null | undefined} value */
    set value(value) {
      if (this.#input?.type === 'file') {
        if (value === null || value === undefined || value === '') {
          this.removeAttribute('value');
          this.#input.value = '';
          this.#setFormValue();
        }
        this.#updateEmptyState();
        this.#updateFileState();
        return;
      }

      if (value === null || value === undefined) {
        this.removeAttribute('value');
        this.#input.value = '';
        this.#setFormValue();
      } else {
        this.setAttribute('value', String(value));
      }
      this.#updateEmptyState();
      this.#updateFileState();
    }

    /** @returns {string} */
    get type() {
      return this.getAttribute('type') ?? 'text';
    }

    /** @param {string | null} value */
    set type(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('type');
      } else {
        this.setAttribute('type', value);
      }
    }

    /** @returns {string} */
    get placeholder() {
      return this.getAttribute('placeholder') ?? '';
    }

    /** @param {string | null | undefined} value */
    set placeholder(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('placeholder');
      } else {
        this.setAttribute('placeholder', value);
      }
    }

    /** @returns {string} */
    get name() {
      return this.getAttribute('name') ?? '';
    }

    /** @param {string | null | undefined} value */
    set name(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('name');
      } else {
        this.setAttribute('name', value);
      }
    }

    /** @returns {boolean} */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /** @param {boolean} value */
    set disabled(value) {
      this.toggleAttribute('disabled', Boolean(value));
    }

    /** @returns {boolean} */
    get readOnly() {
      return this.hasAttribute('readonly');
    }

    /** @param {boolean} value */
    set readOnly(value) {
      this.toggleAttribute('readonly', Boolean(value));
    }

    /** @returns {boolean} */
    get required() {
      return this.hasAttribute('required');
    }

    /** @param {boolean} value */
    set required(value) {
      this.toggleAttribute('required', Boolean(value));
    }

    /** @returns {boolean} */
    get autofocus() {
      return this.hasAttribute('autofocus');
    }

    /** @param {boolean} value */
    set autofocus(value) {
      this.toggleAttribute('autofocus', Boolean(value));
    }

    /** @returns {string} */
    get autocomplete() {
      return this.getAttribute('autocomplete') ?? '';
    }

    /** @param {string | null | undefined} value */
    set autocomplete(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('autocomplete');
      } else {
        this.setAttribute('autocomplete', value);
      }
    }

    /** @returns {HTMLFormElement | null} */
    get form() {
      return this.#internals?.form ?? null;
    }

    /** @returns {FileList | null} */
    get files() {
      return this.#input.files;
    }

    /**
     * Returns the native input control for direct access when necessary.
     *
     * @returns {HTMLInputElement}
     */
    get inputElement() {
      return this.#input;
    }

    /** @param {FocusOptions=} options */
    focus(options) {
      this.#input?.focus(options);
    }

    blur() {
      this.#input?.blur();
    }

    select() {
      this.#input?.select();
    }

    /**
     * @param {number} start
     * @param {number} end
     * @param {string=} direction
     */
    setSelectionRange(start, end, direction) {
      this.#input?.setSelectionRange(start, end, direction);
    }

    /**
     * Mirrors the native `setRangeText` API.
     *
     * @param {string} replacement
     * @param {number=} start
     * @param {number=} end
     * @param {string=} selectionMode
     */
    setRangeText(replacement, start, end, selectionMode) {
      if (start !== undefined && end !== undefined) {
        this.#input?.setRangeText(replacement, start, end, selectionMode);
      } else {
        this.#input?.setRangeText(replacement);
      }
      this.value = this.#input?.value ?? '';
    }

    /**
     * @param {string} message
     */
    setCustomValidity(message) {
      this.#input?.setCustomValidity(message);
      this.#internals?.setValidity(this.#input.validity, message, this.#input);
    }

    /** @returns {ValidityState} */
    get validity() {
      return this.#internals?.validity ?? this.#input.validity;
    }

    /** @returns {string} */
    get validationMessage() {
      return this.#internals?.validationMessage ?? this.#input.validationMessage;
    }

    /**
     * @returns {boolean}
     */
    checkValidity() {
      const valid = this.#input.checkValidity();
      this.#internals?.setValidity(this.#input.validity, this.#input.validationMessage, this.#input);
      return valid;
    }

    /**
     * @returns {boolean}
     */
    reportValidity() {
      const valid = this.#input.reportValidity();
      this.#internals?.setValidity(this.#input.validity, this.#input.validationMessage, this.#input);
      return valid;
    }

    /**
     * Called when the parent form resets.
     */
    formResetCallback() {
      this.value = this.#defaultValue;
      this.#setFormValue();
    }

    /**
     * Restores the value when form state is restored.
     *
     * @param {string | null} state
     */
    formStateRestoreCallback(state) {
      if (state !== null) {
        this.value = state;
      } else {
        this.value = this.#defaultValue;
      }
      this.#setFormValue();
    }

    #syncBooleanStates() {
      const disabled = this.hasAttribute('disabled');
      this.toggleAttribute('data-disabled', disabled);
      if (this.#internals?.states) {
        const states = /** @type {DOMTokenList} */ (this.#internals.states);
        if (disabled) {
          states.add('disabled');
        } else if (typeof states.remove === 'function') {
          states.remove('disabled');
        }
      }
    }

    #updateEmptyState() {
      let isEmpty = !this.#input.value;
      if (this.#input.type === 'file') {
        isEmpty = !(this.#input.files && this.#input.files.length > 0);
      }
      this.toggleAttribute('data-empty', isEmpty);
    }

    #updateFileState() {
      if (this.#input.type === 'file') {
        const hasFiles = !!(this.#input.files && this.#input.files.length > 0);
        this.toggleAttribute('data-has-files', hasFiles);
      } else {
        this.removeAttribute('data-has-files');
      }
    }

    #setFormValue() {
      if (!this.#internals) {
        return;
      }

      if (this.#input.type === 'file') {
        const files = this.#input.files;
        if (files && files.length > 0) {
          this.#internals.setFormValue(files);
        } else {
          this.#internals.setFormValue(null);
        }
      } else {
        this.#internals.setFormValue(this.#input.value);
      }
    }
  }

  if (!customElements.get('wc-input')) {
    customElements.define('wc-input', WcInput);
  }
})();

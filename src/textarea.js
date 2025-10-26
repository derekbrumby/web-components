/**
 * @file textarea.js
 * @version 1.0.0
 * @license MIT
 *
 * Accessible textarea web component inspired by the shadcn/ui textarea.
 * - Form-associated so its value participates in native submissions and label associations.
 * - Supports all common textarea attributes via property and attribute reflection.
 * - Exposes styling hooks through CSS custom properties and ::part selectors.
 * - Ships without dependencies and is safe to load directly from a CDN.
 */

(() => {
  /**
   * Upgrades a property that may have been set on an instance before the element was defined.
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

  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  /** @type {readonly string[]} */
  const PASSTHROUGH_ATTRIBUTES = [
    'placeholder',
    'cols',
    'maxlength',
    'minlength',
    'autocomplete',
    'autocapitalize',
    'autocorrect',
    'inputmode',
    'wrap'
  ];

  /** @type {readonly string[]} */
  const ARIA_ATTRIBUTES = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage'];

  /**
   * Convert a potential nullable value into a string. Null and undefined become an empty string.
   *
   * @param {unknown} value
   */
  const toStringValue = (value) => (value == null ? '' : String(value));

  /**
   * @typedef {'value' | 'name' | 'placeholder' | 'rows' | 'cols' | 'maxlength' | 'minlength' | 'autocomplete' | 'autocapitalize' | 'autocorrect' | 'inputmode' | 'wrap' | 'spellcheck' | 'disabled' | 'readonly' | 'required' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-errormessage'} ObservedAttribute
   */

  /**
   * Styled multiline textarea element with Radix-inspired defaults.
   *
   * @fires input - Re-dispatched when the value changes.
   * @fires change - Re-dispatched when the control loses focus after a change.
   */
  class WcTextarea extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    /**
     * @returns {ObservedAttribute[]}
     */
    static get observedAttributes() {
      return [
        'value',
        'name',
        'placeholder',
        'rows',
        'cols',
        'maxlength',
        'minlength',
        'autocomplete',
        'autocapitalize',
        'autocorrect',
        'inputmode',
        'wrap',
        'spellcheck',
        'disabled',
        'readonly',
        'required',
        'aria-label',
        'aria-labelledby',
        'aria-describedby',
        'aria-errormessage'
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLTextAreaElement} */
    #textarea;
    /** @type {ElementInternals | undefined} */
    #internals;
    /** @type {string} */
    #defaultValue = '';
    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {boolean} */
    #connected = false;

    /** @type {(event: Event) => void} */
    #handleInput;
    /** @type {(event: Event) => void} */
    #handleChange;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open', delegatesFocus: true });

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals is not present in older lib definitions.
        this.#internals = this.attachInternals();
        if (this.#internals && 'role' in this.#internals) {
          try {
            this.#internals.role = 'textbox';
          } catch (_error) {
            // Some browsers expose ElementInternals without a writable role property.
          }
        }
      }

      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            inline-size: 100%;
            font: 400 0.95rem/1.6 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: var(--wc-textarea-color, inherit);
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([disabled]) {
            pointer-events: none;
          }

          [part="base"] {
            display: inline-flex;
            inline-size: 100%;
          }

          textarea[part="textarea"] {
            box-sizing: border-box;
            display: block;
            inline-size: 100%;
            min-block-size: var(--wc-textarea-min-block-size, 5.5rem);
            padding: var(--wc-textarea-padding, 0.75rem 0.9rem);
            border-radius: var(--wc-textarea-radius, 0.75rem);
            border: var(--wc-textarea-border, 1px solid rgba(148, 163, 184, 0.65));
            background: var(--wc-textarea-background, rgba(15, 23, 42, 0.04));
            color: inherit;
            font: inherit;
            resize: var(--wc-textarea-resize, vertical);
            box-shadow: var(--wc-textarea-shadow, 0 1px 0 rgba(15, 23, 42, 0.05));
            transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
          }

          textarea[part="textarea"]::placeholder {
            color: var(--wc-textarea-placeholder, rgba(100, 116, 139, 0.9));
            opacity: 1;
          }

          textarea[part="textarea"]:hover:not(:disabled):not(:read-only) {
            background: var(--wc-textarea-background-hover, rgba(15, 23, 42, 0.07));
            border: var(--wc-textarea-border-hover, 1px solid rgba(71, 85, 105, 0.75));
          }

          :host(:focus-within) textarea[part="textarea"] {
            border: var(--wc-textarea-border-focus, 2px solid rgba(79, 70, 229, 0.65));
            box-shadow: var(--wc-textarea-shadow-focus, 0 0 0 4px rgba(79, 70, 229, 0.15));
            background: var(--wc-textarea-background-focus, rgba(255, 255, 255, 0.98));
          }

          :host([disabled]) textarea[part="textarea"] {
            opacity: 0.6;
            cursor: not-allowed;
          }

          textarea[part="textarea"]::-webkit-resizer {
            background: transparent;
          }
        </style>
        <span part="base">
          <textarea part="textarea" rows="4"></textarea>
        </span>
      `;

      this.#textarea = /** @type {HTMLTextAreaElement} */ (this.#root.querySelector('textarea'));

      this.#handleInput = (event) => {
        event.stopPropagation();
        this.#syncValueFromControl();
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      };

      this.#handleChange = (event) => {
        event.stopPropagation();
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      };
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'readonly');
      upgradeProperty(this, 'required');
      upgradeProperty(this, 'name');

      this.#textarea.addEventListener('input', this.#handleInput);
      this.#textarea.addEventListener('change', this.#handleChange);

      if (!this.hasAttribute('rows')) {
        this.#textarea.rows = 4;
      }

      if (!this.#connected) {
        this.#defaultValue = this.value;
        this.#connected = true;
      }

      this.#syncAttributesToControl();

      if (this.hasAttribute('autofocus')) {
        queueMicrotask(() => this.focus());
      }
    }

    disconnectedCallback() {
      this.#textarea.removeEventListener('input', this.#handleInput);
      this.#textarea.removeEventListener('change', this.#handleChange);
    }

    /**
     * @param {ObservedAttribute} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      if (!this.#textarea) {
        return;
      }

      switch (name) {
        case 'value':
          if (this.#reflectingValue) {
            return;
          }
          this.value = newValue ?? '';
          break;
        case 'name':
          this.#textarea.name = newValue ?? '';
          break;
        case 'rows':
          this.#textarea.rows = newValue ? Number.parseInt(newValue, 10) || 4 : 4;
          break;
        case 'cols':
          if (newValue == null) {
            this.#textarea.removeAttribute('cols');
          } else {
            this.#textarea.cols = Number.parseInt(newValue, 10) || this.#textarea.cols;
          }
          break;
        case 'maxlength':
        case 'minlength':
          if (newValue == null) {
            this.#textarea.removeAttribute(name);
          } else {
            this.#textarea.setAttribute(name, newValue);
          }
          break;
        case 'spellcheck':
          if (newValue == null) {
            this.#textarea.removeAttribute('spellcheck');
            this.#textarea.spellcheck = true;
          } else {
            this.#textarea.spellcheck = newValue !== 'false';
          }
          break;
        case 'disabled':
        case 'readonly':
        case 'required':
          this.#textarea.toggleAttribute(name, newValue !== null);
          if (name === 'disabled' && this.#internals) {
            this.#internals.ariaDisabled = newValue !== null ? 'true' : null;
            this.#internals.states?.toggle?.('disabled', newValue !== null);
          }
          break;
        case 'placeholder':
        case 'autocomplete':
        case 'autocapitalize':
        case 'autocorrect':
        case 'inputmode':
        case 'wrap':
          if (newValue == null) {
            this.#textarea.removeAttribute(name);
          } else {
            this.#textarea.setAttribute(name, newValue);
          }
          break;
        case 'aria-label':
        case 'aria-labelledby':
        case 'aria-describedby':
        case 'aria-errormessage':
          if (newValue == null) {
            this.#textarea.removeAttribute(name);
          } else {
            this.#textarea.setAttribute(name, newValue);
          }
          break;
      }
    }

    /**
     * The current value of the textarea.
     */
    get value() {
      if (this.#textarea) {
        return this.#textarea.value;
      }
      return this.getAttribute('value') ?? '';
    }

    set value(value) {
      const stringValue = toStringValue(value);
      if (this.#textarea && this.#textarea.value !== stringValue) {
        this.#textarea.value = stringValue;
      }

      this.toggleAttribute('data-has-value', stringValue.length > 0);
      this.#internals?.setFormValue(stringValue);

      if (!this.#reflectingValue) {
        this.#reflectingValue = true;
        if (stringValue === '') {
          this.removeAttribute('value');
        } else {
          this.setAttribute('value', stringValue);
        }
        this.#reflectingValue = false;
      }
    }

    /**
     * Reflects the disabled state of the control.
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(value) {
      this.toggleAttribute('disabled', Boolean(value));
      if (this.#internals) {
        this.#internals.ariaDisabled = value ? 'true' : null;
        this.#internals.states?.toggle?.('disabled', Boolean(value));
      }
    }

    /**
     * Reflects the read-only state of the control.
     */
    get readonly() {
      return this.hasAttribute('readonly');
    }

    set readonly(value) {
      this.toggleAttribute('readonly', Boolean(value));
    }

    /**
     * Reflects the required state of the control.
     */
    get required() {
      return this.hasAttribute('required');
    }

    set required(value) {
      this.toggleAttribute('required', Boolean(value));
    }

    /**
     * The name used during form submission.
     */
    get name() {
      return this.getAttribute('name') ?? '';
    }

    set name(value) {
      const stringValue = toStringValue(value);
      if (stringValue) {
        this.setAttribute('name', stringValue);
      } else {
        this.removeAttribute('name');
      }
    }

    /**
     * Mirrors the native textarea focus method.
     *
     * @param {FocusOptions} [options]
     */
    focus(options) {
      this.#textarea?.focus(options);
    }

    /** Mirrors the native textarea blur method. */
    blur() {
      this.#textarea?.blur();
    }

    /** @param {string | FormData | null} state */
    formStateRestoreCallback(state) {
      if (typeof state === 'string') {
        this.value = state;
      }
    }

    /** @param {boolean} disabled */
    formDisabledCallback(disabled) {
      this.disabled = disabled;
    }

    formResetCallback() {
      this.value = this.#defaultValue;
    }

    #syncAttributesToControl() {
      for (const attribute of PASSTHROUGH_ATTRIBUTES) {
        if (this.hasAttribute(attribute)) {
          this.#textarea.setAttribute(attribute, this.getAttribute(attribute) ?? '');
        }
      }

      for (const attribute of ARIA_ATTRIBUTES) {
        if (this.hasAttribute(attribute)) {
          this.#textarea.setAttribute(attribute, this.getAttribute(attribute) ?? '');
        }
      }

      this.#textarea.toggleAttribute('disabled', this.disabled);
      this.#textarea.toggleAttribute('readonly', this.readonly);
      this.#textarea.toggleAttribute('required', this.required);
      this.#textarea.name = this.name;

      if (this.hasAttribute('rows')) {
        this.#textarea.rows = Number.parseInt(this.getAttribute('rows') ?? '4', 10) || 4;
      }

      if (this.hasAttribute('cols')) {
        this.#textarea.cols = Number.parseInt(this.getAttribute('cols') ?? '0', 10) || this.#textarea.cols;
      }

      if (this.hasAttribute('maxlength')) {
        this.#textarea.setAttribute('maxlength', this.getAttribute('maxlength') ?? '');
      }

      if (this.hasAttribute('minlength')) {
        this.#textarea.setAttribute('minlength', this.getAttribute('minlength') ?? '');
      }

      if (this.hasAttribute('spellcheck')) {
        this.#textarea.spellcheck = this.getAttribute('spellcheck') !== 'false';
      }

      this.value = this.value;
    }

    #syncValueFromControl() {
      const currentValue = this.#textarea.value;
      this.#reflectingValue = true;
      if (currentValue === '') {
        this.removeAttribute('value');
      } else {
        this.setAttribute('value', currentValue);
      }
      this.#reflectingValue = false;
      this.toggleAttribute('data-has-value', currentValue.length > 0);
      this.#internals?.setFormValue(currentValue);
    }
  }

  if (!customElements.get('wc-textarea')) {
    customElements.define('wc-textarea', WcTextarea);
  }
})();

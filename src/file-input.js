/**
 * @file file-input.js
 * @version 1.0.0
 * @license MIT
 *
 * Accessible, themable file upload control inspired by the daisyUI file input.
 * - Form associated so selected files participate in native submissions.
 * - Supports ghost and solid variants with colour and size modifiers.
 * - Exposes CSS custom properties and parts to customise the rendered control.
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

  /**
   * Normalises the requested colour theme.
   *
   * @param {string | null} value
   * @returns {"neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error"}
   */
  const normaliseColor = (value) => {
    switch ((value ?? '').toLowerCase()) {
      case 'primary':
      case 'secondary':
      case 'accent':
      case 'info':
      case 'success':
      case 'warning':
      case 'error':
        return /** @type {any} */ (value.toLowerCase());
      default:
        return 'neutral';
    }
  };

  /**
   * Normalises the requested size preset.
   *
   * @param {string | null} value
   * @returns {"xs" | "sm" | "md" | "lg" | "xl"}
   */
  const normaliseSize = (value) => {
    switch ((value ?? '').toLowerCase()) {
      case 'xs':
      case 'sm':
      case 'lg':
      case 'xl':
        return /** @type {any} */ (value.toLowerCase());
      default:
        return 'md';
    }
  };

  /**
   * Normalises the variant preset.
   *
   * @param {string | null} value
   * @returns {"solid" | "ghost"}
   */
  const normaliseVariant = (value) => {
    return (value ?? '').toLowerCase() === 'ghost' ? 'ghost' : 'solid';
  };

  /** @type {Set<string>} */
  const BOOLEAN_ATTRIBUTES = new Set(['multiple', 'disabled', 'required']);

  /** @type {Set<string>} */
  const FORWARDED_ATTRIBUTES = new Set([
    'name',
    'accept',
    'placeholder',
    'capture',
    'form',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-invalid'
  ]);

  /**
   * Accessible file input control that mirrors native behaviour while exposing
   * styling hooks and colour variants inspired by daisyUI.
   *
   * @fires change - Re-dispatched when the selected files change.
   * @fires input - Re-dispatched when the user picks files.
   */
  class WcFileInput extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return [
        ...BOOLEAN_ATTRIBUTES,
        ...FORWARDED_ATTRIBUTES,
        'variant',
        'color',
        'size'
      ];
    }

    /** @type {ShadowRoot} */
    #root;

    /** @type {HTMLInputElement} */
    #input;

    /** @type {ElementInternals | undefined} */
    #internals;

    /** @type {(event: Event) => void} */
    #handleChange;

    /** @type {(event: Event) => void} */
    #handleInput;

    /** @type {(event: FocusEvent) => void} */
    #handleFocus;

    /** @type {(event: FocusEvent) => void} */
    #handleBlur;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open', delegatesFocus: true });

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals may be undefined on older DOM lib defs.
        this.#internals = this.attachInternals();
      }

      this.#root.innerHTML = `
        <style>
          :host {
            --wc-file-input-font-family: inherit;
            --wc-file-input-font-size: 0.875rem;
            --wc-file-input-font-weight: 500;
            --wc-file-input-letter-spacing: normal;
            --wc-file-input-line-height: 1.4;
            --wc-file-input-radius: 0.75rem;
            --wc-file-input-height: 2.75rem;
            --wc-file-input-inline-size: clamp(12rem, 50vw, 20rem);
            --wc-file-input-border-width: 1px;
            --wc-file-input-background: rgb(255, 255, 255);
            --wc-file-input-background-hover: rgb(248, 250, 252);
            --wc-file-input-background-disabled: rgba(148, 163, 184, 0.18);
            --wc-file-input-border-color: rgba(148, 163, 184, 0.55);
            --wc-file-input-border-color-hover: rgba(100, 116, 139, 0.75);
            --wc-file-input-border-color-focus: rgba(79, 70, 229, 0.9);
            --wc-file-input-shadow: inset 0 1px rgba(255, 255, 255, 0.75), inset 0 -1px rgba(15, 23, 42, 0.12);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(99, 102, 241, 0.18);
            --wc-file-input-color: rgb(30, 41, 59);
            --wc-file-input-placeholder: rgba(100, 116, 139, 0.75);
            --wc-file-input-disabled-color: rgba(100, 116, 139, 0.7);
            --wc-file-input-button-background: rgba(226, 232, 240, 0.85);
            --wc-file-input-button-background-hover: rgba(203, 213, 225, 0.9);
            --wc-file-input-button-border: rgba(148, 163, 184, 0.55);
            --wc-file-input-button-color: rgb(51, 65, 85);
            --wc-file-input-button-shadow:
              inset 0 1px rgba(255, 255, 255, 0.85),
              0 3px 4px rgba(15, 23, 42, 0.14);
            --wc-file-input-button-radius: calc(var(--wc-file-input-radius) - var(--wc-file-input-border-width));
            --wc-file-input-transition: 160ms ease;
            display: inline-flex;
            vertical-align: middle;
            max-inline-size: 100%;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="container"] {
            display: inline-flex;
            max-inline-size: 100%;
          }

          input[part="input"] {
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            inline-size: var(--wc-file-input-inline-size);
            max-inline-size: 100%;
            block-size: var(--wc-file-input-height);
            padding-inline-end: 0.75rem;
            font-family: var(--wc-file-input-font-family);
            font-size: var(--wc-file-input-font-size);
            font-weight: var(--wc-file-input-font-weight);
            letter-spacing: var(--wc-file-input-letter-spacing);
            line-height: var(--wc-file-input-line-height);
            color: var(--wc-file-input-color);
            background: var(--wc-file-input-background);
            border-radius: var(--wc-file-input-radius);
            border: var(--wc-file-input-border-width) solid var(--wc-file-input-border-color);
            box-shadow: var(--wc-file-input-shadow);
            cursor: pointer;
            transition:
              background-color var(--wc-file-input-transition),
              border-color var(--wc-file-input-transition),
              box-shadow var(--wc-file-input-transition);
          }

          input[part="input"]::-webkit-file-upload-button,
          input[part="input"]::file-selector-button {
            margin: calc(var(--wc-file-input-border-width) * -1);
            margin-inline-end: 0.75rem;
            padding-inline: 1rem;
            padding-block: 0.35rem;
            min-block-size: calc(var(--wc-file-input-height) + var(--wc-file-input-border-width) * 2);
            border-radius: var(--wc-file-input-button-radius);
            border: var(--wc-file-input-border-width) solid var(--wc-file-input-button-border);
            font: inherit;
            font-weight: 600;
            color: var(--wc-file-input-button-color);
            background: var(--wc-file-input-button-background);
            box-shadow: var(--wc-file-input-button-shadow);
            cursor: pointer;
            transition:
              background-color var(--wc-file-input-transition),
              border-color var(--wc-file-input-transition),
              color var(--wc-file-input-transition),
              box-shadow var(--wc-file-input-transition);
          }

          input[part="input"]::-webkit-file-upload-button:hover,
          input[part="input"]::file-selector-button:hover {
            background: var(--wc-file-input-button-background-hover);
          }

          input[part="input"]:hover {
            border-color: var(--wc-file-input-border-color-hover);
            background: var(--wc-file-input-background-hover);
          }

          :host(:focus-within) input[part="input"] {
            border-color: var(--wc-file-input-border-color-focus);
            box-shadow: var(--wc-file-input-shadow-focus);
          }

          input[part="input"]::placeholder {
            color: var(--wc-file-input-placeholder);
          }

          input[part="input"]:disabled,
          :host([data-disabled="true"]) input[part="input"] {
            cursor: not-allowed;
            color: var(--wc-file-input-disabled-color);
            background: var(--wc-file-input-background-disabled);
            border-color: var(--wc-file-input-background-disabled);
            box-shadow: none;
          }

          input[part="input"]:disabled::-webkit-file-upload-button,
          input[part="input"]:disabled::file-selector-button {
            cursor: not-allowed;
            color: var(--wc-file-input-disabled-color);
            background: var(--wc-file-input-background-disabled);
            border-color: transparent;
            box-shadow: none;
          }

          :host([data-variant="ghost"]) input[part="input"] {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
          }

          :host([data-variant="ghost"]) input[part="input"]::-webkit-file-upload-button,
          :host([data-variant="ghost"]) input[part="input"]::file-selector-button {
            margin-inline-start: 0;
            margin-inline-end: 0.75rem;
          }

          :host([data-variant="ghost"]) input[part="input"]:hover {
            background: rgba(255, 255, 255, 0.4);
            border-color: transparent;
          }

          :host([data-variant="ghost"]:focus-within) input[part="input"] {
            background: var(--wc-file-input-background);
            border-color: transparent;
            box-shadow: var(--wc-file-input-shadow-focus);
          }

          :host([data-size="xs"]) input[part="input"] {
            --wc-file-input-height: 1.75rem;
            --wc-file-input-font-size: 0.7rem;
          }

          :host([data-size="sm"]) input[part="input"] {
            --wc-file-input-height: 2.25rem;
            --wc-file-input-font-size: 0.8rem;
          }

          :host([data-size="md"]) input[part="input"] {
            --wc-file-input-height: 2.75rem;
            --wc-file-input-font-size: 0.875rem;
          }

          :host([data-size="lg"]) input[part="input"] {
            --wc-file-input-height: 3.1rem;
            --wc-file-input-font-size: 1rem;
          }

          :host([data-size="xl"]) input[part="input"] {
            --wc-file-input-height: 3.4rem;
            --wc-file-input-font-size: 1.1rem;
            padding-inline-end: 1rem;
          }

          :host([data-color="neutral"]) {
            --wc-file-input-border-color-focus: rgba(71, 85, 105, 0.9);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(71, 85, 105, 0.18);
            --wc-file-input-button-background: rgba(148, 163, 184, 0.22);
            --wc-file-input-button-background-hover: rgba(148, 163, 184, 0.35);
            --wc-file-input-button-border: rgba(71, 85, 105, 0.5);
            --wc-file-input-button-color: rgb(30, 41, 59);
          }

          :host([data-color="primary"]) {
            --wc-file-input-border-color-focus: rgba(79, 70, 229, 0.95);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(99, 102, 241, 0.2);
            --wc-file-input-button-background: rgba(99, 102, 241, 0.22);
            --wc-file-input-button-background-hover: rgba(79, 70, 229, 0.28);
            --wc-file-input-button-border: rgba(79, 70, 229, 0.45);
            --wc-file-input-button-color: rgb(49, 46, 129);
          }

          :host([data-color="secondary"]) {
            --wc-file-input-border-color-focus: rgba(142, 36, 170, 0.9);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(168, 85, 247, 0.18);
            --wc-file-input-button-background: rgba(192, 132, 252, 0.26);
            --wc-file-input-button-background-hover: rgba(167, 139, 250, 0.32);
            --wc-file-input-button-border: rgba(142, 36, 170, 0.35);
            --wc-file-input-button-color: rgb(91, 33, 182);
          }

          :host([data-color="accent"]) {
            --wc-file-input-border-color-focus: rgba(217, 70, 239, 0.85);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(244, 114, 182, 0.2);
            --wc-file-input-button-background: rgba(236, 72, 153, 0.22);
            --wc-file-input-button-background-hover: rgba(219, 39, 119, 0.28);
            --wc-file-input-button-border: rgba(219, 39, 119, 0.35);
            --wc-file-input-button-color: rgb(131, 24, 67);
          }

          :host([data-color="info"]) {
            --wc-file-input-border-color-focus: rgba(59, 130, 246, 0.9);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(59, 130, 246, 0.18);
            --wc-file-input-button-background: rgba(147, 197, 253, 0.28);
            --wc-file-input-button-background-hover: rgba(96, 165, 250, 0.34);
            --wc-file-input-button-border: rgba(37, 99, 235, 0.45);
            --wc-file-input-button-color: rgb(30, 64, 175);
          }

          :host([data-color="success"]) {
            --wc-file-input-border-color-focus: rgba(22, 163, 74, 0.85);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(74, 222, 128, 0.22);
            --wc-file-input-button-background: rgba(134, 239, 172, 0.26);
            --wc-file-input-button-background-hover: rgba(74, 222, 128, 0.32);
            --wc-file-input-button-border: rgba(22, 163, 74, 0.45);
            --wc-file-input-button-color: rgb(22, 101, 52);
          }

          :host([data-color="warning"]) {
            --wc-file-input-border-color-focus: rgba(217, 119, 6, 0.9);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(251, 191, 36, 0.25);
            --wc-file-input-button-background: rgba(253, 224, 71, 0.26);
            --wc-file-input-button-background-hover: rgba(250, 204, 21, 0.34);
            --wc-file-input-button-border: rgba(217, 119, 6, 0.4);
            --wc-file-input-button-color: rgb(120, 53, 15);
          }

          :host([data-color="error"]) {
            --wc-file-input-border-color-focus: rgba(220, 38, 38, 0.9);
            --wc-file-input-shadow-focus: 0 0 0 4px rgba(248, 113, 113, 0.24);
            --wc-file-input-button-background: rgba(248, 113, 113, 0.26);
            --wc-file-input-button-background-hover: rgba(239, 68, 68, 0.32);
            --wc-file-input-button-border: rgba(185, 28, 28, 0.45);
            --wc-file-input-button-color: rgb(153, 27, 27);
          }

          :host([data-has-files="true"]) input[part="input"] {
            border-color: var(--wc-file-input-border-color-focus);
          }
        </style>
        <label part="container">
          <input part="input" type="file" />
        </label>
      `;

      this.#input = /** @type {HTMLInputElement} */ (this.#root.querySelector('input'));

      this.#handleChange = (event) => {
        event.stopPropagation();
        this.#syncFormValue();
        this.#updateFileState();
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      };

      this.#handleInput = (event) => {
        event.stopPropagation();
        this.#syncFormValue();
        this.#updateFileState();
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      };

      this.#handleFocus = () => {
        this.dispatchEvent(new FocusEvent('focus', { bubbles: false, composed: true }));
      };

      this.#handleBlur = () => {
        this.dispatchEvent(new FocusEvent('blur', { bubbles: false, composed: true }));
      };

      this.#input.addEventListener('change', this.#handleChange);
      this.#input.addEventListener('input', this.#handleInput);
      this.#input.addEventListener('focus', this.#handleFocus);
      this.#input.addEventListener('blur', this.#handleBlur);
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'name');
      upgradeProperty(this, 'accept');
      upgradeProperty(this, 'multiple');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'required');
      upgradeProperty(this, 'variant');
      upgradeProperty(this, 'color');
      upgradeProperty(this, 'size');

      this.#syncBooleanAttributes();
      this.#syncForwardedAttributes();
      this.#syncVariant();
      this.#syncColor();
      this.#syncSize();
      this.#syncFormValue();
      this.#updateFileState();
    }

    disconnectedCallback() {
      this.#input.removeEventListener('change', this.#handleChange);
      this.#input.removeEventListener('input', this.#handleInput);
      this.#input.removeEventListener('focus', this.#handleFocus);
      this.#input.removeEventListener('blur', this.#handleBlur);
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      if (!this.isConnected) {
        return;
      }

      if (BOOLEAN_ATTRIBUTES.has(name)) {
        this.#reflectBooleanAttribute(name, newValue !== null);
        if (name === 'disabled') {
          this.toggleAttribute('data-disabled', newValue !== null);
        }
        return;
      }

      if (FORWARDED_ATTRIBUTES.has(name)) {
        this.#reflectStringAttribute(name, newValue);
        return;
      }

      switch (name) {
        case 'variant':
          this.#syncVariant();
          break;
        case 'color':
          this.#syncColor();
          break;
        case 'size':
          this.#syncSize();
          break;
      }
    }

    /**
     * Currently selected files.
     *
     * @returns {FileList | null}
     */
    get files() {
      return this.#input.files;
    }

    /**
     * Native file input value (read-only except for clearing).
     */
    get value() {
      return this.#input.value;
    }

    set value(value) {
      if (value === '' || value === null || value === undefined) {
        this.#input.value = '';
        this.#syncFormValue();
        this.#updateFileState();
      }
    }

    get name() {
      return this.getAttribute('name') ?? '';
    }

    set name(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('name');
      } else {
        this.setAttribute('name', String(value));
      }
    }

    get accept() {
      return this.getAttribute('accept') ?? '';
    }

    set accept(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('accept');
      } else {
        this.setAttribute('accept', String(value));
      }
    }

    get capture() {
      return this.getAttribute('capture');
    }

    set capture(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('capture');
      } else {
        this.setAttribute('capture', String(value));
      }
    }

    get multiple() {
      return this.hasAttribute('multiple');
    }

    set multiple(value) {
      if (value) {
        this.setAttribute('multiple', '');
      } else {
        this.removeAttribute('multiple');
      }
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get required() {
      return this.hasAttribute('required');
    }

    set required(value) {
      if (value) {
        this.setAttribute('required', '');
      } else {
        this.removeAttribute('required');
      }
    }

    get variant() {
      return normaliseVariant(this.getAttribute('variant'));
    }

    set variant(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('variant');
      } else {
        this.setAttribute('variant', String(value));
      }
    }

    get color() {
      return normaliseColor(this.getAttribute('color'));
    }

    set color(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('color');
      } else {
        this.setAttribute('color', String(value));
      }
    }

    get size() {
      return normaliseSize(this.getAttribute('size'));
    }

    set size(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('size');
      } else {
        this.setAttribute('size', String(value));
      }
    }

    /**
     * Programmatically click the internal control.
     */
    click() {
      this.#input.click();
    }

    /**
     * Focuses the internal input.
     *
     * @param {FocusOptions} [options]
     */
    focus(options) {
      this.#input.focus(options);
    }

    blur() {
      this.#input.blur();
    }

    /**
     * Clears the currently selected files.
     */
    clear() {
      this.value = '';
    }

    /**
     * Mirrors the constraint validation API of native controls.
     */
    checkValidity() {
      return this.#input.checkValidity();
    }

    reportValidity() {
      return this.#input.reportValidity();
    }

    setCustomValidity(message) {
      if (this.#internals) {
        this.#internals.setValidity(message ? { customError: true } : {}, message, this.#input);
      } else {
        this.#input.setCustomValidity(message);
      }
    }

    formAssociatedCallback(form) {
      if (this.#internals) {
        this.#internals.form = form;
      }
    }

    formDisabledCallback(disabled) {
      this.disabled = disabled;
    }

    formResetCallback() {
      this.clear();
    }

    formStateRestoreCallback(_state, _mode) {
      // File inputs intentionally do not restore state for security reasons.
      this.clear();
    }

    /** Reflects boolean attributes to the internal control. */
    #syncBooleanAttributes() {
      BOOLEAN_ATTRIBUTES.forEach((attribute) => {
        this.#reflectBooleanAttribute(attribute, this.hasAttribute(attribute));
        if (attribute === 'disabled') {
          this.toggleAttribute('data-disabled', this.hasAttribute(attribute));
        }
      });
    }

    /** Reflects passthrough attributes to the internal control. */
    #syncForwardedAttributes() {
      FORWARDED_ATTRIBUTES.forEach((attribute) => {
        this.#reflectStringAttribute(attribute, this.getAttribute(attribute));
      });
    }

    /** Updates the variant dataset for styling. */
    #syncVariant() {
      const variant = normaliseVariant(this.getAttribute('variant'));
      this.setAttribute('data-variant', variant);
    }

    /** Updates the colour dataset for styling. */
    #syncColor() {
      const colour = normaliseColor(this.getAttribute('color'));
      this.setAttribute('data-color', colour);
    }

    /** Updates the size dataset for styling. */
    #syncSize() {
      const size = normaliseSize(this.getAttribute('size'));
      this.setAttribute('data-size', size);
    }

    /**
     * Reflects a boolean attribute to the internal input element.
     *
     * @param {string} name
     * @param {boolean} value
     */
    #reflectBooleanAttribute(name, value) {
      if (value) {
        this.#input.setAttribute(name, '');
      } else {
        this.#input.removeAttribute(name);
      }
    }

    /**
     * Reflects a string attribute to the internal input element.
     *
     * @param {string} name
     * @param {string | null} value
     */
    #reflectStringAttribute(name, value) {
      if (value === null || value === undefined) {
        this.#input.removeAttribute(name);
      } else {
        this.#input.setAttribute(name, value);
      }
    }

    /** Syncs the form value with the currently selected files. */
    #syncFormValue() {
      if (!this.#internals) {
        return;
      }

      const files = this.#input.files;
      if (files && files.length > 0) {
        this.#internals.setFormValue(files);
      } else {
        this.#internals.setFormValue(null);
      }
    }

    /** Updates dataset flags related to the selected files. */
    #updateFileState() {
      const hasFiles = !!(this.#input.files && this.#input.files.length > 0);
      this.toggleAttribute('data-has-files', hasFiles);
    }
  }

  if (!customElements.get('wc-file-input')) {
    customElements.define('wc-file-input', WcFileInput);
  }
})();

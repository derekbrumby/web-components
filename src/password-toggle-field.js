/**
 * @file password-toggle-field.js
 * @version 1.0.0
 * @license MIT
 *
 * A password input with a built-in visibility toggle inspired by Radix UI.
 * - Form-associated so the value participates in native submissions.
 * - Pointer toggles return focus to the input for rapid re-entry.
 * - Keyboard toggles keep focus on the button to respect navigation intent.
 * - Visibility resets to hidden once the parent form submits to avoid storing plaintext passwords.
 * - Accessible by default with ARIA labelling and customisable CSS parts and properties.
 */

(() => {
  /** @type {boolean} */
  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  const DEFAULT_SHOW_LABEL = 'Show password';
  const DEFAULT_HIDE_LABEL = 'Hide password';

  const ICON_HIDDEN =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5C7 5 2.73 8.11 1 12c.48 1.1 1.19 2.1 2.08 2.96l-1.42 1.42 1.41 1.41 1.52-1.52c1.99 1.38 4.36 2.23 7.41 2.23 5 0 9.27-3.11 11-7-1-2.3-2.64-4.26-4.74-5.58l1.54-1.54-1.41-1.41-1.88 1.88C14.29 5.29 13.17 5 12 5Zm0 2c3.32 0 6.43 1.88 8.15 5-.83 1.43-2.08 2.62-3.54 3.45L15 13.83A4 4 0 0 0 10.17 9l-2-2C9.12 6.67 10.52 7 12 7Zm-6.15 1.45L8.59 11.2c-.06.26-.09.52-.09.8a4 4 0 0 0 4 4c.28 0 .54-.03.8-.09l1.75 1.75c-.66.2-1.35.31-2.05.31-3.32 0-6.43-1.88-8.15-5a9.83 9.83 0 0 1 1.6-2.52ZM12 11c.56 0 1 .44 1 1 0 .13-.02.26-.06.37l-1.31-1.31c.11-.04.23-.06.37-.06Zm-3 1c0-.34.07-.66.19-.95l3.76 3.76c-.3.12-.61.19-.95.19a2 2 0 0 1-2-2Z"/></svg>';

  const ICON_VISIBLE =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5Zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3Z"/></svg>';

  /**
   * Password input with a reveal toggle that mirrors Radix UI behaviour.
   *
   * @fires visibilitychange - Emitted whenever the reveal state toggles.
   */
  class WcPasswordToggleField extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return [
        'value',
        'placeholder',
        'name',
        'autocomplete',
        'autofocus',
        'disabled',
        'required',
        'minlength',
        'maxlength',
        'pattern',
        'inputmode',
        'label',
        'show-label',
        'hide-label',
        'visible',
        'default-visible'
      ];
    }

    /** @type {ShadowRoot} */
    #root;

    /** @type {HTMLInputElement} */
    #input;

    /** @type {HTMLButtonElement} */
    #toggle;

    /** @type {HTMLElement} */
    #hiddenIcon;

    /** @type {HTMLElement} */
    #visibleIcon;

    /** @type {HTMLElement} */
    #assistiveText;

    /** @type {ElementInternals|undefined} */
    #internals;

    /** @type {HTMLFormElement|null} */
    #form = null;

    /** @type {boolean} */
    #visible = false;

    /** @type {boolean} */
    #pointerToggle = false;

    /** @type {boolean} */
    #reflectingVisible = false;

    /** @type {string} */
    #showLabel = DEFAULT_SHOW_LABEL;

    /** @type {string} */
    #hideLabel = DEFAULT_HIDE_LABEL;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals not declared in older lib versions.
        this.#internals = this.attachInternals();
      }

      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            font: 400 15px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: inherit;
            --wc-password-field-height: 2.25rem;
            --wc-password-field-radius: 0.5rem;
            --wc-password-field-background: rgba(15, 23, 42, 0.04);
            --wc-password-field-border: 1px solid rgba(148, 163, 184, 0.65);
            --wc-password-field-border-hover: 1px solid rgba(51, 65, 85, 0.75);
            --wc-password-field-border-focus: 2px solid rgba(79, 70, 229, 0.7);
            --wc-password-field-shadow-focus: 0 0 0 4px rgba(79, 70, 229, 0.15);
            --wc-password-field-toggle-size: 1.5rem;
            --wc-password-field-gap: 0.5rem;
            --wc-password-field-color: inherit;
            --wc-password-field-placeholder: rgba(100, 116, 139, 0.9);
            --wc-password-field-toggle-color: rgba(51, 65, 85, 0.95);
            --wc-password-field-toggle-color-active: rgba(79, 70, 229, 1);
            --wc-password-field-toggle-background: transparent;
            --wc-password-field-toggle-background-hover: rgba(79, 70, 229, 0.12);
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="wrapper"] {
            display: inline-flex;
            align-items: center;
            gap: var(--wc-password-field-gap);
            background: var(--wc-password-field-background);
            border-radius: var(--wc-password-field-radius);
            border: var(--wc-password-field-border);
            padding-inline: 0.75rem;
            height: var(--wc-password-field-height);
            transition: border-color 160ms ease, box-shadow 160ms ease;
          }

          :host(:where(:hover, [data-visible="true"])) [part="wrapper"] {
            border: var(--wc-password-field-border-hover);
          }

          :host(:focus-within) [part="wrapper"] {
            border: var(--wc-password-field-border-focus);
            box-shadow: var(--wc-password-field-shadow-focus);
          }

          input[part="input"] {
            all: unset;
            box-sizing: border-box;
            flex: 1 1 auto;
            min-width: 0;
            height: calc(var(--wc-password-field-height) - 1px);
            font: inherit;
            color: var(--wc-password-field-color);
          }

          input[part="input"]::placeholder {
            color: var(--wc-password-field-placeholder);
          }

          button[part="toggle"] {
            all: unset;
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: var(--wc-password-field-toggle-size);
            height: var(--wc-password-field-toggle-size);
            border-radius: 0.375rem;
            color: var(--wc-password-field-toggle-color);
            background: var(--wc-password-field-toggle-background);
            cursor: pointer;
            transition: background-color 160ms ease, color 160ms ease;
          }

          button[part="toggle"]:hover,
          button[part="toggle"]:focus-visible {
            background: var(--wc-password-field-toggle-background-hover);
            color: var(--wc-password-field-toggle-color-active);
          }

          button[part="toggle"]:focus-visible {
            outline: 2px solid rgba(79, 70, 229, 0.6);
            outline-offset: 2px;
          }

          button[part="toggle"] svg {
            display: block;
            width: 100%;
            height: 100%;
            fill: currentColor;
          }

          .visually-hidden {
            position: absolute !important;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }

          :host([data-disabled="true"]) {
            opacity: 0.6;
            pointer-events: none;
          }
        </style>
        <div part="wrapper" data-visible="false">
          <input
            part="input"
            type="password"
            autocomplete="current-password"
          />
          <button part="toggle" type="button" aria-pressed="false"></button>
        </div>
      `;

      this.#input = /** @type {HTMLInputElement} */ (this.#root.querySelector('input[part="input"]'));
      this.#toggle = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button[part="toggle"]'));

      const hiddenIcon = document.createElement('span');
      hiddenIcon.setAttribute('part', 'icon');
      hiddenIcon.dataset.visibility = 'hidden';
      hiddenIcon.innerHTML = ICON_HIDDEN;

      const visibleIcon = document.createElement('span');
      visibleIcon.setAttribute('part', 'icon');
      visibleIcon.dataset.visibility = 'visible';
      visibleIcon.innerHTML = ICON_VISIBLE;
      visibleIcon.hidden = true;

      const assistiveText = document.createElement('span');
      assistiveText.setAttribute('part', 'assistive-text');
      assistiveText.className = 'visually-hidden';

      this.#toggle.append(hiddenIcon, visibleIcon, assistiveText);

      this.#hiddenIcon = hiddenIcon;
      this.#visibleIcon = visibleIcon;
      this.#assistiveText = assistiveText;

      this.#toggle.addEventListener('pointerdown', () => {
        this.#pointerToggle = true;
      });

      this.#toggle.addEventListener('click', (event) => {
        event.preventDefault();
        if (this.disabled) {
          this.#pointerToggle = false;
          return;
        }
        this.visible = !this.visible;
        const targetFocus = this.#pointerToggle ? this.#input : this.#toggle;
        targetFocus.focus({ preventScroll: true });
        this.#pointerToggle = false;
      });

      this.#input.addEventListener('input', () => {
        this.#syncValue();
      });

      this.#input.addEventListener('change', () => {
        this.#syncValue();
      });
    }

    connectedCallback() {
      this.#upgradeProperty('value');
      this.#upgradeProperty('visible');

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }

      if (this.hasAttribute('label')) {
        this.#input.setAttribute('aria-label', this.getAttribute('label') || '');
      }

      const defaultVisible = this.hasAttribute('visible')
        ? true
        : this.hasAttribute('default-visible');

      this.#visible = defaultVisible;
      this.#applyVisibility();
      this.#reflectVisibility();
      this.#syncValue();
      this.#updateToggleLabels();

      if (!supportsFormAssociated) {
        this.#attachFormListeners(this.closest('form'));
      }
    }

    disconnectedCallback() {
      this.#detachFormListeners();
    }

    /**
     * Ensures property values set before upgrade are respected.
     * @param {string} prop
     */
    #upgradeProperty(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        // @ts-ignore - indexing
        const value = this[prop];
        delete this[prop];
        // @ts-ignore - indexing
        this[prop] = value;
      }
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'value':
          if (this.value !== this.#input.value) {
            this.#input.value = newValue ?? '';
            this.#syncValue();
          }
          break;
        case 'placeholder':
          this.#input.placeholder = newValue ?? '';
          break;
        case 'name':
          if (newValue == null) {
            this.#input.removeAttribute('name');
          } else {
            this.#input.name = newValue;
          }
          break;
        case 'autocomplete':
          if (newValue == null) {
            this.#input.removeAttribute('autocomplete');
          } else {
            this.#input.autocomplete = newValue;
          }
          break;
        case 'autofocus':
          if (newValue == null) {
            this.#input.removeAttribute('autofocus');
          } else {
            this.#input.autofocus = true;
          }
          break;
        case 'disabled':
          this.#setDisabled(newValue !== null);
          break;
        case 'required':
          this.#input.required = newValue !== null;
          break;
        case 'minlength':
          this.#reflectNumberAttribute(this.#input, 'minlength', newValue);
          break;
        case 'maxlength':
          this.#reflectNumberAttribute(this.#input, 'maxlength', newValue);
          break;
        case 'pattern':
          this.#reflectStringAttribute(this.#input, 'pattern', newValue);
          break;
        case 'inputmode':
          this.#reflectStringAttribute(this.#input, 'inputmode', newValue);
          break;
        case 'label':
          if (newValue == null) {
            this.#input.removeAttribute('aria-label');
          } else {
            this.#input.setAttribute('aria-label', newValue);
          }
          break;
        case 'show-label':
          this.#showLabel = newValue && newValue.trim().length > 0 ? newValue : DEFAULT_SHOW_LABEL;
          this.#updateToggleLabels();
          break;
        case 'hide-label':
          this.#hideLabel = newValue && newValue.trim().length > 0 ? newValue : DEFAULT_HIDE_LABEL;
          this.#updateToggleLabels();
          break;
        case 'visible':
          if (this.#reflectingVisible) {
            return;
          }
          this.visible = newValue !== null;
          break;
        case 'default-visible':
          if (!this.hasAttribute('visible')) {
            this.visible = newValue !== null;
          }
          break;
      }
    }

    /**
     * @param {HTMLInputElement} input
     * @param {keyof HTMLInputElement} attr
     * @param {string|null} value
     */
    #reflectStringAttribute(input, attr, value) {
      if (value == null) {
        input.removeAttribute(attr);
      } else {
        input.setAttribute(attr, value);
      }
    }

    /**
     * @param {HTMLInputElement} input
     * @param {keyof HTMLInputElement} attr
     * @param {string|null} value
     */
    #reflectNumberAttribute(input, attr, value) {
      if (value == null || value === '') {
        input.removeAttribute(attr);
      } else {
        input.setAttribute(attr, value);
      }
    }

    /**
     * Keeps ElementInternals value in sync.
     */
    #syncValue() {
      if (this.hasAttribute('value') && this.getAttribute('value') !== this.#input.value) {
        this.setAttribute('value', this.#input.value);
      }

      if (this.disabled) {
        this.#internals?.setFormValue(null);
      } else {
        this.#internals?.setFormValue(this.#input.value);
      }
    }

    /**
     * Updates button labels and icons based on current visibility.
     */
    #applyVisibility() {
      const wrapper = /** @type {HTMLElement} */ (this.#root.querySelector('[part="wrapper"]'));
      if (!wrapper) return;

      wrapper.dataset.visible = String(this.#visible);
      this.setAttribute('data-visible', this.#visible ? 'true' : 'false');
      this.#input.type = this.#visible ? 'text' : 'password';
      this.#toggle.setAttribute('aria-pressed', String(this.#visible));
      this.#toggle.dataset.visible = String(this.#visible);
      this.#hiddenIcon.hidden = this.#visible;
      this.#visibleIcon.hidden = !this.#visible;
      this.#assistiveText.textContent = this.#visible ? this.#hideLabel : this.#showLabel;
      this.#toggle.setAttribute('aria-label', this.#assistiveText.textContent || '');
    }

    #reflectVisibility() {
      this.#reflectingVisible = true;
      this.toggleAttribute('visible', this.#visible);
      this.#reflectingVisible = false;
    }

    #updateToggleLabels() {
      this.#assistiveText.textContent = this.#visible ? this.#hideLabel : this.#showLabel;
      this.#toggle.setAttribute('aria-label', this.#assistiveText.textContent || '');
    }

    /**
     * @param {boolean} disabled
     */
    #setDisabled(disabled) {
      this.#input.disabled = disabled;
      this.#toggle.disabled = disabled;
      this.toggleAttribute('data-disabled', disabled);
      if (disabled) {
        this.#internals?.setFormValue(null);
      } else {
        this.#internals?.setFormValue(this.#input.value);
      }
    }

    #handleFormData = () => {
      if (this.visible) {
        this.visible = false;
      }
    };

    #handleFormSubmit = () => {
      if (this.visible) {
        this.visible = false;
      }
    };

    #attachFormListeners(form) {
      this.#detachFormListeners();
      if (!form) return;
      this.#form = form;
      form.addEventListener('formdata', this.#handleFormData);
      form.addEventListener('submit', this.#handleFormSubmit);
    }

    #detachFormListeners() {
      if (!this.#form) return;
      this.#form.removeEventListener('formdata', this.#handleFormData);
      this.#form.removeEventListener('submit', this.#handleFormSubmit);
      this.#form = null;
    }

    /**
     * Dispatches a visibilitychange event.
     */
    #emitVisibilityChange() {
      this.dispatchEvent(
        new CustomEvent('visibilitychange', {
          bubbles: true,
          composed: true,
          detail: { visible: this.#visible }
        })
      );
    }

    // Public API

    /** @returns {string} */
    get value() {
      return this.#input?.value ?? '';
    }

    /**
     * @param {string} next
     */
    set value(next) {
      if (typeof next !== 'string') {
        next = String(next ?? '');
      }
      if (this.#input.value === next) {
        this.#syncValue();
        return;
      }
      this.#input.value = next;
      this.#syncValue();
    }

    /** @returns {boolean} */
    get visible() {
      return this.#visible;
    }

    /**
     * @param {boolean} value
     */
    set visible(value) {
      const next = Boolean(value);
      if (this.#visible === next) {
        this.#reflectVisibility();
        this.#applyVisibility();
        return;
      }
      this.#visible = next;
      this.#reflectVisibility();
      this.#applyVisibility();
      this.#emitVisibilityChange();
    }

    /** @returns {boolean} */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     * @param {boolean} state
     */
    set disabled(state) {
      this.toggleAttribute('disabled', Boolean(state));
    }

    /**
     * Moves focus to the internal input.
     * @param {FocusOptions} [options]
     */
    focus(options) {
      this.#input?.focus(options);
    }

    /** Removes focus from the internal input. */
    blur() {
      this.#input?.blur();
    }

    /** Highlights the entire password text. */
    select() {
      this.#input?.select();
    }

    formAssociatedCallback(form) {
      this.#attachFormListeners(form);
    }

    formDisabledCallback(disabled) {
      this.#setDisabled(disabled);
    }

    formResetCallback() {
      const defaultValue = this.getAttribute('value') ?? '';
      this.value = defaultValue;
      if (this.hasAttribute('default-visible')) {
        this.visible = true;
      } else {
        this.visible = false;
      }
    }

    formStateRestoreCallback(state) {
      if (typeof state === 'string') {
        this.value = state;
      }
    }
  }

  if (!customElements.get('wc-password-toggle-field')) {
    customElements.define('wc-password-toggle-field', WcPasswordToggleField);
  }
})();

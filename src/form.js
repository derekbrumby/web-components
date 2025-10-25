/**
 * @file form.js
 * @version 0.1.0
 *
 * A self-contained contact form component modelled after the Radix UI Form demo.
 * Features accessible validation messaging, native constraint validation support,
 * and hooks for custom/server-side errors without external dependencies.
 */

(() => {
  if (customElements.get('wc-form')) {
    return;
  }

  /**
   * Upgrades a pre-defined property to work with getters/setters once the element is defined.
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

  let instanceCount = 0;

  /**
   * @typedef {"valueMissing"|"typeMismatch"|"patternMismatch"|"tooLong"|"tooShort"|"rangeUnderflow"|"rangeOverflow"|"stepMismatch"|"badInput"|"customError"} ValidityKey
   */

  /**
   * @typedef {HTMLElement & { dataset: { name?: string } }} FieldElement
   */

  /**
   * @typedef {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} FormControl
   */

  class WcForm extends HTMLElement {
    static get observedAttributes() {
      return ['submit-label'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLFormElement} */
    #form;
    /** @type {Map<string, FieldElement>} */
    #fields = new Map();
    /** @type {HTMLButtonElement} */
    #submitButton;
    /** @type {Map<string, string>} */
    #customErrors = new Map();

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      instanceCount += 1;
      const emailId = `wc-form-email-${instanceCount}`;
      const questionId = `wc-form-question-${instanceCount}`;
      const emailMessagesId = `wc-form-email-messages-${instanceCount}`;
      const questionMessagesId = `wc-form-question-messages-${instanceCount}`;

      this.#root.innerHTML = `
        <style>
          :host {
            --wc-form-background: rgba(15, 23, 42, 0.94);
            --wc-form-foreground: #ffffff;
            --wc-form-muted: rgba(255, 255, 255, 0.72);
            --wc-form-border: 1px solid rgba(255, 255, 255, 0.18);
            --wc-form-radius: 1.5rem;
            --wc-form-field-radius: 0.75rem;
            --wc-form-field-background: rgba(15, 23, 42, 0.65);
            --wc-form-field-border: 1px solid rgba(255, 255, 255, 0.15);
            --wc-form-field-border-hover: 1px solid rgba(255, 255, 255, 0.25);
            --wc-form-field-border-focus: 2px solid rgba(255, 255, 255, 0.45);
            --wc-form-shadow: 0 32px 64px -40px rgba(15, 23, 42, 0.65);
            --wc-form-input-padding: 0.75rem 0.875rem;
            --wc-form-font-size: 15px;
            --wc-form-label-weight: 600;
            --wc-form-gap: 1.25rem;
            --wc-form-message-size: 13px;
            --wc-form-submit-background: #ffffff;
            --wc-form-submit-color: #312e81;
            --wc-form-submit-hover: #e0e7ff;
            --wc-form-transition: 160ms cubic-bezier(0.33, 1, 0.68, 1);
            --wc-form-message-error: #fef3c7;
            --wc-form-message-error-color: #f59e0b;
            display: block;
            color: var(--wc-form-foreground);
          }

          [part="container"] {
            background: var(--wc-form-background);
            border-radius: var(--wc-form-radius);
            border: var(--wc-form-border);
            box-shadow: var(--wc-form-shadow);
            padding: 1.75rem;
            display: grid;
            gap: var(--wc-form-gap);
          }

          header[part="header"] h2 {
            margin: 0;
            font-size: clamp(1.5rem, 2.8vw, 1.75rem);
            font-weight: 700;
          }

          header[part="header"] p {
            margin: 0.35rem 0 0;
            color: var(--wc-form-muted);
            line-height: 1.6;
            font-size: 0.95rem;
          }

          form[part="form"] {
            display: grid;
            gap: 1rem;
          }

          fieldset[part="field"] {
            margin: 0;
            padding: 0;
            border: 0;
            display: grid;
            gap: 0.35rem;
          }

          fieldset[part="field"] legend {
            margin: 0;
            padding: 0;
            display: contents;
          }

          .label-row {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 0.75rem;
          }

          label[part="label"] {
            font-size: var(--wc-form-font-size);
            font-weight: var(--wc-form-label-weight);
            line-height: 2.25rem;
            color: var(--wc-form-foreground);
          }

          [part="messages"] {
            display: grid;
            gap: 0.25rem;
            justify-items: end;
          }

          [part="message"] {
            font-size: var(--wc-form-message-size);
            color: var(--wc-form-muted);
            opacity: 0.85;
            transition: opacity var(--wc-form-transition);
          }

          [part="message"][data-visible="false"] {
            opacity: 0;
            height: 0;
            overflow: hidden;
          }

          [part="control"] {
            font: inherit;
            font-size: var(--wc-form-font-size);
            color: var(--wc-form-foreground);
            background: var(--wc-form-field-background);
            border: var(--wc-form-field-border);
            border-radius: var(--wc-form-field-radius);
            padding: var(--wc-form-input-padding);
            line-height: 1.5;
            resize: none;
            transition: border-color var(--wc-form-transition), box-shadow var(--wc-form-transition);
            min-height: 35px;
          }

          [part="control"]:hover {
            border: var(--wc-form-field-border-hover);
          }

          [part="control"]:focus-visible {
            outline: none;
            border: var(--wc-form-field-border-focus);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.35);
          }

          [part="control"]::placeholder {
            color: rgba(255, 255, 255, 0.45);
          }

          fieldset[part="field"][data-invalid] [part="label"] {
            color: var(--wc-form-message-error-color);
          }

          fieldset[part="field"][data-invalid] [part="control"] {
            border: 1px solid rgba(245, 158, 11, 0.65);
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.18);
          }

          fieldset[part="field"][data-invalid] [part="messages"] {
            justify-items: start;
          }

          fieldset[part="field"][data-invalid] [part="message"][data-visible="true"] {
            color: var(--wc-form-message-error-color);
            background: var(--wc-form-message-error);
            padding: 0.25rem 0.5rem;
            border-radius: 999px;
          }

          button[part="submit"] {
            border: none;
            border-radius: 999px;
            background: var(--wc-form-submit-background);
            color: var(--wc-form-submit-color);
            font-weight: 600;
            padding: 0.75rem 1.25rem;
            cursor: pointer;
            transition: transform var(--wc-form-transition), box-shadow var(--wc-form-transition), background var(--wc-form-transition);
          }

          button[part="submit"]:hover {
            transform: translateY(-1px);
            box-shadow: 0 16px 32px -22px rgba(255, 255, 255, 0.55);
            background: var(--wc-form-submit-hover);
          }

          button[part="submit"]:active {
            transform: translateY(1px);
          }
        </style>
        <div part="container">
          <header part="header">
            <h2 part="title">Form</h2>
            <p part="description">Collect information from your users using validation rules.</p>
          </header>
          <form part="form" novalidate>
            <fieldset part="field" data-field data-name="email">
              <legend>Email</legend>
              <div class="label-row">
                <label part="label" for="${emailId}">Email</label>
                <div part="messages" id="${emailMessagesId}" aria-live="polite" aria-atomic="true">
                  <p part="message" data-message data-match="valueMissing" data-visible="false" role="alert">Please enter your email</p>
                  <p part="message" data-message data-match="typeMismatch" data-visible="false" role="alert">Please provide a valid email</p>
                  <p part="message" data-message data-match="customError" data-visible="false" role="alert"></p>
                </div>
              </div>
              <input
                id="${emailId}"
                part="control"
                data-control
                type="email"
                name="email"
                autocomplete="email"
                aria-describedby="${emailMessagesId}"
                required
              />
            </fieldset>
            <fieldset part="field" data-field data-name="question">
              <legend>Question</legend>
              <div class="label-row">
                <label part="label" for="${questionId}">Question</label>
                <div part="messages" id="${questionMessagesId}" aria-live="polite" aria-atomic="true">
                  <p part="message" data-message data-match="valueMissing" data-visible="false" role="alert">Please enter a question</p>
                  <p part="message" data-message data-match="customError" data-visible="false" role="alert"></p>
                </div>
              </div>
              <textarea
                id="${questionId}"
                part="control"
                data-control
                name="question"
                rows="4"
                aria-describedby="${questionMessagesId}"
                required
              ></textarea>
            </fieldset>
            <button part="submit" type="submit"></button>
          </form>
        </div>
      `;

      this.#form = /** @type {HTMLFormElement} */ (this.#root.querySelector('form'));
      this.#submitButton = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector('button[part="submit"]')
      );
      this.#submitButton.textContent = this.submitLabel;

      this.#form
        .querySelectorAll('[data-field]')
        .forEach((field) => {
          const name = /** @type {HTMLElement} */ (field).dataset.name;
          if (name) {
            this.#fields.set(name, /** @type {FieldElement} */ (field));
          }
        });
    }

    connectedCallback() {
      upgradeProperty(this, 'submitLabel');
      this.#attachListeners();
      this.#fields.forEach((field) => this.#refreshField(field));
    }

    disconnectedCallback() {
      this.#detachListeners();
    }

    attributeChangedCallback(name) {
      if (name === 'submit-label') {
        this.#submitButton.textContent = this.submitLabel;
      }
    }

    /**
     * The label displayed on the submit button.
     * @returns {string}
     */
    get submitLabel() {
      return this.getAttribute('submit-label') || 'Post question';
    }

    /**
     * @param {string} value
     */
    set submitLabel(value) {
      if (value == null) {
        this.removeAttribute('submit-label');
      } else {
        this.setAttribute('submit-label', String(value));
      }
    }

    /**
     * Programmatically resets the form, clearing messages and custom errors.
     */
    reset() {
      this.#form.reset();
      this.#customErrors.clear();
      this.#fields.forEach((field) => {
        const control = this.#getControl(field);
        if (control) {
          control.setCustomValidity('');
        }
        this.#refreshField(field);
      });
    }

    /**
     * Sets a custom validation error for a named field.
     * @param {string} name
     * @param {string} message
     */
    setCustomError(name, message) {
      const field = this.#fields.get(name);
      if (!field) return;
      const control = this.#getControl(field);
      if (!control) return;
      control.setCustomValidity(message);
      if (message) {
        this.#customErrors.set(name, message);
      } else {
        this.#customErrors.delete(name);
      }
      this.#refreshField(field);
    }

    /**
     * Clears a custom validation error for a named field.
     * @param {string} name
     */
    clearCustomError(name) {
      this.setCustomError(name, '');
    }

    /** @param {FieldElement} field */
    #refreshField(field) {
      const control = this.#getControl(field);
      if (!control) return;
      const validity = control.validity;
      const isValid = validity.valid;
      if (isValid) {
        field.removeAttribute('data-invalid');
        field.setAttribute('data-valid', '');
      } else {
        field.removeAttribute('data-valid');
        field.setAttribute('data-invalid', '');
      }
      control.toggleAttribute('aria-invalid', !isValid);
      const messages = field.querySelectorAll('[data-message]');
      messages.forEach((messageNode) => {
        const match = messageNode.getAttribute('data-match');
        const visible = match ? this.#shouldShowMessage(match, validity, control) : false;
        messageNode.setAttribute('data-visible', visible ? 'true' : 'false');
        messageNode.toggleAttribute('hidden', !visible);
        if (match === 'customError' && visible) {
          messageNode.textContent = control.validationMessage;
        }
      });
    }

    /**
     * @param {string} match
     * @param {ValidityState} validity
     * @param {FormControl} control
     * @returns {boolean}
     */
    #shouldShowMessage(match, validity, control) {
      if (match === 'customError') {
        return validity.customError && Boolean(control.validationMessage);
      }
      if (match in validity) {
        const key = /** @type {ValidityKey} */ (match);
        return Boolean(validity[key]);
      }
      return false;
    }

    /** @param {Event} event */
    #handleSubmit = (event) => {
      event.preventDefault();
      if (!this.#form.checkValidity()) {
        this.#focusFirstInvalid();
        this.#fields.forEach((field) => this.#refreshField(field));
        return;
      }

      const formData = new FormData(this.#form);
      /** @type {CustomEvent<FormData>} */
      const submitEvent = new CustomEvent('wc-form-submit', {
        detail: formData,
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      const shouldContinue = this.dispatchEvent(submitEvent);
      if (submitEvent.defaultPrevented || !shouldContinue) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent('wc-form-data', {
          detail: Object.fromEntries(formData.entries()),
          bubbles: true,
          composed: true,
        })
      );
    };

    /** @param {Event} event */
    #handleInput = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      const field = target.closest('[data-field]');
      if (!field) return;
      const name = field.dataset.name;
      if (name && this.#customErrors.has(name)) {
        target.setCustomValidity('');
        this.#customErrors.delete(name);
      }
      this.#refreshField(/** @type {FieldElement} */ (field));
    };

    /** @param {Event} event */
    #handleBlur = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      const field = target.closest('[data-field]');
      if (!field) return;
      this.#refreshField(/** @type {FieldElement} */ (field));
    };

    /** @param {Event} event */
    #handleInvalid = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      event.preventDefault();
      const field = target.closest('[data-field]');
      if (!field) return;
      this.#refreshField(/** @type {FieldElement} */ (field));
    };

    #focusFirstInvalid() {
      const firstInvalid = this.#form.querySelector('[data-control]:invalid');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.focus();
      }
    }

    /**
     * @param {FieldElement} field
     * @returns {FormControl | null}
     */
    #getControl(field) {
      const control = field.querySelector('[data-control]');
      if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) {
        return control;
      }
      return null;
    }

    #attachListeners() {
      this.#form.addEventListener('submit', this.#handleSubmit);
      this.#form.addEventListener('input', this.#handleInput);
      this.#form.addEventListener('blur', this.#handleBlur, true);
      this.#form.addEventListener('invalid', this.#handleInvalid, true);
    }

    #detachListeners() {
      this.#form.removeEventListener('submit', this.#handleSubmit);
      this.#form.removeEventListener('input', this.#handleInput);
      this.#form.removeEventListener('blur', this.#handleBlur, true);
      this.#form.removeEventListener('invalid', this.#handleInvalid, true);
    }
  }

  customElements.define('wc-form', WcForm);
})();

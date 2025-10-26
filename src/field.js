/**
 * @file field.js
 * @version 0.1.0
 *
 * Accessible form layout primitives inspired by the Radix UI Field component family.
 * Provides flexible wrappers for composing labels, controls, helper text, and
 * validation messages with consistent spacing and orientation options.
 */

(() => {
  if (customElements.get('wc-field')) {
    return;
  }

  /**
   * Ensures a property defined before upgrade is re-applied after custom element definition.
   * @param {HTMLElement} element
   * @param {keyof HTMLElement | string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /** @typedef {"vertical"|"horizontal"|"responsive"} FieldOrientation */

  /**
   * @param {unknown} value
   * @returns {value is FieldOrientation}
   */
  const isOrientation = (value) => value === 'vertical' || value === 'horizontal' || value === 'responsive';

  class WcField extends HTMLElement {
    static get observedAttributes() {
      return ['orientation'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #container;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-gap: 0.65rem;
            --wc-field-horizontal-gap: 1rem;
            --wc-field-responsive-gap: 1rem;
            --wc-field-min-label-width: 11rem;
            --wc-field-border-color: rgba(15, 23, 42, 0.08);
            --wc-field-invalid-border: rgba(220, 38, 38, 0.45);
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .field-root {
            display: flex;
            flex-direction: column;
            gap: var(--wc-field-gap);
            align-items: stretch;
            border-inline-start: var(--wc-field-border-width, 0px) solid var(--wc-field-border-color);
            padding-inline-start: var(--wc-field-border-inset, 0px);
            container-type: inline-size;
          }

          :host([data-invalid]) .field-root {
            --wc-field-border-color: var(--wc-field-invalid-border);
          }

          :host([data-orientation="horizontal"]) .field-root {
            flex-direction: row;
            gap: var(--wc-field-horizontal-gap);
            align-items: center;
          }

          :host([data-orientation="horizontal"]) ::slotted(wc-field-content),
          :host([data-orientation="horizontal"]) ::slotted([data-field-content]) {
            flex: 1;
          }

          :host([data-orientation="horizontal"]) ::slotted(wc-field-label) {
            min-inline-size: var(--wc-field-min-label-width);
          }

          :host([data-orientation="responsive"]) .field-root {
            flex-direction: column;
            gap: var(--wc-field-responsive-gap);
          }

          @container (min-width: 640px) {
            :host([data-orientation="responsive"]) .field-root {
              flex-direction: row;
              align-items: center;
              gap: var(--wc-field-horizontal-gap);
            }

            :host([data-orientation="responsive"]) ::slotted(wc-field-content),
            :host([data-orientation="responsive"]) ::slotted([data-field-content]) {
              flex: 1;
            }

            :host([data-orientation="responsive"]) ::slotted(wc-field-label) {
              min-inline-size: var(--wc-field-min-label-width);
            }
          }

          :host([data-orientation="responsive"]) .field-root ::slotted(textarea) {
            min-inline-size: min(100%, 20rem);
          }
        </style>
        <div part="root" class="field-root" role="group">
          <slot></slot>
        </div>
      `;
      this.#container = /** @type {HTMLDivElement} */ (this.#root.querySelector('.field-root'));
    }

    connectedCallback() {
      upgradeProperty(this, 'orientation');
      this.#syncOrientation();
    }

    attributeChangedCallback(name) {
      if (name === 'orientation') {
        this.#syncOrientation();
      }
    }

    /**
     * Sets the field layout orientation.
     * @param {FieldOrientation | null | undefined} value
     */
    set orientation(value) {
      if (!value) {
        this.removeAttribute('orientation');
        return;
      }
      if (isOrientation(value)) {
        this.setAttribute('orientation', value);
      }
    }

    /**
     * Current field orientation.
     * @returns {FieldOrientation}
     */
    get orientation() {
      const value = this.getAttribute('orientation');
      return isOrientation(value) ? value : 'vertical';
    }

    #syncOrientation() {
      const orientation = this.orientation;
      this.dataset.orientation = orientation;
      if (orientation === 'horizontal') {
        this.#container.setAttribute('role', 'group');
      } else {
        this.#container.setAttribute('role', 'group');
      }
    }
  }

  class WcFieldContent extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-content-gap: 0.4rem;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .content {
            display: flex;
            flex-direction: column;
            gap: var(--wc-field-content-gap);
          }
        </style>
        <div part="content" class="content" data-field-content>
          <slot></slot>
        </div>
      `;
    }
  }

  class WcFieldGroup extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-group-gap: 1.25rem;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .group {
            display: flex;
            flex-direction: column;
            gap: var(--wc-field-group-gap);
            container-type: inline-size;
          }
        </style>
        <div part="group" class="group">
          <slot></slot>
        </div>
      `;
    }
  }

  class WcFieldDescription extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-description-color: rgba(71, 85, 105, 0.85);
            --wc-field-description-size: 0.9rem;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          p {
            margin: 0;
            color: var(--wc-field-description-color);
            font-size: var(--wc-field-description-size);
            line-height: 1.6;
          }
        </style>
        <p part="description"><slot></slot></p>
      `;
    }
  }

  class WcFieldTitle extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-title-size: 1rem;
            --wc-field-title-weight: 600;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .title {
            margin: 0;
            font-size: var(--wc-field-title-size);
            font-weight: var(--wc-field-title-weight);
            line-height: 1.4;
            color: inherit;
          }
        </style>
        <p part="title" class="title"><slot></slot></p>
      `;
    }
  }

  class WcFieldLabel extends HTMLElement {
    static get observedAttributes() {
      return ['for'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLLabelElement} */
    #label;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-label-size: 0.95rem;
            --wc-field-label-weight: 600;
            --wc-field-label-color: inherit;
            display: inline-flex;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          label {
            display: inline-flex;
            gap: 0.4rem;
            align-items: center;
            cursor: pointer;
            font-size: var(--wc-field-label-size);
            font-weight: var(--wc-field-label-weight);
            line-height: 1.5;
            color: var(--wc-field-label-color);
          }
        </style>
        <label part="label"><slot></slot></label>
      `;
      this.#label = /** @type {HTMLLabelElement} */ (this.#root.querySelector('label'));
    }

    connectedCallback() {
      upgradeProperty(this, 'htmlFor');
      upgradeProperty(this, 'for');
      this.#syncFor();
    }

    attributeChangedCallback(name) {
      if (name === 'for') {
        this.#syncFor();
      }
    }

    /**
     * ID of the control this label describes.
     * @param {string | null | undefined} value
     */
    set htmlFor(value) {
      if (value) {
        this.setAttribute('for', value);
      } else {
        this.removeAttribute('for');
      }
    }

    /**
     * ID of the control this label describes.
     * @returns {string}
     */
    get htmlFor() {
      return this.getAttribute('for') ?? '';
    }

    set for(value) {
      this.htmlFor = value ?? '';
    }

    get for() {
      return this.htmlFor;
    }

    #syncFor() {
      const controlId = this.getAttribute('for');
      if (controlId) {
        this.#label.htmlFor = controlId;
      } else {
        this.#label.removeAttribute('for');
      }
    }
  }

  class WcFieldLegend extends HTMLElement {
    static get observedAttributes() {
      return ['variant'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLLegendElement} */
    #legend;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-legend-size: 1rem;
            --wc-field-legend-weight: 600;
            --wc-field-legend-color: inherit;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          legend {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: var(--wc-field-legend-size);
            font-weight: var(--wc-field-legend-weight);
            color: var(--wc-field-legend-color);
            line-height: 1.4;
          }

          :host([data-variant="label"]) legend {
            font-size: var(--wc-field-label-size, 0.95rem);
            font-weight: var(--wc-field-label-weight, 600);
          }
        </style>
        <legend part="legend"><slot></slot></legend>
      `;
      this.#legend = /** @type {HTMLLegendElement} */ (this.#root.querySelector('legend'));
    }

    connectedCallback() {
      upgradeProperty(this, 'variant');
      this.#syncVariant();
    }

    attributeChangedCallback(name) {
      if (name === 'variant') {
        this.#syncVariant();
      }
    }

    /**
     * Legend style variant.
     * @param {"legend"|"label" | null | undefined} value
     */
    set variant(value) {
      if (value === 'label') {
        this.setAttribute('variant', 'label');
      } else if (value === 'legend') {
        this.setAttribute('variant', 'legend');
      } else if (!value) {
        this.removeAttribute('variant');
      }
    }

    /**
     * @returns {"legend"|"label"}
     */
    get variant() {
      const value = this.getAttribute('variant');
      return value === 'label' ? 'label' : 'legend';
    }

    #syncVariant() {
      const variant = this.variant;
      this.dataset.variant = variant;
      this.#legend.setAttribute('part', variant === 'label' ? 'legend label' : 'legend');
    }
  }

  class WcFieldSet extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-set-gap: 1rem;
            --wc-field-set-padding: 0;
            --wc-field-set-border: none;
            --wc-field-set-radius: 0;
            --wc-field-set-background: transparent;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          fieldset {
            margin: 0;
            padding: var(--wc-field-set-padding);
            border: var(--wc-field-set-border);
            border-radius: var(--wc-field-set-radius);
            background: var(--wc-field-set-background);
            display: flex;
            flex-direction: column;
            gap: var(--wc-field-set-gap);
            min-inline-size: 0;
          }
        </style>
        <fieldset part="fieldset">
          <slot></slot>
        </fieldset>
      `;
    }
  }

  class WcFieldSeparator extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSpanElement} */
    #content;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-separator-color: rgba(15, 23, 42, 0.08);
            --wc-field-separator-gap: 0.75rem;
            --wc-field-separator-size: 0.85rem;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .separator {
            display: flex;
            align-items: center;
            gap: var(--wc-field-separator-gap);
            color: rgba(71, 85, 105, 0.65);
            font-size: var(--wc-field-separator-size);
          }

          .separator::before,
          .separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px dashed var(--wc-field-separator-color);
          }

          .separator[data-empty="true"]::before,
          .separator[data-empty="true"]::after {
            border-bottom-style: solid;
          }

          .separator[data-empty="true"] span {
            display: none;
          }
        </style>
        <div part="separator" class="separator" data-empty="true" role="presentation">
          <span part="separator-label"><slot></slot></span>
        </div>
      `;
      this.#content = /** @type {HTMLSpanElement} */ (this.#root.querySelector('span'));
    }

    connectedCallback() {
      const slot = this.#root.querySelector('slot');
      if (slot) {
        const update = () => {
          const nodes = slot
            .assignedNodes({ flatten: true })
            .map((node) => (node.textContent ?? '').trim())
            .join('');
          const hasText = nodes.length > 0;
          const container = this.#content.parentElement;
          if (container) {
            container.dataset.empty = hasText ? 'false' : 'true';
          }
        };
        slot.addEventListener('slotchange', update);
        update();
      }
    }
  }

  class WcFieldError extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLUListElement} */
    #list;
    /** @type {HTMLDivElement} */
    #single;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {{ message?: string }[] | null} */
    #errors = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-field-error-color: #b91c1c;
            --wc-field-error-background: rgba(248, 113, 113, 0.12);
            --wc-field-error-radius: 0.65rem;
            --wc-field-error-padding: 0.6rem 0.75rem;
            --wc-field-error-font-size: 0.85rem;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .error {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            background: var(--wc-field-error-background);
            color: var(--wc-field-error-color);
            border-radius: var(--wc-field-error-radius);
            padding: var(--wc-field-error-padding);
            font-size: var(--wc-field-error-font-size);
            line-height: 1.5;
          }

          ul {
            margin: 0;
            padding-inline-start: 1.1rem;
            display: grid;
            gap: 0.25rem;
          }

          slot[hidden] {
            display: none;
          }

          [data-hidden="true"] {
            display: none;
          }
        </style>
        <div part="error" class="error" role="alert" aria-live="polite">
          <div part="error-message" data-hidden="true"></div>
          <ul part="error-list" data-hidden="true"></ul>
          <slot></slot>
        </div>
      `;
      this.#single = /** @type {HTMLDivElement} */ (this.#root.querySelector('div[part="error-message"]'));
      this.#list = /** @type {HTMLUListElement} */ (this.#root.querySelector('ul'));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
    }

    connectedCallback() {
      upgradeProperty(this, 'errors');
      this.#render();
    }

    /**
     * Sets an array of validation errors to display.
     * @param {Array<{ message?: string }> | null | undefined} value
     */
    set errors(value) {
      if (!value) {
        this.#errors = null;
      } else if (Array.isArray(value)) {
        this.#errors = value;
      }
      this.#render();
    }

    /**
     * @returns {Array<{ message?: string }> | null}
     */
    get errors() {
      return this.#errors;
    }

    #render() {
      const messages = Array.isArray(this.#errors)
        ? this.#errors
            .map((entry) => (typeof entry?.message === 'string' ? entry.message.trim() : ''))
            .filter((message) => message.length > 0)
        : [];

      if (messages.length === 0) {
        this.#single.dataset.hidden = 'true';
        this.#single.textContent = '';
        this.#list.dataset.hidden = 'true';
        this.#list.innerHTML = '';
        this.#slot.hidden = false;
        return;
      }

      this.#slot.hidden = true;

      if (messages.length === 1) {
        this.#single.dataset.hidden = 'false';
        this.#single.textContent = messages[0];
        this.#list.dataset.hidden = 'true';
        this.#list.innerHTML = '';
      } else {
        this.#single.dataset.hidden = 'true';
        this.#single.textContent = '';
        this.#list.dataset.hidden = 'false';
        this.#list.innerHTML = messages.map((message) => `<li>${message}</li>`).join('');
      }
    }
  }

  customElements.define('wc-field', WcField);
  customElements.define('wc-field-content', WcFieldContent);
  customElements.define('wc-field-description', WcFieldDescription);
  customElements.define('wc-field-group', WcFieldGroup);
  customElements.define('wc-field-label', WcFieldLabel);
  customElements.define('wc-field-legend', WcFieldLegend);
  customElements.define('wc-field-separator', WcFieldSeparator);
  customElements.define('wc-field-set', WcFieldSet);
  customElements.define('wc-field-title', WcFieldTitle);
  customElements.define('wc-field-error', WcFieldError);
})();

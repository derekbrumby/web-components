/**
 * @file input-group.js
 * @version 1.0.0
 *
 * Accessible input group primitives that combine controls with inline or block
 * addons. Inspired by the shadcn/ui Input Group component, these elements
 * embrace native semantics, expose granular styling hooks, and keep focus
 * states in sync across any slotted custom inputs.
 */

(() => {
  if (customElements.get('wc-input-group')) {
    return;
  }

  const ALIGN_INLINE_START = 'inline-start';
  const ALIGN_INLINE_END = 'inline-end';
  const ALIGN_BLOCK_START = 'block-start';
  const ALIGN_BLOCK_END = 'block-end';
  const CONTROL_SLOT_NAME = 'input-group-control';

  /**
   * @param {HTMLElement & Record<string, unknown>} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  const groupTemplate = document.createElement('template');
  groupTemplate.innerHTML = `
    <style>
      :host {
        --input-group-font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --input-group-radius: 0.95rem;
        --input-group-background: color-mix(in srgb, rgba(15, 23, 42, 0.04) 70%, transparent);
        --input-group-background-disabled: rgba(148, 163, 184, 0.12);
        --input-group-border-color: rgba(148, 163, 184, 0.3);
        --input-group-border-hover: rgba(148, 163, 184, 0.5);
        --input-group-border-focus: rgba(79, 70, 229, 0.75);
        --input-group-shadow-focus: 0 0 0 4px rgba(79, 70, 229, 0.15);
        --input-group-inline-gap: 0.5rem;
        --input-group-inline-padding-block: 0.35rem;
        --input-group-inline-padding-inline: 0.75rem;
        --input-group-block-gap: 0.5rem;
        --input-group-block-padding-block: 0.65rem;
        --input-group-block-padding-inline: 0.85rem;
        --input-group-divider-color: rgba(148, 163, 184, 0.24);
        --input-group-text-color: inherit;
        --input-group-min-height: 2.75rem;
        display: inline-flex;
        font: 400 0.95rem/1.5 var(--input-group-font-family);
        color: inherit;
        min-width: 0;
        position: relative;
      }

      :host([hidden]) {
        display: none !important;
      }

      [part="wrapper"] {
        display: flex;
        flex-direction: column;
        inline-size: 100%;
        border-radius: var(--input-group-radius);
        background: var(--input-group-background);
        border: 1px solid var(--input-group-border-color);
        transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
        overflow: hidden;
        min-width: 0;
      }

      :host(:where(:hover):not([data-disabled])) [part="wrapper"] {
        border-color: var(--input-group-border-hover);
      }

      :host([data-focus-visible]) [part="wrapper"] {
        border-color: var(--input-group-border-focus);
        box-shadow: var(--input-group-shadow-focus);
      }

      :host([data-disabled]) {
        pointer-events: none;
        opacity: 0.72;
      }

      :host([data-disabled]) [part="wrapper"] {
        background: var(--input-group-background-disabled);
      }

      [part="block-start"],
      [part="block-end"] {
        display: flex;
        align-items: center;
        gap: var(--input-group-block-gap);
        padding-block: var(--input-group-block-padding-block);
        padding-inline: var(--input-group-block-padding-inline);
        color: var(--input-group-text-color);
      }

      [part="block-start"]::slotted(*) {
        inline-size: 100%;
      }

      [part="inline"] {
        display: flex;
        align-items: stretch;
        gap: 0;
        inline-size: 100%;
        min-block-size: var(--input-group-min-height);
        background: transparent;
      }

      [part="inline-start"],
      [part="inline-end"] {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: var(--input-group-inline-gap);
        padding-block: var(--input-group-inline-padding-block);
        padding-inline: var(--input-group-inline-padding-inline);
        color: var(--input-group-text-color);
        background: transparent;
        flex: 0 0 auto;
      }

      [part="inline-start"] {
        border-inline-end: 1px solid transparent;
      }

      [part="inline-end"] {
        margin-inline-start: auto;
        border-inline-start: 1px solid transparent;
      }

      [part="inline-start"]::slotted(*),
      [part="inline-end"]::slotted(*) {
        flex: 0 0 auto;
      }

      [part="control"] {
        flex: 1 1 auto;
        min-inline-size: 0;
        display: flex;
        align-items: stretch;
      }

      [part="control"]::slotted(*) {
        flex: 1 1 auto;
        min-inline-size: 0;
      }

      :host(:not([data-has-inline-start])) [part="inline-start"],
      :host(:not([data-has-inline-end])) [part="inline-end"],
      :host(:not([data-has-block-start])) [part="block-start"],
      :host(:not([data-has-block-end])) [part="block-end"] {
        display: none;
      }

      :host([data-has-inline-start]) [part="inline-start"] {
        border-inline-end-color: var(--input-group-divider-color);
      }

      :host([data-has-inline-end]) [part="inline-end"] {
        border-inline-start-color: var(--input-group-divider-color);
      }

      :host([data-has-block-start]) [part="block-start"] {
        border-block-end: 1px solid var(--input-group-divider-color);
      }

      :host([data-has-block-end]) [part="block-end"] {
        border-block-start: 1px solid var(--input-group-divider-color);
      }
    </style>
    <div part="wrapper">
      <div part="block-start"><slot name="${ALIGN_BLOCK_START}"></slot></div>
      <div part="inline">
        <div part="inline-start"><slot name="${ALIGN_INLINE_START}"></slot></div>
        <div part="control"><slot name="${CONTROL_SLOT_NAME}"></slot></div>
        <div part="inline-end"><slot name="${ALIGN_INLINE_END}"></slot></div>
      </div>
      <div part="block-end"><slot name="${ALIGN_BLOCK_END}"></slot></div>
    </div>
  `;

  /**
   * @param {Element} node
   * @returns {node is HTMLElement}
   */
  const isElement = (node) => node.nodeType === Node.ELEMENT_NODE;

  /**
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  const isAddon = (element) => element.tagName === 'WC-INPUT-GROUP-ADDON';

  /**
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  const isControl = (element) => {
    if (element.getAttribute('data-slot') === CONTROL_SLOT_NAME) {
      return true;
    }

    const tag = element.tagName;
    return tag === 'WC-INPUT-GROUP-INPUT' || tag === 'WC-INPUT-GROUP-TEXTAREA';
  };

  /**
   * Layout container that orchestrates inline and stacked addons.
   */
  class WcInputGroup extends HTMLElement {
    static get observedAttributes() {
      return ['disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {MutationObserver | null} */
    #observer = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.append(groupTemplate.content.cloneNode(true));
    }

    connectedCallback() {
      this.setAttribute('role', 'group');
      upgradeProperty(this, 'disabled');
      this.#syncDisabled();
      this.#syncDistribution();
      this.#observer = new MutationObserver(() => {
        this.#syncDistribution();
      });
      this.#observer.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['align', 'data-slot', 'hidden']
      });
      this.addEventListener('focusin', this.#handleFocusIn, true);
      this.addEventListener('focusout', this.#handleFocusOut, true);
    }

    disconnectedCallback() {
      this.#observer?.disconnect();
      this.#observer = null;
      this.removeEventListener('focusin', this.#handleFocusIn, true);
      this.removeEventListener('focusout', this.#handleFocusOut, true);
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} _newValue
     */
    attributeChangedCallback(name, _oldValue, _newValue) {
      if (name === 'disabled') {
        this.#syncDisabled();
      }
    }

    /**
     * Distributes children into their intended slots based on the `align`
     * attribute or `data-slot="input-group-control"` markers.
     */
    #syncDistribution() {
      /** @type {HTMLElement[]} */
      const inlineStart = [];
      /** @type {HTMLElement[]} */
      const inlineEnd = [];
      /** @type {HTMLElement[]} */
      const blockStart = [];
      /** @type {HTMLElement[]} */
      const blockEnd = [];
      let hasControl = false;

      for (const node of Array.from(this.children)) {
        if (!isElement(node)) {
          continue;
        }

        if (isAddon(node)) {
          const align = (node.getAttribute('align') || ALIGN_INLINE_START).toLowerCase();
          let slot = ALIGN_INLINE_START;
          switch (align) {
            case ALIGN_INLINE_END:
              slot = ALIGN_INLINE_END;
              inlineEnd.push(node);
              break;
            case ALIGN_BLOCK_START:
              slot = ALIGN_BLOCK_START;
              blockStart.push(node);
              break;
            case ALIGN_BLOCK_END:
              slot = ALIGN_BLOCK_END;
              blockEnd.push(node);
              break;
            default:
              slot = ALIGN_INLINE_START;
              inlineStart.push(node);
              break;
          }

          if (node.getAttribute('slot') !== slot) {
            node.setAttribute('slot', slot);
          }

          continue;
        }

        if (isControl(node)) {
          hasControl = true;
          if (node.getAttribute('slot') !== CONTROL_SLOT_NAME) {
            node.setAttribute('slot', CONTROL_SLOT_NAME);
          }
          continue;
        }
      }

      this.toggleAttribute('data-has-inline-start', inlineStart.length > 0);
      this.toggleAttribute('data-has-inline-end', inlineEnd.length > 0);
      this.toggleAttribute('data-has-block-start', blockStart.length > 0);
      this.toggleAttribute('data-has-block-end', blockEnd.length > 0);
      this.toggleAttribute('data-has-control', hasControl);
    }

    #syncDisabled() {
      const isDisabled = this.hasAttribute('disabled');
      this.toggleAttribute('data-disabled', isDisabled);
      this.setAttribute('aria-disabled', String(isDisabled));
    }

    /**
     * @param {FocusEvent} event
     */
    #handleFocusIn = (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (this.contains(event.target)) {
        this.setAttribute('data-focus-within', '');
        if (event.target.matches(':focus-visible')) {
          this.setAttribute('data-focus-visible', '');
        } else {
          this.removeAttribute('data-focus-visible');
        }
      }
    };

    /**
     * @param {FocusEvent} event
     */
    #handleFocusOut = (event) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !this.contains(next)) {
        this.removeAttribute('data-focus-within');
        this.removeAttribute('data-focus-visible');
      }
    };

    /**
     * Reflects the `disabled` property to the `disabled` attribute.
     */
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
  }

  customElements.define('wc-input-group', WcInputGroup);

  if (!customElements.get('wc-input-group-addon')) {
    const addonTemplate = document.createElement('template');
    addonTemplate.innerHTML = `
      <style>
        :host {
          --input-group-addon-gap: var(--input-group-inline-gap, 0.5rem);
          --input-group-addon-padding-block: var(--input-group-inline-padding-block, 0.35rem);
          --input-group-addon-padding-inline: var(--input-group-inline-padding-inline, 0.75rem);
          --input-group-addon-text-color: inherit;
          --input-group-addon-background: transparent;
          --input-group-addon-font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--input-group-addon-gap);
          color: var(--input-group-addon-text-color);
          position: relative;
        }

        :host([hidden]) {
          display: none !important;
        }

        .addon {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--input-group-addon-gap);
          padding-block: var(--input-group-addon-padding-block);
          padding-inline: var(--input-group-addon-padding-inline);
          inline-size: auto;
          color: inherit;
          background: var(--input-group-addon-background);
          font-size: var(--input-group-addon-font-size);
        }

        :host([data-align^="block"]) .addon {
          inline-size: 100%;
          justify-content: flex-start;
        }

        :host([data-align="block-end"]) .addon,
        :host([data-align="inline-end"]) .addon {
          margin-inline-start: auto;
        }

        .addon ::slotted(*) {
          flex: 0 0 auto;
        }
      </style>
      <span class="addon" part="container"><slot></slot></span>
    `;

    /**
     * @param {string} align
     * @returns {"inline-start"|"inline-end"|"block-start"|"block-end"}
     */
    const normaliseAlign = (align) => {
      switch ((align || '').toLowerCase()) {
        case ALIGN_INLINE_END:
          return ALIGN_INLINE_END;
        case ALIGN_BLOCK_START:
          return ALIGN_BLOCK_START;
        case ALIGN_BLOCK_END:
          return ALIGN_BLOCK_END;
        default:
          return ALIGN_INLINE_START;
      }
    };

    class WcInputGroupAddon extends HTMLElement {
      static get observedAttributes() {
        return ['align', 'class'];
      }

      /** @type {ShadowRoot} */
      #root;
      /** @type {HTMLElement} */
      #container;

      constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.append(addonTemplate.content.cloneNode(true));
        const container = this.#root.querySelector('[part="container"]');
        if (!(container instanceof HTMLElement)) {
          throw new Error('wc-input-group-addon: missing container element');
        }
        this.#container = container;
      }

      connectedCallback() {
        this.#syncAlign();
        this.#syncClass();
      }

      /**
       * @param {string} name
       * @param {string | null} _oldValue
       * @param {string | null} _newValue
       */
      attributeChangedCallback(name, _oldValue, _newValue) {
        if (name === 'align') {
          this.#syncAlign();
        }
        if (name === 'class') {
          this.#syncClass();
        }
      }

      #syncAlign() {
        const value = normaliseAlign(this.getAttribute('align'));
        this.dataset.align = value;
        if (this.getAttribute('slot') !== value) {
          this.setAttribute('slot', value);
        }
      }

      #syncClass() {
        const cls = this.getAttribute('class');
        this.#container.className = cls ? `addon ${cls}` : 'addon';
      }

      get align() {
        return this.getAttribute('align') ?? ALIGN_INLINE_START;
      }

      set align(value) {
        this.setAttribute('align', value);
      }
    }

    customElements.define('wc-input-group-addon', WcInputGroupAddon);
  }

  if (!customElements.get('wc-input-group-text')) {
    const textTemplate = document.createElement('template');
    textTemplate.innerHTML = `
      <style>
        :host {
          --input-group-text-color: inherit;
          --input-group-text-font-size: 0.82rem;
          --input-group-text-font-weight: 500;
          display: inline-flex;
        }

        :host([hidden]) {
          display: none !important;
        }

        span {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--input-group-text-color);
          font-size: var(--input-group-text-font-size);
          font-weight: var(--input-group-text-font-weight);
          line-height: 1.3;
        }

        span ::slotted(*) {
          flex: 0 0 auto;
        }
      </style>
      <span part="text"><slot></slot></span>
    `;

    class WcInputGroupText extends HTMLElement {
      static get observedAttributes() {
        return ['class'];
      }

      /** @type {ShadowRoot} */
      #root;
      /** @type {HTMLElement} */
      #text;

      constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.append(textTemplate.content.cloneNode(true));
        const text = this.#root.querySelector('span');
        if (!(text instanceof HTMLElement)) {
          throw new Error('wc-input-group-text: missing text element');
        }
        this.#text = text;
      }

      connectedCallback() {
        this.#syncClass();
      }

      /**
       * @param {string} name
       */
      attributeChangedCallback(name) {
        if (name === 'class') {
          this.#syncClass();
        }
      }

      #syncClass() {
        const cls = this.getAttribute('class');
        this.#text.className = cls ? cls : '';
      }
    }

    customElements.define('wc-input-group-text', WcInputGroupText);
  }

  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  /** @type {readonly string[]} */
  const COMMON_CONTROL_ATTRIBUTES = [
    'autocomplete',
    'autocapitalize',
    'autocorrect',
    'autofocus',
    'disabled',
    'enterkeyhint',
    'inputmode',
    'maxlength',
    'max',
    'minlength',
    'min',
    'name',
    'pattern',
    'placeholder',
    'readonly',
    'required',
    'spellcheck',
    'step',
    'type',
    'value',
    'aria-label',
    'aria-labelledby',
    'aria-describedby'
  ];

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} control
   */
  const proxyEvents = (control, host) => {
    control.addEventListener('input', () => {
      if (typeof host.setFormValue === 'function') {
        host.setFormValue(control.value);
      }
      host.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    control.addEventListener('change', () => {
      host.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });
    control.addEventListener('invalid', () => {
      host.dispatchEvent(new Event('invalid', { bubbles: true, composed: true }));
    });
  };

  /**
   * Base class for form associated controls.
   */
  class InputGroupControlBase extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return [...COMMON_CONTROL_ATTRIBUTES, 'class'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLInputElement | HTMLTextAreaElement} */
    #control;
    /** @type {ElementInternals | null} */
    #internals;

    /**
     * @param {'input' | 'textarea'} tag
     */
    constructor(tag) {
      super();
      this.setAttribute('data-slot', CONTROL_SLOT_NAME);
      this.#root = this.attachShadow({ mode: 'open' });
      const control = document.createElement(tag);
      control.setAttribute('part', 'control');
      control.className = 'wc-input-group-control';
      control.style.boxSizing = 'border-box';
      control.style.flex = '1 1 auto';
      control.style.minWidth = '0';
      control.style.font = 'inherit';
      control.style.background = 'transparent';
      control.style.color = 'var(--input-group-control-color, inherit)';
      control.style.padding = 'var(--input-group-control-padding, 0.6rem 0.75rem)';
      control.style.border = 'none';
      control.style.outline = 'none';
      control.style.resize = tag === 'textarea' ? 'vertical' : 'none';
      control.style.lineHeight = '1.45';
      control.style.caretColor = 'var(--input-group-control-caret, currentColor)';
      control.style.borderRadius = 'var(--input-group-control-radius, 0)';
      control.style.transition = 'color 160ms ease, background-color 160ms ease, box-shadow 160ms ease';
      control.placeholder = '';
      control.addEventListener('focus', () => {
        if (this.hasAttribute('data-disabled')) {
          control.blur();
        }
      });
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: flex;
          flex: 1 1 auto;
          min-inline-size: 0;
        }

        :host([hidden]) {
          display: none !important;
        }

        :host([data-disabled]) {
          pointer-events: none;
        }

        :host([data-disabled]) ::slotted(*) {
          pointer-events: none;
        }

        :host([data-disabled]) .wc-input-group-control {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wc-input-group-control::placeholder {
          color: var(--input-group-control-placeholder, rgba(100, 116, 139, 0.85));
        }

        :host(.has-focus-visible) .wc-input-group-control {
          box-shadow: var(--input-group-control-focus-shadow, none);
        }
      `;
      this.#root.append(style, control);
      this.#control = control;
      if (supportsFormAssociated && typeof this.attachInternals === 'function') {
        this.#internals = this.attachInternals();
      } else {
        this.#internals = null;
      }
      proxyEvents(this.#control, this);
    }

    connectedCallback() {
      for (const attr of COMMON_CONTROL_ATTRIBUTES) {
        const value = this.getAttribute(attr);
        if (value !== null) {
          this.#syncAttribute(attr, value);
        }
      }
      this.#syncClass();
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'readonly');
      upgradeProperty(this, 'name');
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'class') {
        this.#syncClass();
        return;
      }

      this.#syncAttribute(name, newValue);
    }

    /**
     * @param {string} name
     * @param {string | null} value
     */
    #syncAttribute(name, value) {
      if (name === 'value') {
        if (value !== null && this.#control.value !== value) {
          this.#control.value = value;
          this.#internals?.setFormValue(this.#control.value);
        }
        return;
      }

      if (name === 'disabled') {
        const isDisabled = value !== null;
        this.#control.disabled = isDisabled;
        this.toggleAttribute('data-disabled', isDisabled);
        return;
      }

      if (name === 'readonly') {
        this.#control.readOnly = value !== null;
        return;
      }

      if (value === null) {
        this.#control.removeAttribute(name);
      } else {
        this.#control.setAttribute(name, value);
      }
    }

    #syncClass() {
      const cls = this.getAttribute('class');
      this.#control.className = cls
        ? `wc-input-group-control ${cls}`
        : 'wc-input-group-control';
    }

    focus(options) {
      this.#control.focus(options);
    }

    blur() {
      this.#control.blur();
    }

    select() {
      if ('select' in this.#control) {
        this.#control.select();
      }
    }

    /**
     * Mirrors the native value property.
     */
    get value() {
      return this.#control.value;
    }

    set value(value) {
      this.#control.value = value ?? '';
      this.setFormValue(this.#control.value);
    }

    get name() {
      return this.getAttribute('name') ?? '';
    }

    set name(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('name');
      } else {
        this.setAttribute('name', value);
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

    get readOnly() {
      return this.hasAttribute('readonly');
    }

    set readOnly(value) {
      if (value) {
        this.setAttribute('readonly', '');
      } else {
        this.removeAttribute('readonly');
      }
    }

    /**
     * @returns {HTMLInputElement | HTMLTextAreaElement}
     */
    get control() {
      return this.#control;
    }

    /**
     * Updates the value used during native form submission.
     *
     * @param {string} value
     */
    setFormValue(value) {
      this.#internals?.setFormValue(value);
    }
  }

  if (!customElements.get('wc-input-group-input')) {
    class WcInputGroupInput extends InputGroupControlBase {
      constructor() {
        super('input');
        this.setAttribute('role', 'textbox');
        this.control.type = this.getAttribute('type') || 'text';
      }
    }

    customElements.define('wc-input-group-input', WcInputGroupInput);
  }

  if (!customElements.get('wc-input-group-textarea')) {
    class WcInputGroupTextarea extends InputGroupControlBase {
      constructor() {
        super('textarea');
        this.control.rows = Number(this.getAttribute('rows') ?? 3);
      }

      static get observedAttributes() {
        return [...COMMON_CONTROL_ATTRIBUTES, 'rows', 'class'];
      }

      /**
       * @param {string} name
       * @param {string | null} _oldValue
       * @param {string | null} value
       */
      attributeChangedCallback(name, _oldValue, value) {
        if (name === 'rows') {
          const rows = Number(value ?? 3);
          if (!Number.isNaN(rows) && rows > 0) {
            this.control.rows = rows;
          }
          return;
        }

        super.attributeChangedCallback(name, _oldValue, value);
      }
    }

    customElements.define('wc-input-group-textarea', WcInputGroupTextarea);
  }

  if (!customElements.get('wc-input-group-button')) {
    const buttonTemplate = document.createElement('template');
    buttonTemplate.innerHTML = `
      <style>
        :host {
          --input-group-button-radius: 999px;
          --input-group-button-padding-x: 0.75rem;
          --input-group-button-padding-y: 0.35rem;
          --input-group-button-gap: 0.35rem;
          --input-group-button-font-size: 0.82rem;
          --input-group-button-font-weight: 600;
          --input-group-button-background: rgba(15, 23, 42, 0.08);
          --input-group-button-color: rgb(30, 41, 59);
          --input-group-button-border: 1px solid transparent;
          --input-group-button-hover-background: rgba(79, 70, 229, 0.12);
          --input-group-button-hover-color: rgb(79, 70, 229);
          --input-group-button-active-background: rgba(79, 70, 229, 0.18);
          --input-group-button-active-color: rgb(67, 56, 202);
          display: inline-flex;
        }

        :host([hidden]) {
          display: none !important;
        }

        button {
          all: unset;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--input-group-button-gap);
          padding-inline: var(--input-group-button-padding-x);
          padding-block: var(--input-group-button-padding-y);
          border-radius: var(--input-group-button-radius);
          background: var(--input-group-button-background);
          color: var(--input-group-button-color);
          border: var(--input-group-button-border);
          font-size: var(--input-group-button-font-size);
          font-weight: var(--input-group-button-font-weight);
          line-height: 1.2;
          cursor: pointer;
          transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease;
          min-inline-size: 0;
        }

        button:hover:not(:disabled) {
          background: var(--input-group-button-hover-background);
          color: var(--input-group-button-hover-color);
        }

        button:active:not(:disabled) {
          background: var(--input-group-button-active-background);
          color: var(--input-group-button-active-color);
        }

        button:focus-visible {
          outline: 2px solid rgba(79, 70, 229, 0.55);
          outline-offset: 2px;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        :host([data-size="icon-xs"]) button,
        :host([data-size="icon-sm"]) button {
          padding-inline: 0;
          inline-size: var(--input-group-button-icon-size, 2rem);
          block-size: var(--input-group-button-icon-size, 2rem);
        }

        :host([data-size="icon-xs"]) button {
          --input-group-button-icon-size: 1.85rem;
        }

        :host([data-size="icon-sm"]) button {
          --input-group-button-icon-size: 2.25rem;
        }

        :host([data-size="sm"]) button {
          --input-group-button-padding-y: 0.45rem;
          --input-group-button-padding-x: 0.85rem;
          --input-group-button-font-size: 0.9rem;
        }

        :host([data-size="xs"]) button {
          --input-group-button-padding-y: 0.35rem;
          --input-group-button-padding-x: 0.75rem;
          --input-group-button-font-size: 0.82rem;
        }

        :host([data-variant="ghost"]) button {
          --input-group-button-background: transparent;
          --input-group-button-color: inherit;
          --input-group-button-border: 1px solid transparent;
          --input-group-button-hover-background: rgba(148, 163, 184, 0.12);
          --input-group-button-hover-color: inherit;
          --input-group-button-active-background: rgba(148, 163, 184, 0.18);
        }

        :host([data-variant="outline"]) button {
          --input-group-button-background: transparent;
          --input-group-button-color: inherit;
          --input-group-button-border: 1px solid rgba(148, 163, 184, 0.5);
          --input-group-button-hover-background: rgba(148, 163, 184, 0.08);
        }

        :host([data-variant="secondary"]) button {
          --input-group-button-background: rgba(148, 163, 184, 0.18);
          --input-group-button-color: rgb(30, 41, 59);
          --input-group-button-hover-background: rgba(148, 163, 184, 0.26);
        }

        :host([data-variant="destructive"]) button {
          --input-group-button-background: rgba(239, 68, 68, 0.16);
          --input-group-button-color: rgb(185, 28, 28);
          --input-group-button-hover-background: rgba(239, 68, 68, 0.22);
          --input-group-button-active-background: rgba(239, 68, 68, 0.3);
        }

        :host([data-variant="default"]) button {
          --input-group-button-background: rgb(79, 70, 229);
          --input-group-button-color: rgb(250, 250, 255);
          --input-group-button-hover-background: rgb(67, 56, 202);
          --input-group-button-hover-color: rgb(250, 250, 255);
          --input-group-button-active-background: rgb(55, 48, 163);
        }

        :host([data-variant="link"]) button {
          --input-group-button-background: transparent;
          --input-group-button-border: 1px solid transparent;
          --input-group-button-color: rgb(79, 70, 229);
          --input-group-button-hover-background: transparent;
          text-decoration: underline;
        }
      </style>
      <button part="button" type="button"><slot></slot></button>
    `;

    class WcInputGroupButton extends HTMLElement {
      static get observedAttributes() {
        return [
          'variant',
          'size',
          'type',
          'name',
          'value',
          'disabled',
          'aria-expanded',
          'aria-haspopup',
          'aria-controls',
          'aria-label',
          'title',
          'class'
        ];
      }

      /** @type {ShadowRoot} */
      #root;
      /** @type {HTMLButtonElement} */
      #button;

      constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.append(buttonTemplate.content.cloneNode(true));
        const button = this.#root.querySelector('button');
        if (!(button instanceof HTMLButtonElement)) {
          throw new Error('wc-input-group-button: button element missing');
        }
        this.#button = button;
        this.#button.addEventListener('click', (event) => {
          if (this.disabled) {
            event.stopImmediatePropagation();
            event.preventDefault();
          }
        });
      }

      connectedCallback() {
        if (!this.hasAttribute('variant')) {
          this.variant = 'ghost';
        }
        if (!this.hasAttribute('size')) {
          this.size = 'xs';
        }
        this.#syncClass();
      }

      /**
       * @param {string} name
       * @param {string | null} _oldValue
       * @param {string | null} value
       */
      attributeChangedCallback(name, _oldValue, value) {
        switch (name) {
          case 'variant':
            this.dataset.variant = value ?? 'ghost';
            break;
          case 'size':
            this.dataset.size = value ?? 'xs';
            break;
          case 'disabled':
            this.#button.disabled = value !== null;
            break;
          case 'type':
          case 'name':
          case 'value':
          case 'aria-expanded':
          case 'aria-haspopup':
          case 'aria-controls':
          case 'aria-label':
          case 'title':
            if (value === null) {
              this.#button.removeAttribute(name);
            } else {
              this.#button.setAttribute(name, value);
            }
            break;
          case 'class':
            this.#syncClass();
            break;
        }
      }

      #syncClass() {
        const cls = this.getAttribute('class');
        this.#button.className = cls ? `wc-input-group-button ${cls}` : 'wc-input-group-button';
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

      get variant() {
        return this.getAttribute('variant') ?? 'ghost';
      }

      set variant(value) {
        this.setAttribute('variant', value);
      }

      get size() {
        return this.getAttribute('size') ?? 'xs';
      }

      set size(value) {
        this.setAttribute('size', value);
      }

      focus(options) {
        this.#button.focus(options);
      }
    }

    customElements.define('wc-input-group-button', WcInputGroupButton);
  }
})();

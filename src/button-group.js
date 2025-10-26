/**
 * @file button-group.js
 * @version 1.0.0
 *
 * Accessible button group container with optional separators and helper text.
 * The element arranges any collection of focusable controls so they appear as a
 * single grouped control. Inspired by modern UI libraries, it supports nested
 * groups, vertical orientation, and dedicated helper elements for separators
 * and inline text labels.
 *
 * Usage:
 * <wc-button-group aria-label="Mailbox actions">
 *   <button type="button">Archive</button>
 *   <button type="button">Report</button>
 * </wc-button-group>
 *
 * <wc-button-group>
 *   <wc-button-group>
 *     <button type="button">Back</button>
 *   </wc-button-group>
 *   <wc-button-group>
 *     <button type="button">Snooze</button>
 *     <button type="button">More</button>
 *   </wc-button-group>
 * </wc-button-group>
 */

(() => {
  const GROUP_ATTRIBUTES = [
    'data-button-group-role',
    'data-button-group-index',
    'data-button-group-first',
    'data-button-group-last',
    'data-button-group-offset',
    'data-button-group-nested',
    'data-button-group-nested-offset',
    'data-button-group-text',
    'data-button-group-text-offset'
  ];

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        --button-group-radius: 0.75rem;
        --button-group-padding: 0;
        --button-group-background: transparent;
        --button-group-shadow: none;
        --button-group-item-radius: 0.5rem;
        --button-group-item-gap: -1px;
        --button-group-nested-gap: 0.5rem;
        --button-group-font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        display: inline-flex;
        max-width: 100%;
        font-family: var(--button-group-font-family);
        color: inherit;
      }

      :host([hidden]) {
        display: none !important;
      }

      :host([data-orientation="vertical"]) {
        flex-direction: column;
      }

      .group {
        display: inline-flex;
        align-items: stretch;
        justify-content: flex-start;
        width: 100%;
        gap: 0;
        border-radius: var(--button-group-radius);
        background: var(--button-group-background);
        padding: var(--button-group-padding);
        box-shadow: var(--button-group-shadow);
      }

      :host([data-orientation="vertical"]) .group {
        flex-direction: column;
      }

      ::slotted(*) {
        box-sizing: border-box;
      }

      ::slotted([data-button-group-role="item"]) {
        border-radius: 0;
        margin: 0;
      }

      :host([data-orientation="horizontal"]) ::slotted([data-button-group-role="item"][data-button-group-offset]) {
        margin-inline-start: var(--button-group-item-gap);
      }

      :host([data-orientation="vertical"]) ::slotted([data-button-group-role="item"][data-button-group-offset]) {
        margin-block-start: var(--button-group-item-gap);
      }

      :host([data-orientation="horizontal"]) ::slotted([data-button-group-role="item"][data-button-group-first]) {
        border-top-left-radius: var(--button-group-item-radius);
        border-bottom-left-radius: var(--button-group-item-radius);
      }

      :host([data-orientation="horizontal"]) ::slotted([data-button-group-role="item"][data-button-group-last]) {
        border-top-right-radius: var(--button-group-item-radius);
        border-bottom-right-radius: var(--button-group-item-radius);
      }

      :host([data-orientation="vertical"]) ::slotted([data-button-group-role="item"][data-button-group-first]) {
        border-top-left-radius: var(--button-group-item-radius);
        border-top-right-radius: var(--button-group-item-radius);
      }

      :host([data-orientation="vertical"]) ::slotted([data-button-group-role="item"][data-button-group-last]) {
        border-bottom-left-radius: var(--button-group-item-radius);
        border-bottom-right-radius: var(--button-group-item-radius);
      }

      :host([data-orientation="vertical"]) ::slotted([data-button-group-role="item"]) {
        width: 100%;
      }

      ::slotted(wc-button-group[data-button-group-role="nested"]) {
        display: inline-flex;
      }

      :host([data-orientation="horizontal"]) ::slotted(wc-button-group[data-button-group-role="nested"][data-button-group-nested-offset]) {
        margin-inline-start: var(--button-group-nested-gap);
      }

      :host([data-orientation="vertical"]) ::slotted(wc-button-group[data-button-group-role="nested"][data-button-group-nested-offset]) {
        margin-block-start: var(--button-group-nested-gap);
      }

      :host([data-orientation="vertical"]) ::slotted(wc-button-group[data-button-group-role="nested"]) {
        width: 100%;
      }

      ::slotted(wc-button-group-text) {
        display: inline-flex;
        align-items: center;
      }

      :host([data-orientation="horizontal"]) ::slotted(wc-button-group-text[data-button-group-text-offset]) {
        margin-inline-start: var(--button-group-nested-gap);
      }

      :host([data-orientation="vertical"]) ::slotted(wc-button-group-text[data-button-group-text-offset]) {
        margin-block-start: var(--button-group-nested-gap);
      }

      :host([data-orientation="vertical"]) ::slotted(wc-button-group-text) {
        align-self: stretch;
      }

      ::slotted(wc-button-group-separator) {
        flex: none;
        align-self: stretch;
      }

      :host([data-orientation="horizontal"]) ::slotted(wc-button-group-separator) {
        margin-inline: var(--button-group-nested-gap);
      }

      :host([data-orientation="vertical"]) ::slotted(wc-button-group-separator) {
        margin-block: var(--button-group-nested-gap);
      }
    </style>
    <div class="group" part="root">
      <slot></slot>
    </div>
  `;

  /**
   * @param {Element} element
   */
  const clearGeneratedAttributes = (element) => {
    for (const name of GROUP_ATTRIBUTES) {
      element.removeAttribute(name);
    }
  };

  /**
   * @param {Element} element
   * @returns {boolean}
   */
  const isSeparator = (element) => element.tagName === 'WC-BUTTON-GROUP-SEPARATOR';

  /**
   * @param {Element} element
   * @returns {boolean}
   */
  const isText = (element) => element.tagName === 'WC-BUTTON-GROUP-TEXT';

  /**
   * @param {Element} element
   * @returns {boolean}
   */
  const isSubGroup = (element) => element.tagName === 'WC-BUTTON-GROUP';

  /**
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  const isInteractive = (element) => {
    if (isSeparator(element) || isText(element) || isSubGroup(element)) {
      return false;
    }

    if (element.dataset.buttonGroupRole === 'item') {
      return true;
    }

    if (element instanceof HTMLButtonElement) {
      return true;
    }

    if (element instanceof HTMLAnchorElement) {
      return element.hasAttribute('href');
    }

    if (element instanceof HTMLInputElement) {
      return element.type !== 'hidden';
    }

    if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      return true;
    }

    if (typeof element.getAttribute === 'function' && element.hasAttribute('data-button-group-item')) {
      return true;
    }

    const role = element.getAttribute('role');
    return role === 'button' || role === 'menuitem' || role === 'menuitemradio' || role === 'menuitemcheckbox';
  };

  /**
   * @param {string | null} value
   * @returns {"horizontal" | "vertical"}
   */
  const normaliseOrientation = (value) => (value === 'vertical' ? 'vertical' : 'horizontal');

  class WcButtonGroup extends HTMLElement {
    static get observedAttributes() {
      return ['orientation'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {HTMLElement} */
    #container;
    /** @type {() => void} */
    #boundHandleSlotChange;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.append(template.content.cloneNode(true));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
      this.#container = /** @type {HTMLElement} */ (this.#root.querySelector('.group'));
      this.#boundHandleSlotChange = () => {
        this.#processChildren();
      };
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }

      this.#applyOrientation();
      this.#slot.addEventListener('slotchange', this.#boundHandleSlotChange);
      this.#processChildren();
    }

    disconnectedCallback() {
      this.#slot.removeEventListener('slotchange', this.#boundHandleSlotChange);
    }

    /**
     * @returns {"horizontal" | "vertical"}
     */
    get orientation() {
      return normaliseOrientation(this.getAttribute('orientation'));
    }

    /**
     * @param {"horizontal" | "vertical"} value
     */
    set orientation(value) {
      const next = normaliseOrientation(value);
      this.setAttribute('orientation', next);
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'orientation' && oldValue !== newValue) {
        this.#applyOrientation();
        this.#processChildren();
      }
    }

    #applyOrientation() {
      const orientation = this.orientation;
      this.setAttribute('data-orientation', orientation);
      this.#container?.setAttribute('aria-orientation', orientation);
    }

    #processChildren() {
      if (!this.#slot) {
        return;
      }

      const assigned = this.#slot.assignedElements({ flatten: true }).filter((node) => node instanceof HTMLElement);

      /** @type {{ element: HTMLElement; assignedIndex: number }[]} */
      const interactiveItems = [];
      /** @type {{ element: HTMLElement; assignedIndex: number }[]} */
      const nestedGroups = [];
      /** @type {{ element: HTMLElement; assignedIndex: number }[]} */
      const textElements = [];

      for (let index = 0; index < assigned.length; index += 1) {
        const element = /** @type {HTMLElement} */ (assigned[index]);
        clearGeneratedAttributes(element);

        if (isSeparator(element)) {
          this.#syncSeparatorOrientation(/** @type {HTMLElement} */ (element));
          element.dataset.buttonGroupRole = 'separator';
          continue;
        }

        if (isSubGroup(element)) {
          nestedGroups.push({ element, assignedIndex: index });
          continue;
        }

        if (isText(element)) {
          textElements.push({ element, assignedIndex: index });
          continue;
        }

        if (isInteractive(element)) {
          interactiveItems.push({ element, assignedIndex: index });
        }
      }

      interactiveItems.forEach(({ element }, index) => {
        element.dataset.buttonGroupRole = 'item';
        element.dataset.buttonGroupIndex = String(index);
        element.toggleAttribute('data-button-group-first', index === 0);
        element.toggleAttribute('data-button-group-last', index === interactiveItems.length - 1);
        element.toggleAttribute('data-button-group-offset', index > 0);
      });

      nestedGroups.forEach(({ element, assignedIndex }) => {
        element.dataset.buttonGroupRole = 'nested';
        element.toggleAttribute('data-button-group-nested', true);
        element.toggleAttribute('data-button-group-nested-offset', assignedIndex > 0);

        const inherits = element.getAttribute('data-button-group-inherited-orientation');
        if (!element.hasAttribute('orientation') || inherits === 'true') {
          element.setAttribute('orientation', this.orientation);
          element.setAttribute('data-button-group-inherited-orientation', 'true');
        }
      });

      textElements.forEach(({ element, assignedIndex }) => {
        element.dataset.buttonGroupRole = 'text';
        element.toggleAttribute('data-button-group-text', true);
        element.toggleAttribute('data-button-group-text-offset', assignedIndex > 0);
        element.setAttribute('data-button-group-inherited-orientation', this.orientation);
      });
    }

    /**
     * @param {HTMLElement} separator
     */
    #syncSeparatorOrientation(separator) {
      const parentOrientation = this.orientation;
      const generated = separator.getAttribute('data-button-group-generated-orientation');
      if (!separator.hasAttribute('orientation') || generated === 'true') {
        const next = parentOrientation === 'vertical' ? 'horizontal' : 'vertical';
        separator.setAttribute('orientation', next);
        separator.setAttribute('data-button-group-generated-orientation', 'true');
      }
      separator.setAttribute('data-button-group-inherited-orientation', parentOrientation);
    }
  }

  if (!customElements.get('wc-button-group')) {
    customElements.define('wc-button-group', WcButtonGroup);
  }
})();

(() => {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        --button-group-separator-color: rgba(148, 163, 184, 0.6);
        --button-group-separator-thickness: 1px;
        --button-group-separator-length: 1.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      :host([hidden]) {
        display: none !important;
      }

      :host([data-orientation="vertical"]) {
        width: var(--button-group-separator-thickness);
        min-height: var(--button-group-separator-length);
      }

      :host([data-orientation="horizontal"]) {
        height: var(--button-group-separator-thickness);
        min-width: var(--button-group-separator-length);
      }

      .separator {
        background-color: var(--button-group-separator-color);
      }

      :host([data-orientation="vertical"]) .separator {
        width: 100%;
        height: 100%;
      }

      :host([data-orientation="horizontal"]) .separator {
        width: 100%;
        height: 100%;
      }
    </style>
    <span class="separator" part="separator" aria-hidden="true"></span>
  `;

  class WcButtonGroupSeparator extends HTMLElement {
    static get observedAttributes() {
      return ['orientation'];
    }

    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.append(template.content.cloneNode(true));
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'presentation');
      }
      this.#applyOrientation();
    }

    /**
     * @returns {"horizontal" | "vertical"}
     */
    get orientation() {
      const value = this.getAttribute('orientation');
      return value === 'horizontal' ? 'horizontal' : 'vertical';
    }

    /**
     * @param {"horizontal" | "vertical"} value
     */
    set orientation(value) {
      if (value !== 'horizontal' && value !== 'vertical') {
        this.removeAttribute('orientation');
        return;
      }
      this.setAttribute('orientation', value);
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'orientation' && oldValue !== newValue) {
        this.#applyOrientation();
      }
    }

    #applyOrientation() {
      this.setAttribute('data-orientation', this.orientation);
    }
  }

  if (!customElements.get('wc-button-group-separator')) {
    customElements.define('wc-button-group-separator', WcButtonGroupSeparator);
  }
})();

(() => {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        --button-group-text-padding-inline: 0.75rem;
        --button-group-text-padding-block: 0.5rem;
        --button-group-text-color: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font: inherit;
        font-weight: 600;
        color: var(--button-group-text-color);
        padding-inline: var(--button-group-text-padding-inline);
        padding-block: var(--button-group-text-padding-block);
      }

      :host([hidden]) {
        display: none !important;
      }

      :host([data-fill="true"]) {
        flex: 1;
      }

      ::slotted(*) {
        margin: 0;
      }
    </style>
    <slot></slot>
  `;

  class WcButtonGroupText extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.append(template.content.cloneNode(true));
    }

    connectedCallback() {
      if (!this.hasAttribute('part')) {
        this.setAttribute('part', 'text');
      }
    }
  }

  if (!customElements.get('wc-button-group-text')) {
    customElements.define('wc-button-group-text', WcButtonGroupText);
  }
})();

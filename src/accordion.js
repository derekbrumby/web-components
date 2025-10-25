/**
 * @file accordion.js
 * @version 1.0.0
 *
 * A zero-dependency accordion web component suite with accessible defaults.
 * Includes a root controller (<wc-accordion>) and item elements (<wc-accordion-item>).
 * Features:
 * - Supports "single" or "multiple" expansion modes with optional collapsible behavior.
 * - Keyboard navigation for vertical and horizontal layouts.
 * - Extensive styling hooks via CSS custom properties and ::part selectors.
 * - Animation-ready content panels without imposing external styles.
 *
 * Usage:
 * <wc-accordion type="single" collapsible>
 *   <wc-accordion-item value="item-1">
 *     <span slot="trigger">Is it accessible?</span>
 *     <p slot="content">Yes. It adheres to the WAI-ARIA design pattern.</p>
 *   </wc-accordion-item>
 * </wc-accordion>
 */

/**
 * @typedef {"single"|"multiple"} AccordionType
 * @typedef {"vertical"|"horizontal"} AccordionOrientation
 */

(() => {
  /** @param {HTMLElement} element @param {keyof HTMLElement} property */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  let itemInstanceCount = 0;

  class WcAccordionItem extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'disabled', 'value', 'heading-level'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #trigger;
    /** @type {HTMLElement} */
    #panel;
    /** @type {HTMLElement} */
    #header;
    /** @type {WcAccordion | null} */
    #accordion = null;
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #disabled = false;
    /** @type {string} */
    #value = '';
    /** @type {number} */
    #headingLevel = 3;
    /** @type {boolean} */
    #ready = false;
    /** @type {boolean} */
    #suppressNextReflect = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      itemInstanceCount += 1;
      const contentId = `wc-accordion-content-${itemInstanceCount}`;
      const triggerId = `wc-accordion-trigger-${itemInstanceCount}`;

      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            --accordion-trigger-background: var(--accordion-surface, #fff);
            --accordion-trigger-background-hover: rgba(15, 23, 42, 0.04);
            --accordion-trigger-background-active: rgba(15, 23, 42, 0.08);
            --accordion-trigger-color: var(--accordion-color, #111827);
            --accordion-trigger-padding: 0.75rem 1rem;
            --accordion-trigger-font-size: 1rem;
            --accordion-trigger-font-weight: 600;
            --accordion-trigger-gap: 0.5rem;
            --accordion-item-border: var(--accordion-border, 1px solid rgba(15, 23, 42, 0.12));
            --accordion-item-radius: var(--accordion-radius, 0.75rem);
            --accordion-content-background: var(--accordion-panel-background, #fff);
            --accordion-content-color: var(--accordion-panel-color, #374151);
            --accordion-content-padding: 0 1rem 1rem 1rem;
            --accordion-indicator-size: 1.125rem;
            --accordion-transition-duration: 200ms;
            --accordion-transition-easing: cubic-bezier(0.33, 1, 0.68, 1);
            color: inherit;
          }

          :host(:not(:last-of-type)) {
            margin-bottom: var(--accordion-item-gap, 0);
          }

          [part="item"] {
            border-radius: var(--accordion-item-radius);
            border: var(--accordion-item-border);
            background: var(--accordion-trigger-background);
            color: var(--accordion-trigger-color);
            overflow: hidden;
            transition: background var(--accordion-transition-duration) var(--accordion-transition-easing),
              color var(--accordion-transition-duration) var(--accordion-transition-easing),
              border-color var(--accordion-transition-duration) var(--accordion-transition-easing);
          }

          :host([data-state="open"]) [part="item"] {
            background: var(--accordion-open-trigger-background, var(--accordion-trigger-background));
          }

          [part="header"] {
            margin: 0;
          }

          [part="trigger"] {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--accordion-trigger-gap);
            width: 100%;
            border: none;
            background: transparent;
            padding: var(--accordion-trigger-padding);
            color: inherit;
            font: inherit;
            font-size: var(--accordion-trigger-font-size);
            font-weight: var(--accordion-trigger-font-weight);
            cursor: pointer;
            text-align: start;
            transition: background var(--accordion-transition-duration) var(--accordion-transition-easing),
              color var(--accordion-transition-duration) var(--accordion-transition-easing);
          }

          [part="trigger"]:focus-visible {
            outline: var(--accordion-focus-outline, 2px solid #6366f1);
            outline-offset: var(--accordion-focus-outline-offset, 2px);
          }

          :host([data-disabled]) [part="trigger"] {
            cursor: not-allowed;
            opacity: 0.5;
          }

          [part="trigger"]:hover {
            background: var(--accordion-trigger-background-hover);
          }

          [part="trigger"]:active {
            background: var(--accordion-trigger-background-active);
          }

          [part="indicator"] {
            flex: none;
            width: var(--accordion-indicator-size);
            height: var(--accordion-indicator-size);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform var(--accordion-transition-duration) var(--accordion-transition-easing);
          }

          :host([data-state="open"]) [part="indicator"] {
            transform: rotate(180deg);
          }

          [data-panel] {
            overflow: hidden;
            background: var(--accordion-content-background);
            color: var(--accordion-content-color);
            height: 0;
            transition: height var(--accordion-transition-duration) var(--accordion-transition-easing);
          }

          :host([data-state="open"]) [data-panel] {
            display: block;
          }

          [part="panel-inner"] {
            padding: var(--accordion-content-padding);
            display: block;
          }
        </style>
        <div part="item" data-state="closed">
          <div part="header" role="heading">
            <button part="trigger" type="button" aria-expanded="false" aria-controls="${contentId}" id="${triggerId}">
              <span part="trigger-label"><slot name="trigger">Section</slot></span>
              <span part="indicator" aria-hidden="true">
                <svg part="indicator-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path part="indicator-path" d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
          </div>
          <div part="panel" data-panel hidden role="region" id="${contentId}" aria-labelledby="${triggerId}">
            <div part="panel-inner">
              <slot name="content"></slot>
            </div>
          </div>
        </div>
      `;

      this.#trigger = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[part="trigger"]'));
      this.#panel = /** @type {HTMLElement} */ (this.#root.querySelector('[data-panel]'));
      this.#header = /** @type {HTMLElement} */ (this.#root.querySelector('[part="header"]'));

      this.#trigger.addEventListener('click', (event) => {
        if (this.#disabled) return;
        this.#requestToggle(event);
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'headingLevel');
      this.#ready = true;
      this.#syncHeadingLevel();
      this.#trigger.setAttribute('aria-disabled', String(this.#disabled));
      this.#reflectState(false);
    }

    disconnectedCallback() {
      this.#accordion?.unregisterItem(this);
      this.#accordion = null;
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} _newValue
     */
    attributeChangedCallback(name, _oldValue, _newValue) {
      switch (name) {
        case 'open':
          this.#open = this.hasAttribute('open');
          if (this.#suppressNextReflect) {
            this.#suppressNextReflect = false;
          } else {
            this.#reflectState();
          }
          break;
        case 'disabled':
          this.#disabled = this.hasAttribute('disabled');
          this.toggleAttribute('data-disabled', this.#disabled);
          this.#trigger.disabled = this.#disabled;
          this.#trigger.setAttribute('aria-disabled', String(this.#disabled));
          break;
        case 'value':
          this.#value = this.getAttribute('value') ?? '';
          break;
        case 'heading-level':
          this.#headingLevel = this.#parseHeadingLevel(this.getAttribute('heading-level'));
          this.#syncHeadingLevel();
          break;
        default:
          break;
      }
    }

    /** @param {WcAccordion | null} accordion */
    setAccordionController(accordion) {
      this.#accordion = accordion;
    }

    /**
     * @param {boolean} open
     * @param {{ silent?: boolean; animate?: boolean }} [options]
     */
    setOpen(open, options) {
      const nextOpen = Boolean(open);
      if (nextOpen === this.#open) return;
      this.#open = nextOpen;
      this.#suppressNextReflect = true;
      this.toggleAttribute('open', this.#open);
      this.#reflectState(options?.animate !== false);
      if (!options?.silent) {
        this.dispatchEvent(new CustomEvent('wc-accordion-item-toggled', {
          bubbles: true,
          composed: true,
          detail: { open: this.#open }
        }));
      }
    }

    /**
     * @param {Element} element
     * @returns {boolean}
     */
    ownsTrigger(element) {
      return this.#trigger === element;
    }

    focusTrigger() {
      this.#trigger.focus();
    }

    get value() {
      return this.#value;
    }

    set value(val) {
      if (val == null) {
        this.removeAttribute('value');
      } else {
        this.setAttribute('value', String(val));
      }
    }

    get open() {
      return this.#open;
    }

    set open(isOpen) {
      if (isOpen) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    }

    get disabled() {
      return this.#disabled;
    }

    set disabled(disabled) {
      if (disabled) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get headingLevel() {
      return this.#headingLevel;
    }

    set headingLevel(level) {
      this.setAttribute('heading-level', String(level));
    }

    #parseHeadingLevel(value) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 6) {
        return parsed;
      }
      return 3;
    }

    #syncHeadingLevel() {
      if (!this.#header) return;
      this.#header.setAttribute('aria-level', String(this.#headingLevel));
    }

    /**
     * @param {Event} triggerEvent
     */
    #requestToggle(triggerEvent) {
      const requestedState = !this.#open;
      const event = new CustomEvent('wc-accordion-item-request-toggle', {
        bubbles: true,
        composed: true,
        detail: {
          item: this,
          open: requestedState,
          originalEvent: triggerEvent
        }
      });
      this.dispatchEvent(event);
      // Fallback for standalone usage
      if (!event.defaultPrevented && !this.#accordion) {
        this.setOpen(requestedState);
      }
    }

    /**
     * @param {boolean} [animate]
     */
    #reflectState(animate = true) {
      const state = this.#open ? 'open' : 'closed';
      this.setAttribute('data-state', state);
      const item = /** @type {HTMLElement} */ (this.#root.querySelector('[part="item"]'));
      item?.setAttribute('data-state', state);
      this.#trigger.setAttribute('aria-expanded', String(this.#open));
      this.#panel.setAttribute('aria-hidden', String(!this.#open));

      if (this.#open) {
        this.#panel.hidden = false;
      }

      if (!animate || !this.#ready) {
        this.#panel.style.height = this.#open ? 'auto' : '0px';
        if (!this.#open) {
          this.#panel.hidden = true;
        }
        return;
      }

      const panel = this.#panel;
      const computed = getComputedStyle(panel);
      const durations = computed.transitionDuration.split(',').map((part) => parseFloat(part) || 0);
      const maxDuration = Math.max(0, ...durations);

      if (this.#open) {
        panel.hidden = false;
        panel.style.height = '0px';
        // force reflow before measuring scrollHeight
        panel.offsetHeight;
        const targetHeight = panel.scrollHeight;
        panel.style.height = `${targetHeight}px`;
        const cleanup = () => {
          panel.style.height = 'auto';
          panel.removeEventListener('transitionend', cleanup);
        };
        if (maxDuration === 0) {
          cleanup();
        } else {
          panel.addEventListener('transitionend', cleanup);
        }
      } else {
        const startHeight = panel.scrollHeight;
        panel.style.height = `${startHeight}px`;
        panel.offsetHeight;
        panel.style.height = '0px';
        const cleanup = () => {
          panel.hidden = true;
          panel.style.height = '0px';
          panel.removeEventListener('transitionend', cleanup);
        };
        if (maxDuration === 0) {
          cleanup();
        } else {
          panel.addEventListener('transitionend', cleanup);
        }
      }
    }
  }

  class WcAccordion extends HTMLElement {
    static get observedAttributes() {
      return ['type', 'collapsible', 'orientation', 'value', 'values'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #container;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {AccordionType} */
    #type = 'single';
    /** @type {AccordionOrientation} */
    #orientation = 'vertical';
    /** @type {boolean} */
    #collapsible = false;
    /** @type {Set<string>} */
    #openValues = new Set();
    /** @type {WcAccordionItem[]} */
    #items = [];
    /** @type {boolean} */
    #suppressAttributeSync = false;
    /** @type {number} */
    #autoValueCounter = 0;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            --accordion-radius: 0.75rem;
            --accordion-border: 1px solid rgba(15, 23, 42, 0.12);
            --accordion-surface: #fff;
            --accordion-color: #0f172a;
            --accordion-gap: 0;
          }

          [part="root"] {
            display: flex;
            flex-direction: column;
            gap: var(--accordion-gap);
            border-radius: var(--accordion-radius);
            background: var(--accordion-surface);
          }

          :host([data-orientation="horizontal"]) [part="root"] {
            flex-direction: row;
          }

          ::slotted(wc-accordion-item) {
            flex: 1 1 auto;
          }
        </style>
        <div part="root" data-type="single" role="presentation">
          <slot></slot>
        </div>
      `;
      this.#container = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="root"]'));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));

      this.#slot.addEventListener('slotchange', () => {
        this.#collectItems();
        this.#enforceConstraints();
      });

      this.addEventListener('wc-accordion-item-request-toggle', (event) => {
        const detail = /** @type {{ item?: WcAccordionItem; open?: boolean }} */ (event.detail ?? {});
        if (!detail.item || !this.#items.includes(detail.item)) {
          return;
        }
        event.preventDefault();
        this.#toggleItem(detail.item, detail.open ?? false, { userTriggered: true });
      });

      this.addEventListener('keydown', (event) => {
        if (!(event.target instanceof Element)) return;
        const item = this.#items.find((candidate) => candidate.ownsTrigger(event.target));
        if (!item) return;
        this.#handleKeyboard(event, item);
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'type');
      upgradeProperty(this, 'collapsible');
      upgradeProperty(this, 'orientation');
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'values');
      this.#syncFromAttributes();
      this.#collectItems();
      this.#enforceConstraints(true);
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || this.#suppressAttributeSync) return;
      switch (name) {
        case 'type':
          this.#type = this.#parseType(newValue);
          this.#container.setAttribute('data-type', this.#type);
          this.setAttribute('aria-multiselectable', String(this.#type === 'multiple'));
          this.#enforceConstraints(true);
          break;
        case 'collapsible':
          this.#collapsible = this.hasAttribute('collapsible');
          this.#enforceConstraints(true);
          break;
        case 'orientation':
          this.#orientation = this.#parseOrientation(newValue);
          this.#syncOrientation();
          break;
        case 'value':
        case 'values':
          this.#syncOpenValuesFromAttributes();
          this.#applyOpenStateFromValues();
          break;
        default:
          break;
      }
    }

    get type() {
      return this.#type;
    }

    set type(value) {
      const parsed = this.#parseType(value);
      this.#type = parsed;
      this.#setAttributeSilently('type', parsed);
      this.#container.setAttribute('data-type', parsed);
      this.setAttribute('aria-multiselectable', String(parsed === 'multiple'));
      this.#enforceConstraints(true);
    }

    get collapsible() {
      return this.#collapsible;
    }

    set collapsible(value) {
      const next = Boolean(value);
      this.#collapsible = next;
      if (next) {
        this.#setAttributeSilently('collapsible', '');
      } else {
        this.#removeAttributeSilently('collapsible');
      }
      this.#enforceConstraints(true);
    }

    get orientation() {
      return this.#orientation;
    }

    set orientation(value) {
      const parsed = this.#parseOrientation(value);
      this.#orientation = parsed;
      this.#setAttributeSilently('orientation', parsed);
      this.#syncOrientation();
    }

    /**
     * Selected value when type="single".
     * @returns {string}
     */
    get value() {
      return [...this.#openValues][0] ?? '';
    }

    set value(val) {
      const normalized = val == null ? '' : String(val);
      this.#openValues.clear();
      if (normalized) {
        this.#openValues.add(normalized);
        this.#setAttributeSilently('value', normalized);
      } else {
        this.#removeAttributeSilently('value');
      }
      this.#applyOpenStateFromValues(true);
      this.#syncSelectionAttributes();
    }

    /**
     * Selected values when type="multiple".
     * @returns {string[]}
     */
    get values() {
      return [...this.#openValues];
    }

    set values(val) {
      if (!Array.isArray(val) || val.length === 0) {
        this.#openValues.clear();
        this.#removeAttributeSilently('values');
        this.#applyOpenStateFromValues(true);
        this.#syncSelectionAttributes();
        return;
      }
      const serializedValues = val.map((v) => String(v));
      this.#openValues = new Set(serializedValues);
      this.#setAttributeSilently('values', serializedValues.join(','));
      this.#applyOpenStateFromValues(true);
      this.#syncSelectionAttributes();
    }

    /** @param {WcAccordionItem} item */
    registerItem(item) {
      if (!this.#items.includes(item)) {
        this.#items.push(item);
      }
      if (!item.value) {
        this.#autoValueCounter += 1;
        item.value = `item-${this.#autoValueCounter}`;
      }
      this.#items.sort((a, b) => {
        if (a === b) return 0;
        const position = a.compareDocumentPosition(b);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });
      item.setAccordionController(this);
      item.setAttribute('data-orientation', this.#orientation);
    }

    /** @param {WcAccordionItem} item */
    unregisterItem(item) {
      const index = this.#items.indexOf(item);
      if (index >= 0) {
        this.#items.splice(index, 1);
      }
      item.setAccordionController(null);
      if (this.#openValues.has(item.value)) {
        this.#openValues.delete(item.value);
        this.#emitChange();
      }
      this.#enforceConstraints();
    }

    /**
     * @param {WcAccordionItem} item
     * @param {boolean} open
     * @param {{ userTriggered?: boolean }} [options]
     */
    #toggleItem(item, open, options) {
      if (item.disabled) return;
      if (this.#type === 'single') {
        if (open) {
          this.#openValues.clear();
          this.#openValues.add(item.value);
          this.#items.forEach((candidate) => {
            candidate.setOpen(candidate === item, { silent: true });
          });
        } else if (this.#collapsible) {
          this.#openValues.delete(item.value);
          item.setOpen(false, { silent: true });
        } else {
          // non-collapsible single accordions must keep one item open
          if (!this.#openValues.size) {
            this.#openValues.add(item.value);
            item.setOpen(true, { silent: true });
          }
          return;
        }
      } else {
        if (open) {
          this.#openValues.add(item.value);
          item.setOpen(true, { silent: true });
        } else {
          this.#openValues.delete(item.value);
          item.setOpen(false, { silent: true });
        }
      }
      this.#applyOpenStateFromValues(false);
      if (options?.userTriggered) {
        this.#emitChange();
      }
      this.#syncSelectionAttributes();
    }

    #emitChange() {
      const detail = this.#type === 'single'
        ? { value: this.value }
        : { values: this.values.slice() };
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail
      }));
    }

    #collectItems() {
      const assigned = this.#slot.assignedElements({ flatten: true });
      const items = assigned.filter((node) => node instanceof WcAccordionItem);
      const current = new Set(this.#items);
      this.#items = [];
      for (const item of items) {
        this.registerItem(/** @type {WcAccordionItem} */ (item));
        current.delete(/** @type {WcAccordionItem} */ (item));
      }
      // Any items removed from slot need to be unregistered
      current.forEach((item) => this.unregisterItem(item));
      this.#applyOpenStateFromValues();
    }

    #syncFromAttributes() {
      this.#type = this.#parseType(this.getAttribute('type'));
      this.#container.setAttribute('data-type', this.#type);
      this.setAttribute('aria-multiselectable', String(this.#type === 'multiple'));
      this.#collapsible = this.hasAttribute('collapsible');
      this.#orientation = this.#parseOrientation(this.getAttribute('orientation'));
      this.#syncOrientation();
      this.#syncOpenValuesFromAttributes();
      this.#applyOpenStateFromValues(true);
    }

    #syncOrientation() {
      this.setAttribute('data-orientation', this.#orientation);
      this.#container.setAttribute('data-orientation', this.#orientation);
      this.#items.forEach((item) => item.setAttribute('data-orientation', this.#orientation));
    }

    #syncOpenValuesFromAttributes() {
      if (this.#type === 'single') {
        const attrValue = this.getAttribute('value');
        this.#openValues.clear();
        if (attrValue) {
          this.#openValues.add(attrValue);
        }
      } else {
        const attrValues = this.getAttribute('values');
        const set = new Set();
        if (attrValues) {
          attrValues.split(',').map((v) => v.trim()).filter(Boolean).forEach((v) => set.add(v));
        }
        this.#openValues = set;
      }
    }

    /**
     * @param {boolean} [initial]
     */
    #applyOpenStateFromValues(initial = false) {
      const openValues = new Set(this.#openValues);
      if (this.#type === 'single') {
        let matched = false;
        for (const item of this.#items) {
          const shouldOpen = openValues.has(item.value) || item.hasAttribute('open');
          if (shouldOpen && !item.disabled && !matched) {
            item.setOpen(true, { silent: true, animate: !initial });
            matched = true;
            openValues.add(item.value);
          } else {
            item.setOpen(false, { silent: true, animate: !initial });
            openValues.delete(item.value);
          }
        }
        if (!matched && !this.#collapsible) {
          const fallback = this.#items.find((item) => !item.disabled);
          if (fallback) {
            fallback.setOpen(true, { silent: true, animate: !initial });
            openValues.clear();
            openValues.add(fallback.value);
          }
        }
        this.#openValues = openValues;
      } else {
        for (const item of this.#items) {
          const shouldOpen = openValues.has(item.value) || item.hasAttribute('open');
          const willOpen = shouldOpen && !item.disabled;
          item.setOpen(willOpen, { silent: true, animate: !initial });
          if (willOpen) {
            openValues.add(item.value);
          } else {
            openValues.delete(item.value);
          }
        }
        this.#openValues = openValues;
      }
      this.#syncSelectionAttributes();
    }

    /**
     * Ensure the DOM attributes reflect the internal open state.
     */
    #syncSelectionAttributes() {
      this.#suppressAttributeSync = true;
      if (this.#type === 'single') {
        const currentValue = this.value;
        if (currentValue) {
          this.setAttribute('value', currentValue);
        } else {
          this.removeAttribute('value');
        }
        this.removeAttribute('values');
      } else {
        this.setAttribute('values', this.values.join(','));
        this.removeAttribute('value');
      }
      this.#suppressAttributeSync = false;
    }

    /**
     * @param {boolean} [initial]
     */
    #enforceConstraints(initial = false) {
      this.#applyOpenStateFromValues(initial);
    }

    /**
     * @param {KeyboardEvent} event
     * @param {WcAccordionItem} item
     */
    #handleKeyboard(event, item) {
      const orientation = this.#orientation;
      const isHorizontal = orientation === 'horizontal';
      const isVertical = orientation === 'vertical';
      switch (event.key) {
        case 'ArrowDown':
          if (isVertical) {
            event.preventDefault();
            this.#focusByOffset(item, 1);
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            event.preventDefault();
            this.#focusByOffset(item, -1);
          }
          break;
        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault();
            this.#focusByOffset(item, 1);
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault();
            this.#focusByOffset(item, -1);
          }
          break;
        case 'Home':
          event.preventDefault();
          this.#focusByIndex(0);
          break;
        case 'End':
          event.preventDefault();
          this.#focusByIndex(this.#items.length - 1);
          break;
        default:
          break;
      }
    }

    /**
     * @param {WcAccordionItem} item
     * @param {number} delta
     */
    #focusByOffset(item, delta) {
      const index = this.#items.indexOf(item);
      if (index === -1) return;
      const total = this.#items.length;
      if (!total) return;
      let nextIndex = index;
      for (let step = 0; step < total; step += 1) {
        nextIndex = (nextIndex + delta + total) % total;
        const candidate = this.#items[nextIndex];
        if (candidate && !candidate.disabled) {
          candidate.focusTrigger();
          break;
        }
      }
    }

    /** @param {number} index */
    #focusByIndex(index) {
      const clamped = Math.max(0, Math.min(this.#items.length - 1, index));
      for (let i = clamped; i < this.#items.length; i += 1) {
        const candidate = this.#items[i];
        if (candidate && !candidate.disabled) {
          candidate.focusTrigger();
          return;
        }
      }
      for (let i = clamped - 1; i >= 0; i -= 1) {
        const candidate = this.#items[i];
        if (candidate && !candidate.disabled) {
          candidate.focusTrigger();
          return;
        }
      }
    }

    /**
     * @param {any} raw
     * @returns {AccordionType}
     */
    #parseType(raw) {
      if (raw === 'multiple') return 'multiple';
      return 'single';
    }

    /**
     * @param {any} raw
     * @returns {AccordionOrientation}
     */
    #parseOrientation(raw) {
      return raw === 'horizontal' ? 'horizontal' : 'vertical';
    }

    /**
     * @param {string} name
     * @param {string | AccordionType | AccordionOrientation} value
     */
    #setAttributeSilently(name, value) {
      this.#suppressAttributeSync = true;
      this.setAttribute(name, String(value));
      this.#suppressAttributeSync = false;
    }

    /** @param {string} name */
    #removeAttributeSilently(name) {
      this.#suppressAttributeSync = true;
      this.removeAttribute(name);
      this.#suppressAttributeSync = false;
    }
  }

  if (!customElements.get('wc-accordion')) {
    customElements.define('wc-accordion', WcAccordion);
  }

  if (!customElements.get('wc-accordion-item')) {
    customElements.define('wc-accordion-item', WcAccordionItem);
  }

  // Optional globals for module consumers debugging via CDN.
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.WcAccordion = WcAccordion;
    // @ts-ignore
    window.WcAccordionItem = WcAccordionItem;
  }
})();

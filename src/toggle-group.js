/**
 * @file toggle-group.js
 * @version 1.0.0
 *
 * Accessible toggle group component inspired by Radix UI's Toggle Group.
 * Supports single or multiple selection, roving focus, keyboard navigation,
 * and rich styling hooks via CSS custom properties and `::part` selectors.
 *
 * Usage:
 * <wc-toggle-group aria-label="Text alignment" default-value="center">
 *   <button type="button" data-value="left" aria-label="Align left">
 *     <!-- icon or text -->
 *   </button>
 *   <button type="button" data-value="center" aria-label="Align center">
 *     <!-- icon or text -->
 *   </button>
 *   <button type="button" data-value="right" aria-label="Align right">
 *     <!-- icon or text -->
 *   </button>
 * </wc-toggle-group>
 */

(() => {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        --toggle-group-background: rgba(99, 102, 241, 0.12);
        --toggle-group-shadow: 0 2px 10px rgba(15, 23, 42, 0.16);
        --toggle-group-radius: 0.75rem;
        --toggle-group-gap: 1px;
        --toggle-group-padding: 0.25rem;
        --toggle-group-font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --toggle-group-item-size: 2.25rem;
        --toggle-group-item-radius: 0.5rem;
        --toggle-group-item-background: #ffffff;
        --toggle-group-item-color: #4b5563;
        --toggle-group-item-hover: rgba(99, 102, 241, 0.12);
        --toggle-group-item-active-background: #a5b4fc;
        --toggle-group-item-active-color: #312e81;
        --toggle-group-item-disabled-opacity: 0.55;
        --toggle-group-item-focus-ring: 0 0 0 2px rgba(67, 56, 202, 0.4);
        display: inline-block;
        position: relative;
        font-family: var(--toggle-group-font-family);
        color: inherit;
      }

      :host([hidden]) {
        display: none !important;
      }

      :host([data-disabled="true"]) {
        pointer-events: none;
        opacity: 0.6;
      }

      .toggle-group {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--toggle-group-gap);
        padding: var(--toggle-group-padding);
        border-radius: var(--toggle-group-radius);
        background: var(--toggle-group-background);
        box-shadow: var(--toggle-group-shadow);
      }

      :host([data-orientation="vertical"]) .toggle-group {
        flex-direction: column;
      }

      ::slotted(*) {
        appearance: none;
        border: none;
        margin: 0;
        padding: 0;
        font: inherit;
        background: transparent;
      }

      ::slotted([data-toggle-item]) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: var(--toggle-group-item-size);
        block-size: var(--toggle-group-item-size);
        border-radius: var(--toggle-group-item-radius);
        background: var(--toggle-group-item-background);
        color: var(--toggle-group-item-color);
        cursor: pointer;
        transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
      }

      ::slotted([data-toggle-item][data-position="first"]) {
        border-top-left-radius: var(--toggle-group-item-radius);
        border-bottom-left-radius: var(--toggle-group-item-radius);
      }

      ::slotted([data-toggle-item][data-position="last"]) {
        border-top-right-radius: var(--toggle-group-item-radius);
        border-bottom-right-radius: var(--toggle-group-item-radius);
      }

      :host([data-orientation="vertical"]) ::slotted([data-toggle-item][data-position="first"]) {
        border-radius: var(--toggle-group-item-radius) var(--toggle-group-item-radius) 0 0;
      }

      :host([data-orientation="vertical"]) ::slotted([data-toggle-item][data-position="last"]) {
        border-radius: 0 0 var(--toggle-group-item-radius) var(--toggle-group-item-radius);
      }

      ::slotted([data-toggle-item]:hover) {
        background: var(--toggle-group-item-hover);
      }

      ::slotted([data-toggle-item][data-state="on"]) {
        background: var(--toggle-group-item-active-background);
        color: var(--toggle-group-item-active-color);
      }

      ::slotted([data-toggle-item][data-focus="true"]) {
        box-shadow: var(--toggle-group-item-focus-ring);
      }

      ::slotted([data-toggle-item][data-disabled="true"]) {
        cursor: not-allowed;
        opacity: var(--toggle-group-item-disabled-opacity);
      }
    </style>
    <div class="toggle-group" part="root" role="group">
      <slot></slot>
    </div>
  `;

  /**
   * @param {string | null} value
   * @returns {boolean}
   */
  const booleanAttribute = (value) => value !== null && value !== 'false';

  class WcToggleGroup extends HTMLElement {
    static get observedAttributes() {
      return [
        'type',
        'value',
        'values',
        'default-value',
        'default-values',
        'disabled',
        'orientation',
        'loop'
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {HTMLElement[]} */
    #items = [];
    /**
     * @type {Map<
     *   HTMLElement,
     *   {
     *     listeners: { click: EventListener; focus: EventListener; blur: EventListener };
     *     roleAdded: boolean;
     *     initialTabIndex: string | null;
     *   }
     * >}
     */
    #itemState = new Map();
    /** @type {string | null} */
    #value = null;
    /** @type {Set<string>} */
    #values = new Set();
    /** @type {boolean} */
    #controlledSingle = false;
    /** @type {boolean} */
    #controlledMultiple = false;
    /** @type {boolean} */
    #defaultApplied = false;
    /** @type {boolean} */
    #defaultMultipleApplied = false;
    /** @type {boolean} */
    #isReflecting = false;
    /** @type {boolean} */
    #loop = true;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.append(template.content.cloneNode(true));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
      this.#handleSlotChange = this.#handleSlotChange.bind(this);
      this.#handleKeydown = this.#handleKeydown.bind(this);
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'presentation');
      }

      this.#slot.addEventListener('slotchange', this.#handleSlotChange);
      this.addEventListener('keydown', this.#handleKeydown);

      if (!this.hasAttribute('type')) {
        this.setAttribute('type', 'single');
      }

      if (!this.hasAttribute('orientation')) {
        this.setAttribute('orientation', 'horizontal');
      }

      this.#applyOrientation();
      this.#applyDisabledState();
      this.#handleSlotChange();
      this.#syncSelection();
    }

    disconnectedCallback() {
      this.#slot.removeEventListener('slotchange', this.#handleSlotChange);
      this.removeEventListener('keydown', this.#handleKeydown);
      this.#items.forEach((item) => this.#teardownItem(item));
      this.#items = [];
    }

    /**
     * Component selection mode.
     * @returns {'single' | 'multiple'}
     */
    get type() {
      return this.getAttribute('type') === 'multiple' ? 'multiple' : 'single';
    }

    set type(value) {
      const next = value === 'multiple' ? 'multiple' : 'single';
      if (next === this.type) {
        return;
      }
      this.setAttribute('type', next);
    }

    /**
     * Current value when in `single` mode.
     * @returns {string | null}
     */
    get value() {
      return this.#value;
    }

    set value(next) {
      if (this.type !== 'single') {
        return;
      }
      const normalized = next == null || next === '' ? null : String(next);
      if (this.#value === normalized) {
        return;
      }
      this.#value = normalized;
      this.#controlledSingle = true;
      this.#reflectAttribute('value', normalized);
      this.#syncSelection();
    }

    /**
     * Current values when in `multiple` mode.
     * @returns {string[]}
     */
    get values() {
      return Array.from(this.#values);
    }

    set values(next) {
      if (this.type !== 'multiple') {
        return;
      }
      const normalized = Array.isArray(next) ? next.map(String) : [];
      this.#values = new Set(normalized);
      this.#controlledMultiple = true;
      this.#reflectAttribute('values', normalized.join(' '));
      this.#syncSelection();
    }

    /**
     * Whether keyboard navigation should wrap around.
     * @returns {boolean}
     */
    get loop() {
      return this.#loop;
    }

    set loop(next) {
      this.#loop = Boolean(next);
      this.setAttribute('loop', this.#loop ? 'true' : 'false');
    }

    /**
     * Disabled state of the entire group.
     * @returns {boolean}
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(next) {
      if (next) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     * Orientation of the toggle group.
     * @returns {'horizontal' | 'vertical'}
     */
    get orientation() {
      return this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal';
    }

    set orientation(next) {
      const value = next === 'vertical' ? 'vertical' : 'horizontal';
      if (value === this.orientation) {
        return;
      }
      this.setAttribute('orientation', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      switch (name) {
        case 'type': {
          this.#controlledSingle = this.hasAttribute('value');
          this.#controlledMultiple = this.hasAttribute('values');
          this.#defaultApplied = false;
          this.#defaultMultipleApplied = false;
          this.#syncSelection();
          break;
        }
        case 'value': {
          if (this.#isReflecting) {
            return;
          }
          this.#controlledSingle = newValue !== null;
          this.#value = newValue ?? null;
          this.#syncSelection();
          break;
        }
        case 'values': {
          if (this.#isReflecting) {
            return;
          }
          this.#controlledMultiple = newValue !== null;
          this.#values = newValue
            ? new Set(newValue.split(/\s+/).filter(Boolean))
            : new Set();
          this.#syncSelection();
          break;
        }
        case 'default-value': {
          this.#defaultApplied = false;
          this.#syncSelection();
          break;
        }
        case 'default-values': {
          this.#defaultMultipleApplied = false;
          this.#syncSelection();
          break;
        }
        case 'disabled': {
          this.#applyDisabledState();
          this.#syncSelection();
          break;
        }
        case 'orientation': {
          this.#applyOrientation();
          break;
        }
        case 'loop': {
          this.#loop = newValue === null ? true : booleanAttribute(newValue);
          break;
        }
        default:
          break;
      }
    }

    /**
     * Reflects attribute changes while guarding against infinite loops.
     * @param {string} name
     * @param {string | null} value
     */
    #reflectAttribute(name, value) {
      this.#isReflecting = true;
      if (value === null) {
        this.removeAttribute(name);
      } else {
        this.setAttribute(name, value);
      }
      this.#isReflecting = false;
    }

    #applyOrientation() {
      const orientation = this.orientation;
      this.dataset.orientation = orientation;
      const root = /** @type {HTMLElement} */ (this.#root.querySelector('.toggle-group'));
      root?.setAttribute('aria-orientation', orientation);
      this.#items.forEach((item) => {
        item.setAttribute('data-orientation', orientation);
      });
    }

    #applyDisabledState() {
      const isDisabled = this.disabled;
      if (isDisabled) {
        this.dataset.disabled = 'true';
      } else {
        delete this.dataset.disabled;
      }
      if (isDisabled) {
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('aria-disabled');
      }
      this.#items.forEach((item) => {
        if (this.#isItemDisabled(item)) {
          item.setAttribute('data-disabled', 'true');
        } else {
          item.removeAttribute('data-disabled');
        }
      });
    }

    #handleSlotChange() {
      const assigned = this.#slot
        .assignedElements({ flatten: true })
        .filter((node) => node instanceof HTMLElement);

      const previous = new Set(this.#items);
      this.#items = [];

      for (const node of assigned) {
        if (previous.has(node)) {
          this.#items.push(node);
          previous.delete(node);
        } else {
          this.#setupItem(node);
          this.#items.push(node);
        }
      }

      previous.forEach((item) => this.#teardownItem(item));

      this.#updateItemPositions();
      this.#applyOrientation();
      this.#applyDisabledState();
      this.#syncSelection();
    }

    /**
     * @param {HTMLElement} item
     */
    #setupItem(item) {
      item.setAttribute('data-toggle-item', '');
      item.setAttribute('part', 'item');
      const roleAdded = !item.hasAttribute('role');
      if (roleAdded) {
        item.setAttribute('role', 'button');
      }
      const initialTabIndex = item.hasAttribute('tabindex') ? item.getAttribute('tabindex') : null;
      item.setAttribute('tabindex', item.getAttribute('tabindex') ?? '-1');

      const listeners = {
        click: (event) => {
          event.preventDefault();
          this.#handleItemActivation(item);
        },
        focus: () => {
          item.setAttribute('data-focus', 'true');
        },
        blur: () => {
          item.removeAttribute('data-focus');
        }
      };

      item.addEventListener('click', listeners.click);
      item.addEventListener('focus', listeners.focus);
      item.addEventListener('blur', listeners.blur);
      this.#itemState.set(item, {
        listeners,
        roleAdded,
        initialTabIndex
      });

      const value = this.#ensureItemValue(item);
      item.dataset.value = value;
      item.setAttribute('aria-pressed', 'false');
    }

    /**
     * @param {HTMLElement} item
     */
    #teardownItem(item) {
      const state = this.#itemState.get(item);
      if (state) {
        item.removeEventListener('click', state.listeners.click);
        item.removeEventListener('focus', state.listeners.focus);
        item.removeEventListener('blur', state.listeners.blur);
        if (state.roleAdded) {
          item.removeAttribute('role');
        }
        if (state.initialTabIndex === null) {
          item.removeAttribute('tabindex');
        } else {
          item.setAttribute('tabindex', state.initialTabIndex);
        }
        this.#itemState.delete(item);
      }
      item.removeAttribute('data-toggle-item');
      item.removeAttribute('data-position');
      item.removeAttribute('aria-pressed');
      item.removeAttribute('data-state');
      item.removeAttribute('data-focus');
      item.removeAttribute('data-disabled');
    }

    #updateItemPositions() {
      const total = this.#items.length;
      this.#items.forEach((item, index) => {
        if (total <= 1) {
          item.setAttribute('data-position', 'only');
        } else if (index === 0) {
          item.setAttribute('data-position', 'first');
        } else if (index === total - 1) {
          item.setAttribute('data-position', 'last');
        } else {
          item.setAttribute('data-position', 'middle');
        }
      });
    }

    /**
     * @param {KeyboardEvent} event
     */
    #handleKeydown(event) {
      const target = /** @type {HTMLElement | null} */ (event.target instanceof HTMLElement ? event.target : null);
      if (!target) {
        return;
      }
      const item = this.#items.find((candidate) => candidate === target || candidate.contains(target));
      if (!item) {
        return;
      }

      const key = event.key;
      const orientation = this.orientation;
      const horizontalNext = key === 'ArrowRight' && orientation === 'horizontal';
      const horizontalPrev = key === 'ArrowLeft' && orientation === 'horizontal';
      const verticalNext = key === 'ArrowDown' && orientation === 'vertical';
      const verticalPrev = key === 'ArrowUp' && orientation === 'vertical';

      if (horizontalNext || verticalNext) {
        event.preventDefault();
        this.#focusRelative(item, 1);
        return;
      }

      if (horizontalPrev || verticalPrev) {
        event.preventDefault();
        this.#focusRelative(item, -1);
        return;
      }

      if (key === 'Home') {
        event.preventDefault();
        this.#focusEdge('start');
        return;
      }

      if (key === 'End') {
        event.preventDefault();
        this.#focusEdge('end');
        return;
      }

      if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        this.#handleItemActivation(item);
      }
    }

    /**
     * @param {HTMLElement} item
     */
    #handleItemActivation(item) {
      if (this.disabled || this.#isItemDisabled(item)) {
        return;
      }

      const value = this.#getItemValue(item);

      if (this.type === 'single') {
        const nextValue = value === this.#value ? null : value;
        if (this.#controlledSingle) {
          this.#dispatchChange({ value: nextValue, values: nextValue ? [nextValue] : [] });
        } else {
          this.#value = nextValue;
          this.#syncSelection();
          this.#dispatchChange({ value: nextValue, values: nextValue ? [nextValue] : [] });
        }
      } else {
        const nextValues = new Set(this.#values);
        if (nextValues.has(value)) {
          nextValues.delete(value);
        } else {
          nextValues.add(value);
        }
        if (this.#controlledMultiple) {
          this.#dispatchChange({ value: value, values: Array.from(nextValues) });
        } else {
          this.#values = nextValues;
          this.#syncSelection();
          this.#dispatchChange({ value: value, values: Array.from(nextValues) });
        }
      }
    }

    /**
     * @param {{ value: string | null; values: string[] }} detail
     */
    #dispatchChange(detail) {
      this.dispatchEvent(
        new CustomEvent('wc-toggle-group-change', {
          bubbles: true,
          composed: true,
          detail
        })
      );
    }

    /**
     * Ensures an item has a stable value identifier.
     * @param {HTMLElement} item
     * @returns {string}
     */
    #ensureItemValue(item) {
      const provided = item.getAttribute('data-value') || item.getAttribute('value');
      if (provided && provided.trim()) {
        return provided.trim();
      }
      const existing = item.dataset.value;
      if (existing && existing.trim()) {
        return existing.trim();
      }
      const generated = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      item.dataset.value = generated;
      return generated;
    }

    /**
     * @param {HTMLElement} item
     * @returns {string}
     */
    #getItemValue(item) {
      const value = item.dataset.value || item.getAttribute('data-value') || item.getAttribute('value');
      return value ? value.trim() : this.#ensureItemValue(item);
    }

    /**
     * @param {HTMLElement} item
     * @returns {boolean}
     */
    #isItemDisabled(item) {
      return this.disabled || item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true';
    }

    #syncSelection() {
      if (!this.isConnected) {
        return;
      }

      if (this.type === 'single') {
        if (!this.#controlledSingle && !this.#defaultApplied) {
          const defaultValue = this.getAttribute('default-value');
          if (defaultValue) {
            this.#value = defaultValue;
          }
          this.#defaultApplied = true;
        }
        const currentValue = this.#value;
        this.#items.forEach((item) => {
          const value = this.#getItemValue(item);
          const isActive = currentValue !== null && value === currentValue;
          item.setAttribute('data-state', isActive ? 'on' : 'off');
          item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        this.#updateTabStops();
      } else {
        if (!this.#controlledMultiple && !this.#defaultMultipleApplied) {
          const defaultValues = this.getAttribute('default-values');
          if (defaultValues) {
            const set = new Set(defaultValues.split(/\s+/).filter(Boolean));
            this.#values = set;
          }
          this.#defaultMultipleApplied = true;
        }
        const activeValues = this.#values;
        this.#items.forEach((item) => {
          const value = this.#getItemValue(item);
          const isActive = activeValues.has(value);
          item.setAttribute('data-state', isActive ? 'on' : 'off');
          item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        this.#updateTabStops();
      }
    }

    #updateTabStops() {
      let focusTarget = this.#items.find((item) => item.getAttribute('data-state') === 'on');
      if (!focusTarget) {
        focusTarget = this.#items[0] ?? null;
      }
      this.#items.forEach((item) => {
        if (this.disabled || this.#isItemDisabled(item)) {
          item.setAttribute('tabindex', '-1');
          item.setAttribute('data-disabled', 'true');
        } else {
          item.removeAttribute('data-disabled');
          item.setAttribute('tabindex', item === focusTarget ? '0' : '-1');
        }
      });
    }

    /**
     * @param {HTMLElement} reference
     * @param {1 | -1} delta
     */
    #focusRelative(reference, delta) {
      if (this.#items.length === 0) {
        return;
      }
      const currentIndex = this.#items.indexOf(reference);
      if (currentIndex < 0) {
        return;
      }

      const total = this.#items.length;
      let nextIndex = currentIndex;
      let steps = 0;
      while (steps < total) {
        nextIndex = nextIndex + delta;
        if (this.#loop) {
          if (nextIndex < 0) {
            nextIndex = total - 1;
          } else if (nextIndex >= total) {
            nextIndex = 0;
          }
        } else if (nextIndex < 0 || nextIndex >= total) {
          return;
        }
        const candidate = this.#items[nextIndex];
        steps += 1;
        if (!this.#isItemDisabled(candidate)) {
          candidate.focus();
          return;
        }
      }
    }

    /**
     * @param {'start' | 'end'} edge
     */
    #focusEdge(edge) {
      const items = edge === 'start' ? this.#items : [...this.#items].reverse();
      for (const item of items) {
        if (!this.#isItemDisabled(item)) {
          item.focus();
          return;
        }
      }
    }
  }

  if (!customElements.get('wc-toggle-group')) {
    customElements.define('wc-toggle-group', WcToggleGroup);
  }
})();

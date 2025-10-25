/**
 * @file radio-group.js
 * @version 1.0.0
 *
 * Accessible radio group and radio item web components inspired by Radix UI.
 * Provides keyboard navigation, optional looping focus, form association,
 * and rich styling hooks via CSS custom properties and parts.
 *
 * Usage:
 * <wc-radio-group name="density" default-value="comfortable">
 *   <wc-radio-group-item value="default">Default</wc-radio-group-item>
 *   <wc-radio-group-item value="comfortable">Comfortable</wc-radio-group-item>
 *   <wc-radio-group-item value="compact">Compact</wc-radio-group-item>
 * </wc-radio-group>
 */

(() => {
  /** @type {boolean} */
  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  /**
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

  /**
   * @param {string | null} value
   * @returns {boolean}
   */
  const booleanAttribute = (value) => value !== null && value !== 'false';

  /**
   * @param {WcRadioGroupItem[]} items
   */
  const sortByDOMPosition = (items) =>
    items.sort((a, b) => {
      if (a === b) return 0;
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

  /**
   * Radio group item web component.
   */
  class WcRadioGroupItem extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {WcRadioGroup | null} */
    #group = null;
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #groupDisabled = false;
    /** @type {boolean} */
    #checked = false;
    /** @type {string} */
    #value = '';

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-radio-item-size: 25px;
            --wc-radio-item-indicator-size: 11px;
            --wc-radio-item-gap: 0.9rem;
            --wc-radio-item-radius: 999px;
            --wc-radio-item-background: #ffffff;
            --wc-radio-item-background-hover: rgba(79, 70, 229, 0.12);
            --wc-radio-item-border: 1px solid rgba(15, 23, 42, 0.12);
            --wc-radio-item-shadow: 0 2px 10px rgba(15, 23, 42, 0.16);
            --wc-radio-item-focus-ring: 0 0 0 4px rgba(79, 70, 229, 0.25);
            --wc-radio-item-indicator-color: #4f46e5;
            --wc-radio-item-label-color: inherit;
            display: inline-flex;
            align-items: center;
            gap: var(--wc-radio-item-gap);
            cursor: pointer;
            color: inherit;
            user-select: none;
            touch-action: manipulation;
            outline: none;
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-disabled="true"]) {
            cursor: not-allowed;
            opacity: 0.6;
          }

          :host(:focus-visible) [part="control"] {
            box-shadow: var(--wc-radio-item-focus-ring);
          }

          [part="item"] {
            display: inline-flex;
            align-items: center;
            gap: var(--wc-radio-item-gap);
          }

          [part="control"] {
            inline-size: var(--wc-radio-item-size);
            block-size: var(--wc-radio-item-size);
            border-radius: var(--wc-radio-item-radius);
            background: var(--wc-radio-item-background);
            border: var(--wc-radio-item-border);
            box-shadow: var(--wc-radio-item-shadow);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 160ms ease, border-color 160ms ease, transform 120ms ease;
          }

          :host(:where(:hover, [data-state="checked"])) [part="control"] {
            background: var(--wc-radio-item-background-hover);
          }

          [part="indicator"] {
            inline-size: 100%;
            block-size: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          [part="indicator"]::after {
            content: '';
            display: block;
            inline-size: var(--wc-radio-item-indicator-size);
            block-size: var(--wc-radio-item-indicator-size);
            border-radius: 999px;
            background: var(--wc-radio-item-indicator-color);
            transform: scale(0);
            transition: transform 120ms ease;
          }

          :host([data-state="checked"]) [part="indicator"]::after {
            transform: scale(1);
          }

          [part="label"] {
            color: var(--wc-radio-item-label-color);
            font: inherit;
            display: inline-flex;
            align-items: center;
          }
        </style>
        <span part="item">
          <span part="control" aria-hidden="true">
            <span part="indicator"></span>
          </span>
          <span part="label"><slot></slot></span>
        </span>
      `;

      this.setAttribute('role', 'radio');
      this.tabIndex = -1;

      this.addEventListener('click', (event) => {
        if (event.button !== 0) return;
        if (!this.#isInteractive()) return;
        this.#group?.selectItem(this, { origin: 'pointer' });
      });

      this.addEventListener('keydown', (event) => {
        if (!this.#isInteractive()) return;
        if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
          event.preventDefault();
          this.#group?.selectItem(this, { origin: 'keyboard' });
          return;
        }

        const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (navigationKeys.includes(event.key)) {
          event.preventDefault();
          this.#group?.navigateFrom(this, event.key);
        }
      });

      this.addEventListener('focus', () => {
        this.#group?.setActiveItem(this);
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'disabled');
      this.#notifyGroupOfRegistration();
      this.#syncAccessibility();
    }

    disconnectedCallback() {
      this.#group?.unregisterItem(this);
      this.#group = null;
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'value') {
        this.#value = newValue ?? '';
        if (this.#group) {
          this.#group.refresh();
        }
      }

      if (name === 'disabled') {
        this.#disabled = booleanAttribute(newValue);
        this.#syncDisabledState();
      }
    }

    /**
     * @returns {string}
     */
    get value() {
      return this.#value;
    }

    /**
     * @param {string} next
     */
    set value(next) {
      const normalized = next ?? '';
      if (normalized === this.#value) return;
      this.#value = normalized;
      this.setAttribute('value', normalized);
      this.#group?.refresh();
    }

    /**
     * @returns {boolean}
     */
    get disabled() {
      return this.#disabled;
    }

    /**
     * @param {boolean} next
     */
    set disabled(next) {
      this.toggleAttribute('disabled', next);
    }

    /**
     * @param {WcRadioGroup} group
     */
    attachToGroup(group) {
      this.#group = group;
      this.#groupDisabled = group.disabled;
      this.#syncDisabledState();
      this.#syncAccessibility();
    }

    detachFromGroup() {
      this.#group = null;
      this.#groupDisabled = false;
      this.tabIndex = -1;
    }

    /**
     * @param {boolean} state
     */
    setChecked(state) {
      this.#checked = state;
      this.setAttribute('aria-checked', state ? 'true' : 'false');
      this.dataset.state = state ? 'checked' : 'unchecked';
    }

    /**
     * @param {boolean} focusable
     */
    setTabStop(focusable) {
      this.tabIndex = focusable ? 0 : -1;
    }

    /**
     * @param {boolean} groupDisabled
     */
    setGroupDisabled(groupDisabled) {
      this.#groupDisabled = groupDisabled;
      this.#syncDisabledState();
    }

    /**
     * @returns {boolean}
     */
    isChecked() {
      return this.#checked;
    }

    focusItem() {
      this.focus();
    }

    #notifyGroupOfRegistration() {
      if (!this.isConnected) return;
      const group = this.closest('wc-radio-group');
      if (group && group instanceof HTMLElement) {
        this.#group = /** @type {WcRadioGroup} */ (group);
        this.#group.registerItem(this);
      }
    }

    #syncDisabledState() {
      const disabled = this.#disabled || this.#groupDisabled;
      if (disabled) {
        this.setAttribute('aria-disabled', 'true');
        this.dataset.disabled = 'true';
      } else {
        this.removeAttribute('aria-disabled');
        delete this.dataset.disabled;
      }
    }

    #syncAccessibility() {
      this.setAttribute('aria-checked', this.#checked ? 'true' : 'false');
      this.dataset.state = this.#checked ? 'checked' : 'unchecked';
    }

    #isInteractive() {
      return !(this.#disabled || this.#groupDisabled);
    }
  }

  /**
   * Form-associated radio group web component.
   */
  class WcRadioGroup extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return ['value', 'default-value', 'disabled', 'required', 'orientation', 'name', 'loop'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {ElementInternals | null} */
    #internals = null;
    /** @type {WcRadioGroupItem[]} */
    #items = [];
    /** @type {string} */
    #value = '';
    /** @type {string} */
    #defaultValue = '';
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #required = false;
    /** @type {boolean} */
    #loop = true;
    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {string} */
    #orientation = 'vertical';

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-radio-group-gap: 0.75rem;
            --wc-radio-group-direction: column;
            display: inline-flex;
            flex-direction: var(--wc-radio-group-direction);
            gap: var(--wc-radio-group-gap);
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-orientation="horizontal"]) {
            --wc-radio-group-direction: row;
          }

          [part="root"] {
            display: inline-flex;
            flex-direction: inherit;
            gap: inherit;
          }
        </style>
        <div part="root" role="presentation">
          <slot></slot>
        </div>
      `;

      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals may not exist in older TS libs.
        this.#internals = this.attachInternals();
      }

      this.setAttribute('role', 'radiogroup');

      this.#slot.addEventListener('slotchange', () => {
        this.refresh();
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'defaultValue');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'required');
      upgradeProperty(this, 'orientation');
      upgradeProperty(this, 'name');
      upgradeProperty(this, 'loop');

      this.#applyDefaultValue();
      this.#updateDisabledState();
      this.#updateOrientation();
      this.refresh();
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'value':
          if (this.#reflectingValue) return;
          this.value = newValue ?? '';
          break;
        case 'default-value':
          this.#defaultValue = newValue ?? '';
          this.#applyDefaultValue();
          break;
        case 'disabled':
          this.#disabled = booleanAttribute(newValue);
          this.#updateDisabledState();
          this.refresh();
          break;
        case 'required':
          this.#required = booleanAttribute(newValue);
          this.#updateValidity();
          break;
        case 'orientation':
          this.#orientation = newValue === 'horizontal' ? 'horizontal' : 'vertical';
          this.#updateOrientation();
          break;
        case 'name':
          this.#updateFormValue();
          break;
        case 'loop':
          this.#loop = newValue === null ? true : booleanAttribute(newValue);
          break;
      }
    }

    /**
     * @returns {string}
     */
    get value() {
      return this.#value;
    }

    /**
     * @param {string} next
     */
    set value(next) {
      const normalized = next ?? '';
      if (normalized === this.#value) return;
      this.#value = normalized;
      this.#reflectingValue = true;
      if (normalized) {
        this.setAttribute('value', normalized);
      } else {
        this.removeAttribute('value');
      }
      this.#reflectingValue = false;
      this.refresh();
      this.#updateFormValue();
    }

    /**
     * @returns {string}
     */
    get defaultValue() {
      return this.#defaultValue;
    }

    /**
     * @param {string} value
     */
    set defaultValue(value) {
      const normalized = value ?? '';
      this.#defaultValue = normalized;
      if (normalized) {
        this.setAttribute('default-value', normalized);
      } else {
        this.removeAttribute('default-value');
      }
      this.#applyDefaultValue();
    }

    /**
     * @returns {boolean}
     */
    get disabled() {
      return this.#disabled;
    }

    /**
     * @param {boolean} state
     */
    set disabled(state) {
      this.toggleAttribute('disabled', state);
    }

    /**
     * @returns {boolean}
     */
    get required() {
      return this.#required;
    }

    /**
     * @param {boolean} state
     */
    set required(state) {
      this.toggleAttribute('required', state);
    }

    /**
     * @returns {string}
     */
    get orientation() {
      return this.#orientation;
    }

    /**
     * @param {'horizontal' | 'vertical'} value
     */
    set orientation(value) {
      if (value !== 'horizontal' && value !== 'vertical') {
        this.setAttribute('orientation', 'vertical');
        return;
      }
      this.setAttribute('orientation', value);
    }

    /**
     * @returns {string}
     */
    get name() {
      return this.getAttribute('name') ?? '';
    }

    /**
     * @param {string} value
     */
    set name(value) {
      if (value) {
        this.setAttribute('name', value);
      } else {
        this.removeAttribute('name');
      }
    }

    /**
     * @returns {boolean}
     */
    get loop() {
      return this.#loop;
    }

    /**
     * @param {boolean} value
     */
    set loop(value) {
      if (value) {
        this.setAttribute('loop', '');
      } else {
        this.setAttribute('loop', 'false');
      }
    }

    /**
     * @param {WcRadioGroupItem} item
     */
    registerItem(item) {
      if (!this.#items.includes(item)) {
        this.#items.push(item);
        item.attachToGroup(this);
        sortByDOMPosition(this.#items);
        this.refresh();
      }
    }

    /**
     * @param {WcRadioGroupItem} item
     */
    unregisterItem(item) {
      const index = this.#items.indexOf(item);
      if (index !== -1) {
        this.#items.splice(index, 1);
        item.detachFromGroup();
        this.refresh();
      }
    }

    refresh() {
      sortByDOMPosition(this.#items);
      const checkedItem = this.#items.find((item) => item.value === this.#value);
      if (!checkedItem && this.#value) {
        this.#value = '';
        this.#reflectingValue = true;
        this.removeAttribute('value');
        this.#reflectingValue = false;
      }

      let firstFocusable = null;
      let activeItem = checkedItem ?? null;

      for (const item of this.#items) {
        const isDisabled = item.disabled || this.#disabled;
        item.setGroupDisabled(this.#disabled);
        const isChecked = item.value === this.#value;
        item.setChecked(isChecked);
        if (!firstFocusable && !isDisabled) {
          firstFocusable = item;
        }
      }

      if (!activeItem) {
        activeItem = firstFocusable;
      }

      for (const item of this.#items) {
        const isTabStop = activeItem ? item === activeItem : item === firstFocusable;
        item.setTabStop(isTabStop && !this.#disabled && !item.disabled);
      }

      if (!this.#value && activeItem && !activeItem.disabled && !this.#disabled) {
        this.#value = activeItem.value;
        this.#reflectingValue = true;
        if (this.#value) {
          this.setAttribute('value', this.#value);
        } else {
          this.removeAttribute('value');
        }
        this.#reflectingValue = false;
      }

      this.#updateFormValue();
    }

    /**
     * @param {WcRadioGroupItem} item
     * @param {{ origin: 'pointer' | 'keyboard' }} options
     */
    selectItem(item, options) {
      if (this.#disabled || item.disabled) return;
      if (item.value === this.#value) {
        this.setActiveItem(item);
        return;
      }

      this.#value = item.value;
      this.#reflectingValue = true;
      if (this.#value) {
        this.setAttribute('value', this.#value);
      } else {
        this.removeAttribute('value');
      }
      this.#reflectingValue = false;
      this.refresh();
      this.setActiveItem(item);
      this.#updateFormValue();

      const detail = { value: this.#value, origin: options.origin };
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
      this.dispatchEvent(
        new CustomEvent('wc-radio-group-value-change', {
          detail,
          bubbles: true,
          composed: true
        })
      );
    }

    /**
     * @param {WcRadioGroupItem} item
     * @param {string} key
     */
    navigateFrom(item, key) {
      if (!this.#items.length) return;
      const index = this.#items.indexOf(item);
      if (index === -1) return;

      const orientation = this.#orientation;
      const horizontal = orientation === 'horizontal';

      /** @type {WcRadioGroupItem | null} */
      let target = null;

      const forwardKeys = horizontal ? ['ArrowRight', 'ArrowDown'] : ['ArrowDown', 'ArrowRight'];
      const backwardKeys = horizontal ? ['ArrowLeft', 'ArrowUp'] : ['ArrowUp', 'ArrowLeft'];

      if (forwardKeys.includes(key)) {
        target = this.#findNextEnabled(index + 1, 1);
      } else if (backwardKeys.includes(key)) {
        target = this.#findNextEnabled(index - 1, -1);
      } else if (key === 'Home') {
        target = this.#findNextEnabled(0, 1);
      } else if (key === 'End') {
        target = this.#findNextEnabled(this.#items.length - 1, -1);
      }

      if (target) {
        target.focusItem();
        this.selectItem(target, { origin: 'keyboard' });
      }
    }

    /**
     * @param {WcRadioGroupItem} item
     */
    setActiveItem(item) {
      for (const candidate of this.#items) {
        const isTabStop = candidate === item && !this.#disabled && !candidate.disabled;
        candidate.setTabStop(isTabStop);
      }
    }

    #findNextEnabled(startIndex, step) {
      if (!this.#items.length) return null;
      const max = this.#items.length;
      let index = startIndex;

      const visited = new Set();

      while (index >= 0 && index < max) {
        const candidate = this.#items[index];
        visited.add(candidate);
        if (!candidate.disabled && !this.#disabled) {
          return candidate;
        }
        index += step;
      }

      if (!this.#loop) return null;

      index = step > 0 ? 0 : max - 1;
      while (index >= 0 && index < max) {
        const candidate = this.#items[index];
        if (visited.has(candidate)) break;
        if (!candidate.disabled && !this.#disabled) {
          return candidate;
        }
        index += step;
      }

      return null;
    }

    #applyDefaultValue() {
      if (this.#value) return;
      if (this.hasAttribute('value')) return;
      if (!this.#defaultValue) return;
      this.#value = this.#defaultValue;
      this.#reflectingValue = true;
      this.setAttribute('value', this.#value);
      this.#reflectingValue = false;
      this.refresh();
    }

    #updateDisabledState() {
      if (this.#disabled) {
        this.dataset.disabled = 'true';
        this.setAttribute('aria-disabled', 'true');
      } else {
        delete this.dataset.disabled;
        this.removeAttribute('aria-disabled');
      }
      for (const item of this.#items) {
        item.setGroupDisabled(this.#disabled);
      }
      this.#updateFormValue();
    }

    #updateOrientation() {
      this.dataset.orientation = this.#orientation;
      if (this.#orientation === 'horizontal') {
        this.setAttribute('aria-orientation', 'horizontal');
      } else {
        this.removeAttribute('aria-orientation');
      }
    }

    #updateFormValue() {
      if (this.#internals) {
        if (this.#disabled || !this.#value) {
          this.#internals.setFormValue(null);
        } else {
          this.#internals.setFormValue(this.#value);
        }
      }
      this.#updateValidity();
    }

    #updateValidity() {
      if (!this.#internals) return;
      if (this.#disabled || !this.#required || this.#value) {
        this.#internals.setValidity({});
      } else {
        this.#internals.setValidity(
          { valueMissing: true },
          'Please select an option from the group.',
          this.#items.find((item) => !item.disabled) ?? null
        );
      }
    }
  }

  if (!customElements.get('wc-radio-group')) {
    customElements.define('wc-radio-group', WcRadioGroup);
  }

  if (!customElements.get('wc-radio-group-item')) {
    customElements.define('wc-radio-group-item', WcRadioGroupItem);
  }
})();

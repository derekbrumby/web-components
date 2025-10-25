/**
 * @file dropdown-menu.js
 * @version 1.0.0
 *
 * Accessible dropdown menu web component suite inspired by Radix UI primitives.
 * Provides a root controller (<wc-dropdown-menu>) with composable parts to
 * build complex menus featuring submenus, checkboxes and radio groups while
 * remaining framework agnostic.
 *
 * Usage example:
 * <wc-dropdown-menu>
 *   <button slot="trigger">Actions</button>
 *   <wc-dropdown-item shortcut="⌘+T">New Tab</wc-dropdown-item>
 *   <wc-dropdown-separator></wc-dropdown-separator>
 *   <wc-dropdown-checkbox-item checked>Show Bookmarks</wc-dropdown-checkbox-item>
 *   <wc-dropdown-radio-group value="pedro">
 *     <wc-dropdown-radio-item value="pedro">Pedro Duarte</wc-dropdown-radio-item>
 *     <wc-dropdown-radio-item value="colm">Colm Tuite</wc-dropdown-radio-item>
 *   </wc-dropdown-radio-group>
 * </wc-dropdown-menu>
 */

(() => {
  /**
   * Ensures that properties set before upgrade are re-applied after the
   * custom element definition.
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
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  const isFocusable = (element) => {
    return !element.hasAttribute('disabled');
  };

  /**
   * Dispatches a custom event from an element.
   * @param {HTMLElement} element
   * @param {string} name
   * @param {any} detail
   */
  const emit = (element, name, detail) => {
    element.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  };

  /**
   * Returns whether the user clicked inside the provided root node.
   * @param {Node} root
   * @param {EventTarget | null} target
   */
  const isEventInside = (root, target) => {
    if (!(target instanceof Node)) return false;
    if (root === target) return true;
    if (root.contains(target)) return true;
    if (root instanceof HTMLElement && root.shadowRoot) {
      return root.shadowRoot.contains(target);
    }
    return false;
  };

  const MENU_ITEM_SELECTOR = [
    'wc-dropdown-item',
    'wc-dropdown-checkbox-item',
    'wc-dropdown-radio-item',
    'wc-dropdown-submenu',
  ].join(',');

  /**
   * Base class shared by individual menu item components.
   */
  class DropdownMenuItemBase extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #button;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            --dropdown-item-radius: var(--wc-dropdown-item-radius, 6px);
            --dropdown-item-padding: var(--wc-dropdown-item-padding, 0.375rem 0.5rem 0.375rem 1.5rem);
            --dropdown-item-color: var(--wc-dropdown-item-color, #312e81);
            --dropdown-item-background: var(--wc-dropdown-item-background, transparent);
            --dropdown-item-background-hover: var(--wc-dropdown-item-background-hover, rgba(79, 70, 229, 0.12));
            --dropdown-item-background-active: var(--wc-dropdown-item-background-active, rgba(79, 70, 229, 0.18));
            --dropdown-item-shortcut-color: var(--wc-dropdown-item-shortcut-color, #6b7280);
            color: inherit;
          }

          button {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            justify-content: space-between;
            border-radius: var(--dropdown-item-radius);
            padding: var(--dropdown-item-padding);
            color: inherit;
            background: var(--dropdown-item-background);
            cursor: pointer;
            font: inherit;
            line-height: 1.25;
            position: relative;
          }

          button:hover {
            background: var(--dropdown-item-background-hover);
          }

          button:active {
            background: var(--dropdown-item-background-active);
          }

          :host([data-disabled]) button {
            opacity: 0.4;
            cursor: not-allowed;
          }

          button:focus-visible {
            outline: var(--wc-dropdown-focus-outline, 2px solid #6366f1);
            outline-offset: 2px;
          }

          span[part="shortcut"] {
            margin-left: auto;
            color: var(--dropdown-item-shortcut-color);
            font-size: 0.875em;
          }

          ::slotted([slot="start"]) {
            margin-right: 0.5rem;
            flex: none;
          }

          [part="indicator"] {
            position: absolute;
            inset-inline-start: 0.5rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1rem;
            height: 1rem;
          }
        </style>
        <button type="button" part="button" tabindex="-1" role="menuitem" aria-disabled="false">
          <span part="indicator" hidden></span>
          <slot name="start"></slot>
          <span part="label"><slot></slot></span>
          <slot name="end"></slot>
          <span part="shortcut"></span>
        </button>
      `;
      this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
      this.#button.addEventListener('click', (event) => {
        if (this.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        this.onSelect(event);
      });
    }

    /**
     * Hook executed when the item is activated via click or keyboard.
     * @param {MouseEvent | KeyboardEvent} event
     */
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    onSelect(event) {}

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'presentation');
      }
      this.#syncShortcut();
      this.#applyAriaState();
    }

    static get observedAttributes() {
      return ['shortcut', 'disabled'];
    }

    attributeChangedCallback(name) {
      if (name === 'shortcut') {
        this.#syncShortcut();
      }
      if (name === 'disabled') {
        this.#applyAriaState();
      }
    }

    /**
     * Allows the parent menu to forward focus to the internal control.
     */
    focus() {
      this.#button.focus();
    }

    /**
     * Programmatically click the menu item.
     */
    click() {
      this.#button.click();
    }

    /** @returns {boolean} */
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

    /**
     * Synchronises the shortcut label visibility.
     */
    #syncShortcut() {
      const shortcut = this.getAttribute('shortcut');
      const shortcutEl = /** @type {HTMLSpanElement} */ (
        this.#root.querySelector('[part="shortcut"]')
      );
      if (shortcut) {
        shortcutEl.textContent = shortcut;
        shortcutEl.hidden = false;
      } else {
        shortcutEl.textContent = '';
        shortcutEl.hidden = true;
      }
    }

    #applyAriaState() {
      this.toggleAttribute('data-disabled', this.disabled);
      this.#button.ariaDisabled = this.disabled ? 'true' : 'false';
    }

    /**
     * Updates the indicator content. Items that need to expose an indicator
     * can override this to toggle visibility.
     * @param {string | null} content
     */
    setIndicator(content) {
      const indicator = /** @type {HTMLSpanElement} */ (
        this.#root.querySelector('[part="indicator"]')
      );
      if (content) {
        indicator.textContent = content;
        indicator.hidden = false;
      } else {
        indicator.textContent = '';
        indicator.hidden = true;
      }
    }

    /**
     * Gives access to the internal button element for subclasses.
     * @returns {HTMLButtonElement}
     */
    get button() {
      return this.#button;
    }

    /**
     * Provides the component shadow root for subclasses to extend templates.
     * @returns {ShadowRoot}
     */
    get root() {
      return this.#root;
    }
  }

  class WcDropdownItem extends DropdownMenuItemBase {
    onSelect() {
      emit(this, 'wc-dropdown-select', { item: this });
    }
  }

  class WcDropdownCheckboxItem extends DropdownMenuItemBase {
    static get observedAttributes() {
      return ['checked', 'indeterminate', 'disabled'];
    }

    constructor() {
      super();
      this.button.setAttribute('role', 'menuitemcheckbox');
    }

    connectedCallback() {
      super.connectedCallback();
      this.#syncIndicator();
    }

    /**
     * @returns {boolean | 'indeterminate'}
     */
    get checked() {
      if (this.hasAttribute('indeterminate')) return 'indeterminate';
      return this.hasAttribute('checked');
    }

    set checked(value) {
      if (value === 'indeterminate') {
        this.setAttribute('indeterminate', '');
        this.setAttribute('checked', '');
      } else if (value) {
        this.setAttribute('checked', '');
        this.removeAttribute('indeterminate');
      } else {
        this.removeAttribute('checked');
        this.removeAttribute('indeterminate');
      }
      this.#syncIndicator();
    }

    attributeChangedCallback(name) {
      if (name === 'checked' || name === 'indeterminate') {
        this.#syncIndicator();
      }
      super.attributeChangedCallback(name);
    }

    onSelect(event) {
      event.preventDefault();
      if (this.checked === 'indeterminate' || this.checked === true) {
        this.checked = false;
      } else {
        this.checked = true;
      }
      emit(this, 'wc-dropdown-checkbox-change', {
        checked: this.checked,
        item: this,
      });
      emit(this, 'wc-dropdown-select', { item: this });
    }

    #syncIndicator() {
      if (this.checked === 'indeterminate') {
        this.setIndicator('–');
        this.button.setAttribute('aria-checked', 'mixed');
      } else if (this.checked === true) {
        this.setIndicator('✔');
        this.button.setAttribute('aria-checked', 'true');
      } else {
        this.setIndicator(null);
        this.button.setAttribute('aria-checked', 'false');
      }
    }
  }

  class WcDropdownRadioGroup extends HTMLElement {
    static get observedAttributes() {
      return ['value'];
    }

    connectedCallback() {
      this.setAttribute('role', 'presentation');
      this.#refreshItems();
    }

    attributeChangedCallback() {
      this.#refreshItems();
    }

    /**
     * @returns {string | null}
     */
    get value() {
      return this.getAttribute('value');
    }

    set value(value) {
      if (value == null) {
        this.removeAttribute('value');
      } else {
        this.setAttribute('value', value);
      }
    }

    #refreshItems() {
      const items = /** @type {NodeListOf<WcDropdownRadioItem>} */ (
        this.querySelectorAll('wc-dropdown-radio-item')
      );
      items.forEach((item) => {
        item.group = this;
      });
    }
  }

  class WcDropdownRadioItem extends DropdownMenuItemBase {
    /** @type {WcDropdownRadioGroup | null} */
    #group = null;

    constructor() {
      super();
      this.button.setAttribute('role', 'menuitemradio');
    }

    connectedCallback() {
      super.connectedCallback();
      this.#syncState();
    }

    static get observedAttributes() {
      return ['value', 'disabled'];
    }

    /** @returns {string | null} */
    get value() {
      return this.getAttribute('value');
    }

    set value(value) {
      if (value == null) {
        this.removeAttribute('value');
      } else {
        this.setAttribute('value', value);
      }
    }

    /** @returns {WcDropdownRadioGroup | null} */
    get group() {
      return this.#group;
    }

    set group(group) {
      this.#group = group;
      this.#syncState();
    }

    onSelect(event) {
      event.preventDefault();
      if (!this.group || this.disabled) return;
      const nextValue = this.value;
      if (nextValue == null) return;
      this.group.value = nextValue;
      emit(this, 'wc-dropdown-radio-change', {
        value: nextValue,
        item: this,
      });
      emit(this, 'wc-dropdown-select', { item: this });
      this.#syncPeers();
    }

    attributeChangedCallback(name) {
      if (name === 'value') {
        this.#syncState();
      }
      super.attributeChangedCallback(name);
    }

    #syncPeers() {
      if (!this.group) return;
      const peers = /** @type {NodeListOf<WcDropdownRadioItem>} */ (
        this.group.querySelectorAll('wc-dropdown-radio-item')
      );
      peers.forEach((item) => item.#syncState());
    }

    #syncState() {
      const isChecked = this.group?.value === this.value;
      this.setIndicator(isChecked ? '•' : null);
      this.button.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    }
  }

  class WcDropdownLabel extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host {
            display: block;
            padding: var(--wc-dropdown-label-padding, 0.25rem 0.75rem);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--wc-dropdown-label-color, #6b7280);
          }
        </style>
        <span part="label"><slot></slot></span>
      `;
    }
  }

  class WcDropdownSeparator extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host {
            display: block;
            margin: var(--wc-dropdown-separator-margin, 0.35rem 0);
            height: 1px;
            background: var(--wc-dropdown-separator-color, rgba(99, 102, 241, 0.25));
          }
        </style>
      `;
    }
  }

  class WcDropdownSubmenu extends DropdownMenuItemBase {
    /** @type {HTMLDivElement} */
    #panel;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {boolean} */
    #open = false;

    constructor() {
      super();
      this.button.setAttribute('aria-haspopup', 'menu');
      this.button.setAttribute('aria-expanded', 'false');
      const indicator = document.createElement('span');
      indicator.setAttribute('part', 'submenu-indicator');
      indicator.setAttribute('aria-hidden', 'true');
      indicator.textContent = '›';
      this.button.appendChild(indicator);
      this.setAttribute('role', 'presentation');

      const submenuStyle = document.createElement('style');
      submenuStyle.textContent = `
        :host {
          position: relative;
          display: block;
        }

        .submenu {
          position: absolute;
          top: 0;
          inset-inline-start: 100%;
          min-width: var(--wc-dropdown-width, 220px);
          border-radius: var(--wc-dropdown-radius, 12px);
          border: 1px solid rgba(99, 102, 241, 0.15);
          background: var(--wc-dropdown-background, #fff);
          box-shadow: var(--wc-dropdown-shadow, 0 10px 38px -10px rgba(15, 23, 42, 0.35), 0 10px 20px -15px rgba(15, 23, 42, 0.2));
          padding: var(--wc-dropdown-padding, 0.5rem);
          display: none;
          z-index: 40;
        }

        .submenu[data-open] {
          display: block;
          animation: var(--wc-dropdown-animation, fadeIn 120ms ease-out);
        }
      `;
      this.root.appendChild(submenuStyle);

      this.#panel = document.createElement('div');
      this.#panel.className = 'submenu';
      this.#panel.setAttribute('part', 'submenu');
      this.#panel.setAttribute('role', 'menu');
      this.#slot = document.createElement('slot');
      this.#slot.name = 'submenu';
      this.#panel.appendChild(this.#slot);
      this.root.appendChild(this.#panel);
    }

    connectedCallback() {
      super.connectedCallback();
      this.button.addEventListener('pointerenter', () => {
        if (!this.disabled) this.open = true;
      });
      this.#panel.addEventListener('pointerenter', () => {
        if (!this.disabled) this.open = true;
      });
      const closeIfOutside = (target) => {
        if (!isEventInside(this, target)) {
          this.open = false;
        }
      };
      this.button.addEventListener('pointerleave', (event) => {
        closeIfOutside(event.relatedTarget);
      });
      this.#panel.addEventListener('pointerleave', (event) => {
        closeIfOutside(event.relatedTarget);
      });
      this.button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          this.open = true;
          this.focusFirstItem();
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.open = false;
          this.button.focus();
        }
      });
      this.addEventListener('wc-dropdown-select', () => {
        this.open = false;
      });
    }

    onSelect(event) {
      event.preventDefault();
      this.open = !this.open;
      if (this.open) {
        this.focusFirstItem();
      }
    }

    get open() {
      return this.#open;
    }

    set open(value) {
      this.#open = Boolean(value);
      this.toggleAttribute('data-open', this.#open);
      this.button.setAttribute('aria-expanded', this.#open ? 'true' : 'false');
      this.#panel.toggleAttribute('data-open', this.#open);
      this.#panel.style.display = this.#open ? 'block' : 'none';
    }

    focusFirstItem() {
      const nodes = this.#slot?.assignedElements({ flatten: true }) ?? [];
      const focusable = nodes.filter((node) =>
        node.matches?.(MENU_ITEM_SELECTOR) && isFocusable(/** @type {HTMLElement} */ (node)),
      );
      focusable[0]?.focus();
    }
  }

  class WcDropdownMenu extends HTMLElement {
    static get observedAttributes() {
      return ['open'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #trigger;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {(event: Event) => void} */
    #outsideHandler;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            position: relative;
            display: inline-block;
            --wc-dropdown-width: 220px;
            --wc-dropdown-radius: 12px;
            --wc-dropdown-background: #fff;
            --wc-dropdown-padding: 0.5rem;
            --wc-dropdown-shadow: 0 10px 38px -10px rgba(15, 23, 42, 0.35), 0 10px 20px -15px rgba(15, 23, 42, 0.2);
            --wc-dropdown-border-color: rgba(99, 102, 241, 0.18);
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="trigger"] {
            display: inline-flex;
          }

          button[part="trigger-button"] {
            all: unset;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 35px;
            height: 35px;
            border-radius: 9999px;
            background: var(--wc-dropdown-trigger-background, #fff);
            color: var(--wc-dropdown-trigger-color, #312e81);
            box-shadow: var(--wc-dropdown-trigger-shadow, 0 2px 10px rgba(15, 23, 42, 0.15));
            cursor: pointer;
          }

          button[part="trigger-button"]:hover {
            background: var(--wc-dropdown-trigger-background-hover, rgba(129, 140, 248, 0.2));
          }

          button[part="trigger-button"]:focus-visible {
            outline: var(--wc-dropdown-focus-outline, 2px solid #6366f1);
            outline-offset: 2px;
          }

          [part="content"] {
            position: absolute;
            top: calc(100% + var(--wc-dropdown-offset, 0.35rem));
            inset-inline-end: 0;
            min-width: var(--wc-dropdown-width);
            border-radius: var(--wc-dropdown-radius);
            border: 1px solid var(--wc-dropdown-border-color);
            background: var(--wc-dropdown-background);
            padding: var(--wc-dropdown-padding);
            box-shadow: var(--wc-dropdown-shadow);
            z-index: 20;
            display: none;
          }

          [part="content"][data-open] {
            display: block;
            animation: var(--wc-dropdown-animation, fadeIn 120ms ease-out);
            transform-origin: top right;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        </style>
        <div part="trigger">
          <slot name="trigger"></slot>
          <button part="trigger-button" type="button" aria-haspopup="menu" aria-expanded="false" hidden>
            <slot name="trigger-icon">☰</slot>
          </button>
        </div>
        <div part="content" role="menu" aria-hidden="true">
          <slot></slot>
        </div>
      `;
      this.#trigger = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector('button[part="trigger-button"]')
      );
      this.#content = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="content"]'));
      this.#outsideHandler = (event) => {
        if (!this.open) return;
        if (!isEventInside(this, event.target)) {
          this.open = false;
        }
      };

      this.#trigger.addEventListener('click', () => this.toggle());
      this.#trigger.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.open = true;
          this.focusFirstItem();
        }
      });
      this.addEventListener('wc-dropdown-select', () => {
        this.open = false;
        this.#trigger.focus();
      });
      this.addEventListener('keydown', (event) => this.#handleKeydown(event));

      const triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      triggerSlot.addEventListener('slotchange', () => this.#toggleFallbackTrigger());
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      this.#toggleFallbackTrigger();
      document.addEventListener('pointerdown', this.#outsideHandler);
      document.addEventListener('focusin', this.#outsideHandler);
    }

    disconnectedCallback() {
      document.removeEventListener('pointerdown', this.#outsideHandler);
      document.removeEventListener('focusin', this.#outsideHandler);
    }

    attributeChangedCallback() {
      this.#syncOpenState();
    }

    /** @returns {boolean} */
    get open() {
      return this.hasAttribute('open');
    }

    set open(value) {
      this.toggleAttribute('open', Boolean(value));
      this.#syncOpenState();
      emit(this, 'wc-dropdown-toggle', { open: this.open });
    }

    toggle() {
      this.open = !this.open;
    }

    #toggleFallbackTrigger() {
      const triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      const assigned = triggerSlot.assignedElements({ flatten: true });
      const hasCustomTrigger = assigned.length > 0;
      this.#trigger.hidden = hasCustomTrigger;
      if (hasCustomTrigger) {
        assigned.forEach((el) => {
          el.setAttribute('aria-haspopup', 'menu');
          el.setAttribute('aria-expanded', this.open ? 'true' : 'false');
          if (!el.hasAttribute('data-wc-dropdown-trigger')) {
            el.addEventListener('click', () => this.toggle());
            el.addEventListener('keydown', (event) => {
              if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.open = true;
                this.focusFirstItem();
              }
            });
            el.setAttribute('data-wc-dropdown-trigger', '');
          }
        });
      }
    }

    #syncOpenState() {
      const open = this.open;
      this.#content.toggleAttribute('data-open', open);
      this.#content.setAttribute('aria-hidden', open ? 'false' : 'true');
      const triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      const assigned = triggerSlot.assignedElements({ flatten: true });
      if (assigned.length) {
        assigned.forEach((el) => el.setAttribute('aria-expanded', open ? 'true' : 'false'));
      } else {
        this.#trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (!open) {
        this.removeAttribute('data-open');
        const submenus = /** @type {NodeListOf<WcDropdownSubmenu>} */ (
          this.querySelectorAll('wc-dropdown-submenu')
        );
        submenus.forEach((submenu) => {
          submenu.open = false;
        });
      } else {
        this.setAttribute('data-open', '');
      }
    }

    #handleKeydown(event) {
      if (!this.open) {
        if (event.target === this && event.key === 'ArrowDown') {
          event.preventDefault();
          this.open = true;
          this.focusFirstItem();
        }
        return;
      }
      switch (event.key) {
        case 'Escape':
          event.stopPropagation();
          this.open = false;
          this.focusTrigger();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.focusNextItem();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.focusPreviousItem();
          break;
        case 'Home':
          event.preventDefault();
          this.focusFirstItem();
          break;
        case 'End':
          event.preventDefault();
          this.focusLastItem();
          break;
        default:
          break;
      }
    }

    focusTrigger() {
      const triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      const assigned = triggerSlot.assignedElements({ flatten: true });
      if (assigned.length) {
        const focusableTrigger = /** @type {HTMLElement} */ (assigned[0]);
        focusableTrigger.focus();
      } else {
        this.#trigger.focus();
      }
    }

    focusFirstItem() {
      const items = this.#getMenuItems();
      items[0]?.focus();
    }

    focusLastItem() {
      const items = this.#getMenuItems();
      items[items.length - 1]?.focus();
    }

    focusNextItem() {
      const items = this.#getMenuItems();
      if (items.length === 0) return;
      const active = /** @type {HTMLElement | null} */ (document.activeElement);
      const index = items.findIndex((item) => item === active || item.contains(active));
      const nextIndex = index >= 0 ? (index + 1) % items.length : 0;
      items[nextIndex]?.focus();
    }

    focusPreviousItem() {
      const items = this.#getMenuItems();
      if (items.length === 0) return;
      const active = /** @type {HTMLElement | null} */ (document.activeElement);
      const index = items.findIndex((item) => item === active || item.contains(active));
      const prevIndex = index >= 0 ? (index - 1 + items.length) % items.length : 0;
      items[prevIndex]?.focus();
    }

    /**
     * Returns menu items assigned into the default slot that are not disabled.
     * @returns {HTMLElement[]}
     */
    #getMenuItems() {
      const slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
      const nodes = slot.assignedElements({ flatten: true });
      /** @type {HTMLElement[]} */
      const items = [];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('wc-dropdown-radio-group')) {
          const radios = node.querySelectorAll('wc-dropdown-radio-item');
          radios.forEach((radio) => {
            if (isFocusable(radio)) items.push(radio);
          });
          continue;
        }
        if (node.matches(MENU_ITEM_SELECTOR) && isFocusable(node)) {
          items.push(node);
        }
      }
      return items;
    }
  }

  const registry = [
    ['wc-dropdown-menu', WcDropdownMenu],
    ['wc-dropdown-item', WcDropdownItem],
    ['wc-dropdown-checkbox-item', WcDropdownCheckboxItem],
    ['wc-dropdown-radio-group', WcDropdownRadioGroup],
    ['wc-dropdown-radio-item', WcDropdownRadioItem],
    ['wc-dropdown-label', WcDropdownLabel],
    ['wc-dropdown-separator', WcDropdownSeparator],
    ['wc-dropdown-submenu', WcDropdownSubmenu],
  ];

  for (const [tag, ctor] of registry) {
    if (!customElements.get(tag)) {
      customElements.define(tag, ctor);
    }
  }
})();

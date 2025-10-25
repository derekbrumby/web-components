/**
 * @file tabs.js
 * @version 1.0.0
 *
 * Accessible tabs component inspired by Radix UI Tabs. Provides a root controller
 * (<wc-tabs>) with supporting elements (<wc-tablist>, <wc-tab>, and <wc-tabpanel>).
 * Features automatic/manual activation, horizontal/vertical orientation, keyboard
 * navigation, and rich styling hooks via CSS custom properties and ::part selectors.
 */

(() => {
  /**
   * Ensures property setters run when an element is upgraded.
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

  /**
   * @param {string | null} value
   * @returns {"horizontal"|"vertical"}
   */
  const normalizeOrientation = (value) =>
    value === 'vertical' ? 'vertical' : 'horizontal';

  /**
   * @param {string | null} value
   * @returns {"automatic"|"manual"}
   */
  const normalizeActivationMode = (value) =>
    value === 'manual' ? 'manual' : 'automatic';

  /**
   * @param {unknown} value
   * @returns {string}
   */
  const toValue = (value) => (typeof value === 'string' ? value : value == null ? '' : String(value));

  let tabTriggerCount = 0;
  let tabPanelCount = 0;

  if (!customElements.get('wc-tab')) {
    class WcTab extends HTMLElement {
      static get observedAttributes() {
        return ['value', 'disabled'];
      }

      /** @type {ShadowRoot} */
      #root;
      /** @type {HTMLButtonElement} */
      #button;
      /** @type {string} */
      #value = '';
      /** @type {boolean} */
      #disabled = false;
      /** @type {string} */
      #triggerId;

      constructor() {
        super();
        this.#triggerId = `wc-tab-trigger-${++tabTriggerCount}`;
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.innerHTML = `
          <style>
            :host {
              display: block;
              --tab-padding: var(--tabs-trigger-padding, 0.75rem 1.25rem);
              --tab-font-size: var(--tabs-trigger-font-size, 0.95rem);
              --tab-font-weight: var(--tabs-trigger-font-weight, 500);
              --tab-color: var(--tabs-trigger-color, #4b5563);
              --tab-color-active: var(--tabs-trigger-active-color, #4c1d95);
              --tab-background: var(--tabs-trigger-background, transparent);
              --tab-background-hover: var(--tabs-trigger-background-hover, rgba(99, 102, 241, 0.08));
              --tab-background-active: var(--tabs-trigger-background-active, rgba(99, 102, 241, 0.12));
              --tab-radius: var(--tabs-trigger-radius, 0);
              --tab-focus-ring: var(--tabs-trigger-focus-ring, 0 0 0 2px rgba(67, 56, 202, 0.35));
              color: inherit;
            }

            [part="trigger"] {
              all: unset;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: var(--tabs-trigger-gap, 0.35rem);
              padding: var(--tab-padding);
              font: inherit;
              font-size: var(--tab-font-size);
              font-weight: var(--tab-font-weight);
              color: var(--tab-color);
              background: var(--tab-background);
              border-radius: var(--tab-radius);
              cursor: pointer;
              transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease;
            }

            [part="trigger"]:hover {
              background: var(--tab-background-hover);
            }

            :host([data-state="active"]) [part="trigger"] {
              color: var(--tab-color-active);
              background: var(--tab-background-active);
              box-shadow: var(--tabs-trigger-active-shadow, inset 0 -2px 0 currentColor);
            }

            :host([data-orientation="vertical"]) [part="trigger"] {
              justify-content: flex-start;
              width: 100%;
            }

            :host([data-disabled]) [part="trigger"] {
              cursor: not-allowed;
              opacity: 0.55;
            }

            [part="trigger"]:focus-visible {
              outline: none;
              box-shadow: var(--tab-focus-ring);
            }

            ::slotted(*) {
              color: inherit;
            }
          </style>
          <button part="trigger" type="button" role="tab" id="${this.#triggerId}">
            <slot></slot>
          </button>
        `;
        this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
        this.#button.addEventListener('click', () => {
          if (this.disabled) return;
          this.#emitActivate('pointer');
        });
        this.#button.addEventListener('keydown', (event) => {
          if (this.disabled) return;
          if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
            event.preventDefault();
            this.#emitActivate('keyboard');
          }
        });
        this.#button.addEventListener('focus', () => {
          this.dispatchEvent(
            new CustomEvent('wc-tab-focus', {
              detail: { value: this.value },
              bubbles: true,
              composed: true,
            })
          );
        });
      }

      connectedCallback() {
        upgradeProperty(this, 'value');
        upgradeProperty(this, 'disabled');
        this.setAttribute('role', 'presentation');
        this.#updateDisabledState();
      }

      disconnectedCallback() {
        this.#button.blur();
      }

      attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'value') {
          this.#value = toValue(newValue);
        } else if (name === 'disabled') {
          this.#disabled = newValue !== null;
          this.#updateDisabledState();
        }
      }

      get value() {
        return this.#value;
      }

      set value(value) {
        const next = toValue(value);
        if (next === this.#value) {
          return;
        }
        this.#value = next;
        if (next) {
          this.setAttribute('value', next);
        } else {
          this.removeAttribute('value');
        }
      }

      get disabled() {
        return this.#disabled;
      }

      set disabled(state) {
        const next = Boolean(state);
        if (next === this.#disabled) {
          return;
        }
        this.#disabled = next;
        this.toggleAttribute('disabled', next);
        this.#updateDisabledState();
      }

      /** @returns {string} */
      get triggerId() {
        return this.#triggerId;
      }

      focus() {
        this.#button.focus();
      }

      /**
       * Updates ARIA state, focusability, and orientation styling.
       * @param {{ selected: boolean; focusable: boolean; orientation: "horizontal"|"vertical" }} state
       */
      update(state) {
        const { selected, focusable, orientation } = state;
        this.setAttribute('data-state', selected ? 'active' : 'inactive');
        this.setAttribute('data-orientation', orientation);
        if (this.#disabled) {
          this.setAttribute('data-disabled', '');
          this.#button.setAttribute('aria-disabled', 'true');
        } else {
          this.removeAttribute('data-disabled');
          this.#button.removeAttribute('aria-disabled');
        }
        this.#button.setAttribute('aria-selected', selected ? 'true' : 'false');
        this.#button.tabIndex = focusable && !this.#disabled ? 0 : -1;
      }

      /**
       * Links the trigger to its associated panel.
       * @param {string} panelId
       */
      setControls(panelId) {
        if (panelId) {
          this.#button.setAttribute('aria-controls', panelId);
        } else {
          this.#button.removeAttribute('aria-controls');
        }
      }

      /**
       * @param {'pointer' | 'keyboard'} origin
       */
      #emitActivate(origin) {
        this.dispatchEvent(
          new CustomEvent('wc-tab-activate', {
            detail: { value: this.value, origin },
            bubbles: true,
            composed: true,
          })
        );
      }

      #updateDisabledState() {
        if (this.#disabled) {
          this.setAttribute('data-disabled', '');
          this.#button.setAttribute('aria-disabled', 'true');
          this.#button.tabIndex = -1;
        } else {
          this.removeAttribute('data-disabled');
          this.#button.removeAttribute('aria-disabled');
        }
      }
    }

    customElements.define('wc-tab', WcTab);
  }

  if (!customElements.get('wc-tablist')) {
    class WcTablist extends HTMLElement {
      static get observedAttributes() {
        return ['aria-label', 'aria-labelledby'];
      }

      /** @type {ShadowRoot} */
      #root;
      /** @type {HTMLElement} */
      #list;

      constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.innerHTML = `
          <style>
            :host {
              display: block;
              color: inherit;
              --tablist-background: var(--tabs-list-background, rgba(255, 255, 255, 0.9));
              --tablist-border: var(--tabs-list-border, 1px solid rgba(148, 163, 184, 0.45));
            }

            [part="list"] {
              display: flex;
              align-items: stretch;
              justify-content: stretch;
              gap: var(--tabs-list-gap, 0);
              border-bottom: var(--tablist-border);
              background: var(--tablist-background);
            }

            :host([data-orientation="vertical"]) [part="list"] {
              flex-direction: column;
              border-bottom: none;
              border-right: var(--tablist-border);
              min-width: var(--tabs-list-min-width, 12rem);
            }

            ::slotted(wc-tab) {
              flex: 1;
            }

            :host([data-orientation="vertical"]) ::slotted(wc-tab) {
              flex: initial;
            }
          </style>
          <div part="list" role="tablist">
            <slot></slot>
          </div>
        `;
        this.#list = /** @type {HTMLElement} */ (this.#root.querySelector('[part="list"]'));
      }

      connectedCallback() {
        this.setAttribute('role', 'presentation');
        this.#syncAriaAttributes();
      }

      attributeChangedCallback(name, _oldValue, newValue) {
        if (!this.#list) {
          return;
        }
        if (newValue == null) {
          this.#list.removeAttribute(name);
        } else {
          this.#list.setAttribute(name, newValue);
        }
      }

      /**
       * @param {{ orientation: "horizontal"|"vertical" }} state
       */
      update(state) {
        const { orientation } = state;
        this.setAttribute('data-orientation', orientation);
        if (this.#list) {
          this.#list.setAttribute('aria-orientation', orientation);
        }
      }

      #syncAriaAttributes() {
        if (!this.#list) {
          return;
        }
        ['aria-label', 'aria-labelledby'].forEach((name) => {
          const value = this.getAttribute(name);
          if (value == null) {
            this.#list.removeAttribute(name);
          } else {
            this.#list.setAttribute(name, value);
          }
        });
      }
    }

    customElements.define('wc-tablist', WcTablist);
  }

  if (!customElements.get('wc-tabpanel')) {
    class WcTabpanel extends HTMLElement {
      static get observedAttributes() {
        return ['value'];
      }

      /** @type {ShadowRoot} */
      #root;
      /** @type {HTMLElement} */
      #panel;
      /** @type {string} */
      #value = '';
      /** @type {string} */
      #panelId;

      constructor() {
        super();
        this.#panelId = `wc-tabpanel-${++tabPanelCount}`;
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.innerHTML = `
          <style>
            :host {
              display: block;
              color: inherit;
            }

            :host([data-state="inactive"]) {
              display: none;
            }

            [part="panel"] {
              display: block;
              padding: var(--tabs-panel-padding, 1.25rem);
              background: var(--tabs-panel-background, #ffffff);
              color: var(--tabs-panel-color, #1f2937);
              border-radius: var(--tabs-panel-radius, 0 0 0.75rem 0.75rem);
              box-shadow: var(--tabs-panel-shadow, none);
              outline: none;
              transition: box-shadow 160ms ease;
            }

            :host([data-orientation="vertical"]) [part="panel"] {
              border-radius: var(--tabs-panel-radius-vertical, 0 0.75rem 0.75rem 0);
            }

            [part="panel"]:focus-visible {
              outline: none;
              box-shadow: var(--tabs-panel-focus-ring, 0 0 0 2px rgba(67, 56, 202, 0.35));
            }

            ::slotted(*) {
              color: inherit;
            }
          </style>
          <div part="panel" id="${this.#panelId}" role="tabpanel" tabindex="0">
            <slot></slot>
          </div>
        `;
        this.#panel = /** @type {HTMLElement} */ (this.#root.querySelector('[part="panel"]'));
      }

      connectedCallback() {
        upgradeProperty(this, 'value');
        this.setAttribute('role', 'presentation');
      }

      attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'value') {
          this.#value = toValue(newValue);
        }
      }

      get value() {
        return this.#value;
      }

      set value(value) {
        const next = toValue(value);
        if (next === this.#value) {
          return;
        }
        this.#value = next;
        if (next) {
          this.setAttribute('value', next);
        } else {
          this.removeAttribute('value');
        }
      }

      /** @returns {string} */
      get panelId() {
        return this.#panelId;
      }

      /**
       * Updates orientation, selection state, and labelling.
       * @param {{ selected: boolean; orientation: "horizontal"|"vertical"; labelledBy: string | null }} state
       */
      update(state) {
        const { selected, orientation, labelledBy } = state;
        this.setAttribute('data-state', selected ? 'active' : 'inactive');
        this.setAttribute('data-orientation', orientation);
        this.toggleAttribute('hidden', !selected);
        if (this.#panel) {
          this.#panel.tabIndex = selected ? 0 : -1;
          this.#panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
          if (labelledBy) {
            this.#panel.setAttribute('aria-labelledby', labelledBy);
          } else {
            this.#panel.removeAttribute('aria-labelledby');
          }
        }
      }
    }

    customElements.define('wc-tabpanel', WcTabpanel);
  }

  if (customElements.get('wc-tabs')) {
    return;
  }

  class WcTabs extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'orientation', 'activation-mode', 'default-value'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {WcTablist | null} */
    #tablist = null;
    /** @type {WcTab[]} */
    #tabs = [];
    /** @type {WcTabpanel[]} */
    #panels = [];
    /** @type {string} */
    #value = '';
    /** @type {string} */
    #focusedValue = '';
    /** @type {"horizontal"|"vertical"} */
    #orientation = 'horizontal';
    /** @type {"automatic"|"manual"} */
    #activationMode = 'automatic';
    /** @type {MutationObserver | null} */
    #observer = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-block;
            max-width: var(--tabs-max-width, 100%);
            color: inherit;
            font-family: inherit;
          }

          [part="container"] {
            display: flex;
            flex-direction: column;
            width: var(--tabs-width, 100%);
            background: var(--tabs-background, #ffffff);
            border-radius: var(--tabs-radius, 0.75rem);
            border: var(--tabs-border, 1px solid rgba(148, 163, 184, 0.35));
            box-shadow: var(--tabs-shadow, 0 12px 32px -20px rgba(15, 23, 42, 0.35));
            overflow: hidden;
          }

          :host([data-orientation="vertical"]) [part="container"] {
            flex-direction: row;
          }

          ::slotted(wc-tablist) {
            flex: none;
          }

          :host([data-orientation="vertical"]) ::slotted(wc-tablist) {
            flex: none;
          }

          ::slotted(wc-tabpanel) {
            flex: 1;
          }
        </style>
        <div part="container">
          <slot></slot>
        </div>
      `;
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));

      this.#handleSlotChange = this.#handleSlotChange.bind(this);
      this.#handleTabActivate = this.#handleTabActivate.bind(this);
      this.#handleTabFocus = this.#handleTabFocus.bind(this);
      this.#handleKeydown = this.#handleKeydown.bind(this);
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'orientation');
      upgradeProperty(this, 'activationMode');
      upgradeProperty(this, 'defaultValue');

      this.addEventListener('wc-tab-activate', this.#handleTabActivate);
      this.addEventListener('wc-tab-focus', this.#handleTabFocus);
      this.addEventListener('keydown', this.#handleKeydown);
      this.#slot.addEventListener('slotchange', this.#handleSlotChange);

      this.#observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'childList') {
            this.#syncElements();
            return;
          }
          if (record.type === 'attributes') {
            this.#applyState();
            return;
          }
        }
      });

      this.#observer.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value', 'disabled'],
      });

      if (!this.#value) {
        const initial = this.getAttribute('default-value') || this.getAttribute('value') || '';
        this.#value = toValue(initial);
        this.#focusedValue = this.#value;
      }

      this.#syncElements();
    }

    disconnectedCallback() {
      this.removeEventListener('wc-tab-activate', this.#handleTabActivate);
      this.removeEventListener('wc-tab-focus', this.#handleTabFocus);
      this.removeEventListener('keydown', this.#handleKeydown);
      this.#slot.removeEventListener('slotchange', this.#handleSlotChange);
      if (this.#observer) {
        this.#observer.disconnect();
        this.#observer = null;
      }
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'value') {
        this.#value = toValue(newValue);
        if (!this.#focusedValue) {
          this.#focusedValue = this.#value;
        }
        this.#applyState();
      } else if (name === 'orientation') {
        this.#orientation = normalizeOrientation(newValue);
        this.#applyState();
      } else if (name === 'activation-mode') {
        this.#activationMode = normalizeActivationMode(newValue);
      } else if (name === 'default-value') {
        if (!this.#value) {
          this.#value = toValue(newValue);
          this.#focusedValue = this.#value;
          this.#applyState();
        }
      }
    }

    get value() {
      return this.#value;
    }

    set value(value) {
      const next = toValue(value);
      if (!next) {
        if (this.hasAttribute('value')) {
          this.removeAttribute('value');
        }
        return;
      }
      if (this.getAttribute('value') !== next) {
        this.setAttribute('value', next);
      }
    }

    get orientation() {
      return this.#orientation;
    }

    set orientation(value) {
      const next = normalizeOrientation(toValue(value));
      if (this.getAttribute('orientation') !== next) {
        this.setAttribute('orientation', next);
      }
    }

    /**
     * @returns {"automatic"|"manual"}
     */
    get activationMode() {
      return this.#activationMode;
    }

    set activationMode(value) {
      const next = normalizeActivationMode(toValue(value));
      if (this.getAttribute('activation-mode') !== next) {
        this.setAttribute('activation-mode', next);
      }
    }

    get defaultValue() {
      return this.getAttribute('default-value') || '';
    }

    set defaultValue(value) {
      const next = toValue(value);
      if (next) {
        this.setAttribute('default-value', next);
      } else {
        this.removeAttribute('default-value');
      }
    }

    /**
     * Syncs slotted tab elements.
     */
    #syncElements() {
      const tablists = Array.from(this.querySelectorAll(':scope > wc-tablist'));
      this.#tablist = tablists[0] ?? null;
      this.#tabs = this.#tablist
        ? Array.from(this.#tablist.querySelectorAll(':scope > wc-tab'))
        : [];
      this.#panels = Array.from(this.querySelectorAll(':scope > wc-tabpanel'));
      this.#applyState();
    }

    /**
     * Applies orientation, selection, and linkage state to tabs and panels.
     */
    #applyState() {
      if (!this.isConnected) {
        return;
      }

      this.setAttribute('data-orientation', this.#orientation);
      if (this.#value) {
        this.setAttribute('data-value', this.#value);
      } else {
        this.removeAttribute('data-value');
      }

      if (this.#tablist && typeof this.#tablist.update === 'function') {
        this.#tablist.update({ orientation: this.#orientation });
      }

      const enabledTabs = this.#tabs.filter((tab) => !tab.disabled);

      if (!this.#value && enabledTabs.length > 0) {
        this.#value = enabledTabs[0].value;
        this.#focusedValue = this.#value;
        if (this.getAttribute('value') !== this.#value) {
          this.setAttribute('value', this.#value);
        }
      }

      const hasActive = enabledTabs.some((tab) => tab.value === this.#value);
      if (!hasActive && enabledTabs.length > 0) {
        this.#value = enabledTabs[0].value;
        this.#focusedValue = this.#value;
        if (this.getAttribute('value') !== this.#value) {
          this.setAttribute('value', this.#value);
        }
      }

      if (!this.#focusedValue || !enabledTabs.some((tab) => tab.value === this.#focusedValue)) {
        this.#focusedValue = enabledTabs[0]?.value || this.#value;
      }

      const panelMap = new Map(this.#panels.map((panel) => [panel.value, panel]));

      for (const tab of this.#tabs) {
        const selected = tab.value === this.#value && !tab.disabled;
        const focusable = tab.value === this.#focusedValue && !tab.disabled;
        tab.update({ selected, focusable, orientation: this.#orientation });
        const panel = panelMap.get(tab.value);
        if (panel) {
          tab.setControls(panel.panelId);
        } else {
          tab.setControls('');
        }
      }

      for (const panel of this.#panels) {
        const matchingTab = this.#tabs.find((tab) => tab.value === panel.value && !tab.disabled);
        const selected = Boolean(matchingTab && matchingTab.value === this.#value);
        panel.update({
          selected,
          orientation: this.#orientation,
          labelledBy: matchingTab ? matchingTab.triggerId : null,
        });
      }
    }

    /** @param {Event} event */
    #handleSlotChange(event) {
      event.stopPropagation();
      this.#syncElements();
    }

    /** @param {CustomEvent<{ value: string }>} event */
    #handleTabActivate(event) {
      event.stopPropagation();
      const value = toValue(event.detail?.value);
      const tab = this.#tabs.find((candidate) => candidate.value === value && !candidate.disabled);
      if (!tab) {
        return;
      }
      this.#focusedValue = value;
      if (this.#value === value) {
        this.#applyState();
        return;
      }
      this.#setValue(value, true);
    }

    /** @param {CustomEvent<{ value: string }>} event */
    #handleTabFocus(event) {
      event.stopPropagation();
      const value = toValue(event.detail?.value);
      if (!value) {
        return;
      }
      const tab = this.#tabs.find((candidate) => candidate.value === value && !candidate.disabled);
      if (!tab) {
        return;
      }
      this.#focusedValue = value;
      this.#applyState();
    }

    /** @param {KeyboardEvent} event */
    #handleKeydown(event) {
      const path = event.composedPath();
      const tab = /** @type {WcTab | undefined} */ (
        path.find((node) => node instanceof HTMLElement && node.tagName === 'WC-TAB')
      );
      if (!tab || tab.disabled) {
        return;
      }

      const horizontalKeys = new Set(['ArrowLeft', 'ArrowRight']);
      const verticalKeys = new Set(['ArrowUp', 'ArrowDown']);
      const isHorizontal = this.#orientation === 'horizontal';

      if (event.key === 'Home') {
        event.preventDefault();
        this.#focusByIndex(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        this.#focusByIndex(this.#tabs.filter((candidate) => !candidate.disabled).length - 1);
        return;
      }

      if (isHorizontal && horizontalKeys.has(event.key)) {
        event.preventDefault();
        this.#moveFocus(tab, event.key === 'ArrowLeft' ? -1 : 1);
        return;
      }

      if (!isHorizontal && verticalKeys.has(event.key)) {
        event.preventDefault();
        this.#moveFocus(tab, event.key === 'ArrowUp' ? -1 : 1);
        return;
      }

      if (isHorizontal && verticalKeys.has(event.key)) {
        event.preventDefault();
        this.#moveFocus(tab, event.key === 'ArrowUp' ? -1 : 1);
        return;
      }

      if (!isHorizontal && horizontalKeys.has(event.key)) {
        event.preventDefault();
        this.#moveFocus(tab, event.key === 'ArrowLeft' ? -1 : 1);
      }
    }

    /**
     * @param {WcTab} tab
     * @param {number} delta
     */
    #moveFocus(tab, delta) {
      const enabledTabs = this.#tabs.filter((candidate) => !candidate.disabled);
      if (enabledTabs.length === 0) {
        return;
      }
      const currentIndex = enabledTabs.indexOf(tab);
      const nextIndex = (currentIndex + delta + enabledTabs.length) % enabledTabs.length;
      const nextTab = enabledTabs[nextIndex];
      this.#focusedValue = nextTab.value;
      this.#applyState();
      nextTab.focus();
      if (this.#activationMode === 'automatic') {
        this.#setValue(nextTab.value, true);
      }
    }

    /**
     * @param {number} index
     */
    #focusByIndex(index) {
      const enabledTabs = this.#tabs.filter((candidate) => !candidate.disabled);
      if (enabledTabs.length === 0) {
        return;
      }
      const clampedIndex = Math.max(0, Math.min(index, enabledTabs.length - 1));
      const nextTab = enabledTabs[clampedIndex];
      this.#focusedValue = nextTab.value;
      this.#applyState();
      nextTab.focus();
      if (this.#activationMode === 'automatic') {
        this.#setValue(nextTab.value, true);
      }
    }

    /**
     * @param {string} value
     * @param {boolean} emit
     */
    #setValue(value, emit) {
      const next = toValue(value);
      if (!next) {
        return;
      }
      if (this.#value === next) {
        return;
      }
      this.#value = next;
      this.#focusedValue = next;
      if (this.getAttribute('value') !== next) {
        this.setAttribute('value', next);
      } else {
        this.#applyState();
      }
      if (emit) {
        this.dispatchEvent(
          new CustomEvent('wc-tabs-change', {
            detail: { value: this.#value },
            bubbles: true,
            composed: true,
          })
        );
      }
    }
  }

  customElements.define('wc-tabs', WcTabs);
})();

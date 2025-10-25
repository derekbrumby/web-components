/**
 * @file select.js
 * @version 1.0.0
 *
 * Accessible select web component suite inspired by Radix UI. Provides a
 * trigger button that opens a listbox with grouped options, typeahead search,
 * keyboard navigation, and rich styling hooks via CSS custom properties and
 * parts. Ships with supporting elements: <wc-select-option>,
 * <wc-select-group>, and <wc-select-separator>.
 *
 * Example usage:
 * <wc-select placeholder="Select a fruit…">
 *   <wc-select-group label="Fruits">
 *     <wc-select-option value="apple">Apple</wc-select-option>
 *   </wc-select-group>
 *   <wc-select-separator></wc-select-separator>
 *   <wc-select-option value="carrot" disabled>Carrot</wc-select-option>
 * </wc-select>
 */

(() => {
  /**
   * Upgrades a property that may have been set before the element definition
   * was registered so that the setter runs once the component upgrades.
   *
   * @param {HTMLElement} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /** @type {number} */
  let optionId = 0;

  /**
   * Generates a stable id for select options.
   * @returns {string}
   */
  const nextOptionId = () => {
    optionId += 1;
    return `wc-select-option-${optionId}`;
  };

  /**
   * Determines whether the provided event occurred within the component tree.
   * @param {HTMLElement} element
   * @param {Event} event
   * @returns {boolean}
   */
  const isEventInside = (element, event) => {
    const target = event.target;
    if (!(target instanceof Node)) return false;
    if (element === target) return true;
    if (element.contains(target)) return true;
    if (element.shadowRoot && element.shadowRoot.contains(target)) return true;
    const path = event.composedPath();
    return path.includes(element);
  };

  /**
   * Normalizes text for searching.
   * @param {string} value
   * @returns {string}
   */
  const normalize = (value) => value.trim().toLowerCase();

  /**
   * Select option element representing a single choice in the listbox.
   */
  class WcSelectOption extends HTMLElement {
    static get observedAttributes() {
      return ['disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSpanElement} */
    #indicator;
    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --option-radius: var(--wc-select-option-radius, 6px);
            --option-padding: var(--wc-select-option-padding, 0.25rem 0.75rem 0.25rem 2rem);
            --option-color: var(--wc-select-option-color, #4338ca);
            --option-background: var(--wc-select-option-background, transparent);
            --option-highlighted-background: var(--wc-select-option-highlighted-background, rgba(79, 70, 229, 0.18));
            --option-highlighted-color: var(--wc-select-option-highlighted-color, #1e1b4b);
            --option-disabled-color: var(--wc-select-option-disabled-color, rgba(71, 85, 105, 0.5));
            --option-indicator-color: var(--wc-select-option-indicator-color, #4338ca);
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .option {
            position: relative;
            border-radius: var(--option-radius);
            padding: var(--option-padding);
            font: inherit;
            color: var(--option-color);
            background: var(--option-background);
            line-height: 1.4;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: background 120ms ease, color 120ms ease;
          }

          .option::before {
            content: '';
            position: absolute;
            inset-block: 50%;
            inset-inline-start: 0.65rem;
            inline-size: 1rem;
            block-size: 1rem;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .indicator {
            position: absolute;
            inset-inline-start: 0.65rem;
            inset-block-start: 50%;
            transform: translateY(-50%);
            inline-size: 1rem;
            block-size: 1rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--option-indicator-color);
            font-size: 0.9rem;
            opacity: 0;
            transition: opacity 120ms ease;
          }

          :host([data-selected="true"]) .indicator {
            opacity: 1;
          }

          :host([data-highlighted="true"]) .option {
            background: var(--option-highlighted-background);
            color: var(--option-highlighted-color);
          }

          :host([disabled]) .option {
            color: var(--option-disabled-color);
            cursor: not-allowed;
          }

          :host([disabled]) .indicator {
            opacity: 0;
          }

          .text {
            display: inline-flex;
            align-items: center;
            min-inline-size: 0;
            flex: 1 1 auto;
          }

          slot::slotted(*) {
            font: inherit;
          }
        </style>
        <div class="option" part="option">
          <span class="indicator" part="indicator" aria-hidden="true">✓</span>
          <span class="text" part="text"><slot></slot></span>
        </div>
      `;

      this.#indicator = /** @type {HTMLSpanElement} */ (
        this.#root.querySelector('.indicator')
      );

      this.addEventListener('pointerdown', (event) => {
        if (this.disabled) {
          event.preventDefault();
        }
      });
    }

    connectedCallback() {
      if (!this.id) {
        this.id = nextOptionId();
      }
      this.setAttribute('role', 'option');
      this.setAttribute('tabindex', '-1');
      this.#renderDisabledState();
      this.#renderSelection(false);
    }

    attributeChangedCallback(name) {
      if (name === 'disabled') {
        this.#renderDisabledState();
      }
    }

    /**
     * Returns the option value.
     * @returns {string}
     */
    get value() {
      return this.getAttribute('value') ?? '';
    }

    /**
     * Sets the option value.
     * @param {string} value
     */
    set value(value) {
      this.setAttribute('value', value);
    }

    /**
     * Indicates whether the option is disabled.
     * @returns {boolean}
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     * Toggles the disabled state.
     * @param {boolean} value
     */
    set disabled(value) {
      this.toggleAttribute('disabled', value);
    }

    /**
     * Readable text used for typeahead searching.
     * @returns {string}
     */
    get textValue() {
      const override = this.getAttribute('text-value');
      if (override) return override;
      const text = this.textContent ?? '';
      return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Applies the highlighted state styles.
     * @param {boolean} value
     */
    setHighlighted(value) {
      if (value) {
        this.setAttribute('data-highlighted', 'true');
      } else {
        this.removeAttribute('data-highlighted');
      }
      this.classList.toggle('is-highlighted', value);
    }

    /**
     * Applies the selected state styles.
     * @param {boolean} value
     */
    setSelected(value) {
      this.#renderSelection(value);
    }

    /**
     * Updates aria attributes for disabled state.
     */
    #renderDisabledState() {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      if (this.disabled) {
        this.setAttribute('data-disabled', 'true');
      } else {
        this.removeAttribute('data-disabled');
      }
    }

    /**
     * Updates selection styling and aria attributes.
     * @param {boolean} selected
     */
    #renderSelection(selected) {
      this.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (selected) {
        this.setAttribute('data-selected', 'true');
      } else {
        this.removeAttribute('data-selected');
      }
    }
  }

  /**
   * Visual separator used within the listbox to divide option groups.
   */
  class WcSelectSeparator extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 0.35rem 0.65rem;
          }

          .separator {
            inline-size: 100%;
            block-size: 1px;
            background: var(--wc-select-separator-color, rgba(79, 70, 229, 0.16));
          }
        </style>
        <div class="separator" part="separator" role="separator" aria-hidden="true"></div>
      `;
    }
  }

  /**
   * Group wrapper that provides a label for sets of options.
   */
  class WcSelectGroup extends HTMLElement {
    static get observedAttributes() {
      return ['label'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #label;
    /** @type {HTMLDivElement} */
    #group;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      const labelId = `wc-select-group-${Math.random().toString(36).slice(2, 9)}`;
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            padding-block: 0.35rem;
          }

          .group {
            display: grid;
            gap: 0.25rem;
          }

          .label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            color: var(--wc-select-group-label-color, #6366f1);
            padding-inline: 0.75rem;
          }

          .options {
            display: grid;
            gap: 0.15rem;
          }
        </style>
        <div class="group" part="group" role="group" aria-labelledby="${labelId}">
          <div class="label" part="label" id="${labelId}"></div>
          <div class="options" part="group-options"><slot></slot></div>
        </div>
      `;
      this.#label = /** @type {HTMLDivElement} */ (this.#root.querySelector('.label'));
      this.#group = /** @type {HTMLDivElement} */ (this.#root.querySelector('.group'));
    }

    connectedCallback() {
      this.#applyLabel();
    }

    attributeChangedCallback(name) {
      if (name === 'label') {
        this.#applyLabel();
      }
    }

    #applyLabel() {
      const label = this.getAttribute('label') ?? '';
      this.#label.textContent = label;
      if (label) {
        this.#group.removeAttribute('aria-label');
      } else {
        this.#group.setAttribute('aria-label', '');
      }
    }
  }

  /**
   * Main select element responsible for managing trigger, content, and option
   * interactions.
   */
  class WcSelect extends HTMLElement {
    static get observedAttributes() {
      return ['placeholder', 'value', 'disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #trigger;
    /** @type {HTMLSpanElement} */
    #valueEl;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {WcSelectOption[]} */
    #options = [];
    /** @type {WcSelectOption | null} */
    #highlighted = null;
    /** @type {boolean} */
    #open = false;
    /** @type {string} */
    #typeahead = '';
    /** @type {number | undefined} */
    #typeaheadTimeout;
    /** @type {string} */
    #listboxId;
    /** @type {(event: PointerEvent) => void} */
    #handleDocumentPointerDown;
    /** @type {(event: FocusEvent) => void} */
    #handleDocumentFocusIn;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#listboxId = `wc-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-select-trigger-height: 2.25rem;
            --wc-select-trigger-padding: 0 0.9rem;
            --wc-select-trigger-radius: 0.65rem;
            --wc-select-trigger-background: #ffffff;
            --wc-select-trigger-color: #4338ca;
            --wc-select-trigger-placeholder: rgba(99, 102, 241, 0.8);
            --wc-select-trigger-border: 1px solid rgba(99, 102, 241, 0.2);
            --wc-select-trigger-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
            --wc-select-trigger-focus-ring: 0 0 0 2px rgba(79, 70, 229, 0.35);
            --wc-select-content-background: #ffffff;
            --wc-select-content-border: 1px solid rgba(99, 102, 241, 0.2);
            --wc-select-content-radius: 0.75rem;
            --wc-select-content-shadow: 0 22px 50px -25px rgba(30, 64, 175, 0.4);
            --wc-select-viewport-padding: 0.35rem;
            --wc-select-viewport-max-height: 260px;
            --wc-select-icon-color: rgba(79, 70, 229, 0.9);
            display: inline-block;
            position: relative;
            font-family: inherit;
            color: inherit;
            min-inline-size: 12rem;
          }

          :host([hidden]) {
            display: none !important;
          }

          .trigger {
            all: unset;
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            inline-size: 100%;
            min-height: var(--wc-select-trigger-height);
            padding: var(--wc-select-trigger-padding);
            border-radius: var(--wc-select-trigger-radius);
            background: var(--wc-select-trigger-background);
            color: var(--wc-select-trigger-color);
            border: var(--wc-select-trigger-border);
            box-shadow: var(--wc-select-trigger-shadow);
            cursor: pointer;
            font: inherit;
            transition: background 120ms ease, box-shadow 120ms ease, color 120ms ease;
          }

          .trigger[data-placeholder="true"] {
            color: var(--wc-select-trigger-placeholder);
          }

          .trigger:focus-visible {
            box-shadow: var(--wc-select-trigger-focus-ring);
          }

          .trigger[aria-disabled="true"] {
            cursor: not-allowed;
            opacity: 0.55;
          }

          .value {
            display: inline-flex;
            align-items: center;
            min-inline-size: 0;
            flex: 1 1 auto;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .icon {
            inline-size: 1rem;
            block-size: 1rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--wc-select-icon-color);
          }

          .content {
            position: absolute;
            inset-inline-start: 0;
            inset-block-start: calc(100% + 0.4rem);
            z-index: 20;
            min-inline-size: 100%;
            background: var(--wc-select-content-background);
            border: var(--wc-select-content-border);
            border-radius: var(--wc-select-content-radius);
            box-shadow: var(--wc-select-content-shadow);
            overflow: hidden;
            display: none;
          }

          :host([data-state="open"]) .content {
            display: block;
          }

          .viewport {
            max-height: var(--wc-select-viewport-max-height);
            overflow-y: auto;
            padding: var(--wc-select-viewport-padding);
            display: grid;
            gap: 0.15rem;
          }
        </style>
        <button
          type="button"
          class="trigger"
          part="trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="${this.#listboxId}"
        >
          <span class="value" part="value"></span>
          <span class="icon" part="icon" aria-hidden="true">▾</span>
        </button>
        <div
          class="content"
          part="content"
          role="listbox"
          id="${this.#listboxId}"
          tabindex="-1"
          aria-activedescendant=""
        >
          <div class="viewport" part="viewport">
            <slot></slot>
          </div>
        </div>
      `;

      this.#trigger = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector('.trigger')
      );
      this.#valueEl = /** @type {HTMLSpanElement} */ (this.#root.querySelector('.value'));
      this.#content = /** @type {HTMLDivElement} */ (this.#root.querySelector('.content'));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));

      this.#handleDocumentPointerDown = (event) => {
        if (!this.#open) return;
        if (!isEventInside(this, event)) {
          this.close();
        }
      };

      this.#handleDocumentFocusIn = (event) => {
        if (!this.#open) return;
        if (!isEventInside(this, event)) {
          this.close();
        }
      };

      this.#trigger.addEventListener('click', () => {
        if (this.disabled) return;
        if (this.#open) {
          this.close();
        } else {
          this.open();
        }
      });

      this.#trigger.addEventListener('keydown', (event) => {
        if (this.disabled) return;
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
            event.preventDefault();
            if (!this.#open) {
              this.open();
            }
            this.#moveHighlight(event.key === 'ArrowDown' ? 1 : -1, { wrap: true });
            break;
          case 'Home':
          case 'PageUp':
            event.preventDefault();
            this.open();
            this.#highlightFirstEnabled();
            break;
          case 'End':
          case 'PageDown':
            event.preventDefault();
            this.open();
            this.#highlightLastEnabled();
            break;
          case ' ': // Space
          case 'Enter':
            event.preventDefault();
            this.open();
            break;
          default:
            break;
        }
      });

      this.#content.addEventListener('keydown', (event) => {
        if (!this.#open) return;
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            this.#moveHighlight(1, { wrap: true });
            break;
          case 'ArrowUp':
            event.preventDefault();
            this.#moveHighlight(-1, { wrap: true });
            break;
          case 'Home':
          case 'PageUp':
            event.preventDefault();
            this.#highlightFirstEnabled();
            break;
          case 'End':
          case 'PageDown':
            event.preventDefault();
            this.#highlightLastEnabled();
            break;
          case 'Enter':
          case ' ': // Space
            event.preventDefault();
            if (this.#highlighted && !this.#highlighted.disabled) {
              this.#selectOption(this.#highlighted);
            }
            break;
          case 'Escape':
            event.preventDefault();
            this.close();
            this.#trigger.focus({ preventScroll: true });
            break;
          case 'Tab':
            this.close();
            break;
          default:
            if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
              this.#handleTypeahead(event.key);
            }
            break;
        }
      });

      this.addEventListener('click', (event) => {
        if (!this.#open) return;
        const option = this.#findOptionFromEvent(event);
        if (!option || option.disabled) return;
        event.preventDefault();
        this.#selectOption(option);
      });

      this.addEventListener('pointerover', (event) => {
        if (!this.#open) return;
        const option = this.#findOptionFromEvent(event);
        if (!option || option.disabled) return;
        this.#highlightOption(option);
      });

      this.#slot.addEventListener('slotchange', () => {
        this.#syncOptions();
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'placeholder');
      upgradeProperty(this, 'disabled');
      this.setAttribute('data-state', this.#open ? 'open' : 'closed');
      this.#syncOptions();
      this.#renderValue();
      this.#renderDisabled();
    }

    disconnectedCallback() {
      this.#detachDocumentListeners();
      if (this.#typeaheadTimeout) {
        window.clearTimeout(this.#typeaheadTimeout);
      }
    }

    attributeChangedCallback(name) {
      if (name === 'placeholder') {
        this.#renderValue();
      } else if (name === 'value') {
        this.#renderSelection();
        this.#renderValue();
      } else if (name === 'disabled') {
        this.#renderDisabled();
        if (this.disabled) {
          this.close();
        }
      }
    }

    /**
     * Currently selected value.
     * @returns {string}
     */
    get value() {
      return this.getAttribute('value') ?? '';
    }

    /**
     * Updates the current selection.
     * @param {string} value
     */
    set value(value) {
      this.setAttribute('value', value);
    }

    /**
     * Placeholder displayed when no value is selected.
     * @returns {string}
     */
    get placeholder() {
      return this.getAttribute('placeholder') ?? 'Select an option';
    }

    /**
     * Sets the placeholder text.
     * @param {string} value
     */
    set placeholder(value) {
      this.setAttribute('placeholder', value);
    }

    /**
     * Indicates whether the component is disabled.
     * @returns {boolean}
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     * Toggles the disabled state.
     * @param {boolean} value
     */
    set disabled(value) {
      this.toggleAttribute('disabled', Boolean(value));
    }

    /**
     * Reports whether the listbox is open.
     * @returns {boolean}
     */
    get open() {
      return this.#open;
    }

    /**
     * Opens the listbox.
     */
    open() {
      if (this.#open || this.disabled) return;
      this.#open = true;
      this.setAttribute('data-state', 'open');
      this.#trigger.setAttribute('aria-expanded', 'true');
      this.#typeahead = '';
      this.#content.focus({ preventScroll: true });
      this.#highlightInitial();
      this.#attachDocumentListeners();
      this.dispatchEvent(
        new CustomEvent('wc-select-toggle', {
          detail: { open: true },
          bubbles: true,
          composed: true,
        }),
      );
    }

    /**
     * Closes the listbox.
     */
    close() {
      if (!this.#open) return;
      this.#open = false;
      this.setAttribute('data-state', 'closed');
      this.#trigger.setAttribute('aria-expanded', 'false');
      this.#content.blur();
      this.#typeahead = '';
      this.#highlightOption(null);
      this.#detachDocumentListeners();
      this.dispatchEvent(
        new CustomEvent('wc-select-toggle', {
          detail: { open: false },
          bubbles: true,
          composed: true,
        }),
      );
    }

    /**
     * Highlights the first enabled option.
     */
    #highlightFirstEnabled() {
      const option = this.#getEnabledOptions()[0] ?? null;
      this.#highlightOption(option);
    }

    /**
     * Highlights the last enabled option.
     */
    #highlightLastEnabled() {
      const enabled = this.#getEnabledOptions();
      const option = enabled[enabled.length - 1] ?? null;
      this.#highlightOption(option);
    }

    /**
     * Highlights the currently selected option or the first enabled item.
     */
    #highlightInitial() {
      const selected = this.#options.find((option) => option.value === this.value && !option.disabled);
      if (selected) {
        this.#highlightOption(selected);
      } else {
        this.#highlightFirstEnabled();
      }
    }

    /**
     * Moves the highlight by a delta.
     * @param {number} delta
     * @param {{ wrap?: boolean }} [options]
     */
    #moveHighlight(delta, options = {}) {
      const enabled = this.#getEnabledOptions();
      if (enabled.length === 0) return;
      const currentIndex = this.#highlighted ? enabled.indexOf(this.#highlighted) : -1;
      let nextIndex = currentIndex + delta;
      if (options.wrap) {
        if (nextIndex < 0) nextIndex = enabled.length - 1;
        if (nextIndex >= enabled.length) nextIndex = 0;
      } else {
        nextIndex = Math.min(Math.max(nextIndex, 0), enabled.length - 1);
      }
      const option = enabled[nextIndex];
      if (option) {
        this.#highlightOption(option);
      }
    }

    /**
     * Handles user typing to jump to matching options.
     * @param {string} key
     */
    #handleTypeahead(key) {
      this.#typeahead += key;
      const search = normalize(this.#typeahead);
      const enabled = this.#getEnabledOptions();
      if (enabled.length === 0) return;
      const startIndex = this.#highlighted ? enabled.indexOf(this.#highlighted) + 1 : 0;
      const ordered = enabled.slice(startIndex).concat(enabled.slice(0, startIndex));
      const match = ordered.find((option) => normalize(option.textValue).startsWith(search));
      if (match) {
        this.#highlightOption(match);
      }
      if (this.#typeaheadTimeout) {
        window.clearTimeout(this.#typeaheadTimeout);
      }
      this.#typeaheadTimeout = window.setTimeout(() => {
        this.#typeahead = '';
      }, 500);
    }

    /**
     * Updates the highlighted option.
     * @param {WcSelectOption | null} option
     */
    #highlightOption(option) {
      if (this.#highlighted && this.#highlighted !== option) {
        this.#highlighted.setHighlighted(false);
      }
      this.#highlighted = option;
      if (option) {
        option.setHighlighted(true);
        this.#content.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      } else {
        this.#content.setAttribute('aria-activedescendant', '');
      }
    }

    /**
     * Applies selection based on the `value` attribute.
     */
    #renderSelection() {
      const currentValue = this.value;
      for (const option of this.#options) {
        option.setSelected(!option.disabled && option.value === currentValue);
      }
    }

    /**
     * Synchronises the list of option elements.
     */
    #syncOptions() {
      this.#options = Array.from(this.querySelectorAll('wc-select-option'));
      this.#renderSelection();
      this.#renderValue();
    }

    /**
     * Updates trigger value text and placeholder state.
     */
    #renderValue() {
      const option = this.#options.find((item) => item.value === this.value);
      const placeholder = this.placeholder;
      if (option && !option.disabled) {
        this.#valueEl.textContent = option.textValue || option.textContent || '';
        delete this.#trigger.dataset.placeholder;
      } else {
        this.#valueEl.textContent = placeholder;
        this.#trigger.dataset.placeholder = 'true';
      }
    }

    /**
     * Applies the disabled state to the trigger.
     */
    #renderDisabled() {
      this.#trigger.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.#trigger.toggleAttribute('disabled', this.disabled);
    }

    /**
     * Selects an option and emits events.
     * @param {WcSelectOption} option
     */
    #selectOption(option) {
      if (option.disabled) return;
      const nextValue = option.value;
      if (this.value !== nextValue) {
        this.value = nextValue;
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
        this.dispatchEvent(
          new CustomEvent('wc-select-change', {
            detail: { value: this.value, option },
            bubbles: true,
            composed: true,
          }),
        );
      }
      this.close();
      this.#trigger.focus({ preventScroll: true });
    }

    /**
     * Returns enabled options (non-disabled).
     * @returns {WcSelectOption[]}
     */
    #getEnabledOptions() {
      return this.#options.filter((option) => !option.disabled);
    }

    /**
     * Finds the first option element from an event.
     * @param {Event} event
     * @returns {WcSelectOption | null}
     */
    #findOptionFromEvent(event) {
      const path = event.composedPath();
      for (const item of path) {
        if (item instanceof HTMLElement && item.tagName === 'WC-SELECT-OPTION') {
          return /** @type {WcSelectOption} */ (item);
        }
      }
      return null;
    }

    #attachDocumentListeners() {
      document.addEventListener('pointerdown', this.#handleDocumentPointerDown, true);
      document.addEventListener('focusin', this.#handleDocumentFocusIn, true);
    }

    #detachDocumentListeners() {
      document.removeEventListener('pointerdown', this.#handleDocumentPointerDown, true);
      document.removeEventListener('focusin', this.#handleDocumentFocusIn, true);
    }
  }

  if (!customElements.get('wc-select-option')) {
    customElements.define('wc-select-option', WcSelectOption);
  }

  if (!customElements.get('wc-select-group')) {
    customElements.define('wc-select-group', WcSelectGroup);
  }

  if (!customElements.get('wc-select-separator')) {
    customElements.define('wc-select-separator', WcSelectSeparator);
  }

  if (!customElements.get('wc-select')) {
    customElements.define('wc-select', WcSelect);
  }
})();

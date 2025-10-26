/**
 * @file combobox.js
 * @version 1.0.0
 *
 * Accessible combobox web component inspired by the shadcn/ui Combobox demo.
 * Provides a trigger button that opens a searchable listbox, keyboard
 * navigation, grouping support, and clear visual states without external
 * dependencies. The element exposes custom properties and ::part hooks for
 * styling and emits events when the selected value changes.
 */

(() => {
  /**
   * Upgrades properties that might have been set prior to the custom element
   * definition being registered.
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
   * Normalises a string for search comparisons.
   * @param {string} value
   */
  const normalise = (value) => value.trim().toLowerCase();

  /**
   * Determines if an event target lives inside the provided element, taking
   * composed paths into account.
   * @param {HTMLElement} element
   * @param {Event} event
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

  let optionId = 0;

  /**
   * Generates an id for combobox options.
   */
  const nextOptionId = () => {
    optionId += 1;
    return `wc-combobox-option-${optionId}`;
  };

  /**
   * Individual option element used inside <wc-combobox>.
   */
  class WcComboboxOption extends HTMLElement {
    static get observedAttributes() {
      return ["disabled"];
    }

    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            --option-radius: var(--wc-combobox-option-radius, 6px);
            --option-padding: var(--wc-combobox-option-padding, 0.4rem 0.75rem 0.4rem 0.75rem);
            --option-gap: var(--wc-combobox-option-gap, 0.65rem);
            --option-color: var(--wc-combobox-option-color, inherit);
            --option-background: var(--wc-combobox-option-background, transparent);
            --option-highlighted-background: var(--wc-combobox-option-highlighted-background, rgba(99, 102, 241, 0.16));
            --option-highlighted-color: var(--wc-combobox-option-highlighted-color, #1f2937);
            --option-disabled-color: var(--wc-combobox-option-disabled-color, rgba(100, 116, 139, 0.65));
            --option-indicator-color: var(--wc-combobox-option-indicator-color, #4f46e5);
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .option {
            display: flex;
            align-items: center;
            gap: var(--option-gap);
            padding: var(--option-padding);
            border-radius: var(--option-radius);
            color: var(--option-color);
            background: var(--option-background);
            font: inherit;
            line-height: 1.45;
            cursor: pointer;
            position: relative;
            transition: background 120ms ease, color 120ms ease;
          }

          .indicator {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            inline-size: 1rem;
            block-size: 1rem;
            color: var(--option-indicator-color);
            opacity: 0;
            transition: opacity 120ms ease;
          }

          .indicator svg {
            inline-size: 100%;
            block-size: 100%;
          }

          .label {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            min-inline-size: 0;
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
            opacity: 0.7;
          }
        </style>
        <div class="option" part="option">
          <span class="indicator" part="indicator" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3.75 8.25 6.75 11.25 12.25 5.75" />
            </svg>
          </span>
          <span class="label" part="label"><slot></slot></span>
        </div>
      `;
    }

    connectedCallback() {
      if (!this.id) {
        this.id = nextOptionId();
      }
      this.setAttribute("role", "option");
      this.setAttribute("aria-selected", this.dataset.selected === "true" ? "true" : "false");
      this.#updateDisabled();
    }

    attributeChangedCallback(name) {
      if (name === "disabled") {
        this.#updateDisabled();
      }
    }

    /**
     * Reflects disabled state for accessibility.
     */
    #updateDisabled() {
      const disabled = this.disabled;
      if (disabled) {
        this.setAttribute("aria-disabled", "true");
      } else {
        this.removeAttribute("aria-disabled");
      }
    }

    /**
     * Selected value represented by this option.
     * @returns {string}
     */
    get value() {
      return this.getAttribute("value") ?? "";
    }

    set value(value) {
      if (value == null) {
        this.removeAttribute("value");
        return;
      }
      this.setAttribute("value", String(value));
    }

    /**
     * Optional text used for search comparisons.
     * @returns {string}
     */
    get textValue() {
      const custom = this.getAttribute("text-value");
      if (custom != null) return custom;
      return (this.textContent ?? "").replace(/\s+/g, " ").trim();
    }

    /**
     * Label displayed when this option is selected.
     * @returns {string}
     */
    get displayLabel() {
      const display = this.getAttribute("display-value");
      if (display != null) return display;
      return (this.textContent ?? "").replace(/\s+/g, " ").trim();
    }

    /**
     * Indicates whether the option is disabled.
     * @returns {boolean}
     */
    get disabled() {
      return this.hasAttribute("disabled");
    }

    set disabled(state) {
      this.toggleAttribute("disabled", Boolean(state));
    }
  }

  /**
   * Group wrapper for clustering options.
   */
  class WcComboboxGroup extends HTMLElement {
    static get observedAttributes() {
      return ["label"];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLParagraphElement} */
    #label;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .group {
            display: grid;
            gap: 0.35rem;
          }

          .label {
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--wc-combobox-group-label-color, rgba(99, 102, 241, 0.85));
            padding-inline: 0.25rem;
          }

          :host([data-empty="true"]) .label {
            display: none;
          }

          .options {
            display: grid;
            gap: 0.2rem;
          }
        </style>
        <div class="group" part="group">
          <p class="label" part="group-label"></p>
          <div class="options" part="group-options">
            <slot></slot>
          </div>
        </div>
      `;
      this.#label = /** @type {HTMLParagraphElement} */ (this.#root.querySelector(".label"));
    }

    connectedCallback() {
      this.setAttribute("role", "presentation");
      this.#syncLabel();
    }

    attributeChangedCallback(name) {
      if (name === "label") {
        this.#syncLabel();
      }
    }

    #syncLabel() {
      const label = this.getAttribute("label") ?? "";
      this.#label.textContent = label;
      this.toggleAttribute("data-has-label", label.trim().length > 0);
    }
  }

  let comboboxId = 0;

  /**
   * <wc-combobox> element providing a searchable listbox.
   */
  class WcCombobox extends HTMLElement {
    static get observedAttributes() {
      return [
        "open",
        "value",
        "placeholder",
        "search-placeholder",
        "search-label",
        "empty-label",
        "disabled",
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #trigger;
    /** @type {HTMLSpanElement} */
    #label;
    /** @type {HTMLDivElement} */
    #panel;
    /** @type {HTMLInputElement} */
    #search;
    /** @type {HTMLDivElement} */
    #list;
    /** @type {HTMLDivElement} */
    #empty;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {boolean} */
    #open = false;
    /** @type {string} */
    #value = "";
    /** @type {boolean} */
    #reflecting = false;
    /** @type {WcComboboxOption | null} */
    #highlighted = null;
    /** @type {WcComboboxOption | null} */
    #selected = null;
    /** @type {Map<WcComboboxOption, { onPointerDown: (event: PointerEvent) => void; onPointerEnter: () => void; }> */
    #optionHandlers = new Map();
    /** @type {() => void} */
    #boundDocumentPointerDown;
    /** @type {() => void} */
    #boundDocumentFocusIn;
    /** @type {(event: KeyboardEvent) => void} */
    #boundDocumentKeydown;
    /** @type {string} */
    #listboxId;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            position: relative;
            inline-size: var(--wc-combobox-width, 220px);
            font: inherit;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          .combobox {
            position: relative;
            inline-size: 100%;
          }

          button {
            inline-size: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            padding: var(--wc-combobox-trigger-padding, 0.45rem 0.65rem);
            border-radius: var(--wc-combobox-trigger-radius, 0.75rem);
            border: var(--wc-combobox-trigger-border, 1px solid rgba(148, 163, 184, 0.45));
            background: var(--wc-combobox-trigger-background, rgba(255, 255, 255, 0.75));
            color: var(--wc-combobox-trigger-color, inherit);
            font: inherit;
            line-height: 1.4;
            cursor: pointer;
            transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
            min-block-size: var(--wc-combobox-trigger-height, 2.4rem);
          }

          button:focus-visible {
            outline: none;
            box-shadow: var(--wc-combobox-trigger-focus-ring, 0 0 0 3px rgba(99, 102, 241, 0.35));
          }

          button[disabled] {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .trigger-label {
            flex: 1;
            min-inline-size: 0;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: inherit;
          }

          .trigger-label.is-placeholder {
            color: var(--wc-combobox-placeholder-color, rgba(71, 85, 105, 0.85));
          }

          .icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--wc-combobox-icon-color, rgba(148, 163, 184, 0.9));
          }

          .icon svg {
            inline-size: 1.05rem;
            block-size: 1.05rem;
          }

          .panel {
            position: absolute;
            inset-inline-start: 0;
            inset-block-start: calc(100% + var(--wc-combobox-panel-offset, 0.4rem));
            inline-size: var(--wc-combobox-panel-width, 100%);
            background: var(--wc-combobox-panel-background, rgba(255, 255, 255, 0.95));
            border: var(--wc-combobox-panel-border, 1px solid rgba(148, 163, 184, 0.25));
            border-radius: var(--wc-combobox-panel-radius, 0.75rem);
            box-shadow: var(--wc-combobox-panel-shadow, 0 28px 60px -32px rgba(15, 23, 42, 0.45));
            z-index: var(--wc-combobox-panel-z-index, 50);
            display: grid;
            gap: 0.35rem;
            padding: var(--wc-combobox-panel-padding, 0.5rem);
          }

          .panel[hidden] {
            display: none;
          }

          .search {
            display: flex;
            align-items: center;
            gap: 0.45rem;
            padding: var(--wc-combobox-search-padding, 0.35rem 0.5rem);
            border-radius: var(--wc-combobox-search-radius, 0.65rem);
            border: var(--wc-combobox-search-border, 1px solid rgba(148, 163, 184, 0.25));
            background: var(--wc-combobox-search-background, rgba(248, 250, 252, 0.9));
          }

          .search svg {
            inline-size: 1rem;
            block-size: 1rem;
            color: var(--wc-combobox-search-icon-color, rgba(100, 116, 139, 0.9));
          }

          input[type="search"] {
            flex: 1;
            min-inline-size: 0;
            border: none;
            background: transparent;
            font: inherit;
            color: inherit;
            outline: none;
          }

          input[type="search"]::-webkit-search-cancel-button {
            display: none;
          }

          .list-wrapper {
            max-block-size: var(--wc-combobox-list-max-height, 15rem);
            overflow: auto;
            padding-inline: 0.25rem;
          }

          .list {
            display: grid;
            gap: 0.25rem;
          }

          .empty {
            padding: 0.65rem 0.85rem;
            font-size: 0.9rem;
            color: var(--wc-combobox-empty-color, rgba(100, 116, 139, 0.95));
          }

          .empty[hidden] {
            display: none;
          }
        </style>
        <div class="combobox" part="container">
          <button part="trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
            <span class="trigger-label" part="label"></span>
            <span class="icon" part="icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 8 10 4 14 8"></polyline>
                <polyline points="6 12 10 16 14 12"></polyline>
              </svg>
            </span>
          </button>
          <div class="panel" part="panel" hidden>
            <div class="search" part="search">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="9" cy="9" r="6"></circle>
                <line x1="14.5" y1="14.5" x2="18" y2="18"></line>
              </svg>
              <input type="search" part="search-input" autocomplete="off" autocapitalize="none" spellcheck="false" />
            </div>
            <div class="empty" part="empty" hidden>
              <slot name="empty">No results found.</slot>
            </div>
            <div class="list-wrapper" part="viewport">
              <div class="list" part="list" role="listbox">
                <slot></slot>
              </div>
            </div>
          </div>
        </div>
      `;

      this.#trigger = /** @type {HTMLButtonElement} */ (this.#root.querySelector("button"));
      this.#label = /** @type {HTMLSpanElement} */ (this.#root.querySelector(".trigger-label"));
      this.#panel = /** @type {HTMLDivElement} */ (this.#root.querySelector(".panel"));
      this.#search = /** @type {HTMLInputElement} */ (this.#root.querySelector("input[type=search]"));
      this.#list = /** @type {HTMLDivElement} */ (this.#root.querySelector(".list"));
      this.#empty = /** @type {HTMLDivElement} */ (this.#root.querySelector(".empty"));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector("slot:not([name])"));

      this.#boundDocumentPointerDown = () => {
        /* placeholder, replaced in connectedCallback */
      };
      this.#boundDocumentFocusIn = () => {
        /* placeholder */
      };
      this.#boundDocumentKeydown = () => {
        /* placeholder */
      };

      comboboxId += 1;
      this.#listboxId = `wc-combobox-${comboboxId}-listbox`;
      this.#list.id = this.#listboxId;
      this.#trigger.setAttribute("aria-controls", this.#listboxId);
    }

    connectedCallback() {
      upgradeProperty(this, "open");
      upgradeProperty(this, "value");

      this.#trigger.addEventListener("click", this.#handleTriggerClick);
      this.#trigger.addEventListener("keydown", this.#handleTriggerKeydown);
      this.#search.addEventListener("input", this.#handleSearchInput);
      this.#search.addEventListener("keydown", this.#handleSearchKeydown);
      this.#slot.addEventListener("slotchange", this.#handleSlotChange);

      this.#boundDocumentPointerDown = (event) => {
        if (!this.#open) return;
        if (!(event instanceof PointerEvent)) return;
        if (isEventInside(this, event)) return;
        this.open = false;
      };

      this.#boundDocumentFocusIn = (event) => {
        if (!this.#open) return;
        if (!(event instanceof FocusEvent)) return;
        if (isEventInside(this, event)) return;
        this.open = false;
      };

      this.#boundDocumentKeydown = (event) => {
        if (!this.#open) return;
        if (event.key === "Escape") {
          event.preventDefault();
          this.open = false;
        }
      };

      this.#syncOptions();
      this.#updateLabel();
      this.#syncPlaceholders();
      this.#syncSearchAccessibility();
      this.#syncDisabledState();
    }

    disconnectedCallback() {
      this.#trigger.removeEventListener("click", this.#handleTriggerClick);
      this.#trigger.removeEventListener("keydown", this.#handleTriggerKeydown);
      this.#search.removeEventListener("input", this.#handleSearchInput);
      this.#search.removeEventListener("keydown", this.#handleSearchKeydown);
      this.#slot.removeEventListener("slotchange", this.#handleSlotChange);
      document.removeEventListener("pointerdown", this.#boundDocumentPointerDown, true);
      document.removeEventListener("focusin", this.#boundDocumentFocusIn, true);
      document.removeEventListener("keydown", this.#boundDocumentKeydown, true);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case "open":
          if (this.#reflecting) return;
          this.#open = newValue != null;
          this.#syncOpenState();
          break;
        case "value":
          if (this.#reflecting) return;
          this.#value = newValue ?? "";
          this.#syncSelection();
          break;
        case "placeholder":
          this.#updateLabel();
          break;
        case "search-placeholder":
        case "search-label":
          this.#syncSearchAccessibility();
          break;
        case "empty-label":
          this.#syncEmptyFallback();
          break;
        case "disabled":
          this.#syncDisabledState();
          break;
        default:
          break;
      }
    }

    /**
     * Handles trigger button clicks.
     * @param {MouseEvent} event
     */
    #handleTriggerClick = (event) => {
      if (this.disabled) {
        event.preventDefault();
        return;
      }
      this.open = !this.open;
    };

    /**
     * Handles keydown events on the trigger for keyboard control.
     * @param {KeyboardEvent} event
     */
    #handleTriggerKeydown = (event) => {
      if (this.disabled) return;
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
          event.preventDefault();
          if (!this.open) {
            this.open = true;
          }
          this.#moveHighlight(event.key === "ArrowDown" ? 1 : -1, { loop: true });
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          this.open = !this.open;
          break;
        default:
          break;
      }
    };

    /**
     * Handles user input in the search field.
     */
    #handleSearchInput = () => {
      this.#filterOptions();
    };

    /**
     * Handles keyboard shortcuts while the search input is focused.
     * @param {KeyboardEvent} event
     */
    #handleSearchKeydown = (event) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          this.#moveHighlight(1, { loop: true });
          break;
        case "ArrowUp":
          event.preventDefault();
          this.#moveHighlight(-1, { loop: true });
          break;
        case "Enter":
          event.preventDefault();
          if (this.#highlighted && !this.#highlighted.disabled) {
            this.#selectOption(this.#highlighted);
          }
          break;
        case "Escape":
          event.preventDefault();
          this.open = false;
          break;
        default:
          break;
      }
    };

    /**
     * Responds to slot changes to re-register option listeners.
     */
    #handleSlotChange = () => {
      this.#syncOptions();
    };

    /**
     * Opens or closes the panel based on the current open state.
     */
    #syncOpenState() {
      this.#trigger.setAttribute("aria-expanded", this.#open ? "true" : "false");
      this.toggleAttribute("open", this.#open);
      if (this.#open) {
        this.#panel.hidden = false;
        document.addEventListener("pointerdown", this.#boundDocumentPointerDown, true);
        document.addEventListener("focusin", this.#boundDocumentFocusIn, true);
        document.addEventListener("keydown", this.#boundDocumentKeydown, true);
        this.#search.value = "";
        this.#filterOptions();
        this.#highlightSelected();
        queueMicrotask(() => {
          this.#search.focus({ preventScroll: true });
        });
        this.dispatchEvent(
          new CustomEvent("wc-combobox-toggle", {
            detail: { open: true },
            bubbles: true,
          }),
        );
      } else {
        this.#panel.hidden = true;
        document.removeEventListener("pointerdown", this.#boundDocumentPointerDown, true);
        document.removeEventListener("focusin", this.#boundDocumentFocusIn, true);
        document.removeEventListener("keydown", this.#boundDocumentKeydown, true);
        this.#clearHighlight();
        queueMicrotask(() => {
          this.#trigger.focus({ preventScroll: true });
        });
        this.dispatchEvent(
          new CustomEvent("wc-combobox-toggle", {
            detail: { open: false },
            bubbles: true,
          }),
        );
      }
    }

    /**
     * Updates the trigger label text.
     */
    #updateLabel() {
      const placeholder = this.getAttribute("placeholder") ?? "Select option…";
      const label = this.#selected?.displayLabel ?? placeholder;
      this.#label.textContent = label;
      const hasValue = Boolean(this.#selected);
      this.#label.classList.toggle("is-placeholder", !hasValue);
      this.toggleAttribute("data-has-value", hasValue);
    }

    /**
     * Syncs the search input attributes.
     */
    #syncSearchAccessibility() {
      const placeholder = this.getAttribute("search-placeholder") ?? "Search…";
      const ariaLabel = this.getAttribute("search-label") ?? "Filter options";
      this.#search.placeholder = placeholder;
      this.#search.setAttribute("aria-label", ariaLabel);
      this.#search.setAttribute("aria-controls", this.#listboxId);
      this.#search.setAttribute("role", "combobox");
      this.#search.setAttribute("aria-autocomplete", "list");
    }

    /**
     * Synchronises the empty state fallback text when an attribute is set.
     */
    #syncEmptyFallback() {
      if (this.querySelector('[slot="empty"]')) return;
      const label = this.getAttribute("empty-label");
      if (label != null) {
        this.#empty.textContent = label;
      }
    }

    /**
     * Updates the disabled state on the trigger and search input.
     */
    #syncDisabledState() {
      const disabled = this.disabled;
      this.#trigger.disabled = disabled;
      this.#search.disabled = disabled;
      if (disabled) {
        this.open = false;
      }
    }

    /**
     * Re-registers option listeners when the DOM changes.
     */
    #syncOptions() {
      const options = Array.from(
        this.querySelectorAll("wc-combobox-option"),
      ).filter((option) => option.closest("wc-combobox") === this);

      const nextSet = new Set(options);
      for (const [option, handlers] of this.#optionHandlers.entries()) {
        if (!nextSet.has(option)) {
          option.removeEventListener("pointerdown", handlers.onPointerDown);
          option.removeEventListener("pointerenter", handlers.onPointerEnter);
          this.#optionHandlers.delete(option);
        }
      }

      for (const option of options) {
        if (!this.#optionHandlers.has(option)) {
          const onPointerDown = (event) => {
            if (!(event instanceof PointerEvent)) return;
            if (event.button !== 0) return;
            event.preventDefault();
            if (option.disabled) return;
            this.#selectOption(option);
          };
          const onPointerEnter = () => {
            if (option.hidden || option.disabled) return;
            this.#highlightOption(option);
          };
          option.addEventListener("pointerdown", onPointerDown);
          option.addEventListener("pointerenter", onPointerEnter);
          this.#optionHandlers.set(option, { onPointerDown, onPointerEnter });
        }
      }

      this.#syncSelection();
      this.#filterOptions();
    }

    /**
     * Applies selection state to options.
     */
    #syncSelection() {
      let selected = null;
      const options = Array.from(
        this.querySelectorAll("wc-combobox-option"),
      ).filter((option) => option.closest("wc-combobox") === this);
      for (const option of options) {
        const isSelected = !this.#value ? false : option.value === this.#value;
        option.dataset.selected = isSelected ? "true" : "false";
        option.setAttribute("aria-selected", isSelected ? "true" : "false");
        if (isSelected) {
          selected = option;
        }
      }
      this.#selected = selected;
      this.#updateLabel();
    }

    /**
     * Clears the current highlight.
     */
    #clearHighlight() {
      if (this.#highlighted) {
        this.#highlighted.dataset.highlighted = "false";
      }
      this.#highlighted = null;
      this.#trigger.removeAttribute("aria-activedescendant");
      this.#search.removeAttribute("aria-activedescendant");
    }

    /**
     * Highlights the selected option when opening.
     */
    #highlightSelected() {
      if (this.#selected && !this.#selected.hidden && !this.#selected.disabled) {
        this.#highlightOption(this.#selected);
      } else {
        const first = this.#visibleOptions()[0] ?? null;
        if (first) {
          this.#highlightOption(first);
        } else {
          this.#clearHighlight();
        }
      }
    }

    /**
     * Highlights the provided option.
     * @param {WcComboboxOption} option
     */
    #highlightOption(option) {
      if (this.#highlighted === option) return;
      if (this.#highlighted) {
        this.#highlighted.dataset.highlighted = "false";
      }
      this.#highlighted = option;
      option.dataset.highlighted = "true";
      this.#trigger.setAttribute("aria-activedescendant", option.id);
      this.#search.setAttribute("aria-activedescendant", option.id);
      queueMicrotask(() => {
        option.scrollIntoView({ block: "nearest" });
      });
    }

    /**
     * Moves the highlight relative to the current option.
     * @param {number} step
     * @param {{ loop?: boolean }} options
     */
    #moveHighlight(step, { loop = false } = {}) {
      const visible = this.#visibleOptions();
      if (visible.length === 0) {
        this.#clearHighlight();
        return;
      }
      const currentIndex = this.#highlighted ? visible.indexOf(this.#highlighted) : -1;
      let nextIndex = currentIndex + step;
      if (loop) {
        if (nextIndex < 0) nextIndex = visible.length - 1;
        if (nextIndex >= visible.length) nextIndex = 0;
      } else {
        nextIndex = Math.max(0, Math.min(visible.length - 1, nextIndex));
      }
      const nextOption = visible[nextIndex];
      if (nextOption) {
        this.#highlightOption(nextOption);
      }
    }

    /**
     * Returns visible, enabled options.
     * @returns {WcComboboxOption[]}
     */
    #visibleOptions() {
      return Array.from(
        this.querySelectorAll("wc-combobox-option"),
      ).filter((option) => {
        if (option.closest("wc-combobox") !== this) return false;
        if (option.hidden) return false;
        if (option.disabled) return false;
        return true;
      });
    }

    /**
     * Filters options based on the current search value.
     */
    #filterOptions() {
      const query = normalise(this.#search.value);
      let visibleCount = 0;
      const options = Array.from(
        this.querySelectorAll("wc-combobox-option"),
      ).filter((option) => option.closest("wc-combobox") === this);

      for (const option of options) {
        const text = normalise(option.textValue);
        const matches = query.length === 0 || text.includes(query);
        option.hidden = !matches;
        if (matches) {
          visibleCount += 1;
        }
      }

      const groups = Array.from(
        this.querySelectorAll("wc-combobox-group"),
      ).filter((group) => group.closest("wc-combobox") === this);

      for (const group of groups) {
        const groupOptions = Array.from(group.querySelectorAll("wc-combobox-option"));
        const hasVisible = groupOptions.some((option) => !option.hidden);
        group.toggleAttribute("data-empty", !hasVisible);
        group.hidden = !hasVisible;
      }

      this.#empty.hidden = visibleCount > 0;
      if (visibleCount === 0) {
        this.#clearHighlight();
      } else if (this.#highlighted && this.#highlighted.hidden) {
        this.#highlightSelected();
      }
    }

    /**
     * Selects an option and emits a change event.
     * @param {WcComboboxOption} option
     */
    #selectOption(option) {
      const nextValue = option.value;
      const shouldClear = this.#selected && this.#selected.value === nextValue;
      const newValue = shouldClear ? "" : nextValue;
      const changed = this.#value !== newValue;
      this.#value = newValue;
      this.#reflecting = true;
      if (newValue) {
        this.setAttribute("value", newValue);
      } else {
        this.removeAttribute("value");
      }
      this.#reflecting = false;
      this.#syncSelection();
      if (changed) {
        this.dispatchEvent(
          new CustomEvent("wc-combobox-change", {
            detail: {
              value: this.#value,
              option: newValue ? option : null,
            },
            bubbles: true,
          }),
        );
      }
      this.open = false;
    }

    /**
     * Updates placeholder text when attributes change.
     */
    #syncPlaceholders() {
      this.#syncEmptyFallback();
    }

    /**
     * Indicates whether the combobox is currently open.
     * @returns {boolean}
     */
    get open() {
      return this.#open;
    }

    set open(state) {
      const next = Boolean(state);
      if (this.#open === next) return;
      this.#open = next;
      this.#reflecting = true;
      this.toggleAttribute("open", this.#open);
      this.#reflecting = false;
      this.#syncOpenState();
    }

    /**
     * Selected value.
     * @returns {string}
     */
    get value() {
      return this.#value;
    }

    set value(value) {
      const next = value == null ? "" : String(value);
      if (this.#value === next) return;
      this.#value = next;
      this.#reflecting = true;
      if (next) {
        this.setAttribute("value", next);
      } else {
        this.removeAttribute("value");
      }
      this.#reflecting = false;
      this.#syncSelection();
    }

    /**
     * Whether the combobox is disabled.
     * @returns {boolean}
     */
    get disabled() {
      return this.hasAttribute("disabled");
    }

    set disabled(state) {
      this.toggleAttribute("disabled", Boolean(state));
    }
  }

  if (!customElements.get("wc-combobox-option")) {
    customElements.define("wc-combobox-option", WcComboboxOption);
  }
  if (!customElements.get("wc-combobox-group")) {
    customElements.define("wc-combobox-group", WcComboboxGroup);
  }
  if (!customElements.get("wc-combobox")) {
    customElements.define("wc-combobox", WcCombobox);
  }
})();

/**
 * @file collapsible.js
 * @version 1.0.0
 *
 * An accessible collapsible panel component inspired by Radix UI's Collapsible primitive.
 * Provides a summary slot for the header, an optional peek slot for always-visible content,
 * and collapsible content controlled via the default slot.
 */

(() => {
  if (customElements.get('wc-collapsible')) {
    return;
  }

  /**
   * Reflects a property to an attribute when the value changes.
   * @param {HTMLElement} element
   * @param {string} attribute
   * @param {boolean} value
   */
  const reflectBooleanAttribute = (element, attribute, value) => {
    if (value) {
      element.setAttribute(attribute, '');
    } else {
      element.removeAttribute(attribute);
    }
  };

  /**
   * Upgrades a pre-defined property to ensure the setter runs after definition.
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

  let instanceCount = 0;

  class WcCollapsible extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #trigger;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLDivElement} */
    #preview;
    /** @type {HTMLDivElement} */
    #iconOpen;
    /** @type {HTMLDivElement} */
    #iconClosed;
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #disabled = false;
    /** @type {string} */
    #contentId;

    constructor() {
      super();
      instanceCount += 1;
      this.#contentId = `wc-collapsible-content-${instanceCount}`;
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            --collapsible-width: auto;
            --collapsible-background: var(--collapsible-surface, rgba(23, 23, 23, 0.92));
            --collapsible-header-gap: 0.75rem;
            --collapsible-border-radius: 0.9rem;
            --collapsible-trigger-size: 2.5rem;
            --collapsible-trigger-background: #ffffff;
            --collapsible-trigger-background-active: #ede9fe;
            --collapsible-trigger-color: #5b21b6;
            --collapsible-trigger-shadow: 0 2px 12px rgba(15, 15, 15, 0.35);
            --collapsible-trigger-focus: 0 0 0 2px rgba(15, 23, 42, 0.45);
            --collapsible-summary-color: #f1f5f9;
            --collapsible-preview-background: rgba(255, 255, 255, 0.96);
            --collapsible-preview-color: #4338ca;
            --collapsible-content-background: rgba(255, 255, 255, 0.96);
            --collapsible-content-color: #4338ca;
            --collapsible-content-gap: 0.75rem;
            --collapsible-transition-duration: 220ms;
            --collapsible-transition-easing: cubic-bezier(0.33, 1, 0.68, 1);
            inline-size: var(--collapsible-width);
            font-family: inherit;
            color: inherit;
          }

          [part="container"] {
            display: grid;
            gap: 0.75rem;
            background: var(--collapsible-background);
            border-radius: var(--collapsible-border-radius);
            padding: 1.25rem;
            box-shadow: 0 20px 48px -32px rgba(15, 23, 42, 0.65);
          }

          [part="header"] {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--collapsible-header-gap);
          }

          [part="summary"] {
            color: var(--collapsible-summary-color);
            font-size: clamp(0.95rem, 2vw, 1.05rem);
            line-height: 1.65;
          }

          [part="trigger"] {
            inline-size: var(--collapsible-trigger-size);
            block-size: var(--collapsible-trigger-size);
            border: none;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--collapsible-trigger-color);
            background: var(--collapsible-trigger-background);
            box-shadow: var(--collapsible-trigger-shadow);
            cursor: pointer;
            transition: transform 140ms ease, background var(--collapsible-transition-duration) var(--collapsible-transition-easing);
          }

          [part="trigger"]:hover {
            transform: translateY(-1px);
          }

          [part="trigger"]:active {
            background: var(--collapsible-trigger-background-active);
          }

          [part="trigger"]:focus-visible {
            outline: none;
            box-shadow: var(--collapsible-trigger-shadow), var(--collapsible-trigger-focus);
          }

          :host([data-disabled]) [part="trigger"] {
            cursor: not-allowed;
            opacity: 0.6;
            transform: none;
          }

          [part="preview"],
          [part="content"] {
            border-radius: calc(var(--collapsible-border-radius) - 0.35rem);
            background: var(--collapsible-preview-background);
            color: var(--collapsible-preview-color);
            padding: 0.75rem 1rem;
            box-shadow: 0 12px 32px -24px rgba(15, 23, 42, 0.5);
          }

          [part="preview"][hidden] {
            display: none;
          }

          [part="content"] {
            display: grid;
            gap: var(--collapsible-content-gap);
            background: var(--collapsible-content-background);
            color: var(--collapsible-content-color);
            transition: grid-template-rows var(--collapsible-transition-duration) var(--collapsible-transition-easing),
              opacity var(--collapsible-transition-duration) var(--collapsible-transition-easing);
          }

          [part="content"][data-state="closed"] {
            display: none;
          }

          ::slotted([slot="summary"]) {
            font-weight: 500;
          }

          ::slotted([slot="peek"]) {
            display: block;
            color: inherit;
            line-height: 1.6;
          }

          ::slotted(*) {
            color: inherit;
          }
        </style>
        <div part="container">
          <header part="header">
            <span part="summary" id="summary">
              <slot name="summary">Collapsible summary</slot>
            </span>
            <button part="trigger" type="button" aria-expanded="false" aria-controls="${this.#contentId}">
              <div part="icon-open" hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </div>
              <div part="icon-closed">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12h16" />
                  <path d="M12 4v16" />
                </svg>
              </div>
            </button>
          </header>
          <div part="preview">
            <slot name="peek"></slot>
          </div>
          <div part="content" id="${this.#contentId}" role="region" aria-labelledby="summary" data-state="closed">
            <slot></slot>
          </div>
        </div>
      `;

      this.#trigger = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[part="trigger"]'));
      this.#content = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="content"]'));
      this.#preview = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="preview"]'));
      this.#iconOpen = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="icon-open"]'));
      this.#iconClosed = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="icon-closed"]'));

      const peekSlot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot[name="peek"]'));
      const syncPeekVisibility = () => {
        const hasContent = peekSlot.assignedNodes().some((node) => {
          return !(node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '');
        });
        this.#preview.toggleAttribute('hidden', !hasContent);
      };
      peekSlot.addEventListener('slotchange', syncPeekVisibility);
      syncPeekVisibility();
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      upgradeProperty(this, 'disabled');

      this.#trigger.addEventListener('click', this.#onToggle);
      this.#trigger.addEventListener('keydown', this.#onTriggerKeyDown);

      this.#synchronize();
    }

    disconnectedCallback() {
      this.#trigger.removeEventListener('click', this.#onToggle);
      this.#trigger.removeEventListener('keydown', this.#onTriggerKeyDown);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      const value = newValue !== null;
      if (name === 'open') {
        this.#open = value;
        this.#updateOpenState();
      }
      if (name === 'disabled') {
        this.#disabled = value;
        this.#updateDisabledState();
      }
    }

    /** @returns {boolean} */
    get open() {
      return this.#open;
    }

    /** @param {boolean} value */
    set open(value) {
      const bool = Boolean(value);
      if (bool === this.#open) return;
      this.#open = bool;
      reflectBooleanAttribute(this, 'open', this.#open);
      this.#updateOpenState();
    }

    /** @returns {boolean} */
    get disabled() {
      return this.#disabled;
    }

    /** @param {boolean} value */
    set disabled(value) {
      const bool = Boolean(value);
      if (bool === this.#disabled) return;
      this.#disabled = bool;
      reflectBooleanAttribute(this, 'disabled', this.#disabled);
      this.#updateDisabledState();
    }

    /**
     * Opens the collapsible.
     */
    show() {
      this.open = true;
    }

    /**
     * Closes the collapsible.
     */
    hide() {
      this.open = false;
    }

    /**
     * Toggles the open state.
     * @param {boolean} [force]
     */
    toggle(force) {
      if (typeof force === 'boolean') {
        this.open = force;
      } else {
        this.open = !this.open;
      }
    }

    #onToggle = () => {
      if (this.disabled) return;
      this.toggle();
    };

    /**
     * @param {KeyboardEvent} event
     */
    #onTriggerKeyDown = (event) => {
      if (this.disabled) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggle();
      }
    };

    #synchronize() {
      this.#open = this.hasAttribute('open');
      this.#disabled = this.hasAttribute('disabled');
      this.#updateOpenState(false);
      this.#updateDisabledState();
    }

    /**
     * Updates the DOM to reflect the open state.
     * @param {boolean} [emit]
     */
    #updateOpenState(emit = true) {
      this.setAttribute('data-state', this.#open ? 'open' : 'closed');
      this.toggleAttribute('data-disabled', this.#disabled);
      this.#trigger.setAttribute('aria-expanded', String(this.#open));
      this.#content.dataset.state = this.#open ? 'open' : 'closed';
      this.#content.toggleAttribute('hidden', !this.#open);
      this.#content.classList.toggle('is-open', this.#open);
      this.#iconOpen.hidden = !this.#open;
      this.#iconClosed.hidden = this.#open;

      if (emit) {
        this.dispatchEvent(
          new CustomEvent('openchange', {
            detail: { open: this.#open },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }

    #updateDisabledState() {
      this.toggleAttribute('data-disabled', this.#disabled);
      this.#trigger.toggleAttribute('disabled', this.#disabled);
    }
  }

  customElements.define('wc-collapsible', WcCollapsible);
})();

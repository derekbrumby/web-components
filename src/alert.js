/**
 * @file alert.js
 * @version 1.0.0
 *
 * Accessible alert/callout component with optional icon, title, and description slots.
 * Inspired by the shadcn/ui alert pattern while keeping the implementation framework-free.
 *
 * Usage:
 * ```html
 * <wc-alert variant="destructive">
 *   <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
 *     <path d="M12 9v4" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path>
 *     <path d="M12 17h.01" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path>
 *     <path d="M10.29 3.86L2.82 17.14A1.5 1.5 0 0 0 4.13 19.5h15.74a1.5 1.5 0 0 0 1.31-2.36L13.69 3.86a1.5 1.5 0 0 0-2.6 0z" fill="none" stroke="currentColor" stroke-width="1.5"></path>
 *   </svg>
 *   <span slot="title">Payment failed</span>
 *   <p>Please verify your billing information and try again.</p>
 * </wc-alert>
 * ```
 */

(() => {
  /**
   * Ensure properties that were set before the element defined upgrade to attribute-backed setters.
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
   * @param {HTMLSlotElement} slot
   */
  const hasAssignedContent = (slot) => {
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {HTMLElement} */ (node);
        if (element.hidden) {
          continue;
        }
        return true;
      }
      if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  };

  let alertId = 0;

  class WcAlert extends HTMLElement {
    static get observedAttributes() {
      return ['variant'];
    }

    /** @type {HTMLDivElement} */
    #iconContainer;
    /** @type {HTMLSlotElement} */
    #iconSlot;
    /** @type {HTMLDivElement} */
    #titleContainer;
    /** @type {HTMLSlotElement} */
    #titleSlot;
    /** @type {HTMLDivElement} */
    #descriptionContainer;
    /** @type {HTMLSlotElement} */
    #descriptionSlot;
    /** @type {() => void} */
    #handleIconChange;
    /** @type {() => void} */
    #handleTitleChange;
    /** @type {() => void} */
    #handleDescriptionChange;

    constructor() {
      super();
      alertId += 1;
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          --wc-alert-background: #f8fafc;
          --wc-alert-border-color: rgba(148, 163, 184, 0.65);
          --wc-alert-color: #0f172a;
          --wc-alert-icon-color: #2563eb;
          --wc-alert-icon-background: transparent;
          --wc-alert-icon-size: 1.5rem;
          --wc-alert-radius: 0.9rem;
          --wc-alert-padding-inline: 1.125rem;
          --wc-alert-padding-block: 1rem;
          --wc-alert-gap: 0.75rem;
          --wc-alert-content-gap: 0.4rem;
          --wc-alert-title-color: #0f172a;
          --wc-alert-title-font-size: 1rem;
          --wc-alert-title-font-weight: 600;
          --wc-alert-description-color: rgba(15, 23, 42, 0.78);
          --wc-alert-description-font-size: 0.9375rem;
          display: block;
          color: var(--wc-alert-color);
        }

        :host([hidden]) {
          display: none !important;
        }

        :host([variant="destructive"]) {
          --wc-alert-background: #fef2f2;
          --wc-alert-border-color: rgba(248, 113, 113, 0.6);
          --wc-alert-color: #7f1d1d;
          --wc-alert-icon-color: #dc2626;
          --wc-alert-title-color: #7f1d1d;
          --wc-alert-description-color: rgba(127, 29, 29, 0.85);
        }

        [part="surface"] {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: flex-start;
          gap: var(--wc-alert-gap);
          padding-block: var(--wc-alert-padding-block);
          padding-inline: var(--wc-alert-padding-inline);
          border-radius: var(--wc-alert-radius);
          border: 1px solid var(--wc-alert-border-color);
          background: var(--wc-alert-background);
          box-shadow: var(--wc-alert-shadow, none);
          color: inherit;
        }

        :host([data-has-icon="false"]) [part="surface"] {
          grid-template-columns: 1fr;
        }

        [part="icon"] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          inline-size: var(--wc-alert-icon-size);
          block-size: var(--wc-alert-icon-size);
          flex-shrink: 0;
          border-radius: var(--wc-alert-icon-radius, 999px);
          background: var(--wc-alert-icon-background);
          color: var(--wc-alert-icon-color);
        }

        [part="icon"][hidden] {
          display: none;
        }

        slot[name="icon"]::slotted(*) {
          inline-size: 100%;
          block-size: 100%;
        }

        [part="content"] {
          display: grid;
          gap: var(--wc-alert-content-gap);
        }

        [part="title"] {
          font-size: var(--wc-alert-title-font-size);
          font-weight: var(--wc-alert-title-font-weight);
          line-height: 1.4;
          color: var(--wc-alert-title-color);
        }

        [part="title"][hidden] {
          display: none;
        }

        slot[name="title"]::slotted(*) {
          margin: 0;
          color: inherit;
          font: inherit;
        }

        [part="description"] {
          color: var(--wc-alert-description-color);
          font-size: var(--wc-alert-description-font-size);
          line-height: 1.55;
        }

        [part="description"][hidden] {
          display: none;
        }

        slot:not([name])::slotted(*) {
          margin: 0;
        }

        slot:not([name])::slotted(ul),
        slot:not([name])::slotted(ol) {
          padding-inline-start: 1.15rem;
        }
      `;

      const surface = document.createElement('div');
      surface.setAttribute('part', 'surface');
      surface.dataset.element = 'surface';

      const iconContainer = document.createElement('div');
      iconContainer.setAttribute('part', 'icon');
      iconContainer.dataset.element = 'icon';
      iconContainer.hidden = true;

      const iconSlot = document.createElement('slot');
      iconSlot.name = 'icon';
      iconContainer.append(iconSlot);

      const content = document.createElement('div');
      content.setAttribute('part', 'content');
      content.dataset.element = 'content';

      const titleContainer = document.createElement('div');
      titleContainer.setAttribute('part', 'title');
      titleContainer.dataset.element = 'title';
      titleContainer.hidden = true;
      titleContainer.id = `wc-alert-title-${alertId}`;

      const titleSlot = document.createElement('slot');
      titleSlot.name = 'title';
      titleContainer.append(titleSlot);

      const descriptionContainer = document.createElement('div');
      descriptionContainer.setAttribute('part', 'description');
      descriptionContainer.dataset.element = 'description';
      descriptionContainer.hidden = true;
      descriptionContainer.id = `wc-alert-description-${alertId}`;

      const descriptionSlot = document.createElement('slot');
      descriptionContainer.append(descriptionSlot);

      content.append(titleContainer, descriptionContainer);
      surface.append(iconContainer, content);
      root.append(style, surface);

      this.dataset.hasIcon = 'false';
      this.dataset.hasTitle = 'false';

      this.#iconContainer = iconContainer;
      this.#iconSlot = iconSlot;
      this.#titleContainer = titleContainer;
      this.#titleSlot = titleSlot;
      this.#descriptionContainer = descriptionContainer;
      this.#descriptionSlot = descriptionSlot;

      this.#handleIconChange = () => {
        this.#syncIcon();
      };
      this.#handleTitleChange = () => {
        this.#syncTitle();
      };
      this.#handleDescriptionChange = () => {
        this.#syncDescription();
      };

      this.#iconSlot.addEventListener('slotchange', this.#handleIconChange);
      this.#titleSlot.addEventListener('slotchange', this.#handleTitleChange);
      this.#descriptionSlot.addEventListener('slotchange', this.#handleDescriptionChange);
    }

    connectedCallback() {
      upgradeProperty(this, 'variant');

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'status');
      }

      if (!this.hasAttribute('aria-live')) {
        this.setAttribute('aria-live', 'polite');
      }

      this.#syncIcon();
      this.#syncTitle();
      this.#syncDescription();
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'variant') {
        if (newValue === '' || newValue === null) {
          this.removeAttribute('variant');
        }
      }
    }

    get variant() {
      return this.getAttribute('variant') ?? 'default';
    }

    /**
     * @param {string | null} value
     */
    set variant(value) {
      if (value === null || value === undefined || value === '' || value === 'default') {
        this.removeAttribute('variant');
        return;
      }
      this.setAttribute('variant', String(value));
    }

    #syncIcon() {
      const hasIcon = hasAssignedContent(this.#iconSlot);
      this.dataset.hasIcon = hasIcon ? 'true' : 'false';
      this.#iconContainer.hidden = !hasIcon;
    }

    #syncTitle() {
      const hasTitle = hasAssignedContent(this.#titleSlot);
      this.dataset.hasTitle = hasTitle ? 'true' : 'false';
      this.#titleContainer.hidden = !hasTitle;
    }

    #syncDescription() {
      const hasDescription = hasAssignedContent(this.#descriptionSlot);
      this.#descriptionContainer.hidden = !hasDescription;
    }
  }

  if (!customElements.get('wc-alert')) {
    customElements.define('wc-alert', WcAlert);
  }
})();

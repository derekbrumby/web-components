/**
 * @file sheet.js
 * @version 1.0.0
 *
 * Sliding sheet component that extends the capabilities of the dialog primitive.
 * Presents supplementary content alongside the main viewport while keeping focus
 * trapped, providing keyboard controls, and exposing rich styling hooks through
 * CSS custom properties and `::part` selectors.
 *
 * Usage:
 * ```html
 * <wc-sheet side="right">
 *   <button slot="trigger">Edit profile</button>
 *   <span slot="title">Edit profile</span>
 *   <span slot="description">Make changes to your profile here.</span>
 *   <form>
 *     <!-- sheet body content -->
 *   </form>
 *   <div slot="footer">
 *     <button type="submit">Save</button>
 *     <button type="button" data-sheet-close>Close</button>
 *   </div>
 * </wc-sheet>
 * ```
 */

(() => {
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  /** @param {HTMLElement} element @param {keyof HTMLElement} property */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  const hasVisibleContent = (nodes) =>
    nodes.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {Element} */ (node);
        if (element.getAttribute('hidden') !== null) {
          return false;
        }
        if (element instanceof HTMLTemplateElement) {
          return element.content.textContent?.trim().length ?? 0 > 0;
        }
        return true;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim().length ?? 0 > 0;
      }
      return false;
    });

  let sheetInstanceCount = 0;

  class WcSheet extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'side'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #portal;
    /** @type {HTMLDivElement} */
    #overlay;
    /** @type {HTMLDivElement} */
    #positioner;
    /** @type {HTMLDivElement} */
    #panel;
    /** @type {HTMLElement} */
    #header;
    /** @type {HTMLElement} */
    #titleContainer;
    /** @type {HTMLElement} */
    #descriptionContainer;
    /** @type {HTMLElement} */
    #footer;
    /** @type {HTMLSlotElement} */
    #triggerSlot;
    /** @type {HTMLSlotElement} */
    #closeSlot;
    /** @type {HTMLSlotElement} */
    #titleSlot;
    /** @type {HTMLSlotElement} */
    #descriptionSlot;
    /** @type {HTMLSlotElement} */
    #footerSlot;
    /** @type {Set<HTMLElement>} */
    #triggerElements = new Set();
    /** @type {Set<HTMLElement>} */
    #closeElements = new Set();
    /** @type {HTMLElement | null} */
    #previousFocused = null;
    /** @type {boolean} */
    #open = false;
    /** @type {"top" | "right" | "bottom" | "left"} */
    #side = 'right';
    /** @type {string} */
    #titleId;
    /** @type {string} */
    #descriptionId;
    /** @type {string} */
    #previousBodyOverflow = '';

    /** @type {() => void} */
    #triggerSlotChangeHandler;
    /** @type {() => void} */
    #closeSlotChangeHandler;
    /** @type {() => void} */
    #titleSlotChangeHandler;
    /** @type {() => void} */
    #descriptionSlotChangeHandler;
    /** @type {() => void} */
    #footerSlotChangeHandler;
    /** @type {(event: MouseEvent) => void} */
    #triggerClickHandler;
    /** @type {(event: MouseEvent) => void} */
    #closeClickHandler;
    /** @type {(event: MouseEvent) => void} */
    #overlayClickHandler;
    /** @type {(event: KeyboardEvent) => void} */
    #keydownHandler;
    /** @type {(event: FocusEvent) => void} */
    #focusinHandler;
    /** @type {(event: MouseEvent) => void} */
    #panelClickHandler;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      sheetInstanceCount += 1;
      this.#titleId = `wc-sheet-title-${sheetInstanceCount}`;
      this.#descriptionId = `wc-sheet-description-${sheetInstanceCount}`;

      this.#root.innerHTML = `
        <style>
          :host {
            display: contents;
          }

          ::slotted([slot="trigger"]) {
            display: inline-block;
          }

          [part="portal"] {
            position: fixed;
            inset: 0;
            z-index: var(--sheet-z-index, 1000);
            display: none;
          }

          :host([open]) [part="portal"] {
            display: block;
          }

          [part="overlay"] {
            position: fixed;
            inset: 0;
            background: var(--sheet-overlay-background, rgba(15, 23, 42, 0.42));
            backdrop-filter: var(--sheet-overlay-backdrop-filter, blur(2px));
            opacity: 0;
            transition: opacity var(--sheet-transition-duration, 220ms)
              var(--sheet-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
          }

          :host([open]) [part="overlay"] {
            opacity: 1;
          }

          [part="positioner"] {
            position: fixed;
            inset: 0;
            display: flex;
            pointer-events: none;
          }

          [part="positioner"][data-side="right"],
          [part="positioner"][data-side="left"] {
            align-items: stretch;
          }

          [part="positioner"][data-side="top"],
          [part="positioner"][data-side="bottom"] {
            justify-content: center;
          }

          [part="positioner"][data-side="right"] {
            justify-content: flex-end;
          }

          [part="positioner"][data-side="left"] {
            justify-content: flex-start;
          }

          [part="positioner"][data-side="top"] {
            align-items: flex-start;
          }

          [part="positioner"][data-side="bottom"] {
            align-items: flex-end;
          }

          [part="panel"] {
            pointer-events: auto;
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: var(--sheet-section-gap, 1.5rem);
            width: min(var(--sheet-width, 28rem), 100vw);
            max-width: var(--sheet-max-width, 100vw);
            height: var(--sheet-height, 100vh);
            max-height: var(--sheet-max-height, 100vh);
            padding: var(--sheet-padding, 1.75rem);
            background: var(--sheet-background, #f8fafc);
            color: var(--sheet-color, #0f172a);
            box-shadow: var(
              --sheet-shadow,
              0 20px 60px -28px rgba(15, 23, 42, 0.45)
            );
            border-radius: var(--sheet-radius, 1.25rem 0 0 1.25rem);
            opacity: 0;
            transform: translateX(100%);
            transition:
              transform var(--sheet-transition-duration, 220ms)
                  var(--sheet-transition-easing, cubic-bezier(0.16, 1, 0.3, 1)),
              opacity var(--sheet-transition-duration, 220ms)
                  var(--sheet-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
          }

          [part="panel"][data-side="left"] {
            border-radius: var(--sheet-radius, 0 1.25rem 1.25rem 0);
            transform: translateX(-100%);
          }

          [part="panel"][data-side="top"],
          [part="panel"][data-side="bottom"] {
            width: min(100vw, var(--sheet-width, 32rem));
            max-width: 100vw;
            height: auto;
            max-height: var(--sheet-max-height, 85vh);
            border-radius: var(--sheet-radius, 1.25rem 1.25rem 0 0);
            grid-template-rows: auto 1fr auto;
          }

          [part="panel"][data-side="top"] {
            transform: translateY(-100%);
          }

          [part="panel"][data-side="bottom"] {
            border-radius: var(--sheet-radius, 0 0 1.25rem 1.25rem);
            transform: translateY(100%);
          }

          :host([open]) [part="panel"] {
            opacity: 1;
          }

          :host([open]) [part="panel"][data-side="right"],
          :host([open]) [part="panel"][data-side="left"] {
            transform: translateX(0);
          }

          :host([open]) [part="panel"][data-side="top"],
          :host([open]) [part="panel"][data-side="bottom"] {
            transform: translateY(0);
          }

          [part="header"] {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: var(--sheet-header-gap, 0.75rem);
            align-items: start;
          }

          [part="header"][data-empty="true"] {
            display: none;
          }

          [part="title-container"] {
            display: grid;
            gap: 0.5rem;
          }

          [part="title-container"][data-empty="true"] {
            display: none;
          }

          [part="title"] {
            margin: 0;
            font-size: var(--sheet-title-size, 1.125rem);
            font-weight: var(--sheet-title-weight, 600);
            letter-spacing: var(--sheet-title-tracking, -0.01em);
          }

          [part="description"] {
            margin: 0;
            color: var(--sheet-description-color, #475569);
            font-size: var(--sheet-description-size, 0.95rem);
            line-height: 1.6;
          }

          [part="description"][data-empty="true"] {
            display: none;
          }

          [part="close"] {
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          [part="close"][data-empty="true"] {
            display: none;
          }

          [part="body"] {
            display: grid;
            gap: var(--sheet-body-gap, 1.25rem);
            overflow: auto;
          }

          [part="footer"] {
            display: flex;
            flex-wrap: wrap;
            gap: var(--sheet-footer-gap, 0.75rem);
            justify-content: flex-end;
          }

          [part="footer"][data-empty="true"] {
            display: none;
          }
        </style>
        <slot name="trigger"></slot>
        <div part="portal" data-state="closed" aria-hidden="true">
          <div part="overlay" data-state="closed"></div>
          <div part="positioner" data-side="right">
            <div
              part="panel"
              data-side="right"
              role="dialog"
              aria-modal="true"
              tabindex="-1"
            >
              <div part="header" data-empty="true">
                <div part="title-container" data-empty="true" id="${this.#titleId}">
                  <h2 part="title"><slot name="title"></slot></h2>
                  <p part="description" data-empty="true" id="${this.#descriptionId}">
                    <slot name="description"></slot>
                  </p>
                </div>
                <div part="close" data-empty="true">
                  <slot name="close"></slot>
                </div>
              </div>
              <div part="body">
                <slot></slot>
              </div>
              <div part="footer" data-empty="true">
                <slot name="footer"></slot>
              </div>
            </div>
          </div>
        </div>
      `;

      this.#portal = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="portal"]'));
      this.#overlay = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="overlay"]'));
      this.#positioner = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="positioner"]'));
      this.#panel = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="panel"]'));
      this.#header = /** @type {HTMLElement} */ (this.#root.querySelector('[part="header"]'));
      this.#titleContainer = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="title-container"]')
      );
      this.#descriptionContainer = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="description"]')
      );
      this.#footer = /** @type {HTMLElement} */ (this.#root.querySelector('[part="footer"]'));
      this.#triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      this.#closeSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="close"]')
      );
      this.#titleSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="title"]')
      );
      this.#descriptionSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="description"]')
      );
      this.#footerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="footer"]')
      );

      this.#triggerSlotChangeHandler = () => {
        this.#syncTriggerListeners();
        this.#syncTriggerExpanded();
      };
      this.#closeSlotChangeHandler = () => {
        this.#syncCloseListeners();
        this.#syncHeaderSection();
      };
      this.#titleSlotChangeHandler = () => {
        this.#syncHeaderSection();
      };
      this.#descriptionSlotChangeHandler = () => {
        this.#syncHeaderSection();
      };
      this.#footerSlotChangeHandler = () => {
        this.#syncFooterSection();
      };

      this.#triggerClickHandler = () => {
        this.show();
      };
      this.#closeClickHandler = (event) => {
        event.preventDefault();
        this.hide();
      };
      this.#overlayClickHandler = (event) => {
        if (event.target === this.#overlay) {
          this.hide();
        }
      };
      this.#keydownHandler = (event) => {
        if (!this.#open) {
          return;
        }
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          this.hide();
          return;
        }
        if (event.key === 'Tab') {
          this.#handleTabKey(event);
        }
      };
      this.#focusinHandler = (event) => {
        if (!this.#open) {
          return;
        }
        const path = event.composedPath();
        if (!path.includes(this.#panel)) {
          this.#focusInitial();
        }
      };
      this.#panelClickHandler = (event) => {
        const target = /** @type {HTMLElement | null} */ (
          event.target instanceof HTMLElement
            ? event.target.closest('[data-sheet-close]')
            : null
        );
        if (target) {
          event.preventDefault();
          this.hide();
        }
      };
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      upgradeProperty(this, 'side');

      this.#triggerSlot.addEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#closeSlot.addEventListener('slotchange', this.#closeSlotChangeHandler);
      this.#titleSlot.addEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.addEventListener('slotchange', this.#descriptionSlotChangeHandler);
      this.#footerSlot.addEventListener('slotchange', this.#footerSlotChangeHandler);

      this.#overlay.addEventListener('click', this.#overlayClickHandler);
      this.#panel.addEventListener('keydown', this.#keydownHandler);
      this.#panel.addEventListener('click', this.#panelClickHandler);
      document.addEventListener('focusin', this.#focusinHandler);

      this.#syncTriggerListeners();
      this.#syncCloseListeners();
      this.#syncHeaderSection();
      this.#syncFooterSection();
      this.#applySideAttribute();
      this.#syncTriggerExpanded();
    }

    disconnectedCallback() {
      this.#triggerSlot.removeEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#closeSlot.removeEventListener('slotchange', this.#closeSlotChangeHandler);
      this.#titleSlot.removeEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.removeEventListener('slotchange', this.#descriptionSlotChangeHandler);
      this.#footerSlot.removeEventListener('slotchange', this.#footerSlotChangeHandler);

      this.#overlay.removeEventListener('click', this.#overlayClickHandler);
      this.#panel.removeEventListener('keydown', this.#keydownHandler);
      this.#panel.removeEventListener('click', this.#panelClickHandler);
      document.removeEventListener('focusin', this.#focusinHandler);

      this.#triggerElements.forEach((element) => {
        element.removeEventListener('click', this.#triggerClickHandler);
      });
      this.#closeElements.forEach((element) => {
        element.removeEventListener('click', this.#closeClickHandler);
      });
    }

    attributeChangedCallback(name, _previous, value) {
      if (name === 'open') {
        this.#toggleSheet(value !== null);
      }
      if (name === 'side') {
        this.#side = this.#normalizeSide(value);
        this.#applySideAttribute();
      }
    }

    /**
     * Whether the sheet is open.
     * @returns {boolean}
     */
    get open() {
      return this.#open;
    }

    set open(next) {
      if (next) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    }

    /**
     * Preferred slide-in side of the sheet.
     * @returns {"top" | "right" | "bottom" | "left"}
     */
    get side() {
      return this.#side;
    }

    set side(value) {
      this.setAttribute('side', value);
    }

    /** Opens the sheet. */
    show() {
      this.open = true;
    }

    /** Closes the sheet. */
    hide() {
      this.open = false;
    }

    /** Toggles the sheet open state. */
    toggle(force) {
      if (typeof force === 'boolean') {
        this.open = force;
        return;
      }
      this.open = !this.open;
    }

    /** @param {boolean} next */
    #toggleSheet(next) {
      this.#open = next;
      this.#portal.dataset.state = next ? 'open' : 'closed';
      this.#overlay.dataset.state = next ? 'open' : 'closed';
      this.#portal.setAttribute('aria-hidden', next ? 'false' : 'true');
      this.#syncTriggerExpanded();

      if (next) {
        this.#previousFocused = /** @type {HTMLElement | null} */ (
          document.activeElement instanceof HTMLElement ? document.activeElement : null
        );
        this.#previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
          this.#focusInitial();
        });
        this.dispatchEvent(new CustomEvent('sheet-open'));
      } else {
        document.body.style.overflow = this.#previousBodyOverflow;
        this.#previousBodyOverflow = '';
        if (this.#previousFocused && typeof this.#previousFocused.focus === 'function') {
          requestAnimationFrame(() => {
            this.#previousFocused?.focus();
          });
        }
        this.dispatchEvent(new CustomEvent('sheet-close'));
      }
    }

    #focusInitial() {
      const focusTargets = this.#getFocusableElements();
      if (focusTargets.length > 0) {
        focusTargets[0].focus({ preventScroll: true });
      } else {
        this.#panel.focus({ preventScroll: true });
      }
    }

    /** @param {KeyboardEvent} event */
    #handleTabKey(event) {
      const focusTargets = this.#getFocusableElements();
      if (focusTargets.length === 0) {
        event.preventDefault();
        this.#panel.focus();
        return;
      }

      const currentIndex = focusTargets.indexOf(
        /** @type {HTMLElement} */ (document.activeElement)
      );

      if (event.shiftKey) {
        if (currentIndex <= 0) {
          event.preventDefault();
          focusTargets[focusTargets.length - 1].focus();
        }
      } else {
        if (currentIndex === -1 || currentIndex >= focusTargets.length - 1) {
          event.preventDefault();
          focusTargets[0].focus();
        }
      }
    }

    /** @returns {HTMLElement[]} */
    #getFocusableElements() {
      const nodes = Array.from(this.#panel.querySelectorAll(focusableSelectors));
      return nodes.filter((element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        if (element.hasAttribute('inert')) {
          return false;
        }
        if (element.offsetParent === null && element !== this.#panel) {
          return false;
        }
        return true;
      });
    }

    #syncTriggerListeners() {
      const assigned = this.#triggerSlot.assignedElements({ flatten: true });
      const next = new Set();
      assigned.forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }
        next.add(element);
        if (!this.#triggerElements.has(element)) {
          element.addEventListener('click', this.#triggerClickHandler);
        }
      });
      this.#triggerElements.forEach((element) => {
        if (!next.has(element)) {
          element.removeEventListener('click', this.#triggerClickHandler);
        }
      });
      this.#triggerElements = next;
    }

    #syncCloseListeners() {
      const assigned = this.#closeSlot.assignedElements({ flatten: true });
      const next = new Set();
      assigned.forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }
        next.add(element);
        if (!this.#closeElements.has(element)) {
          element.addEventListener('click', this.#closeClickHandler);
        }
      });
      this.#closeElements.forEach((element) => {
        if (!next.has(element)) {
          element.removeEventListener('click', this.#closeClickHandler);
        }
      });
      this.#closeElements = next;
      const hasClose = next.size > 0;
      const closeWrapper = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="close"]')
      );
      if (closeWrapper) {
        closeWrapper.setAttribute('data-empty', hasClose ? 'false' : 'true');
      }
    }

    #syncHeaderSection() {
      const hasTitle = this.#slotHasContent(this.#titleSlot);
      const hasDescription = this.#slotHasContent(this.#descriptionSlot);
      const hasHeader = hasTitle || hasDescription || this.#closeElements.size > 0;
      this.#header.setAttribute('data-empty', hasHeader ? 'false' : 'true');
      this.#titleContainer.setAttribute('data-empty', hasTitle ? 'false' : 'true');
      this.#descriptionContainer.setAttribute('data-empty', hasDescription ? 'false' : 'true');

      if (hasTitle) {
        this.#panel.setAttribute('aria-labelledby', this.#titleContainer.id);
      } else {
        this.#panel.removeAttribute('aria-labelledby');
      }

      if (hasDescription) {
        this.#panel.setAttribute('aria-describedby', this.#descriptionContainer.id);
      } else {
        this.#panel.removeAttribute('aria-describedby');
      }
    }

    #syncFooterSection() {
      const hasFooter = this.#slotHasContent(this.#footerSlot);
      this.#footer.setAttribute('data-empty', hasFooter ? 'false' : 'true');
    }

    #syncTriggerExpanded() {
      const expanded = this.#open ? 'true' : 'false';
      this.#triggerElements.forEach((element) => {
        element.setAttribute('aria-expanded', expanded);
      });
    }

    /** @param {HTMLSlotElement} slot */
    #slotHasContent(slot) {
      const nodes = slot.assignedNodes({ flatten: true });
      return hasVisibleContent(nodes);
    }

    #applySideAttribute() {
      this.#positioner.dataset.side = this.#side;
      this.#panel.dataset.side = this.#side;
    }

    /**
     * @param {string | null} value
     * @returns {"top" | "right" | "bottom" | "left"}
     */
    #normalizeSide(value) {
      switch ((value ?? '').toLowerCase()) {
        case 'top':
          return 'top';
        case 'bottom':
          return 'bottom';
        case 'left':
          return 'left';
        case 'right':
        default:
          return 'right';
      }
    }
  }

  if (!customElements.get('wc-sheet')) {
    customElements.define('wc-sheet', WcSheet);
  }
})();

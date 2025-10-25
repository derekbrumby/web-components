/**
 * @file drawer.js
 * @version 1.0.0
 *
 * Accessible drawer component inspired by Vaul and Radix UI's Drawer primitive.
 * The element renders a modal sheet that slides from any edge of the viewport
 * while trapping focus and exposing rich styling hooks via CSS custom
 * properties and `::part` selectors.
 *
 * Usage:
 * ```html
 * <wc-drawer placement="bottom">
 *   <button slot="trigger">Open drawer</button>
 *   <span slot="title">Move goal</span>
 *   <span slot="description">Set your daily activity goal.</span>
 *   <form>
 *     <!-- drawer body -->
 *   </form>
 *   <div slot="footer">
 *     <button type="submit">Save</button>
 *     <button type="button" data-drawer-close>Cancel</button>
 *   </div>
 * </wc-drawer>
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
    'details summary',
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

  let drawerInstanceCount = 0;

  class WcDrawer extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'placement'];
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
    #footer;
    /** @type {HTMLElement} */
    #titleContainer;
    /** @type {HTMLElement} */
    #descriptionContainer;
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
    #placement = 'bottom';
    /** @type {string} */
    #titleId;
    /** @type {string} */
    #descriptionId;
    /** @type {string} */
    #previousBodyOverflow = '';

    /** @type {(event: Event) => void} */
    #triggerSlotChangeHandler;
    /** @type {(event: Event) => void} */
    #closeSlotChangeHandler;
    /** @type {(event: Event) => void} */
    #titleSlotChangeHandler;
    /** @type {(event: Event) => void} */
    #descriptionSlotChangeHandler;
    /** @type {(event: Event) => void} */
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
      drawerInstanceCount += 1;
      this.#titleId = `wc-drawer-title-${drawerInstanceCount}`;
      this.#descriptionId = `wc-drawer-description-${drawerInstanceCount}`;

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
            display: none;
            z-index: var(--drawer-z-index, 9999);
          }

          :host([open]) [part="portal"] {
            display: block;
          }

          [part="overlay"] {
            position: fixed;
            inset: 0;
            background: var(--drawer-overlay-background, rgba(9, 9, 11, 0.45));
            backdrop-filter: var(--drawer-overlay-backdrop-filter, blur(4px));
            opacity: 0;
            transition: opacity var(--drawer-transition-duration, 220ms)
              var(--drawer-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
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

          [data-placement="bottom"] {
            justify-content: center;
            align-items: flex-end;
          }

          [data-placement="top"] {
            justify-content: center;
            align-items: flex-start;
          }

          [data-placement="left"] {
            justify-content: flex-start;
            align-items: center;
          }

          [data-placement="right"] {
            justify-content: flex-end;
            align-items: center;
          }

          [part="panel"] {
            pointer-events: auto;
            background: var(--drawer-background, #f8fafc);
            color: var(--drawer-color, #0f172a);
            border-radius: var(--drawer-radius, 1rem 1rem 0 0);
            box-shadow: var(
              --drawer-shadow,
              0 32px 64px -40px rgba(15, 23, 42, 0.6)
            );
            width: var(--drawer-width, min(100vw, 26rem));
            max-width: var(--drawer-max-width, 100vw);
            height: var(--drawer-height, auto);
            max-height: var(--drawer-max-height, 90vh);
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: var(--drawer-section-gap, 1.25rem);
            padding: var(--drawer-padding, 1.5rem);
            transform: translateY(100%);
            transition: transform var(--drawer-transition-duration, 220ms)
              var(--drawer-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
          }

          :host([open]) [part="panel"] {
            transform: translateY(0);
          }

          :host([open][placement="top"]) [part="panel"] {
            transform: translateY(0);
          }

          :host([placement="top"]) [part="panel"] {
            border-radius: var(--drawer-radius, 0 0 1rem 1rem);
            transform: translateY(-100%);
          }

          :host([placement="left"]) [part="panel"] {
            border-radius: var(--drawer-radius, 0 1rem 1rem 0);
            transform: translateX(-100%);
            height: var(--drawer-height, 100vh);
            max-height: 100vh;
          }

          :host([placement="right"]) [part="panel"] {
            border-radius: var(--drawer-radius, 1rem 0 0 1rem);
            transform: translateX(100%);
            height: var(--drawer-height, 100vh);
            max-height: 100vh;
          }

          :host([open][placement="left"]) [part="panel"],
          :host([open][placement="right"]) [part="panel"],
          :host([open][placement="top"]) [part="panel"] {
            transform: translate(0, 0);
          }

          [part="header"],
          [part="footer"] {
            display: grid;
            gap: var(--drawer-header-gap, 0.5rem);
          }

          [part="header"][data-empty="true"],
          [part="footer"][data-empty="true"],
          [part="close"][data-empty="true"] {
            display: none;
          }

          [part="title"] {
            font-size: var(--drawer-title-size, 1.25rem);
            font-weight: var(--drawer-title-weight, 700);
            letter-spacing: var(--drawer-title-tracking, -0.02em);
          }

          [part="description"] {
            color: var(--drawer-description-color, rgba(15, 23, 42, 0.75));
            font-size: var(--drawer-description-size, 0.95rem);
          }

          [part="title"][data-empty="true"],
          [part="description"][data-empty="true"] {
            display: none;
          }

          [part="body"] {
            overflow: auto;
          }
        </style>
        <slot name="trigger"></slot>
        <div part="portal" data-state="closed" aria-hidden="true">
          <div part="overlay"></div>
          <div part="positioner" data-placement="bottom">
            <div
              part="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="${this.#titleId}"
              aria-describedby="${this.#descriptionId}"
              tabindex="-1"
            >
              <header part="header" data-empty="true">
                <div part="title" id="${this.#titleId}">
                  <slot name="title"></slot>
                </div>
                <div part="description" id="${this.#descriptionId}">
                  <slot name="description"></slot>
                </div>
              </header>
              <div part="body">
                <slot></slot>
              </div>
              <footer part="footer" data-empty="true">
                <slot name="footer"></slot>
              </footer>
              <div part="close" data-empty="true">
                <slot name="close"></slot>
              </div>
            </div>
          </div>
        </div>
      `;

      this.#portal = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="portal"]')
      );
      this.#overlay = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="overlay"]')
      );
      this.#positioner = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="positioner"]')
      );
      this.#panel = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="panel"]')
      );
      this.#header = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="header"]')
      );
      this.#footer = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="footer"]')
      );
      this.#titleContainer = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="title"]')
      );
      this.#descriptionContainer = /** @type {HTMLElement} */ (
        this.#root.querySelector('[part="description"]')
      );
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
            ? event.target.closest('[data-drawer-close]')
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
      upgradeProperty(this, 'placement');

      this.#triggerSlot.addEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#closeSlot.addEventListener('slotchange', this.#closeSlotChangeHandler);
      this.#titleSlot.addEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.addEventListener(
        'slotchange',
        this.#descriptionSlotChangeHandler
      );
      this.#footerSlot.addEventListener('slotchange', this.#footerSlotChangeHandler);

      this.#overlay.addEventListener('click', this.#overlayClickHandler);
      this.#panel.addEventListener('keydown', this.#keydownHandler);
      this.#panel.addEventListener('click', this.#panelClickHandler);
      document.addEventListener('focusin', this.#focusinHandler);

      this.#syncTriggerListeners();
      this.#syncCloseListeners();
      this.#syncHeaderSection();
      this.#syncFooterSection();
      this.#applyPlacementAttribute();
      this.#syncTriggerExpanded();
    }

    disconnectedCallback() {
      this.#triggerSlot.removeEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#closeSlot.removeEventListener('slotchange', this.#closeSlotChangeHandler);
      this.#titleSlot.removeEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.removeEventListener(
        'slotchange',
        this.#descriptionSlotChangeHandler
      );
      this.#footerSlot.removeEventListener('slotchange', this.#footerSlotChangeHandler);

      this.#overlay.removeEventListener('click', this.#overlayClickHandler);
      this.#panel.removeEventListener('keydown', this.#keydownHandler);
      this.#panel.removeEventListener('click', this.#panelClickHandler);
      document.removeEventListener('focusin', this.#focusinHandler);

      this.#triggerElements.forEach((element) => {
        element.removeEventListener('click', this.#triggerClickHandler);
      });
      this.#triggerElements.clear();
      this.#closeElements.forEach((element) => {
        element.removeEventListener('click', this.#closeClickHandler);
      });
      this.#closeElements.clear();
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'open') {
        const next = newValue !== null;
        if (next !== this.#open) {
          this.#toggleDrawer(next);
        } else {
          this.#syncTriggerExpanded();
        }
      }
      if (name === 'placement') {
        this.#placement = this.#normalizePlacement(newValue);
        this.#applyPlacementAttribute();
      }
    }

    /**
     * Whether the drawer is open.
     * @returns {boolean}
     */
    get open() {
      return this.#open;
    }

    set open(value) {
      if (value) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    }

    /**
     * Drawer placement relative to the viewport.
     * @returns {"top" | "right" | "bottom" | "left"}
     */
    get placement() {
      return this.#placement;
    }

    set placement(value) {
      this.setAttribute('placement', value);
    }

    /** Opens the drawer. */
    show() {
      this.open = true;
    }

    /** Closes the drawer. */
    hide() {
      this.open = false;
    }

    /** Toggles the drawer open state. */
    toggle(force) {
      if (typeof force === 'boolean') {
        this.open = force;
        return;
      }
      this.open = !this.open;
    }

    /** @param {boolean} next */
    #toggleDrawer(next) {
      this.#open = next;
      this.#portal.dataset.state = next ? 'open' : 'closed';
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
        this.dispatchEvent(new CustomEvent('drawer-open'));
      } else {
        document.body.style.overflow = this.#previousBodyOverflow;
        this.#previousBodyOverflow = '';
        if (this.#previousFocused && typeof this.#previousFocused.focus === 'function') {
          requestAnimationFrame(() => {
            this.#previousFocused?.focus();
          });
        }
        this.dispatchEvent(new CustomEvent('drawer-close'));
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
        return !element.matches('[disabled], [aria-hidden="true"], [hidden]');
      });
    }

    #syncTriggerListeners() {
      const assigned = this.#triggerSlot.assignedElements({ flatten: true });
      const next = new Set(assigned.filter((node) => node instanceof HTMLElement));
      this.#triggerElements.forEach((element) => {
        if (!next.has(element)) {
          element.removeEventListener('click', this.#triggerClickHandler);
        }
      });
      next.forEach((element) => {
        if (!this.#triggerElements.has(element)) {
          element.addEventListener('click', this.#triggerClickHandler);
        }
        element.setAttribute('aria-haspopup', 'dialog');
        element.setAttribute('aria-expanded', String(this.#open));
      });
      this.#triggerElements = next;
    }

    #syncTriggerExpanded() {
      this.#triggerElements.forEach((element) => {
        element.setAttribute('aria-expanded', String(this.#open));
      });
    }

    #syncCloseListeners() {
      const assigned = this.#closeSlot.assignedElements({ flatten: true });
      const nodes = assigned.filter((node) => node instanceof HTMLElement);
      const next = new Set(nodes);
      this.#closeElements.forEach((element) => {
        if (!next.has(element)) {
          element.removeEventListener('click', this.#closeClickHandler);
        }
      });
      next.forEach((element) => {
        if (!this.#closeElements.has(element)) {
          element.addEventListener('click', this.#closeClickHandler);
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
      const hasHeader = hasTitle || hasDescription;
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

    /** @param {HTMLSlotElement} slot */
    #slotHasContent(slot) {
      const nodes = slot.assignedNodes({ flatten: true });
      return hasVisibleContent(nodes);
    }

    #applyPlacementAttribute() {
      this.#positioner.dataset.placement = this.#placement;
    }

    /**
     * @param {string | null} value
     * @returns {"top" | "right" | "bottom" | "left"}
     */
    #normalizePlacement(value) {
      switch ((value ?? '').toLowerCase()) {
        case 'top':
          return 'top';
        case 'left':
          return 'left';
        case 'right':
          return 'right';
        default:
          return 'bottom';
      }
    }
  }

  if (!customElements.get('wc-drawer')) {
    customElements.define('wc-drawer', WcDrawer);
  }
})();

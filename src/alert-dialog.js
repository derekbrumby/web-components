/**
 * @file alert-dialog.js
 * @version 1.0.0
 *
 * Accessible alert dialog web component inspired by Radix UI's AlertDialog.
 * Features:
 * - Trigger slot to open the dialog and declarative open attribute/property.
 * - Focus trapping with automatic return to the previously focused element.
 * - Keyboard support (Esc closes, Tab wraps) and labelled content slots.
 * - Customisable styling hooks through CSS custom properties and ::part selectors.
 *
 * Usage:
 * <wc-alert-dialog>
 *   <button slot="trigger">Delete account</button>
 *   <span slot="title">Are you absolutely sure?</span>
 *   <span slot="description">This action cannot be undone.</span>
 *   <button slot="cancel">Cancel</button>
 *   <button slot="action">Yes, delete account</button>
 * </wc-alert-dialog>
 */

(() => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let dialogInstanceCount = 0;

  /** @param {HTMLElement} element @param {keyof HTMLElement} property */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  class WcAlertDialog extends HTMLElement {
    static get observedAttributes() {
      return ['open'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #overlay;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLSlotElement} */
    #triggerSlot;
    /** @type {HTMLSlotElement} */
    #cancelSlot;
    /** @type {HTMLSlotElement} */
    #actionSlot;
    /** @type {HTMLSlotElement} */
    #titleSlot;
    /** @type {HTMLSlotElement} */
    #descriptionSlot;
    /** @type {HTMLElement | null} */
    #previousFocused = null;
    /** @type {boolean} */
    #open = false;
    /** @type {string} */
    #labelId;
    /** @type {string} */
    #descriptionId;
    /** @type {string} */
    #previousBodyOverflow = '';
    /** @type {HTMLButtonElement | null} */
    #cancelFallback;
    /** @type {HTMLButtonElement | null} */
    #actionFallback;
    /** @type {() => void} */
    #triggerSlotChangeHandler;
    /** @type {() => void} */
    #cancelSlotChangeHandler;
    /** @type {() => void} */
    #actionSlotChangeHandler;
    /** @type {() => void} */
    #titleSlotChangeHandler;
    /** @type {() => void} */
    #descriptionSlotChangeHandler;
    /** @type {(event: MouseEvent) => void} */
    #triggerClickHandler;
    /** @type {(event: MouseEvent) => void} */
    #cancelClickHandler;
    /** @type {(event: MouseEvent) => void} */
    #confirmClickHandler;
    /** @type {(event: KeyboardEvent) => void} */
    #keydownHandler;
    /** @type {(event: FocusEvent) => void} */
    #focusInHandler;
    /** @type {(event: MouseEvent) => void} */
    #overlayClickHandler;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      dialogInstanceCount += 1;
      this.#labelId = `wc-alert-dialog-label-${dialogInstanceCount}`;
      this.#descriptionId = `wc-alert-dialog-description-${dialogInstanceCount}`;

      this.#root.innerHTML = `
        <style>
          :host {
            display: contents;
          }

          [part="portal"] {
            position: fixed;
            inset: 0;
            display: none;
            z-index: var(--alert-dialog-z-index, 9999);
          }

          :host([open]) [part="portal"] {
            display: block;
          }

          [part="overlay"] {
            position: fixed;
            inset: 0;
            background: var(--alert-dialog-overlay-background, rgba(9, 9, 11, 0.5));
            backdrop-filter: var(--alert-dialog-overlay-backdrop-filter, blur(1px));
            opacity: 0;
            transition: opacity var(--alert-dialog-transition-duration, 200ms)
              var(--alert-dialog-transition-easing, cubic-bezier(0.32, 0.72, 0, 1));
          }

          :host([open]) [part="overlay"] {
            opacity: 1;
          }

          [part="content"] {
            position: fixed;
            inset: 50% auto auto 50%;
            transform: translate(-50%, -40%) scale(0.98);
            min-width: min(90vw, 22rem);
            max-width: var(--alert-dialog-max-width, 32rem);
            max-height: 85vh;
            overflow: auto;
            padding: var(--alert-dialog-padding, 1.5rem);
            border-radius: var(--alert-dialog-radius, 0.75rem);
            background: var(--alert-dialog-background, #ffffff);
            color: var(--alert-dialog-color, #111827);
            box-shadow: var(--alert-dialog-shadow, 0px 24px 48px rgba(15, 23, 42, 0.25));
            opacity: 0;
            transition:
              transform var(--alert-dialog-transition-duration, 200ms)
                var(--alert-dialog-transition-easing, cubic-bezier(0.32, 0.72, 0, 1)),
              opacity var(--alert-dialog-transition-duration, 200ms)
                var(--alert-dialog-transition-easing, cubic-bezier(0.32, 0.72, 0, 1));
          }

          :host([open]) [part="content"] {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }

          [part="title"] {
            margin: 0;
            font-size: var(--alert-dialog-title-size, 1.0625rem);
            font-weight: var(--alert-dialog-title-weight, 600);
            color: inherit;
          }

          [part="description"] {
            margin: var(--alert-dialog-description-margin, 0.75rem 0 1.5rem);
            color: var(--alert-dialog-description-color, #374151);
            font-size: var(--alert-dialog-description-size, 0.95rem);
            line-height: 1.6;
          }

          [part="body"] {
            margin: var(--alert-dialog-body-margin, 0 0 1.5rem 0);
            color: var(--alert-dialog-body-color, inherit);
          }

          [part="footer"] {
            display: flex;
            justify-content: flex-end;
            gap: var(--alert-dialog-footer-gap, 1rem);
          }

          ::slotted([slot="trigger"]) {
            cursor: pointer;
          }

          ::slotted([slot="cancel"]),
          ::slotted([slot="action"]) {
            appearance: none;
            font: inherit;
            border-radius: var(--alert-dialog-button-radius, 0.5rem);
            padding: var(--alert-dialog-button-padding, 0.5rem 1rem);
            border: none;
            cursor: pointer;
          }

          ::slotted([slot="cancel"]) {
            background: var(--alert-dialog-cancel-background, #f3f4f6);
            color: var(--alert-dialog-cancel-color, #111827);
          }

          ::slotted([slot="action"]) {
            background: var(--alert-dialog-action-background, #ef4444);
            color: var(--alert-dialog-action-color, #ffffff);
          }

          [part="cancel-button"],
          [part="action-button"] {
            appearance: none;
            font: inherit;
            border-radius: var(--alert-dialog-button-radius, 0.5rem);
            padding: var(--alert-dialog-button-padding, 0.5rem 1rem);
            border: none;
            cursor: pointer;
          }

          [part="cancel-button"] {
            background: var(--alert-dialog-cancel-background, #f3f4f6);
            color: var(--alert-dialog-cancel-color, #111827);
          }

          [part="action-button"] {
            background: var(--alert-dialog-action-background, #ef4444);
            color: var(--alert-dialog-action-color, #ffffff);
          }
        </style>
        <div part="portal" data-state="closed">
          <div part="overlay" role="presentation"></div>
          <div part="content" role="alertdialog" aria-modal="true" tabindex="-1">
            <header part="header">
              <slot name="title" part="title"></slot>
            </header>
            <section part="description-wrapper">
              <slot name="description" part="description"></slot>
            </section>
            <div part="body">
              <slot></slot>
            </div>
            <footer part="footer">
              <slot name="cancel">
                <button
                  type="button"
                  part="cancel-button"
                  data-fallback-button="cancel"
                >
                  Cancel
                </button>
              </slot>
              <slot name="action">
                <button
                  type="button"
                  part="action-button"
                  data-fallback-button="action"
                >
                  Confirm
                </button>
              </slot>
            </footer>
          </div>
        </div>
        <slot name="trigger"></slot>
      `;

      this.#overlay = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="overlay"]')
      );
      this.#content = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="content"]')
      );
      this.#triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      this.#cancelSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="cancel"]')
      );
      this.#actionSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="action"]')
      );
      this.#titleSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="title"]')
      );
      this.#descriptionSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="description"]')
      );
      this.#cancelFallback = /** @type {HTMLButtonElement | null} */ (
        this.#root.querySelector('[data-fallback-button="cancel"]')
      );
      this.#actionFallback = /** @type {HTMLButtonElement | null} */ (
        this.#root.querySelector('[data-fallback-button="action"]')
      );

      this.#triggerSlotChangeHandler = () => this.#onTriggerSlotChange();
      this.#cancelSlotChangeHandler = () => this.#onCancelSlotChange();
      this.#actionSlotChangeHandler = () => this.#onActionSlotChange();
      this.#titleSlotChangeHandler = () => this.#onTitleSlotChange();
      this.#descriptionSlotChangeHandler = () => this.#onDescriptionSlotChange();
      this.#triggerClickHandler = (event) => this.#openFromTrigger(event);
      this.#cancelClickHandler = (event) => this.#cancelFromButton(event);
      this.#confirmClickHandler = (event) => this.#confirmFromButton(event);
      this.#keydownHandler = (event) => this.#handleKeydown(event);
      this.#focusInHandler = (event) => this.#handleFocusIn(event);
      this.#overlayClickHandler = (event) => this.#handleOverlayClick(event);
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      this.#triggerSlot.addEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#cancelSlot.addEventListener('slotchange', this.#cancelSlotChangeHandler);
      this.#actionSlot.addEventListener('slotchange', this.#actionSlotChangeHandler);
      this.#titleSlot.addEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.addEventListener(
        'slotchange',
        this.#descriptionSlotChangeHandler
      );
      this.#overlay.addEventListener('click', this.#overlayClickHandler);
      this.#content.addEventListener('keydown', this.#keydownHandler);
      this.addEventListener('focusin', this.#focusInHandler);
      if (this.#cancelFallback) {
        this.#cancelFallback.addEventListener('click', this.#cancelClickHandler);
      }
      if (this.#actionFallback) {
        this.#actionFallback.addEventListener('click', this.#confirmClickHandler);
      }
      this.#syncAria();
      this.#onTriggerSlotChange();
      this.#onCancelSlotChange();
      this.#onActionSlotChange();
    }

    disconnectedCallback() {
      this.#triggerSlot.removeEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#cancelSlot.removeEventListener('slotchange', this.#cancelSlotChangeHandler);
      this.#actionSlot.removeEventListener('slotchange', this.#actionSlotChangeHandler);
      this.#titleSlot.removeEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.removeEventListener(
        'slotchange',
        this.#descriptionSlotChangeHandler
      );
      this.#overlay.removeEventListener('click', this.#overlayClickHandler);
      this.#content.removeEventListener('keydown', this.#keydownHandler);
      this.removeEventListener('focusin', this.#focusInHandler);
      if (this.#cancelFallback) {
        this.#cancelFallback.removeEventListener('click', this.#cancelClickHandler);
      }
      if (this.#actionFallback) {
        this.#actionFallback.removeEventListener('click', this.#confirmClickHandler);
      }
    }

    /** @returns {boolean} */
    get open() {
      return this.#open;
    }

    /** @param {boolean} value */
    set open(value) {
      const isOpen = Boolean(value);
      if (isOpen === this.#open) return;
      this.#open = isOpen;
      if (this.#open) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
      this.#toggleModal(this.#open);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'open') {
        const isOpen = newValue !== null;
        if (isOpen !== this.#open) {
          this.#open = isOpen;
          this.#toggleModal(this.#open);
        }
      }
    }

    /** @param {boolean} open */
    #toggleModal(open) {
      const portal = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="portal"]')
      );
      portal.dataset.state = open ? 'open' : 'closed';

      if (open) {
        this.#previousFocused = /** @type {HTMLElement | null} */ (
          (this.getRootNode()) instanceof ShadowRoot
            ? /** @type {ShadowRoot} */ (this.getRootNode()).host instanceof HTMLElement
              ? document.activeElement
              : /** @type {HTMLElement | null} */ (document.activeElement)
            : /** @type {HTMLElement | null} */ (document.activeElement)
        );
        this.#content.setAttribute('aria-labelledby', this.#labelId);
        this.#content.setAttribute('aria-describedby', this.#descriptionId);
        const active = /** @type {Element | null} */ (document.activeElement);
        this.#previousFocused = active instanceof HTMLElement ? active : null;
        this.#content.focus({ preventScroll: true });
        const focusNext = () => {
          const focusable = this.#getFocusableElements();
          if (focusable.length) {
            focusable[0].focus({ preventScroll: true });
          } else {
            this.#content.focus({ preventScroll: true });
          }
        };
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(focusNext);
        } else {
          focusNext();
        }
        document.addEventListener('keydown', this.#keydownHandler, true);
        if (document.body) {
          this.#previousBodyOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        }
      } else {
        document.removeEventListener('keydown', this.#keydownHandler, true);
        if (document.body) {
          document.body.style.overflow = this.#previousBodyOverflow;
        }
        if (this.#previousFocused && typeof this.#previousFocused.focus === 'function') {
          this.#previousFocused.focus();
        }
      }
      this.#syncTriggerExpanded();
    }

    #onTriggerSlotChange() {
      const nodes = this.#triggerSlot.assignedElements({ flatten: true });
      nodes.forEach((node) => {
        node.removeEventListener('click', this.#triggerClickHandler);
      });
      nodes.forEach((node) => {
        node.addEventListener('click', this.#triggerClickHandler);
        node.setAttribute('aria-haspopup', 'dialog');
        node.setAttribute('aria-expanded', String(this.open));
      });
    }

    #onCancelSlotChange() {
      const nodes = this.#cancelSlot.assignedElements({ flatten: true });
      nodes.forEach((node) => {
        node.removeEventListener('click', this.#cancelClickHandler);
      });
      nodes.forEach((node) => {
        node.addEventListener('click', this.#cancelClickHandler);
        node.setAttribute('data-dialog-role', 'cancel');
      });
      this.#toggleFallbackState('cancel', nodes.length > 0);
    }

    #onActionSlotChange() {
      const nodes = this.#actionSlot.assignedElements({ flatten: true });
      nodes.forEach((node) => {
        node.removeEventListener('click', this.#confirmClickHandler);
      });
      nodes.forEach((node) => {
        node.addEventListener('click', this.#confirmClickHandler);
        node.setAttribute('data-dialog-role', 'action');
      });
      this.#toggleFallbackState('action', nodes.length > 0);
    }

    #onTitleSlotChange() {
      const nodes = this.#titleSlot.assignedElements({ flatten: true });
      if (nodes.length) {
        const first = nodes[0];
        if (!first.id) {
          first.id = this.#labelId;
        }
        this.#content.setAttribute('aria-labelledby', first.id);
      } else {
        this.#content.removeAttribute('aria-labelledby');
      }
    }

    #onDescriptionSlotChange() {
      const nodes = this.#descriptionSlot.assignedElements({ flatten: true });
      if (nodes.length) {
        const first = nodes[0];
        if (!first.id) {
          first.id = this.#descriptionId;
        }
        this.#content.setAttribute('aria-describedby', first.id);
      } else {
        this.#content.removeAttribute('aria-describedby');
      }
    }

    /** @param {MouseEvent} event */
    #handleOverlayClick(event) {
      if (event.target === this.#overlay) {
        this.#requestClose('cancel');
      }
    }

    /** @param {KeyboardEvent} event */
    #handleKeydown(event) {
      if (!this.open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.#requestClose('cancel');
        return;
      }
      if (event.key === 'Tab') {
        const focusable = this.#getFocusableElements();
        if (!focusable.length) {
          event.preventDefault();
          this.#content.focus();
          return;
        }
        const current = /** @type {HTMLElement} */ (document.activeElement);
        const lastIndex = focusable.length - 1;
        const first = focusable[0];
        const last = focusable[lastIndex];
        if (event.shiftKey && current === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && current === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    /** @param {FocusEvent} event */
    #handleFocusIn(event) {
      if (!this.open) return;
      const path = event.composedPath();
      const withinDialog = path.some((node) => {
        if (node === this.#content) return true;
        if (node instanceof HTMLElement && this.contains(node)) {
          return node.getAttribute('slot') !== 'trigger';
        }
        return false;
      });
      if (!withinDialog) {
        const focusable = this.#getFocusableElements();
        if (focusable.length) {
          focusable[0].focus();
        } else {
          this.#content.focus();
        }
      }
    }

    #syncAria() {
      this.#onTitleSlotChange();
      this.#onDescriptionSlotChange();
    }

    #syncTriggerExpanded() {
      const triggers = this.#triggerSlot.assignedElements({ flatten: true });
      triggers.forEach((trigger) => {
        trigger.setAttribute('aria-expanded', String(this.open));
      });
    }

    /** @returns {HTMLElement[]} */
    #getFocusableElements() {
      const nodes = this.querySelectorAll(focusableSelectors);
      return Array.from(nodes).filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (el.hasAttribute('disabled')) return false;
        if (el.hidden) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        if (el.getAttribute('slot') === 'trigger') return false;
        return this.contains(el);
      });
    }

    /** @param {MouseEvent} event */
    #openFromTrigger(event) {
      event.preventDefault();
      this.show();
    }

    /** @param {MouseEvent} event */
    #cancelFromButton(event) {
      event.preventDefault();
      this.#requestClose('cancel');
    }

    /** @param {MouseEvent} event */
    #confirmFromButton(event) {
      event.preventDefault();
      this.#requestClose('confirm');
    }

    /**
     * @param {'cancel' | 'confirm'} type
     */
    #requestClose(type) {
      const eventName = type === 'confirm' ? 'confirm' : 'cancel';
      const customEvent = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        composed: true
      });
      const defaultPrevented = !this.dispatchEvent(customEvent);
      if (defaultPrevented) {
        return;
      }
      this.open = false;
    }

    /**
     * @param {'cancel' | 'action'} kind
     * @param {boolean} hasAssigned
     */
    #toggleFallbackState(kind, hasAssigned) {
      const fallback =
        kind === 'cancel' ? this.#cancelFallback : this.#actionFallback;
      if (!fallback) return;
      fallback.toggleAttribute('data-hidden', hasAssigned);
      fallback.hidden = hasAssigned;
      if (hasAssigned) {
        fallback.setAttribute('aria-hidden', 'true');
      } else {
        fallback.removeAttribute('aria-hidden');
      }
    }

    /** Opens the dialog. */
    show() {
      this.open = true;
    }

    /** Closes the dialog. */
    hide() {
      this.open = false;
    }

    /**
     * Toggles the dialog open state.
     * @param {boolean} [force] - Optionally force a specific state.
     */
    toggle(force) {
      if (typeof force === 'boolean') {
        this.open = force;
      } else {
        this.open = !this.open;
      }
    }
  }

  if (!customElements.get('wc-alert-dialog')) {
    customElements.define('wc-alert-dialog', WcAlertDialog);
  }

  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.WcAlertDialog = WcAlertDialog;
  }
})();

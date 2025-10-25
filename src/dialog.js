/**
 * @file dialog.js
 * @version 1.0.0
 *
 * Accessible dialog web component inspired by Radix UI's Dialog primitive.
 * Features:
 * - Supports modal (default) and non-modal presentations with focus trapping when modal.
 * - Declarative and imperative control through the `open` attribute/property and `show`/`hide` helpers.
 * - Accessible labelling via dedicated `title` and `description` slots and automatic announcements.
 * - Keyboard support (Esc to close, Tab trapping), overlay click dismissal, and return focus to the trigger.
 * - Customisable styling with CSS custom properties and exposed `::part` selectors.
 *
 * Usage:
 * <wc-dialog>
 *   <button slot="trigger">Edit profile</button>
 *   <span slot="title">Edit profile</span>
 *   <span slot="description">Update your public profile information.</span>
 *   <form>
 *     <!-- dialog body content -->
 *   </form>
 *   <button slot="close">Close</button>
 * </wc-dialog>
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

  class WcDialog extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'modal'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #portal;
    /** @type {HTMLDivElement} */
    #overlay;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLSlotElement} */
    #triggerSlot;
    /** @type {HTMLSlotElement} */
    #titleSlot;
    /** @type {HTMLSlotElement} */
    #descriptionSlot;
    /** @type {HTMLSlotElement} */
    #closeSlot;
    /** @type {HTMLElement | null} */
    #previousFocused = null;
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #modal = true;
    /** @type {string} */
    #labelId;
    /** @type {string} */
    #descriptionId;
    /** @type {{ element: HTMLElement; inert: boolean; ariaHidden: string | null }[]} */
    #inertSiblings = [];
    /** @type {string} */
    #previousBodyOverflow = '';
    /** @type {HTMLButtonElement | null} */
    #closeFallback = null;
    /** @type {() => void} */
    #triggerSlotChangeHandler;
    /** @type {() => void} */
    #titleSlotChangeHandler;
    /** @type {() => void} */
    #descriptionSlotChangeHandler;
    /** @type {() => void} */
    #closeSlotChangeHandler;
    /** @type {(event: MouseEvent) => void} */
    #triggerClickHandler;
    /** @type {(event: MouseEvent) => void} */
    #closeClickHandler;
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
      this.#labelId = `wc-dialog-label-${dialogInstanceCount}`;
      this.#descriptionId = `wc-dialog-description-${dialogInstanceCount}`;

      this.#root.innerHTML = `
        <style>
          :host {
            display: contents;
          }

          [part="trigger"] {
            display: inline-block;
          }

          [part="portal"] {
            position: fixed;
            inset: 0;
            display: none;
            z-index: var(--dialog-z-index, 9999);
          }

          :host([open]) [part="portal"] {
            display: block;
          }

          [part="overlay"] {
            position: fixed;
            inset: 0;
            background: var(--dialog-overlay-background, rgba(9, 9, 11, 0.45));
            backdrop-filter: var(--dialog-overlay-backdrop-filter, blur(2px));
            opacity: 0;
            transition: opacity var(--dialog-transition-duration, 180ms)
              var(--dialog-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
          }

          :host([open]) [part="overlay"] {
            opacity: 1;
          }

          :host(:where([modal="false"])) [part="overlay"] {
            pointer-events: none;
            opacity: 0;
          }

          [part="content"] {
            position: fixed;
            inset: 50% auto auto 50%;
            transform: translate(-50%, -44%) scale(0.96);
            width: min(var(--dialog-width, 90vw), 32rem);
            max-height: min(85vh, var(--dialog-max-height, 85vh));
            overflow: auto;
            padding: var(--dialog-padding, 1.5rem);
            border-radius: var(--dialog-radius, 0.875rem);
            background: var(--dialog-background, #f8fafc);
            color: var(--dialog-color, #0f172a);
            box-shadow: var(
              --dialog-shadow,
              0px 28px 60px rgba(15, 23, 42, 0.25)
            );
            opacity: 0;
            transition:
              transform var(--dialog-transition-duration, 180ms)
                var(--dialog-transition-easing, cubic-bezier(0.16, 1, 0.3, 1)),
              opacity var(--dialog-transition-duration, 180ms)
                var(--dialog-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
          }

          :host([open]) [part="content"] {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }

          [part="header"] {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
          }

          [part="title"] {
            margin: 0;
            font-size: var(--dialog-title-size, 1.125rem);
            font-weight: var(--dialog-title-weight, 600);
          }

          [part="description"] {
            margin: var(--dialog-description-margin, 0.75rem 0 1.5rem);
            font-size: var(--dialog-description-size, 0.95rem);
            color: var(--dialog-description-color, #475569);
            line-height: 1.65;
          }

          [part="body"] {
            display: grid;
            gap: var(--dialog-body-gap, 1rem);
            margin: var(--dialog-body-margin, 0 0 1.5rem);
          }

          [part="footer"] {
            display: flex;
            justify-content: flex-end;
            gap: var(--dialog-footer-gap, 0.75rem);
          }

          [part="close-button"] {
            appearance: none;
            border: none;
            border-radius: var(--dialog-close-radius, 999px);
            background: var(--dialog-close-background, rgba(148, 163, 184, 0.2));
            color: var(--dialog-close-color, #334155);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.25rem;
            width: 2rem;
            height: 2rem;
            cursor: pointer;
            transition: background 150ms ease, transform 150ms ease;
          }

          [part="close-button"]:hover {
            background: var(--dialog-close-hover-background, rgba(99, 102, 241, 0.18));
          }

          [part="close-button"]:active {
            transform: scale(0.96);
          }

          ::slotted([slot="trigger"]) {
            cursor: pointer;
          }

          ::slotted([slot="close"]) {
            cursor: pointer;
          }
        </style>
        <slot name="trigger" part="trigger"></slot>
        <div part="portal" data-state="closed">
          <div part="overlay" data-state="closed"></div>
          <div part="content" role="dialog" tabindex="-1" aria-modal="true">
            <div part="header">
              <slot name="title" part="title"></slot>
              <slot name="close"></slot>
              <button part="close-button" type="button" aria-label="Close dialog">×</button>
            </div>
            <slot name="description" part="description"></slot>
            <div part="body">
              <slot></slot>
            </div>
            <div part="footer">
              <slot name="footer"></slot>
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
      this.#content = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="content"]')
      );
      this.#triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      this.#titleSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="title"]')
      );
      this.#descriptionSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="description"]')
      );
      this.#closeSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="close"]')
      );
      this.#closeFallback = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector('[part="close-button"]')
      );

      this.#triggerSlotChangeHandler = () => this.#onTriggerSlotChange();
      this.#titleSlotChangeHandler = () => this.#syncLabelling();
      this.#descriptionSlotChangeHandler = () => this.#syncLabelling();
      this.#closeSlotChangeHandler = () => this.#onCloseSlotChange();
      this.#triggerClickHandler = (event) => this.#openFromTrigger(event);
      this.#closeClickHandler = (event) => this.#closeFromButton(event);
      this.#keydownHandler = (event) => this.#handleKeydown(event);
      this.#focusInHandler = (event) => this.#handleFocusIn(event);
      this.#overlayClickHandler = (event) => this.#handleOverlayClick(event);
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      upgradeProperty(this, 'modal');
      this.#triggerSlot.addEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#titleSlot.addEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.addEventListener('slotchange', this.#descriptionSlotChangeHandler);
      this.#closeSlot.addEventListener('slotchange', this.#closeSlotChangeHandler);
      this.#overlay.addEventListener('click', this.#overlayClickHandler);
      this.addEventListener('focusin', this.#focusInHandler);
      this.#content.addEventListener('keydown', this.#keydownHandler);
      if (this.#closeFallback) {
        this.#closeFallback.addEventListener('click', this.#closeClickHandler);
      }
      this.#syncLabelling();
      this.#onTriggerSlotChange();
      this.#onCloseSlotChange();
      this.#reflectModalAttribute();
    }

    disconnectedCallback() {
      this.#triggerSlot.removeEventListener('slotchange', this.#triggerSlotChangeHandler);
      this.#titleSlot.removeEventListener('slotchange', this.#titleSlotChangeHandler);
      this.#descriptionSlot.removeEventListener('slotchange', this.#descriptionSlotChangeHandler);
      this.#closeSlot.removeEventListener('slotchange', this.#closeSlotChangeHandler);
      this.#overlay.removeEventListener('click', this.#overlayClickHandler);
      this.removeEventListener('focusin', this.#focusInHandler);
      this.#content.removeEventListener('keydown', this.#keydownHandler);
      if (this.#closeFallback) {
        this.#closeFallback.removeEventListener('click', this.#closeClickHandler);
      }
      document.removeEventListener('keydown', this.#keydownHandler, true);
      document.removeEventListener('focusin', this.#focusInHandler, true);
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
      this.#toggleDialog(this.#open);
    }

    /** @returns {boolean} */
    get modal() {
      return this.#modal;
    }

    /** @param {boolean} value */
    set modal(value) {
      const isModal = Boolean(value);
      if (isModal) {
        this.setAttribute('modal', '');
      } else {
        this.setAttribute('modal', 'false');
      }
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'open') {
        const isOpen = newValue !== null;
        if (isOpen !== this.#open) {
          this.#open = isOpen;
          this.#toggleDialog(this.#open);
        }
      }
      if (name === 'modal') {
        this.#modal = newValue === null ? true : newValue !== 'false';
        this.#reflectModalAttribute();
      }
    }

    /** @param {boolean} force */
    toggle(force) {
      const next = typeof force === 'boolean' ? force : !this.open;
      this.open = next;
    }

    show() {
      this.open = true;
    }

    hide() {
      this.open = false;
    }

    /** @param {MouseEvent} event */
    #openFromTrigger(event) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      this.show();
    }

    /** @param {MouseEvent} event */
    #closeFromButton(event) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      this.hide();
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

    #onCloseSlotChange() {
      const nodes = this.#closeSlot.assignedElements({ flatten: true });
      nodes.forEach((node) => {
        node.removeEventListener('click', this.#closeClickHandler);
      });
      nodes.forEach((node) => {
        node.addEventListener('click', this.#closeClickHandler);
        node.setAttribute('data-dialog-role', 'close');
      });
      if (this.#closeFallback) {
        this.#closeFallback.hidden = nodes.length > 0;
        this.#closeFallback.setAttribute('aria-hidden', nodes.length > 0 ? 'true' : 'false');
      }
    }

    #syncLabelling() {
      const titleNodes = this.#titleSlot.assignedElements({ flatten: true });
      const descriptionNodes = this.#descriptionSlot.assignedElements({ flatten: true });

      if (titleNodes.length > 0) {
        const title = titleNodes[0];
        if (!title.id) {
          title.id = this.#labelId;
        }
        this.#content.setAttribute('aria-labelledby', title.id);
      } else {
        this.#content.removeAttribute('aria-labelledby');
      }

      if (descriptionNodes.length > 0) {
        const description = descriptionNodes[0];
        if (!description.id) {
          description.id = this.#descriptionId;
        }
        this.#content.setAttribute('aria-describedby', description.id);
      } else {
        this.#content.removeAttribute('aria-describedby');
      }
    }

    #reflectModalAttribute() {
      if (this.#modal) {
        this.#content.setAttribute('aria-modal', 'true');
        this.#overlay.style.pointerEvents = 'auto';
        if (this.#open) {
          this.#applyInertSiblings();
          document.addEventListener('focusin', this.#focusInHandler, true);
          if (document.body) {
            this.#previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
          }
        }
      } else {
        this.#content.setAttribute('aria-modal', 'false');
        this.#overlay.style.pointerEvents = 'none';
        document.removeEventListener('focusin', this.#focusInHandler, true);
        if (document.body) {
          document.body.style.overflow = this.#previousBodyOverflow;
        }
        this.#releaseInertSiblings();
      }
      this.#portal.dataset.mode = this.#modal ? 'modal' : 'non-modal';
    }

    /** @param {boolean} open */
    #toggleDialog(open) {
      this.#portal.dataset.state = open ? 'open' : 'closed';
      this.#overlay.dataset.state = open ? 'open' : 'closed';
      this.#content.dataset.state = open ? 'open' : 'closed';

      if (open) {
        this.#previousFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.#applyInertSiblings();
        this.#syncTriggerExpanded();
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
        if (this.#modal) {
          document.addEventListener('focusin', this.#focusInHandler, true);
        }
        if (document.body) {
          this.#previousBodyOverflow = document.body.style.overflow;
          if (this.#modal) {
            document.body.style.overflow = 'hidden';
          }
        }
      } else {
        document.removeEventListener('keydown', this.#keydownHandler, true);
        document.removeEventListener('focusin', this.#focusInHandler, true);
        if (document.body) {
          document.body.style.overflow = this.#previousBodyOverflow;
        }
        this.#releaseInertSiblings();
        this.#syncTriggerExpanded();
        if (this.#previousFocused && typeof this.#previousFocused.focus === 'function') {
          this.#previousFocused.focus({ preventScroll: true });
        }
      }
    }

    #syncTriggerExpanded() {
      const nodes = this.#triggerSlot.assignedElements({ flatten: true });
      nodes.forEach((node) => {
        node.setAttribute('aria-expanded', String(this.open));
      });
    }

    /** @returns {HTMLElement[]} */
    #getFocusableElements() {
      const nodes = Array.from(this.querySelectorAll(focusableSelectors));
      const focusable = /** @type {HTMLElement[]} */ (nodes.filter((node) => {
        if (!(node instanceof HTMLElement)) return false;
        if (!this.contains(node)) return false;
        if (node.hasAttribute('disabled')) return false;
        if (node.hidden) return false;
        if (node.getAttribute('aria-hidden') === 'true') return false;
        if (node.slot === 'trigger') return false;
        return true;
      }));
      if (this.#closeFallback && !this.#closeFallback.hidden && !this.#closeFallback.disabled) {
        focusable.push(this.#closeFallback);
      }
      return focusable;
    }

    /** @param {KeyboardEvent} event */
    #handleKeydown(event) {
      if (!this.#open) return;
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.stopPropagation();
        event.preventDefault();
        this.hide();
        return;
      }
      if (event.key === 'Tab' && this.#modal) {
        const focusable = this.#getFocusableElements();
        if (focusable.length === 0) {
          event.preventDefault();
          this.#content.focus({ preventScroll: true });
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const activeIndex = active ? focusable.indexOf(active) : -1;
        if (event.shiftKey) {
          if (activeIndex <= 0) {
            event.preventDefault();
            last.focus({ preventScroll: true });
          }
        } else if (activeIndex === -1 || activeIndex >= focusable.length - 1) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    }

    /** @param {FocusEvent} event */
    #handleFocusIn(event) {
      if (!this.#open || !this.#modal) return;
      const path = event.composedPath();
      if (!path.includes(this.#content)) {
        const focusable = this.#getFocusableElements();
        if (focusable.length) {
          focusable[0].focus({ preventScroll: true });
        } else {
          this.#content.focus({ preventScroll: true });
        }
      }
    }

    /** @param {MouseEvent} event */
    #handleOverlayClick(event) {
      if (!this.#open) return;
      if (!this.#modal) return;
      if (event.target === this.#overlay) {
        this.hide();
      }
    }

    #applyInertSiblings() {
      if (!this.#modal) return;
      const root = this.getRootNode();
      if (!(root instanceof Document) || !root.body) return;
      this.#releaseInertSiblings();
      const siblings = Array.from(root.body.children);
      this.#inertSiblings = siblings
        .filter((element) => element instanceof HTMLElement && !element.contains(this))
        .map((element) => {
          const previousInert = element.inert;
          const previousAriaHidden = element.getAttribute('aria-hidden');
          element.inert = true;
          element.setAttribute('aria-hidden', 'true');
          return { element, inert: previousInert, ariaHidden: previousAriaHidden };
        });
    }

    #releaseInertSiblings() {
      this.#inertSiblings.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) {
          element.removeAttribute('aria-hidden');
        } else {
          element.setAttribute('aria-hidden', ariaHidden);
        }
      });
      this.#inertSiblings = [];
    }
  }

  if (!customElements.get('wc-dialog')) {
    customElements.define('wc-dialog', WcDialog);
  }
})();

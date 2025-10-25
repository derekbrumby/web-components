/**
 * @file context-menu.js
 * @version 1.0.0
 *
 * A fully-managed context menu web component inspired by the Radix UI Context Menu.
 * The element renders an interactive demo menu that supports submenus, checkbox items,
 * and radio groups while remaining dependency free and accessible out of the box.
 *
 * Usage:
 * <wc-context-menu></wc-context-menu>
 *
 * The trigger responds to right-click, keyboard context menu shortcuts, and long-press on touch
 * devices. Menu positioning is collision aware and keyboard navigation follows the WAI-ARIA
 * menu pattern. Styling can be customized with CSS custom properties or ::part selectors.
 */

(() => {
  const LONG_PRESS_DELAY = 550;
  const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
  const ACTIVE_CLASS = 'data-highlighted';

  /** @param {HTMLElement} element @param {keyof HTMLElement} property */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * Clamp a value between min and max.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * Focuses the next enabled menu item in the provided direction.
   * @param {HTMLElement} menu
   * @param {number} direction 1 for next, -1 for previous
   */
  const moveFocus = (menu, direction) => {
    const items = getMenuItems(menu);
    if (!items.length) return;
    const currentIndex = items.findIndex((item) => item === menu.ownerDocument.activeElement);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    focusItem(items[nextIndex]);
  };

  /**
   * @param {HTMLElement} menu
   */
  const getMenuItems = (menu) =>
    /** @type {HTMLElement[]} */ (
      Array.from(menu.querySelectorAll(MENU_ITEM_SELECTOR)).filter(
        (item) => !(item.getAttribute('aria-disabled') === 'true' || item.dataset.disabled === 'true'),
      )
    );

  /**
   * @param {HTMLElement} item
   */
  const focusItem = (item) => {
    item.focus({ preventScroll: true });
    item.setAttribute(ACTIVE_CLASS, '');
  };

  /**
   * @param {HTMLElement} menu
   */
  const clearHighlighted = (menu) => {
    menu.querySelectorAll(`[${ACTIVE_CLASS}]`).forEach((node) => node.removeAttribute(ACTIVE_CLASS));
  };

  /**
   * @param {HTMLElement} menu
   */
  const focusFirstItem = (menu) => {
    const items = getMenuItems(menu);
    if (items.length) {
      focusItem(items[0]);
    }
  };

  /**
   * @param {HTMLElement} menu
   */
  const focusLastItem = (menu) => {
    const items = getMenuItems(menu);
    if (items.length) {
      focusItem(items[items.length - 1]);
    }
  };

  class WcContextMenu extends HTMLElement {
    static get observedAttributes() {
      return [];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #trigger;
    /** @type {HTMLElement} */
    #menu;
    /** @type {HTMLElement} */
    #submenu;
    /** @type {HTMLElement} */
    #submenuTrigger;
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #submenuOpen = false;
    /** @type {boolean} */
    #bookmarksChecked = true;
    /** @type {boolean} */
    #urlsChecked = false;
    /** @type {"pedro" | "colm"} */
    #person = 'pedro';
    /** @type {number | null} */
    #longPressTimer = null;
    /** @type {(event: PointerEvent) => void} */
    #pointerDownHandler;
    /** @type {(event: KeyboardEvent) => void} */
    #escapeHandler;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = this.#template();
      this.setAttribute('data-state', 'closed');

      this.#trigger = /** @type {HTMLElement} */ (this.#root.querySelector('[part="trigger"]'));
      this.#menu = /** @type {HTMLElement} */ (this.#root.querySelector('[data-menu="root"]'));
      this.#submenu = /** @type {HTMLElement} */ (this.#root.querySelector('[data-menu="submenu"]'));
      this.#submenuTrigger = /** @type {HTMLElement} */ (this.#root.querySelector('[data-submenu-trigger]'));

      this.#pointerDownHandler = (event) => this.#handlePointerDownOutside(event);
      this.#escapeHandler = (event) => this.#handleEscape(event);
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      this.#attachListeners();
      this.#initializeState();
    }

    disconnectedCallback() {
      this.#detachGlobalListeners();
    }

    #initializeState() {
      const bookmarks = /** @type {HTMLElement | null} */ (
        this.#root.querySelector('[data-toggle="bookmarks"]')
      );
      const urls = /** @type {HTMLElement | null} */ (
        this.#root.querySelector('[data-toggle="urls"]')
      );
      if (bookmarks) {
        this.#reflectCheckboxState(bookmarks, this.#bookmarksChecked);
      }
      if (urls) {
        this.#reflectCheckboxState(urls, this.#urlsChecked);
      }
      this.#updateRadioGroup('person', this.#person);
    }

    /**
     * @returns {boolean}
     */
    get open() {
      return this.#open;
    }

    /**
     * @param {boolean} value
     */
    set open(value) {
      if (value) {
        this.#openMenuAtTrigger();
      } else {
        this.#closeMenu();
      }
    }

    #attachListeners() {
      this.#trigger.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const x = event.clientX;
        const y = event.clientY;
        this.#openMenuAt(x, y);
      });

      this.#trigger.addEventListener('pointerdown', () => {
        this.#trigger.focus({ preventScroll: true });
      });

      this.#trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.#openMenuAtTrigger();
        } else if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
          event.preventDefault();
          this.#openMenuAtTrigger();
        }
      });

      this.#trigger.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;
        this.#longPressTimer = window.setTimeout(() => {
          const touch = event.touches[0];
          this.#openMenuAt(touch.clientX, touch.clientY);
        }, LONG_PRESS_DELAY);
      }, { passive: true });

      const cancelTouch = () => {
        if (this.#longPressTimer !== null) {
          window.clearTimeout(this.#longPressTimer);
          this.#longPressTimer = null;
        }
      };

      this.#trigger.addEventListener('touchend', cancelTouch);
      this.#trigger.addEventListener('touchmove', cancelTouch);
      this.#trigger.addEventListener('touchcancel', cancelTouch);

      this.#menu.addEventListener('keydown', (event) => this.#handleMenuKeydown(event, this.#menu));
      this.#submenu.addEventListener('keydown', (event) => this.#handleMenuKeydown(event, this.#submenu));

      this.#menu.addEventListener('pointermove', (event) => this.#handlePointerHighlight(event, this.#menu));
      this.#submenu.addEventListener('pointermove', (event) => this.#handlePointerHighlight(event, this.#submenu));

      this.#menu.addEventListener('click', (event) => this.#handleMenuClick(event));
      this.#submenu.addEventListener('click', (event) => this.#handleMenuClick(event));

      this.#menu.addEventListener('focusin', (event) => this.#handleFocus(event, this.#menu));
      this.#submenu.addEventListener('focusin', (event) => this.#handleFocus(event, this.#submenu));

      this.#menu.addEventListener('focusout', (event) => this.#handleFocusOut(event, this.#menu));
      this.#submenu.addEventListener('focusout', (event) => this.#handleFocusOut(event, this.#submenu));

      this.#menu.addEventListener('pointerleave', () => {
        clearHighlighted(this.#menu);
      });
      this.#submenu.addEventListener('pointerleave', () => {
        clearHighlighted(this.#submenu);
      });

      this.#submenuTrigger.addEventListener('pointerenter', () => {
        if (this.#open) {
          this.#openSubmenu();
        }
      });

      this.#submenuTrigger.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          this.#openSubmenu();
          focusFirstItem(this.#submenu);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.#closeSubmenu(true);
        }
      });

      this.#submenu.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.#closeSubmenu(true);
          this.#submenuTrigger.focus({ preventScroll: true });
        }
      });

      this.#submenuTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        if (this.#submenuOpen) {
          this.#closeSubmenu(true);
        } else {
          this.#openSubmenu();
          focusFirstItem(this.#submenu);
        }
      });
    }

    /**
     * @param {PointerEvent} event
     * @param {HTMLElement} menu
     */
    #handlePointerHighlight(event, menu) {
      const target = /** @type {HTMLElement | null} */ (event.target instanceof HTMLElement ? event.target.closest(MENU_ITEM_SELECTOR) : null);
      if (!target || target.getAttribute('aria-disabled') === 'true') return;
      clearHighlighted(menu);
      target.setAttribute(ACTIVE_CLASS, '');
    }

    /**
     * @param {FocusEvent} event
     * @param {HTMLElement} menu
     */
    #handleFocus(event, menu) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && target.matches(MENU_ITEM_SELECTOR)) {
        clearHighlighted(menu);
        target.setAttribute(ACTIVE_CLASS, '');
      }
    }

    /**
     * @param {FocusEvent} event
     * @param {HTMLElement} menu
     */
    #handleFocusOut(event, menu) {
      if (!menu.contains(/** @type {Node} */ (event.relatedTarget))) {
        clearHighlighted(menu);
      }
    }

    /**
     * @param {KeyboardEvent} event
     * @param {HTMLElement} menu
     */
    #handleMenuKeydown(event, menu) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          moveFocus(menu, 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveFocus(menu, -1);
          break;
        case 'Home':
          event.preventDefault();
          focusFirstItem(menu);
          break;
        case 'End':
          event.preventDefault();
          focusLastItem(menu);
          break;
        case 'Escape':
          event.preventDefault();
          if (menu === this.#submenu) {
            this.#closeSubmenu(true);
            this.#submenuTrigger.focus({ preventScroll: true });
          } else {
            this.#closeMenu();
          }
          break;
        case 'ArrowLeft':
          if (menu === this.#menu) {
            event.preventDefault();
            this.#closeMenu();
          }
          break;
        case 'Tab':
          event.preventDefault();
          break;
        default:
          break;
      }
    }

    /**
     * @param {MouseEvent} event
     */
    #handleMenuClick(event) {
      const target = event.target instanceof HTMLElement ? event.target.closest(MENU_ITEM_SELECTOR) : null;
      if (!target || target.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const role = target.getAttribute('role');
      if (role === 'menuitemcheckbox') {
        const name = target.dataset.toggle;
        if (name === 'bookmarks') {
          this.#bookmarksChecked = !this.#bookmarksChecked;
          this.#reflectCheckboxState(target, this.#bookmarksChecked);
          this.dispatchEvent(
            new CustomEvent('toggle', {
              detail: { type: 'checkbox', name, checked: this.#bookmarksChecked },
            }),
          );
        } else if (name === 'urls') {
          this.#urlsChecked = !this.#urlsChecked;
          this.#reflectCheckboxState(target, this.#urlsChecked);
          this.dispatchEvent(
            new CustomEvent('toggle', {
              detail: { type: 'checkbox', name, checked: this.#urlsChecked },
            }),
          );
        }
      } else if (role === 'menuitemradio') {
        const group = target.dataset.radioGroup;
        const value = target.dataset.value;
        if (group === 'person' && value) {
          this.#person = /** @type {"pedro" | "colm"} */ (value);
          this.#updateRadioGroup(group, value);
          this.dispatchEvent(
            new CustomEvent('toggle', {
              detail: { type: 'radio', group, value },
            }),
          );
        }
      } else if (target.dataset.submenuTrigger !== undefined) {
        event.preventDefault();
        if (this.#submenuOpen) {
          this.#closeSubmenu(true);
        } else {
          this.#openSubmenu();
          focusFirstItem(this.#submenu);
        }
        return;
      }

      if (role === 'menuitem') {
        if (target.dataset.command === 'more-tools') {
          return;
        }
        this.dispatchEvent(new CustomEvent('select', { detail: { command: target.dataset.command || null } }));
      }

      if (role !== 'menuitemcheckbox' && role !== 'menuitemradio') {
        this.#closeMenu();
      }
    }

    /**
     * @param {PointerEvent} event
     */
    #handlePointerDownOutside(event) {
      const target = event.target instanceof Node ? event.target : null;
      const isInsideRoot = target ? this.#root.contains(target) : false;
      const isInsideMenus = target
        ? this.#menu.contains(target) || this.#submenu.contains(target)
        : false;
      if (!isInsideRoot || !isInsideMenus) {
        this.#closeMenu(false);
      }
    }

    /**
     * @param {KeyboardEvent} event
     */
    #handleEscape(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.#closeMenu();
      }
    }

    #attachGlobalListeners() {
      this.ownerDocument.addEventListener('pointerdown', this.#pointerDownHandler, { capture: true });
      this.ownerDocument.addEventListener('keydown', this.#escapeHandler, { capture: true });
    }

    #detachGlobalListeners() {
      this.ownerDocument.removeEventListener('pointerdown', this.#pointerDownHandler, { capture: true });
      this.ownerDocument.removeEventListener('keydown', this.#escapeHandler, { capture: true });
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    #openMenuAt(x, y) {
      if (this.#open) {
        this.#closeMenu(false);
      }
      this.#open = true;
      this.setAttribute('data-state', 'open');
      this.#menu.hidden = false;
      this.#menu.dataset.state = 'open';
      this.#menu.style.visibility = 'hidden';
      this.#trigger.setAttribute('aria-expanded', 'true');
      this.#menu.style.left = '0px';
      this.#menu.style.top = '0px';
      this.#attachGlobalListeners();
      requestAnimationFrame(() => {
        const rect = this.#menu.getBoundingClientRect();
        const padding = 8;
        const gap = 4;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = clamp(x + gap, padding, viewportWidth - rect.width - padding);
        let horizontalPlacement = 'right';
        const wouldOverflowRight = x + rect.width + padding > viewportWidth;
        const roomOnLeft = x - rect.width - gap >= padding;
        if (wouldOverflowRight && roomOnLeft) {
          left = clamp(x - rect.width - gap, padding, viewportWidth - rect.width - padding);
          horizontalPlacement = 'left';
        }

        let top = clamp(y + gap, padding, viewportHeight - rect.height - padding);
        let verticalPlacement = 'bottom';
        const wouldOverflowBottom = y + rect.height + padding > viewportHeight;
        const roomAbove = y - rect.height - gap >= padding;
        if (wouldOverflowBottom && roomAbove) {
          top = clamp(y - rect.height - gap, padding, viewportHeight - rect.height - padding);
          verticalPlacement = 'top';
        }

        this.#menu.dataset.placementX = horizontalPlacement;
        this.#menu.dataset.placementY = verticalPlacement;
        this.#menu.style.left = `${left}px`;
        this.#menu.style.top = `${top}px`;
        this.#menu.style.visibility = 'visible';
        focusFirstItem(this.#menu);
      });
    }

    #openMenuAtTrigger() {
      const rect = this.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height;
      this.#openMenuAt(x, y + 8);
    }

    #closeMenu(focusTrigger = true) {
      if (!this.#open) return;
      this.#open = false;
      this.setAttribute('data-state', 'closed');
      this.#menu.hidden = true;
      this.#menu.dataset.state = 'closed';
      delete this.#menu.dataset.placementX;
      delete this.#menu.dataset.placementY;
      this.#trigger.setAttribute('aria-expanded', 'false');
      this.#closeSubmenu(false);
      this.#detachGlobalListeners();
      clearHighlighted(this.#menu);
      if (focusTrigger) {
        this.#trigger.focus({ preventScroll: true });
      }
    }

    #openSubmenu() {
      if (this.#submenuOpen) return;
      this.#submenuOpen = true;
      this.#submenu.hidden = false;
      this.#submenu.dataset.state = 'open';
      this.#submenu.style.visibility = 'hidden';
      this.#submenuTrigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => {
        const triggerRect = this.#submenuTrigger.getBoundingClientRect();
        const submenuRect = this.#submenu.getBoundingClientRect();
        const padding = 8;
        const gap = 6;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = triggerRect.right + gap;
        let horizontalPlacement = 'right';
        const wouldOverflowRight = triggerRect.right + submenuRect.width + padding > viewportWidth;
        const roomOnLeft = triggerRect.left - submenuRect.width - gap >= padding;
        if (wouldOverflowRight && roomOnLeft) {
          left = triggerRect.left - submenuRect.width - gap;
          horizontalPlacement = 'left';
        }
        left = clamp(left, padding, viewportWidth - submenuRect.width - padding);

        let top = triggerRect.top;
        let verticalPlacement = 'bottom';
        const wouldOverflowBottom = triggerRect.bottom + submenuRect.height + padding > viewportHeight;
        const roomAbove = triggerRect.bottom - submenuRect.height >= padding;
        if (wouldOverflowBottom && roomAbove) {
          top = triggerRect.bottom - submenuRect.height;
          verticalPlacement = 'top';
        }
        top = clamp(top, padding, viewportHeight - submenuRect.height - padding);

        this.#submenu.dataset.placementX = horizontalPlacement;
        this.#submenu.dataset.placementY = verticalPlacement;
        this.#submenu.style.left = `${left}px`;
        this.#submenu.style.top = `${top}px`;
        this.#submenu.style.visibility = 'visible';
      });
    }

    /**
     * @param {boolean} focusTrigger
     */
    #closeSubmenu(focusTrigger) {
      if (!this.#submenuOpen) return;
      this.#submenuOpen = false;
      this.#submenu.hidden = true;
      this.#submenu.dataset.state = 'closed';
      delete this.#submenu.dataset.placementX;
      delete this.#submenu.dataset.placementY;
      this.#submenuTrigger.setAttribute('aria-expanded', 'false');
      clearHighlighted(this.#submenu);
      if (focusTrigger) {
        this.#submenuTrigger.focus({ preventScroll: true });
      }
    }

    /**
     * @param {HTMLElement} target
     * @param {boolean} checked
     */
    #reflectCheckboxState(target, checked) {
      target.setAttribute('aria-checked', checked ? 'true' : 'false');
      target.toggleAttribute('data-state-checked', checked);
    }

    /**
     * @param {string} group
     * @param {string} value
     */
    #updateRadioGroup(group, value) {
      const items = /** @type {HTMLElement[]} */ (
        Array.from(this.#root.querySelectorAll(`[data-radio-group="${group}"]`))
      );
      items.forEach((item) => {
        const isActive = item.dataset.value === value;
        item.setAttribute('aria-checked', isActive ? 'true' : 'false');
        if (isActive) {
          item.setAttribute('data-state-checked', '');
        } else {
          item.removeAttribute('data-state-checked');
        }
      });
    }

    #template() {
      return `
        <style>
          :host {
            display: inline-block;
            position: relative;
            font-family: var(--context-menu-font-family, "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
            color: inherit;
          }

          :host([data-state="open"]) [part="trigger"] {
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.35);
          }

          [part="trigger"] {
            display: block;
            width: var(--context-menu-trigger-width, 300px);
            padding: var(--context-menu-trigger-padding, 45px 16px);
            text-align: center;
            border-radius: var(--context-menu-trigger-radius, 20px);
            border: var(--context-menu-trigger-border, 2px dashed rgba(255, 255, 255, 0.8));
            background: var(--context-menu-trigger-background, linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.4)));
            color: var(--context-menu-trigger-color, #ffffff);
            font-size: var(--context-menu-trigger-font-size, 1rem);
            font-weight: var(--context-menu-trigger-font-weight, 600);
            cursor: context-menu;
            user-select: none;
            outline: none;
          }

          [part="trigger"]:focus-visible {
            box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.55);
          }

          [data-menu] {
            position: fixed;
            z-index: 1000;
            min-width: var(--context-menu-min-width, 220px);
            background: var(--context-menu-background, #ffffff);
            padding: 5px;
            border-radius: var(--context-menu-radius, 12px);
            box-shadow: var(--context-menu-shadow, 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2));
            border: var(--context-menu-border, 1px solid rgba(99, 102, 241, 0.08));
            color: var(--context-menu-color, #4338ca);
            backdrop-filter: var(--context-menu-backdrop, blur(8px));
          }

          [data-menu="submenu"] {
            min-width: var(--context-menu-submenu-min-width, 220px);
          }

          [data-menu][data-state="closed"] {
            display: none;
          }

          button[role^="menuitem"] {
            all: unset;
            display: flex;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
            min-height: 25px;
            padding: 0 5px 0 25px;
            border-radius: var(--context-menu-item-radius, 6px);
            font-size: 13px;
            color: var(--context-menu-item-color, #4c1d95);
            line-height: 1;
            position: relative;
            cursor: pointer;
          }

          button[role^="menuitem"]::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: transparent;
            transition: background 120ms ease;
          }

          button[role^="menuitem"]:focus-visible::before,
          button[role^="menuitem"][${ACTIVE_CLASS}]::before {
            background: var(--context-menu-item-highlight, rgba(99, 102, 241, 0.18));
          }

          button[role^="menuitem"] span.shortcut {
            margin-left: auto;
            padding-left: 20px;
            color: var(--context-menu-shortcut-color, #6b7280);
            font-size: 12px;
          }

          button[role^="menuitem"][aria-disabled="true"] {
            cursor: not-allowed;
            opacity: 0.4;
          }

          button[role^="menuitem"][aria-disabled="true"]::before {
            display: none;
          }

          .item-indicator {
            position: absolute;
            left: 0;
            display: inline-flex;
            width: 25px;
            height: 25px;
            align-items: center;
            justify-content: center;
            color: var(--context-menu-indicator-color, #4c1d95);
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 120ms ease, transform 120ms ease;
          }

          button[role="menuitemcheckbox"][aria-checked="true"] .item-indicator,
          button[role="menuitemradio"][aria-checked="true"] .item-indicator {
            opacity: 1;
            transform: scale(1);
          }

          .separator {
            height: 1px;
            background: var(--context-menu-separator-color, rgba(99, 102, 241, 0.2));
            margin: 5px;
          }

          .menu-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--context-menu-label-color, #6b7280);
            padding: 0 0 0 25px;
            line-height: 25px;
          }

          .radio-group {
            display: grid;
            gap: 0;
          }

          [data-menu] svg {
            display: block;
            width: 16px;
            height: 16px;
          }

          [data-menu="submenu"] {
            pointer-events: auto;
          }
        </style>
        <div part="trigger" tabindex="0" aria-haspopup="menu" aria-expanded="false">Right-click here.</div>
        <div part="menu" data-menu="root" role="menu" hidden data-state="closed">
          <button type="button" role="menuitem" data-command="back">
            Back
            <span class="shortcut">⌘+[</span>
          </button>
          <button type="button" role="menuitem" aria-disabled="true" data-disabled="true" data-command="forward">
            Forward
            <span class="shortcut">⌘+]</span>
          </button>
          <button type="button" role="menuitem" data-command="reload">
            Reload
            <span class="shortcut">⌘+R</span>
          </button>
          <button type="button" role="menuitem" data-submenu-trigger data-command="more-tools" aria-haspopup="menu" aria-expanded="false">
            More Tools
            <span class="shortcut" aria-hidden="true">
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M7.25 4.75L12.25 9.75L7.25 14.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
          </button>
          <div class="separator" role="separator"></div>
          <button type="button" role="menuitemcheckbox" data-toggle="bookmarks" aria-checked="true">
            <span class="item-indicator" aria-hidden="true">
              <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M4 9L7 12L14 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            Show Bookmarks
            <span class="shortcut">⌘+B</span>
          </button>
          <button type="button" role="menuitemcheckbox" data-toggle="urls" aria-checked="false">
            <span class="item-indicator" aria-hidden="true">
              <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M4 9L7 12L14 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            Show Full URLs
          </button>
          <div class="separator" role="separator"></div>
          <div class="menu-label" role="presentation">People</div>
          <div class="radio-group" role="presentation">
            <button type="button" role="menuitemradio" data-radio-group="person" data-value="pedro" aria-checked="true">
              <span class="item-indicator" aria-hidden="true">
                <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                  <circle cx="9" cy="9" r="4" fill="currentColor"></circle>
                </svg>
              </span>
              Pedro Duarte
            </button>
            <button type="button" role="menuitemradio" data-radio-group="person" data-value="colm" aria-checked="false">
              <span class="item-indicator" aria-hidden="true">
                <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                  <circle cx="9" cy="9" r="4" fill="currentColor"></circle>
                </svg>
              </span>
              Colm Tuite
            </button>
          </div>
        </div>
        <div part="submenu" data-menu="submenu" role="menu" hidden data-state="closed">
          <button type="button" role="menuitem" data-command="save-page">
            Save Page As…
            <span class="shortcut">⌘+S</span>
          </button>
          <button type="button" role="menuitem" data-command="create-shortcut">
            Create Shortcut…
          </button>
          <button type="button" role="menuitem" data-command="name-window">
            Name Window…
          </button>
          <div class="separator" role="separator"></div>
          <button type="button" role="menuitem" data-command="dev-tools">
            Developer Tools
          </button>
        </div>
      `;
    }
  }

  if (!customElements.get('wc-context-menu')) {
    customElements.define('wc-context-menu', WcContextMenu);
  }
})();

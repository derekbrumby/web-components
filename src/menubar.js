/**
 * @file menubar.js
 * @version 1.0.0
 *
 * An accessible desktop-style menubar component inspired by the Radix UI example.
 * The element renders a persistent row of triggers with fly-out menus, nested submenus,
 * checkbox items, and radio groups. Keyboard navigation follows the WAI-ARIA menu
 * button pattern with roving focus across triggers and menu items.
 *
 * Usage:
 * <wc-menubar></wc-menubar>
 *
 * Styling hooks:
 * - Custom properties: `--menubar-surface`, `--menubar-trigger-color`,
 *   `--menubar-panel-surface`, `--menubar-panel-shadow`, `--menubar-radius`,
 *   `--menubar-accent`, `--menubar-focus-ring`, etc.
 * - Parts: `::part(menubar)`, `::part(trigger)`, `::part(menu)`, `::part(menu-item)`,
 *   `::part(shortcut)`, `::part(indicator)`, `::part(submenu)`.
 */

(() => {
  /**
   * Ensure prototype properties are upgraded when attributes are reflected before
   * the element definition is registered.
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

  const CHECK_ITEMS = [
    'Always Show Bookmarks Bar',
    'Always Show Full URLs',
  ];

  const RADIO_ITEMS = ['Andy', 'Benoît', 'Luis'];

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        display: inline-block;
        font-family: var(--menubar-font-family, 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        color: var(--menubar-trigger-color, #4338ca);
        --_transition-duration: 120ms;
      }

      :host([hidden]) {
        display: none;
      }

      .menubar {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border-radius: var(--menubar-radius, 0.75rem);
        background: var(--menubar-surface, #ffffff);
        padding: 0.25rem;
        box-shadow: var(
          --menubar-shadow,
          0 2px 10px rgba(15, 23, 42, 0.18)
        );
        position: relative;
      }

      .menu {
        position: relative;
      }

      .trigger {
        appearance: none;
        border: none;
        border-radius: var(--menubar-trigger-radius, 0.5rem);
        background: transparent;
        color: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.5rem 0.75rem;
        font: inherit;
        font-weight: 600;
        font-size: 0.8125rem;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: background var(--_transition-duration) ease, color var(--_transition-duration) ease;
      }

      .trigger[data-highlighted],
      .trigger:focus-visible,
      .trigger:hover,
      .menu[data-open] .trigger {
        background: var(--menubar-trigger-highlight, rgba(76, 29, 149, 0.1));
        color: var(--menubar-trigger-highlight-color, #312e81);
      }

      .trigger:focus-visible {
        outline: none;
        box-shadow: var(--menubar-focus-ring, 0 0 0 2px rgba(99, 102, 241, 0.35));
      }

      .menu-content,
      .submenu-content {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        min-width: 220px;
        padding: 0.3125rem;
        border-radius: var(--menubar-panel-radius, 0.75rem);
        background: var(--menubar-panel-surface, #ffffff);
        box-shadow: var(
          --menubar-panel-shadow,
          0px 10px 38px -10px rgba(22, 23, 24, 0.35),
          0px 10px 20px -15px rgba(22, 23, 24, 0.2)
        );
        display: grid;
        gap: 0.125rem;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-4px) scale(0.98);
        transform-origin: top left;
        transition: opacity 160ms ease, transform 160ms ease;
        z-index: 10;
      }

      .menu[data-open] > .menu-content,
      .submenu[data-open] > .submenu-content {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }

      .menu-content::before,
      .submenu-content::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: transparent;
        pointer-events: none;
      }

      .submenu {
        position: relative;
      }

      .submenu-content {
        top: -0.3125rem;
        left: calc(100% + 0.375rem);
        z-index: 20;
      }

      .menu-item {
        appearance: none;
        border: none;
        border-radius: var(--menubar-item-radius, 0.6rem);
        background: transparent;
        color: var(--menubar-item-color, #4338ca);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.375rem 0.625rem;
        font: inherit;
        font-size: 0.8125rem;
        letter-spacing: 0.01em;
        justify-content: flex-start;
        cursor: pointer;
        transition: background var(--_transition-duration) ease, color var(--_transition-duration) ease;
        position: relative;
      }

      .menu-item[data-state="open"],
      .menu-item[data-highlighted],
      .menu-item:focus-visible,
      .menu-item:hover {
        background: var(--menubar-item-highlight, linear-gradient(135deg, #7c3aed, #6366f1));
        color: var(--menubar-item-highlight-color, #f8fafc);
      }

      .menu-item:focus-visible {
        outline: none;
        box-shadow: var(--menubar-focus-ring, 0 0 0 2px rgba(99, 102, 241, 0.35));
      }

      .menu-item[data-disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .menu-item[data-disabled]:hover,
      .menu-item[data-disabled][data-highlighted] {
        background: transparent;
        color: var(--menubar-item-color, #4338ca);
      }

      .menu-shortcut {
        margin-left: auto;
        padding-left: 1.25rem;
        color: var(--menubar-shortcut-color, #64748b);
        font-size: 0.75rem;
        letter-spacing: 0.08em;
      }

      .menu-item[data-disabled] .menu-shortcut {
        color: inherit;
      }

      .separator {
        height: 1px;
        margin: 0.3rem;
        background: var(--menubar-separator, rgba(148, 163, 184, 0.35));
      }

      .indicator {
        position: absolute;
        left: 0.4rem;
        width: 1rem;
        height: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        opacity: 0;
        transition: opacity var(--_transition-duration) ease;
      }

      .indicator svg {
        width: 0.9rem;
        height: 0.9rem;
        fill: currentColor;
      }

      .menu-item[data-state="checked"] .indicator {
        opacity: 1;
      }

      .menu-item[data-role="checkbox"],
      .menu-item[data-role="radio"] {
        padding-left: 1.75rem;
      }

      .submenu-icon {
        display: inline-flex;
        margin-left: auto;
        color: currentColor;
      }

      .submenu-icon svg {
        width: 0.75rem;
        height: 0.75rem;
        fill: currentColor;
      }

      @media (prefers-reduced-motion: reduce) {
        .menu-content,
        .submenu-content {
          transition: none;
        }

        .trigger,
        .menu-item {
          transition: none;
        }
      }
    </style>
    <div class="menubar" part="menubar" role="menubar">
      <div class="menu" data-menu="file">
        <button type="button" class="trigger" part="trigger" data-role="trigger" data-menu="file" aria-haspopup="true" aria-expanded="false">
          File
        </button>
        <div class="menu-content" part="menu" role="menu" aria-label="File">
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>New Tab</span>
            <span class="menu-shortcut" part="shortcut">⌘ T</span>
          </button>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>New Window</span>
            <span class="menu-shortcut" part="shortcut">⌘ N</span>
          </button>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1" data-disabled="true" aria-disabled="true">
            <span>New Incognito Window</span>
          </button>
          <div class="separator" role="separator"></div>
          <div class="submenu" part="submenu" data-submenu="share">
            <button type="button" class="menu-item" part="menu-item" data-role="submenu-trigger" aria-haspopup="true" aria-expanded="false" role="menuitem" tabindex="-1">
              <span>Share</span>
              <span class="submenu-icon" aria-hidden="true">
                <svg viewBox="0 0 15 15" aria-hidden="true" focusable="false">
                  <path d="M5 3.5a.5.5 0 0 1 .5-.5H11a1 1 0 0 1 1 1V9.5a.5.5 0 0 1-1 0V4.707L4.854 10.854a.5.5 0 0 1-.708-.708L10.293 4H5.5a.5.5 0 0 1-.5-.5Z" />
                </svg>
              </span>
            </button>
            <div class="submenu-content" part="menu" role="menu" aria-label="Share">
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Email Link</span>
              </button>
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Messages</span>
              </button>
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Notes</span>
              </button>
            </div>
          </div>
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Print…</span>
            <span class="menu-shortcut" part="shortcut">⌘ P</span>
          </button>
        </div>
      </div>
      <div class="menu" data-menu="edit">
        <button type="button" class="trigger" part="trigger" data-role="trigger" data-menu="edit" aria-haspopup="true" aria-expanded="false">
          Edit
        </button>
        <div class="menu-content" part="menu" role="menu" aria-label="Edit">
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Undo</span>
            <span class="menu-shortcut" part="shortcut">⌘ Z</span>
          </button>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Redo</span>
            <span class="menu-shortcut" part="shortcut">⇧ ⌘ Z</span>
          </button>
          <div class="separator" role="separator"></div>
          <div class="submenu" part="submenu" data-submenu="find">
            <button type="button" class="menu-item" part="menu-item" data-role="submenu-trigger" aria-haspopup="true" aria-expanded="false" role="menuitem" tabindex="-1">
              <span>Find</span>
              <span class="submenu-icon" aria-hidden="true">
                <svg viewBox="0 0 15 15" aria-hidden="true" focusable="false">
                  <path d="M5 3.5a.5.5 0 0 1 .5-.5H11a1 1 0 0 1 1 1V9.5a.5.5 0 0 1-1 0V4.707L4.854 10.854a.5.5 0 0 1-.708-.708L10.293 4H5.5a.5.5 0 0 1-.5-.5Z" />
                </svg>
              </span>
            </button>
            <div class="submenu-content" part="menu" role="menu" aria-label="Find">
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Search the web…</span>
              </button>
              <div class="separator" role="separator"></div>
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Find…</span>
              </button>
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Find Next</span>
              </button>
              <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
                <span>Find Previous</span>
              </button>
            </div>
          </div>
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Cut</span>
          </button>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Copy</span>
          </button>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Paste</span>
          </button>
        </div>
      </div>
      <div class="menu" data-menu="view">
        <button type="button" class="trigger" part="trigger" data-role="trigger" data-menu="view" aria-haspopup="true" aria-expanded="false">
          View
        </button>
        <div class="menu-content" part="menu" role="menu" aria-label="View">
          ${CHECK_ITEMS.map((item) => `
            <button type="button" class="menu-item" part="menu-item" data-role="checkbox" data-check-key="${item}" role="menuitemcheckbox" aria-checked="false" tabindex="-1">
              <span class="indicator" part="indicator" aria-hidden="true">
                <svg viewBox="0 0 15 15" focusable="false" aria-hidden="true">
                  <path d="M6.5 10.5 3.75 7.75l.7-.7L6.5 9.07l4.05-4.05.7.7-4.75 4.78Z" />
                </svg>
              </span>
              <span>${item}</span>
            </button>
          `).join('')}
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Reload</span>
            <span class="menu-shortcut" part="shortcut">⌘ R</span>
          </button>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" data-disabled="true" aria-disabled="true" tabindex="-1">
            <span>Force Reload</span>
            <span class="menu-shortcut" part="shortcut">⇧ ⌘ R</span>
          </button>
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Toggle Fullscreen</span>
          </button>
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Hide Sidebar</span>
          </button>
        </div>
      </div>
      <div class="menu" data-menu="profiles">
        <button type="button" class="trigger" part="trigger" data-role="trigger" data-menu="profiles" aria-haspopup="true" aria-expanded="false">
          Profiles
        </button>
        <div class="menu-content" part="menu" role="menu" aria-label="Profiles">
          <div role="group" aria-label="Active profile">
            ${RADIO_ITEMS.map((item) => `
              <button type="button" class="menu-item" part="menu-item" data-role="radio" data-radio-value="${item}" role="menuitemradio" aria-checked="false" tabindex="-1">
                <span class="indicator" part="indicator" aria-hidden="true">
                  <svg viewBox="0 0 15 15" focusable="false" aria-hidden="true">
                    <circle cx="7.5" cy="7.5" r="3" />
                  </svg>
                </span>
                <span>${item}</span>
              </button>
            `).join('')}
          </div>
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Edit…</span>
          </button>
          <div class="separator" role="separator"></div>
          <button type="button" class="menu-item" part="menu-item" role="menuitem" tabindex="-1">
            <span>Add Profile…</span>
          </button>
        </div>
      </div>
    </div>
  `;

  /**
   * Desktop style menubar with keyboard navigation, submenus, checkbox items,
   * and radio groups.
   */
  class WcMenubar extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #menubar;
    /** @type {HTMLButtonElement[]} */
    #triggers = [];
    /** @type {Map<string, HTMLElement>} */
    #menuMap = new Map();
    /** @type {HTMLButtonElement[]} */
    #checkboxButtons = [];
    /** @type {HTMLButtonElement[]} */
    #radioButtons = [];
    /** @type {Set<string>} */
    #checked = new Set([CHECK_ITEMS[1]]);
    /** @type {string} */
    #radioValue = RADIO_ITEMS[2];
    /** @type {string | null} */
    #openMenu = null;
    /** @type {(event: Event) => void} */
    #boundDismissHandler;
    /** @type {boolean} */
    #initialized = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.appendChild(template.content.cloneNode(true));
      this.#menubar = /** @type {HTMLDivElement} */ (this.#root.querySelector('.menubar'));
      this.#boundDismissHandler = (event) => this.#onDismissEvent(event);
      this.addEventListener('keydown', (event) => this.#onHostKeydown(event));
    }

    connectedCallback() {
      upgradeProperty(this, 'disabled');
      if (!this.#initialized) {
        this.#setup();
        this.#initialized = true;
      } else {
        this.#hydrateCheckboxes();
        this.#syncRadioState();
      }
      document.addEventListener('pointerdown', this.#boundDismissHandler, true);
      document.addEventListener('focusin', this.#boundDismissHandler, true);
    }

    disconnectedCallback() {
      document.removeEventListener('pointerdown', this.#boundDismissHandler, true);
      document.removeEventListener('focusin', this.#boundDismissHandler, true);
    }

    /**
     * Initialize trigger and menu references and hydrate default states.
     */
    #setup() {
      this.#triggers = Array.from(this.#root.querySelectorAll('[data-role="trigger"]'));
      this.#triggers.forEach((trigger, index) => {
        trigger.tabIndex = index === 0 ? 0 : -1;
        trigger.addEventListener('click', () => this.#toggleMenu(trigger.dataset.menu || ''));
        trigger.addEventListener('keydown', (event) => this.#onTriggerKeydown(event, index));
        trigger.addEventListener('mouseenter', () => {
          if (this.#openMenu && this.#openMenu !== trigger.dataset.menu) {
            this.#openMenuByName(trigger.dataset.menu || '', { focusFirstItem: false });
          }
        });
      });

      const menus = Array.from(this.#root.querySelectorAll('.menu'));
      menus.forEach((menu) => {
        const name = menu.getAttribute('data-menu');
        if (!name) return;
        this.#menuMap.set(name, menu);
      });

      this.#checkboxButtons = Array.from(this.#root.querySelectorAll('[data-role="checkbox"]'));
      this.#checkboxButtons.forEach((item) => {
        const key = item.getAttribute('data-check-key');
        if (!key) return;
        item.addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();
          if (item.hasAttribute('data-disabled')) return;
          if (this.#checked.has(key)) {
            this.#checked.delete(key);
            this.dispatchEvent(new CustomEvent('menubar-checkbox-toggle', {
              detail: { item: key, checked: false },
              bubbles: true,
              composed: true,
            }));
          } else {
            this.#checked.add(key);
            this.dispatchEvent(new CustomEvent('menubar-checkbox-toggle', {
              detail: { item: key, checked: true },
              bubbles: true,
              composed: true,
            }));
          }
          this.#applyCheckboxState(/** @type {HTMLButtonElement} */ (item), this.#checked.has(key));
        });
      });

      this.#radioButtons = Array.from(this.#root.querySelectorAll('[data-role="radio"]'));
      this.#radioButtons.forEach((item) => {
        const value = item.getAttribute('data-radio-value');
        if (!value) return;
        item.addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();
          if (item.hasAttribute('data-disabled')) return;
          if (value !== this.#radioValue) {
            this.#radioValue = value;
            this.dispatchEvent(new CustomEvent('menubar-radio-change', {
              detail: { value },
              bubbles: true,
              composed: true,
            }));
            this.#syncRadioState();
          }
        });
      });

      this.#hydrateCheckboxes();
      this.#syncRadioState();
      this.#setupMenuItems();
    }

    /**
     * Apply checkbox selection state to matching items.
     */
    #hydrateCheckboxes() {
      this.#checkboxButtons.forEach((item) => {
        const key = item.getAttribute('data-check-key');
        if (!key) return;
        this.#applyCheckboxState(item, this.#checked.has(key));
      });
    }

    /**
     * Sync radio selection state with DOM elements.
     */
    #syncRadioState() {
      this.#radioButtons.forEach((item) => {
        const value = item.getAttribute('data-radio-value');
        if (!value) return;
        this.#applyRadioState(item, value === this.#radioValue);
      });
    }

    /**
     * Assign keyboard interactions to menu items.
     */
    #setupMenuItems() {
      const menus = Array.from(this.#menuMap.values());
      menus.forEach((menu) => {
        const menuItems = Array.from(menu.querySelectorAll('.menu-item'));
        menuItems.forEach((item) => {
          item.addEventListener('mouseenter', () => {
            if (item.hasAttribute('data-disabled')) return;
            item.setAttribute('data-highlighted', 'true');
          });
          item.addEventListener('mouseleave', () => {
            item.removeAttribute('data-highlighted');
          });
          item.addEventListener('keydown', (event) => this.#onMenuItemKeydown(event, item));
          item.addEventListener('click', () => {
            if (item.hasAttribute('data-disabled')) return;
            if (item.dataset.role === 'submenu-trigger') {
              this.#toggleSubmenu(item);
              return;
            }
            if (item.dataset.role === 'checkbox' || item.dataset.role === 'radio') {
              return;
            }
            this.dispatchEvent(new CustomEvent('menubar-select', {
              detail: { menu: menu.getAttribute('data-menu'), label: item.textContent?.trim() || '' },
              bubbles: true,
              composed: true,
            }));
            this.#closeAllMenus();
          });
        });

        menu.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            this.#closeAllMenus();
            const name = menu.getAttribute('data-menu');
            if (name) {
              this.#focusTriggerByName(name);
            }
          }
        });
      });

      const submenuTriggers = this.#root.querySelectorAll('[data-role="submenu-trigger"]');
      submenuTriggers.forEach((trigger) => {
        trigger.addEventListener('mouseenter', () => {
          if (trigger.hasAttribute('data-disabled')) return;
          this.#openSubmenu(trigger.closest('.submenu'));
        });
        trigger.addEventListener('mouseleave', () => {
          trigger.removeAttribute('data-highlighted');
        });
        trigger.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.#openSubmenu(trigger.closest('.submenu'), true);
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.#closeSubmenu(trigger.closest('.submenu'));
            const parentMenu = trigger.closest('.menu');
            if (parentMenu) {
              const name = parentMenu.getAttribute('data-menu');
              if (name) {
                this.#focusTriggerByName(name);
              }
            }
          }
        });
      });
    }

    /**
     * Handle keyboard navigation on menubar triggers.
     * @param {KeyboardEvent} event
     * @param {number} index
     */
    #onTriggerKeydown(event, index) {
      const total = this.#triggers.length;
      switch (event.key) {
        case 'ArrowRight':
        case 'Right':
          event.preventDefault();
          this.#focusTrigger((index + 1) % total);
          break;
        case 'ArrowLeft':
        case 'Left':
          event.preventDefault();
          this.#focusTrigger((index - 1 + total) % total);
          break;
        case 'Home':
          event.preventDefault();
          this.#focusTrigger(0);
          break;
        case 'End':
          event.preventDefault();
          this.#focusTrigger(total - 1);
          break;
        case 'ArrowDown':
        case 'Down':
        case 'Enter':
        case ' ': {
          event.preventDefault();
          const menuName = this.#triggers[index].dataset.menu || '';
          this.#openMenuByName(menuName, { focusFirstItem: true });
          break;
        }
        case 'Escape':
          this.#closeAllMenus();
          break;
        default:
          break;
      }
    }

    /**
     * Handle global key events for typeahead like closing menus with Escape.
     * @param {KeyboardEvent} event
     */
    #onHostKeydown(event) {
      if (event.key === 'Escape') {
        this.#closeAllMenus();
      }
    }

    /**
     * Handle pointer/focus interactions outside the component to close menus.
     * @param {PointerEvent | FocusEvent} event
     */
    #onDismissEvent(event) {
      if (!this.#openMenu) return;
      const path = event.composedPath();
      if (!path.includes(this)) {
        this.#closeAllMenus();
      }
    }

    /**
     * Toggle menu visibility by name.
     * @param {string} menuName
     */
    #toggleMenu(menuName) {
      if (!menuName) return;
      if (this.#openMenu === menuName) {
        this.#closeAllMenus();
      } else {
        this.#openMenuByName(menuName, { focusFirstItem: false });
      }
    }

    /**
     * Open the menu matching the provided name.
     * @param {string} menuName
     * @param {{ focusFirstItem?: boolean }} [options]
     */
    #openMenuByName(menuName, options = {}) {
      const { focusFirstItem = false } = options;
      if (!menuName) return;
      this.#menuMap.forEach((menu, name) => {
        const trigger = this.#root.querySelector(`[data-role="trigger"][data-menu="${name}"]`);
        if (!trigger) return;
        const isTarget = name === menuName;
        trigger.setAttribute('aria-expanded', String(isTarget));
        if (isTarget) {
          menu.setAttribute('data-open', '');
          this.#openMenu = name;
          if (focusFirstItem) {
            this.#focusFirstItem(menu);
          }
        } else {
          menu.removeAttribute('data-open');
          this.#closeSubmenus(menu);
        }
      });
      const index = this.#triggers.findIndex((btn) => btn.dataset.menu === menuName);
      if (index >= 0) {
        this.#focusTrigger(index);
      }
    }

    /**
     * Close all open menus and submenus.
     */
    #closeAllMenus() {
      this.#menuMap.forEach((menu, name) => {
        const trigger = this.#root.querySelector(`[data-role="trigger"][data-menu="${name}"]`);
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
        menu.removeAttribute('data-open');
        this.#closeSubmenus(menu);
      });
      this.#openMenu = null;
    }

    /**
     * Focus a trigger by its index and manage tab stops.
     * @param {number} index
     */
    #focusTrigger(index) {
      if (index < 0 || index >= this.#triggers.length) return;
      this.#triggers.forEach((trigger, idx) => {
        trigger.tabIndex = idx === index ? 0 : -1;
      });
      this.#triggers[index].focus();
    }

    /**
     * Focus the trigger associated with a menu name.
     * @param {string} menuName
     */
    #focusTriggerByName(menuName) {
      const index = this.#triggers.findIndex((btn) => btn.dataset.menu === menuName);
      if (index >= 0) {
        this.#focusTrigger(index);
      }
    }

    /**
     * Focus the first interactive menu item.
     * @param {Element} menu
     */
    #focusFirstItem(menu) {
      const items = this.#getNavigableItems(menu);
      if (items.length > 0) {
        items[0].focus();
      }
    }

    /**
     * Return interactive menu items from a menu container.
     * @param {Element} menu
     * @returns {HTMLButtonElement[]}
     */
    #getNavigableItems(menu) {
      return Array.from(menu.querySelectorAll('.menu-item')).filter(
        (item) => !item.hasAttribute('data-disabled')
      );
    }

    /**
     * Handle keyboard navigation within menu items.
     * @param {KeyboardEvent} event
     * @param {HTMLButtonElement} item
     */
    #onMenuItemKeydown(event, item) {
      const currentMenu = item.closest('.menu, .submenu-content');
      if (!currentMenu) return;
      const navigableItems = this.#getNavigableItems(currentMenu);
      if (navigableItems.length === 0) return;
      const currentIndex = navigableItems.indexOf(item);
      switch (event.key) {
        case 'ArrowDown':
        case 'Down':
          event.preventDefault();
          navigableItems[(currentIndex + 1) % navigableItems.length]?.focus();
          break;
        case 'ArrowUp':
        case 'Up':
          event.preventDefault();
          navigableItems[(currentIndex - 1 + navigableItems.length) % navigableItems.length]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          navigableItems[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          navigableItems[navigableItems.length - 1]?.focus();
          break;
        case 'ArrowRight':
        case 'Right':
          if (item.dataset.role === 'submenu-trigger') {
            event.preventDefault();
            this.#openSubmenu(item.closest('.submenu'), true);
          } else {
            const menuName = item.closest('.menu')?.getAttribute('data-menu');
            if (menuName) {
              event.preventDefault();
              this.#focusNextMenu(menuName, 1, true);
            }
          }
          break;
        case 'ArrowLeft':
        case 'Left':
          if (item.closest('.submenu-content')) {
            event.preventDefault();
            const parentSubmenu = item.closest('.submenu');
            this.#closeSubmenu(parentSubmenu);
            const trigger = parentSubmenu?.querySelector('[data-role="submenu-trigger"]');
            if (trigger instanceof HTMLButtonElement) {
              trigger.focus();
            }
          } else {
            const menuName = item.closest('.menu')?.getAttribute('data-menu');
            if (menuName) {
              event.preventDefault();
              this.#focusNextMenu(menuName, -1, true);
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.#closeAllMenus();
          break;
        case 'Tab':
          this.#closeAllMenus();
          break;
        default:
          break;
      }
    }

    /**
     * Focus the first item of the next or previous top-level menu.
     * @param {string} currentMenu
     * @param {1 | -1} delta
     * @param {boolean} focusFirstItem
     */
    #focusNextMenu(currentMenu, delta, focusFirstItem) {
      const index = this.#triggers.findIndex((btn) => btn.dataset.menu === currentMenu);
      if (index < 0) return;
      const nextIndex = (index + delta + this.#triggers.length) % this.#triggers.length;
      const nextMenu = this.#triggers[nextIndex].dataset.menu || '';
      this.#openMenuByName(nextMenu, { focusFirstItem });
    }

    /**
     * Open a submenu if present.
     * @param {Element | null} submenu
     * @param {boolean} [focusFirstItem=false]
     */
    #openSubmenu(submenu, focusFirstItem = false) {
      if (!submenu) return;
      submenu.setAttribute('data-open', '');
      const trigger = submenu.querySelector('[data-role="submenu-trigger"]');
      if (trigger instanceof HTMLButtonElement) {
        trigger.setAttribute('data-state', 'open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      if (focusFirstItem) {
        const content = submenu.querySelector('.submenu-content');
        if (content) {
          this.#focusFirstItem(content);
        }
      }
    }

    /**
     * Close a submenu and optionally return focus to its trigger.
     * @param {Element | null} submenu
     */
    #closeSubmenu(submenu) {
      if (!submenu) return;
      submenu.removeAttribute('data-open');
      const trigger = submenu.querySelector('[data-role="submenu-trigger"]');
      if (trigger instanceof HTMLButtonElement) {
        trigger.removeAttribute('data-state');
        trigger.setAttribute('aria-expanded', 'false');
      }
    }

    /**
     * Close all nested submenus within a menu.
     * @param {Element} menu
     */
    #closeSubmenus(menu) {
      const submenus = menu.querySelectorAll('.submenu');
      submenus.forEach((submenu) => this.#closeSubmenu(submenu));
    }

    /**
     * Toggle submenu state from trigger interaction.
     * @param {HTMLElement} trigger
     */
    #toggleSubmenu(trigger) {
      const submenu = trigger.closest('.submenu');
      if (!submenu) return;
      if (submenu.hasAttribute('data-open')) {
        this.#closeSubmenu(submenu);
      } else {
        this.#openSubmenu(submenu, true);
      }
    }

    /**
     * Apply visual state for checkbox menu items.
     * @param {HTMLButtonElement} item
     * @param {boolean} checked
     */
    #applyCheckboxState(item, checked) {
      item.setAttribute('aria-checked', String(checked));
      if (checked) {
        item.setAttribute('data-state', 'checked');
      } else {
        item.removeAttribute('data-state');
      }
    }

    /**
     * Apply state to radio menu items.
     * @param {HTMLButtonElement} item
     * @param {boolean} checked
     */
    #applyRadioState(item, checked) {
      item.setAttribute('aria-checked', String(checked));
      if (checked) {
        item.setAttribute('data-state', 'checked');
      } else {
        item.removeAttribute('data-state');
      }
    }
  }

  if (!customElements.get('wc-menubar')) {
    customElements.define('wc-menubar', WcMenubar);
  }
})();

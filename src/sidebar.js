/**
 * @file sidebar.js
 * @version 1.0.0
 *
 * Sidebar primitives implemented as web components. Inspired by shadcn/ui's
 * sidebar system, these elements compose into collapsible navigation surfaces
 * with keyboard shortcuts, persisted state, and CSS-driven theming.
 */

(() => {
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  const parseBooleanAttribute = (value) => value !== null && value !== 'false';

  const SIDEBAR_COOKIE_NAME = 'sidebar_state';
  const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
  const SIDEBAR_SHORTCUT = 'b';
  const SIDEBAR_WIDTH = '16rem';
  const SIDEBAR_WIDTH_MOBILE = '18rem';
  const SIDEBAR_COLLAPSED_WIDTH = '3.75rem';
  const SIDEBAR_MOBILE_QUERY = '(max-width: 960px)';

  /**
   * @param {Element} element
   * @returns {HTMLElement | null}
   */
  const findSidebarProvider = (element) => {
    return /** @type {HTMLElement | null} */ (element.closest('wc-sidebar-provider'));
  };

  const readCookie = (cookieName) => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(value ?? '');
      }
    }
    return null;
  };

  const writeCookie = (cookieName, value) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${cookieName}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  };

  class WcSidebarProvider extends HTMLElement {
    static get observedAttributes() {
      return ['open'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #overlayButton;
    /** @type {boolean} */
    #open = true;
    /** @type {boolean} */
    #isMobile = false;
    /** @type {MediaQueryList | null} */
    #mql = null;
    /** @type {(event: KeyboardEvent) => void} */
    #handleKeydown;
    /** @type {(event: MediaQueryListEvent | MediaQueryList) => void} */
    #handleMediaChange;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-sidebar-width: var(--sidebar-width, ${SIDEBAR_WIDTH});
            --wc-sidebar-width-mobile: var(--sidebar-width-mobile, ${SIDEBAR_WIDTH_MOBILE});
            --wc-sidebar-collapsed-width: var(--sidebar-collapsed-width, ${SIDEBAR_COLLAPSED_WIDTH});
            --wc-sidebar-overlay-background: color-mix(in srgb, black 55%, transparent);
            --wc-sidebar-overlay-opacity: 0.45;
            --wc-sidebar-transition-duration: 220ms;
            --wc-sidebar-transition-easing: cubic-bezier(0.33, 1, 0.68, 1);
            display: flex;
            width: 100%;
            min-height: 100%;
            position: relative;
            background: var(--layout-background, transparent);
            color: inherit;
            gap: var(--wc-sidebar-gap, 0);
          }

          :host([data-device="mobile"]) {
            overflow: hidden;
          }

          slot::slotted(*) {
            flex: 1 1 auto;
            min-width: 0;
          }

          .overlay {
            position: fixed;
            inset: 0;
            border: none;
            margin: 0;
            padding: 0;
            background: var(--wc-sidebar-overlay-background);
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
            z-index: 40;
          }

          .overlay:focus {
            outline: none;
          }

          :host([data-overlay-state="visible"]) .overlay {
            opacity: var(--wc-sidebar-overlay-opacity);
            pointer-events: auto;
          }
        </style>
        <slot></slot>
        <button type="button" part="overlay" class="overlay" aria-hidden="true"></button>
      `;
      this.#overlayButton = /** @type {HTMLButtonElement} */ (this.#root.querySelector('.overlay'));

      this.#handleKeydown = (event) => {
        const shortcut = (this.getAttribute('shortcut') || SIDEBAR_SHORTCUT).toLowerCase();
        if (!shortcut) return;
        const isMac = /Mac|iPod|iPhone|iPad/.test(typeof navigator !== 'undefined' ? navigator.platform : '');
        const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
        if (modifierPressed && !event.shiftKey && !event.altKey && event.key.toLowerCase() === shortcut) {
          event.preventDefault();
          this.toggle();
        }
      };

      this.#handleMediaChange = (event) => {
        const matches = 'matches' in event ? event.matches : event.currentTarget?.matches;
        const isMobile = Boolean(matches);
        this.#isMobile = isMobile;
        this.dataset.device = isMobile ? 'mobile' : 'desktop';
        this.#syncOverlayState();
        this.dispatchEvent(
          new CustomEvent('wc-sidebar-device-change', {
            detail: { isMobile: this.#isMobile },
            bubbles: true,
            composed: true,
          })
        );
      };
    }

    connectedCallback() {
      upgradeProperty(this, 'open');
      this.setAttribute('role', this.getAttribute('role') || 'presentation');

      const persisted = this.hasAttribute('persist-state');
      const cookieName = this.getAttribute('cookie-name') || SIDEBAR_COOKIE_NAME;
      let initialOpen = true;
      if (this.hasAttribute('open')) {
        initialOpen = true;
      } else if (persisted) {
        const cookieValue = readCookie(cookieName);
        if (cookieValue === 'true') initialOpen = true;
        else if (cookieValue === 'false') initialOpen = false;
      } else if (this.hasAttribute('default-open')) {
        initialOpen = parseBooleanAttribute(this.getAttribute('default-open'));
      }
      this.#open = initialOpen;
      this.toggleAttribute('open', initialOpen);
      this.#applyOpenState();

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', this.#handleKeydown);
        this.#mql = window.matchMedia(this.getAttribute('mobile-query') || SIDEBAR_MOBILE_QUERY);
        this.#mql.addEventListener('change', this.#handleMediaChange);
        this.#handleMediaChange(this.#mql);
      }

      this.#overlayButton.addEventListener('click', this.#onOverlayClick);
    }

    disconnectedCallback() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', this.#handleKeydown);
        this.#mql?.removeEventListener('change', this.#handleMediaChange);
      }
      this.#overlayButton.removeEventListener('click', this.#onOverlayClick);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'open') {
        const next = parseBooleanAttribute(newValue);
        if (next !== this.#open) {
          this.#open = next;
          this.#applyOpenState();
        }
      }
    }

    get open() {
      return this.#open;
    }

    set open(value) {
      const next = Boolean(value);
      if (next) this.setAttribute('open', '');
      else this.removeAttribute('open');
      if (next !== this.#open) {
        this.#open = next;
        this.#applyOpenState();
      }
    }

    /**
     * @param {boolean=} force
     */
    toggle(force) {
      const next = typeof force === 'boolean' ? force : !this.#open;
      this.open = next;
    }

    #applyOpenState() {
      this.dataset.state = this.#open ? 'expanded' : 'collapsed';
      this.setAttribute('aria-expanded', String(this.#open));
      this.#syncOverlayState();

      if (this.hasAttribute('persist-state')) {
        const cookieName = this.getAttribute('cookie-name') || SIDEBAR_COOKIE_NAME;
        writeCookie(cookieName, this.#open ? 'true' : 'false');
      }

      this.dispatchEvent(
        new CustomEvent('wc-sidebar-open-change', {
          detail: { open: this.#open, isMobile: this.#isMobile },
          bubbles: true,
          composed: true,
        })
      );
    }

    #syncOverlayState() {
      const showOverlay = this.#isMobile && this.#open;
      this.dataset.overlayState = showOverlay ? 'visible' : 'hidden';
      this.#overlayButton.setAttribute('aria-hidden', 'true');
      this.#overlayButton.tabIndex = -1;
    }

    #onOverlayClick = (event) => {
      event.preventDefault();
      this.toggle(false);
    };
  }

  if (!customElements.get('wc-sidebar-provider')) {
    customElements.define('wc-sidebar-provider', WcSidebarProvider);
  }

  class WcSidebar extends HTMLElement {
    static get observedAttributes() {
      return ['variant', 'collapsible', 'side'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #base;
    /** @type {HTMLElement} */
    #scroll;
    /** @type {HTMLElement | null} */
    #provider = null;
    /** @type {boolean} */
    #open = true;
    /** @type {boolean} */
    #isMobile = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-sidebar-current-width: var(--sidebar-width, ${SIDEBAR_WIDTH});
            --wc-sidebar-current-translate: 0;
            --wc-sidebar-background: var(--sidebar, oklch(0.985 0 0));
            --wc-sidebar-foreground: var(--sidebar-foreground, oklch(0.145 0 0));
            --wc-sidebar-border-color: var(--sidebar-border, oklch(0.922 0 0));
            --wc-sidebar-ring: var(--sidebar-ring, oklch(0.708 0 0));
            --wc-sidebar-radius: var(--sidebar-radius, 1rem);
            --wc-sidebar-gap: var(--sidebar-gap, 0.25rem);
            --wc-sidebar-padding: var(--sidebar-padding, 1rem);
            flex: 0 0 auto;
            position: relative;
            width: var(--wc-sidebar-current-width);
            min-width: 0;
            transition: width var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
            contain: layout style;
            box-sizing: border-box;
          }

          :host([variant="floating"]) {
            padding: 0.5rem;
          }

          :host([variant="floating"]) .base {
            border-radius: var(--wc-sidebar-radius);
            box-shadow: 0 24px 48px -32px rgba(15, 23, 42, 0.35);
            border: 1px solid color-mix(in srgb, var(--wc-sidebar-border-color) 60%, transparent);
          }

          :host([variant="inset"]) .base {
            border-radius: var(--wc-sidebar-radius);
          }

          :host([side="right"]) .base {
            border-inline-end: none;
            border-inline-start: 1px solid var(--wc-sidebar-border-color);
          }

          :host([collapsible="icon"][data-collapsible-state="collapsed"]) {
            --wc-sidebar-current-width: var(--sidebar-collapsed-width, ${SIDEBAR_COLLAPSED_WIDTH});
          }

          :host([collapsible="offcanvas"]) {
            width: var(--wc-sidebar-current-width, var(--sidebar-width, ${SIDEBAR_WIDTH}));
          }

          :host([collapsible="offcanvas"][data-collapsible-state="collapsed"]) {
            --wc-sidebar-current-width: 0;
          }

          :host([data-overlay="true"]) {
            width: 0;
          }

          :host([data-hidden="true"]) {
            pointer-events: none;
          }

          .base {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            background: var(--wc-sidebar-background);
            color: var(--wc-sidebar-foreground);
            border-inline-end: 1px solid var(--wc-sidebar-border-color);
            transition: transform var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing),
              box-shadow var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
            transform: translateX(var(--wc-sidebar-current-translate));
            outline: none;
            box-shadow: var(--wc-sidebar-shadow, none);
            box-sizing: border-box;
          }

          :host([collapsible="offcanvas"]) .base,
          :host([data-overlay="true"]) .base {
            position: fixed;
            inset-block: 0;
            inset-inline-start: 0;
            width: min(var(--sidebar-width-mobile, ${SIDEBAR_WIDTH_MOBILE}), 100vw);
            max-width: 100vw;
            z-index: 50;
            box-shadow: 0 28px 80px -30px rgba(15, 23, 42, 0.45);
          }

          :host([side="right"][collapsible="offcanvas"]) .base,
          :host([data-overlay="true"][side="right"]) .base {
            inset-inline-start: auto;
            inset-inline-end: 0;
          }

          :host([collapsible="offcanvas"][data-collapsible-state="collapsed"]) .base {
            visibility: hidden;
          }

          :host([data-overlay="true"][data-hidden="true"]) .base {
            visibility: hidden;
          }

          :host([variant="floating"]) .base,
          :host([variant="inset"]) .base {
            border-inline-end: none;
          }

          .scroll {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: var(--wc-sidebar-padding);
            display: flex;
            flex-direction: column;
            gap: var(--wc-sidebar-gap);
          }

          .scroll::-webkit-scrollbar {
            width: 0.5rem;
          }

          .scroll::-webkit-scrollbar-thumb {
            background: color-mix(in srgb, var(--wc-sidebar-border-color) 60%, transparent);
            border-radius: 999px;
          }

          .scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          :host([collapsible="icon"][data-collapsible-state="collapsed"]) .scroll {
            align-items: center;
            padding: var(--wc-sidebar-padding-collapsed, 0.75rem 0.5rem);
            gap: var(--wc-sidebar-gap-collapsed, 0.75rem);
          }
        </style>
        <div part="base" class="base" role="complementary">
          <div part="scroll" class="scroll">
            <slot name="header"></slot>
            <slot name="content"></slot>
            <slot name="footer"></slot>
          </div>
          <slot name="rail"></slot>
        </div>
      `;
      this.#base = /** @type {HTMLElement} */ (this.#root.querySelector('.base'));
      this.#scroll = /** @type {HTMLElement} */ (this.#root.querySelector('.scroll'));
    }

    connectedCallback() {
      upgradeProperty(this, 'variant');
      upgradeProperty(this, 'collapsible');
      upgradeProperty(this, 'side');
      if (!this.hasAttribute('variant')) this.setAttribute('variant', 'sidebar');
      if (!this.hasAttribute('collapsible')) this.setAttribute('collapsible', 'icon');
      if (!this.hasAttribute('side')) this.setAttribute('side', 'left');

      this.#provider = findSidebarProvider(this);
      if (this.#provider) {
        this.#provider.addEventListener('wc-sidebar-open-change', this.#onOpenChange);
        this.#provider.addEventListener('wc-sidebar-device-change', this.#onDeviceChange);
        const providerState = this.#provider.dataset.state;
        this.#open = providerState !== 'collapsed';
        this.#isMobile = this.#provider.dataset.device === 'mobile';
      }
      this.#syncState();
    }

    disconnectedCallback() {
      if (this.#provider) {
        this.#provider.removeEventListener('wc-sidebar-open-change', this.#onOpenChange);
        this.#provider.removeEventListener('wc-sidebar-device-change', this.#onDeviceChange);
        this.#provider = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'variant' || name === 'collapsible' || name === 'side') {
        this.#syncState();
      }
    }

    #onOpenChange = (event) => {
      const detail = /** @type {{ open: boolean; isMobile: boolean }} */ (event.detail);
      this.#open = detail.open;
      this.#isMobile = detail.isMobile;
      this.#syncState();
    };

    #onDeviceChange = (event) => {
      const detail = /** @type {{ isMobile: boolean }} */ (event.detail);
      this.#isMobile = detail.isMobile;
      this.#syncState();
    };

    #syncState() {
      const collapsible = (this.getAttribute('collapsible') || 'icon').toLowerCase();
      const side = (this.getAttribute('side') || 'left').toLowerCase();
      const isOverlay = this.#isMobile;
      const translateClosed = side === 'right' ? '100%' : '-100%';

      this.dataset.collapsibleState = this.#open ? 'expanded' : 'collapsed';
      this.dataset.hidden = String(!this.#open && (isOverlay || collapsible === 'offcanvas'));
      if (isOverlay) {
        this.dataset.overlay = 'true';
      } else {
        delete this.dataset.overlay;
      }

      if (this.#open) {
        this.removeAttribute('aria-hidden');
      } else if (collapsible !== 'none' && (isOverlay || collapsible === 'offcanvas')) {
        this.setAttribute('aria-hidden', 'true');
      }

      const widthVar = `var(--sidebar-width, ${SIDEBAR_WIDTH})`;
      const collapsedVar =
        collapsible === 'icon'
          ? `var(--sidebar-collapsed-width, ${SIDEBAR_COLLAPSED_WIDTH})`
          : collapsible === 'offcanvas'
          ? '0px'
          : widthVar;
      this.style.setProperty('--wc-sidebar-current-width', this.#open ? widthVar : collapsedVar);
      this.style.setProperty(
        '--wc-sidebar-current-translate',
        this.#open ? '0' : (isOverlay || collapsible === 'offcanvas' ? translateClosed : '0')
      );
    }
  }

  if (!customElements.get('wc-sidebar')) {
    customElements.define('wc-sidebar', WcSidebar);
  }

  class WcSidebarInset extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement | null} */
    #provider = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            min-width: 0;
            min-height: 0;
            background: var(--sidebar-inset-background, transparent);
            color: inherit;
            gap: var(--sidebar-inset-gap, 0);
            padding: var(--sidebar-inset-padding, 0);
            transition: padding var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
          }

          :host([data-sidebar-state="collapsed"]) {
            --sidebar-inset-padding: var(--sidebar-inset-padding-collapsed, var(--sidebar-inset-padding, 0));
          }

          .content {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-inset-content-gap, 0);
          }
        </style>
        <div part="inset" class="content">
          <slot></slot>
        </div>
      `;
    }

    connectedCallback() {
      this.#provider = findSidebarProvider(this);
      if (this.#provider) {
        this.#provider.addEventListener('wc-sidebar-open-change', this.#onOpenChange);
      }
    }

    disconnectedCallback() {
      if (this.#provider) {
        this.#provider.removeEventListener('wc-sidebar-open-change', this.#onOpenChange);
        this.#provider = null;
      }
    }

    #onOpenChange = (event) => {
      const detail = /** @type {{ open: boolean }} */ (event.detail);
      this.dataset.sidebarState = detail.open ? 'expanded' : 'collapsed';
    };
  }

  if (!customElements.get('wc-sidebar-inset')) {
    customElements.define('wc-sidebar-inset', WcSidebarInset);
  }

  class WcSidebarTrigger extends HTMLElement {
    static get observedAttributes() {
      return ['label'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #button;
    /** @type {HTMLElement | null} */
    #provider = null;
    /** @type {boolean} */
    #open = true;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
          }

          button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: var(--sidebar-trigger-size, 2.5rem);
            height: var(--sidebar-trigger-size, 2.5rem);
            border-radius: var(--sidebar-trigger-radius, 0.75rem);
            border: none;
            background: var(--sidebar-trigger-background, rgba(15, 23, 42, 0.08));
            color: var(--sidebar-trigger-color, currentColor);
            cursor: pointer;
            transition: background var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing),
              color var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing),
              transform 120ms ease;
          }

          button:hover {
            background: var(--sidebar-trigger-background-hover, rgba(15, 23, 42, 0.12));
          }

          button:active {
            transform: scale(0.96);
          }

          button:focus-visible {
            outline: 2px solid var(--sidebar-trigger-ring, var(--wc-sidebar-ring));
            outline-offset: 2px;
          }

          .icon {
            width: 1.1rem;
            height: 1.1rem;
            pointer-events: none;
            fill: currentColor;
          }

          ::slotted(*) {
            pointer-events: none;
          }
        </style>
        <button type="button" part="trigger">
          <slot>
            <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
              <path d="M4 7h16a1 1 0 1 0 0-2H4a1 1 0 0 0 0 2Zm0 6h16a1 1 0 1 0 0-2H4a1 1 0 0 0 0 2Zm0 6h16a1 1 0 1 0 0-2H4a1 1 0 0 0 0 2Z" />
            </svg>
          </slot>
        </button>
      `;
      this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
    }

    connectedCallback() {
      this.#provider = findSidebarProvider(this);
      if (this.#provider) {
        this.#provider.addEventListener('wc-sidebar-open-change', this.#onOpenChange);
      }
      this.#button.addEventListener('click', this.#onClick);
      this.#syncLabel();
    }

    disconnectedCallback() {
      if (this.#provider) {
        this.#provider.removeEventListener('wc-sidebar-open-change', this.#onOpenChange);
        this.#provider = null;
      }
      this.#button.removeEventListener('click', this.#onClick);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'label') {
        this.#syncLabel();
      }
    }

    #syncLabel() {
      const label = this.getAttribute('label') || 'Toggle sidebar';
      this.#button.setAttribute('aria-label', label);
      this.#button.setAttribute('title', label);
      this.#button.setAttribute('aria-expanded', String(this.#open));
    }

    #onOpenChange = (event) => {
      const detail = /** @type {{ open: boolean }} */ (event.detail);
      this.#open = detail.open;
      this.#button.setAttribute('aria-expanded', String(this.#open));
    };

    #onClick = (event) => {
      event.preventDefault();
      if (this.#provider) {
        const isMobile = this.#provider.dataset.device === 'mobile';
        this.#provider.toggle(isMobile ? !this.#open : undefined);
      }
    };
  }

  if (!customElements.get('wc-sidebar-trigger')) {
    customElements.define('wc-sidebar-trigger', WcSidebarTrigger);
  }

  class WcSidebarHeader extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            position: sticky;
            top: 0;
            z-index: 2;
          }

          header {
            display: flex;
            align-items: center;
            gap: var(--sidebar-header-gap, 0.5rem);
            padding: var(--sidebar-header-padding, 0 0 0.75rem 0);
            margin-bottom: var(--sidebar-header-margin, 0.75rem);
            border-bottom: var(--sidebar-header-border, none);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) header {
            justify-content: center;
            padding: var(--sidebar-header-padding-collapsed, 0);
            margin-bottom: var(--sidebar-header-margin-collapsed, 0.5rem);
            overflow: hidden;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) ::slotted(*) {
            min-width: 0;
          }
        </style>
        <header part="header">
          <slot></slot>
        </header>
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'header');
    }
  }

  if (!customElements.get('wc-sidebar-header')) {
    customElements.define('wc-sidebar-header', WcSidebarHeader);
  }

  class WcSidebarFooter extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            margin-top: var(--sidebar-footer-margin, auto);
            position: sticky;
            bottom: 0;
          }

          footer {
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-footer-gap, 0.5rem);
            padding: var(--sidebar-footer-padding, 0.75rem 0 0 0);
            border-top: var(--sidebar-footer-border, none);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) footer {
            display: none;
          }
        </style>
        <footer part="footer">
          <slot></slot>
        </footer>
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'footer');
    }
  }

  if (!customElements.get('wc-sidebar-footer')) {
    customElements.define('wc-sidebar-footer', WcSidebarFooter);
  }

  class WcSidebarContent extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-content-gap, 1rem);
          }

          .content {
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-content-gap, 1rem);
          }
        </style>
        <div part="content" class="content">
          <slot></slot>
        </div>
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'content');
    }
  }

  if (!customElements.get('wc-sidebar-content')) {
    customElements.define('wc-sidebar-content', WcSidebarContent);
  }

  class WcSidebarGroup extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #header;
    /** @type {HTMLSlotElement} */
    #labelSlot;
    /** @type {HTMLSlotElement} */
    #actionSlot;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            border-radius: var(--sidebar-group-radius, 0.75rem);
            background: var(--sidebar-group-background, transparent);
            padding: var(--sidebar-group-padding, 0.25rem 0.35rem);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) {
            background: var(--sidebar-group-background-collapsed, transparent);
            padding: var(--sidebar-group-padding-collapsed, 0.25rem 0);
          }

          .group {
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-group-gap, 0.5rem);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .group {
            align-items: center;
            gap: var(--sidebar-group-gap-collapsed, 0.35rem);
          }

          .group-header {
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            font-size: var(--sidebar-group-label-size, 0.75rem);
            font-weight: var(--sidebar-group-label-weight, 600);
            text-transform: var(--sidebar-group-label-transform, uppercase);
            letter-spacing: 0.05em;
            color: var(--sidebar-group-label-color, color-mix(in srgb, currentColor 65%, transparent));
          }

          :host([data-has-header="true"]) .group-header {
            display: flex;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .group-header {
            display: none;
          }

          .group-content {
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-group-content-gap, 0.35rem);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .group-content {
            align-items: center;
            gap: var(--sidebar-group-content-gap-collapsed, 0.35rem);
          }
        </style>
        <section part="group" class="group">
          <div part="group-header" class="group-header">
            <slot name="label"></slot>
            <slot name="action"></slot>
          </div>
          <div part="group-content" class="group-content">
            <slot></slot>
          </div>
        </section>
      `;
      this.#header = /** @type {HTMLDivElement} */ (this.#root.querySelector('.group-header'));
      this.#labelSlot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot[name="label"]'));
      this.#actionSlot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot[name="action"]'));
    }

    connectedCallback() {
      const updateHeader = () => {
        const hasLabel = this.#labelSlot.assignedElements({ flatten: true }).length > 0;
        const hasAction = this.#actionSlot.assignedElements({ flatten: true }).length > 0;
        this.dataset.hasHeader = hasLabel || hasAction ? 'true' : 'false';
      };
      this.#labelSlot.addEventListener('slotchange', updateHeader);
      this.#actionSlot.addEventListener('slotchange', updateHeader);
      updateHeader();
    }
  }

  if (!customElements.get('wc-sidebar-group')) {
    customElements.define('wc-sidebar-group', WcSidebarGroup);
  }

  class WcSidebarGroupLabel extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) {
            display: none;
          }

          span {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: var(--sidebar-group-label-padding, 0.25rem 0);
          }
        </style>
        <span part="group-label">
          <slot></slot>
        </span>
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'label');
    }
  }

  if (!customElements.get('wc-sidebar-group-label')) {
    customElements.define('wc-sidebar-group-label', WcSidebarGroupLabel);
  }

  class WcSidebarGroupAction extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #button;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          button {
            border: none;
            background: transparent;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            padding: var(--sidebar-group-action-padding, 0.25rem 0.35rem);
            border-radius: var(--sidebar-group-action-radius, 0.5rem);
            color: var(--sidebar-group-action-color, currentColor);
            cursor: pointer;
            transition: background var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) button {
            display: none;
          }

          button:hover {
            background: var(--sidebar-group-action-background-hover, rgba(15, 23, 42, 0.08));
          }

          button:focus-visible {
            outline: 2px solid var(--sidebar-group-action-ring, var(--wc-sidebar-ring));
            outline-offset: 2px;
          }

          ::slotted(*) {
            pointer-events: none;
          }
        </style>
        <button type="button" part="group-action">
          <slot></slot>
        </button>
      `;
      this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'action');
      if (this.hasAttribute('title')) {
        this.#button.title = this.getAttribute('title') ?? '';
      }
    }

  }

  if (!customElements.get('wc-sidebar-group-action')) {
    customElements.define('wc-sidebar-group-action', WcSidebarGroupAction);
  }

  class WcSidebarGroupContent extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-group-content-gap, 0.35rem);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) {
            align-items: center;
          }

          .content {
            display: flex;
            flex-direction: column;
            gap: inherit;
          }
        </style>
        <div part="group-content" class="content">
          <slot></slot>
        </div>
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', '');
    }
  }

  if (!customElements.get('wc-sidebar-group-content')) {
    customElements.define('wc-sidebar-group-content', WcSidebarGroupContent);
  }

  class WcSidebarMenu extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-menu-gap, 0.25rem);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) ul {
            align-items: center;
            gap: var(--sidebar-menu-gap-collapsed, 0.5rem);
          }
        </style>
        <ul part="menu" role="list">
          <slot></slot>
        </ul>
      `;
    }
  }

  if (!customElements.get('wc-sidebar-menu')) {
    customElements.define('wc-sidebar-menu', WcSidebarMenu);
  }

  class WcSidebarMenuItem extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          li {
            display: flex;
            align-items: stretch;
            gap: 0.25rem;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) li {
            justify-content: center;
            gap: 0;
          }
        </style>
        <li part="menu-item" role="listitem">
          <slot></slot>
        </li>
      `;
    }
  }

  if (!customElements.get('wc-sidebar-menu-item')) {
    customElements.define('wc-sidebar-menu-item', WcSidebarMenuItem);
  }

  class WcSidebarMenuButton extends HTMLElement {
    static get observedAttributes() {
      return ['href', 'active', 'target', 'rel'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #button;
    /** @type {HTMLAnchorElement} */
    #link;
    /** @type {HTMLElement} */
    #control;
    /** @type {HTMLSpanElement | null} */
    #buttonLabel = null;
    /** @type {HTMLSpanElement | null} */
    #linkLabel = null;
    /** @type {HTMLSlotElement} */
    #slotEl;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          .control {
            all: unset;
            display: flex;
            align-items: center;
            gap: var(--sidebar-menu-button-gap, 0.65rem);
            width: 100%;
            border-radius: var(--sidebar-menu-button-radius, 0.65rem);
            padding: var(--sidebar-menu-button-padding, 0.5rem 0.65rem);
            color: inherit;
            cursor: pointer;
            transition: background var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing),
              color var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
            text-decoration: none;
            line-height: 1.45;
          }

          .control:hover,
          .control:focus-visible {
            background: var(--sidebar-menu-button-background-hover, rgba(15, 23, 42, 0.08));
          }

          .control:focus-visible {
            outline: 2px solid var(--sidebar-menu-button-ring, var(--wc-sidebar-ring));
            outline-offset: 2px;
          }

          :host([data-active="true"]) .control {
            background: var(--sidebar-menu-button-background-active, rgba(79, 70, 229, 0.15));
            color: var(--sidebar-menu-button-color-active, inherit);
          }

          .label {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1 1 auto;
            min-width: 0;
          }

          .label ::slotted(*) {
            white-space: nowrap;
          }

          .label ::slotted(svg) {
            width: 1.1rem;
            height: 1.1rem;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .control {
            padding: var(--sidebar-menu-button-padding-collapsed, 0.5rem);
            justify-content: center;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .label {
            justify-content: center;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .label ::slotted(span:not([data-sidebar-icon])) {
            display: none;
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .label ::slotted(strong),
          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .label ::slotted(em),
          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) .label ::slotted(small) {
            display: none;
          }
        </style>
        <button type="button" class="control" part="menu-button">
          <span class="label" part="menu-button-label"></span>
        </button>
        <a class="control" part="menu-button" hidden>
          <span class="label" part="menu-button-label"></span>
        </a>
      `;
      this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
      this.#link = /** @type {HTMLAnchorElement} */ (this.#root.querySelector('a'));
      this.#control = this.#button;
      const buttonLabel = /** @type {HTMLSpanElement} */ (this.#button.querySelector('.label'));
      const linkLabel = /** @type {HTMLSpanElement} */ (this.#link.querySelector('.label'));
      this.#buttonLabel = buttonLabel;
      this.#linkLabel = linkLabel;
      this.#slotEl = document.createElement('slot');
      this.#slotEl.classList.add('content-slot');
      buttonLabel.append(this.#slotEl);
    }

    connectedCallback() {
      this.#syncControl();
      this.#syncActive();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'href' || name === 'target' || name === 'rel') {
        this.#syncControl();
      }
      if (name === 'active') {
        this.#syncActive();
      }
    }

    #syncControl() {
      const href = this.getAttribute('href');
      if (href) {
        this.#link.hidden = false;
        this.#button.hidden = true;
        this.#link.href = href;
        if (this.hasAttribute('target')) this.#link.target = this.getAttribute('target') ?? '';
        if (this.hasAttribute('rel')) this.#link.rel = this.getAttribute('rel') ?? '';
        this.#control = this.#link;
        this.#linkLabel?.append(this.#slotEl);
      } else {
        this.#link.hidden = true;
        this.#button.hidden = false;
        this.#control = this.#button;
        this.#buttonLabel?.append(this.#slotEl);
      }
    }

    #syncActive() {
      const isActive = parseBooleanAttribute(this.getAttribute('active'));
      this.dataset.active = isActive ? 'true' : 'false';
      if (isActive) {
        this.#control.setAttribute('aria-current', 'page');
      } else {
        this.#control.removeAttribute('aria-current');
      }
    }
  }

  if (!customElements.get('wc-sidebar-menu-button')) {
    customElements.define('wc-sidebar-menu-button', WcSidebarMenuButton);
  }

  class WcSidebarMenuAction extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #button;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          button {
            border: none;
            background: transparent;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            padding: var(--sidebar-menu-action-padding, 0.35rem);
            border-radius: var(--sidebar-menu-action-radius, 0.5rem);
            color: var(--sidebar-menu-action-color, color-mix(in srgb, currentColor 85%, transparent));
            cursor: pointer;
            transition: background var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) button {
            display: none;
          }

          button:hover,
          button:focus-visible {
            background: var(--sidebar-menu-action-background-hover, rgba(15, 23, 42, 0.12));
            color: var(--sidebar-menu-action-color-hover, currentColor);
          }

          button:focus-visible {
            outline: 2px solid var(--sidebar-menu-action-ring, var(--wc-sidebar-ring));
            outline-offset: 2px;
          }
        </style>
        <button type="button" part="menu-action">
          <slot></slot>
        </button>
      `;
      this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
    }

  }

  if (!customElements.get('wc-sidebar-menu-action')) {
    customElements.define('wc-sidebar-menu-action', WcSidebarMenuAction);
  }

  class WcSidebarMenuBadge extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 1.5rem;
            padding: 0.125rem 0.5rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            background: var(--sidebar-menu-badge-background, rgba(79, 70, 229, 0.15));
            color: var(--sidebar-menu-badge-color, inherit);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) span {
            display: none;
          }
        </style>
        <span part="menu-badge">
          <slot></slot>
        </span>
      `;
    }
  }

  if (!customElements.get('wc-sidebar-menu-badge')) {
    customElements.define('wc-sidebar-menu-badge', WcSidebarMenuBadge);
  }

  class WcSidebarMenuSub extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          ul {
            list-style: none;
            margin: var(--sidebar-menu-sub-margin, 0.25rem 0 0 0.75rem);
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: var(--sidebar-menu-sub-gap, 0.25rem);
          }

          :host-context(wc-sidebar[collapsible="icon"][data-collapsible-state="collapsed"]) ul {
            display: none;
          }
        </style>
        <ul part="menu-sub" role="list">
          <slot></slot>
        </ul>
      `;
    }
  }

  if (!customElements.get('wc-sidebar-menu-sub')) {
    customElements.define('wc-sidebar-menu-sub', WcSidebarMenuSub);
  }

  class WcSidebarMenuSubItem extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          li {
            display: flex;
            align-items: stretch;
            gap: 0.25rem;
          }
        </style>
        <li part="menu-sub-item" role="listitem">
          <slot></slot>
        </li>
      `;
    }
  }

  if (!customElements.get('wc-sidebar-menu-sub-item')) {
    customElements.define('wc-sidebar-menu-sub-item', WcSidebarMenuSubItem);
  }

  class WcSidebarMenuSubButton extends HTMLElement {
    static get observedAttributes() {
      return ['href', 'active'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLAnchorElement} */
    #link;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          a {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: var(--sidebar-menu-sub-button-padding, 0.35rem 0.5rem);
            border-radius: var(--sidebar-menu-sub-button-radius, 0.5rem);
            color: inherit;
            text-decoration: none;
            transition: background var(--wc-sidebar-transition-duration) var(--wc-sidebar-transition-easing);
          }

          a:hover,
          a:focus-visible {
            background: var(--sidebar-menu-sub-button-background-hover, rgba(15, 23, 42, 0.08));
          }

          a:focus-visible {
            outline: 2px solid var(--sidebar-menu-sub-button-ring, var(--wc-sidebar-ring));
            outline-offset: 2px;
          }

          :host([data-active="true"]) a {
            background: var(--sidebar-menu-sub-button-background-active, rgba(79, 70, 229, 0.15));
          }
        </style>
        <a part="menu-sub-button" href="#">
          <slot></slot>
        </a>
      `;
      this.#link = /** @type {HTMLAnchorElement} */ (this.#root.querySelector('a'));
    }

    connectedCallback() {
      this.#syncHref();
      this.#syncActive();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'href') this.#syncHref();
      if (name === 'active') this.#syncActive();
    }

    #syncHref() {
      const href = this.getAttribute('href') || '#';
      this.#link.href = href;
    }

    #syncActive() {
      const isActive = parseBooleanAttribute(this.getAttribute('active'));
      this.dataset.active = isActive ? 'true' : 'false';
      if (isActive) {
        this.#link.setAttribute('aria-current', 'page');
      } else {
        this.#link.removeAttribute('aria-current');
      }
    }
  }

  if (!customElements.get('wc-sidebar-menu-sub-button')) {
    customElements.define('wc-sidebar-menu-sub-button', WcSidebarMenuSubButton);
  }

  class WcSidebarMenuSkeleton extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          .skeleton {
            display: inline-flex;
            align-items: center;
            gap: 0.65rem;
            width: 100%;
            border-radius: var(--sidebar-menu-button-radius, 0.65rem);
            padding: var(--sidebar-menu-button-padding, 0.5rem 0.65rem);
            background: color-mix(in srgb, currentColor 6%, transparent);
            overflow: hidden;
          }

          .shimmer {
            flex: 1 1 auto;
            height: 0.85rem;
            border-radius: 999px;
            background: linear-gradient(
              90deg,
              color-mix(in srgb, currentColor 6%, transparent) 0%,
              color-mix(in srgb, currentColor 16%, transparent) 50%,
              color-mix(in srgb, currentColor 6%, transparent) 100%
            );
            animation: shimmer 1.4s infinite;
          }

          .icon {
            width: 1.1rem;
            height: 1.1rem;
            border-radius: 999px;
            background: color-mix(in srgb, currentColor 8%, transparent);
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        </style>
        <div part="menu-skeleton" class="skeleton">
          <span class="icon" part="menu-skeleton-icon" hidden></span>
          <span class="shimmer" part="menu-skeleton-line"></span>
        </div>
      `;
    }

    connectedCallback() {
      const showIcon = this.hasAttribute('show-icon');
      const icon = /** @type {HTMLSpanElement | null} */ (this.#root.querySelector('.icon'));
      if (icon) icon.hidden = !showIcon;
    }
  }

  if (!customElements.get('wc-sidebar-menu-skeleton')) {
    customElements.define('wc-sidebar-menu-skeleton', WcSidebarMenuSkeleton);
  }

  class WcSidebarSeparator extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          hr {
            border: none;
            border-bottom: 1px solid var(--sidebar-separator-color, color-mix(in srgb, currentColor 12%, transparent));
            margin: var(--sidebar-separator-margin, 0.75rem 0);
          }
        </style>
        <hr part="separator" role="separator" />
      `;
    }

    connectedCallback() {
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'content');
    }
  }

  if (!customElements.get('wc-sidebar-separator')) {
    customElements.define('wc-sidebar-separator', WcSidebarSeparator);
  }

  class WcSidebarRail extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement | null} */
    #provider = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          button {
            all: unset;
            position: absolute;
            inset-block: 0;
            inset-inline-end: -0.75rem;
            width: 0.75rem;
            cursor: pointer;
            opacity: 0;
            transition: opacity 180ms ease;
            background: var(--sidebar-rail-background, transparent);
          }

          button:hover,
          button:focus-visible {
            opacity: 1;
            background: var(--sidebar-rail-background-hover, rgba(15, 23, 42, 0.15));
          }

          button:focus-visible {
            outline: 2px solid var(--sidebar-rail-ring, var(--wc-sidebar-ring));
            outline-offset: 2px;
          }
        </style>
        <button type="button" part="rail" aria-hidden="true"></button>
      `;
    }

    connectedCallback() {
      const button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
      button.addEventListener('click', this.#onClick);
      if (!this.hasAttribute('slot')) this.setAttribute('slot', 'rail');
      this.#provider = findSidebarProvider(this);
    }

    disconnectedCallback() {
      const button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
      button.removeEventListener('click', this.#onClick);
      this.#provider = null;
    }

    #onClick = (event) => {
      event.preventDefault();
      this.#provider?.toggle();
    };
  }

  if (!customElements.get('wc-sidebar-rail')) {
    customElements.define('wc-sidebar-rail', WcSidebarRail);
  }
})();

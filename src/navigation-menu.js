/**
 * @file navigation-menu.js
 * @version 1.0.0
 *
 * Accessible navigation menu component inspired by the Radix UI Navigation Menu
 * example. Renders an animated trigger list, active item indicator, and a
 * flexible viewport that hosts contextual content panels.
 *
 * Usage:
 * <wc-navigation-menu></wc-navigation-menu>
 *
 * Styling hooks:
 * - CSS custom properties: `--navigation-menu-font-family`,
 *   `--navigation-menu-foreground`, `--navigation-menu-surface`,
 *   `--navigation-menu-surface-shadow`, `--navigation-menu-radius`,
 *   `--navigation-menu-trigger-radius`, `--navigation-menu-trigger-color`,
 *   `--navigation-menu-trigger-hover`, `--navigation-menu-trigger-active`,
 *   `--navigation-menu-trigger-focus`, `--navigation-menu-icon-color`,
 *   `--navigation-menu-viewport-surface`, `--navigation-menu-viewport-shadow`,
 *   `--navigation-menu-viewport-radius`,
 *   `--navigation-menu-indicator-color`.
 * - Parts: `::part(root)`, `::part(surface)`, `::part(list)`, `::part(trigger)`,
 *   `::part(link)`, `::part(indicator)`, `::part(viewport)`,
 *   `::part(content)`.
 */

(() => {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        display: block;
        position: relative;
        font-family: var(
          --navigation-menu-font-family,
          'Inter',
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif
        );
        color: var(--navigation-menu-foreground, #312e81);
      }

      :host([hidden]) {
        display: none;
      }

      .menu-root {
        display: grid;
        justify-items: center;
        gap: 0.5rem;
      }

      nav {
        position: relative;
        z-index: 2;
      }

      .surface {
        position: relative;
        display: inline-flex;
        align-items: center;
        border-radius: var(--navigation-menu-radius, 0.75rem);
        padding: 0.25rem;
        background: var(--navigation-menu-surface, #ffffff);
        box-shadow: var(
          --navigation-menu-surface-shadow,
          0 2px 10px rgba(15, 23, 42, 0.18)
        );
      }

      ul {
        list-style: none;
        display: inline-flex;
        gap: 0.25rem;
        margin: 0;
        padding: 0;
      }

      li {
        position: relative;
      }

      button.trigger,
      a.link {
        appearance: none;
        border: none;
        border-radius: var(--navigation-menu-trigger-radius, 0.5rem);
        padding: 0.5rem 0.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        font: inherit;
        font-weight: 600;
        font-size: 0.9375rem;
        line-height: 1;
        background: transparent;
        color: var(--navigation-menu-trigger-color, #4338ca);
        cursor: pointer;
        text-decoration: none;
        transition: background 180ms ease, color 180ms ease;
      }

      button.trigger:hover,
      button.trigger[data-state="open"],
      a.link:hover {
        background: var(--navigation-menu-trigger-hover, rgba(79, 70, 229, 0.12));
        color: var(--navigation-menu-trigger-active, #312e81);
      }

      button.trigger:focus-visible,
      a.link:focus-visible {
        outline: none;
        box-shadow: var(
          --navigation-menu-trigger-focus,
          0 0 0 2px rgba(129, 140, 248, 0.45)
        );
      }

      button.trigger svg {
        width: 14px;
        height: 14px;
        color: var(--navigation-menu-icon-color, currentColor);
        transition: transform 200ms ease;
      }

      button.trigger[data-state="open"] svg {
        transform: rotate(-180deg);
      }

      .indicator {
        position: absolute;
        inset-inline-start: 0;
        top: calc(100% - 0.25rem);
        display: flex;
        justify-content: center;
        align-items: flex-end;
        width: var(--indicator-width, 0px);
        pointer-events: none;
        transform: translateX(var(--indicator-offset, 0px));
        transition: transform 250ms ease, width 250ms ease;
        opacity: 0;
      }

      .indicator[data-state="visible"] {
        opacity: 1;
      }

      .indicator-shape {
        position: relative;
        top: 70%;
        width: 10px;
        height: 10px;
        transform: rotate(45deg);
        border-radius: 2px 0 0 0;
        background: var(--navigation-menu-indicator-color, #ffffff);
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
      }

      .viewport-container {
        width: 100%;
        display: flex;
        justify-content: center;
        perspective: 2000px;
      }

      .viewport {
        margin-top: 0.75rem;
        width: var(--navigation-menu-viewport-width, 0px);
        height: var(--navigation-menu-viewport-height, 0px);
        border-radius: var(--navigation-menu-viewport-radius, 0.75rem);
        background: var(--navigation-menu-viewport-surface, #ffffff);
        box-shadow: var(
          --navigation-menu-viewport-shadow,
          0 20px 60px -30px rgba(15, 23, 42, 0.35)
        );
        overflow: hidden;
        transform-origin: top center;
        transition:
          width 300ms ease,
          height 300ms ease,
          transform 200ms ease,
          opacity 200ms ease;
        opacity: 0;
        pointer-events: none;
      }

      .viewport[data-state="open"] {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }

      .viewport[data-state="closed"] {
        transform: scale(0.96);
      }

      .viewport-inner {
        position: relative;
        min-width: 100%;
        min-height: 100%;
      }

      .content {
        display: block;
        padding: 1.375rem;
        color: inherit;
      }

      .content[data-state="open"][data-motion="from-start"],
      .content[data-state="open"][data-motion="from-end"] {
        animation-duration: 250ms;
        animation-timing-function: ease;
      }

      .content[data-motion="from-start"] {
        animation-name: enterFromLeft;
      }

      .content[data-motion="from-end"] {
        animation-name: enterFromRight;
      }

      .content[data-motion="to-start"],
      .content[data-motion="to-end"] {
        position: absolute;
        inset: 0;
        animation-duration: 250ms;
        animation-timing-function: ease;
      }

      .content[data-motion="to-start"] {
        animation-name: exitToLeft;
      }

      .content[data-motion="to-end"] {
        animation-name: exitToRight;
      }

      .learn-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: minmax(0, 0.75fr) minmax(0, 1fr);
      }

      .learn-grid > li,
      .overview-grid > li {
        list-style: none;
      }

      .callout-card {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        min-height: 220px;
        gap: 0.75rem;
        padding: 1.5rem;
        border-radius: 0.75rem;
        text-decoration: none;
        color: #ffffff;
        background: linear-gradient(180deg, #7c3aed 0%, #4338ca 100%);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      }

      .callout-card svg {
        width: 38px;
        height: 38px;
      }

      .callout-card p {
        margin: 0;
        color: rgba(250, 250, 250, 0.82);
        font-size: 0.9375rem;
      }

      .callout-title {
        font-size: 1.125rem;
        font-weight: 600;
      }

      .list-links {
        display: grid;
        gap: 0.5rem;
      }

      .list-link {
        display: block;
        padding: 0.75rem;
        border-radius: 0.75rem;
        text-decoration: none;
        background: transparent;
        color: var(--navigation-menu-foreground, #312e81);
        transition: background 180ms ease, color 180ms ease;
      }

      .list-link:hover,
      .list-link:focus-visible {
        background: rgba(99, 102, 241, 0.12);
        outline: none;
      }

      .list-link h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 600;
      }

      .list-link p {
        margin: 0;
        color: #6b7280;
        line-height: 1.45;
        font-size: 0.9375rem;
      }

      .overview-grid {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      @media (max-width: 640px) {
        .learn-grid {
          grid-template-columns: minmax(0, 1fr);
        }

        .overview-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      @keyframes enterFromLeft {
        from {
          opacity: 0;
          transform: translateX(-32px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes enterFromRight {
        from {
          opacity: 0;
          transform: translateX(32px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes exitToLeft {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-32px);
        }
      }

      @keyframes exitToRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(32px);
        }
      }
    </style>
    <div class="menu-root">
      <nav aria-label="Main navigation" part="root">
        <div class="surface" part="surface">
          <ul class="menu-list" part="list">
            <li>
              <button
                id="trigger-learn"
                class="trigger"
                part="trigger"
                type="button"
                data-menu="learn"
                aria-expanded="false"
                aria-controls="panel-learn"
              >
                <span>Learn</span>
                <svg viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path
                    d="M3.13523 5.15803C3.32409 4.94934 3.64051 4.94934 3.82937 5.15803L7.5 9.17338L11.1706 5.15803C11.3595 4.94934 11.6759 4.94934 11.8648 5.15803C12.0536 5.36672 12.0536 5.70878 11.8648 5.91748L7.84709 10.3419C7.65823 10.5506 7.3418 10.5506 7.15294 10.3419L3.13523 5.91748C2.94637 5.70878 2.94637 5.36672 3.13523 5.15803Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </li>
            <li>
              <button
                id="trigger-overview"
                class="trigger"
                part="trigger"
                type="button"
                data-menu="overview"
                aria-expanded="false"
                aria-controls="panel-overview"
              >
                <span>Overview</span>
                <svg viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path
                    d="M3.13523 5.15803C3.32409 4.94934 3.64051 4.94934 3.82937 5.15803L7.5 9.17338L11.1706 5.15803C11.3595 4.94934 11.6759 4.94934 11.8648 5.15803C12.0536 5.36672 12.0536 5.70878 11.8648 5.91748L7.84709 10.3419C7.65823 10.5506 7.3418 10.5506 7.15294 10.3419L3.13523 5.91748C2.94637 5.70878 2.94637 5.36672 3.13523 5.15803Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </li>
            <li>
              <a
                class="link"
                part="link"
                data-menu-link
                href="https://github.com/radix-ui"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
          <div class="indicator" part="indicator" data-state="hidden" aria-hidden="true">
            <div class="indicator-shape"></div>
          </div>
        </div>
      </nav>
      <div class="viewport-container">
        <div class="viewport" part="viewport" data-state="closed" aria-hidden="true">
          <div class="viewport-inner"></div>
        </div>
      </div>
      <div class="content-store" hidden aria-hidden="true">
        <div class="content" part="content" data-menu="learn" id="panel-learn" role="region" aria-label="Learn">
          <ul class="learn-grid">
            <li>
              <a class="callout-card" href="/">
                <svg viewBox="0 0 25 25" fill="currentColor" aria-hidden="true">
                  <path d="M12 25C7.58173 25 4 21.4183 4 17C4 12.5817 7.58173 9 12 9V25Z"></path>
                  <path d="M12 0H4V8H12V0Z"></path>
                  <path d="M17 8C19.2091 8 21 6.20914 21 4C21 1.79086 19.2091 0 17 0C14.7909 0 13 1.79086 13 4C13 6.20914 14.7909 8 17 8Z"></path>
                </svg>
                <div class="callout-title">Radix Primitives</div>
                <p>Unstyled, accessible components for React.</p>
              </a>
            </li>
            <li class="list-links">
              <a class="list-link" href="https://stitches.dev/">
                <h3>Stitches</h3>
                <p>CSS-in-JS with best-in-class developer experience.</p>
              </a>
              <a class="list-link" href="/colors">
                <h3>Colors</h3>
                <p>Beautiful, thought-out palettes with auto dark mode.</p>
              </a>
              <a class="list-link" href="https://icons.radix-ui.com/">
                <h3>Icons</h3>
                <p>A crisp set of 15x15 icons, balanced and consistent.</p>
              </a>
            </li>
          </ul>
        </div>
        <div class="content" part="content" data-menu="overview" id="panel-overview" role="region" aria-label="Overview">
          <ul class="overview-grid">
            <li>
              <a class="list-link" href="/primitives/docs/overview/introduction">
                <h3>Introduction</h3>
                <p>Build high-quality, accessible design systems and web apps.</p>
              </a>
            </li>
            <li>
              <a class="list-link" href="/primitives/docs/overview/getting-started">
                <h3>Getting started</h3>
                <p>A quick tutorial to get you up and running with Radix Primitives.</p>
              </a>
            </li>
            <li>
              <a class="list-link" href="/primitives/docs/guides/styling">
                <h3>Styling</h3>
                <p>Unstyled and compatible with any styling solution.</p>
              </a>
            </li>
            <li>
              <a class="list-link" href="/primitives/docs/guides/animation">
                <h3>Animation</h3>
                <p>Use CSS keyframes or any animation library of your choice.</p>
              </a>
            </li>
            <li>
              <a class="list-link" href="/primitives/docs/overview/accessibility">
                <h3>Accessibility</h3>
                <p>Tested in a range of browsers and assistive technologies.</p>
              </a>
            </li>
            <li>
              <a class="list-link" href="/primitives/docs/overview/releases">
                <h3>Releases</h3>
                <p>Radix Primitives releases and their changelogs.</p>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;

  /**
   * Returns true if the provided node is within the component's composed tree.
   * @param {HTMLElement} host
   * @param {EventTarget | null} target
   * @returns {boolean}
   */
  const isEventInside = (host, target) => {
    if (!(target instanceof Node)) {
      return false;
    }
    if (host === target) {
      return true;
    }
    if (host.contains(target)) {
      return true;
    }
    if (host.shadowRoot && host.shadowRoot.contains(target)) {
      return true;
    }
    return false;
  };

  /**
   * Finds the first focusable element within a root node.
   * @param {ParentNode} root
   * @returns {HTMLElement | null}
   */
  const findFirstFocusable = (root) => {
    return /** @type {HTMLElement | null} */ (
      root.querySelector(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  };

  class NavigationMenuElement extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLUListElement} */
    #list;
    /** @type {HTMLElement} */
    #surface;
    /** @type {HTMLElement} */
    #indicator;
    /** @type {HTMLElement} */
    #viewport;
    /** @type {HTMLElement} */
    #viewportInner;
    /** @type {HTMLElement} */
    #contentStore;
    /** @type {Map<string, HTMLElement>} */
    #contentMap;
    /** @type {string | null} */
    #openMenu = null;
    /** @type {ResizeObserver | null} */
    #resizeObserver = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.appendChild(template.content.cloneNode(true));
      this.#surface = /** @type {HTMLElement} */ (
        this.#root.querySelector('.surface')
      );
      this.#list = /** @type {HTMLUListElement} */ (
        this.#root.querySelector('.menu-list')
      );
      this.#indicator = /** @type {HTMLElement} */ (
        this.#root.querySelector('.indicator')
      );
      this.#viewport = /** @type {HTMLElement} */ (
        this.#root.querySelector('.viewport')
      );
      this.#viewportInner = /** @type {HTMLElement} */ (
        this.#root.querySelector('.viewport-inner')
      );
      this.#contentStore = /** @type {HTMLElement} */ (
        this.#root.querySelector('.content-store')
      );
      this.#contentMap = new Map();

      this.#root
        .querySelectorAll('.content[data-menu]')
        .forEach((content) => {
          const key = content.getAttribute('data-menu');
          if (key) {
            this.#contentMap.set(key, /** @type {HTMLElement} */ (content));
            content.setAttribute('hidden', '');
          }
        });
    }

    connectedCallback() {
      this.#list.addEventListener('click', this.#handleClick);
      this.#list.addEventListener('keydown', this.#handleKeydown);
      this.#list.addEventListener('focusin', this.#handleFocusIn);
      this.#root.addEventListener('keydown', this.#handleEscape, true);
      this.#root.addEventListener('focusout', this.#handleFocusOut);
      document.addEventListener('pointerdown', this.#handleOutsidePointer);

      if ('ResizeObserver' in window) {
        this.#resizeObserver = new ResizeObserver(() => {
          if (this.#openMenu) {
            this.#syncIndicator();
            this.#syncViewportSize();
          }
        });
        this.#resizeObserver.observe(this);
      }
    }

    disconnectedCallback() {
      this.#list.removeEventListener('click', this.#handleClick);
      this.#list.removeEventListener('keydown', this.#handleKeydown);
      this.#list.removeEventListener('focusin', this.#handleFocusIn);
      this.#root.removeEventListener('keydown', this.#handleEscape, true);
      this.#root.removeEventListener('focusout', this.#handleFocusOut);
      document.removeEventListener('pointerdown', this.#handleOutsidePointer);
      if (this.#resizeObserver) {
        this.#resizeObserver.disconnect();
        this.#resizeObserver = null;
      }
    }

    /** @param {MouseEvent} event */
    #handleClick = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const trigger = target.closest('button[data-menu]');
      if (trigger instanceof HTMLButtonElement) {
        const key = trigger.getAttribute('data-menu');
        if (!key) {
          return;
        }
        if (this.#openMenu === key) {
          this.#closeMenu();
        } else {
          this.#openMenuPanel(key, { focusContent: false });
        }
      }
    };

    /** @param {KeyboardEvent} event */
    #handleKeydown = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const items = this.#getFocusableItems();
      const currentIndex = items.indexOf(target);
      if (currentIndex === -1) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + items.length) % items.length;
        const nextItem = items[nextIndex];
        nextItem.focus();
        if (this.#openMenu && nextItem instanceof HTMLButtonElement) {
          const key = nextItem.getAttribute('data-menu');
          if (key) {
            this.#openMenuPanel(key, { focusContent: false, fromKeyboard: true });
          }
        } else if (!(nextItem instanceof HTMLButtonElement)) {
          this.#closeMenu();
        }
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
        if (this.#openMenu && items[0] instanceof HTMLButtonElement) {
          const key = items[0].getAttribute('data-menu');
          if (key) {
            this.#openMenuPanel(key, { focusContent: false, fromKeyboard: true });
          }
        }
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        items[items.length - 1]?.focus();
        this.#closeMenu();
        return;
      }

      if (target instanceof HTMLButtonElement) {
        const key = target.getAttribute('data-menu');
        if (!key) {
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.#openMenuPanel(key, { focusContent: true });
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (this.#openMenu === key) {
            this.#closeMenu();
          } else {
            this.#openMenuPanel(key, { focusContent: true });
          }
        }
      }
    };

    /** @param {FocusEvent} event */
    #handleFocusIn = (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.hasAttribute('data-menu-link')) {
        this.#closeMenu();
      }
    };

    /** @param {KeyboardEvent} event */
    #handleEscape = (event) => {
      if (event.key === 'Escape' && this.#openMenu) {
        const trigger = this.#getTrigger(this.#openMenu);
        this.#closeMenu();
        trigger?.focus();
        event.stopPropagation();
        event.preventDefault();
      }
    };

    /** @param {FocusEvent} event */
    #handleFocusOut = (event) => {
      const related = event.relatedTarget;
      if (isEventInside(this, related)) {
        return;
      }
      this.#closeMenu();
    };

    /** @param {PointerEvent} event */
    #handleOutsidePointer = (event) => {
      if (!isEventInside(this, event.target)) {
        this.#closeMenu();
      }
    };

    /**
     * @returns {HTMLElement[]}
     */
    #getFocusableItems() {
      return Array.from(
        this.#list.querySelectorAll('button.trigger, a.link')
      );
    }

    /**
     * @param {string} key
     * @returns {HTMLButtonElement | null}
     */
    #getTrigger(key) {
      return /** @type {HTMLButtonElement | null} */ (
        this.#list.querySelector(`button.trigger[data-menu="${key}"]`)
      );
    }

    #closeMenu() {
      if (!this.#openMenu) {
        this.#indicator.dataset.state = 'hidden';
        this.#indicator.setAttribute('aria-hidden', 'true');
        return;
      }

      const currentContent = this.#contentMap.get(this.#openMenu);
      const trigger = this.#getTrigger(this.#openMenu);
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.dataset.state = 'closed';
      }
      if (currentContent) {
        currentContent.dataset.state = 'closed';
        currentContent.dataset.motion = '';
        currentContent.setAttribute('hidden', '');
        if (currentContent.parentElement !== this.#contentStore) {
          this.#contentStore.appendChild(currentContent);
        }
      }
      this.#openMenu = null;
      this.#viewport.dataset.state = 'closed';
      this.#viewport.setAttribute('aria-hidden', 'true');
      this.#viewport.style.setProperty('--navigation-menu-viewport-width', '0px');
      this.#viewport.style.setProperty('--navigation-menu-viewport-height', '0px');
      this.#indicator.dataset.state = 'hidden';
      this.#indicator.setAttribute('aria-hidden', 'true');
    }

    /**
     * Opens the requested menu panel and optionally focuses its first focusable element.
     * @param {string} key
     * @param {{ focusContent?: boolean; fromKeyboard?: boolean }} [options]
     */
    #openMenuPanel(key, options = {}) {
      const { focusContent = false } = options;
      const content = this.#contentMap.get(key);
      const trigger = this.#getTrigger(key);
      if (!content || !trigger) {
        return;
      }

      const previousKey = this.#openMenu;
      const previousContent = previousKey ? this.#contentMap.get(previousKey) : null;
      const previousTrigger = previousKey ? this.#getTrigger(previousKey) : null;
      const triggers = this.#getFocusableItems().filter(
        (item) => item instanceof HTMLButtonElement
      );
      const previousIndex = previousTrigger
        ? triggers.indexOf(previousTrigger)
        : -1;
      const nextIndex = triggers.indexOf(trigger);

      if (previousTrigger && previousTrigger !== trigger) {
        previousTrigger.setAttribute('aria-expanded', 'false');
        previousTrigger.dataset.state = 'closed';
      }

      if (previousContent && previousContent !== content) {
        previousContent.dataset.state = 'closed';
        previousContent.dataset.motion =
          nextIndex > previousIndex ? 'to-start' : 'to-end';
        previousContent.removeAttribute('hidden');
        this.#viewportInner.appendChild(previousContent);
        previousContent.addEventListener(
          'animationend',
          () => {
            previousContent.setAttribute('hidden', '');
            previousContent.dataset.motion = '';
            if (previousContent.parentElement !== this.#contentStore) {
              this.#contentStore.appendChild(previousContent);
            }
          },
          { once: true }
        );
      }

      this.#openMenu = key;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.dataset.state = 'open';

      content.dataset.state = 'open';
      content.dataset.motion =
        previousKey && previousKey !== key
          ? nextIndex > previousIndex
            ? 'from-end'
            : 'from-start'
          : 'from-start';
      content.removeAttribute('hidden');
      this.#viewportInner.appendChild(content);

      this.#viewport.dataset.state = 'open';
      this.#viewport.removeAttribute('aria-hidden');
      this.#syncViewportSize();
      this.#syncIndicator();

      if (focusContent) {
        const focusable = findFirstFocusable(content);
        focusable?.focus();
      }
    }

    #syncViewportSize() {
      if (!this.#openMenu) {
        return;
      }
      const content = this.#contentMap.get(this.#openMenu);
      if (!content) {
        return;
      }
      const width = content.scrollWidth;
      const height = content.scrollHeight;
      this.#viewport.style.setProperty(
        '--navigation-menu-viewport-width',
        `${width}px`
      );
      this.#viewport.style.setProperty(
        '--navigation-menu-viewport-height',
        `${height}px`
      );
    }

    #syncIndicator() {
      if (!this.#openMenu) {
        return;
      }
      const trigger = this.#getTrigger(this.#openMenu);
      if (!trigger) {
        return;
      }
      const triggerRect = trigger.getBoundingClientRect();
      const surfaceRect = this.#surface.getBoundingClientRect();
      const width = triggerRect.width;
      const offset = triggerRect.left - surfaceRect.left;
      this.#indicator.style.setProperty('--indicator-width', `${width}px`);
      this.#indicator.style.setProperty('--indicator-offset', `${offset}px`);
      this.#indicator.dataset.state = 'visible';
      this.#indicator.removeAttribute('aria-hidden');
    }
  }

  if (!customElements.get('wc-navigation-menu')) {
    customElements.define('wc-navigation-menu', NavigationMenuElement);
  }
})();

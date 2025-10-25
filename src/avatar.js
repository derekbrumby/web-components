/**
 * @file avatar.js
 * @version 1.0.0
 *
 * Accessible avatar web component with image loading control and customizable fallback content.
 * The element mirrors the Radix UI Avatar anatomy while remaining dependency free.
 *
 * Usage:
 * <wc-avatar src="https://..." alt="Ada Lovelace" initials="AL"></wc-avatar>
 */

(() => {
  /**
   * Upgrades properties that might have been set before the element definition was registered.
   *
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
   * Normalizes a string into user-friendly initials (first letters of up to two words).
   *
   * @param {string | null} value
   * @returns {string}
   */
  const extractInitials = (value) => {
    if (!value) {
      return '';
    }
    const words = value
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) {
      return '';
    }
    const [first, second] = words;
    const primary = first ? first[0] : '';
    const secondary = second ? second[0] : '';
    return `${primary}${secondary}`.toUpperCase();
  };

  /**
   * Filters slot assigned nodes down to visible text content.
   *
   * @param {HTMLSlotElement | null} slot
   * @returns {string}
   */
  const assignedSlotText = (slot) => {
    if (!slot) {
      return '';
    }
    const nodes = slot.assignedNodes({ flatten: true });
    let text = '';
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        text += /** @type {HTMLElement} */ (node).textContent?.trim() ?? '';
      } else if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent?.trim() ?? '';
      }
    }
    return text.trim();
  };

  /**
   * @typedef {"empty" | "loading" | "loaded" | "error"} AvatarState
   */

  class WcAvatar extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'alt', 'initials', 'fallback-delay', 'loading', 'size'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLImageElement} */
    #image;
    /** @type {HTMLDivElement} */
    #fallback;
    /** @type {HTMLSpanElement} */
    #fallbackText;
    /** @type {HTMLSlotElement} */
    #fallbackSlot;
    /** @type {AvatarState} */
    #state = 'empty';
    /** @type {number} */
    #fallbackDelay = 0;
    /** @type {boolean} */
    #fallbackReady = true;
    /** @type {number | null} */
    #fallbackTimer = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --avatar-size: 45px;
            --avatar-radius: 9999px;
            --avatar-background: rgba(15, 23, 42, 0.05);
            --avatar-border: none;
            --avatar-transition: opacity 160ms ease;
            --avatar-fallback-background: #ffffff;
            --avatar-fallback-color: #4c1d95;
            --avatar-fallback-font-size: 15px;
            --avatar-fallback-font-weight: 600;
            display: inline-flex;
            inline-size: var(--avatar-size);
            block-size: var(--avatar-size);
            border-radius: var(--avatar-radius);
            background: var(--avatar-background);
            border: var(--avatar-border);
            overflow: hidden;
            vertical-align: middle;
          }

          :host([data-state="loading"]) {
            opacity: var(--avatar-loading-opacity, 0.88);
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="root"] {
            position: relative;
            inline-size: 100%;
            block-size: 100%;
            border-radius: inherit;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: inherit;
            color: inherit;
          }

          [part="image"] {
            inline-size: 100%;
            block-size: 100%;
            object-fit: cover;
            border-radius: inherit;
            display: block;
          }

          [part="fallback"] {
            position: absolute;
            inset: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: var(--avatar-fallback-font-size);
            font-weight: var(--avatar-fallback-font-weight);
            line-height: 1;
            background: var(--avatar-fallback-background);
            color: var(--avatar-fallback-color);
            border-radius: inherit;
            padding: 0.25rem;
            transition: var(--avatar-transition);
          }

          [part="fallback"][hidden] {
            display: none;
          }

          [part="fallback-text"][data-hidden] {
            display: none;
          }
        </style>
        <div part="root">
          <img part="image" decoding="async" />
          <div part="fallback" hidden aria-hidden="true">
            <slot></slot>
            <span part="fallback-text"></span>
          </div>
        </div>
      `;

      this.#image = /** @type {HTMLImageElement} */ (this.#root.querySelector('[part="image"]'));
      this.#fallback = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="fallback"]'));
      this.#fallbackText = /** @type {HTMLSpanElement} */ (this.#root.querySelector('[part="fallback-text"]'));
      this.#fallbackSlot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));

      this.#image.addEventListener('load', () => {
        if (this.#image.src) {
          this.#setState('loaded');
        }
      });

      this.#image.addEventListener('error', () => {
        if (this.#image.src) {
          this.#setState('error');
        }
      });

      this.#fallbackSlot.addEventListener('slotchange', () => {
        this.#updateFallbackLabel();
        this.#updateAccessibility();
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'src');
      upgradeProperty(this, 'alt');
      upgradeProperty(this, 'initials');
      upgradeProperty(this, 'fallbackDelay');
      upgradeProperty(this, 'loading');

      this.#applyAlt(this.getAttribute('alt'));
      this.#applyLoading(this.getAttribute('loading'));
      this.#applySize(this.getAttribute('size'));
      this.#applyFallbackDelay(this.getAttribute('fallback-delay'));
      this.#applySrc(this.getAttribute('src'));
      this.#updateFallbackLabel();
      this.#syncVisibility();
    }

    disconnectedCallback() {
      if (this.#fallbackTimer != null) {
        window.clearTimeout(this.#fallbackTimer);
        this.#fallbackTimer = null;
      }
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'src':
          this.#applySrc(newValue);
          break;
        case 'alt':
          this.#applyAlt(newValue);
          break;
        case 'initials':
          this.#updateFallbackLabel();
          this.#updateAccessibility();
          break;
        case 'fallback-delay':
          this.#applyFallbackDelay(newValue);
          break;
        case 'loading':
          this.#applyLoading(newValue);
          break;
        case 'size':
          this.#applySize(newValue);
          break;
        default:
          break;
      }
    }

    /**
     * Image source URL.
     *
     * @returns {string}
     */
    get src() {
      return this.getAttribute('src') ?? '';
    }

    set src(value) {
      if (value == null || value === '') {
        this.removeAttribute('src');
      } else {
        this.setAttribute('src', value);
      }
    }

    /**
     * Accessible description for the avatar image or fallback.
     *
     * @returns {string}
     */
    get alt() {
      return this.getAttribute('alt') ?? '';
    }

    set alt(value) {
      if (value == null) {
        this.removeAttribute('alt');
      } else {
        this.setAttribute('alt', value);
      }
    }

    /**
     * Default fallback text when no slotted content is provided.
     *
     * @returns {string}
     */
    get initials() {
      return this.getAttribute('initials') ?? '';
    }

    set initials(value) {
      if (value == null || value === '') {
        this.removeAttribute('initials');
      } else {
        this.setAttribute('initials', value);
      }
    }

    /**
     * Delay (ms) before showing the fallback while the image is loading.
     *
     * @returns {number}
     */
    get fallbackDelay() {
      return this.#fallbackDelay;
    }

    set fallbackDelay(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        this.removeAttribute('fallback-delay');
      } else {
        this.setAttribute('fallback-delay', String(Math.round(numeric)));
      }
    }

    /**
     * Native image loading hint (`lazy`, `eager`, or `auto`).
     *
     * @returns {"lazy" | "eager" | "auto"}
     */
    get loading() {
      const value = this.getAttribute('loading');
      if (value === 'lazy' || value === 'eager') {
        return value;
      }
      return 'auto';
    }

    set loading(value) {
      if (value === 'lazy' || value === 'eager') {
        this.setAttribute('loading', value);
      } else if (value === 'auto' || value == null) {
        this.removeAttribute('loading');
      }
    }

    /**
     * Current loading state of the avatar.
     *
     * @returns {AvatarState}
     */
    get state() {
      return this.#state;
    }

    /**
     * Applies a new image source and triggers loading state transitions.
     *
     * @param {string | null} value
     */
    #applySrc(value) {
      if (!value) {
        this.#image.removeAttribute('src');
        this.#setState('empty');
        return;
      }

      this.#setState('loading');
      this.#image.src = value;
      if (this.#image.complete && this.#image.naturalWidth > 0) {
        this.#setState('loaded');
      }
    }

    /**
     * Syncs the native `alt` attribute and refreshes accessibility helpers.
     *
     * @param {string | null} value
     */
    #applyAlt(value) {
      this.#image.alt = value ?? '';
      this.#updateFallbackLabel();
      this.#updateAccessibility();
    }

    /**
     * Parses and stores the fallback delay value.
     *
     * @param {string | null} value
     */
    #applyFallbackDelay(value) {
      if (value == null || value.trim() === '') {
        this.#fallbackDelay = 0;
        return;
      }
      const numeric = Number.parseInt(value, 10);
      this.#fallbackDelay = Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
      if (this.#state === 'loading') {
        this.#scheduleFallbackReveal();
      }
    }

    /**
     * Applies the requested native image loading strategy.
     *
     * @param {string | null} value
     */
    #applyLoading(value) {
      if (value === 'lazy' || value === 'eager') {
        this.#image.loading = value;
      } else {
        this.#image.loading = 'auto';
      }
    }

    /**
     * Applies the optional size attribute by updating the CSS custom property.
     *
     * @param {string | null} value
     */
    #applySize(value) {
      if (value == null || value.trim() === '') {
        this.style.removeProperty('--avatar-size');
      } else {
        this.style.setProperty('--avatar-size', value.trim());
      }
    }

    /**
     * Updates fallback text visibility depending on slot content or provided initials.
     */
    #updateFallbackLabel() {
      const slotText = assignedSlotText(this.#fallbackSlot);
      if (slotText) {
        this.#fallbackText.textContent = '';
        this.#fallbackText.setAttribute('data-hidden', '');
      } else {
        const initials = this.initials || extractInitials(this.#image.alt || this.getAttribute('alt'));
        if (initials) {
          this.#fallbackText.textContent = initials;
          this.#fallbackText.removeAttribute('data-hidden');
        } else {
          this.#fallbackText.textContent = '';
          this.#fallbackText.setAttribute('data-hidden', '');
        }
      }
    }

    /**
     * Updates ARIA attributes to keep the component accessible.
     */
    #updateAccessibility() {
      const showFallback = this.#state !== 'loaded' && (this.#state !== 'loading' || this.#fallbackReady);
      const alt = this.getAttribute('alt');
      if (showFallback) {
        const labelSource = alt && alt.trim() !== '' ? alt : this.#computeFallbackLabel();
        if (labelSource && labelSource.trim() !== '') {
          this.setAttribute('role', 'img');
          this.setAttribute('aria-label', labelSource.trim());
          this.removeAttribute('aria-hidden');
        } else {
          this.removeAttribute('role');
          this.removeAttribute('aria-label');
          this.setAttribute('aria-hidden', 'true');
        }
      } else {
        this.removeAttribute('role');
        if (alt === '') {
          this.setAttribute('aria-hidden', 'true');
          this.removeAttribute('aria-label');
        } else {
          this.removeAttribute('aria-hidden');
          this.removeAttribute('aria-label');
        }
      }
    }

    /**
     * Derives the text label for fallback mode.
     *
     * @returns {string}
     */
    #computeFallbackLabel() {
      const slotText = assignedSlotText(this.#fallbackSlot);
      if (slotText) {
        return slotText;
      }
      if (this.initials) {
        return this.initials;
      }
      const alt = this.getAttribute('alt');
      if (alt && alt.trim() !== '') {
        return extractInitials(alt);
      }
      return '';
    }

    /**
     * Changes the internal loading state and handles fallback visibility.
     *
     * @param {AvatarState} next
     */
    #setState(next) {
      if (this.#state === next) {
        return;
      }
      this.#state = next;
      this.setAttribute('data-state', next);
      if (next === 'loading') {
        this.#fallbackReady = this.#fallbackDelay === 0;
        this.#scheduleFallbackReveal();
      } else {
        this.#fallbackReady = next !== 'loaded';
        if (this.#fallbackTimer != null) {
          window.clearTimeout(this.#fallbackTimer);
          this.#fallbackTimer = null;
        }
      }
      this.#syncVisibility();
    }

    /**
     * Ensures the fallback reveal timer reflects the current delay.
     */
    #scheduleFallbackReveal() {
      if (this.#fallbackTimer != null) {
        window.clearTimeout(this.#fallbackTimer);
        this.#fallbackTimer = null;
      }
      if (this.#fallbackDelay > 0) {
        this.#fallbackTimer = window.setTimeout(() => {
          this.#fallbackTimer = null;
          if (this.#state === 'loading') {
            this.#fallbackReady = true;
            this.#syncVisibility();
          }
        }, this.#fallbackDelay);
      }
    }

    /**
     * Toggles image/fallback visibility to match the current state.
     */
    #syncVisibility() {
      const showFallback = this.#state !== 'loaded' && (this.#state !== 'loading' || this.#fallbackReady);
      this.#fallback.hidden = !showFallback;
      this.#fallback.setAttribute('aria-hidden', 'true');
      this.#image.toggleAttribute('hidden', showFallback);
      if (showFallback) {
        this.#image.setAttribute('aria-hidden', 'true');
      } else {
        this.#image.removeAttribute('aria-hidden');
      }
      this.#updateAccessibility();
    }
  }

  if (!customElements.get('wc-avatar')) {
    customElements.define('wc-avatar', WcAvatar);
  }
})();

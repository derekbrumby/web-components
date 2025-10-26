/**
 * @file chat.js
 * @version 1.0.0
 *
 * Chat message component inspired by daisyUI chat bubbles. Each instance
 * represents a single line in a conversation with optional avatar, header,
 * footer, alignment, and color variants.
 *
 * Usage:
 * ```html
 * <wc-chat-message align="end" variant="primary">
 *   <img slot="avatar" src="/avatar.png" alt="You" />
 *   <span slot="header">You <time>12:45</time></span>
 *   I have the high ground.
 *   <span slot="footer">Delivered</span>
 * </wc-chat-message>
 * ```
 */

(() => {
  /**
   * Upgrades a property that might have been set before the element was
   * defined to ensure the setter/getter pair are invoked.
   *
   * @template {keyof HTMLElement} K
   * @param {HTMLElement} element
   * @param {K} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * Tests whether a slot currently has visible content.
   *
   * @param {HTMLSlotElement | null} slot
   * @returns {boolean}
   */
  const slotHasContent = (slot) => {
    if (!slot) {
      return false;
    }
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {HTMLElement} */ (node);
        if (element.tagName === 'TEMPLATE') {
          if (element.innerHTML.trim().length > 0) {
            return true;
          }
          continue;
        }
        if (element.slot === 'header' || element.slot === 'footer' || element.slot === 'avatar') {
          return true;
        }
        if ((element.textContent?.trim() ?? '').length > 0) {
          return true;
        }
        if (element.childNodes.length > 0) {
          return true;
        }
        if (
          element instanceof HTMLImageElement ||
          element instanceof HTMLVideoElement ||
          element instanceof HTMLCanvasElement ||
          element instanceof SVGElement
        ) {
          return true;
        }
      }
      if (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() ?? '').length > 0) {
        return true;
      }
    }
    return false;
  };

  const VARIANTS = new Set([
    'neutral',
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ]);

  class WcChatMessage extends HTMLElement {
    static get observedAttributes() {
      return ['align', 'variant'];
    }

    /** @type {HTMLDivElement} */
    #avatarWrapper;
    /** @type {HTMLDivElement} */
    #headerWrapper;
    /** @type {HTMLDivElement} */
    #footerWrapper;
    /** @type {HTMLSlotElement} */
    #avatarSlot;
    /** @type {HTMLSlotElement} */
    #headerSlot;
    /** @type {HTMLSlotElement} */
    #footerSlot;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host {
            --wc-chat-gap: 0.75rem;
            --wc-chat-avatar-size: 2.5rem;
            --wc-chat-bubble-radius: 1.25rem;
            --wc-chat-bubble-padding-inline: 1rem;
            --wc-chat-bubble-padding-block: 0.65rem;
            --wc-chat-bubble-background: rgba(15, 23, 42, 0.12);
            --wc-chat-bubble-color: #0f172a;
            --wc-chat-bubble-shadow: none;
            --wc-chat-meta-color: rgba(15, 23, 42, 0.6);
            --wc-chat-meta-font-size: 0.75rem;
            --wc-chat-bubble-max-width: 28rem;
            --wc-chat-font-family: inherit;
            display: block;
            font-family: var(--wc-chat-font-family);
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="root"] {
            display: inline-flex;
            align-items: flex-end;
            gap: var(--wc-chat-gap);
            max-inline-size: var(--wc-chat-max-width, 36rem);
          }

          :host([align="end"]) [part="root"] {
            flex-direction: row-reverse;
          }

          [part="avatar"] {
            inline-size: var(--wc-chat-avatar-size);
            block-size: var(--wc-chat-avatar-size);
            border-radius: 9999px;
            overflow: hidden;
            flex: 0 0 auto;
          }

          [part="avatar"][hidden] {
            display: none;
          }

          [part="body"] {
            display: grid;
            gap: var(--wc-chat-body-gap, 0.4rem);
            justify-items: start;
            text-align: left;
          }

          :host([align="end"]) [part="body"] {
            justify-items: end;
            text-align: right;
          }

          [part="header"],
          [part="footer"] {
            font-size: var(--wc-chat-meta-font-size);
            color: var(--wc-chat-meta-color);
            line-height: 1.3;
            letter-spacing: var(--wc-chat-meta-letter-spacing, 0.01em);
            display: inline-flex;
            gap: 0.35rem;
            align-items: baseline;
          }

          :host([align="end"]) [part="header"],
          :host([align="end"]) [part="footer"] {
            justify-content: flex-end;
          }

          [part="header"][hidden],
          [part="footer"][hidden] {
            display: none;
          }

          [part="bubble"] {
            background: var(--wc-chat-bubble-background);
            color: var(--wc-chat-bubble-color);
            padding-inline: var(--wc-chat-bubble-padding-inline);
            padding-block: var(--wc-chat-bubble-padding-block);
            border-radius: var(--wc-chat-bubble-radius);
            box-shadow: var(--wc-chat-bubble-shadow);
            max-inline-size: min(100%, var(--wc-chat-bubble-max-width));
            line-height: 1.55;
            font-size: var(--wc-chat-bubble-font-size, 0.95rem);
            display: inline-flex;
            flex-wrap: wrap;
            gap: var(--wc-chat-bubble-content-gap, 0.25rem);
            word-break: break-word;
            white-space: pre-wrap;
          }

          :host([align="end"]) [part="bubble"] {
            border-end-end-radius: var(--wc-chat-bubble-tail-radius, 0.25rem);
            border-end-start-radius: var(--wc-chat-bubble-radius);
            border-start-start-radius: var(--wc-chat-bubble-radius);
            border-start-end-radius: var(--wc-chat-bubble-radius);
          }

          :host(:not([align="end"])) [part="bubble"] {
            border-end-start-radius: var(--wc-chat-bubble-tail-radius, 0.25rem);
            border-end-end-radius: var(--wc-chat-bubble-radius);
            border-start-start-radius: var(--wc-chat-bubble-radius);
            border-start-end-radius: var(--wc-chat-bubble-radius);
          }

          :host([variant="primary"]) {
            --wc-chat-bubble-background: rgba(59, 130, 246, 0.2);
            --wc-chat-bubble-color: #1d4ed8;
          }

          :host([variant="secondary"]) {
            --wc-chat-bubble-background: rgba(129, 140, 248, 0.2);
            --wc-chat-bubble-color: #4338ca;
          }

          :host([variant="accent"]) {
            --wc-chat-bubble-background: rgba(236, 72, 153, 0.18);
            --wc-chat-bubble-color: #be185d;
          }

          :host([variant="info"]) {
            --wc-chat-bubble-background: rgba(14, 165, 233, 0.18);
            --wc-chat-bubble-color: #0369a1;
          }

          :host([variant="success"]) {
            --wc-chat-bubble-background: rgba(34, 197, 94, 0.18);
            --wc-chat-bubble-color: #047857;
          }

          :host([variant="warning"]) {
            --wc-chat-bubble-background: rgba(251, 191, 36, 0.24);
            --wc-chat-bubble-color: #92400e;
          }

          :host([variant="error"]) {
            --wc-chat-bubble-background: rgba(248, 113, 113, 0.2);
            --wc-chat-bubble-color: #b91c1c;
          }
        </style>
        <div part="root">
          <div part="avatar" hidden>
            <slot name="avatar"></slot>
          </div>
          <div part="body">
            <div part="header" hidden>
              <slot name="header"></slot>
            </div>
            <div part="bubble">
              <slot></slot>
            </div>
            <div part="footer" hidden>
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      `;

      this.#avatarWrapper = /** @type {HTMLDivElement} */ (root.querySelector('[part="avatar"]'));
      this.#headerWrapper = /** @type {HTMLDivElement} */ (root.querySelector('[part="header"]'));
      this.#footerWrapper = /** @type {HTMLDivElement} */ (root.querySelector('[part="footer"]'));
      this.#avatarSlot = /** @type {HTMLSlotElement} */ (root.querySelector('slot[name="avatar"]'));
      this.#headerSlot = /** @type {HTMLSlotElement} */ (root.querySelector('slot[name="header"]'));
      this.#footerSlot = /** @type {HTMLSlotElement} */ (root.querySelector('slot[name="footer"]'));

      this.#avatarSlot?.addEventListener('slotchange', () => {
        this.#avatarWrapper.hidden = !slotHasContent(this.#avatarSlot);
      });
      this.#headerSlot?.addEventListener('slotchange', () => {
        this.#headerWrapper.hidden = !slotHasContent(this.#headerSlot);
      });
      this.#footerSlot?.addEventListener('slotchange', () => {
        this.#footerWrapper.hidden = !slotHasContent(this.#footerSlot);
      });
    }

    connectedCallback() {
      upgradeProperty(this, 'align');
      upgradeProperty(this, 'variant');

      if (!this.hasAttribute('align')) {
        this.align = 'start';
      } else {
        this.align = this.align;
      }

      if (!this.hasAttribute('variant')) {
        this.variant = 'neutral';
      } else {
        this.variant = this.variant;
      }

      this.#avatarWrapper.hidden = !slotHasContent(this.#avatarSlot);
      this.#headerWrapper.hidden = !slotHasContent(this.#headerSlot);
      this.#footerWrapper.hidden = !slotHasContent(this.#footerSlot);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'align') {
        const normalized = newValue === 'end' ? 'end' : 'start';
        if (newValue !== normalized) {
          this.setAttribute('align', normalized);
        }
      }
      if (name === 'variant') {
        const normalized = newValue && VARIANTS.has(newValue) ? newValue : 'neutral';
        if (newValue !== normalized) {
          this.setAttribute('variant', normalized);
        }
      }
    }

    /**
     * Controls whether the chat bubble renders on the left (`start`) or right (`end`).
     *
     * @returns {'start' | 'end'}
     */
    get align() {
      return this.getAttribute('align') === 'end' ? 'end' : 'start';
    }

    /**
     * @param {'start' | 'end'} value
     */
    set align(value) {
      if (value === 'end') {
        this.setAttribute('align', 'end');
      } else {
        this.setAttribute('align', 'start');
      }
    }

    /**
     * The color variant applied to the chat bubble.
     *
     * @returns {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'}
     */
    get variant() {
      const value = this.getAttribute('variant');
      if (value && VARIANTS.has(value)) {
        return /** @type {any} */ (value);
      }
      return 'neutral';
    }

    /**
     * @param {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'} value
     */
    set variant(value) {
      if (!VARIANTS.has(value)) {
        this.setAttribute('variant', 'neutral');
        return;
      }
      this.setAttribute('variant', value);
    }
  }

  if (!customElements.get('wc-chat-message')) {
    customElements.define('wc-chat-message', WcChatMessage);
  }
})();

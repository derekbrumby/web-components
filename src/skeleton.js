/**
 * @file skeleton.js
 * @version 1.0.0
 *
 * Shimmering skeleton placeholder component used to communicate loading states
 * before content renders. The element mirrors the feel of skeleton primitives
 * found in design systems such as Radix UI while remaining dependency free and
 * customisable via CSS custom properties and the exposed `::part(base)` hook.
 *
 * Usage:
 * <wc-skeleton style="--wc-skeleton-width: 12rem;"></wc-skeleton>
 */

(() => {
  if (customElements.get('wc-skeleton')) {
    return;
  }

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        --wc-skeleton-width: 100%;
        --wc-skeleton-height: 1rem;
        --wc-skeleton-radius: 0.75rem;
        --wc-skeleton-base-color: rgba(148, 163, 184, 0.28);
        --wc-skeleton-highlight-color: rgba(148, 163, 184, 0.45);
        --wc-skeleton-animation-duration: 1.4s;
        display: inline-block;
        width: var(--wc-skeleton-width);
        height: var(--wc-skeleton-height);
        position: relative;
        overflow: hidden;
        border-radius: var(--wc-skeleton-radius);
        background-color: var(--wc-skeleton-base-color);
        color: transparent;
      }

      :host([hidden]) {
        display: none !important;
      }

      [part="base"] {
        position: absolute;
        inset: 0;
        display: block;
        background-image: linear-gradient(
          90deg,
          var(--wc-skeleton-base-color) 25%,
          var(--wc-skeleton-highlight-color) 40%,
          var(--wc-skeleton-base-color) 65%
        );
        background-size: 200% 100%;
        animation: wc-skeleton-shimmer var(--wc-skeleton-animation-duration) ease-in-out infinite;
      }

      :host([still]) [part="base"],
      [part="base"].is-still {
        animation: none;
        background-position: 100% 0;
      }

      :host([rounded="full"]) {
        --wc-skeleton-radius: 9999px;
      }

      @keyframes wc-skeleton-shimmer {
        0% {
          background-position: 180% 0;
        }
        100% {
          background-position: -20% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        [part="base"] {
          animation-duration: calc(var(--wc-skeleton-animation-duration) * 1.6);
        }
      }
    </style>
    <span part="base" aria-hidden="true"></span>
  `;

  /**
   * Visual loading placeholder with shimmer animation.
   */
  class WcSkeleton extends HTMLElement {
    static get observedAttributes() {
      return ['still'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSpanElement | null} */
    #base;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.appendChild(template.content.cloneNode(true));
      this.#base = this.#root.querySelector('[part="base"]');

      if (!this.hasAttribute('aria-hidden')) {
        this.setAttribute('aria-hidden', 'true');
      }

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'presentation');
      }
    }

    connectedCallback() {
      this.#syncAnimation();
    }

    attributeChangedCallback(name) {
      if (name === 'still') {
        this.#syncAnimation();
      }
    }

    #syncAnimation() {
      if (!this.#base) {
        return;
      }

      const shouldPause = this.hasAttribute('still');
      this.#base.classList.toggle('is-still', shouldPause);
    }
  }

  customElements.define('wc-skeleton', WcSkeleton);
})();

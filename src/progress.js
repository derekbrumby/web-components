/**
 * @file progress.js
 * @version 1.0.0
 *
 * Accessible progress indicator inspired by Radix UI. The component renders a
 * themable track and indicator while exposing rich ARIA semantics. It supports
 * determinate and indeterminate states, custom labelling, and smooth CSS-based
 * transitions without external dependencies.
 *
 * Example usage:
 * ```html
 * <wc-progress value="24" max="60" label="Upload progress"></wc-progress>
 * <script type="module" src="./progress.js"></script>
 * ```
 */

(() => {
  /**
   * Ensures that lazily defined properties are upgraded after element
   * construction so setters run once the prototype is in place.
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

  if (customElements.get('wc-progress')) {
    return;
  }

  class WcProgress extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'max', 'label', 'value-text'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #indicator;
    /** @type {boolean} */
    #appliedLabel = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: min(100%, var(--progress-width, 20rem));
            min-width: var(--progress-min-width, 8rem);
            --progress-height: 1rem;
            --progress-radius: 999px;
            --progress-background: rgba(15, 23, 42, 0.12);
            --progress-indicator-background: rgb(255 255 255);
            --progress-indicator-foreground: rgb(79 70 229);
            --progress-transition-duration: 660ms;
            --progress-transition-timing: cubic-bezier(0.65, 0, 0.35, 1);
            --progress-indeterminate-duration: 1.4s;
            --progress-indeterminate-easing: cubic-bezier(0.65, 0, 0.35, 1);
          }

          :host(:where([hidden])) {
            display: none !important;
          }

          [part="track"] {
            position: relative;
            overflow: hidden;
            height: var(--progress-height);
            border-radius: var(--progress-radius);
            background: var(--progress-background);
            color: inherit;
          }

          [part="indicator"] {
            position: absolute;
            inset: 0;
            background: var(--progress-indicator-foreground);
            color: inherit;
            transform: translateX(-100%);
            transition: transform var(--progress-transition-duration) var(--progress-transition-timing);
            will-change: transform;
          }

          :host([data-state="complete"]) [part="indicator"] {
            transition-duration: var(--progress-complete-duration, var(--progress-transition-duration));
          }

          :host([data-state="indeterminate"]) [part="indicator"] {
            background: var(--progress-indicator-background);
            color: inherit;
            animation: progress-indeterminate var(--progress-indeterminate-duration) var(--progress-indeterminate-easing) infinite;
          }

          :host([data-state="indeterminate"]) [part="indicator"].is-indeterminate {
            width: var(--progress-indeterminate-width, 45%);
          }

          @keyframes progress-indeterminate {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(-25%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [part="indicator"] {
              transition-duration: 0ms;
            }

            :host([data-state="indeterminate"]) [part="indicator"] {
              animation-duration: calc(var(--progress-indeterminate-duration) * 1.6);
            }
          }
        </style>
        <div part="track" aria-hidden="true">
          <div part="indicator" class="indicator"></div>
        </div>
        <slot name="label" part="label"></slot>
      `;

      const indicator = this.#root.querySelector('.indicator');
      if (!indicator) {
        throw new Error('wc-progress: indicator element missing');
      }
      this.#indicator = indicator;
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'max');
      upgradeProperty(this, 'label');
      upgradeProperty(this, 'valueText');

      this.setAttribute('role', 'progressbar');
      if (!this.hasAttribute('aria-valuemin')) {
        this.setAttribute('aria-valuemin', '0');
      }

      this.#render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      this.#render();
    }

    /**
     * Current progress value. Set to `null` for indeterminate state.
     * @type {number | null}
     */
    get value() {
      if (!this.hasAttribute('value')) return null;
      const parsed = Number(this.getAttribute('value'));
      return Number.isFinite(parsed) ? parsed : null;
    }

    set value(next) {
      if (next === null || next === undefined || next === '') {
        this.removeAttribute('value');
        return;
      }

      const parsed = Number(next);
      if (Number.isFinite(parsed)) {
        this.setAttribute('value', String(parsed));
      } else {
        this.removeAttribute('value');
      }
    }

    /**
     * Maximum value that represents 100% completion.
     * @type {number}
     */
    get max() {
      const attr = this.getAttribute('max');
      const parsed = Number(attr);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
    }

    set max(next) {
      const parsed = Number(next);
      if (Number.isFinite(parsed) && parsed > 0) {
        this.setAttribute('max', String(parsed));
      } else {
        this.removeAttribute('max');
      }
    }

    /**
     * Accessible label exposed through `aria-label`. Falls back to externally
     * provided labelling when omitted.
     * @type {string}
     */
    get label() {
      return this.getAttribute('label') ?? '';
    }

    set label(next) {
      if (next === null || next === undefined || next === '') {
        this.removeAttribute('label');
      } else {
        this.setAttribute('label', next);
      }
    }

    /**
     * Custom text describing the progress. When omitted, a percentage-based
     * string is generated.
     * @type {string}
     */
    get valueText() {
      return this.getAttribute('value-text') ?? '';
    }

    set valueText(next) {
      if (next === null || next === undefined || next === '') {
        this.removeAttribute('value-text');
      } else {
        this.setAttribute('value-text', next);
      }
    }

    #render() {
      const max = this.max;
      const hasValueAttr = this.hasAttribute('value');
      const rawValue = Number(this.getAttribute('value'));
      const isNumeric = Number.isFinite(rawValue);
      const value = hasValueAttr && isNumeric ? Math.min(Math.max(rawValue, 0), max) : null;
      const hasCustomValueText = this.hasAttribute('value-text');
      const customValueText = this.getAttribute('value-text') ?? '';

      if (this.hasAttribute('label')) {
        this.setAttribute('aria-label', this.getAttribute('label') ?? '');
        this.#appliedLabel = true;
      } else if (this.#appliedLabel) {
        this.removeAttribute('aria-label');
        this.#appliedLabel = false;
      }

      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(max));

      let state = 'indeterminate';
      this.removeAttribute('aria-valuenow');

      if (value !== null) {
        const ratio = max === 0 ? 1 : value / max;
        const percentage = Math.max(0, Math.min(100, ratio * 100));
        state = value >= max ? 'complete' : 'loading';
        this.setAttribute('aria-valuenow', String(value));

        const ariaValueText = hasCustomValueText
          ? customValueText
          : `${Math.round(percentage)}% complete`;
        if (ariaValueText) {
          this.setAttribute('aria-valuetext', ariaValueText);
        } else {
          this.removeAttribute('aria-valuetext');
        }

        this.#indicator.classList.remove('is-indeterminate');
        this.#indicator.style.transform = `translateX(-${100 - percentage}%)`;
        this.#indicator.style.setProperty('--progress-percent', `${percentage}%`);
        this.#indicator.style.setProperty('--progress-ratio', `${ratio}`);
        this.#indicator.dataset.value = String(value);
        this.#indicator.dataset.max = String(max);
        this.#indicator.dataset.state = state;
      } else {
        if (hasCustomValueText) {
          this.setAttribute('aria-valuetext', customValueText);
        } else {
          this.removeAttribute('aria-valuetext');
        }

        this.#indicator.classList.add('is-indeterminate');
        this.#indicator.style.transform = 'translateX(-100%)';
        this.#indicator.style.removeProperty('--progress-percent');
        this.#indicator.style.removeProperty('--progress-ratio');
        this.#indicator.removeAttribute('data-value');
        this.#indicator.dataset.max = String(max);
        this.#indicator.dataset.state = 'indeterminate';
      }

      if (value !== null) {
        this.setAttribute('data-value', String(value));
      } else {
        this.removeAttribute('data-value');
      }

      this.setAttribute('data-max', String(max));
      this.setAttribute('data-state', state);
    }
  }

  customElements.define('wc-progress', WcProgress);
})();

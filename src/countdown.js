/**
 * @file countdown.js
 * @version 1.0.0
 *
 * Animated numeric countdown inspired by daisyUI's countdown utility.
 * Updates the displayed digits via CSS transforms while exposing hooks
 * for accessibility and styling tweaks.
 *
 * Usage:
 * <wc-countdown value="42"></wc-countdown>
 */

(() => {
  if (customElements.get('wc-countdown')) {
    return;
  }

  /**
   * Ensure an upgraded property re-applies once the component is defined.
   *
   * @param {HTMLElement & Record<string, unknown>} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  /**
   * Clamp a numeric input to the supported countdown range.
   *
   * @param {unknown} value
   * @returns {number}
   */
  const normaliseValue = (value) => {
    const number = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
    if (!Number.isFinite(number)) {
      return 0;
    }

    const truncated = Math.trunc(number);
    return Math.min(999, Math.max(0, truncated));
  };

  /**
   * Convert an incoming digits hint to a nullable numeric value.
   *
   * @param {unknown} value
   * @returns {number | null}
   */
  const normaliseDigits = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const number = typeof value === 'number' ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(number)) {
      return null;
    }

    return Math.min(3, Math.max(1, Math.round(number)));
  };

  const DIGIT_SEQUENCE = Array.from({ length: 100 }, (_, index) => String(index).padStart(2, '0')).join('\\A ');

  class WcCountdown extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'digits', 'aria-label'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSpanElement} */
    #valueEl;
    /** @type {HTMLSpanElement} */
    #liveRegion;
    /** @type {number} */
    #value = 0;
    /** @type {number | null} */
    #digits = null;
    /** @type {boolean} */
    #isReflectingValue = false;
    /** @type {boolean} */
    #isReflectingDigits = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-countdown-transition-duration: 1s;
            --wc-countdown-transition-easing: cubic-bezier(1, 0, 0, 1);
            --wc-countdown-width-delay: 0.2s;
            --wc-countdown-width-duration: 0.4s;
            --wc-countdown-width-easing: ease-out;
            --wc-countdown-sequence: "${DIGIT_SEQUENCE}";
            display: inline-flex;
            line-height: 1;
            font-variant-numeric: tabular-nums;
            position: relative;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="value"] {
            --wc-countdown-first-digits: 0;
            --wc-countdown-ones: 0;
            --wc-countdown-show-tens: 0;
            --wc-countdown-show-hundreds: 0;
            display: inline-block;
            position: relative;
            overflow-y: hidden;
            overflow-x: visible;
            height: 1em;
            direction: ltr;
            visibility: hidden;
            color: transparent;
            transition:
              width var(--wc-countdown-width-duration) var(--wc-countdown-width-easing)
                var(--wc-countdown-width-delay);
            width: calc(
              1ch + var(--wc-countdown-show-tens, 0) * 1ch + var(--wc-countdown-show-hundreds, 0) * 1ch
            );
          }

          [part="value"]::before,
          [part="value"]::after {
            visibility: visible;
            position: absolute;
            inset-block-start: 0;
            overflow: hidden;
            display: block;
            content: var(--wc-countdown-sequence);
            font-variant-numeric: tabular-nums;
            white-space: pre;
            text-align: end;
            direction: rtl;
            color: inherit;
            transition:
              transform var(--wc-countdown-transition-duration) var(--wc-countdown-transition-easing),
              width 0.2s ease-out var(--wc-countdown-width-delay),
              opacity 0.2s ease-out var(--wc-countdown-width-delay);
          }

          [part="value"]::before {
            width: calc(1ch + var(--wc-countdown-show-hundreds, 0) * 1ch);
            inset-inline-end: 0;
            transform: translateY(calc(var(--wc-countdown-first-digits, 0) * -1em));
            opacity: var(--wc-countdown-show-tens, 0);
          }

          [part="value"]::after {
            width: 1ch;
            inset-inline-start: 0;
            transform: translateY(calc(var(--wc-countdown-ones, 0) * -1em));
          }

          [part="sr-label"] {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            clip-path: inset(50%);
            border: 0;
            white-space: nowrap;
          }
        </style>
        <span part="value" aria-hidden="true"></span>
        <span part="sr-label"></span>
      `;

      this.#valueEl = /** @type {HTMLSpanElement} */ (this.#root.querySelector('[part="value"]'));
      this.#liveRegion = /** @type {HTMLSpanElement} */ (this.#root.querySelector('[part="sr-label"]'));
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'digits');

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'timer');
      }

      if (!this.hasAttribute('aria-live')) {
        this.setAttribute('aria-live', 'polite');
      }

      if (!this.hasAttribute('aria-atomic')) {
        this.setAttribute('aria-atomic', 'true');
      }

      if (!this.hasAttribute('value')) {
        this.value = 0;
      } else {
        this.#setValueInternal(this.getAttribute('value'), false);
      }

      if (this.hasAttribute('digits')) {
        this.#digits = normaliseDigits(this.getAttribute('digits'));
      }

      this.#updateDisplay();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      switch (name) {
        case 'value': {
          if (this.#isReflectingValue) {
            return;
          }

          this.#setValueInternal(newValue, false);
          break;
        }
        case 'digits': {
          if (this.#isReflectingDigits) {
            return;
          }

          this.#digits = normaliseDigits(newValue);
          this.#updateDisplay();
          break;
        }
        case 'aria-label': {
          this.#syncLiveRegion();
          break;
        }
        default:
          break;
      }
    }

    /**
     * Current numeric value between 0 and 999.
     */
    get value() {
      return this.#value;
    }

    set value(newValue) {
      this.#setValueInternal(newValue, true);
    }

    /**
     * Hint for the minimum digits to render (1-3).
     */
    get digits() {
      return this.#digits ?? undefined;
    }

    set digits(newValue) {
      const nextDigits = normaliseDigits(newValue);

      if (nextDigits === null) {
        this.#digits = null;
        if (this.hasAttribute('digits')) {
          this.#isReflectingDigits = true;
          this.removeAttribute('digits');
          this.#isReflectingDigits = false;
        }
        this.#updateDisplay();
        return;
      }

      if (this.#digits === nextDigits) {
        if (!this.hasAttribute('digits')) {
          this.#isReflectingDigits = true;
          this.setAttribute('digits', String(nextDigits));
          this.#isReflectingDigits = false;
        }
        return;
      }

      this.#digits = nextDigits;
      this.#isReflectingDigits = true;
      this.setAttribute('digits', String(nextDigits));
      this.#isReflectingDigits = false;
      this.#updateDisplay();
    }

    /**
     * @param {unknown} input
     * @param {boolean} reflect
     */
    #setValueInternal(input, reflect) {
      const nextValue = normaliseValue(input);
      if (this.#value === nextValue) {
        if (reflect && !this.hasAttribute('value')) {
          this.#isReflectingValue = true;
          this.setAttribute('value', String(nextValue));
          this.#isReflectingValue = false;
        }
        this.#updateDisplay();
        return;
      }

      this.#value = nextValue;

      if (reflect) {
        this.#isReflectingValue = true;
        this.setAttribute('value', String(nextValue));
        this.#isReflectingValue = false;
      }

      this.#updateDisplay();
    }

    /**
     * Determine the active digit configuration, preferring CSS overrides.
     *
     * @returns {number}
     */
    #computeDigits() {
      const cssDigits = this.#readCssDigits();
      const fallback = this.#digits ?? 1;
      const result = cssDigits ?? fallback;
      return Math.min(3, Math.max(1, Math.round(result)));
    }

    /**
     * @returns {number | null}
     */
    #readCssDigits() {
      if (!this.isConnected) {
        return null;
      }

      const raw = getComputedStyle(this).getPropertyValue('--digits');
      if (!raw) {
        return null;
      }

      const parsed = Number.parseFloat(raw.trim());
      if (!Number.isFinite(parsed)) {
        return null;
      }

      return Math.min(3, Math.max(1, Math.round(parsed)));
    }

    #syncLiveRegion() {
      if (!this.#liveRegion) {
        return;
      }

      const labelText = this.getAttribute('aria-label');
      if (labelText !== null) {
        this.#liveRegion.textContent = labelText;
      } else {
        this.#liveRegion.textContent = String(this.#value);
      }
    }

    #updateDisplay() {
      if (!this.#valueEl) {
        return;
      }

      const digits = this.#computeDigits();
      const value = this.#value;
      const hundreds = Math.floor(value / 100);
      const tens = Math.floor((value % 100) / 10);
      const ones = value % 10;
      const firstDigits = Math.floor(value / 10);
      const showHundreds = digits >= 3 ? 1 : hundreds > 0 ? 1 : 0;
      const showTens = digits >= 2 ? 1 : tens + showHundreds > 0 ? 1 : 0;

      this.#valueEl.style.setProperty('--wc-countdown-first-digits', String(firstDigits));
      this.#valueEl.style.setProperty('--wc-countdown-ones', String(ones));
      this.#valueEl.style.setProperty('--wc-countdown-show-tens', String(showTens));
      this.#valueEl.style.setProperty('--wc-countdown-show-hundreds', String(showHundreds));
      this.#valueEl.style.setProperty('--value', String(value));
      this.#valueEl.style.setProperty('--digits', String(digits));
      this.#valueEl.textContent = String(value);

      this.#syncLiveRegion();
    }
  }

  customElements.define('wc-countdown', WcCountdown);
})();

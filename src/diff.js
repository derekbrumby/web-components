/**
 * @file diff.js
 * @version 1.0.0
 *
 * Accessible before/after comparison slider for any two pieces of content.
 * Users can drag the handle or use the keyboard to reveal more or less of the
 * first item, making it ideal for image diffing or copy comparisons.
 *
 * Usage:
 * <wc-diff value="45">
 *   <img slot="first" src="before.jpg" alt="Before" />
 *   <img slot="second" src="after.jpg" alt="After" />
 * </wc-diff>
 */

(() => {
  /**
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
   * Parse attribute strings into finite numbers with a fallback.
   *
   * @param {string | null} value
   * @param {number} fallback
   */
  const numberAttribute = (value, fallback) => {
    if (value === null || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  /**
   * Clamp `value` between `min` and `max`.
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * Snap a numeric value to the nearest multiple of `step` from `origin`.
   *
   * @param {number} value
   * @param {number} step
   * @param {number} origin
   */
  const snapToStep = (value, step, origin) => {
    if (!Number.isFinite(step) || step <= 0) {
      return value;
    }
    const offset = value - origin;
    const steps = Math.round(offset / step);
    const snapped = origin + steps * step;
    const precision = step.toString().split('.')[1]?.length ?? 0;
    return Number(snapped.toFixed(precision));
  };

  class WcDiff extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'min', 'max', 'step', 'disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #container;
    /** @type {HTMLElement} */
    #handle;
    /** @type {number} */
    #value = 50;
    /** @type {number} */
    #min = 0;
    /** @type {number} */
    #max = 100;
    /** @type {number} */
    #step = 1;
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #dragging = false;
    /** @type {number | null} */
    #pointerId = null;
    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {(event: PointerEvent) => void} */
    #boundOnPointerDown;
    /** @type {(event: PointerEvent) => void} */
    #boundOnPointerMove;
    /** @type {(event: PointerEvent) => void} */
    #boundOnPointerUp;
    /** @type {(event: PointerEvent) => void} */
    #boundOnPointerCancel;
    /** @type {(event: PointerEvent) => void} */
    #boundOnContainerPointerDown;
    /** @type {(event: KeyboardEvent) => void} */
    #boundOnKeyDown;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            box-sizing: border-box;
            contain: layout paint;
            --wc-diff-divider-position: 50%;
            --wc-diff-min-height: 18rem;
            --wc-diff-background: var(--wc-surface, transparent);
            --wc-diff-border-radius: 1rem;
            --wc-diff-border: none;
            --wc-diff-shadow: none;
            --wc-diff-divider-width: 2px;
            --wc-diff-divider-color: color-mix(in srgb, currentColor 65%, transparent);
            --wc-diff-handle-size: 1.75rem;
            --wc-diff-handle-color: color-mix(in srgb, currentColor 92%, transparent);
            --wc-diff-handle-shadow: 0 12px 32px -18px rgba(15, 23, 42, 0.45);
            --wc-diff-focus-ring: 2px solid color-mix(in srgb, currentColor 55%, transparent);
          }

          :host([data-disabled]) {
            opacity: var(--wc-diff-disabled-opacity, 0.45);
            pointer-events: none;
          }

          .container {
            position: relative;
            width: 100%;
            min-block-size: var(--wc-diff-min-height);
            border-radius: var(--wc-diff-border-radius);
            overflow: hidden;
            background: var(--wc-diff-background);
            border: var(--wc-diff-border);
            box-shadow: var(--wc-diff-shadow);
          }

          .item {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .item ::slotted(*) {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: var(--wc-diff-object-fit, cover);
          }

          .item--second {
            z-index: 1;
          }

          .item--first {
            z-index: 2;
            clip-path: inset(0 calc(100% - var(--wc-diff-divider-position, 50%)) 0 0);
          }

          .handle {
            position: absolute;
            inset: 0 auto;
            top: 0;
            bottom: 0;
            left: var(--wc-diff-divider-position, 50%);
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: none;
            background: none;
            cursor: ew-resize;
            touch-action: none;
            width: var(--wc-diff-handle-hit-area, max(var(--wc-diff-handle-size), 2.5rem));
            max-width: clamp(var(--wc-diff-handle-size), 5vw, 3.25rem);
            z-index: 3;
          }

          .handle::before {
            content: '';
            width: var(--wc-diff-divider-width);
            height: 100%;
            border-radius: 999px;
            background: var(--wc-diff-divider-color);
            box-shadow: var(--wc-diff-divider-shadow, none);
          }

          .handle::after {
            content: '';
            position: absolute;
            width: var(--wc-diff-handle-size);
            height: calc(var(--wc-diff-handle-size) * 0.6);
            border-radius: 999px;
            background: var(--wc-diff-handle-color);
            box-shadow: var(--wc-diff-handle-shadow);
            border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
          }

          .handle:focus-visible {
            outline: var(--wc-diff-focus-ring);
            outline-offset: 4px;
          }

          .handle[aria-disabled='true'] {
            cursor: default;
          }

          .item ::slotted(img),
          .item ::slotted(video) {
            object-fit: var(--wc-diff-object-fit, cover);
          }
        </style>
        <div part="container" class="container">
          <div part="second" class="item item--second">
            <slot name="second"></slot>
          </div>
          <div part="first" class="item item--first">
            <slot name="first"></slot>
          </div>
          <div
            part="handle"
            class="handle"
            role="slider"
            aria-orientation="horizontal"
            tabindex="0"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="50"
            aria-valuetext="50%"
          ></div>
        </div>
      `;

      this.#container = /** @type {HTMLElement} */ (this.#root.querySelector('.container'));
      this.#handle = /** @type {HTMLElement} */ (this.#root.querySelector('.handle'));

      this.#boundOnPointerDown = this.#onPointerDown.bind(this);
      this.#boundOnPointerMove = this.#onPointerMove.bind(this);
      this.#boundOnPointerUp = this.#onPointerUp.bind(this);
      this.#boundOnPointerCancel = this.#onPointerCancel.bind(this);
      this.#boundOnContainerPointerDown = this.#onContainerPointerDown.bind(this);
      this.#boundOnKeyDown = this.#onKeyDown.bind(this);
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'min');
      upgradeProperty(this, 'max');
      upgradeProperty(this, 'step');
      upgradeProperty(this, 'disabled');

      this.#handle.addEventListener('pointerdown', this.#boundOnPointerDown);
      this.#handle.addEventListener('keydown', this.#boundOnKeyDown);
      this.#container.addEventListener('pointerdown', this.#boundOnContainerPointerDown);

      this.#applyMin(this.getAttribute('min'));
      this.#applyMax(this.getAttribute('max'));
      this.#applyStep(this.getAttribute('step'));
      this.#applyDisabled(this.hasAttribute('disabled'));
      this.#applyValue(this.getAttribute('value'));
    }

    disconnectedCallback() {
      this.#handle.removeEventListener('pointerdown', this.#boundOnPointerDown);
      this.#handle.removeEventListener('keydown', this.#boundOnKeyDown);
      this.#container.removeEventListener('pointerdown', this.#boundOnContainerPointerDown);
      window.removeEventListener('pointermove', this.#boundOnPointerMove);
      window.removeEventListener('pointerup', this.#boundOnPointerUp);
      window.removeEventListener('pointercancel', this.#boundOnPointerCancel);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'value') {
        if (!this.#reflectingValue) {
          this.#applyValue(newValue);
        }
      } else if (name === 'min') {
        this.#applyMin(newValue);
      } else if (name === 'max') {
        this.#applyMax(newValue);
      } else if (name === 'step') {
        this.#applyStep(newValue);
      } else if (name === 'disabled') {
        this.#applyDisabled(this.hasAttribute('disabled'));
      }
    }

    /**
     * Current slider value within `[min, max]`.
     */
    get value() {
      return this.#value;
    }

    set value(value) {
      this.#setValue(Number(value), { emit: false, reflect: true, notifyChange: false });
    }

    /**
     * Minimum selectable value.
     */
    get min() {
      return this.#min;
    }

    set min(value) {
      this.setAttribute('min', String(value));
    }

    /**
     * Maximum selectable value.
     */
    get max() {
      return this.#max;
    }

    set max(value) {
      this.setAttribute('max', String(value));
    }

    /**
     * Step increment used for keyboard and pointer snapping.
     */
    get step() {
      return this.#step;
    }

    set step(value) {
      this.setAttribute('step', String(value));
    }

    /**
     * When `true`, user interaction is disabled.
     */
    get disabled() {
      return this.#disabled;
    }

    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     * @param {string | null} raw
     */
    #applyValue(raw) {
      const fallback = clamp(this.#value, this.#min, this.#max);
      const parsed = numberAttribute(raw, fallback);
      this.#setValue(parsed, { emit: false, reflect: false, notifyChange: false });
    }

    /**
     * @param {string | null} raw
     */
    #applyMin(raw) {
      const parsed = numberAttribute(raw, 0);
      this.#min = Number.isFinite(parsed) ? parsed : 0;
      if (this.#max < this.#min) {
        this.#max = this.#min;
        this.#reflectAttribute('max', this.#max);
      }
      this.#setValue(this.#value, { emit: false, reflect: true, notifyChange: false });
      this.#updateAria();
      this.#updateVisuals();
    }

    /**
     * @param {string | null} raw
     */
    #applyMax(raw) {
      const parsed = numberAttribute(raw, 100);
      this.#max = Number.isFinite(parsed) ? parsed : 100;
      if (this.#max < this.#min) {
        this.#min = this.#max;
        this.#reflectAttribute('min', this.#min);
      }
      this.#setValue(this.#value, { emit: false, reflect: true, notifyChange: false });
      this.#updateAria();
      this.#updateVisuals();
    }

    /**
     * @param {string | null} raw
     */
    #applyStep(raw) {
      const parsed = numberAttribute(raw, 1);
      this.#step = parsed > 0 ? parsed : 1;
      this.#setValue(this.#value, { emit: false, reflect: true, notifyChange: false });
      this.#updateVisuals();
    }

    /**
     * @param {boolean} isDisabled
     */
    #applyDisabled(isDisabled) {
      this.#disabled = Boolean(isDisabled);
      this.toggleAttribute('data-disabled', this.#disabled);
      this.#handle.setAttribute('aria-disabled', String(this.#disabled));
      this.#handle.tabIndex = this.#disabled ? -1 : 0;
    }

    /**
     * @param {number} value
     * @param {{ emit: boolean; reflect: boolean; notifyChange: boolean }} options
     */
    #setValue(value, { emit, reflect, notifyChange }) {
      const range = this.#max - this.#min;
      const safeRange = Number.isFinite(range) && range !== 0 ? range : 0;
      const clamped = safeRange === 0 ? this.#min : clamp(value, this.#min, this.#max);
      const snapped = snapToStep(clamped, this.#step, this.#min);
      const next = safeRange === 0 ? this.#min : clamp(snapped, this.#min, this.#max);

      if (next === this.#value) {
        return;
      }

      this.#value = next;
      this.#updateVisuals();
      this.#updateAria();

      if (reflect) {
        this.#reflectValue();
      }

      if (emit) {
        this.#emitInput();
      }

      if (notifyChange) {
        this.#emitChange();
      }
    }

    #reflectValue() {
      this.#reflectAttribute('value', this.#value);
    }

    /**
     * @param {string} name
     * @param {number} value
     */
    #reflectAttribute(name, value) {
      this.#reflectingValue = true;
      this.setAttribute(name, String(value));
      this.#reflectingValue = false;
    }

    #updateVisuals() {
      const range = this.#max - this.#min;
      const ratio = range <= 0 ? 0 : (this.#value - this.#min) / range;
      const percentage = Number.isFinite(ratio) ? ratio * 100 : 0;
      this.style.setProperty('--wc-diff-divider-position', `${percentage}%`);
    }

    #updateAria() {
      this.#handle.setAttribute('aria-valuemin', String(this.#min));
      this.#handle.setAttribute('aria-valuemax', String(this.#max));
      this.#handle.setAttribute('aria-valuenow', String(this.#value));
      const range = this.#max - this.#min;
      const ratio = range <= 0 ? 0 : (this.#value - this.#min) / range;
      const percentage = Math.round(ratio * 100);
      this.#handle.setAttribute('aria-valuetext', `${percentage}%`);
    }

    #emitInput() {
      this.dispatchEvent(
        new CustomEvent('input', {
          bubbles: true,
          composed: true,
          detail: { value: this.#value }
        })
      );
    }

    #emitChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          bubbles: true,
          composed: true,
          detail: { value: this.#value }
        })
      );
    }

    /** @param {PointerEvent} event */
    #onPointerDown(event) {
      if (this.#disabled || event.button !== 0) {
        return;
      }
      event.preventDefault();
      this.#dragging = true;
      this.#pointerId = event.pointerId;
      window.addEventListener('pointermove', this.#boundOnPointerMove);
      window.addEventListener('pointerup', this.#boundOnPointerUp);
      window.addEventListener('pointercancel', this.#boundOnPointerCancel);
      this.#updateFromPointer(event, { emit: true });
    }

    /** @param {PointerEvent} event */
    #onContainerPointerDown(event) {
      if (this.#disabled || event.button !== 0) {
        return;
      }

      if (event.target === this.#handle) {
        return;
      }

      event.preventDefault();
      this.#dragging = true;
      this.#pointerId = event.pointerId;
      window.addEventListener('pointermove', this.#boundOnPointerMove);
      window.addEventListener('pointerup', this.#boundOnPointerUp);
      window.addEventListener('pointercancel', this.#boundOnPointerCancel);
      this.#updateFromPointer(event, { emit: true });
    }

    /** @param {PointerEvent} event */
    #onPointerMove(event) {
      if (!this.#dragging || this.#pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      this.#updateFromPointer(event, { emit: true });
    }

    /** @param {PointerEvent} event */
    #onPointerUp(event) {
      if (this.#pointerId !== event.pointerId) {
        return;
      }
      this.#dragging = false;
      this.#pointerId = null;
      window.removeEventListener('pointermove', this.#boundOnPointerMove);
      window.removeEventListener('pointerup', this.#boundOnPointerUp);
      window.removeEventListener('pointercancel', this.#boundOnPointerCancel);
      this.#emitChange();
    }

    /** @param {PointerEvent} event */
    #onPointerCancel(event) {
      if (this.#pointerId !== event.pointerId) {
        return;
      }
      this.#dragging = false;
      this.#pointerId = null;
      window.removeEventListener('pointermove', this.#boundOnPointerMove);
      window.removeEventListener('pointerup', this.#boundOnPointerUp);
      window.removeEventListener('pointercancel', this.#boundOnPointerCancel);
    }

    /**
     * @param {PointerEvent} event
     * @param {{ emit: boolean }} options
     */
    #updateFromPointer(event, { emit }) {
      const rect = this.#container.getBoundingClientRect();
      if (rect.width === 0) {
        return;
      }
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const value = this.#min + ratio * (this.#max - this.#min);
      this.#setValue(value, { emit, reflect: true, notifyChange: false });
    }

    /** @param {KeyboardEvent} event */
    #onKeyDown(event) {
      if (this.#disabled) {
        return;
      }

      const { key } = event;
      const largeStep = this.#step * 10;
      let handled = false;
      let nextValue = this.#value;

      switch (key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          nextValue = this.#value - this.#step;
          handled = true;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          nextValue = this.#value + this.#step;
          handled = true;
          break;
        case 'PageDown':
          nextValue = this.#value - largeStep;
          handled = true;
          break;
        case 'PageUp':
          nextValue = this.#value + largeStep;
          handled = true;
          break;
        case 'Home':
          nextValue = this.#min;
          handled = true;
          break;
        case 'End':
          nextValue = this.#max;
          handled = true;
          break;
      }

      if (!handled) {
        return;
      }

      event.preventDefault();
      this.#setValue(nextValue, { emit: true, reflect: true, notifyChange: true });
    }
  }

  if (!customElements.get('wc-diff')) {
    customElements.define('wc-diff', WcDiff);
  }
})();

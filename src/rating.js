/**
 * @file rating.js
 * @version 1.0.0
 *
 * Accessible rating control web component inspired by the daisyUI rating primitive.
 * It renders a row of shapes that can be activated with pointer, keyboard, or form
 * submission. The element supports fractional steps, custom colour palettes per item,
 * and integrates with forms via ElementInternals when available.
 *
 * Usage:
 * <wc-rating value="3.5" step="0.5" shape="star-2"></wc-rating>
 */

(() => {
  if (customElements.get('wc-rating')) {
    return;
  }

  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  /**
   * @param {unknown} value
   * @returns {number | null}
   */
  const toNumber = (value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  /**
   * @param {Element} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * @param {string | null} value
   */
  const booleanAttribute = (value) => value !== null && value !== 'false';

  const DEFAULT_MAX = 5;
  const DEFAULT_STEP = 1;
  const DEFAULT_SHAPE = 'star';
  const DEFAULT_SIZE = 'md';

  /**
   * CSS mask definitions for the available shapes.
   * @type {Record<string, string>}
   */
  const SHAPE_MASKS = {
    star: 'path("M12 2l3.09 6.26 6.91 1.01-5 4.88 1.18 6.9L12 18.77 5.82 21.05l1.18-6.9-5-4.88 6.91-1.01L12 2z") center / contain no-repeat',
    'star-2':
      'path("M12 1.5l2.63 5.34 5.89.86-4.26 4.16 1.01 5.88L12 15.98 6.73 17.74l1.01-5.88-4.26-4.16 5.89-.86L12 1.5z") center / contain no-repeat',
    heart:
      'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z") center / contain no-repeat',
  };

  /**
   * Determine the decimal precision of a numeric step.
   * @param {number} value
   */
  const getPrecision = (value) => {
    const asString = String(value);
    const [, fraction = ''] = asString.split('.');
    return fraction.length;
  };

  class WcRating extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return ['value', 'max', 'step', 'readonly', 'disabled', 'shape', 'clearable', 'size', 'palette', 'dir'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #track;
    /** @type {ElementInternals | null} */
    #internals = null;
    /** @type {HTMLElement[]} */
    #items = [];
    /** @type {number} */
    #value = 0;
    /** @type {number} */
    #defaultValue = 0;
    /** @type {number} */
    #max = DEFAULT_MAX;
    /** @type {number} */
    #step = DEFAULT_STEP;
    /** @type {number} */
    #stepPrecision = 0;
    /** @type {boolean} */
    #readonly = false;
    /** @type {boolean} */
    #disabled = false;
    /** @type {boolean} */
    #clearable = false;
    /** @type {string} */
    #shape = DEFAULT_SHAPE;
    /** @type {string} */
    #size = DEFAULT_SIZE;
    /** @type {string[]} */
    #palette = [];
    /** @type {'ltr' | 'rtl'} */
    #direction = 'ltr';
    /** @type {number | null} */
    #activePointerId = null;
    /** @type {string | null} */
    #userTabIndex = null;
    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {boolean} */
    #reflectingMax = false;
    /** @type {boolean} */
    #reflectingStep = false;
    /** @type {boolean} */
    #reflectingPalette = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals may not exist in older lib definitions.
        this.#internals = this.attachInternals();
      }

      this.#root.innerHTML = `
        <style>
          :host {
            --wc-rating-size: 1.5rem;
            --wc-rating-gap: 0.375rem;
            --wc-rating-active-color: #facc15;
            --wc-rating-inactive-color: rgba(148, 163, 184, 0.35);
            --wc-rating-transition: 160ms ease;
            --wc-rating-focus-ring: 0 0 0 3px rgba(79, 70, 229, 0.35);
            --wc-rating-mask: ${SHAPE_MASKS[DEFAULT_SHAPE]};
            display: inline-flex;
            align-items: center;
            color: inherit;
            position: relative;
            outline: none;
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-size="xs"]) {
            --wc-rating-size: 0.75rem;
            --wc-rating-gap: 0.25rem;
          }

          :host([data-size="sm"]) {
            --wc-rating-size: 1rem;
            --wc-rating-gap: 0.3rem;
          }

          :host([data-size="md"]) {
            --wc-rating-size: 1.35rem;
          }

          :host([data-size="lg"]) {
            --wc-rating-size: 1.65rem;
            --wc-rating-gap: 0.45rem;
          }

          :host([data-size="xl"]) {
            --wc-rating-size: 2rem;
            --wc-rating-gap: 0.5rem;
          }

          :host([data-shape="star"]) {
            --wc-rating-mask: ${SHAPE_MASKS.star};
          }

          :host([data-shape="star-2"]) {
            --wc-rating-mask: ${SHAPE_MASKS['star-2']};
          }

          :host([data-shape="heart"]) {
            --wc-rating-mask: ${SHAPE_MASKS.heart};
          }

          :host([data-disabled="true"]) {
            cursor: not-allowed;
            opacity: var(--wc-rating-disabled-opacity, 0.6);
          }

          [part="root"] {
            display: inline-flex;
            align-items: center;
            gap: var(--wc-rating-label-gap, 0.65rem);
          }

          [part="track"] {
            display: inline-flex;
            gap: var(--wc-rating-gap);
            position: relative;
            align-items: center;
            touch-action: none;
            user-select: none;
            border-radius: var(--wc-rating-focus-radius, 999px);
            padding: var(--wc-rating-focus-padding, 0.125rem);
            transition: box-shadow 160ms ease;
          }

          :host(:focus-visible) [part="track"] {
            box-shadow: var(--wc-rating-focus-ring);
          }

          [part="item"] {
            inline-size: calc(var(--wc-rating-size) + var(--wc-rating-hit-area, 0px));
            block-size: calc(var(--wc-rating-size) + var(--wc-rating-hit-area, 0px));
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;
            border-radius: inherit;
          }

          :host([data-readonly="true"]) [part="item"],
          :host([data-disabled="true"]) [part="item"] {
            cursor: default;
          }

          [part="icon"] {
            inline-size: var(--wc-rating-size);
            block-size: var(--wc-rating-size);
            position: relative;
            display: inline-block;
          }

          [part="icon"]::before,
          [part="icon"]::after {
            content: '';
            position: absolute;
            inset: 0;
            mask: var(--wc-rating-mask);
            -webkit-mask: var(--wc-rating-mask);
          }

          [part="icon"]::before {
            background: var(--wc-rating-inactive-color);
          }

          [part="icon"]::after {
            background: var(--wc-rating-active-color);
            transform: scaleX(var(--wc-rating-fill, 0));
            transform-origin: left center;
            transition: transform var(--wc-rating-transition);
          }

          :host([data-direction="rtl"]) [part="icon"]::after {
            transform-origin: right center;
          }

          [part="item"][data-filled="empty"] [part="icon"]::after {
            transform: scaleX(0);
          }

          [part="item"][data-filled="full"] [part="icon"]::after {
            transform: scaleX(1);
          }

          :host([data-disabled="true"]) [part="icon"]::after {
            transition-duration: 0ms;
          }

          ::slotted(*) {
            margin: 0;
          }
        </style>
        <div part="root">
          <div part="track"></div>
          <slot part="label"></slot>
        </div>
      `;

      this.#track = /** @type {HTMLElement} */ (this.#root.querySelector('[part="track"]'));

      this.#stepPrecision = getPrecision(this.#step);
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'max');
      upgradeProperty(this, 'step');
      upgradeProperty(this, 'shape');
      upgradeProperty(this, 'size');
      upgradeProperty(this, 'readonly');
      upgradeProperty(this, 'disabled');
      upgradeProperty(this, 'clearable');
      upgradeProperty(this, 'palette');

      this.#setShape(this.getAttribute('shape') ?? DEFAULT_SHAPE, { reflect: false });
      this.#setSize(this.getAttribute('size') ?? DEFAULT_SIZE, { reflect: false });
      const maxAttr = toNumber(this.getAttribute('max'));
      if (maxAttr !== null) {
        this.#setMax(maxAttr, { reflect: false });
      }
      const stepAttr = toNumber(this.getAttribute('step'));
      if (stepAttr !== null) {
        this.#setStep(stepAttr, { reflect: false });
      }

      this.#readonly = booleanAttribute(this.getAttribute('readonly'));
      this.#disabled = booleanAttribute(this.getAttribute('disabled'));
      this.#clearable = booleanAttribute(this.getAttribute('clearable'));

      const paletteAttr = this.getAttribute('palette');
      if (paletteAttr) {
        this.#palette = paletteAttr
          .split(',')
          .map((token) => token.trim())
          .filter((token) => token.length > 0);
      }

      const valueAttr = toNumber(this.getAttribute('value'));
      if (valueAttr !== null) {
        this.#setValue(valueAttr, { emit: false, reflect: false, updateDefault: true });
      }

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'slider');
      }

      if (this.hasAttribute('tabindex')) {
        this.#userTabIndex = this.getAttribute('tabindex');
      } else {
        this.tabIndex = this.#disabled ? -1 : 0;
      }

      this.#renderItems();
      this.#defaultValue = this.#value;
      this.#updateDirection();
      this.#applyPalette();
      this.#updateVisualState();
      this.#syncAria();
      this.#syncStateAttributes();

      this.#track.addEventListener('pointerdown', this.#handlePointerDown);
      this.addEventListener('keydown', this.#handleKeyDown);
    }

    disconnectedCallback() {
      this.#track.removeEventListener('pointerdown', this.#handlePointerDown);
      this.removeEventListener('keydown', this.#handleKeyDown);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'value': {
          if (this.#reflectingValue) {
            return;
          }
          const parsed = toNumber(newValue);
          const next = parsed ?? 0;
          this.#setValue(next, { emit: false, reflect: false, updateDefault: true });
          break;
        }
        case 'max': {
          if (this.#reflectingMax) {
            return;
          }
          const parsed = toNumber(newValue);
          this.#setMax(parsed ?? DEFAULT_MAX, { reflect: false });
          break;
        }
        case 'step': {
          if (this.#reflectingStep) {
            return;
          }
          const parsed = toNumber(newValue);
          this.#setStep(parsed ?? DEFAULT_STEP, { reflect: false });
          break;
        }
        case 'readonly': {
          this.#readonly = booleanAttribute(newValue);
          this.#syncStateAttributes();
          break;
        }
        case 'disabled': {
          this.#disabled = booleanAttribute(newValue);
          this.#syncStateAttributes();
          break;
        }
        case 'shape': {
          this.#setShape(newValue ?? DEFAULT_SHAPE, { reflect: false });
          break;
        }
        case 'size': {
          this.#setSize(newValue ?? DEFAULT_SIZE, { reflect: false });
          break;
        }
        case 'clearable': {
          this.#clearable = booleanAttribute(newValue);
          break;
        }
        case 'palette': {
          if (this.#reflectingPalette) {
            return;
          }
          const paletteValue = typeof newValue === 'string' ? newValue : '';
          const parsed = paletteValue
            .split(',')
            .map((token) => token.trim())
            .filter((token) => token.length > 0);
          this.#palette = parsed;
          this.#applyPalette();
          break;
        }
        case 'dir': {
          this.#direction = newValue === 'rtl' ? 'rtl' : 'ltr';
          this.#updateDirection();
          break;
        }
      }
    }

    /**
     * The current rating value. Fractional values are supported according to the `step`.
     */
    get value() {
      return this.#value;
    }

    set value(value) {
      const parsed = toNumber(value);
      if (parsed === null) {
        this.#setValue(0, { emit: false, reflect: true, updateDefault: true });
      } else {
        this.#setValue(parsed, { emit: false, reflect: true, updateDefault: true });
      }
    }

    /**
     * Maximum number of items displayed.
     */
    get max() {
      return this.#max;
    }

    set max(value) {
      const parsed = toNumber(value);
      this.#setMax(parsed ?? DEFAULT_MAX, { reflect: true });
    }

    /**
     * Step granularity applied when interacting with the rating.
     */
    get step() {
      return this.#step;
    }

    set step(value) {
      const parsed = toNumber(value);
      this.#setStep(parsed ?? DEFAULT_STEP, { reflect: true });
    }

    /**
     * Whether the rating is read-only.
     */
    get readOnly() {
      return this.#readonly;
    }

    set readOnly(value) {
      this.toggleAttribute('readonly', Boolean(value));
    }

    /**
     * Reflects the disabled state of the rating.
     */
    get disabled() {
      return this.#disabled;
    }

    set disabled(value) {
      this.toggleAttribute('disabled', Boolean(value));
    }

    /**
     * Allows the user to clear the rating back to zero by interacting with the current value.
     */
    get clearable() {
      return this.#clearable;
    }

    set clearable(value) {
      this.toggleAttribute('clearable', Boolean(value));
    }

    /**
     * Selected icon shape for the items.
     */
    get shape() {
      return this.#shape;
    }

    set shape(value) {
      this.#setShape(typeof value === 'string' ? value : DEFAULT_SHAPE, { reflect: true });
    }

    /**
     * Size token controlling the overall icon dimensions.
     */
    get size() {
      return this.#size;
    }

    set size(value) {
      this.#setSize(typeof value === 'string' ? value : DEFAULT_SIZE, { reflect: true });
    }

    /**
     * Array of colours applied to each item. Falls back to `--wc-rating-active-color` when omitted.
     */
    get palette() {
      return [...this.#palette];
    }

    set palette(value) {
      if (value == null) {
        this.removeAttribute('palette');
        return;
      }

      if (Array.isArray(value)) {
        const normalised = value.map((token) => String(token).trim()).filter((token) => token.length > 0);
        this.setAttribute('palette', normalised.join(','));
      } else {
        this.setAttribute('palette', String(value));
      }
    }

    /**
     * @param {number} value
     * @param {{ emit?: boolean; reflect?: boolean; updateDefault?: boolean }} [options]
     */
    #setValue(value, options) {
      const { emit = false, reflect = true, updateDefault = false } = options ?? {};
      const normalised = this.#normaliseValue(value);
      if (normalised === this.#value) {
        if (reflect && !this.#reflectingValue) {
          this.#reflectValueAttribute();
        }
        if (updateDefault) {
          this.#defaultValue = this.#value;
        }
        return;
      }

      this.#value = normalised;
      if (updateDefault) {
        this.#defaultValue = this.#value;
      }

      this.#updateVisualState();
      this.#syncAria();
      this.#internals?.setFormValue(this.#value > 0 ? String(this.#value) : null);

      if (reflect && !this.#reflectingValue) {
        this.#reflectValueAttribute();
      }

      if (emit) {
        this.dispatchEvent(new Event('input', { bubbles: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    #reflectValueAttribute() {
      this.#reflectingValue = true;
      if (this.#value === 0) {
        this.removeAttribute('value');
      } else {
        this.setAttribute('value', String(this.#value));
      }
      this.#reflectingValue = false;
    }

    /**
     * @param {number} value
     * @returns {number}
     */
    #normaliseValue(value) {
      const clamped = Math.min(Math.max(value, 0), this.#max);
      const steps = Math.round(clamped / this.#step);
      const stepped = steps * this.#step;
      return Number(stepped.toFixed(this.#stepPrecision));
    }

    /**
     * @param {number} value
     * @param {{ reflect: boolean }} options
     */
    #setMax(value, options) {
      const next = Math.max(1, Math.round(value));
      if (next === this.#max) {
        if (options.reflect && !this.#reflectingMax) {
          this.#reflectingMax = true;
          this.setAttribute('max', String(next));
          this.#reflectingMax = false;
        }
        return;
      }

      this.#max = next;
      this.#renderItems();
      this.#setValue(this.#value, { emit: false, reflect: false });
      this.#syncAria();

      if (options.reflect && !this.#reflectingMax) {
        this.#reflectingMax = true;
        this.setAttribute('max', String(next));
        this.#reflectingMax = false;
      }
    }

    /**
     * @param {number} value
     * @param {{ reflect: boolean }} options
     */
    #setStep(value, options) {
      const positive = value > 0 ? value : DEFAULT_STEP;
      if (positive === this.#step) {
        if (options.reflect && !this.#reflectingStep) {
          this.#reflectingStep = true;
          this.setAttribute('step', String(positive));
          this.#reflectingStep = false;
        }
        return;
      }

      this.#step = positive;
      this.#stepPrecision = getPrecision(this.#step);
      this.#setValue(this.#value, { emit: false, reflect: false });

      if (options.reflect && !this.#reflectingStep) {
        this.#reflectingStep = true;
        this.setAttribute('step', String(positive));
        this.#reflectingStep = false;
      }
    }

    /**
     * @param {string} value
     * @param {{ reflect: boolean }} options
     */
    #setShape(value, options) {
      const token = Object.prototype.hasOwnProperty.call(SHAPE_MASKS, value) ? value : DEFAULT_SHAPE;
      this.#shape = token;
      this.setAttribute('data-shape', token);
      if (options.reflect) {
        this.setAttribute('shape', token);
      }
    }

    /**
     * @param {string} value
     * @param {{ reflect: boolean }} options
     */
    #setSize(value, options) {
      const allowed = new Set(['xs', 'sm', 'md', 'lg', 'xl']);
      const token = allowed.has(value) ? value : DEFAULT_SIZE;
      this.#size = token;
      this.setAttribute('data-size', token);
      if (options.reflect) {
        this.setAttribute('size', token);
      }
    }

    #renderItems() {
      this.#track.innerHTML = '';
      this.#items = [];
      for (let index = 0; index < this.#max; index += 1) {
        const item = document.createElement('div');
        item.setAttribute('part', 'item');
        item.dataset.index = String(index + 1);
        const icon = document.createElement('span');
        icon.setAttribute('part', 'icon');
        icon.setAttribute('aria-hidden', 'true');
        item.append(icon);
        this.#track.append(item);
        this.#items.push(item);
      }
      this.#applyPalette();
      this.#updateVisualState();
    }

    #applyPalette() {
      this.#items.forEach((item, index) => {
        const color = this.#palette[index];
        if (color) {
          item.style.setProperty('--wc-rating-active-color', color);
        } else {
          item.style.removeProperty('--wc-rating-active-color');
        }
      });
    }

    #updateVisualState() {
      this.#items.forEach((item, index) => {
        const delta = this.#value - index;
        const fill = Math.min(Math.max(delta, 0), 1);
        item.dataset.filled = fill <= 0 ? 'empty' : fill >= 1 ? 'full' : 'partial';
        item.style.setProperty('--wc-rating-fill', fill.toFixed(3));
      });
    }

    #syncAria() {
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(this.#max));
      this.setAttribute('aria-valuenow', String(this.#value));
      const valueText = this.#value > 0 ? `${this.#value} out of ${this.#max}` : 'Not rated';
      this.setAttribute('aria-valuetext', valueText);
    }

    #syncStateAttributes() {
      this.toggleAttribute('data-readonly', this.#readonly);
      this.toggleAttribute('data-disabled', this.#disabled);

      if (this.#disabled) {
        this.setAttribute('aria-disabled', 'true');
        if (this.tabIndex >= 0 || !this.hasAttribute('tabindex')) {
          this.#userTabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : null;
        }
        this.tabIndex = -1;
      } else {
        this.removeAttribute('aria-disabled');
        if (this.#userTabIndex !== null) {
          this.setAttribute('tabindex', this.#userTabIndex);
        } else if (!this.hasAttribute('tabindex') || this.tabIndex < 0) {
          this.tabIndex = 0;
        }
      }

      if (this.#readonly) {
        this.setAttribute('aria-readonly', 'true');
      } else {
        this.removeAttribute('aria-readonly');
      }

      if (this.#internals) {
        this.#internals.ariaDisabled = this.#disabled ? 'true' : null;
        this.#internals.states?.toggle?.('disabled', this.#disabled);
      }
    }

    #updateDirection() {
      if (!this.isConnected) {
        return;
      }
      if (!this.hasAttribute('dir')) {
        const computed = getComputedStyle(this);
        this.#direction = computed.direction === 'rtl' ? 'rtl' : 'ltr';
      }
      this.setAttribute('data-direction', this.#direction);
      this.#updateVisualState();
    }

    /**
     * @param {PointerEvent} event
     */
    #handlePointerDown = (event) => {
      if (event.button !== 0 || this.#disabled || this.#readonly) {
        return;
      }

      this.focus({ preventScroll: true });
      this.#activePointerId = event.pointerId;
      this.#track.setPointerCapture(event.pointerId);

      const candidate = this.#deriveValueFromPointer(event);
      if (this.#clearable && candidate === this.#value) {
        this.#setValue(0, { emit: true, reflect: true });
      } else {
        this.#setValue(candidate, { emit: true, reflect: true });
      }

      this.#track.addEventListener('pointermove', this.#handlePointerMove);
      this.#track.addEventListener('pointerup', this.#handlePointerUp);
      this.#track.addEventListener('pointercancel', this.#handlePointerUp);
      event.preventDefault();
    };

    /**
     * @param {PointerEvent} event
     */
    #handlePointerMove = (event) => {
      if (event.pointerId !== this.#activePointerId || this.#disabled || this.#readonly) {
        return;
      }
      event.preventDefault();
      const candidate = this.#deriveValueFromPointer(event);
      this.#setValue(candidate, { emit: true, reflect: true });
    };

    /**
     * @param {PointerEvent} event
     */
    #handlePointerUp = (event) => {
      if (event.pointerId !== this.#activePointerId) {
        return;
      }
      this.#track.releasePointerCapture(event.pointerId);
      this.#track.removeEventListener('pointermove', this.#handlePointerMove);
      this.#track.removeEventListener('pointerup', this.#handlePointerUp);
      this.#track.removeEventListener('pointercancel', this.#handlePointerUp);
      this.#activePointerId = null;
    };

    /**
     * @param {PointerEvent} event
     */
    #deriveValueFromPointer(event) {
      const rect = this.#track.getBoundingClientRect();
      if (!rect.width) {
        return this.#value;
      }
      const position = this.#direction === 'rtl' ? rect.right - event.clientX : event.clientX - rect.left;
      const ratio = Math.min(Math.max(position / rect.width, 0), 1);
      const raw = ratio * this.#max;
      return this.#normaliseValue(raw);
    }

    /**
     * @param {KeyboardEvent} event
     */
    #handleKeyDown = (event) => {
      if (this.#disabled || this.#readonly) {
        return;
      }

      let delta = 0;
      switch (event.key) {
        case 'ArrowRight':
          delta = this.#direction === 'rtl' ? -this.#step : this.#step;
          break;
        case 'ArrowLeft':
          delta = this.#direction === 'rtl' ? this.#step : -this.#step;
          break;
        case 'ArrowUp':
          delta = this.#step;
          break;
        case 'ArrowDown':
          delta = -this.#step;
          break;
        case 'Home':
          event.preventDefault();
          this.#setValue(0, { emit: true, reflect: true });
          return;
        case 'End':
          event.preventDefault();
          this.#setValue(this.#max, { emit: true, reflect: true });
          return;
        case 'Backspace':
        case 'Delete':
          if (this.#clearable) {
            event.preventDefault();
            this.#setValue(0, { emit: true, reflect: true });
          }
          return;
        default:
          return;
      }

      event.preventDefault();
      this.#setValue(this.#value + delta, { emit: true, reflect: true });
    };

    formResetCallback() {
      this.#setValue(this.#defaultValue, { emit: false, reflect: true });
    }

    /**
     * @param {string | File | FormData | null} state
     */
    formStateRestoreCallback(state) {
      const parsed = toNumber(state);
      if (parsed === null) {
        this.#setValue(this.#defaultValue, { emit: false, reflect: true });
      } else {
        this.#setValue(parsed, { emit: false, reflect: true });
      }
    }
  }

  customElements.define('wc-rating', WcRating);
})();

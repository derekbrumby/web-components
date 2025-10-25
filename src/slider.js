/**
 * @file slider.js
 * @version 1.0.0
 *
 * Accessible multi-thumb slider component inspired by Radix UI.
 * Supports keyboard, pointer, and touch interaction with optional RTL and vertical layouts.
 *
 * Usage:
 * <wc-slider value="25 75" min="0" max="100" step="5"></wc-slider>
 */

(() => {
  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

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
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * @param {number} value
   * @param {number} step
   * @param {number} min
   */
  const snapToStep = (value, step, min) => {
    if (!Number.isFinite(step) || step <= 0) {
      return value;
    }
    const remainder = (value - min) / step;
    const rounded = Math.round(remainder);
    const snapped = min + rounded * step;
    const precision = step.toString().split('.')[1]?.length ?? 0;
    return Number(snapped.toFixed(precision));
  };

  /**
   * @param {string | null} value
   * @param {readonly number[]} fallback
   */
  const parseValues = (value, fallback) => {
    if (typeof value !== 'string') {
      return [...fallback];
    }
    const result = value
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => Number(part))
      .filter((num) => Number.isFinite(num));
    return result.length > 0 ? result : [...fallback];
  };

  class WcSlider extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    static get observedAttributes() {
      return [
        'value',
        'min',
        'max',
        'step',
        'disabled',
        'orientation',
        'inverted',
        'dir',
        'name',
        'min-steps-between-thumbs',
        'thumb-labels'
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #container;
    /** @type {HTMLElement} */
    #track;
    /** @type {HTMLElement} */
    #range;
    /** @type {HTMLElement} */
    #thumbContainer;
    /** @type {ElementInternals | null} */
    #internals = null;
    /** @type {number[]} */
    #values = [50];
    /** @type {number[]} */
    #defaultValues = [50];
    /** @type {number} */
    #min = 0;
    /** @type {number} */
    #max = 100;
    /** @type {number} */
    #step = 1;
    /** @type {boolean} */
    #disabled = false;
    /** @type {'horizontal' | 'vertical'} */
    #orientation = 'horizontal';
    /** @type {boolean} */
    #inverted = false;
    /** @type {'ltr' | 'rtl'} */
    #direction = 'ltr';
    /** @type {number} */
    #minStepsBetweenThumbs = 0;
    /** @type {number} */
    #focusedIndex = 0;
    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {boolean} */
    #keyValueChanged = false;

    /** @type {HTMLElement[]} */
    #thumbs = [];
    /** @type {HTMLFormElement | null} */
    #form = null;
    /** @type {string[]} */
    #thumbLabels = [];

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
            display: inline-flex;
            width: var(--wc-slider-width, 200px);
            height: var(--wc-slider-height, 20px);
            box-sizing: border-box;
            touch-action: none;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="root"] {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            gap: var(--wc-slider-gap, 0);
          }

          [part="root"][data-orientation="vertical"] {
            flex-direction: column;
          }

          [part="track"] {
            position: relative;
            flex: 1;
            height: var(--wc-slider-track-size, 3px);
            border-radius: var(--wc-slider-track-radius, 9999px);
            background: var(--wc-slider-track-background, rgba(0, 0, 0, 0.35));
          }

          [part="root"][data-orientation="vertical"] [part="track"] {
            width: var(--wc-slider-track-size, 3px);
            height: 100%;
          }

          [part="range"] {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: auto;
            border-radius: inherit;
            background: var(--wc-slider-range-background, currentColor);
            pointer-events: none;
          }

          [part="root"][data-orientation="vertical"] [part="range"] {
            left: 0;
            right: 0;
            bottom: 0;
            top: auto;
          }

          [part="thumb-container"] {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }

          [part="thumb"] {
            position: absolute;
            width: var(--wc-slider-thumb-size, 20px);
            height: var(--wc-slider-thumb-size, 20px);
            border-radius: var(--wc-slider-thumb-radius, 8px);
            background: var(--wc-slider-thumb-background, #ffffff);
            box-shadow: var(--wc-slider-thumb-shadow, 0 2px 10px rgba(0, 0, 0, 0.25));
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            touch-action: none;
            pointer-events: auto;
            cursor: grab;
            outline: none;
          }

          [part="thumb"]:active {
            cursor: grabbing;
          }

          :host([data-disabled="true"]) [part="thumb"] {
            cursor: not-allowed;
          }

          [part="thumb"]:focus-visible {
            outline: 2px solid var(--wc-slider-thumb-focus-outline, rgba(79, 70, 229, 0.65));
            outline-offset: 2px;
          }

          :host([data-disabled="true"]) {
            opacity: 0.6;
            pointer-events: none;
          }
        </style>
        <div part="root" data-orientation="horizontal">
          <div part="track">
            <div part="range"></div>
          </div>
          <div part="thumb-container"></div>
        </div>
      `;

      this.#container = /** @type {HTMLElement} */ (this.#root.querySelector('[part="root"]'));
      this.#track = /** @type {HTMLElement} */ (this.#root.querySelector('[part="track"]'));
      this.#range = /** @type {HTMLElement} */ (this.#root.querySelector('[part="range"]'));
      this.#thumbContainer = /** @type {HTMLElement} */ (this.#root.querySelector('[part="thumb-container"]'));

      this.#track.addEventListener('pointerdown', this.#handleTrackPointerDown);
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }
      this.#defaultValues = [...this.#values];
      this.#renderThumbs();
      this.#render();
    }

    disconnectedCallback() {
      this.#track.removeEventListener('pointerdown', this.#handleTrackPointerDown);
      if (this.#form) {
        this.#form.removeEventListener('reset', this.#handleFormReset);
        this.#form = null;
      }
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'value': {
          if (this.#reflectingValue) {
            return;
          }
          const parsed = parseValues(newValue, this.#values);
          this.#setValues(parsed, { emit: false, reflect: false });
          this.#defaultValues = [...this.#values];
          break;
        }
        case 'min':
        case 'max':
        case 'step': {
          const min = numberAttribute(this.getAttribute('min'), this.#min);
          const max = numberAttribute(this.getAttribute('max'), this.#max);
          const step = numberAttribute(this.getAttribute('step'), this.#step);
          this.#min = min;
          this.#max = max;
          this.#step = step > 0 ? step : 1;
          this.#setValues(this.#values, { emit: false, reflect: true });
          break;
        }
        case 'disabled': {
          this.#disabled = this.hasAttribute('disabled');
          this.#render();
          break;
        }
        case 'orientation': {
          const orientation = newValue === 'vertical' ? 'vertical' : 'horizontal';
          this.#orientation = orientation;
          this.#render();
          break;
        }
        case 'inverted': {
          this.#inverted = newValue !== null && newValue !== 'false';
          this.#render();
          break;
        }
        case 'dir': {
          const dir = newValue === 'rtl' ? 'rtl' : 'ltr';
          this.#direction = dir;
          this.#render();
          break;
        }
        case 'name': {
          this.#render();
          break;
        }
        case 'min-steps-between-thumbs': {
          const parsed = numberAttribute(newValue, this.#minStepsBetweenThumbs);
          this.#minStepsBetweenThumbs = Math.max(0, Math.floor(parsed));
          this.#setValues(this.#values, { emit: false, reflect: true });
          break;
        }
        case 'thumb-labels': {
          this.#thumbLabels = typeof newValue === 'string'
            ? newValue
                .split(',')
                .map((label) => label.trim())
                .filter((label) => label.length > 0)
            : [];
          this.#thumbs.forEach((_, index) => this.#updateThumbAccessibility(index));
          break;
        }
        default:
          break;
      }
    }

    /** @returns {number[]} */
    get value() {
      return [...this.#values];
    }

    /**
     * @param {number[]} next
     */
    set value(next) {
      if (!Array.isArray(next)) {
        return;
      }
      this.#setValues(next, { emit: false, reflect: true });
    }

    /** @returns {number} */
    get min() {
      return this.#min;
    }

    /** @param {number} value */
    set min(value) {
      this.setAttribute('min', String(value));
    }

    /** @returns {number} */
    get max() {
      return this.#max;
    }

    /** @param {number} value */
    set max(value) {
      this.setAttribute('max', String(value));
    }

    /** @returns {number} */
    get step() {
      return this.#step;
    }

    /** @param {number} value */
    set step(value) {
      this.setAttribute('step', String(value));
    }

    /** @returns {boolean} */
    get disabled() {
      return this.#disabled;
    }

    /** @param {boolean} state */
    set disabled(state) {
      this.toggleAttribute('disabled', Boolean(state));
    }

    /** @returns {'horizontal' | 'vertical'} */
    get orientation() {
      return this.#orientation;
    }

    /** @param {'horizontal' | 'vertical'} value */
    set orientation(value) {
      this.setAttribute('orientation', value);
    }

    /** @returns {boolean} */
    get inverted() {
      return this.#inverted;
    }

    /** @param {boolean} state */
    set inverted(state) {
      this.toggleAttribute('inverted', Boolean(state));
    }

    /**
     * Focuses the currently active thumb.
     * @param {FocusOptions} [options]
     */
    focus(options) {
      this.#thumbs[this.#focusedIndex]?.focus(options);
    }

    /** Removes focus from the active thumb. */
    blur() {
      this.#thumbs[this.#focusedIndex]?.blur();
    }

    formAssociatedCallback(form) {
      if (this.#form) {
        this.#form.removeEventListener('reset', this.#handleFormReset);
      }
      this.#form = form;
      if (this.#form) {
        this.#form.addEventListener('reset', this.#handleFormReset);
      }
    }

    formDisabledCallback(disabled) {
      this.disabled = disabled;
    }

    formResetCallback() {
      this.#setValues(this.#defaultValues, { emit: false, reflect: true });
    }

    /**
     * @param {string | null} state
     */
    formStateRestoreCallback(state) {
      if (typeof state === 'string') {
        try {
          const parsed = JSON.parse(state);
          if (Array.isArray(parsed)) {
            this.#setValues(
              parsed.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)),
              { emit: false, reflect: true }
            );
          }
        } catch (error) {
          console.warn('wc-slider: unable to restore state', error);
        }
      }
    }

    /** @type {(event: Event) => void} */
    #handleFormReset = () => {
      this.formResetCallback();
    };

    #renderThumbs() {
      this.#thumbContainer.innerHTML = '';
      this.#thumbs = [];
      this.#values.forEach((_, index) => {
        const thumb = document.createElement('div');
        thumb.setAttribute('part', 'thumb');
        thumb.setAttribute('role', 'slider');
        thumb.tabIndex = index === this.#focusedIndex ? 0 : -1;
        thumb.addEventListener('pointerdown', (event) => this.#handleThumbPointerDown(event, index));
        thumb.addEventListener('keydown', (event) => this.#handleThumbKeyDown(event, index));
        thumb.addEventListener('keyup', (event) => this.#handleThumbKeyUp(event));
        thumb.addEventListener('focus', () => this.#setFocusedIndex(index));
        this.#thumbContainer.appendChild(thumb);
        this.#thumbs.push(thumb);
        this.#updateThumbPosition(index);
        this.#updateThumbAccessibility(index);
      });
    }

    /**
     * @param {number[]} next
     * @param {{ emit: boolean, reflect: boolean }} options
     */
    #setValues(next, { emit, reflect }) {
      if (!Array.isArray(next) || next.length === 0) {
        return;
      }
      const sanitized = next.map((value) => Number(value)).filter((value) => Number.isFinite(value));
      if (sanitized.length === 0) {
        return;
      }
      const sorted = [...sanitized].sort((a, b) => a - b);
      const stepSpacing = this.#step * this.#minStepsBetweenThumbs;
      const nextValues = [];
      sorted.forEach((raw, index) => {
        const min = index > 0 ? nextValues[index - 1] + stepSpacing : this.#min;
        const max = this.#max - stepSpacing * (sorted.length - index - 1);
        const boundedMin = Math.min(min, this.#max);
        const boundedMax = Math.max(boundedMin, Math.min(this.#max, max));
        const aligned = snapToStep(clamp(raw, boundedMin, boundedMax), this.#step, this.#min);
        nextValues.push(aligned);
      });
      if (nextValues.length !== this.#values.length) {
        this.#focusedIndex = 0;
      } else {
        this.#focusedIndex = Math.min(this.#focusedIndex, nextValues.length - 1);
      }
      this.#values = nextValues;
      this.#keyValueChanged = false;
      if (reflect) {
        this.#reflectValueAttribute();
      }
      this.#renderThumbs();
      this.#render();
      if (emit) {
        this.#emitInput();
        this.#emitChange();
      }
    }

    #render() {
      this.#container.setAttribute('data-orientation', this.#orientation);
      if (this.#disabled) {
        this.setAttribute('data-disabled', 'true');
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('data-disabled');
        this.removeAttribute('aria-disabled');
      }
      if (!this.hasAttribute('dir')) {
        const documentDir = this.ownerDocument?.documentElement?.getAttribute('dir');
        this.#direction = documentDir === 'rtl' ? 'rtl' : 'ltr';
      }
      this.#thumbs.forEach((thumb, index) => {
        thumb.tabIndex = index === this.#focusedIndex && !this.#disabled ? 0 : -1;
        this.#updateThumbPosition(index);
        this.#updateThumbAccessibility(index);
      });
      this.#updateRange();
      this.#updateFormValue();
    }

    #reflectValueAttribute() {
      this.#reflectingValue = true;
      this.setAttribute('value', this.#values.map((value) => String(value)).join(' '));
      this.#reflectingValue = false;
    }

    /**
     * @param {number} index
     * @returns {number}
     */
    #valueToPercentValue(value) {
      const range = this.#max - this.#min;
      if (range <= 0) {
        return 0;
      }
      let ratio = (value - this.#min) / range;
      ratio = clamp(ratio, 0, 1);
      const orientationInvertsBase = this.#orientation === 'vertical';
      const directionInvertsBase = this.#orientation === 'horizontal' && this.#direction === 'rtl';
      if (orientationInvertsBase || directionInvertsBase) {
        ratio = 1 - ratio;
      }
      if (this.#inverted) {
        ratio = 1 - ratio;
      }
      return ratio * 100;
    }

    /**
     * @param {number} percent
     */
    #percentToValue(percent) {
      const normalized = clamp(percent, 0, 100) / 100;
      let ratio = normalized;
      const orientationInvertsBase = this.#orientation === 'vertical';
      const directionInvertsBase = this.#orientation === 'horizontal' && this.#direction === 'rtl';
      if (this.#inverted) {
        ratio = 1 - ratio;
      }
      if (orientationInvertsBase || directionInvertsBase) {
        ratio = 1 - ratio;
      }
      const value = this.#min + ratio * (this.#max - this.#min);
      return snapToStep(clamp(value, this.#min, this.#max), this.#step, this.#min);
    }

    #updateRange() {
      if (!this.#range) {
        return;
      }
      const sorted = [...this.#values].sort((a, b) => a - b);
      const startPercent = this.#valueToPercentValue(sorted[0]);
      const endPercent = this.#valueToPercentValue(sorted[sorted.length - 1]);
      if (this.#orientation === 'horizontal') {
        const left = Math.min(startPercent, endPercent);
        const right = 100 - Math.max(startPercent, endPercent);
        this.#range.style.left = `${left}%`;
        this.#range.style.right = `${right}%`;
        this.#range.style.top = '0';
        this.#range.style.bottom = '0';
      } else {
        const start = Math.min(startPercent, endPercent);
        const end = Math.max(startPercent, endPercent);
        this.#range.style.bottom = `${start}%`;
        this.#range.style.top = `${100 - end}%`;
        this.#range.style.left = '0';
        this.#range.style.right = '0';
      }
    }

    /**
     * @param {number} index
     */
    #updateThumbPosition(index) {
      const percent = this.#valueToPercentValue(this.#values[index]);
      if (this.#orientation === 'horizontal') {
        this.#thumbs[index].style.left = `${percent}%`;
        this.#thumbs[index].style.top = '50%';
      } else {
        this.#thumbs[index].style.left = '50%';
        this.#thumbs[index].style.top = `${percent}%`;
      }
    }

    /**
     * @param {number} index
     */
    #updateThumbAccessibility(index) {
      const thumb = this.#thumbs[index];
      if (!thumb) {
        return;
      }
      const min = this.#getThumbMin(index);
      const max = this.#getThumbMax(index);
      thumb.setAttribute('aria-valuemin', String(min));
      thumb.setAttribute('aria-valuemax', String(max));
      thumb.setAttribute('aria-valuenow', String(this.#values[index]));
      thumb.setAttribute('aria-orientation', this.#orientation);
      thumb.setAttribute('aria-disabled', this.#disabled ? 'true' : 'false');
      const labelledBy = this.getAttribute('aria-labelledby');
      if (labelledBy) {
        thumb.setAttribute('aria-labelledby', labelledBy);
      } else {
        thumb.removeAttribute('aria-labelledby');
      }
      const label = this.#getThumbLabel(index);
      if (label) {
        thumb.setAttribute('aria-label', label);
      } else {
        thumb.removeAttribute('aria-label');
      }
    }

    /**
     * @param {number} index
     * @returns {string}
     */
    #getThumbLabel(index) {
      if (this.#thumbLabels[index]) {
        return this.#thumbLabels[index];
      }
      if (this.#thumbLabels.length === 1) {
        return this.#thumbLabels[0];
      }
      const label = this.getAttribute('aria-label');
      if (label) {
        return `${label.trim()} ${index + 1}`;
      }
      const labelledBy = this.getAttribute('aria-labelledby');
      if (labelledBy) {
        return '';
      }
      return `Slider thumb ${index + 1}`;
    }

    #updateFormValue() {
      if (!this.#internals) {
        return;
      }
      const name = this.getAttribute('name');
      if (!name) {
        this.#internals.setFormValue(null);
        return;
      }
      const formData = new FormData();
      this.#values.forEach((value) => {
        formData.append(name, String(value));
      });
      this.#internals.setFormValue(formData, JSON.stringify(this.#values));
    }

    /**
     * @param {number} index
     * @returns {number}
     */
    #getThumbMin(index) {
      const stepSpacing = this.#step * this.#minStepsBetweenThumbs;
      const lowerBound = index > 0 ? this.#values[index - 1] + stepSpacing : this.#min;
      return clamp(lowerBound, this.#min, this.#max);
    }

    /**
     * @param {number} index
     * @returns {number}
     */
    #getThumbMax(index) {
      const stepSpacing = this.#step * this.#minStepsBetweenThumbs;
      const upperBound = index < this.#values.length - 1 ? this.#values[index + 1] - stepSpacing : this.#max;
      return clamp(upperBound, this.#min, this.#max);
    }

    /**
     * @param {number} index
     * @param {number} rawValue
     */
    #setThumbValue(index, rawValue, { emit = false, commit = false } = {}) {
      const constrained = this.#constrainValue(index, rawValue);
      if (constrained === this.#values[index]) {
        if (commit && this.#keyValueChanged) {
          this.#emitChange();
          this.#keyValueChanged = false;
        }
        return false;
      }
      this.#values[index] = constrained;
      this.#updateThumbPosition(index);
      this.#updateThumbAccessibility(index);
      this.#updateRange();
      this.#reflectValueAttribute();
      this.#updateFormValue();
      if (emit) {
        this.#emitInput();
        this.#keyValueChanged = true;
      }
      if (commit) {
        this.#emitChange();
        this.#keyValueChanged = false;
      }
      return true;
    }

    /**
     * @param {number} index
     * @param {number} value
     */
    #constrainValue(index, value) {
      const aligned = snapToStep(clamp(value, this.#min, this.#max), this.#step, this.#min);
      if (index === -1) {
        return aligned;
      }
      const min = this.#getThumbMin(index);
      const max = this.#getThumbMax(index);
      return clamp(aligned, min, max);
    }

    #emitInput() {
      const event = new Event('input', { bubbles: true, composed: true });
      this.dispatchEvent(event);
    }

    #emitChange() {
      const event = new Event('change', { bubbles: true });
      this.dispatchEvent(event);
    }

    /**
     * @param {PointerEvent} event
     */
    #handleTrackPointerDown = (event) => {
      if (this.#disabled || event.button !== 0) {
        return;
      }
      event.preventDefault();
      const percent = this.#percentFromPointer(event);
      const value = this.#percentToValue(percent);
      const index = this.#findNearestThumb(value);
      this.#setFocusedIndex(index);
      const thumb = this.#thumbs[index];
      thumb?.focus({ preventScroll: true });
      this.#setThumbValue(index, value, { emit: true });
      if (thumb) {
        this.#startPointerDrag(thumb, index, event);
      }
    };

    /**
     * @param {PointerEvent} event
     * @param {number} index
     */
    #handleThumbPointerDown(event, index) {
      if (this.#disabled || event.button !== 0) {
        return;
      }
      event.preventDefault();
      const thumb = this.#thumbs[index];
      if (!thumb) {
        return;
      }
      this.#setFocusedIndex(index);
      thumb.focus({ preventScroll: true });
      this.#startPointerDrag(thumb, index, event);
    }

    /**
     * @param {HTMLElement} thumb
     * @param {number} index
     * @param {PointerEvent} event
     */
    #startPointerDrag(thumb, index, event) {
      thumb.setPointerCapture(event.pointerId);

      const move = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId) {
          return;
        }
        const percent = this.#percentFromPointer(moveEvent);
        const value = this.#percentToValue(percent);
        this.#setThumbValue(index, value, { emit: true });
      };

      const end = (endEvent) => {
        if (endEvent.pointerId !== event.pointerId) {
          return;
        }
        thumb.removeEventListener('pointermove', move);
        thumb.removeEventListener('pointerup', end);
        thumb.removeEventListener('pointercancel', end);
        thumb.releasePointerCapture(event.pointerId);
        const percent = this.#percentFromPointer(endEvent);
        const value = this.#percentToValue(percent);
        this.#setThumbValue(index, value, { emit: true, commit: true });
      };

      thumb.addEventListener('pointermove', move);
      thumb.addEventListener('pointerup', end);
      thumb.addEventListener('pointercancel', end);
    }

    /**
     * @param {PointerEvent} event
     * @returns {number}
     */
    #percentFromPointer(event) {
      const rect = this.#track.getBoundingClientRect();
      if (this.#orientation === 'horizontal') {
        const width = rect.width || 1;
        const percent = ((event.clientX - rect.left) / width) * 100;
        return clamp(percent, 0, 100);
      }
      const height = rect.height || 1;
      const percent = ((rect.bottom - event.clientY) / height) * 100;
      return clamp(percent, 0, 100);
    }

    /**
     * @param {KeyboardEvent} event
     * @param {number} index
     */
    #handleThumbKeyDown(event, index) {
      if (this.#disabled) {
        return;
      }
      let handled = true;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          this.#stepThumb(index, 1);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          this.#stepThumb(index, -1);
          break;
        case 'PageUp':
          this.#stepThumb(index, 10);
          break;
        case 'PageDown':
          this.#stepThumb(index, -10);
          break;
        case 'Home': {
          const min = this.#getThumbMin(index);
          this.#setThumbValue(index, min, { emit: true });
          break;
        }
        case 'End': {
          const max = this.#getThumbMax(index);
          this.#setThumbValue(index, max, { emit: true });
          break;
        }
        default:
          handled = false;
          break;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    /**
     * @param {KeyboardEvent} event
     */
    #handleThumbKeyUp(event) {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'ArrowDown':
        case 'PageUp':
        case 'PageDown':
        case 'Home':
        case 'End':
          if (this.#keyValueChanged) {
            this.#emitChange();
            this.#keyValueChanged = false;
          }
          break;
        default:
          break;
      }
    }

    /**
     * @param {number} index
     * @param {number} multiplier
     */
    #stepThumb(index, multiplier) {
      const delta = this.#step * multiplier;
      const next = this.#values[index] + delta;
      this.#setThumbValue(index, next, { emit: true });
    }

    /**
     * @param {number} value
     */
    #findNearestThumb(value) {
      let bestIndex = 0;
      let smallestDistance = Infinity;
      this.#values.forEach((current, index) => {
        const distance = Math.abs(current - value);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          bestIndex = index;
        }
      });
      return bestIndex;
    }

    /**
     * @param {number} index
     */
    #setFocusedIndex(index) {
      if (index === this.#focusedIndex) {
        return;
      }
      if (index < 0 || index >= this.#thumbs.length) {
        return;
      }
      this.#focusedIndex = index;
      this.#thumbs.forEach((thumb, thumbIndex) => {
        thumb.tabIndex = thumbIndex === this.#focusedIndex && !this.#disabled ? 0 : -1;
      });
    }
  }

  if (!customElements.get('wc-slider')) {
    customElements.define('wc-slider', WcSlider);
  }
})();

/**
 * @file aspect-ratio.js
 * @version 1.0.0
 *
 * Responsive container component that constrains slotted content to a fixed aspect ratio.
 * Implements the classic padding-bottom technique for broad browser support while exposing
 * rich styling hooks via CSS custom properties and parts.
 *
 * Usage:
 * <wc-aspect-ratio ratio="16/9" style="max-width: 320px;">
 *   <img src="https://..." alt="Example" />
 * </wc-aspect-ratio>
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
   * Parses user supplied ratio strings or numbers into a positive decimal ratio.
   *
   * @param {string | number | null | undefined} value
   * @returns {number | null}
   */
  const parseRatio = (value) => {
    if (value == null) {
      return null;
    }

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    const text = String(value).trim();
    if (text === '') {
      return null;
    }

    const normalized = text.replace(/\s+/g, '');

    if (normalized.includes('/') || normalized.includes(':')) {
      const separator = normalized.includes('/') ? '/' : ':';
      const [rawWidth, rawHeight] = normalized.split(separator);
      const width = Number.parseFloat(rawWidth);
      const height = Number.parseFloat(rawHeight);
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        return width / height;
      }
      return null;
    }

    const numeric = Number.parseFloat(normalized);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }

    return null;
  };

  /**
   * Normalizes numbers for CSS consumption (avoids scientific notation).
   *
   * @param {number} value
   * @returns {string}
   */
  const formatNumber = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return '1';
    }
    if (Number.isInteger(value)) {
      return String(value);
    }
    return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  };

  /**
   * Converts a raw ratio string into a CSS-ready expression (e.g. "16 / 9").
   * Falls back to the decimal representation when necessary.
   *
   * @param {string | null} source
   * @param {number} fallback
   * @returns {string}
   */
  const toCssExpression = (source, fallback) => {
    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (trimmed.includes('/') || trimmed.includes(':')) {
        const separator = trimmed.includes('/') ? '/' : ':';
        const [rawWidth, rawHeight] = trimmed.split(separator);
        const width = Number.parseFloat(rawWidth);
        const height = Number.parseFloat(rawHeight);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          return `${formatNumber(width)} / ${formatNumber(height)}`;
        }
      }
      const numeric = Number.parseFloat(trimmed);
      if (Number.isFinite(numeric) && numeric > 0) {
        return formatNumber(numeric);
      }
    }
    return formatNumber(fallback);
  };

  class WcAspectRatio extends HTMLElement {
    static get observedAttributes() {
      return ['ratio'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {number} */
    #ratio = 1;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            max-width: 100%;
            position: relative;
            --aspect-ratio-ratio: 1;
            --aspect-ratio-expression: 1;
            --aspect-ratio-fallback-percent: 100%;
            --aspect-ratio-background: transparent;
            --aspect-ratio-border-radius: 0.75rem;
            --aspect-ratio-overflow: hidden;
            --aspect-ratio-border: none;
            --aspect-ratio-shadow: none;
            --aspect-ratio-content-align: center;
            --aspect-ratio-content-justify: center;
          }

          [part="frame"] {
            width: 100%;
            position: relative;
            background: var(--aspect-ratio-background);
            border-radius: var(--aspect-ratio-border-radius);
            overflow: var(--aspect-ratio-overflow);
            border: var(--aspect-ratio-border);
            box-shadow: var(--aspect-ratio-shadow);
            aspect-ratio: var(
              --aspect-ratio-expression,
              var(--aspect-ratio-ratio, 1)
            );
          }

          [part="sizer"] {
            pointer-events: none;
            width: 100%;
            padding-bottom: var(
              --aspect-ratio-fallback-percent,
              calc(100% / var(--aspect-ratio-ratio, 1))
            );
          }

          [part="content"] {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: var(--aspect-ratio-content-align);
            justify-content: var(--aspect-ratio-content-justify);
            width: 100%;
            height: 100%;
          }

          ::slotted(img),
          ::slotted(video),
          ::slotted(iframe),
          ::slotted(picture),
          ::slotted(canvas) {
            width: 100%;
            height: 100%;
            object-fit: var(--aspect-ratio-object-fit, cover);
          }
        </style>
        <div part="frame" aria-live="off">
          <div part="sizer" aria-hidden="true"></div>
          <div part="content">
            <slot></slot>
          </div>
        </div>
      `;
    }

    connectedCallback() {
      upgradeProperty(this, 'ratio');
      this.#applyRatio(this.getAttribute('ratio'));
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'ratio') {
        this.#applyRatio(newValue);
      }
    }

    /**
     * Numeric ratio representing width / height.
     * @returns {number}
     */
    get ratio() {
      return this.#ratio;
    }

    /**
     * Accepts numbers or ratio strings (e.g. "16/9", "4:3", "1.5").
     * @param {number | string | null | undefined} value
     */
    set ratio(value) {
      if (value == null || value === '') {
        this.removeAttribute('ratio');
        return;
      }
      const parsed = parseRatio(value);
      if (parsed === null) {
        return;
      }
      const reflected = typeof value === 'string' ? value : formatNumber(parsed);
      if (this.getAttribute('ratio') !== reflected) {
        this.setAttribute('ratio', reflected);
      }
    }

    /**
     * Applies the ratio to CSS custom properties and updates internals.
     *
     * @param {string | null} raw
     */
    #applyRatio(raw) {
      const parsed = parseRatio(raw);
      if (parsed === null) {
        this.#ratio = 1;
        this.style.setProperty('--aspect-ratio-ratio', '1');
        this.style.setProperty('--aspect-ratio-expression', '1');
        this.style.setProperty('--aspect-ratio-fallback-percent', '100%');
        if (raw !== null) {
          this.removeAttribute('ratio');
        }
        return;
      }

      this.#ratio = parsed;
      const cssNumber = formatNumber(parsed);
      const expression = toCssExpression(raw, parsed);
      const fallbackPercent = `${formatNumber(1 / parsed * 100)}%`;

      this.style.setProperty('--aspect-ratio-ratio', cssNumber);
      this.style.setProperty('--aspect-ratio-expression', expression);
      this.style.setProperty('--aspect-ratio-fallback-percent', fallbackPercent);
    }
  }

  if (!customElements.get('wc-aspect-ratio')) {
    customElements.define('wc-aspect-ratio', WcAspectRatio);
  }

  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.WcAspectRatio = WcAspectRatio;
  }
})();

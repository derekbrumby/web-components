/**
 * @file ascii-icon.js
 * @version 1.1.0
 *
 * `<wc-ascii-icon>` renders a monochrome SVG path as ASCII art inside an SVG text grid.
 * Provide a `path` attribute with the SVG path data (`d` attribute) from a single-colour icon
 * and the component will approximate the silhouette using repeated characters. The output
 * is resolution independent thanks to the generated SVG wrapper and can be styled via CSS
 * custom properties.
 *
 * Usage:
 * ```html
 * <wc-ascii-icon path="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Zm-1 6.5v7l6-3.5l-6-3.5z"></wc-ascii-icon>
 * ```
 */

(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Ensure properties that were set before the element defined upgrade to attribute-backed setters.
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
   * Clamp a numeric value between a minimum and maximum.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  class WcAsciiIcon extends HTMLElement {
    static get observedAttributes() {
      return [
        'path',
        'character',
        'columns',
        'column',
        'rows',
        'row',
        'cell-size',
        'padding',
        'gap',
        'aria-label',
        'aria-labelledby',
        'aria-hidden',
        'role',
      ];
    }

    /** @type {SVGSVGElement} */
    #asciiSvg;
    /** @type {SVGGElement} */
    #textGroup;
    /** @type {SVGSVGElement} */
    #measureSvg;
    /** @type {SVGPathElement} */
    #measurePath;
    /** @type {boolean} */
    #isConnected = false;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          --wc-ascii-icon-size: 3rem;
          --wc-ascii-icon-character-color: currentColor;
          --wc-ascii-icon-background: transparent;
          --wc-ascii-icon-font-family: "Fira Code", "SFMono-Regular", "SFMono", "Roboto Mono", monospace;
          --wc-ascii-icon-font-weight: 700;
          --wc-ascii-icon-letter-spacing: 0;
          display: inline-block;
          color: var(--wc-ascii-icon-character-color);
        }

        :host([hidden]) {
          display: none !important;
        }

        [part="wrapper"] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--wc-ascii-icon-background);
        }

        svg[part="art"] {
          width: var(--wc-ascii-icon-size);
          height: var(--wc-ascii-icon-size);
          display: block;
          -webkit-user-select: none;
          user-select: none;
        }

        svg[part="art"] text {
          fill: currentColor;
          font-family: var(--wc-ascii-icon-font-family);
          font-weight: var(--wc-ascii-icon-font-weight);
          letter-spacing: var(--wc-ascii-icon-letter-spacing);
          text-anchor: middle;
          dominant-baseline: middle;
          pointer-events: none;
          -webkit-user-select: none;
          user-select: none;
        }

        svg[part="measure"] {
          position: absolute;
          width: 0;
          height: 0;
          overflow: hidden;
          visibility: hidden;
        }
      `;

      const wrapper = document.createElement('span');
      wrapper.setAttribute('part', 'wrapper');

      const asciiSvg = document.createElementNS(SVG_NS, 'svg');
      asciiSvg.setAttribute('part', 'art');
      asciiSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      asciiSvg.setAttribute('role', 'img');
      asciiSvg.setAttribute('focusable', 'false');
      this.#asciiSvg = asciiSvg;

      const textGroup = document.createElementNS(SVG_NS, 'g');
      textGroup.setAttribute('aria-hidden', 'true');
      textGroup.setAttribute('role', 'presentation');
      this.#textGroup = textGroup;
      this.#asciiSvg.append(textGroup);

      const measureSvg = document.createElementNS(SVG_NS, 'svg');
      measureSvg.setAttribute('part', 'measure');
      measureSvg.setAttribute('aria-hidden', 'true');
      const measurePath = document.createElementNS(SVG_NS, 'path');
      measurePath.setAttribute('fill', 'currentColor');
      measureSvg.append(measurePath);
      this.#measureSvg = measureSvg;
      this.#measurePath = measurePath;

      wrapper.append(this.#asciiSvg);
      root.append(style, wrapper, measureSvg);
    }

    connectedCallback() {
      this.#isConnected = true;
      upgradeProperty(this, 'path');
      upgradeProperty(this, 'character');
      upgradeProperty(this, 'columns');
      upgradeProperty(this, 'column');
      upgradeProperty(this, 'rows');
      upgradeProperty(this, 'row');
      upgradeProperty(this, 'cellSize');
      upgradeProperty(this, 'padding');
      upgradeProperty(this, 'gap');
      this.#syncAria();
      this.#render();
    }

    disconnectedCallback() {
      this.#isConnected = false;
    }

    attributeChangedCallback(name, _oldValue, _newValue) {
      if (!this.#isConnected) {
        return;
      }

      if (name === 'aria-label' || name === 'aria-labelledby' || name === 'aria-hidden' || name === 'role') {
        this.#syncAria();
        return;
      }

      this.#render();
    }

    /**
     * Read the first valid positive integer attribute from the provided names.
     * @param {...string} names
     * @returns {number | null}
     */
    #readPositiveIntegerAttribute(...names) {
      for (const name of names) {
        const value = this.getAttribute(name);
        if (value === null) {
          continue;
        }

        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          return Math.floor(parsed);
        }
      }

      return null;
    }

    /**
     * The SVG path data (`d` attribute) used to generate the ASCII silhouette.
     * @type {string | null}
     */
    get path() {
      const value = this.getAttribute('path');
      return value !== null ? value : null;
    }

    set path(value) {
      if (typeof value === 'string' && value.trim().length > 0) {
        this.setAttribute('path', value);
      } else {
        this.removeAttribute('path');
      }
    }

    /**
     * Character used to paint filled cells. Defaults to a full block character.
     * @type {string}
     */
    get character() {
      const value = this.getAttribute('character');
      return value && value.trim().length > 0 ? value : '█';
    }

    set character(value) {
      if (typeof value === 'string' && value.trim().length > 0) {
        this.setAttribute('character', value);
      } else {
        this.removeAttribute('character');
      }
    }

    /**
     * Preferred number of columns in the ASCII grid.
     * @type {number}
     */
    get columns() {
      const value = this.#readPositiveIntegerAttribute('columns', 'column');
      return value ?? 32;
    }

    set columns(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.setAttribute('columns', String(Math.floor(value)));
      } else {
        this.removeAttribute('columns');
      }
    }

    /**
     * Alias for `columns` allowing singular naming.
     * @type {number}
     */
    get column() {
      const value = this.#readPositiveIntegerAttribute('column', 'columns');
      return value ?? 32;
    }

    set column(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.setAttribute('column', String(Math.floor(value)));
      } else {
        this.removeAttribute('column');
      }
    }

    /**
     * Preferred number of rows in the ASCII grid.
     * @type {number}
     */
    get rows() {
      const value = this.#readPositiveIntegerAttribute('rows', 'row');
      return value ?? 32;
    }

    set rows(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.setAttribute('rows', String(Math.floor(value)));
      } else {
        this.removeAttribute('rows');
      }
    }

    /**
     * Alias for `rows` allowing singular naming.
     * @type {number}
     */
    get row() {
      const value = this.#readPositiveIntegerAttribute('row', 'rows');
      return value ?? 32;
    }

    set row(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.setAttribute('row', String(Math.floor(value)));
      } else {
        this.removeAttribute('row');
      }
    }

    /**
     * Target cell size in pixels before scaling. Acts as a hint when `columns`/`rows` are not set.
     * @type {number}
     */
    get cellSize() {
      const value = this.getAttribute('cell-size');
      const parsed = value === null ? NaN : Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
    }

    set cellSize(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        this.setAttribute('cell-size', String(value));
      } else {
        this.removeAttribute('cell-size');
      }
    }

    /**
     * Padding added around the measured icon (in the icon's coordinate system).
     * @type {number}
     */
    get padding() {
      const value = this.getAttribute('padding');
      const parsed = value === null ? NaN : Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    set padding(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        this.setAttribute('padding', String(value));
      } else {
        this.removeAttribute('padding');
      }
    }

    /**
     * Additional spacing (in SVG units) removed from each cell to create gutters between characters.
     * @type {number}
     */
    get gap() {
      const value = this.getAttribute('gap');
      const parsed = value === null ? NaN : Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    set gap(value) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        this.setAttribute('gap', String(value));
      } else {
        this.removeAttribute('gap');
      }
    }

    #syncAria() {
      const labelledBy = this.getAttribute('aria-labelledby');
      if (labelledBy) {
        this.#asciiSvg.setAttribute('aria-labelledby', labelledBy);
      } else {
        this.#asciiSvg.removeAttribute('aria-labelledby');
      }

      const label = this.getAttribute('aria-label');
      if (label) {
        this.#asciiSvg.setAttribute('aria-label', label);
      } else {
        this.#asciiSvg.removeAttribute('aria-label');
      }

      const ariaHidden = this.getAttribute('aria-hidden');
      if (ariaHidden !== null) {
        this.#asciiSvg.setAttribute('aria-hidden', ariaHidden);
      } else if (!label && !labelledBy) {
        this.#asciiSvg.setAttribute('aria-hidden', 'true');
      } else {
        this.#asciiSvg.removeAttribute('aria-hidden');
      }

      const role = this.getAttribute('role');
      if (role) {
        this.#asciiSvg.setAttribute('role', role);
      } else {
        this.#asciiSvg.setAttribute('role', 'img');
      }
    }

    #render() {
      const pathData = this.path;
      if (!pathData) {
        this.#textGroup.replaceChildren();
        this.#asciiSvg.removeAttribute('viewBox');
        return;
      }

      try {
        this.#measurePath.setAttribute('d', pathData);
      } catch (error) {
        console.warn('[wc-ascii-icon] Invalid path data provided:', error);
        this.#textGroup.replaceChildren();
        this.#asciiSvg.removeAttribute('viewBox');
        return;
      }

      let bbox;
      try {
        bbox = this.#measurePath.getBBox();
      } catch (error) {
        console.warn('[wc-ascii-icon] Unable to compute bounding box:', error);
        this.#textGroup.replaceChildren();
        this.#asciiSvg.removeAttribute('viewBox');
        return;
      }

      const padding = clamp(this.padding, 0, Number.MAX_SAFE_INTEGER);
      const minX = bbox.x - padding;
      const minY = bbox.y - padding;
      const width = Math.max(bbox.width + padding * 2, 1);
      const height = Math.max(bbox.height + padding * 2, 1);

      const columnHint = this.#readPositiveIntegerAttribute('columns', 'column');
      const rowHint = this.#readPositiveIntegerAttribute('rows', 'row');
      const cellSize = this.cellSize;
      const estimatedColumns = Math.max(2, Math.round(width / cellSize));
      const estimatedRows = Math.max(2, Math.round(height / cellSize));
      const defaultColumns = 32;
      const defaultRows = 32;
      const columns = clamp(columnHint ?? Math.max(defaultColumns, estimatedColumns), 2, 400);
      const rows = clamp(rowHint ?? Math.max(defaultRows, estimatedRows), 2, 400);

      const cellWidth = width / columns;
      const cellHeight = height / rows;
      const gap = clamp(this.gap, 0, Number.MAX_SAFE_INTEGER);
      const character = this.character;
      const fragment = document.createDocumentFragment();

      const svgPoint = new DOMPoint();
      let hasFill = false;

      for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
        const cy = minY + (rowIndex + 0.5) * cellHeight;
        for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
          const cx = minX + (columnIndex + 0.5) * cellWidth;
          svgPoint.x = cx;
          svgPoint.y = cy;

          let isFilled = false;
          if (typeof this.#measurePath.isPointInFill === 'function') {
            isFilled = this.#measurePath.isPointInFill(svgPoint);
          } else if (typeof this.#measurePath.isPointInStroke === 'function') {
            isFilled = this.#measurePath.isPointInStroke(svgPoint);
          }

          if (!isFilled) {
            continue;
          }

          hasFill = true;
          const text = document.createElementNS(SVG_NS, 'text');
          text.textContent = character;
          text.setAttribute('aria-hidden', 'true');
          text.setAttribute('role', 'presentation');
          text.setAttribute('x', String((columnIndex + 0.5) * cellWidth));
          text.setAttribute('y', String((rowIndex + 0.5) * cellHeight));
          const maxCellSize = Math.min(cellWidth, cellHeight);
          const adjustedSize = Math.max(0, maxCellSize - gap);
          text.setAttribute('font-size', String(adjustedSize * 0.95));
          fragment.append(text);
        }
      }

      this.#asciiSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      this.#textGroup.replaceChildren(fragment);

      if (!hasFill) {
        console.warn('[wc-ascii-icon] The provided path produced no filled cells.');
      }
    }
  }

  if (!customElements.get('wc-ascii-icon')) {
    customElements.define('wc-ascii-icon', WcAsciiIcon);
  }
})();

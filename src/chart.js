/**
 * @file chart.js
 * @version 1.0.0
 *
 * Interactive, accessible chart web component for rendering grouped bar charts
 * without external dependencies. The component accepts arbitrary data and a
 * configuration object describing each series. Colors and layout can be
 * customized through CSS custom properties and `::part` selectors.
 *
 * Example:
 * ```html
 * <script type="module" src="https://cdn.example.com/web-components/chart.js"></script>
 *
 * <wc-chart id="traffic-chart" caption="Monthly visitors"></wc-chart>
 * <script type="module">
 *   const chart = document.getElementById('traffic-chart');
 *   chart.categoryKey = 'month';
 *   chart.config = {
 *     desktop: { label: 'Desktop', color: 'hsl(221 83% 53%)' },
 *     mobile: { label: 'Mobile', color: 'hsl(213 94% 68%)' },
 *   };
 *   chart.data = [
 *     { month: 'January', desktop: 186, mobile: 80 },
 *     { month: 'February', desktop: 305, mobile: 200 },
 *   ];
 * </script>
 * ```
 */

(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEFAULT_COLORS = ['#2563eb', '#60a5fa', '#f97316', '#22c55e', '#a855f7'];
  let instanceCount = 0;

  const toArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item === 'object' && item !== null)
      .map((item) => ({ ...item }));
  };

  const parseJson = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const parseData = (value) => {
    const parsed = typeof value === 'string' ? parseJson(value) : value;
    return toArray(parsed);
  };

  const parseConfig = (value) => {
    const parsed = typeof value === 'string' ? parseJson(value) : value;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    /** @type {Record<string, { label?: string; color?: string }>} */
    const normalised = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== 'object') continue;
      const { label, color } = /** @type {{ label?: string; color?: string }} */ (entry);
      normalised[key] = {};
      if (typeof label === 'string') {
        normalised[key].label = label;
      }
      if (typeof color === 'string') {
        normalised[key].color = color;
      }
    }
    return normalised;
  };

  const formatSeriesName = (key) => {
    return key
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, (_, a, b) => `${a} ${b}`)
      .replace(/^\w/, (char) => char.toUpperCase());
  };

  const getNiceTicks = (maxValue, tickCount = 4) => {
    if (!Number.isFinite(maxValue) || maxValue <= 0) {
      return Array.from({ length: tickCount + 1 }, (_, index) => index);
    }

    const roughStep = maxValue / tickCount;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const residual = roughStep / magnitude;

    let niceResidual;
    if (residual < 1.5) niceResidual = 1;
    else if (residual < 3) niceResidual = 2;
    else if (residual < 7) niceResidual = 5;
    else niceResidual = 10;

    const niceStep = niceResidual * magnitude;
    const niceMax = Math.ceil(maxValue / niceStep) * niceStep;
    return Array.from({ length: tickCount + 1 }, (_, index) => index * niceStep);
  };

  const template = document.createElement('template');
  template.innerHTML = /* html */ `
    <style>
      :host {
        --wc-chart-background: rgba(255, 255, 255, 0.76);
        --wc-chart-foreground: rgb(15, 23, 42);
        --wc-chart-border: rgba(148, 163, 184, 0.4);
        --wc-chart-grid: rgba(148, 163, 184, 0.35);
        --wc-chart-muted: rgba(100, 116, 139, 0.85);
        --wc-chart-tooltip-background: rgba(15, 23, 42, 0.92);
        --wc-chart-tooltip-foreground: rgba(255, 255, 255, 0.95);
        --wc-chart-tooltip-muted: rgba(226, 232, 240, 0.7);
        --wc-chart-bar-radius: 8;
        display: block;
        color: var(--wc-chart-foreground);
        font-family: inherit;
      }

      :host([hidden]) {
        display: none !important;
      }

      figure {
        margin: 0;
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        background: var(--wc-chart-background);
        border-radius: 1rem;
        border: 1px solid var(--wc-chart-border);
        box-shadow: 0 36px 64px -40px rgba(15, 23, 42, 0.4);
        position: relative;
        overflow: hidden;
      }

      .chart__body {
        position: relative;
      }

      svg {
        display: block;
        inline-size: 100%;
        block-size: auto;
        min-block-size: 14rem;
      }

      .chart__legend[hidden] {
        display: none;
      }

      .chart__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        align-items: center;
        color: var(--wc-chart-muted);
        font-size: 0.9rem;
      }

      .chart__legend-list {
        display: contents;
      }

      .chart__legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
      }

      .chart__legend-color {
        inline-size: 0.8rem;
        block-size: 0.8rem;
        border-radius: 999px;
        background: currentColor;
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.1);
      }

      .chart__tooltip[hidden] {
        display: none;
      }

      .chart__tooltip {
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-9999px, -9999px);
        padding: 0.65rem 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: var(--wc-chart-tooltip-background);
        color: var(--wc-chart-tooltip-foreground);
        box-shadow: 0 18px 36px -20px rgba(15, 23, 42, 0.65);
        font-size: 0.75rem;
        display: grid;
        gap: 0.5rem;
        min-inline-size: 9rem;
        pointer-events: none;
        z-index: 10;
      }

      .chart__tooltip-label {
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .chart__tooltip-rows {
        display: grid;
        gap: 0.35rem;
      }

      .chart__tooltip-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.35rem;
        color: var(--wc-chart-tooltip-muted);
      }

      .chart__tooltip-dot {
        inline-size: 0.65rem;
        block-size: 0.65rem;
        border-radius: 999px;
        background: var(--tooltip-color, currentColor);
        box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35);
      }

      .chart__tooltip-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chart__tooltip-value {
        font-variant-numeric: tabular-nums;
        color: var(--wc-chart-tooltip-foreground);
        font-weight: 600;
      }

      .chart__empty[hidden] {
        display: none;
      }

      .chart__empty {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--wc-chart-muted);
        font-size: 0.95rem;
        padding: 1.5rem;
        text-align: center;
        pointer-events: none;
      }

      .chart__grid-line {
        stroke: var(--wc-chart-grid);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }

      .chart__grid-line.is-baseline {
        stroke: rgba(15, 23, 42, 0.2);
      }

      .chart__axis-label {
        fill: var(--wc-chart-muted);
        font-size: 0.75rem;
        letter-spacing: 0.01em;
      }

      .chart__bar {
        transition: opacity 160ms ease, transform 160ms ease;
        opacity: 0.9;
      }

      .chart__bar:is(:hover, :focus-visible),
      .chart__bar.is-active {
        opacity: 1;
        transform: translateY(-1px);
      }

      .chart__bar:focus-visible {
        outline: none;
      }

      @media (max-width: 720px) {
        figure {
          padding: 1rem;
        }

        .chart__legend {
          font-size: 0.8rem;
        }
      }
    </style>
    <figure part="container" class="chart">
      <figcaption class="chart__legend" part="legend" hidden></figcaption>
      <div class="chart__body">
        <svg part="chart" class="chart__svg" role="img" aria-hidden="false" focusable="false"></svg>
        <div class="chart__empty" part="empty" hidden>No data available</div>
      </div>
      <div class="chart__tooltip" part="tooltip" role="tooltip" hidden></div>
    </figure>
  `;

  /**
   * @typedef {Object} ChartBarDetail
   * @property {SVGRectElement} element
   * @property {number} dataIndex
   * @property {string} category
   * @property {string} seriesKey
   * @property {string} seriesLabel
   * @property {number} value
   * @property {string} color
   */

  class ChartElement extends HTMLElement {
    /** @type {Array<Record<string, any>>} */
    #data = [];
    /** @type {Record<string, { label?: string; color?: string }>} */
    #config = {};
    #categoryKey = 'category';
    #hideLegend = false;
    /** @type {ChartBarDetail | null} */
    #activeDetail = null;
    #legendId;
    #legend;
    #svg;
    #tooltip;
    #empty;
    #seriesKeys = [];
    #formatter;
    #resizeObserver;
    #hideTooltipBound;

    constructor() {
      super();
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));

      this.#legend = shadowRoot.querySelector('.chart__legend');
      this.#svg = shadowRoot.querySelector('svg');
      this.#tooltip = shadowRoot.querySelector('.chart__tooltip');
      this.#empty = shadowRoot.querySelector('.chart__empty');
      this.#legendId = `wc-chart-legend-${++instanceCount}`;
      this.#legend.id = this.#legendId;
      this.#hideTooltipBound = this.#hideTooltip.bind(this);

      if ('Intl' in globalThis && typeof Intl.NumberFormat === 'function') {
        const locale =
          'navigator' in globalThis && typeof globalThis.navigator?.language === 'string'
            ? globalThis.navigator.language
            : undefined;
        this.#formatter = new Intl.NumberFormat(locale);
      }

      if ('ResizeObserver' in globalThis) {
        this.#resizeObserver = new ResizeObserver(() => {
          if (this.#activeDetail) {
            this.#positionTooltip(this.#activeDetail);
          }
        });
      }
    }

    static get observedAttributes() {
      return ['data', 'config', 'category-key', 'hide-legend', 'caption', 'aria-label'];
    }

    /**
     * Chart data represented as an array of records. Each record should contain
     * the `categoryKey` and numeric series values.
     * @type {Array<Record<string, any>>}
     */
    get data() {
      return toArray(this.#data);
    }

    set data(value) {
      this.#data = toArray(value);
      this.#render();
    }

    /**
     * Configuration describing series metadata like labels and colors.
     * @type {Record<string, { label?: string; color?: string }>}
     */
    get config() {
      return parseConfig(this.#config);
    }

    set config(value) {
      this.#config = parseConfig(value);
      this.#render();
    }

    /**
     * Property name in each data object representing the category label.
     * @type {string}
     */
    get categoryKey() {
      return this.#categoryKey;
    }

    set categoryKey(value) {
      this.#categoryKey = typeof value === 'string' && value.trim() ? value.trim() : 'category';
      this.#render();
    }

    /**
     * Hide the rendered legend when set to `true`.
     * @type {boolean}
     */
    get hideLegend() {
      return this.#hideLegend;
    }

    set hideLegend(value) {
      const shouldHide = Boolean(value);
      if (shouldHide) {
        this.setAttribute('hide-legend', '');
      } else {
        this.removeAttribute('hide-legend');
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      switch (name) {
        case 'data':
          this.#data = parseData(newValue);
          this.#render();
          break;
        case 'config':
          this.#config = parseConfig(newValue);
          this.#render();
          break;
        case 'category-key':
          this.#categoryKey = newValue && newValue.trim() ? newValue.trim() : 'category';
          this.#render();
          break;
        case 'hide-legend':
          this.#hideLegend = newValue !== null;
          this.#render();
          break;
        case 'caption':
        case 'aria-label':
          this.#updateAriaLabel();
          break;
        default:
          break;
      }
    }

    connectedCallback() {
      this.#upgradeProperty('data');
      this.#upgradeProperty('config');
      this.#upgradeProperty('categoryKey');
      this.#upgradeProperty('hideLegend');

      if (this.#resizeObserver) {
        this.#resizeObserver.observe(this);
      }

      this.#render();
    }

    disconnectedCallback() {
      this.#hideTooltip();
      if (this.#resizeObserver) {
        this.#resizeObserver.disconnect();
      }
    }

    /**
     * @param {keyof this} property
     */
    #upgradeProperty(property) {
      if (Object.prototype.hasOwnProperty.call(this, property)) {
        const value = /** @type {any} */ (this)[property];
        delete /** @type {any} */ (this)[property];
        /** @type {any} */ (this)[property] = value;
      }
    }

    #render() {
      if (!this.isConnected) return;

      this.#svg.setAttribute('viewBox', '0 0 640 360');
      this.#svg.setAttribute('preserveAspectRatio', 'none');

      this.#svg.replaceChildren();
      this.#hideTooltip();

      const data = this.#data;
      const seriesKeys = this.#resolveSeriesKeys();
      this.#seriesKeys = seriesKeys;

      if (!data.length || !seriesKeys.length) {
        this.#legend.hidden = true;
        this.#svg.removeAttribute('aria-describedby');
        this.#empty.hidden = false;
        this.#updateAriaLabel();
        return;
      }

      this.#empty.hidden = true;

      this.#renderLegend(seriesKeys);
      this.#renderChart(seriesKeys);
    }

    #resolveSeriesKeys() {
      const configKeys = Object.keys(this.#config);
      if (configKeys.length > 0) {
        return configKeys;
      }

      const first = this.#data[0];
      if (!first || typeof first !== 'object') {
        return [];
      }

      return Object.keys(first).filter((key) => {
        if (key === this.#categoryKey) return false;
        const value = Number(first[key]);
        return Number.isFinite(value);
      });
    }

    /**
     * @param {string[]} seriesKeys
     */
    #renderLegend(seriesKeys) {
      if (this.#hideLegend) {
        this.#legend.hidden = true;
        this.#svg.removeAttribute('aria-describedby');
        this.#legend.replaceChildren();
        return;
      }

      const fragment = document.createDocumentFragment();
      const list = document.createElement('div');
      list.className = 'chart__legend-list';
      list.setAttribute('role', 'list');

      seriesKeys.forEach((key, index) => {
        const item = document.createElement('span');
        item.className = 'chart__legend-item';
        item.dataset.series = key;
        item.setAttribute('role', 'listitem');
        item.style.color = this.#resolveColor(key, index);

        const swatch = document.createElement('span');
        swatch.className = 'chart__legend-color';
        swatch.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.textContent = this.#resolveSeriesLabel(key);

        item.append(swatch, label);
        list.append(item);
      });

      fragment.append(list);
      this.#legend.replaceChildren(fragment);
      this.#legend.hidden = false;
      this.#svg.setAttribute('aria-describedby', this.#legendId);
    }

    /**
     * @param {string[]} seriesKeys
     */
    #renderChart(seriesKeys) {
      const width = 640;
      const height = 360;
      const padding = { top: 32, right: 32, bottom: 64, left: 68 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      const gridGroup = document.createElementNS(SVG_NS, 'g');
      const barsGroup = document.createElementNS(SVG_NS, 'g');
      const axisGroup = document.createElementNS(SVG_NS, 'g');

      const categories = this.#data.map((item) => {
        const value = item?.[this.#categoryKey];
        return value == null ? '' : String(value);
      });

      const maxValue = this.#data.reduce((acc, entry) => {
        const values = seriesKeys.map((key) => Number(entry?.[key]) || 0);
        return Math.max(acc, ...values);
      }, 0);

      const tickValues = getNiceTicks(maxValue, 4);
      const niceMax = tickValues[tickValues.length - 1] || 1;

      const scaleY = (value) => {
        const numeric = Number(value) || 0;
        const ratio = Math.min(Math.max(numeric / niceMax, 0), 1);
        return padding.top + chartHeight - ratio * chartHeight;
      };

      tickValues.forEach((value, index) => {
        const y = scaleY(value);
        const line = document.createElementNS(SVG_NS, 'line');
        line.classList.add('chart__grid-line');
        if (index === 0) {
          line.classList.add('is-baseline');
        }
        line.setAttribute('x1', String(padding.left));
        line.setAttribute('x2', String(width - padding.right));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        gridGroup.append(line);

        const label = document.createElementNS(SVG_NS, 'text');
        label.classList.add('chart__axis-label');
        label.setAttribute('x', String(padding.left - 12));
        label.setAttribute('y', String(y));
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.textContent = this.#formatNumber(value);
        axisGroup.append(label);
      });

      const groupWidth = chartWidth / Math.max(categories.length, 1);
      const clusterWidth = Math.min(groupWidth * 0.8, 120);
      const effectiveClusterWidth = Math.max(clusterWidth, Math.min(groupWidth, 18));
      const gap =
        seriesKeys.length > 1
          ? Math.min(12, (effectiveClusterWidth * 0.2) / Math.max(seriesKeys.length - 1, 1))
          : 0;
      const barWidth =
        (effectiveClusterWidth - gap * Math.max(seriesKeys.length - 1, 0)) / Math.max(seriesKeys.length, 1);
      const barRadius = Number.parseFloat(getComputedStyle(this).getPropertyValue('--wc-chart-bar-radius')) || 0;

      categories.forEach((category, dataIndex) => {
        const startX = padding.left + dataIndex * groupWidth + (groupWidth - effectiveClusterWidth) / 2;
        seriesKeys.forEach((key, seriesIndex) => {
          const rawValue = Number(this.#data[dataIndex]?.[key]) || 0;
          const x = startX + seriesIndex * (barWidth + gap);
          const y = scaleY(rawValue);
          const barHeight = padding.top + chartHeight - y;
          const color = this.#resolveColor(key, seriesIndex);

          const rect = document.createElementNS(SVG_NS, 'rect');
          rect.classList.add('chart__bar');
          rect.setAttribute('x', String(x));
          rect.setAttribute('y', String(y));
          rect.setAttribute('width', String(Math.max(barWidth, 2)));
          rect.setAttribute('height', String(Math.max(barHeight, 0)));
          rect.setAttribute('fill', color);
          rect.setAttribute('rx', String(barRadius));
          rect.setAttribute('tabindex', '0');
          rect.setAttribute('role', 'presentation');

          const title = document.createElementNS(SVG_NS, 'title');
          title.textContent = `${this.#resolveSeriesLabel(key)} — ${category}: ${this.#formatNumber(rawValue)}`;
          rect.append(title);

          const detail = {
            element: rect,
            dataIndex,
            category,
            seriesKey: key,
            seriesLabel: this.#resolveSeriesLabel(key),
            value: rawValue,
            color,
          };

          rect.addEventListener('pointerenter', () => {
            this.#activeDetail = detail;
            this.#showTooltip(detail);
          });
          rect.addEventListener('pointermove', () => {
            if (this.#activeDetail === detail) {
              this.#positionTooltip(detail);
            }
          });
          rect.addEventListener('pointerleave', this.#hideTooltipBound);
          rect.addEventListener('focus', () => {
            this.#activeDetail = detail;
            this.#showTooltip(detail);
          });
          rect.addEventListener('blur', this.#hideTooltipBound);
          rect.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.#activeDetail = detail;
              this.#showTooltip(detail);
            }
            if (event.key === 'Escape') {
              this.#hideTooltip();
            }
          });

          barsGroup.append(rect);
        });

        const label = document.createElementNS(SVG_NS, 'text');
        label.classList.add('chart__axis-label');
        label.setAttribute('x', String(padding.left + dataIndex * groupWidth + groupWidth / 2));
        label.setAttribute('y', String(padding.top + chartHeight + 24));
        label.setAttribute('text-anchor', 'middle');
        label.textContent = category;
        axisGroup.append(label);
      });

      this.#svg.append(gridGroup, barsGroup, axisGroup);
      this.#updateAriaLabel();
    }

    #resolveSeriesLabel(key) {
      const configured = this.#config[key]?.label;
      return typeof configured === 'string' && configured.trim() ? configured : formatSeriesName(key);
    }

    #resolveColor(key, index) {
      const configured = this.#config[key]?.color;
      if (typeof configured === 'string' && configured.trim()) {
        return configured;
      }
      return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    }

    #updateAriaLabel() {
      const explicit = this.getAttribute('aria-label') || this.getAttribute('caption');
      const label = explicit || 'Chart';
      this.#svg.setAttribute('aria-label', label);
    }

    #formatNumber(value) {
      const numeric = Number(value) || 0;
      if (this.#formatter && typeof this.#formatter.format === 'function') {
        return this.#formatter.format(numeric);
      }
      return String(numeric);
    }

    /**
     * @param {ChartBarDetail} detail
     */
    #showTooltip(detail) {
      if (!detail || !detail.element.isConnected) return;

      if (this.#activeDetail && this.#activeDetail.element !== detail.element) {
        this.#activeDetail.element.classList.remove('is-active');
      }

      this.#activeDetail = detail;
      detail.element.classList.add('is-active');

      const tooltip = this.#tooltip;
      tooltip.replaceChildren();

      const label = document.createElement('div');
      label.className = 'chart__tooltip-label';
      label.textContent = detail.category || this.getAttribute('aria-label') || 'Value';
      tooltip.append(label);

      const rows = document.createElement('div');
      rows.className = 'chart__tooltip-rows';

      const entry = this.#data[detail.dataIndex] || {};
      this.#seriesKeys.forEach((key, index) => {
        const row = document.createElement('div');
        row.className = 'chart__tooltip-row';

        const dot = document.createElement('span');
        dot.className = 'chart__tooltip-dot';
        dot.style.setProperty('--tooltip-color', this.#resolveColor(key, index));
        dot.setAttribute('aria-hidden', 'true');

        const name = document.createElement('span');
        name.className = 'chart__tooltip-name';
        name.textContent = this.#resolveSeriesLabel(key);

        const value = document.createElement('span');
        value.className = 'chart__tooltip-value';
        value.textContent = this.#formatNumber(entry?.[key]);

        row.append(dot, name, value);
        rows.append(row);
      });

      tooltip.append(rows);
      tooltip.hidden = false;
      tooltip.style.opacity = '1';
      this.#positionTooltip(detail);
    }

    /**
     * @param {ChartBarDetail} detail
     */
    #positionTooltip(detail) {
      const tooltip = this.#tooltip;
      if (!detail || tooltip.hidden) return;
      if (!detail.element.isConnected) {
        this.#hideTooltip();
        return;
      }

      const hostRect = this.getBoundingClientRect();
      const barRect = detail.element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let left = barRect.left + barRect.width / 2 - tooltipRect.width / 2 - hostRect.left;
      let top = barRect.top - tooltipRect.height - 12 - hostRect.top;

      if (left < 8) {
        left = 8;
      }
      const maxLeft = hostRect.width - tooltipRect.width - 8;
      if (left > maxLeft) {
        left = maxLeft;
      }

      if (top < 8) {
        top = barRect.bottom - hostRect.top + 12;
      }

      tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    }

    #hideTooltip() {
      if (this.#activeDetail?.element.isConnected) {
        this.#activeDetail.element.classList.remove('is-active');
      }
      this.#activeDetail = null;
      this.#tooltip.hidden = true;
      this.#tooltip.style.opacity = '0';
      this.#tooltip.style.transform = 'translate(-9999px, -9999px)';
      this.#tooltip.replaceChildren();
    }
  }

  if (!customElements.get('wc-chart')) {
    customElements.define('wc-chart', ChartElement);
  }
})();

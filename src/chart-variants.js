/**
 * @file chart-variants.js
 * @version 1.0.0
 *
 * Collection of zero-dependency chart web components covering area, line,
 * pie, radar, and radial bar visualisations. Each component mirrors the
 * ergonomics of `<wc-chart>` by accepting `data`, `config`, and
 * presentation-related attributes while remaining framework agnostic and
 * CDN friendly.
 */

(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEFAULT_COLORS = ['#2563eb', '#0ea5e9', '#22c55e', '#f97316', '#a855f7'];

  /**
   * @template T
   * @param {T | string | null | undefined} value
   * @returns {T | null}
   */
  const parseJson = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(String(value));
    } catch {
      return null;
    }
  };

  /**
   * @param {unknown} value
   * @returns {Array<Record<string, unknown>>}
   */
  const parseData = (value) => {
    if (Array.isArray(value)) {
      return value
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({ ...item }));
    }

    const parsed = parseJson(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({ ...item }));
    }

    return [];
  };

  /**
   * @typedef {{ label?: string; color?: string; icon?: string }} ChartSeries
   */

  /**
   * @param {unknown} value
   * @returns {Record<string, ChartSeries>}
   */
  const parseConfig = (value) => {
    const parsed = typeof value === 'string' ? parseJson(value) : value;
    if (!parsed || typeof parsed !== 'object') return {};

    const entries = /** @type {Record<string, ChartSeries>} */ ({});
    for (const [key, details] of Object.entries(parsed)) {
      if (!details || typeof details !== 'object') continue;
      const { label, color } = /** @type {ChartSeries} */ (details);
      entries[key] = {};
      if (typeof label === 'string') entries[key].label = label;
      if (typeof color === 'string') entries[key].color = color;
    }
    return entries;
  };

  /**
   * @param {number} maxValue
   * @param {number} tickCount
   * @returns {number[]}
   */
  const niceTicks = (maxValue, tickCount = 4) => {
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
    return Array.from({ length: tickCount + 1 }, (_, index) => index * niceStep).filter((tick) => tick <= niceMax + 1e-9);
  };

  const template = document.createElement('template');
  template.innerHTML = /* html */ `
    <style>
      :host {
        --wc-chart-background: rgba(255, 255, 255, 0.76);
        --wc-chart-foreground: rgb(15, 23, 42);
        --wc-chart-muted: rgba(100, 116, 139, 0.85);
        --wc-chart-border: rgba(148, 163, 184, 0.35);
        --wc-chart-grid: rgba(148, 163, 184, 0.25);
        --wc-chart-tooltip-background: rgba(15, 23, 42, 0.92);
        --wc-chart-tooltip-foreground: rgba(255, 255, 255, 0.95);
        --wc-chart-tooltip-muted: rgba(226, 232, 240, 0.7);
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
        border-radius: 1rem;
        border: 1px solid var(--wc-chart-border);
        background: var(--wc-chart-background);
        box-shadow: 0 36px 64px -40px rgba(15, 23, 42, 0.35);
        position: relative;
      }

      figcaption {
        display: grid;
        gap: 0.25rem;
      }

      .chart__title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .chart__description {
        margin: 0;
        font-size: 0.85rem;
        color: var(--wc-chart-muted);
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

      .chart__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        align-items: center;
        color: var(--wc-chart-muted);
        font-size: 0.85rem;
      }

      .chart__legend[hidden] {
        display: none;
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
        inline-size: 0.75rem;
        block-size: 0.75rem;
        border-radius: 999px;
        background: currentColor;
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.1);
      }

      .chart__tooltip {
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(-9999px, -9999px);
        padding: 0.65rem 0.75rem;
        border-radius: 0.75rem;
        background: var(--wc-chart-tooltip-background);
        color: var(--wc-chart-tooltip-foreground);
        font-size: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 18px 36px -20px rgba(15, 23, 42, 0.55);
        display: grid;
        gap: 0.35rem;
        min-inline-size: 8rem;
        pointer-events: none;
        transition: opacity 120ms ease;
        opacity: 0;
      }

      .chart__tooltip[data-visible="true"] {
        opacity: 1;
      }

      .chart__tooltip-heading {
        font-weight: 600;
        margin: 0;
      }

      .chart__tooltip-subtitle {
        margin: 0;
        color: var(--wc-chart-tooltip-muted);
      }

      .chart__tooltip-list {
        display: grid;
        gap: 0.25rem;
      }

      .chart__tooltip-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .chart__tooltip-label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .chart__tooltip-dot {
        inline-size: 0.6rem;
        block-size: 0.6rem;
        border-radius: 50%;
        background: currentColor;
      }
    </style>
    <figure part="container">
      <figcaption part="caption">
        <slot name="title" class="chart__title"></slot>
        <slot name="description" class="chart__description"></slot>
      </figcaption>
      <div class="chart__body" part="body">
        <svg part="svg" aria-hidden="true"></svg>
        <output class="chart__tooltip" role="presentation" hidden part="tooltip"></output>
      </div>
      <div class="chart__legend" part="legend" hidden>
        <dl class="chart__legend-list"></dl>
      </div>
    </figure>
  `;

  class BaseChartElement extends HTMLElement {
    static get observedAttributes() {
      return ['caption', 'category-key', 'legend'];
    }

    /** @type {Array<Record<string, unknown>>} */
    #data = [];
    /** @type {Record<string, ChartSeries>} */
    #config = {};
    #caption = '';
    #categoryKey = '';
    #legend = true;
    #raf = 0;

    /** @type {ShadowRoot} */
    #root;
    /** @type {SVGSVGElement} */
    #svg;
    /** @type {HTMLElement} */
    #legendElement;
    /** @type {HTMLElement} */
    #legendList;
    /** @type {HTMLOutputElement} */
    #tooltip;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.appendChild(template.content.cloneNode(true));
      this.#svg = /** @type {SVGSVGElement} */ (this.#root.querySelector('svg'));
      this.#legendElement = /** @type {HTMLElement} */ (this.#root.querySelector('.chart__legend'));
      this.#legendList = /** @type {HTMLElement} */ (this.#root.querySelector('.chart__legend-list'));
      this.#tooltip = /** @type {HTMLOutputElement} */ (this.#root.querySelector('.chart__tooltip'));
      const titleSlot = this.#root.querySelector('slot[name="title"]');
      if (titleSlot) {
        titleSlot.addEventListener('slotchange', () => {
          const assigned = titleSlot.assignedElements();
          if (assigned.length === 0 && this.#caption) {
            const heading = document.createElement('span');
            heading.textContent = this.#caption;
            heading.slot = 'title';
            this.appendChild(heading);
          }
        });
      }
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }
      this.#upgradeProperty('data');
      this.#upgradeProperty('config');
      this.#upgradeProperty('categoryKey');
      this.#upgradeProperty('legend');
      this.#render();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.#raf);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'caption':
          this.#caption = String(newValue ?? '');
          break;
        case 'category-key':
          this.#categoryKey = String(newValue ?? '');
          break;
        case 'legend':
          this.#legend = newValue !== 'false';
          break;
        default:
          break;
      }
      this.#render();
    }

    /**
     * @returns {Array<Record<string, unknown>>}
     */
    get data() {
      return this.#data.map((item) => ({ ...item }));
    }

    /**
     * @param {unknown} value
     */
    set data(value) {
      this.#data = parseData(value);
      this.#render();
    }

    /**
     * @returns {Record<string, ChartSeries>}
     */
    get config() {
      return { ...this.#config };
    }

    /**
     * @param {unknown} value
     */
    set config(value) {
      this.#config = parseConfig(value);
      this.#render();
    }

    /**
     * @returns {string}
     */
    get categoryKey() {
      return this.#categoryKey;
    }

    /**
     * @param {string} value
     */
    set categoryKey(value) {
      this.setAttribute('category-key', value);
    }

    /**
     * @returns {boolean}
     */
    get legend() {
      return this.#legend;
    }

    /**
     * @param {boolean} value
     */
    set legend(value) {
      this.setAttribute('legend', value ? 'true' : 'false');
    }

    /**
     * @protected
     * @returns {Array<Record<string, unknown>>}
     */
    getData() {
      return this.#data;
    }

    /**
     * @protected
     * @returns {Record<string, ChartSeries>}
     */
    getConfig() {
      return this.#config;
    }

    /**
     * @protected
     * @returns {SVGSVGElement}
     */
    getSvg() {
      return this.#svg;
    }

    /**
     * @protected
     * @returns {string}
     */
    getCaption() {
      return this.#caption;
    }

    /**
     * @protected
     * @returns {string}
     */
    getCategoryKey() {
      return this.#categoryKey;
    }

    /**
     * @protected
     * @returns {HTMLOutputElement}
     */
    getTooltip() {
      return this.#tooltip;
    }

    /**
     * @protected
     * @returns {HTMLElement}
     */
    getLegendElement() {
      return this.#legendElement;
    }

    /**
     * @protected
     * @returns {HTMLElement}
     */
    getLegendList() {
      return this.#legendList;
    }

    /**
     * @protected
     */
    updateLegend() {
      const config = this.#config;
      const legend = this.#legendElement;
      const legendList = this.#legendList;
      legendList.textContent = '';

      const seriesEntries = Object.entries(config);
      if (!this.#legend || seriesEntries.length === 0) {
        legend.hidden = true;
        return;
      }

      seriesEntries.forEach(([key, options], index) => {
        const item = document.createElement('div');
        item.className = 'chart__legend-item';

        const swatch = document.createElement('span');
        swatch.className = 'chart__legend-color';
        swatch.style.color = options.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

        const label = document.createElement('span');
        label.textContent = options.label || key;

        item.append(swatch, label);
        legendList.appendChild(item);
      });

      legend.hidden = false;
    }

    /**
     * @protected
     */
    clearSvg() {
      while (this.#svg.firstChild) {
        this.#svg.removeChild(this.#svg.firstChild);
      }
    }

    /**
     * @protected
     */
    resetTooltip() {
      const tooltip = this.#tooltip;
      tooltip.hidden = true;
      tooltip.dataset.visible = 'false';
    }

    /**
     * @protected
     */
    showTooltip(x, y, heading, items, subtitle) {
      const tooltip = this.#tooltip;
      tooltip.hidden = false;
      tooltip.dataset.visible = 'true';
      tooltip.style.transform = `translate(${x}px, ${y}px)`;

      tooltip.innerHTML = '';
      if (heading) {
        const title = document.createElement('p');
        title.className = 'chart__tooltip-heading';
        title.textContent = heading;
        tooltip.appendChild(title);
      }
      if (subtitle) {
        const description = document.createElement('p');
        description.className = 'chart__tooltip-subtitle';
        description.textContent = subtitle;
        tooltip.appendChild(description);
      }

      const list = document.createElement('div');
      list.className = 'chart__tooltip-list';
      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'chart__tooltip-item';

        const label = document.createElement('span');
        label.className = 'chart__tooltip-label';
        if (item.color) {
          const dot = document.createElement('span');
          dot.className = 'chart__tooltip-dot';
          dot.style.color = item.color;
          label.appendChild(dot);
        }
        label.append(item.label);

        const value = document.createElement('span');
        value.textContent = item.value;

        row.append(label, value);
        list.appendChild(row);
      }
      tooltip.appendChild(list);
    }

    /**
     * @protected
     */
    scheduleRender() {
      cancelAnimationFrame(this.#raf);
      this.#raf = requestAnimationFrame(() => {
        this.updateLegend();
        this.clearSvg();
        this.resetTooltip();
        this.renderChart();
      });
    }

    /**
     * Ensure pre-upgrade property assignments trigger the component setters.
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
      this.scheduleRender();
    }

    /**
     * Subclasses should override to draw the chart.
     * @protected
     */
    // eslint-disable-next-line class-methods-use-this
    renderChart() {}
  }

  class WcAreaChart extends BaseChartElement {
    static get observedAttributes() {
      return [...BaseChartElement.observedAttributes, 'stacked'];
    }

    #stacked = true;

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'stacked') {
        this.#stacked = newValue !== 'false';
      } else {
        super.attributeChangedCallback(name, oldValue, newValue);
      }
    }

    /**
     * @returns {boolean}
     */
    get stacked() {
      return this.#stacked;
    }

    /**
     * @param {boolean} value
     */
    set stacked(value) {
      this.setAttribute('stacked', value ? 'true' : 'false');
    }

    renderChart() {
      const data = this.getData();
      const config = this.getConfig();
      const categoryKey = this.getCategoryKey();
      const svg = this.getSvg();

      if (!data.length || !categoryKey) {
        return;
      }

      const seriesKeys = Object.keys(config);
      if (!seriesKeys.length) {
        return;
      }

      const width = svg.clientWidth || 640;
      const height = svg.clientHeight || 360;
      const margin = { top: 20, right: 20, bottom: 32, left: 48 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      const categories = data.map((item) => String(item[categoryKey] ?? ''));

      const values = data.map((item) => {
        return seriesKeys.map((key) => Number(item[key]) || 0);
      });

      const stackedTotals = values.map((entry) => entry.reduce((total, value) => total + value, 0));
      const maxValue = this.#stacked ? Math.max(...stackedTotals, 0) : Math.max(...values.flat(), 0);
      const ticks = niceTicks(maxValue, 4);

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('role', 'img');
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = this.getCaption() || 'Area chart';
      svg.appendChild(title);

      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', `translate(${margin.left} ${margin.top})`);
      svg.appendChild(group);

      const axisGroup = document.createElementNS(SVG_NS, 'g');
      axisGroup.setAttribute('stroke', 'var(--wc-chart-grid)');
      axisGroup.setAttribute('stroke-width', '1');
      axisGroup.setAttribute('fill', 'none');
      group.appendChild(axisGroup);

      for (const tick of ticks) {
        const y = chartHeight - (tick / (ticks[ticks.length - 1] || 1)) * chartHeight;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('x2', String(chartWidth));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('opacity', tick === 0 ? '1' : '0.5');
        axisGroup.appendChild(line);

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(-12));
        text.setAttribute('y', String(y + 4));
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('fill', 'var(--wc-chart-muted)');
        text.setAttribute('font-size', '12');
        text.textContent = String(tick);
        group.appendChild(text);
      }

      const step = categories.length > 1 ? chartWidth / (categories.length - 1) : chartWidth;

      categories.forEach((label, index) => {
        const x = index * step;
        const tick = document.createElementNS(SVG_NS, 'text');
        tick.setAttribute('x', String(x));
        tick.setAttribute('y', String(chartHeight + 24));
        tick.setAttribute('text-anchor', 'middle');
        tick.setAttribute('fill', 'var(--wc-chart-muted)');
        tick.setAttribute('font-size', '12');
        tick.textContent = label;
        group.appendChild(tick);
      });

      const baseline = new Array(data.length).fill(0);
      const areaGroup = document.createElementNS(SVG_NS, 'g');
      areaGroup.setAttribute('fill-opacity', '0.35');
      areaGroup.setAttribute('stroke-width', '2');
      areaGroup.setAttribute('stroke-linejoin', 'round');
      areaGroup.setAttribute('stroke-linecap', 'round');
      group.appendChild(areaGroup);

      seriesKeys.forEach((key, seriesIndex) => {
        const color = config[key]?.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
        const upper = [];
        const lower = [];
        for (let index = 0; index < data.length; index += 1) {
          const value = Number(data[index][key]) || 0;
          const baseValue = this.#stacked ? baseline[index] : 0;
          upper.push(baseValue + value);
          lower.push(baseValue);
          if (this.#stacked) baseline[index] += value;
        }

        const path = document.createElementNS(SVG_NS, 'path');
        const topPoints = upper
          .map((value, index) => {
            const x = index * step;
            const y = chartHeight - (value / (ticks[ticks.length - 1] || 1)) * chartHeight;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          })
          .join(' ');
        const bottomPoints = [...lower]
          .reverse()
          .map((value, index) => {
            const x = (data.length - 1 - index) * step;
            const y = chartHeight - (value / (ticks[ticks.length - 1] || 1)) * chartHeight;
            return `L ${x} ${y}`;
          })
          .join(' ');
        path.setAttribute('d', `${topPoints} ${bottomPoints} Z`);
        path.setAttribute('fill', color);
        path.setAttribute('stroke', color);
        areaGroup.appendChild(path);
      });

      this.attachInteractivity(group, categories, seriesKeys, values, step, chartHeight, ticks[ticks.length - 1] || 1, config);
    }

    /**
     * @param {SVGGElement} group
     * @param {string[]} categories
     * @param {string[]} seriesKeys
     * @param {number[][]} values
     * @param {number} step
     * @param {number} chartHeight
     * @param {number} max
     * @param {Record<string, ChartSeries>} config
     */
    attachInteractivity(group, categories, seriesKeys, values, step, chartHeight, max, config) {
      const tooltip = this.getTooltip();
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', String((categories.length - 1) * step || step));
      rect.setAttribute('height', String(chartHeight));
      rect.setAttribute('fill', 'transparent');
      rect.setAttribute('pointer-events', 'all');
      group.appendChild(rect);

      const handlePointer = (event) => {
        const bounds = this.getSvg().getBoundingClientRect();
        const offsetX = event.clientX - bounds.left - 48; // account for margin.left
        const index = Math.max(0, Math.min(categories.length - 1, Math.round(offsetX / step)));
        const heading = categories[index];
        const items = seriesKeys.map((key, seriesIndex) => {
          const color = config[key]?.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
          return {
            label: config[key]?.label || key,
            value: (values[index]?.[seriesIndex] ?? 0).toLocaleString(),
            color,
          };
        });

        const tooltipX = event.clientX - bounds.left + 12;
        const tooltipY = event.clientY - bounds.top - 24;
        this.showTooltip(tooltipX, tooltipY, heading, items);
        tooltip.hidden = false;
      };

      const clear = () => {
        this.resetTooltip();
      };

      rect.addEventListener('pointerenter', handlePointer);
      rect.addEventListener('pointermove', handlePointer);
      rect.addEventListener('pointerleave', clear);
    }
  }

  class WcLineChart extends BaseChartElement {
    renderChart() {
      const data = this.getData();
      const config = this.getConfig();
      const categoryKey = this.getCategoryKey();
      const svg = this.getSvg();

      if (!data.length || !categoryKey) return;

      const seriesKeys = Object.keys(config);
      if (!seriesKeys.length) return;

      const width = svg.clientWidth || 640;
      const height = svg.clientHeight || 360;
      const margin = { top: 20, right: 20, bottom: 32, left: 48 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      const categories = data.map((item) => String(item[categoryKey] ?? ''));

      const values = data.map((item) => {
        return seriesKeys.map((key) => Number(item[key]) || 0);
      });

      const maxValue = Math.max(...values.flat(), 0);
      const ticks = niceTicks(maxValue, 4);

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('role', 'img');
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = this.getCaption() || 'Line chart';
      svg.appendChild(title);

      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', `translate(${margin.left} ${margin.top})`);
      svg.appendChild(group);

      const axisGroup = document.createElementNS(SVG_NS, 'g');
      axisGroup.setAttribute('stroke', 'var(--wc-chart-grid)');
      axisGroup.setAttribute('stroke-width', '1');
      axisGroup.setAttribute('fill', 'none');
      group.appendChild(axisGroup);

      for (const tick of ticks) {
        const y = chartHeight - (tick / (ticks[ticks.length - 1] || 1)) * chartHeight;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('x2', String(chartWidth));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('opacity', tick === 0 ? '1' : '0.5');
        axisGroup.appendChild(line);

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(-12));
        text.setAttribute('y', String(y + 4));
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('fill', 'var(--wc-chart-muted)');
        text.setAttribute('font-size', '12');
        text.textContent = String(tick);
        group.appendChild(text);
      }

      const step = categories.length > 1 ? chartWidth / (categories.length - 1) : chartWidth;
      categories.forEach((label, index) => {
        const x = index * step;
        const tick = document.createElementNS(SVG_NS, 'text');
        tick.setAttribute('x', String(x));
        tick.setAttribute('y', String(chartHeight + 24));
        tick.setAttribute('text-anchor', 'middle');
        tick.setAttribute('fill', 'var(--wc-chart-muted)');
        tick.setAttribute('font-size', '12');
        tick.textContent = label;
        group.appendChild(tick);
      });

      const lineGroup = document.createElementNS(SVG_NS, 'g');
      lineGroup.setAttribute('fill', 'none');
      lineGroup.setAttribute('stroke-width', '2.5');
      lineGroup.setAttribute('stroke-linejoin', 'round');
      lineGroup.setAttribute('stroke-linecap', 'round');
      group.appendChild(lineGroup);

      seriesKeys.forEach((key, seriesIndex) => {
        const color = config[key]?.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute(
          'd',
          values
            .map((entry, index) => {
              const x = index * step;
              const y = chartHeight - (entry[seriesIndex] / (ticks[ticks.length - 1] || 1)) * chartHeight;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')
        );
        path.setAttribute('stroke', color);
        lineGroup.appendChild(path);
      });

      this.attachInteractivity(group, categories, seriesKeys, values, step, chartHeight, config);
    }

    /**
     * @param {SVGGElement} group
     * @param {string[]} categories
     * @param {string[]} seriesKeys
     * @param {number[][]} values
     * @param {number} step
     * @param {number} chartHeight
     * @param {Record<string, ChartSeries>} config
     */
    attachInteractivity(group, categories, seriesKeys, values, step, chartHeight, config) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', String((categories.length - 1) * step || step));
      rect.setAttribute('height', String(chartHeight));
      rect.setAttribute('fill', 'transparent');
      rect.setAttribute('pointer-events', 'all');
      group.appendChild(rect);

      const handlePointer = (event) => {
        const bounds = this.getSvg().getBoundingClientRect();
        const offsetX = event.clientX - bounds.left - 48;
        const index = Math.max(0, Math.min(categories.length - 1, Math.round(offsetX / step)));
        const heading = categories[index];
        const items = seriesKeys.map((key, seriesIndex) => {
          const color = config[key]?.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
          return {
            label: config[key]?.label || key,
            value: (values[index]?.[seriesIndex] ?? 0).toLocaleString(),
            color,
          };
        });
        const tooltipX = event.clientX - bounds.left + 12;
        const tooltipY = event.clientY - bounds.top - 24;
        this.showTooltip(tooltipX, tooltipY, heading, items);
      };

      rect.addEventListener('pointerenter', handlePointer);
      rect.addEventListener('pointermove', handlePointer);
      rect.addEventListener('pointerleave', () => this.resetTooltip());
    }
  }

  class WcPieChart extends BaseChartElement {
    renderChart() {
      const data = this.getData();
      const config = this.getConfig();
      const svg = this.getSvg();

      if (!data.length) return;

      const keys = Object.keys(config);
      const entries = data.map((item, index) => {
        const key = keys[index] || `series-${index}`;
        const value = Number(item.value ?? item.visitors ?? item.total ?? item.amount ?? item.count) || 0;
        const label = String(item.label ?? item.name ?? item.browser ?? key);
        const color = item.color || config[key]?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        return { key, value, label, color };
      });

      const total = entries.reduce((sum, item) => sum + item.value, 0);
      if (total <= 0) return;

      const width = svg.clientWidth || 360;
      const height = svg.clientHeight || 360;
      const radius = Math.min(width, height) / 2 - 16;

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('role', 'img');
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = this.getCaption() || 'Pie chart';
      svg.appendChild(title);

      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', `translate(${width / 2} ${height / 2})`);
      svg.appendChild(group);

      let currentAngle = -Math.PI / 2;
      entries.forEach((entry) => {
        const sliceAngle = (entry.value / total) * Math.PI * 2;
        const startX = Math.cos(currentAngle) * radius;
        const startY = Math.sin(currentAngle) * radius;
        const endAngle = currentAngle + sliceAngle;
        const endX = Math.cos(endAngle) * radius;
        const endY = Math.sin(endAngle) * radius;
        const largeArc = sliceAngle > Math.PI ? 1 : 0;

        const path = document.createElementNS(SVG_NS, 'path');
        const d = [`M 0 0`, `L ${startX} ${startY}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`, 'Z'].join(' ');
        path.setAttribute('d', d);
        path.setAttribute('fill', entry.color);
        path.dataset.key = entry.key;
        group.appendChild(path);

        currentAngle = endAngle;

        path.addEventListener('pointerenter', (event) => this.handlePieTooltip(event, entry, total));
        path.addEventListener('pointermove', (event) => this.handlePieTooltip(event, entry, total));
        path.addEventListener('pointerleave', () => this.resetTooltip());
      });
    }

    /**
     * @param {PointerEvent} event
     * @param {{ label: string; value: number; color: string }} entry
     * @param {number} total
     */
    handlePieTooltip(event, entry, total) {
      const bounds = this.getSvg().getBoundingClientRect();
      const tooltipX = event.clientX - bounds.left + 12;
      const tooltipY = event.clientY - bounds.top - 24;
      const percentage = ((entry.value / total) * 100).toFixed(1);
      this.showTooltip(tooltipX, tooltipY, entry.label, [
        { label: 'Value', value: entry.value.toLocaleString(), color: entry.color },
        { label: 'Share', value: `${percentage}%` },
      ]);
    }
  }

  class WcRadarChart extends BaseChartElement {
    renderChart() {
      const data = this.getData();
      const config = this.getConfig();
      const categoryKey = this.getCategoryKey();
      const svg = this.getSvg();

      if (!data.length || !categoryKey) return;

      const seriesKeys = Object.keys(config);
      if (!seriesKeys.length) return;

      const width = svg.clientWidth || 360;
      const height = svg.clientHeight || 360;
      const radius = Math.min(width, height) / 2 - 24;

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('role', 'img');
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = this.getCaption() || 'Radar chart';
      svg.appendChild(title);

      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', `translate(${width / 2} ${height / 2})`);
      svg.appendChild(group);

      const categories = data.map((item) => String(item[categoryKey] ?? ''));
      const angleSlice = (Math.PI * 2) / categories.length;
      const values = data.map((item) => seriesKeys.map((key) => Number(item[key]) || 0));
      const maxValue = Math.max(...values.flat(), 0);
      const ticks = niceTicks(maxValue, 4);

      const gridGroup = document.createElementNS(SVG_NS, 'g');
      gridGroup.setAttribute('fill', 'none');
      gridGroup.setAttribute('stroke', 'var(--wc-chart-grid)');
      gridGroup.setAttribute('stroke-width', '1');
      group.appendChild(gridGroup);

      ticks.forEach((tick) => {
        const r = (tick / (ticks[ticks.length - 1] || 1)) * radius;
        const polygon = document.createElementNS(SVG_NS, 'polygon');
        polygon.setAttribute(
          'points',
          categories
            .map((_, index) => {
              const angle = angleSlice * index - Math.PI / 2;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              return `${x},${y}`;
            })
            .join(' ')
        );
        polygon.setAttribute('opacity', tick === ticks[ticks.length - 1] ? '1' : '0.35');
        gridGroup.appendChild(polygon);
      });

      const axisGroup = document.createElementNS(SVG_NS, 'g');
      axisGroup.setAttribute('stroke', 'var(--wc-chart-grid)');
      axisGroup.setAttribute('stroke-width', '1');
      group.appendChild(axisGroup);

      categories.forEach((label, index) => {
        const angle = angleSlice * index - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '0');
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(y));
        axisGroup.appendChild(line);

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(Math.cos(angle) * (radius + 16)));
        text.setAttribute('y', String(Math.sin(angle) * (radius + 16)));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'var(--wc-chart-muted)');
        text.setAttribute('font-size', '12');
        text.textContent = label;
        group.appendChild(text);
      });

      const seriesGroup = document.createElementNS(SVG_NS, 'g');
      seriesGroup.setAttribute('fill-opacity', '0.45');
      seriesGroup.setAttribute('stroke-width', '2');
      seriesGroup.setAttribute('stroke-linejoin', 'round');
      group.appendChild(seriesGroup);

      seriesKeys.forEach((key, seriesIndex) => {
        const color = config[key]?.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
        const polygon = document.createElementNS(SVG_NS, 'polygon');
        polygon.setAttribute(
          'points',
          values
            .map((entry, index) => {
              const angle = angleSlice * index - Math.PI / 2;
              const r = (entry[seriesIndex] / (ticks[ticks.length - 1] || 1)) * radius;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              return `${x},${y}`;
            })
            .join(' ')
        );
        polygon.setAttribute('fill', color);
        polygon.setAttribute('stroke', color);
        seriesGroup.appendChild(polygon);
      });

      const handlePointer = (event) => {
        const bounds = this.getSvg().getBoundingClientRect();
        const tooltipX = event.clientX - bounds.left + 12;
        const tooltipY = event.clientY - bounds.top - 24;
        const heading = 'Totals';
        const items = seriesKeys.map((key, seriesIndex) => {
          const color = config[key]?.color || DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
          const total = values.reduce((sum, entry) => sum + (entry[seriesIndex] ?? 0), 0);
          return {
            label: config[key]?.label || key,
            value: total.toLocaleString(),
            color,
          };
        });
        this.showTooltip(tooltipX, tooltipY, heading, items, `${categories.length} categories`);
      };

      const hitArea = document.createElementNS(SVG_NS, 'circle');
      hitArea.setAttribute('r', String(radius));
      hitArea.setAttribute('fill', 'transparent');
      hitArea.setAttribute('pointer-events', 'all');
      group.appendChild(hitArea);
      hitArea.addEventListener('pointerenter', handlePointer);
      hitArea.addEventListener('pointermove', handlePointer);
      hitArea.addEventListener('pointerleave', () => this.resetTooltip());
    }
  }

  class WcRadialChart extends BaseChartElement {
    renderChart() {
      const data = this.getData();
      const config = this.getConfig();
      const svg = this.getSvg();

      if (!data.length) return;

      const keys = Object.keys(config);
      const entries = data.map((item, index) => {
        const key = keys[index] || `series-${index}`;
        const value = Number(item.value ?? item.visitors ?? item.total ?? item.amount ?? item.count) || 0;
        const label = String(item.label ?? item.name ?? item.browser ?? key);
        const color = item.color || config[key]?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        return { key, value, label, color };
      });

      const width = svg.clientWidth || 360;
      const height = svg.clientHeight || 360;
      const radius = Math.min(width, height) / 2;
      const innerRadius = radius * 0.3;
      const maxValue = Math.max(...entries.map((entry) => entry.value), 0);
      if (maxValue <= 0) return;

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('role', 'img');
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = this.getCaption() || 'Radial chart';
      svg.appendChild(title);

      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', `translate(${width / 2} ${height / 2})`);
      svg.appendChild(group);

      const angleSlice = (Math.PI * 2) / entries.length;
      entries.forEach((entry, index) => {
        const startAngle = angleSlice * index - Math.PI / 2;
        const endAngle = startAngle + angleSlice * (entry.value / maxValue);
        const outerRadius = innerRadius + (radius - innerRadius) * (entry.value / maxValue);

        const path = document.createElementNS(SVG_NS, 'path');
        const startXInner = Math.cos(startAngle) * innerRadius;
        const startYInner = Math.sin(startAngle) * innerRadius;
        const startXOuter = Math.cos(startAngle) * outerRadius;
        const startYOuter = Math.sin(startAngle) * outerRadius;
        const endXOuter = Math.cos(endAngle) * outerRadius;
        const endYOuter = Math.sin(endAngle) * outerRadius;
        const endXInner = Math.cos(endAngle) * innerRadius;
        const endYInner = Math.sin(endAngle) * innerRadius;
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        const d = [
          `M ${startXInner} ${startYInner}`,
          `L ${startXOuter} ${startYOuter}`,
          `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endXOuter} ${endYOuter}`,
          `L ${endXInner} ${endYInner}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startXInner} ${startYInner}`,
          'Z',
        ].join(' ');
        path.setAttribute('d', d);
        path.setAttribute('fill', entry.color);
        group.appendChild(path);

        path.addEventListener('pointerenter', (event) => this.handleRadialTooltip(event, entry));
        path.addEventListener('pointermove', (event) => this.handleRadialTooltip(event, entry));
        path.addEventListener('pointerleave', () => this.resetTooltip());
      });
    }

    /**
     * @param {PointerEvent} event
     * @param {{ label: string; value: number; color: string }} entry
     */
    handleRadialTooltip(event, entry) {
      const bounds = this.getSvg().getBoundingClientRect();
      const tooltipX = event.clientX - bounds.left + 12;
      const tooltipY = event.clientY - bounds.top - 24;
      this.showTooltip(tooltipX, tooltipY, entry.label, [
        { label: 'Value', value: entry.value.toLocaleString(), color: entry.color },
      ]);
    }
  }

  const registry = [
    ['wc-area-chart', WcAreaChart],
    ['wc-line-chart', WcLineChart],
    ['wc-pie-chart', WcPieChart],
    ['wc-radar-chart', WcRadarChart],
    ['wc-radial-chart', WcRadialChart],
  ];

  for (const [name, ctor] of registry) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  }
})();

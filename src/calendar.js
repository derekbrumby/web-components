/**
 * @file calendar.js
 * @version 1.0.0
 *
 * Accessible single-date calendar web component with keyboard navigation,
 * timezone awareness, and optional month/year dropdowns. Inspired by the
 * shadcn/ui calendar while remaining dependency free and CDN friendly.
 *
 * Usage:
 * <wc-calendar value="2025-06-12" caption-layout="dropdown"></wc-calendar>
 */

(() => {
  /**
   * Ensure that setting properties before upgrading works as expected.
   *
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
   * @typedef {{ year: number; month: number; day: number }} PlainDate
   */

  const template = document.createElement('template');
  template.innerHTML = /* html */ `
    <style>
      :host {
        --wc-calendar-background: rgba(255, 255, 255, 0.82);
        --wc-calendar-foreground: rgb(15, 23, 42);
        --wc-calendar-muted: rgba(100, 116, 139, 0.85);
        --wc-calendar-border-color: rgba(148, 163, 184, 0.35);
        --wc-calendar-accent: rgb(79, 70, 229);
        --wc-calendar-accent-soft: rgba(79, 70, 229, 0.18);
        --wc-calendar-radius: 1rem;
        --wc-calendar-shadow: 0 28px 48px -36px rgba(15, 23, 42, 0.55);
        --wc-calendar-cell-size: 2.5rem;
        display: inline-block;
        font: inherit;
        color: var(--wc-calendar-foreground);
      }

      :host([hidden]) {
        display: none !important;
      }

      .calendar {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: var(--wc-calendar-radius);
        border: 1px solid var(--wc-calendar-border-color);
        background: var(--wc-calendar-background);
        color: inherit;
        box-shadow: var(--wc-calendar-shadow);
      }

      .calendar__header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.5rem;
      }

      .nav-button {
        inline-size: var(--wc-calendar-cell-size);
        block-size: var(--wc-calendar-cell-size);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
        border: 1px solid transparent;
        background: rgba(148, 163, 184, 0.1);
        color: inherit;
        cursor: pointer;
        transition: background-color 120ms ease, border-color 120ms ease,
          transform 120ms ease;
      }

      .nav-button:hover {
        background: rgba(79, 70, 229, 0.12);
      }

      .nav-button:active {
        transform: translateY(1px);
      }

      .nav-button:focus-visible {
        outline: 3px solid rgba(79, 70, 229, 0.45);
        outline-offset: 3px;
      }

      .calendar__caption {
        display: grid;
        justify-items: center;
        gap: 0.25rem;
      }

      .caption-label {
        font-weight: 600;
        font-size: 1rem;
        letter-spacing: -0.01em;
      }

      .caption-controls {
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
      }

      .caption-controls[hidden] {
        display: none;
      }

      .caption-select {
        position: relative;
        min-inline-size: 6.5rem;
      }

      .caption-select select {
        inline-size: 100%;
        block-size: 2rem;
        padding-inline: 0.5rem 1.5rem;
        padding-block: 0.35rem;
        border-radius: 0.75rem;
        border: 1px solid var(--wc-calendar-border-color);
        background: rgba(255, 255, 255, 0.95);
        color: inherit;
        font: inherit;
        appearance: none;
        cursor: pointer;
      }

      .caption-select select:focus-visible {
        outline: 3px solid rgba(79, 70, 229, 0.45);
        outline-offset: 3px;
      }

      .caption-select svg {
        position: absolute;
        inset-block: 0;
        inset-inline-end: 0.5rem;
        margin: auto;
        pointer-events: none;
        block-size: 1rem;
        inline-size: 1rem;
        color: var(--wc-calendar-muted);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead th {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        font-weight: 600;
        color: var(--wc-calendar-muted);
        padding-block: 0.25rem;
        text-align: center;
      }

      tbody td {
        padding: 0.1rem;
      }

      .day-button,
      .day-filler {
        inline-size: 100%;
        block-size: var(--wc-calendar-cell-size);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
      }

      .day-button {
        border: none;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        transition: background-color 120ms ease, color 120ms ease,
          transform 120ms ease;
        position: relative;
      }

      .day-button:hover {
        background: rgba(79, 70, 229, 0.12);
      }

      .day-button:focus-visible {
        outline: 3px solid rgba(79, 70, 229, 0.45);
        outline-offset: 2px;
      }

      .day-button[data-selected="true"] {
        background: var(--wc-calendar-accent);
        color: white;
      }

      .day-button[data-outside="true"] {
        color: rgba(100, 116, 139, 0.7);
      }

      :host([show-outside-days="false"]) .day-button[data-outside="true"] {
        visibility: hidden;
      }

      .day-button[data-today="true"][data-selected="false"] {
        box-shadow: inset 0 0 0 1px var(--wc-calendar-accent);
      }

      .day-button[aria-disabled="true"] {
        color: rgba(148, 163, 184, 0.6);
        cursor: not-allowed;
      }

      .day-button[aria-disabled="true"]:hover {
        background: transparent;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    </style>
    <div class="calendar" part="calendar">
      <div class="calendar__header" part="header">
        <button
          type="button"
          class="nav-button"
          data-action="previous"
          aria-label="Previous month"
          part="nav-button nav-previous"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div class="calendar__caption" part="caption">
          <span class="caption-label" part="caption-label"></span>
          <div class="caption-controls" part="caption-controls">
            <label class="sr-only" data-part="month-label">Month</label>
            <div class="caption-select" data-part="month-select" part="month-select">
              <select aria-label="Select month"></select>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.165l3.71-2.935a.75.75 0 1 1 .94 1.17l-4.18 3.305a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18Z"
                />
              </svg>
            </div>
            <label class="sr-only" data-part="year-label">Year</label>
            <div class="caption-select" data-part="year-select" part="year-select">
              <select aria-label="Select year"></select>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.165l3.71-2.935a.75.75 0 1 1 .94 1.17l-4.18 3.305a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18Z"
                />
              </svg>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="nav-button"
          data-action="next"
          aria-label="Next month"
          part="nav-button nav-next"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <table role="grid" part="table">
        <thead part="table-head">
          <tr part="weekday-row"></tr>
        </thead>
        <tbody part="grid"></tbody>
      </table>
    </div>
  `;

  const allowedCaptionLayouts = new Set(['label', 'dropdown', 'dropdown-months', 'dropdown-years']);

  /**
   * Convert an ISO `YYYY-MM-DD` string to a {@link PlainDate}.
   *
   * @param {string | null} value
   * @returns {PlainDate | null}
   */
  const parseISODate = (value) => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    const [yearRaw, monthRaw, dayRaw] = parts;
    const year = Number.parseInt(yearRaw, 10);
    const month = Number.parseInt(monthRaw, 10);
    const day = Number.parseInt(dayRaw, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const test = new Date(Date.UTC(year, month - 1, day));
    if (
      test.getUTCFullYear() !== year ||
      test.getUTCMonth() !== month - 1 ||
      test.getUTCDate() !== day
    ) {
      return null;
    }
    return { year, month, day };
  };

  /**
   * @param {PlainDate | null} value
   */
  const toISODate = (value) => {
    if (!value) return '';
    const month = `${value.month}`.padStart(2, '0');
    const day = `${value.day}`.padStart(2, '0');
    return `${value.year}-${month}-${day}`;
  };

  /**
   * @param {PlainDate} date
   * @returns {Date}
   */
  const toDate = (date) => {
    return new Date(Date.UTC(date.year, date.month - 1, date.day, 12));
  };

  /**
   * @param {PlainDate | null} a
   * @param {PlainDate | null} b
   */
  const isSameDate = (a, b) => {
    return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
  };

  /**
   * @param {PlainDate} a
   * @param {PlainDate} b
   */
  const compareDate = (a, b) => {
    if (a.year !== b.year) return a.year < b.year ? -1 : 1;
    if (a.month !== b.month) return a.month < b.month ? -1 : 1;
    if (a.day !== b.day) return a.day < b.day ? -1 : 1;
    return 0;
  };

  /**
   * @param {PlainDate} date
   * @param {number} days
   * @returns {PlainDate}
   */
  const addDays = (date, days) => {
    const next = toDate(date);
    next.setUTCDate(next.getUTCDate() + days);
    return {
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
      day: next.getUTCDate(),
    };
  };

  /**
   * @param {{ year: number; month: number }} view
   * @param {number} months
   */
  const addMonths = (view, months) => {
    const reference = new Date(Date.UTC(view.year, view.month - 1, 1));
    reference.setUTCMonth(reference.getUTCMonth() + months);
    return { year: reference.getUTCFullYear(), month: reference.getUTCMonth() + 1 };
  };

  /**
   * @param {PlainDate} date
   * @param {PlainDate | null} min
   * @param {PlainDate | null} max
   */
  const clampDate = (date, min, max) => {
    if (min && compareDate(date, min) < 0) return min;
    if (max && compareDate(date, max) > 0) return max;
    return date;
  };

  /**
   * @param {Date} date
   * @param {string | undefined} timeZone
   * @param {string} locale
   * @returns {PlainDate}
   */
  const toPlainFromDate = (date, timeZone, locale) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = Number.parseInt(parts.find((part) => part.type === 'year')?.value ?? '', 10);
    const month = Number.parseInt(parts.find((part) => part.type === 'month')?.value ?? '', 10);
    const day = Number.parseInt(parts.find((part) => part.type === 'day')?.value ?? '', 10);
    return { year, month, day };
  };

  class WcCalendar extends HTMLElement {
    static get observedAttributes() {
      return [
        'value',
        'min',
        'max',
        'locale',
        'first-day-of-week',
        'time-zone',
        'caption-layout',
        'show-outside-days',
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSpanElement} */
    #label;
    /** @type {HTMLElement} */
    #captionControls;
    /** @type {HTMLSelectElement} */
    #monthSelect;
    /** @type {HTMLSelectElement} */
    #yearSelect;
    /** @type {HTMLTableElement} */
    #table;
    /** @type {HTMLTableRowElement} */
    #weekdayRow;
    /** @type {HTMLTableSectionElement} */
    #grid;
    /** @type {HTMLButtonElement} */
    #previousButton;
    /** @type {HTMLButtonElement} */
    #nextButton;

    /** @type {PlainDate | null} */
    #selected = null;
    /** @type {PlainDate | null} */
    #min = null;
    /** @type {PlainDate | null} */
    #max = null;
    /** @type {PlainDate | null} */
    #active = null;
    /** @type {{ year: number; month: number }} */
    #view = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

    /** @type {string} */
    #locale = navigator.language || 'en-US';
    /** @type {string | undefined} */
    #timeZone = undefined;
    /** @type {number} */
    #firstDayOfWeek = 0;
    /** @type {'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'} */
    #captionLayout = 'label';

    /** @type {Intl.DateTimeFormat} */
    #monthFormatter;
    /** @type {Intl.DateTimeFormat} */
    #weekdayFormatter;
    /** @type {Intl.DateTimeFormat} */
    #fullDateFormatter;

    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {string} */
    #labelId;
    /** @type {EventListener} */
    #boundOnGridClick;
    /** @type {EventListener} */
    #boundOnGridKeyDown;
    /** @type {EventListener} */
    #boundOnNavClick;
    /** @type {EventListener} */
    #boundOnMonthChange;
    /** @type {EventListener} */
    #boundOnYearChange;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.appendChild(template.content.cloneNode(true));
      this.#label = this.#root.querySelector('.caption-label');
      this.#captionControls = this.#root.querySelector('.caption-controls');
      this.#monthSelect = this.#root.querySelector('[data-part="month-select"] select');
      this.#yearSelect = this.#root.querySelector('[data-part="year-select"] select');
      this.#table = this.#root.querySelector('table');
      this.#weekdayRow = this.#root.querySelector('thead tr');
      this.#grid = this.#root.querySelector('tbody');
      this.#previousButton = this.#root.querySelector('[data-action="previous"]');
      this.#nextButton = this.#root.querySelector('[data-action="next"]');
      this.#labelId = `wc-calendar-${Math.random().toString(36).slice(2, 9)}-label`;
      this.#label.id = this.#labelId;
      this.#table.setAttribute('aria-labelledby', this.#labelId);

      this.#monthFormatter = new Intl.DateTimeFormat(this.#locale, {
        timeZone: this.#timeZone,
        month: 'long',
        year: 'numeric',
      });
      this.#weekdayFormatter = new Intl.DateTimeFormat(this.#locale, {
        timeZone: this.#timeZone,
        weekday: 'short',
      });
      this.#fullDateFormatter = new Intl.DateTimeFormat(this.#locale, {
        timeZone: this.#timeZone,
        dateStyle: 'full',
      });

      this.#boundOnGridClick = this.#onGridClick.bind(this);
      this.#boundOnGridKeyDown = this.#onGridKeyDown.bind(this);
      this.#boundOnNavClick = this.#onNavClick.bind(this);
      this.#boundOnMonthChange = this.#onMonthChange.bind(this);
      this.#boundOnYearChange = this.#onYearChange.bind(this);
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'min');
      upgradeProperty(this, 'max');
      upgradeProperty(this, 'locale');
      upgradeProperty(this, 'timeZone');
      upgradeProperty(this, 'firstDayOfWeek');
      upgradeProperty(this, 'captionLayout');
      upgradeProperty(this, 'showOutsideDays');

      this.#grid.addEventListener('click', this.#boundOnGridClick);
      this.#grid.addEventListener('keydown', this.#boundOnGridKeyDown);
      this.#previousButton.addEventListener('click', this.#boundOnNavClick);
      this.#nextButton.addEventListener('click', this.#boundOnNavClick);
      this.#monthSelect.addEventListener('change', this.#boundOnMonthChange);
      this.#yearSelect.addEventListener('change', this.#boundOnYearChange);

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'application');
      }

      if (!this.hasAttribute('aria-label')) {
        this.setAttribute('aria-label', 'Calendar');
      }

      this.#renderWeekdays();
      this.#render();
    }

    disconnectedCallback() {
      this.#grid.removeEventListener('click', this.#boundOnGridClick);
      this.#grid.removeEventListener('keydown', this.#boundOnGridKeyDown);
      this.#previousButton.removeEventListener('click', this.#boundOnNavClick);
      this.#nextButton.removeEventListener('click', this.#boundOnNavClick);
      this.#monthSelect.removeEventListener('change', this.#boundOnMonthChange);
      this.#yearSelect.removeEventListener('change', this.#boundOnYearChange);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      switch (name) {
        case 'value':
          if (this.#reflectingValue) return;
          this.#selected = parseISODate(newValue);
          if (this.#selected) {
            this.#view = { year: this.#selected.year, month: this.#selected.month };
            this.#active = this.#selected;
          }
          this.#render();
          break;
        case 'min':
          this.#min = parseISODate(newValue);
          if (this.#selected && this.#min && compareDate(this.#selected, this.#min) < 0) {
            this.#selected = this.#min;
            this.#view = { year: this.#min.year, month: this.#min.month };
            this.#active = this.#min;
            this.#reflectingValue = true;
            this.setAttribute('value', toISODate(this.#min));
            this.#reflectingValue = false;
          }
          this.#render();
          break;
        case 'max':
          this.#max = parseISODate(newValue);
          if (this.#selected && this.#max && compareDate(this.#selected, this.#max) > 0) {
            this.#selected = this.#max;
            this.#view = { year: this.#max.year, month: this.#max.month };
            this.#active = this.#max;
            this.#reflectingValue = true;
            this.setAttribute('value', toISODate(this.#max));
            this.#reflectingValue = false;
          }
          this.#render();
          break;
        case 'locale':
          this.#setLocale(newValue);
          break;
        case 'first-day-of-week': {
          const parsed = Number.parseInt(newValue ?? '', 10);
          if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 6) {
            this.#firstDayOfWeek = parsed;
            this.#renderWeekdays();
            this.#render();
          }
          break;
        }
        case 'time-zone':
          this.#setTimeZone(newValue);
          break;
        case 'caption-layout':
          this.#setCaptionLayout(newValue);
          this.#render();
          break;
        case 'show-outside-days':
          this.#render();
          break;
        default:
          break;
      }
    }

    /**
     * Selected date as an ISO `YYYY-MM-DD` string.
     */
    get value() {
      return this.getAttribute('value') ?? '';
    }

    set value(next) {
      if (next === null || next === undefined || next === '') {
        this.removeAttribute('value');
        return;
      }
      this.setAttribute('value', next);
    }

    /**
     * Selected date as a `Date` instance (in UTC midday) or `null`.
     */
    get valueAsDate() {
      return this.#selected ? toDate(this.#selected) : null;
    }

    /**
     * Minimum selectable date as ISO string.
     */
    get min() {
      return this.getAttribute('min') ?? '';
    }

    set min(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('min');
        return;
      }
      this.setAttribute('min', value);
    }

    /**
     * Maximum selectable date as ISO string.
     */
    get max() {
      return this.getAttribute('max') ?? '';
    }

    set max(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('max');
        return;
      }
      this.setAttribute('max', value);
    }

    /**
     * Locale used for month and weekday labels.
     */
    get locale() {
      return this.#locale;
    }

    set locale(value) {
      this.setAttribute('locale', value ?? '');
    }

    /**
     * Preferred timezone identifier used for formatting dates.
     */
    get timeZone() {
      return this.#timeZone;
    }

    set timeZone(value) {
      if (!value) {
        this.removeAttribute('time-zone');
        return;
      }
      this.setAttribute('time-zone', value);
    }

    /**
     * First day of week (0-6). Defaults to Sunday (0).
     */
    get firstDayOfWeek() {
      return this.#firstDayOfWeek;
    }

    set firstDayOfWeek(value) {
      if (value === null || value === undefined) {
        this.removeAttribute('first-day-of-week');
        return;
      }
      this.setAttribute('first-day-of-week', String(value));
    }

    /**
     * Caption layout mode.
     */
    get captionLayout() {
      return this.#captionLayout;
    }

    set captionLayout(value) {
      this.setAttribute('caption-layout', value ?? 'label');
    }

    /**
     * Controls whether days outside the current month remain visible.
     */
    get showOutsideDays() {
      const attr = this.getAttribute('show-outside-days');
      if (attr === null) return true;
      return attr !== 'false';
    }

    set showOutsideDays(value) {
      if (value) {
        this.setAttribute('show-outside-days', 'true');
      } else {
        this.setAttribute('show-outside-days', 'false');
      }
    }

    /**
     * @param {string | null} next
     */
    #setLocale(next) {
      const fallback = navigator.language || 'en-US';
      const newLocale = next && next.trim() ? next : fallback;
      this.#locale = newLocale;
      this.#updateFormatters();
      this.#renderWeekdays();
      this.#render();
    }

    /**
     * @param {string | null} next
     */
    #setTimeZone(next) {
      if (next && next.trim()) {
        try {
          new Intl.DateTimeFormat(undefined, { timeZone: next });
          this.#timeZone = next;
        } catch (error) {
          console.warn('[wc-calendar] Invalid timeZone provided:', next, error);
          this.#timeZone = undefined;
        }
      } else {
        this.#timeZone = undefined;
      }
      this.#updateFormatters();
      this.#renderWeekdays();
      this.#render();
    }

    /**
     * @param {string | null} next
     */
    #setCaptionLayout(next) {
      if (next && allowedCaptionLayouts.has(next)) {
        this.#captionLayout = /** @type {typeof this.#captionLayout} */ (next);
      } else {
        this.#captionLayout = 'label';
      }
      this.#updateCaptionControls();
    }

    #updateFormatters() {
      this.#monthFormatter = new Intl.DateTimeFormat(this.#locale, {
        timeZone: this.#timeZone,
        month: 'long',
        year: 'numeric',
      });
      this.#weekdayFormatter = new Intl.DateTimeFormat(this.#locale, {
        timeZone: this.#timeZone,
        weekday: 'short',
      });
      this.#fullDateFormatter = new Intl.DateTimeFormat(this.#locale, {
        timeZone: this.#timeZone,
        dateStyle: 'full',
      });
    }

    #updateCaptionControls() {
      const controls = this.#captionControls;
      const showMonth = this.#captionLayout === 'dropdown' || this.#captionLayout === 'dropdown-months';
      const showYear = this.#captionLayout === 'dropdown' || this.#captionLayout === 'dropdown-years';
      if (!showMonth && !showYear) {
        controls.setAttribute('hidden', '');
      } else {
        controls.removeAttribute('hidden');
      }
      const monthWrapper = this.#root.querySelector('[data-part="month-select"]');
      const yearWrapper = this.#root.querySelector('[data-part="year-select"]');
      if (monthWrapper) {
        if (showMonth) {
          monthWrapper.removeAttribute('hidden');
        } else {
          monthWrapper.setAttribute('hidden', '');
        }
      }
      if (yearWrapper) {
        if (showYear) {
          yearWrapper.removeAttribute('hidden');
        } else {
          yearWrapper.setAttribute('hidden', '');
        }
      }
    }

    #renderWeekdays() {
      if (!this.isConnected) return;
      const formatter = this.#weekdayFormatter;
      const row = this.#weekdayRow;
      row.textContent = '';
      const dayNames = [];
      const base = new Date(Date.UTC(2024, 0, 7, 12)); // Baseline week starting on Sunday
      for (let i = 0; i < 7; i += 1) {
        const date = new Date(base);
        date.setUTCDate(base.getUTCDate() + i);
        const label = formatter.format(date);
        dayNames.push(label);
      }
      for (let i = 0; i < 7; i += 1) {
        const weekdayIndex = (this.#firstDayOfWeek + i) % 7;
        const th = document.createElement('th');
        th.part = 'weekday';
        th.scope = 'col';
        th.textContent = dayNames[weekdayIndex];
        row.appendChild(th);
      }
    }

    #render() {
      if (!this.isConnected) return;
      this.#label.textContent = this.#monthFormatter.format(
        new Date(Date.UTC(this.#view.year, this.#view.month - 1, 1, 12))
      );
      this.#updateCaptionControls();
      this.#populateCaptionOptions();

      const cells = this.#buildCalendarCells();
      const tbody = this.#grid;
      tbody.textContent = '';

      const selected = this.#selected;
      const today = toPlainFromDate(new Date(), this.#timeZone, this.#locale);
      let active = this.#active && cells.some((cell) => isSameDate(cell.date, this.#active))
        ? this.#active
        : null;
      const activeCell = active ? cells.find((cell) => isSameDate(cell.date, active)) : null;
      if (activeCell && activeCell.disabled) {
        active = null;
      }
      if (!active) {
        const inViewSelected = cells.find((cell) => isSameDate(cell.date, selected));
        if (inViewSelected && !inViewSelected.disabled) {
          active = inViewSelected.date;
        } else {
          const firstAvailable = cells.find((cell) => cell.currentMonth && !cell.disabled);
          active = firstAvailable ? firstAvailable.date : null;
        }
      }
      this.#active = active;

      cells.forEach((cell, index) => {
        if (index % 7 === 0) {
          const row = document.createElement('tr');
          row.part = 'week-row';
          tbody.appendChild(row);
        }
        const row = /** @type {HTMLTableRowElement} */ (tbody.lastElementChild);
        const td = document.createElement('td');
        td.part = 'day-cell';
        if (!this.showOutsideDays && !cell.currentMonth) {
          const span = document.createElement('span');
          span.className = 'day-filler';
          span.setAttribute('aria-hidden', 'true');
          td.append(span);
          row.append(td);
          return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'day-button';
        button.part = 'day-button';
        button.textContent = String(cell.date.day);
        button.dataset.index = String(index);
        button.dataset.date = toISODate(cell.date);
        button.dataset.outside = cell.currentMonth ? 'false' : 'true';
        button.dataset.selected = isSameDate(cell.date, selected) ? 'true' : 'false';
        const isToday = isSameDate(cell.date, today);
        button.dataset.today = isToday ? 'true' : 'false';
        button.setAttribute('aria-pressed', isSameDate(cell.date, selected) ? 'true' : 'false');
        if (isToday) {
          button.setAttribute('aria-current', 'date');
        } else {
          button.removeAttribute('aria-current');
        }
        if (cell.disabled) {
          button.setAttribute('aria-disabled', 'true');
          button.disabled = true;
        } else {
          button.setAttribute('aria-disabled', 'false');
        }
        button.setAttribute('aria-label', this.#fullDateFormatter.format(toDate(cell.date)));
        button.tabIndex = active && isSameDate(cell.date, active) ? 0 : -1;
        td.append(button);
        row.append(td);
      });
    }

    #populateCaptionOptions() {
      const months = Array.from({ length: 12 }, (_, index) => index);
      this.#monthSelect.textContent = '';
      months.forEach((month) => {
        const option = document.createElement('option');
        const date = new Date(Date.UTC(this.#view.year, month, 1, 12));
        option.value = String(month + 1);
        option.textContent = new Intl.DateTimeFormat(this.#locale, {
          month: 'long',
        }).format(date);
        if (month + 1 === this.#view.month) {
          option.selected = true;
        }
        this.#monthSelect.append(option);
      });

      const yearOptions = this.#buildYearOptions();
      this.#yearSelect.textContent = '';
      (yearOptions.length ? yearOptions : [this.#view.year]).forEach((year) => {
        const option = document.createElement('option');
        option.value = String(year);
        option.textContent = String(year);
        if (year === this.#view.year) option.selected = true;
        this.#yearSelect.append(option);
      });
    }

    /**
     * @returns {number[]}
     */
    #buildYearOptions() {
      const currentYear = this.#view.year;
      let start = currentYear - 100;
      let end = currentYear + 100;
      if (this.#min) start = Math.max(start, this.#min.year);
      if (this.#max) end = Math.min(end, this.#max.year);
      const years = [];
      for (let year = start; year <= end; year += 1) {
        years.push(year);
      }
      return years;
    }

    #buildCalendarCells() {
      const { year, month } = this.#view;
      const firstOfMonth = new Date(Date.UTC(year, month - 1, 1, 12));
      const startDay = (firstOfMonth.getUTCDay() - this.#firstDayOfWeek + 7) % 7;
      const startDate = new Date(firstOfMonth);
      startDate.setUTCDate(firstOfMonth.getUTCDate() - startDay);

      /** @type {{ date: PlainDate; currentMonth: boolean; disabled: boolean }[]} */
      const cells = [];
      for (let i = 0; i < 42; i += 1) {
        const current = new Date(startDate);
        current.setUTCDate(startDate.getUTCDate() + i);
        const plain = {
          year: current.getUTCFullYear(),
          month: current.getUTCMonth() + 1,
          day: current.getUTCDate(),
        };
        const currentMonth = current.getUTCMonth() === month - 1;
        const disabled = (this.#min && compareDate(plain, this.#min) < 0) || (this.#max && compareDate(plain, this.#max) > 0);
        cells.push({ date: plain, currentMonth, disabled });
      }
      return cells;
    }

    #onGridClick(event) {
      const target = /** @type {Element} */ (event.target);
      if (!(target instanceof HTMLButtonElement)) return;
      if (!target.dataset.date || target.disabled) return;
      const next = parseISODate(target.dataset.date);
      if (!next) return;
      this.#selectDate(next, true);
    }

    #onGridKeyDown(event) {
      const target = /** @type {Element} */ (event.target);
      if (!(target instanceof HTMLButtonElement)) return;
      if (!target.dataset.date) return;
      const current = parseISODate(target.dataset.date);
      if (!current) return;

      const apply = (nextDate) => {
        this.#view = { year: nextDate.year, month: nextDate.month };
        this.#active = nextDate;
        this.#render();
        this.#focusActiveButton();
      };

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          apply(addDays(current, 1));
          break;
        case 'ArrowLeft':
          event.preventDefault();
          apply(addDays(current, -1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          apply(addDays(current, 7));
          break;
        case 'ArrowUp':
          event.preventDefault();
          apply(addDays(current, -7));
          break;
        case 'Home': {
          event.preventDefault();
          const offset = ((currentDayIndex(current, this.#firstDayOfWeek) % 7) + 7) % 7;
          apply(addDays(current, -offset));
          break;
        }
        case 'End': {
          event.preventDefault();
          const offset = 6 - ((currentDayIndex(current, this.#firstDayOfWeek) % 7) + 7) % 7;
          apply(addDays(current, offset));
          break;
        }
        case 'PageUp':
          event.preventDefault();
          this.#changeMonth(event.shiftKey ? -12 : -1, current);
          break;
        case 'PageDown':
          event.preventDefault();
          this.#changeMonth(event.shiftKey ? 12 : 1, current);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.#selectDate(current, true);
          break;
        default:
          break;
      }
    }

    #focusActiveButton() {
      const activeIso = this.#active ? toISODate(this.#active) : null;
      if (!activeIso) return;
      const button = this.#root.querySelector(`.day-button[data-date="${activeIso}"]`);
      if (button instanceof HTMLButtonElement) {
        button.focus();
      }
    }

    /**
     * @param {number} months
     * @param {PlainDate} fallback
     */
    #changeMonth(months, fallback) {
      this.#view = addMonths({ year: this.#view.year, month: this.#view.month }, months);
      const candidate = clampDate({ ...fallback, year: this.#view.year, month: this.#view.month }, this.#min, this.#max);
      this.#active = candidate;
      if (candidate.year !== this.#view.year || candidate.month !== this.#view.month) {
        this.#view = { year: candidate.year, month: candidate.month };
      }
      this.#render();
      this.#focusActiveButton();
    }

    #onNavClick(event) {
      const target = /** @type {HTMLElement} */ (event.currentTarget);
      if (target.dataset.action === 'previous') {
        this.#changeMonth(-1, this.#active ?? { year: this.#view.year, month: this.#view.month, day: 1 });
      } else {
        this.#changeMonth(1, this.#active ?? { year: this.#view.year, month: this.#view.month, day: 1 });
      }
    }

    #onMonthChange(event) {
      const value = Number.parseInt(/** @type {HTMLSelectElement} */ (event.currentTarget).value, 10);
      if (!Number.isFinite(value)) return;
      this.#view.month = Math.min(Math.max(value, 1), 12);
      if (this.#active) {
        this.#active = clampDate({ ...this.#active, month: this.#view.month }, this.#min, this.#max);
      }
      this.#render();
    }

    #onYearChange(event) {
      const value = Number.parseInt(/** @type {HTMLSelectElement} */ (event.currentTarget).value, 10);
      if (!Number.isFinite(value)) return;
      this.#view.year = value;
      if (this.#active) {
        this.#active = clampDate({ ...this.#active, year: this.#view.year }, this.#min, this.#max);
      }
      this.#render();
    }

    /**
     * @param {PlainDate} date
     * @param {boolean} announce
     */
    #selectDate(date, announce) {
      if ((this.#min && compareDate(date, this.#min) < 0) || (this.#max && compareDate(date, this.#max) > 0)) {
        return;
      }
      this.#selected = date;
      this.#view = { year: date.year, month: date.month };
      this.#active = date;
      const iso = toISODate(date);
      this.#reflectingValue = true;
      this.setAttribute('value', iso);
      this.#reflectingValue = false;
      this.#render();
      if (announce) {
        this.dispatchEvent(
          new CustomEvent('change', {
            bubbles: true,
            composed: true,
            detail: {
              value: iso,
              date: toDate(date),
            },
          })
        );
      }
    }
  }

  /**
   * @param {PlainDate} date
   * @param {number} firstDayOfWeek
   */
  const currentDayIndex = (date, firstDayOfWeek) => {
    const jsDate = new Date(Date.UTC(date.year, date.month - 1, date.day, 12));
    return (jsDate.getUTCDay() - firstDayOfWeek + 7) % 7;
  };

  if (!window.customElements.get('wc-calendar')) {
    window.customElements.define('wc-calendar', WcCalendar);
  }
})();

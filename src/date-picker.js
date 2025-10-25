/**
 * @file date-picker.js
 * @version 1.0.0
 *
 * Accessible date picker web component with optional range selection and quick
 * presets. Inspired by the Radix UI Date Picker pattern while remaining
 * dependency-free and CDN friendly.
 *
 * Usage:
 * <wc-date-picker mode="range" value="2024-05-01..2024-05-07"></wc-date-picker>
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
   * @param {string | null} value
   * @returns {Date | null}
   */
  const parseISODate = (value) => {
    if (!value) return null;
    const parts = value.split('-').map((part) => Number.parseInt(part, 10));
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  };

  /**
   * @param {Date | null | undefined} date
   * @returns {string}
   */
  const toISODate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * @param {Date | null} a
   * @param {Date | null} b
   */
  const isSameDay = (a, b) => {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  /**
   * @param {Date | null} date
   * @returns {Date | null}
   */
  const startOfDay = (date) => {
    if (!date) return null;
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
  };

  /**
   * @param {Date} date
   * @param {number} days
   */
  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const DEFAULT_PRESETS = [
    {
      id: 'today',
      label: 'Today',
      /**
       * @param {Date} today
       */
      range(today) {
        return { start: startOfDay(today), end: startOfDay(today) };
      },
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      /**
       * @param {Date} today
       */
      range(today) {
        const start = addDays(today, -1);
        return { start: startOfDay(start), end: startOfDay(start) };
      },
    },
    {
      id: 'last7',
      label: 'Last 7 days',
      /**
       * @param {Date} today
       */
      range(today) {
        const end = startOfDay(today);
        const start = addDays(end, -6);
        return { start, end };
      },
    },
    {
      id: 'last30',
      label: 'Last 30 days',
      /**
       * @param {Date} today
       */
      range(today) {
        const end = startOfDay(today);
        const start = addDays(end, -29);
        return { start, end };
      },
    },
    {
      id: 'this-month',
      label: 'This month',
      /**
       * @param {Date} today
       */
      range(today) {
        const start = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
        const end = startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        return { start, end };
      },
    },
  ];

  /**
   * @typedef {{ date: Date; currentMonth: boolean }} CalendarCell
   */

  class WcDatePicker extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'mode', 'min', 'max', 'locale', 'first-day-of-week', 'placeholder', 'hide-presets'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #trigger;
    /** @type {HTMLElement} */
    #label;
    /** @type {HTMLDivElement} */
    #panel;
    /** @type {HTMLButtonElement} */
    #previous;
    /** @type {HTMLButtonElement} */
    #next;
    /** @type {HTMLElement} */
    #monthLabel;
    /** @type {HTMLDivElement} */
    #grid;
    /** @type {HTMLDivElement | null} */
    #presets;
    /** @type {HTMLSpanElement} */
    #selectionStatus;
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #reflectingValue = false;
    /** @type {'single' | 'range'} */
    #mode = 'single';
    /** @type {Date | null} */
    #selectedStart = null;
    /** @type {Date | null} */
    #selectedEnd = null;
    /** @type {Date | null} */
    #min = null;
    /** @type {Date | null} */
    #max = null;
    /** @type {Intl.DateTimeFormat} */
    #dateFormatter;
    /** @type {Intl.DateTimeFormat} */
    #weekdayFormatter;
    /** @type {Intl.DateTimeFormat} */
    #monthFormatter;
    /** @type {number} */
    #firstDayOfWeek = 0;
    /** @type {Date} */
    #viewMonth;
    /** @type {(event: PointerEvent) => void} */
    #onDocumentPointerDown;
    /** @type {(event: KeyboardEvent) => void} */
    #onDocumentKeyDown;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-date-picker-surface: var(--wc-date-picker-background, rgba(255, 255, 255, 0.98));
            --wc-date-picker-border: var(--wc-date-picker-border-color, rgba(15, 23, 42, 0.08));
            --wc-date-picker-radius: var(--wc-date-picker-radius, 0.75rem);
            --wc-date-picker-shadow: var(--wc-date-picker-shadow, 0 24px 48px -32px rgba(15, 23, 42, 0.45));
            --wc-date-picker-accent: var(--wc-date-picker-accent, rgb(79, 70, 229));
            --wc-date-picker-accent-soft: var(--wc-date-picker-accent-soft, rgba(79, 70, 229, 0.12));
            --wc-date-picker-muted: var(--wc-date-picker-muted, rgba(71, 85, 105, 0.85));
            --wc-date-picker-gap: var(--wc-date-picker-gap, 0.75rem);
            display: inline-block;
            font: inherit;
            color: inherit;
            position: relative;
          }

          :host([hidden]) {
            display: none !important;
          }

          button {
            font: inherit;
          }

          [part="trigger"] {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            min-inline-size: 12.5rem;
            padding: 0.65rem 0.85rem;
            border-radius: 0.75rem;
            border: 1px solid var(--wc-date-picker-border);
            background: rgba(255, 255, 255, 0.75);
            color: inherit;
            cursor: pointer;
            transition: box-shadow 120ms ease, border-color 120ms ease, background 120ms ease;
          }

          [part="trigger"]:hover {
            background: rgba(79, 70, 229, 0.08);
          }

          [part="trigger"]:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.35);
            outline-offset: 2px;
          }

          [part="icon"] {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            inline-size: 1.1rem;
            block-size: 1.1rem;
          }

          [part="panel"] {
            position: absolute;
            inset-block-start: calc(100% + 0.5rem);
            inset-inline-start: 0;
            z-index: 10;
            min-inline-size: 18rem;
            background: var(--wc-date-picker-surface);
            border: 1px solid var(--wc-date-picker-border);
            border-radius: var(--wc-date-picker-radius);
            box-shadow: var(--wc-date-picker-shadow);
            padding: 1rem;
            display: grid;
            gap: var(--wc-date-picker-gap);
            grid-template-columns: minmax(0, 1fr) auto;
          }

          :host([data-presets-hidden="true"]) [part="panel"] {
            grid-template-columns: 1fr;
          }

          :host([data-open="false"]) [part="panel"] {
            display: none;
          }

          :host([data-open="true"]) [part="panel"] {
            display: grid;
          }

          @media (max-width: 520px) {
            [part="panel"] {
              grid-template-columns: 1fr;
              min-inline-size: min(100vw - 2rem, 20rem);
            }

            [part="presets"] {
              order: 2;
            }
          }

          [part="calendar"] {
            display: grid;
            gap: 0.75rem;
          }

          [part="month"] {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
          }

          [part="month-title"] {
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          [part="nav"] {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
          }

          [part="nav"] button {
            inline-size: 2rem;
            block-size: 2rem;
            border-radius: 0.5rem;
            border: 1px solid transparent;
            background: transparent;
            color: inherit;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 120ms ease, border-color 120ms ease;
          }

          [part="nav"] button:hover {
            background: rgba(99, 102, 241, 0.08);
          }

          [part="nav"] button:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.35);
            outline-offset: 2px;
          }

          [part="weekdays"] {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            font-size: 0.75rem;
            text-transform: uppercase;
            color: var(--wc-date-picker-muted);
            gap: 0.25rem;
          }

          [part="weekdays"] span {
            text-align: center;
          }

          [part="grid"] {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 0.25rem;
          }

          [part="day"] {
            border: none;
            border-radius: 0.65rem;
            background: transparent;
            padding: 0.45rem 0.25rem;
            text-align: center;
            font-size: 0.95rem;
            color: inherit;
            cursor: pointer;
            position: relative;
            transition: background 120ms ease, color 120ms ease;
          }

          [part="day"][data-today="true"]::after {
            content: '';
            position: absolute;
            inset-inline: 35%;
            inset-block-end: 0.35rem;
            border-radius: 999px;
            background: var(--wc-date-picker-accent);
            inline-size: 0.35rem;
            block-size: 0.35rem;
          }

          [part="day"][data-outside="true"] {
            color: rgba(148, 163, 184, 0.65);
          }

          [part="day"][data-disabled="true"] {
            color: rgba(148, 163, 184, 0.45);
            cursor: not-allowed;
          }

          [part="day"][data-disabled="true"]::after {
            display: none;
          }

          [part="day"][data-in-range="true"] {
            background: rgba(79, 70, 229, 0.12);
          }

          [part="day"][data-range-start="true"],
          [part="day"][data-range-end="true"],
          [part="day"][data-selected="true"] {
            background: var(--wc-date-picker-accent);
            color: white;
          }

          [part="presets"] {
            display: grid;
            gap: 0.35rem;
            padding-inline-start: 1rem;
            min-inline-size: 10rem;
          }

          [part="presets"] header {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--wc-date-picker-muted);
          }

          [part="preset-button"] {
            border: 1px solid transparent;
            border-radius: 0.65rem;
            background: transparent;
            color: inherit;
            text-align: left;
            padding: 0.55rem 0.75rem;
            cursor: pointer;
            transition: background 120ms ease, border-color 120ms ease;
          }

          [part="preset-button"]:hover {
            background: rgba(79, 70, 229, 0.08);
          }

          [part="preset-button"]:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.35);
            outline-offset: 2px;
          }

          [part="status"] {
            font-size: 0.8rem;
            color: var(--wc-date-picker-muted);
          }
        </style>
        <button part="trigger" type="button" aria-haspopup="dialog" aria-expanded="false">
          <span part="label"></span>
          <span part="icon" aria-hidden="true">▾</span>
        </button>
        <div part="panel" role="dialog" aria-modal="false" hidden>
          <div part="calendar">
            <div part="month">
              <span part="month-title"></span>
              <span part="nav">
                <button type="button" data-action="prev" aria-label="Previous month">◀</button>
                <button type="button" data-action="next" aria-label="Next month">▶</button>
              </span>
            </div>
            <div part="weekdays"></div>
            <div part="grid" role="grid" aria-label="Calendar dates"></div>
            <span part="status" aria-live="polite"></span>
          </div>
          <div part="presets"></div>
        </div>
      `;

      this.#trigger = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[part="trigger"]'));
      this.#label = /** @type {HTMLElement} */ (this.#root.querySelector('[part="label"]'));
      this.#panel = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="panel"]'));
      this.#previous = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[data-action="prev"]'));
      this.#next = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[data-action="next"]'));
      this.#monthLabel = /** @type {HTMLElement} */ (this.#root.querySelector('[part="month-title"]'));
      this.#grid = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="grid"]'));
      this.#presets = /** @type {HTMLDivElement | null} */ (this.#root.querySelector('[part="presets"]'));
      this.#selectionStatus = /** @type {HTMLSpanElement} */ (this.#root.querySelector('[part="status"]'));

      const locale = this.getAttribute('locale') || navigator.language || 'en-US';
      this.#dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
      this.#weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
      this.#monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
      const today = startOfDay(new Date()) ?? new Date();
      this.#viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      this.#onDocumentPointerDown = (event) => {
        if (!this.#open) return;
        const path = event.composedPath();
        if (!path.includes(this) && !path.includes(this.#panel)) {
          this.close();
        }
      };

      this.#onDocumentKeyDown = (event) => {
        if (!this.#open) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
          this.#trigger.focus({ preventScroll: true });
        }
      };
    }

    connectedCallback() {
      upgradeProperty(this, 'value');
      upgradeProperty(this, 'mode');

      this.setAttribute('data-open', 'false');
      this.#panel.hidden = true;

      this.#trigger.addEventListener('click', () => {
        this.#open ? this.close() : this.open();
      });

      this.#trigger.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.open();
        }
      });

      this.#previous.addEventListener('click', () => {
        this.#changeMonth(-1);
      });

      this.#next.addEventListener('click', () => {
        this.#changeMonth(1);
      });

      const weekdays = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="weekdays"]'));
      weekdays.innerHTML = '';
      for (const label of this.#buildWeekdayLabels()) {
        const span = document.createElement('span');
        span.textContent = label;
        weekdays.append(span);
      }

      this.#panel.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
          this.#trigger.focus({ preventScroll: true });
        }
      });

      if (this.#presets) {
        this.#renderPresets();
      }

      this.#grid.addEventListener('keydown', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          this.#moveFocusWithinGrid(target, event.key);
        } else if (event.key === 'PageUp' || event.key === 'PageDown') {
          event.preventDefault();
          this.#focusAdjacentMonth(target, event.key === 'PageUp' ? -1 : 1);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          target.click();
        }
      });

      this.#syncFromAttributes();
      this.#renderCalendar();
      this.#updateLabel();
    }

    disconnectedCallback() {
      document.removeEventListener('pointerdown', this.#onDocumentPointerDown);
      document.removeEventListener('keydown', this.#onDocumentKeyDown);
    }

    /**
     * Opens the calendar popover.
     */
    open() {
      if (this.#open) return;
      this.#open = true;
      this.setAttribute('data-open', 'true');
      this.#panel.hidden = false;
      this.#trigger.setAttribute('aria-expanded', 'true');
      document.addEventListener('pointerdown', this.#onDocumentPointerDown);
      document.addEventListener('keydown', this.#onDocumentKeyDown);
      this.#focusSelectedDay();
    }

    /**
     * Closes the calendar popover.
     */
    close() {
      if (!this.#open) return;
      this.#open = false;
      this.setAttribute('data-open', 'false');
      this.#panel.hidden = true;
      this.#trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', this.#onDocumentPointerDown);
      document.removeEventListener('keydown', this.#onDocumentKeyDown);
    }

    /**
     * Selected value. For range mode this returns a string in the format
     * `YYYY-MM-DD..YYYY-MM-DD`. In single mode it returns a single ISO date.
     */
    get value() {
      if (!this.#selectedStart) return '';
      if (this.#mode === 'range') {
        const end = this.#selectedEnd ?? this.#selectedStart;
        return `${toISODate(this.#selectedStart)}..${toISODate(end)}`;
      }
      return toISODate(this.#selectedStart);
    }

    set value(newValue) {
      this.#setValueFromString(newValue);
      if (!this.#reflectingValue) {
        this.#reflectingValue = true;
        if (newValue) {
          this.setAttribute('value', newValue);
        } else {
          this.removeAttribute('value');
        }
        this.#reflectingValue = false;
      }
      this.#updateLabel();
      this.#renderCalendar();
    }

    /**
     * Selection mode. Accepts `single` (default) or `range`.
     */
    get mode() {
      return this.#mode;
    }

    set mode(value) {
      const next = value === 'range' ? 'range' : 'single';
      if (this.#mode !== next) {
        this.#mode = next;
        if (next === 'single' && this.#selectedStart) {
          this.#selectedEnd = null;
        }
        this.#updateLabel();
        this.#renderCalendar();
        if (!this.#reflectingValue) {
          this.setAttribute('mode', next);
        }
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      switch (name) {
        case 'value':
          if (!this.#reflectingValue) {
            this.#setValueFromString(newValue ?? '');
            this.#updateLabel();
            this.#renderCalendar();
          }
          break;
        case 'mode':
          this.mode = newValue === 'range' ? 'range' : 'single';
          break;
        case 'min':
          this.#min = parseISODate(newValue);
          this.#renderCalendar();
          break;
        case 'max':
          this.#max = parseISODate(newValue);
          this.#renderCalendar();
          break;
        case 'locale': {
          const locale = newValue || navigator.language || 'en-US';
          this.#dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
          this.#weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
          this.#monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
          const weekdays = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="weekdays"]'));
          weekdays.innerHTML = '';
          for (const label of this.#buildWeekdayLabels()) {
            const span = document.createElement('span');
            span.textContent = label;
            weekdays.append(span);
          }
          this.#updateLabel();
          this.#renderCalendar();
          break;
        }
        case 'first-day-of-week': {
          const number = newValue == null || newValue === '' ? NaN : Number(newValue);
          if (Number.isFinite(number) && number >= 0 && number <= 6) {
            this.#firstDayOfWeek = number;
            const weekdays = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="weekdays"]'));
            weekdays.innerHTML = '';
            for (const label of this.#buildWeekdayLabels()) {
              const span = document.createElement('span');
              span.textContent = label;
              weekdays.append(span);
            }
            this.#renderCalendar();
          }
          break;
        }
        case 'placeholder':
          this.#updateLabel();
          break;
        case 'hide-presets':
          if (this.#presets) {
            const hidden = newValue !== null;
            this.#presets.hidden = hidden;
            this.toggleAttribute('data-presets-hidden', hidden);
          }
          break;
        default:
          break;
      }
    }

    /**
     * @param {string} value
     */
    #setValueFromString(value) {
      if (!value) {
        this.#selectedStart = null;
        this.#selectedEnd = null;
        return;
      }
      if (this.#mode === 'range') {
        const [startValue, endValue] = value.split('..');
        const start = parseISODate(startValue ?? '');
        const end = parseISODate(endValue ?? '');
        this.#selectedStart = start;
        this.#selectedEnd = end ?? null;
        if (this.#selectedStart && this.#selectedEnd && this.#selectedEnd < this.#selectedStart) {
          const temp = this.#selectedStart;
          this.#selectedStart = this.#selectedEnd;
          this.#selectedEnd = temp;
        }
        if (this.#selectedStart) {
          this.#viewMonth = startOfDay(new Date(this.#selectedStart.getFullYear(), this.#selectedStart.getMonth(), 1)) ?? this.#viewMonth;
        }
      } else {
        const date = parseISODate(value);
        this.#selectedStart = date;
        this.#selectedEnd = null;
        if (date) {
          this.#viewMonth = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1)) ?? this.#viewMonth;
        }
      }
    }

    #syncFromAttributes() {
      const modeAttribute = this.getAttribute('mode');
      this.#mode = modeAttribute === 'range' ? 'range' : 'single';
      this.#min = parseISODate(this.getAttribute('min'));
      this.#max = parseISODate(this.getAttribute('max'));
      const firstDayAttr = this.getAttribute('first-day-of-week');
      const firstDayNumber = firstDayAttr == null || firstDayAttr === '' ? NaN : Number(firstDayAttr);
      if (Number.isFinite(firstDayNumber) && firstDayNumber >= 0 && firstDayNumber <= 6) {
        this.#firstDayOfWeek = firstDayNumber;
      }
      this.#setValueFromString(this.getAttribute('value') ?? '');
      if (this.#presets) {
        if (this.hasAttribute('hide-presets')) {
          this.#presets.hidden = true;
          this.setAttribute('data-presets-hidden', 'true');
        } else {
          this.#presets.hidden = false;
          this.removeAttribute('data-presets-hidden');
        }
      }
    }

    /**
     * @returns {string[]}
     */
    #buildWeekdayLabels() {
      const labels = [];
      const reference = new Date(2021, 5, 6); // arbitrary Sunday reference
      for (let index = 0; index < 7; index++) {
        const date = new Date(reference);
        date.setDate(reference.getDate() + ((this.#firstDayOfWeek + index) % 7));
        labels.push(this.#weekdayFormatter.format(date));
      }
      return labels;
    }

    #renderCalendar() {
      this.#monthLabel.textContent = this.#monthFormatter.format(this.#viewMonth);
      this.#grid.innerHTML = '';

      for (const cell of this.#buildCalendarCells()) {
        const button = document.createElement('button');
        button.part.add('day');
        button.type = 'button';
        button.textContent = `${cell.date.getDate()}`;
        button.dataset.date = toISODate(cell.date);
        button.dataset.outside = cell.currentMonth ? 'false' : 'true';
        const today = new Date();
        button.dataset.today = isSameDay(cell.date, today) ? 'true' : 'false';

        const disabled = (this.#min && cell.date < this.#min) || (this.#max && cell.date > this.#max);
        button.dataset.disabled = disabled ? 'true' : 'false';
        button.disabled = disabled;

        const isSelected = this.#mode === 'single' ? isSameDay(cell.date, this.#selectedStart) : isSameDay(cell.date, this.#selectedStart) || isSameDay(cell.date, this.#selectedEnd);
        button.dataset.selected = isSelected ? 'true' : 'false';

        if (this.#mode === 'range' && this.#selectedStart) {
          const end = this.#selectedEnd ?? this.#selectedStart;
          const start = this.#selectedStart;
          const time = cell.date.getTime();
          const inRange = start && end && time >= start.getTime() && time <= end.getTime();
          button.dataset.inRange = inRange ? 'true' : 'false';
          button.dataset.rangeStart = isSameDay(cell.date, start) ? 'true' : 'false';
          button.dataset.rangeEnd = isSameDay(cell.date, end) ? 'true' : 'false';
        } else {
          button.dataset.inRange = 'false';
          button.dataset.rangeStart = 'false';
          button.dataset.rangeEnd = 'false';
        }

        button.setAttribute('aria-label', this.#dateFormatter.format(cell.date));
        button.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        button.setAttribute('role', 'gridcell');

        button.addEventListener('click', () => {
          if (disabled) return;
          this.#selectDate(cell.date);
        });

        this.#grid.append(button);
      }

      this.#updateStatus();
    }

    /**
     * @returns {CalendarCell[]}
     */
    #buildCalendarCells() {
      const startOfMonth = new Date(this.#viewMonth.getFullYear(), this.#viewMonth.getMonth(), 1);
      const endOfMonth = new Date(this.#viewMonth.getFullYear(), this.#viewMonth.getMonth() + 1, 0);
      const startOffset = (startOfMonth.getDay() - this.#firstDayOfWeek + 7) % 7;
      const totalDays = endOfMonth.getDate();
      const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;
      const firstDate = new Date(startOfMonth);
      firstDate.setDate(1 - startOffset);

      const cells = [];
      for (let index = 0; index < totalCells; index++) {
        const date = new Date(firstDate);
        date.setDate(firstDate.getDate() + index);
        date.setHours(0, 0, 0, 0);
        cells.push({ date, currentMonth: date.getMonth() === this.#viewMonth.getMonth() });
      }
      return cells;
    }

    /**
     * @param {Date} date
     */
    #selectDate(date) {
      const selected = startOfDay(date);
      if (!selected) return;

      if (this.#mode === 'single') {
        this.#selectedStart = selected;
        this.#selectedEnd = null;
        this.#reflectValueToAttribute();
        this.#renderCalendar();
        this.#updateLabel();
        this.#dispatchChange();
        this.close();
        this.#trigger.focus({ preventScroll: true });
      } else {
        if (!this.#selectedStart || (this.#selectedStart && this.#selectedEnd)) {
          this.#selectedStart = selected;
          this.#selectedEnd = null;
        } else if (selected < this.#selectedStart) {
          this.#selectedEnd = this.#selectedStart;
          this.#selectedStart = selected;
        } else {
          this.#selectedEnd = selected;
        }
        this.#reflectValueToAttribute();
        this.#renderCalendar();
        this.#updateLabel();
        if (this.#selectedStart && this.#selectedEnd) {
          this.#dispatchChange();
          this.close();
          this.#trigger.focus({ preventScroll: true });
        }
      }
    }

    #reflectValueToAttribute() {
      const value = this.value;
      this.#reflectingValue = true;
      if (value) {
        this.setAttribute('value', value);
      } else {
        this.removeAttribute('value');
      }
      this.#reflectingValue = false;
    }

    #dispatchChange() {
      const detail = {
        value: this.value,
        start: this.#selectedStart ? new Date(this.#selectedStart) : null,
        end: this.#mode === 'range' ? (this.#selectedEnd ? new Date(this.#selectedEnd) : null) : null,
      };
      this.dispatchEvent(new CustomEvent('date-change', { detail }));
    }

    #updateLabel() {
      const placeholder = this.getAttribute('placeholder') || (this.#mode === 'range' ? 'Select dates' : 'Select date');
      if (!this.#selectedStart) {
        this.#label.textContent = placeholder;
        this.#trigger.dataset.empty = 'true';
        return;
      }
      this.#trigger.dataset.empty = 'false';
      if (this.#mode === 'single' || !this.#selectedEnd) {
        this.#label.textContent = this.#dateFormatter.format(this.#selectedStart);
      } else {
        const startText = this.#dateFormatter.format(this.#selectedStart);
        const endText = this.#dateFormatter.format(this.#selectedEnd);
        this.#label.textContent = `${startText} – ${endText}`;
      }
    }

    #updateStatus() {
      if (!this.#selectedStart) {
        this.#selectionStatus.textContent = this.#mode === 'range' ? 'No dates selected' : 'No date selected';
        return;
      }
      if (this.#mode === 'single' || !this.#selectedEnd) {
        this.#selectionStatus.textContent = `Selected ${this.#dateFormatter.format(this.#selectedStart)}`;
      } else {
        this.#selectionStatus.textContent = `Selected ${this.#dateFormatter.format(this.#selectedStart)} to ${this.#dateFormatter.format(this.#selectedEnd)}`;
      }
    }

    #renderPresets() {
      if (!this.#presets) return;
      this.#presets.innerHTML = '';
      const header = document.createElement('header');
      header.textContent = 'Quick presets';
      this.#presets.append(header);

      const today = startOfDay(new Date()) ?? new Date();
      for (const preset of DEFAULT_PRESETS) {
        const button = document.createElement('button');
        button.part.add('preset-button');
        button.type = 'button';
        button.textContent = preset.label;
        button.dataset.preset = preset.id;
        button.addEventListener('click', () => {
          const { start, end } = preset.range(startOfDay(new Date()) ?? today);
          if (!start) return;
          this.#selectedStart = start;
          this.#selectedEnd = this.#mode === 'range' ? end ?? start : null;
          if (this.#mode === 'single') {
            this.#selectedStart = end ?? start;
          }
          this.#viewMonth = new Date(start.getFullYear(), start.getMonth(), 1);
          this.#reflectValueToAttribute();
          this.#renderCalendar();
          this.#updateLabel();
          this.#dispatchChange();
          this.close();
          this.#trigger.focus({ preventScroll: true });
        });
        this.#presets.append(button);
      }
    }

    /**
     * @param {number} offset
     */
    #changeMonth(offset) {
      const next = new Date(this.#viewMonth);
      next.setMonth(this.#viewMonth.getMonth() + offset);
      this.#viewMonth = next;
      this.#renderCalendar();
    }

    #focusSelectedDay() {
      if (!this.#grid) return;
      requestAnimationFrame(() => {
        if (!this.#grid) return;
        const targetDate = this.#selectedEnd ?? this.#selectedStart;
        const selector = targetDate ? `[data-date="${toISODate(targetDate)}"]` : '[data-disabled="false"][data-outside="false"]';
        const button = /** @type {HTMLButtonElement | null} */ (this.#grid.querySelector(selector));
        if (button) {
          button.focus({ preventScroll: true });
        } else {
          const first = /** @type {HTMLButtonElement | null} */ (
            this.#grid.querySelector('[data-disabled="false"]')
          );
          first?.focus({ preventScroll: true });
        }
      });
    }

    /**
     * @param {HTMLButtonElement} current
     * @param {'ArrowRight' | 'ArrowLeft' | 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'} key
     */
    #moveFocusWithinGrid(current, key) {
      const buttons = /** @type {HTMLButtonElement[]} */ (
        Array.from(this.#grid.querySelectorAll('button'))
      );
      const index = buttons.indexOf(current);
      if (index === -1) return;
      let targetIndex = index;
      switch (key) {
        case 'ArrowRight':
          targetIndex = Math.min(index + 1, buttons.length - 1);
          break;
        case 'ArrowLeft':
          targetIndex = Math.max(index - 1, 0);
          break;
        case 'ArrowDown':
          targetIndex = Math.min(index + 7, buttons.length - 1);
          break;
        case 'ArrowUp':
          targetIndex = Math.max(index - 7, 0);
          break;
        case 'Home':
          targetIndex = index - (index % 7);
          break;
        case 'End':
          targetIndex = index + (6 - (index % 7));
          break;
      }
      const button = buttons[targetIndex];
      button?.focus({ preventScroll: true });
    }

    /**
     * @param {HTMLButtonElement} current
     * @param {number} monthOffset
     */
    #focusAdjacentMonth(current, monthOffset) {
      const iso = current.dataset.date;
      const currentDate = parseISODate(iso ?? '');
      const fallback = this.#selectedEnd ?? this.#selectedStart ?? this.#viewMonth;
      const base = currentDate ?? fallback;
      const desiredDay = base.getDate();
      const year = base.getFullYear();
      const monthIndex = base.getMonth() + monthOffset;
      const lastOfTarget = new Date(year, monthIndex + 1, 0);
      const clampedDay = Math.min(desiredDay, lastOfTarget.getDate());
      const next = new Date(year, monthIndex, clampedDay);
      this.#viewMonth = new Date(next.getFullYear(), next.getMonth(), 1);
      this.#renderCalendar();
      const isoTarget = toISODate(next);
      const button = /** @type {HTMLButtonElement | null} */ (
        this.#grid.querySelector(`[data-date="${isoTarget}"]`)
      );
      if (button && button.dataset.disabled !== 'true') {
        button.focus({ preventScroll: true });
      } else {
        this.#focusSelectedDay();
      }
    }
  }

  if (!customElements.get('wc-date-picker')) {
    customElements.define('wc-date-picker', WcDatePicker);
  }
})();

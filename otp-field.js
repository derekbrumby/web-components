/**
 * @file otp-field.js
 * @version 1.0.0
 * @license MIT
 *
 * A zero-dependency Web Component for one-time password / verification codes.
 * - Form-associated (submits a single value via the `name` attribute)
 * - Paste-to-fill, keyboard nav, RTL/LTR, horizontal/vertical
 * - Validation: numeric | alphanumeric | any
 * - Auto-submit on completion
 * - Deep theming via CSS custom properties + ::part()
 */

/**
 * @typedef {'numeric'|'alphanumeric'|'any'} ValidationType
 * @typedef {'horizontal'|'vertical'} Orientation
 */

(() => {
  /** @type {boolean} */
  const supportsFormAssociated = !!HTMLElement.prototype.attachInternals;

  class OtpField extends HTMLElement {
    static formAssociated = supportsFormAssociated;

    /** @type {ElementInternals|undefined} */
    #internals;

    /** @type {HTMLInputElement[]} */
    #cells = [];

    /** @type {HTMLInputElement} */
    #hiddenAutoFill;

    /** @type {ShadowRoot} */
    #root;

    /** @type {number} */
    #length = 6;

    /** @type {ValidationType} */
    #validationType = 'numeric';

    /** @type {'text'|'password'} */
    #displayType = 'text';

    /** @type {Orientation} */
    #orientation = 'horizontal';

    /** @type {boolean} */
    #autoSubmit = false;

    /** @type {boolean} */
    #disabled = false;

    /** @type {boolean} */
    #readOnly = false;

    /** @type {string} */
    #placeholder = '';

    /** @type {string} */
    #value = '';

    /** @type {'ltr'|'rtl'|'auto'} */
    #dir = 'ltr';

    static get observedAttributes() {
      return [
        'length',
        'validation-type',
        'type',
        'orientation',
        'auto-submit',
        'disabled',
        'readonly',
        'placeholder',
        'value',
        'dir',
        'name',
        'autocomplete',
        'autofocus'
      ];
    }

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });

      if (supportsFormAssociated) {
        // @ts-ignore - ElementInternals in lib.dom.d.ts
        this.#internals = this.attachInternals();
      }

      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            --otp-gap: .375rem;
            --otp-input-size: 36px;          /* height and min-width */
            --otp-font-size: 16px;
            --otp-radius: 8px;
            --otp-bg: #fff;
            --otp-color: #111;
            --otp-border: 1px solid #d1d5db; /* gray-300 */
            --otp-border-focus: 2px solid #111;
            --otp-shadow-focus: 0 0 0 2px rgba(17,17,17,.15);
          }
          [part="root"] {
            display: inline-flex;
            gap: var(--otp-gap);
            flex-wrap: nowrap;
          }
          :host([data-orientation="vertical"]) [part="root"] {
            flex-direction: column;
          }
          :host([disabled]) {
            opacity: .6;
            pointer-events: none;
          }
          .visually-hidden {
            position: absolute !important;
            width: 1px; height: 1px;
            clip: rect(1px, 1px, 1px, 1px);
            clip-path: inset(50%);
            overflow: hidden;
            white-space: nowrap;
            border: 0; padding: 0; margin: -1px;
          }
          input[part="input"] {
            box-sizing: border-box;
            height: var(--otp-input-size);
            min-width: var(--otp-input-size);
            width: var(--otp-input-size);
            text-align: center;
            font: inherit;
            font-size: var(--otp-font-size);
            border: var(--otp-border);
            border-radius: var(--otp-radius);
            background: var(--otp-bg);
            color: var(--otp-color);
            outline: none;
            padding: 0;
          }
          input[part="input"]::placeholder {
            color: #9ca3af; /* gray-400 */
          }
          input[part="input"]:focus {
            border: var(--otp-border-focus);
            box-shadow: var(--otp-shadow-focus);
          }
          input[part="input"][disabled],
          input[part="input"][readonly] {
            cursor: default;
            background: #f3f4f6; /* gray-100 */
          }
        </style>
        <div part="root" role="group" aria-label="One-time code"></div>
        <!-- A hidden autofill target; stays entirely within shadow so it won't be submitted -->
        <input part="hidden" class="visually-hidden" aria-hidden="true" tabindex="-1">
      `;

      this.#hiddenAutoFill = /** @type {HTMLInputElement} */ (this.#root.querySelector('input[part="hidden"]'));
      this.#hiddenAutoFill.setAttribute('autocomplete', this.autocomplete || 'one-time-code');
      this.#hiddenAutoFill.addEventListener('input', this.#onHiddenAutoFill);
      this.#hiddenAutoFill.addEventListener('change', this.#onHiddenAutoFill);

      this.#rebuild();
    }

    connectedCallback() {
      this.setAttribute('data-orientation', this.#orientation);
      if (this.autofocus) {
        // Defer so it's safe during parse
        queueMicrotask(() => this.focus());
      }
      // Sync initial form value
      this.#updateFormValue();
    }

    // ===== Attributes ⇄ Properties =====

    /** @returns {number} */
    get length() { return this.#length; }
    set length(v) {
      const n = Number(v);
      const next = Number.isFinite(n) && n > 0 ? Math.min(Math.max(1, n), 12) : 6;
      if (next !== this.#length) {
        this.#length = next;
        this.setAttribute('length', String(next));
        this.#rebuild();
      }
    }

    /** @returns {ValidationType} */
    get validationType() { return this.#validationType; }
    set validationType(v) {
      const next = (v === 'alphanumeric' || v === 'any') ? v : 'numeric';
      if (next !== this.#validationType) {
        this.#validationType = next;
        this.setAttribute('validation-type', next);
        this.#cells.forEach((c) => {
          c.setAttribute('inputmode', this.#inputMode());
          c.setAttribute('pattern', this.#pattern() || '');
        });
      }
    }

    /** @returns {'text'|'password'} */
    get type() { return this.#displayType; }
    set type(v) {
      const next = v === 'password' ? 'password' : 'text';
      if (next !== this.#displayType) {
        this.#displayType = next;
        this.setAttribute('type', next);
        this.#cells.forEach((c) => (c.type = next));
      }
    }

    /** @returns {Orientation} */
    get orientation() { return this.#orientation; }
    set orientation(v) {
      const next = v === 'vertical' ? 'vertical' : 'horizontal';
      if (next !== this.#orientation) {
        this.#orientation = next;
        this.setAttribute('orientation', next);
        this.setAttribute('data-orientation', next);
      }
    }

    /** @returns {boolean} */
    get autoSubmit() { return this.#autoSubmit; }
    set autoSubmit(v) {
      const next = Boolean(v);
      if (next !== this.#autoSubmit) {
        this.#autoSubmit = next;
        this.toggleAttribute('auto-submit', next);
      }
    }

    /** @returns {boolean} */
    get disabled() { return this.#disabled; }
    set disabled(v) {
      const next = Boolean(v);
      if (next !== this.#disabled) {
        this.#disabled = next;
        this.toggleAttribute('disabled', next);
        this.#cells.forEach((c) => (c.disabled = next));
      }
    }

    /** @returns {boolean} */
    get readOnly() { return this.#readOnly; }
    set readOnly(v) {
      const next = Boolean(v);
      if (next !== this.#readOnly) {
        this.#readOnly = next;
        this.toggleAttribute('readonly', next);
        this.#cells.forEach((c) => (c.readOnly = next));
      }
    }

    /** @returns {string} */
    get placeholder() { return this.#placeholder; }
    set placeholder(v) {
      const next = String(v ?? '');
      if (next !== this.#placeholder) {
        this.#placeholder = next;
        this.setAttribute('placeholder', next);
        this.#cells.forEach((c) => (c.placeholder = next));
      }
    }

    /** The single submitted/controlled value. @returns {string} */
    get value() { return this.#value; }
    set value(v) {
      const next = this.#sanitizeAll(String(v ?? ''));
      if (next !== this.#value) {
        this.#value = next;
        this.setAttribute('value', next);
        this.#syncCellsFromValue();
        this.#updateFormValue();
        this.#emitValueChange();
        this.#maybeAutoSubmit();
      }
    }

    /** @returns {'ltr'|'rtl'|'auto'} */
    get dir() { return this.#dir; }
    set dir(v) {
      const next = (v === 'rtl' || v === 'auto') ? v : 'ltr';
      if (next !== this.#dir) {
        this.#dir = next;
        this.setAttribute('dir', next);
      }
    }

    /** Pass-through for the hidden auto-fill target. @returns {string} */
    get autocomplete() {
      return this.getAttribute('autocomplete') ?? 'one-time-code';
    }
    set autocomplete(v) {
      if (v == null) this.removeAttribute('autocomplete');
      else this.setAttribute('autocomplete', String(v));
      this.#hiddenAutoFill.setAttribute('autocomplete', this.autocomplete);
    }

    /** @returns {boolean} */
    get autofocus() {
      return this.hasAttribute('autofocus');
    }
    set autofocus(v) {
      this.toggleAttribute('autofocus', Boolean(v));
    }

    attributeChangedCallback(name, _old, value) {
      switch (name) {
        case 'length': this.length = Number(value); break;
        case 'validation-type': this.validationType = /** @type {ValidationType} */(value); break;
        case 'type': this.type = /** @type {'text'|'password'} */(value); break;
        case 'orientation': this.orientation = /** @type {Orientation} */(value); break;
        case 'auto-submit': this.autoSubmit = this.hasAttribute('auto-submit'); break;
        case 'disabled': this.disabled = this.hasAttribute('disabled'); break;
        case 'readonly': this.readOnly = this.hasAttribute('readonly'); break;
        case 'placeholder': this.placeholder = value ?? ''; break;
        case 'value': if (value !== this.#value) this.value = value ?? ''; break;
        case 'dir': this.dir = /** @type {'ltr'|'rtl'|'auto'} */(value ?? 'ltr'); break;
        case 'autocomplete':
          this.autocomplete = value ?? 'one-time-code'; break;
        case 'autofocus':
          // handled in connectedCallback
          break;
      }
    }

    // ===== Public methods =====

    /** Focuses the first empty cell (or the first cell if full). */
    focus() {
      const idx = this.#value.indexOf('');
      const target = this.#cells[(idx === -1 ? 0 : idx)];
      target?.focus();
    }

    /** Clears the entire field. */
    clear() {
      this.value = '';
    }

    // ===== Private: Build & Sync =====

    #rebuild() {
      const root = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="root"]'));
      root.innerHTML = '';
      this.#cells = [];

      for (let i = 0; i < this.#length; i++) {
        const input = document.createElement('input');
        input.setAttribute('part', 'input');
        input.setAttribute('maxlength', '1');
        input.setAttribute('data-index', String(i));
        input.setAttribute('inputmode', this.#inputMode());
        const pattern = this.#pattern();
        if (pattern) input.setAttribute('pattern', pattern);
        input.type = this.#displayType;
        input.placeholder = this.#placeholder;
        input.disabled = this.#disabled;
        input.readOnly = this.#readOnly;
        input.autocomplete = 'one-time-code';
        input.dir = this.#dir;

        // Event wiring
        input.addEventListener('beforeinput', this.#onBeforeInput);
        input.addEventListener('input', this.#onCellInput);
        input.addEventListener('keydown', this.#onKeyDown);
        input.addEventListener('paste', this.#onPaste);

        this.#cells.push(input);
        root.appendChild(input);
      }

      // Re-apply value across (truncate if needed)
      this.#value = this.#sanitizeAll(this.#value);
      this.#syncCellsFromValue();
      this.#updateFormValue();
    }

    #syncCellsFromValue() {
      const chars = Array.from(this.#value);
      for (let i = 0; i < this.#cells.length; i++) {
        this.#cells[i].value = chars[i] ?? '';
      }
    }

    #updateFormValue() {
      if (this.#internals) {
        this.#internals.setFormValue(this.#value || null);
        this.#internals.ariaDisabled = String(this.#disabled);
        this.#internals.role = 'group';
      }
    }

    // ===== Events & UX =====

    /** @param {InputEvent} e */
    #onBeforeInput = (e) => {
      // Prevent multi-char inserts from IME/hold-paste at cell level; we’ll handle paste at container level
      const data = e.data ?? '';
      if (data.length > 1) e.preventDefault();
      else if (data.length === 1 && !this.#isAllowedChar(data)) e.preventDefault();
    };

    /** @param {Event} e */
    #onCellInput = (e) => {
      const cell = /** @type {HTMLInputElement} */ (e.currentTarget);
      const idx = Number(cell.getAttribute('data-index'));

      const ch = (cell.value || '').slice(-1); // last typed char if any
      const clean = this.#sanitizeChar(ch);
      cell.value = clean;

      // Merge into full value
      const current = this.#value.split('');
      current[idx] = clean;
      this.#value = this.#sanitizeAll(current.join(''));

      this.#updateFormValue();
      this.#emitValueChange();

      // Move focus forward on valid char
      if (clean) this.#focusNext(idx);
      this.#maybeAutoSubmit();
    };

    /** @param {KeyboardEvent} e */
    #onKeyDown = (e) => {
      const cell = /** @type {HTMLInputElement} */ (e.currentTarget);
      const idx = Number(cell.getAttribute('data-index'));
      const isRTL = (this.#dir === 'rtl');

      const goPrev = () => this.#focusPrev(idx);
      const goNext = () => this.#focusNext(idx);

      switch (e.key) {
        case 'Backspace': {
          if (cell.value) {
            // Clear current char
            cell.value = '';
            this.#setCharAt(idx, '');
            this.#emitValueChange();
            this.#updateFormValue();
          } else {
            // Move back and clear previous
            const p = this.#focusPrev(idx);
            if (p) {
              p.value = '';
              const pi = Number(p.getAttribute('data-index'));
              this.#setCharAt(pi, '');
              this.#emitValueChange();
              this.#updateFormValue();
            }
          }
          e.preventDefault();
          break;
        }
        case 'Delete': {
          if (cell.value) {
            cell.value = '';
            this.#setCharAt(idx, '');
            this.#emitValueChange();
            this.#updateFormValue();
          }
          e.preventDefault();
          break;
        }
        case 'ArrowLeft':
          (isRTL ? goNext : goPrev)();
          e.preventDefault();
          break;
        case 'ArrowRight':
          (isRTL ? goPrev : goNext)();
          e.preventDefault();
          break;
        case 'ArrowUp':
          if (this.#orientation === 'vertical') { goPrev(); e.preventDefault(); }
          break;
        case 'ArrowDown':
          if (this.#orientation === 'vertical') { goNext(); e.preventDefault(); }
          break;
        case 'Home':
          this.#cells[0]?.focus();
          e.preventDefault();
          break;
        case 'End':
          this.#cells[this.#cells.length - 1]?.focus();
          e.preventDefault();
          break;
        default: break;
      }
    };

    /** @param {ClipboardEvent} e */
    #onPaste = (e) => {
      const text = (e.clipboardData?.getData('text') ?? '').trim();
      if (!text) return;
      e.preventDefault();
      this.#applyBulk(text, Number(/** @type {HTMLElement} */(e.currentTarget).getAttribute('data-index')));
    };

    /** @param {Event} _e */
    #onHiddenAutoFill = (_e) => {
      const text = this.#hiddenAutoFill.value || '';
      if (!text) return;
      // Use entire string from position 0 (likely from password manager)
      this.#applyBulk(text, 0);
      // Clear hidden target for reuse
      this.#hiddenAutoFill.value = '';
    };

    /** @param {string} text @param {number} startIndex */
    #applyBulk(text, startIndex) {
      const clean = this.#sanitizeAll(text);
      const chars = clean.split('');
      const arr = this.#value.split('');

      let i = startIndex;
      for (let j = 0; j < chars.length && i < this.#length; j++, i++) {
        arr[i] = chars[j];
      }
      this.#value = this.#sanitizeAll(arr.join(''));
      this.#syncCellsFromValue();
      this.#updateFormValue();
      this.#emitValueChange();

      // focus first empty or last cell
      const firstEmpty = this.#value.indexOf('');
      if (firstEmpty >= 0) this.#cells[firstEmpty]?.focus();
      else this.#cells[this.#length - 1]?.focus();

      this.#maybeAutoSubmit();
    }

    // ===== Helpers =====

    /** @param {number} idx @param {string} ch */
    #setCharAt(idx, ch) {
      const arr = this.#value.split('');
      arr[idx] = this.#sanitizeChar(ch);
      this.#value = this.#sanitizeAll(arr.join(''));
      this.#syncCellsFromValue();
    }

    /** @param {number} idx */
    #focusNext(idx) {
      const n = this.#cells[idx + 1];
      if (n) n.focus();
      return n;
    }

    /** @param {number} idx */
    #focusPrev(idx) {
      const p = this.#cells[idx - 1];
      if (p) p.focus();
      return p;
    }

    /** @param {string} s */
    #sanitizeAll(s) {
      const max = this.#length;
      const filtered = Array.from(s).filter((c) => this.#isAllowedChar(c)).slice(0, max);
      // Pad with empty to length to keep indexing stable
      const padded = Array.from({ length: max }, (_, i) => filtered[i] ?? '').join('');
      return padded;
    }

    /** @param {string} c */
    #sanitizeChar(c) {
      return this.#isAllowedChar(c) ? c : '';
    }

    /** @param {string} c */
    #isAllowedChar(c) {
      if (!c) return false;
      switch (this.#validationType) {
        case 'numeric': return /[0-9]/.test(c);
        case 'alphanumeric': return /[0-9A-Za-z]/.test(c);
        default: return c.length === 1;
      }
    }

    #inputMode() {
      switch (this.#validationType) {
        case 'numeric': return 'numeric'; // or 'tel' for broader iOS keypad; 'numeric' is more semantically correct
        case 'alphanumeric': return 'text';
        default: return 'text';
      }
    }

    #pattern() {
      switch (this.#validationType) {
        case 'numeric': return '\\d';
        case 'alphanumeric': return '[0-9A-Za-z]';
        default: return '';
      }
    }

    #emitValueChange() {
      this.dispatchEvent(new CustomEvent('valuechange', {
        bubbles: true,
        composed: true,
        detail: { value: this.#value }
      }));
    }

    #maybeAutoSubmit() {
      if (!this.#autoSubmit) return;
      const complete = this.#value && !this.#value.includes('');
      if (!complete) return;

      // Prefer native form submission if possible
      const form = this.#internals?.form;
      if (form && typeof form.requestSubmit === 'function') {
        // Handlers can preventDefault on submit if needed
        form.requestSubmit();
      } else {
        // Fire a custom event so apps can handle manually
        this.dispatchEvent(new CustomEvent('autosubmit', {
          bubbles: true,
          composed: true,
          detail: { value: this.#value }
        }));
      }
    }
  }

  // Define accessors mapped to attributes for DX
  Object.defineProperties(OtpField.prototype, {
    /** @property {number} length */
    length: { configurable: true, writable: true },
    /** @property {ValidationType} validationType */
    validationType: { configurable: true, writable: true },
    /** @property {'text'|'password'} type */
    type: { configurable: true, writable: true },
    /** @property {Orientation} orientation */
    orientation: { configurable: true, writable: true },
    /** @property {boolean} autoSubmit */
    autoSubmit: { configurable: true, writable: true },
    /** @property {boolean} disabled */
    disabled: { configurable: true, writable: true },
    /** @property {boolean} readOnly */
    readOnly: { configurable: true, writable: true },
    /** @property {string} placeholder */
    placeholder: { configurable: true, writable: true },
    /** @property {string} value */
    value: { configurable: true, writable: true },
    /** @property {'ltr'|'rtl'|'auto'} dir */
    dir: { configurable: true, writable: true },
    /** @property {string} autocomplete */
    autocomplete: { configurable: true, writable: true },
    /** @property {boolean} autofocus */
    autofocus: { configurable: true, writable: true },
  });

  if (!customElements.get('otp-field')) {
    customElements.define('otp-field', OtpField);
  }

  // Optional export for module users (CDN UMD-ish convenience)
  // @ts-ignore
  if (typeof window !== 'undefined') window.OtpField = OtpField;
})();

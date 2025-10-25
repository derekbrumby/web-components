/**
 * @file toolbar.js
 * @version 1.0.0
 *
 * An accessible formatting toolbar component that mirrors the Radix UI toolbar demo.
 * The element exposes toggle groups for text styling and alignment, a metadata link, and
 * a share button. Keyboard navigation follows the roving tabindex pattern so only one
 * control within a group is tabbable at a time while arrow keys move focus horizontally.
 *
 * Usage:
 * <wc-toolbar></wc-toolbar>
 *
 * Styling hooks:
 * - CSS custom properties: `--toolbar-background`, `--toolbar-radius`, `--toolbar-shadow`,
 *   `--toolbar-color`, `--toolbar-accent`, `--toolbar-accent-contrast`,
 *   `--toolbar-focus-ring`, `--toolbar-separator-color`, `--toolbar-font-family`.
 * - Parts: `::part(toolbar)`, `::part(toggle-group)`, `::part(toggle)`, `::part(separator)`,
 *   `::part(metadata)`, `::part(share)`.
 */

(() => {
  /**
   * Ensures that property setters invoked before the element is defined still run
   * after upgrade.
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

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        display: inline-block;
        font-family: var(
          --toolbar-font-family,
          'Inter',
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif
        );
        color: var(--toolbar-color, #6b7280);
      }

      :host([hidden]) {
        display: none;
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

      .toolbar {
        display: flex;
        align-items: center;
        width: 100%;
        min-width: max-content;
        gap: 0.25rem;
        padding: 0.625rem;
        border-radius: var(--toolbar-radius, 0.75rem);
        background: var(--toolbar-background, #ffffff);
        box-shadow: var(--toolbar-shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
      }

      .toggle-group {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      .toggle {
        appearance: none;
        border: none;
        border-radius: 0.5rem;
        background: transparent;
        color: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        font: inherit;
        font-size: 0.8125rem;
        line-height: 1;
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease;
      }

      .toggle[data-state='on'] {
        background: var(--toolbar-accent, rgba(99, 102, 241, 0.22));
        color: var(--toolbar-accent-contrast, #4338ca);
      }

      .toggle:hover {
        background: var(--toolbar-hover, rgba(99, 102, 241, 0.12));
        color: var(--toolbar-hover-contrast, #4338ca);
      }

      .toggle:focus-visible {
        outline: none;
        box-shadow: var(--toolbar-focus-ring, 0 0 0 2px rgba(99, 102, 241, 0.35));
      }

      .separator {
        width: 1px;
        align-self: stretch;
        background: var(--toolbar-separator-color, rgba(148, 163, 184, 0.4));
        margin: 0 0.75rem;
      }

      .metadata {
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 0.3125rem;
        height: 28px;
        border-radius: 0.5rem;
        color: inherit;
        text-decoration: none;
        font-size: 0.8125rem;
        transition: background-color 160ms ease, color 160ms ease;
      }

      .metadata:hover {
        background: var(--toolbar-hover, rgba(99, 102, 241, 0.12));
        color: var(--toolbar-hover-contrast, #4338ca);
      }

      .metadata:focus-visible {
        outline: none;
        box-shadow: var(--toolbar-focus-ring, 0 0 0 2px rgba(99, 102, 241, 0.35));
      }

      .share {
        appearance: none;
        border: none;
        margin-left: auto;
        border-radius: 0.5rem;
        background: var(--toolbar-accent, #4c1d95);
        color: var(--toolbar-accent-contrast, #ffffff);
        padding: 0.3125rem 0.75rem;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 160ms ease;
      }

      .share:hover {
        background: var(--toolbar-accent-hover, #5b21b6);
      }

      .share:focus-visible {
        outline: none;
        box-shadow: var(--toolbar-focus-ring, 0 0 0 2px rgba(99, 102, 241, 0.35));
      }

      @media (min-width: 40rem) {
        .metadata {
          display: inline-flex;
        }
      }
    </style>
    <div class="toolbar" part="toolbar" role="toolbar" aria-label="Formatting options">
      <div
        class="toggle-group"
        part="toggle-group"
        role="group"
        aria-label="Text formatting"
        data-group="formatting"
        data-type="multiple"
      >
        <button
          type="button"
          class="toggle"
          part="toggle"
          data-value="bold"
          aria-pressed="false"
        >
          <span aria-hidden="true">B</span>
          <span class="sr-only">Bold</span>
        </button>
        <button
          type="button"
          class="toggle"
          part="toggle"
          data-value="italic"
          aria-pressed="false"
        >
          <span aria-hidden="true"><i>I</i></span>
          <span class="sr-only">Italic</span>
        </button>
        <button
          type="button"
          class="toggle"
          part="toggle"
          data-value="strikethrough"
          aria-pressed="false"
        >
          <span aria-hidden="true">S</span>
          <span class="sr-only">Strikethrough</span>
        </button>
      </div>
      <span class="separator" part="separator" role="separator" aria-orientation="vertical"></span>
      <div
        class="toggle-group"
        part="toggle-group"
        role="radiogroup"
        aria-label="Text alignment"
        data-group="alignment"
        data-type="single"
      >
        <button
          type="button"
          class="toggle"
          part="toggle"
          data-value="left"
          aria-pressed="false"
        >
          <span aria-hidden="true">L</span>
          <span class="sr-only">Align left</span>
        </button>
        <button
          type="button"
          class="toggle"
          part="toggle"
          data-value="center"
          aria-pressed="true"
        >
          <span aria-hidden="true">C</span>
          <span class="sr-only">Align center</span>
        </button>
        <button
          type="button"
          class="toggle"
          part="toggle"
          data-value="right"
          aria-pressed="false"
        >
          <span aria-hidden="true">R</span>
          <span class="sr-only">Align right</span>
        </button>
      </div>
      <span class="separator" part="separator" role="separator" aria-orientation="vertical"></span>
      <a
        class="metadata"
        part="metadata"
        data-element="metadata"
        href="#"
        target="_blank"
        rel="noreferrer"
      >
        Edited 2 hours ago
      </a>
      <button type="button" class="share" part="share" data-element="share">Share</button>
    </div>
    <span class="sr-only" aria-live="polite" data-element="live-region"></span>
  `;

  class ToolbarElement extends HTMLElement {
    static get observedAttributes() {
      return ['alignment', 'aria-label'];
    }

    constructor() {
      super();
      /** @type {ShadowRoot} */
      this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

      /** @type {HTMLElement} */
      this._toolbar = /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('.toolbar'));
      /** @type {HTMLElement} */
      this._formatGroup = /** @type {HTMLElement} */ (
        this.shadowRoot?.querySelector('[data-group="formatting"]')
      );
      /** @type {HTMLElement} */
      this._alignmentGroup = /** @type {HTMLElement} */ (
        this.shadowRoot?.querySelector('[data-group="alignment"]')
      );
      /** @type {HTMLAnchorElement | null} */
      this._metadataLink = this.shadowRoot?.querySelector('[data-element="metadata"]');
      /** @type {HTMLButtonElement | null} */
      this._shareButton = this.shadowRoot?.querySelector('[data-element="share"]');
      /** @type {HTMLElement | null} */
      this._liveRegion = this.shadowRoot?.querySelector('[data-element="live-region"]');

      this._onGroupClick = this._onGroupClick.bind(this);
      this._onGroupKeydown = this._onGroupKeydown.bind(this);
      this._onGroupFocusIn = this._onGroupFocusIn.bind(this);
      this._onShareClick = this._onShareClick.bind(this);
    }

    /**
     * Current alignment selection. Defaults to `"center"`.
     * @returns {string}
     */
    get alignment() {
      const value = this.getAttribute('alignment');
      return value && ['left', 'center', 'right'].includes(value) ? value : 'center';
    }

    set alignment(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('alignment');
      } else {
        const normalized = ['left', 'center', 'right'].includes(value)
          ? value
          : 'center';
        this.setAttribute('alignment', normalized);
      }
    }

    /**
     * Active formatting toggles in the toolbar.
     * @returns {string[]}
     */
    get formats() {
      const group = this._formatGroup;
      if (!group) return [];
      return Array.from(group.querySelectorAll('button[data-value][aria-pressed="true"]')).map((button) =>
        /** @type {HTMLElement} */ (button).dataset.value || ''
      ).filter(Boolean);
    }

    connectedCallback() {
      upgradeProperty(this, 'alignment');

      const label = this.getAttribute('aria-label') ?? 'Formatting options';
      if (this._toolbar) {
        this._toolbar.setAttribute('aria-label', label);
      }

      this._initializeGroup(this._formatGroup);
      this._initializeGroup(this._alignmentGroup);

      this._formatGroup?.addEventListener('click', this._onGroupClick);
      this._formatGroup?.addEventListener('keydown', this._onGroupKeydown);
      this._formatGroup?.addEventListener('focusin', this._onGroupFocusIn);

      this._alignmentGroup?.addEventListener('click', this._onGroupClick);
      this._alignmentGroup?.addEventListener('keydown', this._onGroupKeydown);
      this._alignmentGroup?.addEventListener('focusin', this._onGroupFocusIn);

      this._shareButton?.addEventListener('click', this._onShareClick);

      this._syncAlignment(this.alignment);
      this._syncGroupStates(this._formatGroup);
    }

    disconnectedCallback() {
      this._formatGroup?.removeEventListener('click', this._onGroupClick);
      this._formatGroup?.removeEventListener('keydown', this._onGroupKeydown);
      this._formatGroup?.removeEventListener('focusin', this._onGroupFocusIn);

      this._alignmentGroup?.removeEventListener('click', this._onGroupClick);
      this._alignmentGroup?.removeEventListener('keydown', this._onGroupKeydown);
      this._alignmentGroup?.removeEventListener('focusin', this._onGroupFocusIn);

      this._shareButton?.removeEventListener('click', this._onShareClick);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === 'alignment') {
        this._syncAlignment(newValue ?? '');
      }

      if (name === 'aria-label' && this._toolbar) {
        this._toolbar.setAttribute('aria-label', newValue || 'Formatting options');
      }
    }

    /**
     * Configures a toggle group for roving tabindex behaviour.
     * @param {HTMLElement | null} group
     */
    _initializeGroup(group) {
      if (!group) return;
      const buttons = this._getGroupButtons(group);
      buttons.forEach((button, index) => {
        button.tabIndex = index === 0 ? 0 : -1;
        button.dataset.state = button.getAttribute('aria-pressed') === 'true' ? 'on' : 'off';
      });
    }

    /**
     * Handles pointer and keyboard activation.
     * @param {MouseEvent} event
     */
    _onGroupClick(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('button[data-value]');
      if (!button || !(button instanceof HTMLButtonElement)) {
        return;
      }

      const group = button.closest('[data-group]');
      if (!(group instanceof HTMLElement)) {
        return;
      }

      this._setActiveRover(group, button);

      const type = group.dataset.type;
      const value = button.dataset.value ?? '';
      if (!value) return;

      if (type === 'multiple') {
        const pressed = button.getAttribute('aria-pressed') === 'true';
        const nextState = !pressed;
        button.setAttribute('aria-pressed', String(nextState));
        button.dataset.state = nextState ? 'on' : 'off';
        this._announce(`${value} ${nextState ? 'enabled' : 'disabled'}`);
        this.dispatchEvent(
          new CustomEvent('wc-toolbar-format-change', {
            bubbles: true,
            composed: true,
            detail: {
              value: this.formats,
              toggled: { value, pressed: nextState },
            },
          })
        );
      } else {
        this._syncSingleSelection(group, value);
        const detailValue = button.dataset.value ?? '';
        this.alignment = detailValue;
        this._announce(`Alignment set to ${detailValue}`);
        this.dispatchEvent(
          new CustomEvent('wc-toolbar-alignment-change', {
            bubbles: true,
            composed: true,
            detail: { value: detailValue },
          })
        );
      }
    }

    /**
     * Handles roving focus with arrow keys and home/end.
     * @param {KeyboardEvent} event
     */
    _onGroupKeydown(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const group = target.closest('[data-group]');
      if (!(group instanceof HTMLElement)) return;

      const key = event.key;
      const buttons = this._getGroupButtons(group);
      const currentIndex = buttons.indexOf(/** @type {HTMLButtonElement} */ (target));
      if (currentIndex === -1) {
        return;
      }

      let nextIndex = currentIndex;
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      } else if (key === 'Home') {
        nextIndex = 0;
      } else if (key === 'End') {
        nextIndex = buttons.length - 1;
      } else if (key === ' ' || key === 'Enter') {
        target.click();
        event.preventDefault();
        return;
      } else {
        return;
      }

      const next = buttons[nextIndex];
      if (next) {
        this._setActiveRover(group, next);
        next.focus();
        event.preventDefault();
      }
    }

    /**
     * Keeps the roving tabindex focused item up to date when the user focuses via pointer.
     * @param {FocusEvent} event
     */
    _onGroupFocusIn(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('button[data-value]');
      const group = target.closest('[data-group]');
      if (button instanceof HTMLButtonElement && group instanceof HTMLElement) {
        this._setActiveRover(group, button);
      }
    }

    /**
     * Syncs button pressed states for exclusive selection groups.
     * @param {HTMLElement} group
     * @param {string} value
     */
    _syncSingleSelection(group, value) {
      const buttons = this._getGroupButtons(group);
      buttons.forEach((button) => {
        const isActive = button.dataset.value === value;
        button.setAttribute('aria-pressed', String(isActive));
        button.dataset.state = isActive ? 'on' : 'off';
      });
    }

    /**
     * Reflects the alignment attribute into the UI.
     * @param {string} value
     */
    _syncAlignment(value) {
      const group = this._alignmentGroup;
      if (!group) return;
      const buttons = this._getGroupButtons(group);
      const allowed = ['left', 'center', 'right'];
      const normalized = allowed.includes(value) ? value : 'center';
      if (value !== normalized) {
        this.setAttribute('alignment', normalized);
      }
      this._syncSingleSelection(group, normalized);
      const activeButton = buttons.find((button) => button.dataset.value === normalized);
      if (activeButton) {
        this._setActiveRover(group, activeButton);
      }
    }

    /**
     * Applies consistent state attributes to toggle buttons.
     * @param {HTMLElement | null} group
     */
    _syncGroupStates(group) {
      if (!group) return;
      const buttons = this._getGroupButtons(group);
      buttons.forEach((button) => {
        button.dataset.state = button.getAttribute('aria-pressed') === 'true' ? 'on' : 'off';
      });
    }

    /**
     * Sets the current roving tabindex target.
     * @param {HTMLElement} group
     * @param {HTMLButtonElement} active
     */
    _setActiveRover(group, active) {
      const buttons = this._getGroupButtons(group);
      buttons.forEach((button) => {
        button.tabIndex = button === active ? 0 : -1;
      });
    }

    /**
     * Returns all toggle buttons inside a group.
     * @param {HTMLElement} group
     * @returns {HTMLButtonElement[]}
     */
    _getGroupButtons(group) {
      return Array.from(group.querySelectorAll('button[data-value]'));
    }

    /**
     * Announces changes via an aria-live region for assistive technologies.
     * @param {string} message
     */
    _announce(message) {
      if (!this._liveRegion) return;
      this._liveRegion.textContent = '';
      void this._liveRegion.offsetHeight;
      this._liveRegion.textContent = message;
    }

    _onShareClick() {
      this.dispatchEvent(
        new CustomEvent('wc-toolbar-share', {
          bubbles: true,
          composed: true,
          detail: {
            alignment: this.alignment,
            formats: this.formats,
          },
        })
      );
    }
  }

  if (!customElements.get('wc-toolbar')) {
    customElements.define('wc-toolbar', ToolbarElement);
  }
})();

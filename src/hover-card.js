/**
 * @file hover-card.js
 * @version 1.0.0
 *
 * Lightweight hover card web component inspired by the Radix UI Hover Card anatomy.
 * Provides delayed open/close behavior, side and alignment placement, and styling hooks.
 *
 * Usage:
 * <wc-hover-card>
 *   <a slot="trigger" href="https://example.com">Profile</a>
 *   <div slot="content">Hello world</div>
 * </wc-hover-card>
 */

(() => {
  /**
   * Upgrades properties that might have been set before the element definition was registered.
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

  /** @typedef {"top" | "right" | "bottom" | "left"} HoverCardSide */
  /** @typedef {"start" | "center" | "end"} HoverCardAlign */

  const VALID_SIDES = new Set(["top", "right", "bottom", "left"]);
  const VALID_ALIGNS = new Set(["start", "center", "end"]);
  const DEFAULT_OPEN_DELAY = 700;
  const DEFAULT_CLOSE_DELAY = 300;

  if (customElements.get("wc-hover-card")) {
    return;
  }

  class WcHoverCard extends HTMLElement {
    static get observedAttributes() {
      return [
        "open",
        "default-open",
        "open-delay",
        "close-delay",
        "side",
        "align",
        "side-offset",
        "align-offset",
        "hide-arrow",
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #triggerContainer;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLDivElement} */
    #arrow;
    /** @type {HTMLSlotElement} */
    #triggerSlot;
    /** @type {HTMLSlotElement} */
    #contentSlot;
    /** @type {number | null} */
    #openTimer = null;
    /** @type {number | null} */
    #closeTimer = null;
    /** @type {boolean} */
    #open = false;
    /** @type {number} */
    #openDelay = DEFAULT_OPEN_DELAY;
    /** @type {number} */
    #closeDelay = DEFAULT_CLOSE_DELAY;
    /** @type {HoverCardSide} */
    #side = "bottom";
    /** @type {HoverCardAlign} */
    #align = "center";
    /** @type {boolean} */
    #hideArrow = false;
    /** @type {boolean} */
    #reflecting = false;
    /** @type {ResizeObserver | null} */
    #resizeObserver = null;
    /** @type {() => void} */
    #updateMetrics;
    /** @type {boolean} */
    #globalsAttached = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            --hover-card-side-offset: 8px;
            --hover-card-align-offset: 0px;
            --hover-card-surface: #ffffff;
            --hover-card-color: #0f172a;
            --hover-card-radius: 12px;
            --hover-card-shadow: 0 28px 70px -30px rgba(15, 23, 42, 0.45);
            --hover-card-border: 1px solid rgba(148, 163, 184, 0.28);
            --hover-card-padding: 1.25rem;
            --hover-card-transition-duration: 160ms;
            --hover-card-transition-timing: cubic-bezier(0.16, 1, 0.3, 1);
            --hover-card-min-width: 220px;
            --hover-card-max-width: 320px;
            --hover-card-gap: 0.75rem;
            display: inline-block;
            position: relative;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-state="open"]) {
            z-index: var(--hover-card-z-index, 20);
          }

          [part="trigger"] {
            display: inline-flex;
            cursor: var(--hover-card-trigger-cursor, pointer);
            outline: none;
            position: relative;
          }

          [part="trigger"]:focus-visible {
            box-shadow: var(
              --hover-card-trigger-focus-shadow,
              0 0 0 3px rgba(59, 130, 246, 0.35)
            );
            border-radius: var(--hover-card-trigger-focus-radius, 999px);
          }

          [part="content"] {
            position: absolute;
            box-sizing: border-box;
            inline-size: clamp(
              var(--hover-card-min-width),
              100%,
              var(--hover-card-max-width)
            );
            max-inline-size: var(--hover-card-max-width);
            padding: var(--hover-card-padding);
            background: var(--hover-card-surface);
            color: var(--hover-card-color);
            border-radius: var(--hover-card-radius);
            border: var(--hover-card-border);
            box-shadow: var(--hover-card-shadow);
            display: flex;
            flex-direction: column;
            gap: var(--hover-card-gap);
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition-property: opacity, transform, visibility;
            transition-duration: var(--hover-card-transition-duration);
            transition-timing-function: var(--hover-card-transition-timing);
            will-change: transform, opacity;
          }

          [part="content"][data-state="open"] {
            pointer-events: auto;
            opacity: 1;
            visibility: visible;
          }

          :host([data-side="bottom"][data-align="center"]) [part="content"] {
            top: calc(100% + var(--hover-card-side-offset));
            left: 50%;
            transform: translate(
              calc(-50% + var(--hover-card-align-offset)),
              8px
            )
              scale(0.97);
          }

          :host([data-state="open"][data-side="bottom"][data-align="center"]) [part="content"] {
            transform: translate(
              calc(-50% + var(--hover-card-align-offset)),
              0
            )
              scale(1);
          }

          :host([data-side="bottom"][data-align="start"]) [part="content"] {
            top: calc(100% + var(--hover-card-side-offset));
            left: 0;
            transform: translate(var(--hover-card-align-offset), 8px) scale(0.97);
          }

          :host([data-state="open"][data-side="bottom"][data-align="start"]) [part="content"] {
            transform: translate(var(--hover-card-align-offset), 0) scale(1);
          }

          :host([data-side="bottom"][data-align="end"]) [part="content"] {
            top: calc(100% + var(--hover-card-side-offset));
            right: 0;
            transform: translate(var(--hover-card-align-offset), 8px) scale(0.97);
          }

          :host([data-state="open"][data-side="bottom"][data-align="end"]) [part="content"] {
            transform: translate(var(--hover-card-align-offset), 0) scale(1);
          }

          :host([data-side="top"][data-align="center"]) [part="content"] {
            bottom: calc(100% + var(--hover-card-side-offset));
            left: 50%;
            transform: translate(
              calc(-50% + var(--hover-card-align-offset)),
              -8px
            )
              scale(0.97);
          }

          :host([data-state="open"][data-side="top"][data-align="center"]) [part="content"] {
            transform: translate(
              calc(-50% + var(--hover-card-align-offset)),
              0
            )
              scale(1);
          }

          :host([data-side="top"][data-align="start"]) [part="content"] {
            bottom: calc(100% + var(--hover-card-side-offset));
            left: 0;
            transform: translate(var(--hover-card-align-offset), -8px) scale(0.97);
          }

          :host([data-state="open"][data-side="top"][data-align="start"]) [part="content"] {
            transform: translate(var(--hover-card-align-offset), 0) scale(1);
          }

          :host([data-side="top"][data-align="end"]) [part="content"] {
            bottom: calc(100% + var(--hover-card-side-offset));
            right: 0;
            transform: translate(var(--hover-card-align-offset), -8px) scale(0.97);
          }

          :host([data-state="open"][data-side="top"][data-align="end"]) [part="content"] {
            transform: translate(var(--hover-card-align-offset), 0) scale(1);
          }

          :host([data-side="left"][data-align="center"]) [part="content"] {
            right: calc(100% + var(--hover-card-side-offset));
            top: 50%;
            transform: translate(
              -8px,
              calc(-50% + var(--hover-card-align-offset))
            )
              scale(0.97);
          }

          :host([data-state="open"][data-side="left"][data-align="center"]) [part="content"] {
            transform: translate(
              0,
              calc(-50% + var(--hover-card-align-offset))
            )
              scale(1);
          }

          :host([data-side="left"][data-align="start"]) [part="content"] {
            right: calc(100% + var(--hover-card-side-offset));
            top: 0;
            transform: translate(-8px, var(--hover-card-align-offset)) scale(0.97);
          }

          :host([data-state="open"][data-side="left"][data-align="start"]) [part="content"] {
            transform: translate(0, var(--hover-card-align-offset)) scale(1);
          }

          :host([data-side="left"][data-align="end"]) [part="content"] {
            right: calc(100% + var(--hover-card-side-offset));
            bottom: 0;
            transform: translate(-8px, var(--hover-card-align-offset)) scale(0.97);
          }

          :host([data-state="open"][data-side="left"][data-align="end"]) [part="content"] {
            transform: translate(0, var(--hover-card-align-offset)) scale(1);
          }

          :host([data-side="right"][data-align="center"]) [part="content"] {
            left: calc(100% + var(--hover-card-side-offset));
            top: 50%;
            transform: translate(
              8px,
              calc(-50% + var(--hover-card-align-offset))
            )
              scale(0.97);
          }

          :host([data-state="open"][data-side="right"][data-align="center"]) [part="content"] {
            transform: translate(
              0,
              calc(-50% + var(--hover-card-align-offset))
            )
              scale(1);
          }

          :host([data-side="right"][data-align="start"]) [part="content"] {
            left: calc(100% + var(--hover-card-side-offset));
            top: 0;
            transform: translate(8px, var(--hover-card-align-offset)) scale(0.97);
          }

          :host([data-state="open"][data-side="right"][data-align="start"]) [part="content"] {
            transform: translate(0, var(--hover-card-align-offset)) scale(1);
          }

          :host([data-side="right"][data-align="end"]) [part="content"] {
            left: calc(100% + var(--hover-card-side-offset));
            bottom: 0;
            transform: translate(8px, var(--hover-card-align-offset)) scale(0.97);
          }

          :host([data-state="open"][data-side="right"][data-align="end"]) [part="content"] {
            transform: translate(0, var(--hover-card-align-offset)) scale(1);
          }

          [part="arrow"] {
            position: absolute;
            inline-size: var(--hover-card-arrow-size, 12px);
            block-size: var(--hover-card-arrow-size, 12px);
            background: var(--hover-card-surface);
            border: var(--hover-card-border);
            border-inline-end: none;
            border-block-end: none;
            transform: rotate(45deg);
            box-shadow: var(--hover-card-arrow-shadow, 0 10px 40px -24px rgba(15, 23, 42, 0.45));
            transition: opacity var(--hover-card-transition-duration)
              var(--hover-card-transition-timing);
            opacity: 0;
          }

          :host([data-state="open"]) [part="arrow"] {
            opacity: 1;
          }

          :host([data-side="bottom"]) [part="arrow"] {
            top: calc(-1 * var(--hover-card-arrow-size, 12px) / 2);
          }

          :host([data-side="top"]) [part="arrow"] {
            bottom: calc(-1 * var(--hover-card-arrow-size, 12px) / 2);
          }

          :host([data-side="left"]) [part="arrow"] {
            right: calc(-1 * var(--hover-card-arrow-size, 12px) / 2);
          }

          :host([data-side="right"]) [part="arrow"] {
            left: calc(-1 * var(--hover-card-arrow-size, 12px) / 2);
          }

          :host([data-align="center"][data-side="bottom"]) [part="arrow"],
          :host([data-align="center"][data-side="top"]) [part="arrow"] {
            left: calc(50% - var(--hover-card-arrow-size, 12px) / 2);
          }

          :host([data-align="start"][data-side="bottom"]) [part="arrow"],
          :host([data-align="start"][data-side="top"]) [part="arrow"] {
            left: 16px;
          }

          :host([data-align="end"][data-side="bottom"]) [part="arrow"],
          :host([data-align="end"][data-side="top"]) [part="arrow"] {
            right: 16px;
          }

          :host([data-align="center"][data-side="left"]) [part="arrow"],
          :host([data-align="center"][data-side="right"]) [part="arrow"] {
            top: calc(50% - var(--hover-card-arrow-size, 12px) / 2);
          }

          :host([data-align="start"][data-side="left"]) [part="arrow"],
          :host([data-align="start"][data-side="right"]) [part="arrow"] {
            top: 16px;
          }

          :host([data-align="end"][data-side="left"]) [part="arrow"],
          :host([data-align="end"][data-side="right"]) [part="arrow"] {
            bottom: 16px;
          }

          :host([data-hide-arrow="true"]) [part="arrow"] {
            display: none;
          }

          [part="content"] ::slotted(*) {
            margin: 0;
          }
        </style>
        <div part="trigger" data-trigger>
          <slot name="trigger">
            <button type="button" part="trigger-button">Hover me</button>
          </slot>
        </div>
        <div part="content" data-state="closed" data-side="bottom" data-align="center" aria-hidden="true">
          <slot name="content">
            <div>Provide content via <code>slot="content"</code>.</div>
          </slot>
          <div part="arrow" data-arrow></div>
        </div>
      `;

      this.#triggerContainer = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[data-trigger]')
      );
      this.#content = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="content"]')
      );
      this.#arrow = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[data-arrow]')
      );
      this.#triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      this.#contentSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="content"]')
      );

      this.#updateMetrics = () => this.#syncMetrics();
    }

    connectedCallback() {
      upgradeProperty(this, "open");
      upgradeProperty(this, "openDelay");
      upgradeProperty(this, "closeDelay");
      upgradeProperty(this, "side");
      upgradeProperty(this, "align");

      this.addEventListener("mouseenter", this.#handlePointerEnter);
      this.addEventListener("mouseleave", this.#handlePointerLeave);
      this.addEventListener("focusin", this.#handleFocusIn);
      this.addEventListener("focusout", this.#handleFocusOut);
      this.addEventListener("keydown", this.#handleKeydown);

      this.#triggerSlot.addEventListener("slotchange", this.#updateMetrics);
      this.#contentSlot.addEventListener("slotchange", this.#updateMetrics);

      if (!this.hasAttribute("side")) {
        this.side = this.#side;
      } else {
        this.#applySide(this.getAttribute("side"));
      }

      if (!this.hasAttribute("align")) {
        this.align = this.#align;
      } else {
        this.#applyAlign(this.getAttribute("align"));
      }

      this.#applyDelays();
      this.#applySideOffset(this.getAttribute("side-offset"));
      this.#applyAlignOffset(this.getAttribute("align-offset"));
      this.#applyHideArrow();

      if (this.hasAttribute("default-open") && !this.hasAttribute("open")) {
        this.#setOpen(true, { emit: false });
      } else {
        this.#reflectState();
      }

      this.#resizeObserver = new ResizeObserver(this.#updateMetrics);
      this.#resizeObserver.observe(this.#triggerContainer);
      this.#updateMetrics();
    }

    disconnectedCallback() {
      this.removeEventListener("mouseenter", this.#handlePointerEnter);
      this.removeEventListener("mouseleave", this.#handlePointerLeave);
      this.removeEventListener("focusin", this.#handleFocusIn);
      this.removeEventListener("focusout", this.#handleFocusOut);
      this.removeEventListener("keydown", this.#handleKeydown);

      this.#triggerSlot.removeEventListener("slotchange", this.#updateMetrics);
      this.#contentSlot.removeEventListener("slotchange", this.#updateMetrics);

      if (this.#resizeObserver) {
        this.#resizeObserver.disconnect();
        this.#resizeObserver = null;
      }

      this.#stopTimers();
      this.#detachGlobalListeners();
    }

    /** @returns {boolean} */
    get open() {
      return this.#open;
    }

    /** @param {boolean} value */
    set open(value) {
      this.#setOpen(Boolean(value));
    }

    /** @returns {number} */
    get openDelay() {
      return this.#openDelay;
    }

    /** @param {number} value */
    set openDelay(value) {
      const parsed = Number(value);
      const delay = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      this.#openDelay = delay;
      this.setAttribute("open-delay", String(delay));
    }

    /** @returns {number} */
    get closeDelay() {
      return this.#closeDelay;
    }

    /** @param {number} value */
    set closeDelay(value) {
      const parsed = Number(value);
      const delay = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      this.#closeDelay = delay;
      this.setAttribute("close-delay", String(delay));
    }

    /** @returns {HoverCardSide} */
    get side() {
      return this.#side;
    }

    /** @param {HoverCardSide} value */
    set side(value) {
      this.setAttribute("side", value);
    }

    /** @returns {HoverCardAlign} */
    get align() {
      return this.#align;
    }

    /** @param {HoverCardAlign} value */
    set align(value) {
      this.setAttribute("align", value);
    }

    /**
     * Opens the hover card immediately, bypassing delays.
     */
    show() {
      this.#stopTimers();
      this.#setOpen(true);
    }

    /**
     * Closes the hover card immediately, bypassing delays.
     */
    hide() {
      this.#stopTimers();
      this.#setOpen(false);
    }

    /**
     * Toggles the hover card visibility.
     *
     * @param {boolean} [force]
     */
    toggle(force) {
      const next = typeof force === "boolean" ? force : !this.#open;
      this.#setOpen(next);
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      switch (name) {
        case "open": {
          const next = newValue !== null;
          this.#open = next;
          this.#reflectState();
          if (!this.#reflecting) {
            this.dispatchEvent(
              new CustomEvent("openchange", {
                detail: { open: next },
              })
            );
          }
          break;
        }
        case "open-delay": {
          this.#openDelay = this.#parseDelay(newValue, DEFAULT_OPEN_DELAY);
          break;
        }
        case "close-delay": {
          this.#closeDelay = this.#parseDelay(newValue, DEFAULT_CLOSE_DELAY);
          break;
        }
        case "side": {
          this.#applySide(newValue);
          break;
        }
        case "align": {
          this.#applyAlign(newValue);
          break;
        }
        case "side-offset": {
          this.#applySideOffset(newValue);
          break;
        }
        case "align-offset": {
          this.#applyAlignOffset(newValue);
          break;
        }
        case "hide-arrow": {
          this.#applyHideArrow();
          break;
        }
        case "default-open": {
          if (!this.hasAttribute("open")) {
            this.#setOpen(newValue !== null, { emit: false });
          }
          break;
        }
        default:
          break;
      }
    }

    /** @param {string | null} value */
    #applySide(value) {
      const normalized = (value ?? "bottom").toLowerCase();
      if (!VALID_SIDES.has(normalized)) {
        this.#side = "bottom";
        this.setAttribute("side", "bottom");
        return;
      }
      this.#side = /** @type {HoverCardSide} */ (normalized);
      this.setAttribute("data-side", this.#side);
      this.#content.dataset.side = this.#side;
      this.#arrow.dataset.side = this.#side;
      this.#updateMetrics();
    }

    /** @param {string | null} value */
    #applyAlign(value) {
      const normalized = (value ?? "center").toLowerCase();
      if (!VALID_ALIGNS.has(normalized)) {
        this.#align = "center";
        this.setAttribute("align", "center");
        return;
      }
      this.#align = /** @type {HoverCardAlign} */ (normalized);
      this.setAttribute("data-align", this.#align);
      this.#content.dataset.align = this.#align;
      this.#arrow.dataset.align = this.#align;
      this.#updateMetrics();
    }

    /** @param {string | null} value */
    #applySideOffset(value) {
      const parsed = value === null ? null : Number.parseFloat(value);
      const offset = Number.isFinite(parsed) ? parsed : 8;
      this.style.setProperty("--hover-card-side-offset", `${offset}px`);
    }

    /** @param {string | null} value */
    #applyAlignOffset(value) {
      const parsed = value === null ? null : Number.parseFloat(value);
      const offset = Number.isFinite(parsed) ? parsed : 0;
      this.style.setProperty("--hover-card-align-offset", `${offset}px`);
    }

    #applyHideArrow() {
      this.#hideArrow = this.hasAttribute("hide-arrow");
      this.setAttribute("data-hide-arrow", this.#hideArrow ? "true" : "false");
      if (this.#hideArrow) {
        this.#arrow.setAttribute("hidden", "");
      } else {
        this.#arrow.removeAttribute("hidden");
      }
    }

    #applyDelays() {
      this.#openDelay = this.#parseDelay(
        this.getAttribute("open-delay"),
        DEFAULT_OPEN_DELAY
      );
      this.#closeDelay = this.#parseDelay(
        this.getAttribute("close-delay"),
        DEFAULT_CLOSE_DELAY
      );
    }

    /** @param {string | null} value @param {number} fallback */
    #parseDelay(value, fallback) {
      if (value === null) {
        return fallback;
      }
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
    }

    /** @param {boolean} value @param {{ emit?: boolean }} [options] */
    #setOpen(value, options) {
      const emit = options?.emit ?? true;
      if (this.#open === value) {
        return;
      }
      this.#open = value;
      this.#reflecting = true;
      this.toggleAttribute("open", value);
      this.#reflecting = false;
      if (emit) {
        this.dispatchEvent(
          new CustomEvent("openchange", { detail: { open: value } })
        );
      }
    }

    #reflectState() {
      const state = this.#open ? "open" : "closed";
      this.setAttribute("data-state", state);
      this.#content.dataset.state = state;
      this.#arrow.dataset.state = state;
      this.#content.setAttribute("aria-hidden", this.#open ? "false" : "true");
      if (this.#open) {
        this.#attachGlobalListeners();
      } else {
        this.#detachGlobalListeners();
      }
    }

    #attachGlobalListeners() {
      if (this.#globalsAttached) {
        return;
      }
      window.addEventListener("scroll", this.#updateMetrics, true);
      window.addEventListener("resize", this.#updateMetrics);
      this.#updateMetrics();
      this.#globalsAttached = true;
    }

    #detachGlobalListeners() {
      if (!this.#globalsAttached) {
        return;
      }
      window.removeEventListener("scroll", this.#updateMetrics, true);
      window.removeEventListener("resize", this.#updateMetrics);
      this.#globalsAttached = false;
    }

    #syncMetrics() {
      const rect = this.#triggerContainer.getBoundingClientRect();
      const availableWidth = this.#calculateAvailableWidth(rect);
      const availableHeight = this.#calculateAvailableHeight(rect);
      const transformOrigin = this.#transformOriginForPlacement();

      this.#content.style.setProperty(
        "--radix-hover-card-trigger-width",
        `${rect.width}px`
      );
      this.#content.style.setProperty(
        "--radix-hover-card-trigger-height",
        `${rect.height}px`
      );
      this.#content.style.setProperty(
        "--radix-hover-card-content-available-width",
        `${Math.max(0, Math.round(availableWidth))}px`
      );
      this.#content.style.setProperty(
        "--radix-hover-card-content-available-height",
        `${Math.max(0, Math.round(availableHeight))}px`
      );
      this.#content.style.setProperty(
        "--radix-hover-card-content-transform-origin",
        transformOrigin
      );
    }

    /**
     * @param {DOMRect} rect
     * @returns {number}
     */
    #calculateAvailableWidth(rect) {
      switch (this.#side) {
        case "left":
          return rect.left;
        case "right":
          return window.innerWidth - rect.right;
        default:
          return Math.min(rect.left, window.innerWidth - rect.right);
      }
    }

    /**
     * @param {DOMRect} rect
     * @returns {number}
     */
    #calculateAvailableHeight(rect) {
      switch (this.#side) {
        case "top":
          return rect.top;
        case "bottom":
          return window.innerHeight - rect.bottom;
        default:
          return Math.min(rect.top, window.innerHeight - rect.bottom);
      }
    }

    /** @returns {string} */
    #transformOriginForPlacement() {
      const alignMap = {
        start: "0%",
        center: "50%",
        end: "100%",
      };
      switch (this.#side) {
        case "top":
          return `${alignMap[this.#align]} 100%`;
        case "bottom":
          return `${alignMap[this.#align]} 0%`;
        case "left":
          return `100% ${alignMap[this.#align]}`;
        case "right":
        default:
          return `0% ${alignMap[this.#align]}`;
      }
    }

    #handlePointerEnter = () => {
      this.#scheduleOpen();
    };

    #handlePointerLeave = (event) => {
      const related = /** @type {Node | null} */ (event.relatedTarget);
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const stillInside =
        (related !== null && (this.contains(related) || this.#root.contains(related))) ||
        path.includes(this.#content);
      if (stillInside) {
        return;
      }
      this.#scheduleClose();
    };

    #handleFocusIn = () => {
      this.#scheduleOpen();
    };

    #handleFocusOut = (event) => {
      const related = /** @type {Node | null} */ (event.relatedTarget);
      if (
        related &&
        (this.contains(related) || this.#root.contains(related) || related === this)
      ) {
        return;
      }
      this.#scheduleClose();
    };

    /** @param {KeyboardEvent} event */
    #handleKeydown = (event) => {
      if (event.key === "Escape" && this.#open) {
        this.hide();
      }
    };

    #scheduleOpen() {
      if (this.#openTimer !== null) {
        clearTimeout(this.#openTimer);
        this.#openTimer = null;
      }
      if (this.#open) {
        return;
      }
      this.#openTimer = window.setTimeout(() => {
        this.#openTimer = null;
        this.#setOpen(true);
      }, this.#openDelay);
    }

    #scheduleClose() {
      if (this.#closeTimer !== null) {
        clearTimeout(this.#closeTimer);
        this.#closeTimer = null;
      }
      if (!this.#open) {
        return;
      }
      this.#closeTimer = window.setTimeout(() => {
        this.#closeTimer = null;
        this.#setOpen(false);
      }, this.#closeDelay);
    }

    #stopTimers() {
      if (this.#openTimer !== null) {
        clearTimeout(this.#openTimer);
        this.#openTimer = null;
      }
      if (this.#closeTimer !== null) {
        clearTimeout(this.#closeTimer);
        this.#closeTimer = null;
      }
    }
  }

  customElements.define("wc-hover-card", WcHoverCard);
})();

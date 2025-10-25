/**
 * @file tooltip.js
 * @version 1.0.0
 *
 * Accessible tooltip web component inspired by the Radix UI Tooltip primitive.
 * Opens on hover or focus with configurable delays, supports four placement sides,
 * and exposes styling hooks via CSS custom properties and shadow parts.
 *
 * Usage:
 * <wc-tooltip>
 *   <button slot="trigger">Trigger</button>
 *   <span>Tooltip content</span>
 * </wc-tooltip>
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

  /** @typedef {"top" | "right" | "bottom" | "left"} TooltipSide */
  /** @typedef {"start" | "center" | "end"} TooltipAlign */

  const VALID_SIDES = new Set(["top", "right", "bottom", "left"]);
  const VALID_ALIGNS = new Set(["start", "center", "end"]);
  const DEFAULT_OPEN_DELAY = 700;
  const DEFAULT_CLOSE_DELAY = 150;
  const DEFAULT_SIDE_OFFSET = 6;
  const DEFAULT_ALIGN_OFFSET = 0;

  if (customElements.get("wc-tooltip")) {
    return;
  }

  let tooltipId = 0;

  /**
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * @param {string | null} value
   * @param {number} fallback
   */
  const parseDuration = (value, fallback) => {
    if (value === null) {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  /**
   * @param {string | null} value
   * @param {number} fallback
   */
  const parseOffset = (value, fallback) => {
    if (value === null) {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  class WcTooltip extends HTMLElement {
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
    /** @type {boolean} */
    #reflecting = false;
    /** @type {number} */
    #openDelay = DEFAULT_OPEN_DELAY;
    /** @type {number} */
    #closeDelay = DEFAULT_CLOSE_DELAY;
    /** @type {TooltipSide} */
    #side = "top";
    /** @type {TooltipAlign} */
    #align = "center";
    /** @type {number} */
    #sideOffset = DEFAULT_SIDE_OFFSET;
    /** @type {number} */
    #alignOffset = DEFAULT_ALIGN_OFFSET;
    /** @type {boolean} */
    #hideArrow = false;
    /** @type {ResizeObserver | null} */
    #resizeObserver = null;
    /** @type {() => void} */
    #updateMetrics;
    /** @type {Set<HTMLElement>} */
    #triggerElements = new Set();
    /** @type {WeakMap<HTMLElement, string | null>} */
    #describedBy = new WeakMap();
    /** @type {string} */
    #contentId;
    /** @type {boolean} */
    #globalsAttached = false;
    /** @type {(event: PointerEvent) => void} */
    #boundPointerEnter;
    /** @type {(event: PointerEvent) => void} */
    #boundPointerLeave;
    /** @type {(event: FocusEvent) => void} */
    #boundFocusIn;
    /** @type {(event: FocusEvent) => void} */
    #boundFocusOut;
    /** @type {(event: MouseEvent) => void} */
    #boundTriggerClick;
    /** @type {(event: KeyboardEvent) => void} */
    #boundKeyDown;
    /** @type {(event: KeyboardEvent) => void} */
    #boundDocumentKeyDown;
    /** @type {(event: PointerEvent) => void} */
    #boundDocumentPointerDown;
    /** @type {(event: PointerEvent) => void} */
    #boundContentPointerEnter;
    /** @type {(event: PointerEvent) => void} */
    #boundContentPointerLeave;
    /** @type {() => void} */
    #boundSlotChange;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            --tooltip-surface: #ffffff;
            --tooltip-color: #0f172a;
            --tooltip-border: 1px solid rgba(148, 163, 184, 0.28);
            --tooltip-radius: 8px;
            --tooltip-padding: 0.5rem 0.75rem;
            --tooltip-shadow: 0 20px 48px -20px rgba(15, 23, 42, 0.45);
            --tooltip-font-size: 0.875rem;
            --tooltip-font-weight: 500;
            --tooltip-line-height: 1.35;
            --tooltip-side-offset: ${DEFAULT_SIDE_OFFSET}px;
            --tooltip-align-offset: ${DEFAULT_ALIGN_OFFSET}px;
            --tooltip-arrow-size: 10px;
            --tooltip-transition-duration: 150ms;
            --tooltip-transition-timing: cubic-bezier(0.16, 1, 0.3, 1);
            --tooltip-transform-origin: center;
            --tooltip-translate-x: 0px;
            --tooltip-translate-y: 0px;
            display: inline-block;
            position: relative;
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([data-state="open"]) {
            z-index: var(--tooltip-z-index, 30);
          }

          [part="trigger"] {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: var(--tooltip-trigger-cursor, pointer);
            outline: none;
          }

          [part="trigger"]:focus-visible {
            box-shadow: var(
              --tooltip-trigger-focus-shadow,
              0 0 0 3px rgba(99, 102, 241, 0.4)
            );
            border-radius: var(--tooltip-trigger-focus-radius, 999px);
          }

          [part="content"] {
            position: absolute;
            inset: 0 auto auto 0;
            max-inline-size: min(var(--tooltip-max-width, 20rem), 90vw);
            padding: var(--tooltip-padding);
            background: var(--tooltip-surface);
            color: var(--tooltip-color);
            border: var(--tooltip-border);
            border-radius: var(--tooltip-radius);
            box-shadow: var(--tooltip-shadow);
            font-size: var(--tooltip-font-size);
            font-weight: var(--tooltip-font-weight);
            line-height: var(--tooltip-line-height);
            pointer-events: none;
            opacity: 0;
            transform: translate3d(
              var(--tooltip-translate-x),
              var(--tooltip-translate-y),
              0
            )
              scale(0.96);
            transform-origin: var(--tooltip-transform-origin);
            transition:
              opacity var(--tooltip-transition-duration)
                var(--tooltip-transition-timing),
              transform var(--tooltip-transition-duration)
                var(--tooltip-transition-timing);
            will-change: transform, opacity;
            display: inline-flex;
            gap: var(--tooltip-content-gap, 0.35rem);
            align-items: center;
          }

          :host([data-state="open"]) [part="content"] {
            opacity: 1;
            transform: translate3d(
              var(--tooltip-translate-x),
              var(--tooltip-translate-y),
              0
            )
              scale(1);
          }

          :host([data-hide-arrow="true"]) [part="arrow"] {
            display: none;
          }

          [part="arrow"] {
            position: absolute;
            width: var(--tooltip-arrow-size);
            height: var(--tooltip-arrow-size);
            background: var(--tooltip-surface);
            border: var(--tooltip-border);
            transform: rotate(45deg);
            pointer-events: none;
            opacity: 0;
            transition: opacity var(--tooltip-transition-duration)
              var(--tooltip-transition-timing);
          }

          :host([data-state="open"]) [part="arrow"] {
            opacity: 1;
          }

          :host([data-side="top"]) [part="arrow"] {
            bottom: calc(var(--tooltip-arrow-size) / -2);
          }

          :host([data-side="bottom"]) [part="arrow"] {
            top: calc(var(--tooltip-arrow-size) / -2);
          }

          :host([data-side="left"]) [part="arrow"] {
            right: calc(var(--tooltip-arrow-size) / -2);
          }

          :host([data-side="right"]) [part="arrow"] {
            left: calc(var(--tooltip-arrow-size) / -2);
          }

          ::slotted([slot="trigger"]) {
            outline: none;
          }

          ::slotted(*) {
            font: inherit;
          }
        </style>
        <div part="trigger">
          <slot name="trigger"></slot>
        </div>
        <div part="content" role="tooltip" aria-hidden="true">
          <slot></slot>
          <div part="arrow" aria-hidden="true"></div>
        </div>
      `;

      this.#triggerContainer = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="trigger"]')
      );
      this.#content = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="content"]')
      );
      this.#arrow = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="arrow"]')
      );
      this.#triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      this.#contentSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot:not([name])')
      );

      tooltipId += 1;
      this.#contentId = `wc-tooltip-${tooltipId}`;
      this.#content.id = this.#contentId;
      this.dataset.side = this.#side;
      this.dataset.align = this.#align;
      this.toggleAttribute("data-hide-arrow", this.#hideArrow);

      this.#updateMetrics = () => {
        if (this.#open) {
          this._positionContent();
        }
      };

      this.#boundPointerEnter = this.#handlePointerEnter.bind(this);
      this.#boundPointerLeave = this.#handlePointerLeave.bind(this);
      this.#boundFocusIn = this.#handleFocusIn.bind(this);
      this.#boundFocusOut = this.#handleFocusOut.bind(this);
      this.#boundTriggerClick = this.#handleTriggerClick.bind(this);
      this.#boundKeyDown = this.#handleKeyDown.bind(this);
      this.#boundDocumentKeyDown = this.#handleDocumentKeyDown.bind(this);
      this.#boundDocumentPointerDown = this.#handleDocumentPointerDown.bind(this);
      this.#boundContentPointerEnter = this.#handleContentPointerEnter.bind(this);
      this.#boundContentPointerLeave = this.#handleContentPointerLeave.bind(this);
      this.#boundSlotChange = this.#handleSlotChange.bind(this);
    }

    connectedCallback() {
      upgradeProperty(this, "open");

      if (this.hasAttribute("open")) {
        this.#open = true;
      } else if (this.hasAttribute("default-open")) {
        this.#open = true;
        this.#reflectOpenAttribute(true);
      }

      this.#triggerContainer.addEventListener("pointerenter", this.#boundPointerEnter);
      this.#triggerContainer.addEventListener("pointerleave", this.#boundPointerLeave);
      this.#triggerContainer.addEventListener("focusin", this.#boundFocusIn);
      this.#triggerContainer.addEventListener("focusout", this.#boundFocusOut);
      this.#triggerContainer.addEventListener("click", this.#boundTriggerClick);
      this.#triggerContainer.addEventListener("keydown", this.#boundKeyDown, true);
      this.#content.addEventListener("pointerenter", this.#boundContentPointerEnter);
      this.#content.addEventListener("pointerleave", this.#boundContentPointerLeave);
      this.#triggerSlot.addEventListener("slotchange", this.#boundSlotChange);

      this.#applyState();
      this.#handleSlotChange();
      this.#contentSlot.addEventListener("slotchange", this.#updateMetrics);

      if (!this.#resizeObserver && "ResizeObserver" in window) {
        this.#resizeObserver = new ResizeObserver(this.#updateMetrics);
      }

      this.#resizeObserver?.observe(this);
      this.#resizeObserver?.observe(this.#content);

      if (this.#open) {
        this.#attachGlobals();
        this._positionContent();
      }
    }

    disconnectedCallback() {
      this.#triggerContainer.removeEventListener("pointerenter", this.#boundPointerEnter);
      this.#triggerContainer.removeEventListener("pointerleave", this.#boundPointerLeave);
      this.#triggerContainer.removeEventListener("focusin", this.#boundFocusIn);
      this.#triggerContainer.removeEventListener("focusout", this.#boundFocusOut);
      this.#triggerContainer.removeEventListener("click", this.#boundTriggerClick);
      this.#triggerContainer.removeEventListener("keydown", this.#boundKeyDown, true);
      this.#content.removeEventListener("pointerenter", this.#boundContentPointerEnter);
      this.#content.removeEventListener("pointerleave", this.#boundContentPointerLeave);
      this.#triggerSlot.removeEventListener("slotchange", this.#boundSlotChange);
      this.#contentSlot.removeEventListener("slotchange", this.#updateMetrics);
      this.#resizeObserver?.disconnect();
      this.#resizeObserver = null;
      this.#detachGlobals();
      this.#triggerElements.forEach((element) => this.#teardownTriggerElement(element));
      this.#triggerElements.clear();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case "open": {
          if (this.#reflecting) {
            return;
          }
          const nextOpen = newValue !== null;
          if (nextOpen !== this.#open) {
            this.#open = nextOpen;
            this.#applyState();
          }
          break;
        }
        case "open-delay": {
          this.#openDelay = parseDuration(newValue, DEFAULT_OPEN_DELAY);
          break;
        }
        case "close-delay": {
          this.#closeDelay = parseDuration(newValue, DEFAULT_CLOSE_DELAY);
          break;
        }
        case "side": {
          this.#side = VALID_SIDES.has(newValue ?? "")
            ? /** @type {TooltipSide} */ (newValue)
            : this.#side;
          this.dataset.side = this.#side;
          if (this.#open) {
            this._positionContent();
          }
          break;
        }
        case "align": {
          this.#align = VALID_ALIGNS.has(newValue ?? "")
            ? /** @type {TooltipAlign} */ (newValue)
            : this.#align;
          this.dataset.align = this.#align;
          if (this.#open) {
            this._positionContent();
          }
          break;
        }
        case "side-offset": {
          this.#sideOffset = parseOffset(newValue, DEFAULT_SIDE_OFFSET);
          this.style.setProperty("--tooltip-side-offset", `${this.#sideOffset}px`);
          if (this.#open) {
            this._positionContent();
          }
          break;
        }
        case "align-offset": {
          this.#alignOffset = parseOffset(newValue, DEFAULT_ALIGN_OFFSET);
          this.style.setProperty("--tooltip-align-offset", `${this.#alignOffset}px`);
          if (this.#open) {
            this._positionContent();
          }
          break;
        }
        case "hide-arrow": {
          this.#hideArrow = newValue !== null;
          this.toggleAttribute("data-hide-arrow", this.#hideArrow);
          break;
        }
        default:
          break;
      }
    }

    get open() {
      return this.#open;
    }

    /**
     * @param {boolean} value
     */
    set open(value) {
      const nextOpen = Boolean(value);
      if (nextOpen === this.#open) {
        return;
      }
      this.#open = nextOpen;
      this.#reflectOpenAttribute(nextOpen);
      this.#applyState();
    }

    get side() {
      return this.#side;
    }

    /**
     * @param {TooltipSide} value
     */
    set side(value) {
      if (!VALID_SIDES.has(value)) {
        return;
      }
      if (this.#side === value) {
        return;
      }
      this.setAttribute("side", value);
    }

    get align() {
      return this.#align;
    }

    /**
     * @param {TooltipAlign} value
     */
    set align(value) {
      if (!VALID_ALIGNS.has(value)) {
        return;
      }
      if (this.#align === value) {
        return;
      }
      this.setAttribute("align", value);
    }

    get openDelay() {
      return this.#openDelay;
    }

    /**
     * @param {number} value
     */
    set openDelay(value) {
      this.setAttribute("open-delay", String(Math.max(0, value)));
    }

    get closeDelay() {
      return this.#closeDelay;
    }

    /**
     * @param {number} value
     */
    set closeDelay(value) {
      this.setAttribute("close-delay", String(Math.max(0, value)));
    }

    #applyState() {
      this.dataset.state = this.#open ? "open" : "closed";
      this.#content.setAttribute("aria-hidden", this.#open ? "false" : "true");
      this.#contentSlot.assignedElements({ flatten: true }).forEach((node) => {
        if (node instanceof HTMLElement) {
          node.toggleAttribute("data-open", this.#open);
        }
      });
      this.#updateTriggerState();

      if (this.#open) {
        this.#attachGlobals();
        this._positionContent();
      } else {
        this.#detachGlobals();
      }
    }

    #attachGlobals() {
      if (this.#globalsAttached) {
        return;
      }
      window.addEventListener("resize", this.#updateMetrics, { passive: true });
      window.addEventListener("scroll", this.#updateMetrics, true);
      document.addEventListener("keydown", this.#boundDocumentKeyDown, true);
      document.addEventListener("pointerdown", this.#boundDocumentPointerDown, true);
      this.#globalsAttached = true;
    }

    #detachGlobals() {
      if (!this.#globalsAttached) {
        return;
      }
      window.removeEventListener("resize", this.#updateMetrics);
      window.removeEventListener("scroll", this.#updateMetrics, true);
      document.removeEventListener("keydown", this.#boundDocumentKeyDown, true);
      document.removeEventListener("pointerdown", this.#boundDocumentPointerDown, true);
      this.#globalsAttached = false;
    }

    #handlePointerEnter() {
      this.#clearCloseTimer();
      this.#scheduleOpen(this.#openDelay);
    }

    #handlePointerLeave() {
      this.#clearOpenTimer();
      this.#scheduleClose(this.#closeDelay);
    }

    #handleContentPointerEnter() {
      this.#clearCloseTimer();
    }

    #handleContentPointerLeave() {
      if (!this.matches(":focus-within")) {
        this.#scheduleClose(this.#closeDelay);
      }
    }

    #handleFocusIn() {
      this.#clearCloseTimer();
      this.#scheduleOpen(0);
    }

    #handleFocusOut(event) {
      if (!this.contains(/** @type {Node} */ (event.relatedTarget))) {
        this.#clearOpenTimer();
        this.#scheduleClose(this.#closeDelay);
      }
    }

    #handleTriggerClick() {
      this.#clearOpenTimer();
      this.#clearCloseTimer();
      this.open = false;
    }

    #handleKeyDown(event) {
      if (event.key === "Escape" && this.#open) {
        event.stopPropagation();
        this.open = false;
      }
    }

    #handleDocumentKeyDown(event) {
      if (event.key === "Escape" && this.#open) {
        this.open = false;
      }
    }

    #handleDocumentPointerDown(event) {
      if (!this.#open) {
        return;
      }
      const target = /** @type {Node | null} */ (event.target);
      if (target && !this.contains(target)) {
        this.open = false;
      }
    }

    #scheduleOpen(delay) {
      if (this.#open) {
        return;
      }
      this.#clearOpenTimer();
      this.#openTimer = window.setTimeout(() => {
        this.open = true;
      }, Math.max(0, delay));
    }

    #scheduleClose(delay) {
      this.#clearCloseTimer();
      this.#closeTimer = window.setTimeout(() => {
        this.open = false;
      }, Math.max(0, delay));
    }

    #clearOpenTimer() {
      if (this.#openTimer !== null) {
        window.clearTimeout(this.#openTimer);
        this.#openTimer = null;
      }
    }

    #clearCloseTimer() {
      if (this.#closeTimer !== null) {
        window.clearTimeout(this.#closeTimer);
        this.#closeTimer = null;
      }
    }

    #reflectOpenAttribute(value) {
      this.#reflecting = true;
      if (value) {
        this.setAttribute("open", "");
      } else {
        this.removeAttribute("open");
      }
      this.#reflecting = false;
    }

    #handleSlotChange() {
      const assigned = this.#triggerSlot.assignedElements({ flatten: true });
      const next = new Set(assigned.filter((node) => node instanceof HTMLElement));
      this.#triggerElements.forEach((element) => {
        if (!next.has(element)) {
          this.#teardownTriggerElement(element);
        }
      });
      next.forEach((element) => {
        if (!this.#triggerElements.has(element)) {
          this.#setupTriggerElement(element);
        }
      });
      this.#triggerElements = next;
      this.#updateTriggerState();
      this.#updateMetrics();
    }

    /**
     * @param {HTMLElement} element
     */
    #setupTriggerElement(element) {
      this.#describedBy.set(element, element.getAttribute("aria-describedby"));
      const tokens = new Set(
        (element.getAttribute("aria-describedby") ?? "")
          .split(/\s+/)
          .filter(Boolean)
      );
      tokens.add(this.#contentId);
      element.setAttribute("aria-describedby", Array.from(tokens).join(" "));
    }

    /**
     * @param {HTMLElement} element
     */
    #teardownTriggerElement(element) {
      const original = this.#describedBy.get(element) ?? "";
      if (original) {
        element.setAttribute("aria-describedby", original);
      } else {
        element.removeAttribute("aria-describedby");
      }
      element.removeAttribute("data-state");
      this.#describedBy.delete(element);
    }

    #updateTriggerState() {
      this.#triggerElements.forEach((element) => {
        element.setAttribute("data-state", this.#open ? "open" : "closed");
      });
    }

    /**
     * Positions the tooltip surface relative to the trigger.
     *
     * @private
     */
    _positionContent() {
      const triggerRect = this.#triggerContainer.getBoundingClientRect();
      const contentRect = this.#content.getBoundingClientRect();

      const triggerWidth = triggerRect.width;
      const triggerHeight = triggerRect.height;
      const contentWidth = contentRect.width;
      const contentHeight = contentRect.height;

      const sideOffset = this.#sideOffset;
      const alignOffset = this.#alignOffset;

      /** @type {number} */
      let translateX = 0;
      /** @type {number} */
      let translateY = 0;

      if (this.#side === "top" || this.#side === "bottom") {
        const baseAlign = (() => {
          switch (this.#align) {
            case "start":
              return 0;
            case "end":
              return triggerWidth - contentWidth;
            default:
              return (triggerWidth - contentWidth) / 2;
          }
        })();
        translateX = baseAlign + alignOffset;
        translateY =
          this.#side === "bottom"
            ? triggerHeight + sideOffset
            : -contentHeight - sideOffset;
      } else {
        const baseAlign = (() => {
          switch (this.#align) {
            case "start":
              return 0;
            case "end":
              return triggerHeight - contentHeight;
            default:
              return (triggerHeight - contentHeight) / 2;
          }
        })();
        translateY = baseAlign + alignOffset;
        translateX =
          this.#side === "right"
            ? triggerWidth + sideOffset
            : -contentWidth - sideOffset;
      }

      const originX = (() => {
        switch (this.#side) {
          case "left":
            return "100%";
          case "right":
            return "0%";
          default: {
            switch (this.#align) {
              case "start":
                return "0%";
              case "end":
                return "100%";
              default:
                return "50%";
            }
          }
        }
      })();

      const originY = (() => {
        switch (this.#side) {
          case "top":
            return "100%";
          case "bottom":
            return "0%";
          default: {
            switch (this.#align) {
              case "start":
                return "0%";
              case "end":
                return "100%";
              default:
                return "50%";
            }
          }
        }
      })();

      this.style.setProperty("--tooltip-transform-origin", `${originX} ${originY}`);
      this.#content.style.setProperty("--tooltip-translate-x", `${translateX}px`);
      this.#content.style.setProperty("--tooltip-translate-y", `${translateY}px`);

      if (!this.#hideArrow) {
        const arrowSize = this.#arrow.offsetWidth || 10;
        if (this.#side === "top" || this.#side === "bottom") {
          const triggerCenter = triggerWidth / 2;
          const arrowLeft = clamp(
            triggerCenter - translateX - arrowSize / 2,
            4,
            contentWidth - arrowSize - 4
          );
          this.#arrow.style.left = `${arrowLeft}px`;
          this.#arrow.style.top = "";
          this.#arrow.style.bottom = "";
          this.#arrow.style.right = "";
        } else {
          const triggerCenter = triggerHeight / 2;
          const arrowTop = clamp(
            triggerCenter - translateY - arrowSize / 2,
            4,
            contentHeight - arrowSize - 4
          );
          this.#arrow.style.top = `${arrowTop}px`;
          this.#arrow.style.left = "";
          this.#arrow.style.right = "";
          this.#arrow.style.bottom = "";
        }
      }
    }
  }

  customElements.define("wc-tooltip", WcTooltip);
})();

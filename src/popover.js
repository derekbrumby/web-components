/**
 * @file popover.js
 * @version 1.0.0
 *
 * Accessible popover web component inspired by the Radix UI Popover primitive.
 * Provides declarative and imperative APIs to control visibility, focus
 * management, side/align placement, collision handling, and optional arrow
 * rendering without external dependencies.
 *
 * Usage:
 * <wc-popover side="bottom" align="center">
 *   <button slot="trigger" type="button">Open settings</button>
 *   <div slot="content">
 *     <h3>Settings</h3>
 *     <p>Adjust preferences directly inside the popover.</p>
 *     <button data-popover-close type="button">Done</button>
 *   </div>
 * </wc-popover>
 */

(() => {
  /**
   * Upgrades properties that might have been set prior to the custom element
   * definition being registered.
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
   * Parses a numeric attribute and falls back to the provided default when the
   * value is not a finite number.
   * @param {string | null} value
   * @param {number} fallback
   */
  const parseNumber = (value, fallback) => {
    if (value == null || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  /**
   * Returns focusable descendants of the given root node.
   * @param {HTMLElement} root
   * @returns {HTMLElement[]}
   */
  const getFocusable = (root) => {
    const selector = [
      "a[href]",
      "area[href]",
      "button:not([disabled])",
      "input:not([disabled]):not([type=hidden])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "summary",
      "details",
      "[contenteditable]",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    return /** @type {HTMLElement[]} */ (
      Array.from(root.querySelectorAll(selector)).filter(
        (element) => !element.hasAttribute("inert") && element.tabIndex !== -1,
      )
    );
  };

  const VALID_SIDES = new Set(["top", "right", "bottom", "left"]);
  const VALID_ALIGNS = new Set(["start", "center", "end"]);

  const DEFAULT_SIDE_OFFSET = 8;
  const DEFAULT_ALIGN_OFFSET = 0;
  const DEFAULT_COLLISION_PADDING = 8;

  let instanceCount = 0;

  class WcPopover extends HTMLElement {
    static get observedAttributes() {
      return [
        "open",
        "default-open",
        "modal",
        "side",
        "align",
        "side-offset",
        "align-offset",
        "collision-padding",
        "avoid-collisions",
        "hide-arrow",
        "close-on-escape",
        "close-on-interact-outside",
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLSlotElement} */
    #triggerSlot;
    /** @type {HTMLSlotElement} */
    #anchorSlot;
    /** @type {HTMLSlotElement} */
    #contentSlot;
    /** @type {HTMLElement | null} */
    #trigger = null;
    /** @type {HTMLElement | null} */
    #anchor = null;
    /** @type {HTMLElement} */
    #portal;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLDivElement} */
    #arrow;
    /** @type {Comment | null} */
    #contentPlaceholder = null;
    /** @type {Node[]} */
    #contentNodes = [];
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #modal = false;
    /** @type {"top" | "right" | "bottom" | "left"} */
    #side = "bottom";
    /** @type {"start" | "center" | "end"} */
    #align = "center";
    /** @type {number} */
    #sideOffset = DEFAULT_SIDE_OFFSET;
    /** @type {number} */
    #alignOffset = DEFAULT_ALIGN_OFFSET;
    /** @type {number} */
    #collisionPadding = DEFAULT_COLLISION_PADDING;
    /** @type {boolean} */
    #avoidCollisions = true;
    /** @type {boolean} */
    #hideArrow = false;
    /** @type {boolean} */
    #closeOnEscape = true;
    /** @type {boolean} */
    #closeOnInteractOutside = true;
    /** @type {boolean} */
    #reflecting = false;
    /** @type {HTMLElement | null} */
    #lastFocused = null;
    /** @type {(event: Event) => void} */
    #boundTriggerClick;
    /** @type {(event: KeyboardEvent) => void} */
    #boundTriggerKeydown;
    /** @type {(event: KeyboardEvent) => void} */
    #boundDocumentKeydown;
    /** @type {(event: FocusEvent) => void} */
    #boundDocumentFocusIn;
    /** @type {(event: PointerEvent) => void} */
    #boundDocumentPointerDown;
    /** @type {(event: KeyboardEvent) => void} */
    #boundContentKeydown;
    /** @type {number | null} */
    #rafId = null;
    /** @type {string} */
    #contentId;
    /** @type {ResizeObserver | null} */
    #resizeObserver = null;
    /** @type {() => void} */
    #boundWindowResize;
    /** @type {() => void} */
    #boundWindowScroll;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            position: relative;
            display: inline-block;
            color: inherit;
            --wc-popover-surface: var(--popover-surface, #ffffff);
            --wc-popover-color: var(--popover-color, #0f172a);
            --wc-popover-border: var(--popover-border, 1px solid rgba(148, 163, 184, 0.35));
            --wc-popover-shadow: var(--popover-shadow, 0 32px 80px -28px rgba(15, 23, 42, 0.45));
            --wc-popover-radius: var(--popover-radius, 14px);
            --wc-popover-padding: var(--popover-padding, 1.25rem);
            --wc-popover-gap: var(--popover-gap, 1rem);
            --wc-popover-transition-duration: var(--popover-transition-duration, 150ms);
            --wc-popover-transition-easing: var(--popover-transition-easing, cubic-bezier(0.16, 1, 0.3, 1));
            --wc-popover-transform-origin: 50% 0%;
            --wc-popover-arrow-size: var(--popover-arrow-size, 12px);
            --wc-popover-arrow-offset: var(--popover-arrow-offset, 12px);
            --wc-popover-z-index: var(--popover-z-index, 50);
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="trigger"] {
            display: inline-flex;
            align-items: center;
          }

          ::slotted([slot="trigger"]) {
            cursor: var(--popover-trigger-cursor, pointer);
          }

          ::slotted([slot="trigger"]:focus-visible) {
            outline: var(--popover-trigger-focus-outline, 3px solid rgba(99, 102, 241, 0.45));
            outline-offset: var(--popover-trigger-focus-outline-offset, 3px);
          }

          :host([data-state="open"]) {
            z-index: var(--wc-popover-z-index);
          }

          slot[name="content"] {
            display: none;
          }
        </style>
        <div part="trigger" data-trigger>
          <slot name="trigger"></slot>
        </div>
        <slot name="anchor"></slot>
        <slot name="content"></slot>
      `;

      this.#triggerSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="trigger"]')
      );
      this.#anchorSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="anchor"]')
      );
      this.#contentSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="content"]')
      );

      this.#portal = document.createElement("div");
      this.#portal.setAttribute("part", "portal");
      this.#portal.setAttribute("data-state", "closed");
      this.#portal.hidden = true;
      this.#portal.style.position = "fixed";
      this.#portal.style.inset = "0 auto auto 0";
      this.#portal.style.pointerEvents = "none";
      this.#portal.style.zIndex = "var(--wc-popover-z-index)";

      this.#content = document.createElement("div");
      this.#content.setAttribute("part", "content");
      this.#content.dataset.state = "closed";
      this.#content.tabIndex = -1;
      this.#content.style.position = "fixed";
      this.#content.style.display = "flex";
      this.#content.style.flexDirection = "column";
      this.#content.style.gap = "var(--wc-popover-gap)";
      this.#content.style.background = "var(--wc-popover-surface)";
      this.#content.style.color = "var(--wc-popover-color)";
      this.#content.style.border = "var(--wc-popover-border)";
      this.#content.style.borderRadius = "var(--wc-popover-radius)";
      this.#content.style.boxShadow = "var(--wc-popover-shadow)";
      this.#content.style.padding = "var(--wc-popover-padding)";
      this.#content.style.boxSizing = "border-box";
      this.#content.style.opacity = "0";
      this.#content.style.transform = "scale(0.96)";
      this.#content.style.transformOrigin = "var(--wc-popover-transform-origin)";
      this.#content.style.transition = `opacity var(--wc-popover-transition-duration) var(--wc-popover-transition-easing), transform var(--wc-popover-transition-duration) var(--wc-popover-transition-easing)`;
      this.#content.style.pointerEvents = "auto";

      this.#arrow = document.createElement("div");
      this.#arrow.setAttribute("part", "arrow");
      this.#arrow.style.position = "absolute";
      this.#arrow.style.width = "var(--wc-popover-arrow-size)";
      this.#arrow.style.height = "var(--wc-popover-arrow-size)";
      this.#arrow.style.transform = "rotate(45deg)";
      this.#arrow.style.background = "var(--wc-popover-surface)";
      this.#arrow.style.border = "var(--popover-arrow-border, inherit)";
      this.#arrow.style.boxSizing = "border-box";
      this.#arrow.style.boxShadow = "var(--popover-arrow-shadow, 0 10px 30px -18px rgba(15, 23, 42, 0.45))";
      this.#arrow.style.pointerEvents = "none";

      this.#content.appendChild(this.#arrow);
      this.#portal.appendChild(this.#content);

      this.#boundTriggerClick = (event) => this.#handleTriggerClick(event);
      this.#boundTriggerKeydown = (event) => this.#handleTriggerKeydown(event);
      this.#boundDocumentKeydown = (event) => this.#handleDocumentKeydown(event);
      this.#boundDocumentFocusIn = (event) => this.#handleDocumentFocusIn(event);
      this.#boundDocumentPointerDown = (event) => this.#handleDocumentPointerDown(event);
      this.#boundContentKeydown = (event) => this.#handleContentKeydown(event);
      this.#boundWindowResize = () => this.#attachAfterRenderPositioning();
      this.#boundWindowScroll = () => this.#attachAfterRenderPositioning();

      this.#content.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.hasAttribute("data-popover-close")) {
          this.hide();
        }
      });
      this.#content.addEventListener("keydown", this.#boundContentKeydown);

      if (typeof ResizeObserver !== "undefined") {
        this.#resizeObserver = new ResizeObserver(() => this.#attachAfterRenderPositioning());
      }

      this.#triggerSlot.addEventListener("slotchange", () => this.#syncTrigger());
      this.#anchorSlot.addEventListener("slotchange", () => this.#syncAnchor());
      this.#contentSlot.addEventListener("slotchange", () => this.#syncContentPlaceholder());

      instanceCount += 1;
      this.#contentId = `wc-popover-content-${instanceCount}`;
      this.#content.id = this.#contentId;
    }

    connectedCallback() {
      upgradeProperty(this, "open");
      upgradeProperty(this, "modal");

      if (!document.body.contains(this.#portal)) {
        document.body.appendChild(this.#portal);
      }

      this.#syncTrigger();
      this.#syncAnchor();
      this.#syncContentPlaceholder();
      this.#modal = this.hasAttribute("modal");
      this.#side = this.#parseSide(this.getAttribute("side"));
      this.#align = this.#parseAlign(this.getAttribute("align"));
      this.#sideOffset = parseNumber(this.getAttribute("side-offset"), DEFAULT_SIDE_OFFSET);
      this.#alignOffset = parseNumber(this.getAttribute("align-offset"), DEFAULT_ALIGN_OFFSET);
      this.#collisionPadding = parseNumber(
        this.getAttribute("collision-padding"),
        DEFAULT_COLLISION_PADDING,
      );
      this.#avoidCollisions = !this.hasAttribute("avoid-collisions") || this.getAttribute("avoid-collisions") !== "false";
      this.#hideArrow = this.hasAttribute("hide-arrow");
      this.#closeOnEscape = !this.hasAttribute("close-on-escape") || this.getAttribute("close-on-escape") !== "false";
      this.#closeOnInteractOutside =
        !this.hasAttribute("close-on-interact-outside") ||
        this.getAttribute("close-on-interact-outside") !== "false";

      if (!this.hasAttribute("data-state")) {
        this.setAttribute("data-state", "closed");
      }

      if (this.hasAttribute("open")) {
        this.#setOpen(true, { emit: false });
      } else if (this.hasAttribute("default-open")) {
        this.#setOpen(true, { emit: false, reflect: false });
      }
    }

    disconnectedCallback() {
      this.#detachTrigger();
      this.#teardownDocumentListeners();
      this.#resizeObserver?.disconnect();
      this.#restoreContent();
      if (this.#portal.parentNode) {
        this.#portal.parentNode.removeChild(this.#portal);
      }
      if (this.#rafId !== null) {
        cancelAnimationFrame(this.#rafId);
        this.#rafId = null;
      }
    }

    /** @returns {boolean} */
    get open() {
      return this.#open;
    }

    /** @param {boolean} value */
    set open(value) {
      this.#setOpen(Boolean(value));
    }

    /** @returns {boolean} */
    get modal() {
      return this.#modal;
    }

    /** @param {boolean} value */
    set modal(value) {
      this.#modal = Boolean(value);
      if (this.#modal) {
        this.setAttribute("modal", "");
      } else {
        this.removeAttribute("modal");
      }
      if (this.#open) {
        this.#applyModalState();
      }
    }

    show() {
      this.#setOpen(true);
    }

    hide() {
      this.#setOpen(false);
    }

    toggle(force) {
      if (typeof force === "boolean") {
        this.#setOpen(force);
        return;
      }
      this.#setOpen(!this.#open);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case "open": {
          if (this.#reflecting) {
            this.#reflecting = false;
            return;
          }
          this.#setOpen(newValue !== null, { reflect: false });
          break;
        }
        case "modal": {
          this.#modal = newValue !== null;
          if (this.#open) {
            this.#applyModalState();
          }
          break;
        }
        case "side": {
          this.#side = this.#parseSide(newValue);
          if (this.#open) {
            this.#positionContent();
          }
          break;
        }
        case "align": {
          this.#align = this.#parseAlign(newValue);
          if (this.#open) {
            this.#positionContent();
          }
          break;
        }
        case "side-offset": {
          this.#sideOffset = parseNumber(newValue, DEFAULT_SIDE_OFFSET);
          if (this.#open) {
            this.#positionContent();
          }
          break;
        }
        case "align-offset": {
          this.#alignOffset = parseNumber(newValue, DEFAULT_ALIGN_OFFSET);
          if (this.#open) {
            this.#positionContent();
          }
          break;
        }
        case "collision-padding": {
          this.#collisionPadding = parseNumber(newValue, DEFAULT_COLLISION_PADDING);
          if (this.#open) {
            this.#positionContent();
          }
          break;
        }
        case "avoid-collisions": {
          this.#avoidCollisions = newValue !== "false";
          if (this.#open) {
            this.#positionContent();
          }
          break;
        }
        case "hide-arrow": {
          this.#hideArrow = newValue !== null;
          if (this.#open) {
            this.#applyArrowVisibility();
            this.#positionContent();
          }
          break;
        }
        case "close-on-escape": {
          this.#closeOnEscape = newValue !== "false";
          break;
        }
        case "close-on-interact-outside": {
          this.#closeOnInteractOutside = newValue !== "false";
          break;
        }
        default:
          break;
      }
    }

    /** @param {string | null} value */
    #parseSide(value) {
      if (value && VALID_SIDES.has(value)) {
        return /** @type {"top" | "right" | "bottom" | "left"} */ (value);
      }
      return "bottom";
    }

    /** @param {string | null} value */
    #parseAlign(value) {
      if (value && VALID_ALIGNS.has(value)) {
        return /** @type {"start" | "center" | "end"} */ (value);
      }
      return "center";
    }

    #syncTrigger() {
      this.#detachTrigger();
      const [trigger] = this.#triggerSlot.assignedElements({ flatten: true });
      if (trigger instanceof HTMLElement) {
        this.#trigger = trigger;
        this.#trigger.addEventListener("click", this.#boundTriggerClick);
        this.#trigger.addEventListener("keydown", this.#boundTriggerKeydown);
        this.#trigger.setAttribute("aria-haspopup", "dialog");
        this.#trigger.setAttribute("aria-controls", this.#contentId);
        this.#trigger.setAttribute("aria-expanded", this.#open ? "true" : "false");
        if (!this.#trigger.id) {
          this.#trigger.id = `wc-popover-trigger-${instanceCount}`;
        }
        this.#content.setAttribute("aria-labelledby", this.#trigger.id);
      } else {
        this.#trigger = null;
      }
    }

    #detachTrigger() {
      if (this.#trigger) {
        this.#trigger.removeEventListener("click", this.#boundTriggerClick);
        this.#trigger.removeEventListener("keydown", this.#boundTriggerKeydown);
        this.#trigger.removeAttribute("aria-haspopup");
        this.#trigger.removeAttribute("aria-controls");
        this.#trigger.removeAttribute("aria-expanded");
      }
      this.#trigger = null;
      this.#content.removeAttribute("aria-labelledby");
    }

    #syncAnchor() {
      const [anchor] = this.#anchorSlot.assignedElements({ flatten: true });
      this.#anchor = anchor instanceof HTMLElement ? anchor : null;
    }

    #syncContentPlaceholder() {
      const assigned = this.#contentSlot.assignedNodes({ flatten: true });
      if (!this.#contentPlaceholder && assigned.length) {
        const firstNode = assigned[0];
        if (firstNode && firstNode.parentNode) {
          this.#contentPlaceholder = document.createComment("wc-popover-content");
          firstNode.parentNode.insertBefore(this.#contentPlaceholder, firstNode);
        }
      }
      this.#contentNodes = assigned.filter((node) => node !== this.#contentPlaceholder);
      if (this.#open) {
        for (const node of this.#contentNodes) {
          if (node instanceof Node && node.parentNode !== this.#content) {
            this.#content.appendChild(node);
          }
        }
        this.#attachAfterRenderPositioning();
      }
    }

    /**
     * @param {boolean} open
     * @param {{ emit?: boolean; reflect?: boolean }} [options]
     */
    #setOpen(open, options) {
      const { emit = true, reflect = true } = options ?? {};
      if (open === this.#open) return;
      this.#open = open;
      this.setAttribute("data-state", open ? "open" : "closed");
      if (this.#trigger) {
        this.#trigger.setAttribute("aria-expanded", open ? "true" : "false");
      }
      if (reflect) {
        this.#reflecting = true;
        if (open) {
          this.setAttribute("open", "");
        } else {
          this.removeAttribute("open");
        }
        this.#reflecting = false;
      }

      if (open) {
        this.#openPopover();
        if (emit) {
          this.dispatchEvent(
            new CustomEvent("wc-popover-open", { bubbles: true, composed: true })
          );
        }
      } else {
        this.#closePopover();
        if (emit) {
          this.dispatchEvent(
            new CustomEvent("wc-popover-close", { bubbles: true, composed: true })
          );
        }
      }
    }

    #openPopover() {
      this.#syncContentPlaceholder();
      this.#moveContentToPortal();
      this.#applyArrowVisibility();
      this.#portal.hidden = false;
      this.#portal.setAttribute("data-state", "open");
      this.#content.dataset.state = "open";
      this.#content.style.opacity = "0";
      this.#content.style.transform = "scale(0.96)";
      this.#content.style.visibility = "hidden";
      this.#applyModalState();
      this.#attachDocumentListeners();
      this.#resizeObserver?.observe(this.#content);
      this.#lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.#rafId = requestAnimationFrame(() => {
        this.#rafId = null;
        this.#positionContent();
        this.#content.style.visibility = "visible";
        this.#content.style.opacity = "1";
        this.#content.style.transform = "scale(1)";
        this.#focusInitial();
      });
    }

    #closePopover() {
      this.#teardownDocumentListeners();
      if (this.#rafId !== null) {
        cancelAnimationFrame(this.#rafId);
        this.#rafId = null;
      }
      this.#content.dataset.state = "closed";
      this.#portal.setAttribute("data-state", "closed");
      this.#content.style.opacity = "0";
      this.#content.style.transform = "scale(0.96)";
      this.#content.style.visibility = "visible";
      setTimeout(() => {
        if (!this.#open) {
          this.#portal.hidden = true;
          this.#content.style.visibility = "hidden";
          this.#restoreContent();
          this.#resizeObserver?.unobserve(this.#content);
        }
      }, 160);
      if (this.#modal) {
        this.#content.removeAttribute("aria-modal");
      }
      if (this.#lastFocused && typeof this.#lastFocused.focus === "function") {
        this.#lastFocused.focus({ preventScroll: true });
      } else if (this.#trigger) {
        this.#trigger.focus({ preventScroll: true });
      }
    }

    #applyModalState() {
      this.#content.setAttribute("role", "dialog");
      this.#content.setAttribute("aria-modal", this.#modal ? "true" : "false");
      if (this.#modal) {
        this.#content.dataset.modal = "true";
      } else {
        delete this.#content.dataset.modal;
      }
    }

    #attachDocumentListeners() {
      document.addEventListener("keydown", this.#boundDocumentKeydown, true);
      document.addEventListener("focusin", this.#boundDocumentFocusIn, true);
      document.addEventListener("pointerdown", this.#boundDocumentPointerDown, true);
      window.addEventListener("resize", this.#boundWindowResize);
      window.addEventListener("scroll", this.#boundWindowScroll, true);
    }

    #teardownDocumentListeners() {
      document.removeEventListener("keydown", this.#boundDocumentKeydown, true);
      document.removeEventListener("focusin", this.#boundDocumentFocusIn, true);
      document.removeEventListener("pointerdown", this.#boundDocumentPointerDown, true);
      window.removeEventListener("resize", this.#boundWindowResize);
      window.removeEventListener("scroll", this.#boundWindowScroll, true);
    }

    #moveContentToPortal() {
      const nodes = this.#contentNodes;
      if (!nodes.length) return;
      for (const node of nodes) {
        if (node === this.#contentPlaceholder) continue;
        if (node instanceof HTMLElement || node instanceof Text || node instanceof Comment) {
          this.#content.appendChild(node);
        }
      }
    }

    #restoreContent() {
      if (!this.#contentPlaceholder || !this.#contentPlaceholder.parentNode) return;
      const parent = this.#contentPlaceholder.parentNode;
      for (const node of this.#contentNodes) {
        if (node instanceof Node && this.#content.contains(node)) {
          parent.insertBefore(node, this.#contentPlaceholder);
        }
      }
    }

    #focusInitial() {
      const focusables = getFocusable(this.#content);
      if (focusables.length) {
        focusables[0].focus({ preventScroll: true });
        return;
      }
      this.#content.focus({ preventScroll: true });
    }

    #handleTriggerClick(event) {
      if (event instanceof MouseEvent && event.button !== 0) return;
      event.preventDefault();
      this.toggle();
    }

    #handleTriggerKeydown(event) {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!this.#open) {
          this.show();
        }
      }
    }

    #handleDocumentKeydown(event) {
      if (!this.#open) return;
      if (event.key === "Escape" && this.#closeOnEscape) {
        const target = event.target;
        if (target instanceof Node && (this.#content.contains(target) || this.contains(target))) {
          event.stopPropagation();
        }
        this.hide();
      }
      if (event.key === "Tab" && this.#modal) {
        this.#cycleFocus(event);
      }
    }

    #handleContentKeydown(event) {
      if (!this.#modal && event.key === "Tab") {
        this.#cycleFocus(event);
      }
    }

    #cycleFocus(event) {
      if (!this.#open) return;
      const focusables = getFocusable(this.#content);
      if (!focusables.length) {
        event.preventDefault();
        this.#content.focus({ preventScroll: true });
        return;
      }
      const active = document.activeElement;
      const currentIndex = focusables.findIndex((element) => element === active);
      const direction = event.shiftKey ? -1 : 1;
      let nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = focusables.length - 1;
      if (nextIndex >= focusables.length) nextIndex = 0;
      event.preventDefault();
      focusables[nextIndex].focus({ preventScroll: true });
    }

    #handleDocumentFocusIn(event) {
      if (!this.#open) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (this.#content.contains(target)) return;
      if (this.#modal && this.#closeOnInteractOutside) {
        if (!this.#content.contains(target)) {
          this.#content.focus({ preventScroll: true });
        }
        return;
      }
      if (
        this.#closeOnInteractOutside &&
        !(this.contains(target) || this.shadowRoot?.contains(target))
      ) {
        this.hide();
      }
    }

    #handleDocumentPointerDown(event) {
      if (!this.#open || !this.#closeOnInteractOutside) return;
      const target = event.target;
      if (target instanceof Node && (this.#content.contains(target) || this.contains(target))) {
        return;
      }
      this.hide();
    }

    #positionContent() {
      const anchor = this.#anchor ?? this.#trigger;
      if (!anchor) return;
      const triggerRect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      this.style.setProperty("--wc-popover-trigger-width", `${triggerRect.width}px`);
      this.style.setProperty("--wc-popover-trigger-height", `${triggerRect.height}px`);

      const contentRect = this.#content.getBoundingClientRect();
      const width = contentRect.width;
      const height = contentRect.height;

      const padding = this.#collisionPadding;
      this.style.setProperty("--wc-popover-collision-padding", `${padding}px`);

      const computeCoords = (side, align) => {
        let top = 0;
        let left = 0;
        if (side === "top") {
          top = triggerRect.top - height - this.#sideOffset;
        } else if (side === "bottom") {
          top = triggerRect.bottom + this.#sideOffset;
        } else {
          top = triggerRect.top + triggerRect.height / 2 - height / 2;
        }

        if (side === "left") {
          left = triggerRect.left - width - this.#sideOffset;
        } else if (side === "right") {
          left = triggerRect.right + this.#sideOffset;
        } else {
          left = triggerRect.left + triggerRect.width / 2 - width / 2;
        }

        if (side === "top" || side === "bottom") {
          if (align === "start") {
            left = triggerRect.left;
          } else if (align === "end") {
            left = triggerRect.right - width;
          }
          left += this.#alignOffset;
        } else {
          if (align === "start") {
            top = triggerRect.top;
          } else if (align === "end") {
            top = triggerRect.bottom - height;
          }
          top += this.#alignOffset;
        }

        return { top, left };
      };

      const fitsWithinViewport = (coords) => {
        return (
          coords.top >= padding &&
          coords.left >= padding &&
          coords.top + height <= viewportHeight - padding &&
          coords.left + width <= viewportWidth - padding
        );
      };

      let side = this.#side;
      let align = this.#align;
      let coords = computeCoords(side, align);

      if (this.#avoidCollisions && !fitsWithinViewport(coords)) {
        const oppositeSide = this.#oppositeSide(side);
        const flipped = computeCoords(oppositeSide, align);
        if (fitsWithinViewport(flipped)) {
          side = oppositeSide;
          coords = flipped;
        }
      }

      coords.top = Math.max(padding, Math.min(coords.top, viewportHeight - padding - height));
      coords.left = Math.max(padding, Math.min(coords.left, viewportWidth - padding - width));

      this.#content.style.top = `${Math.round(coords.top)}px`;
      this.#content.style.left = `${Math.round(coords.left)}px`;
      this.#content.dataset.side = side;
      this.#content.dataset.align = align;
      this.#portal.dataset.side = side;
      this.#portal.dataset.align = align;
      this.#portal.dataset.state = "open";

      const availableWidth = side === "left"
        ? triggerRect.left - padding
        : viewportWidth - triggerRect.right - padding;
      const availableHeight = side === "top"
        ? triggerRect.top - padding
        : viewportHeight - triggerRect.bottom - padding;
      this.style.setProperty(
        "--wc-popover-content-available-width",
        `${Math.max(0, availableWidth)}px`,
      );
      this.style.setProperty(
        "--wc-popover-content-available-height",
        `${Math.max(0, availableHeight)}px`,
      );

      const originX = (() => {
        if (side === "left") return "100%";
        if (side === "right") return "0%";
        if (align === "start") return "0%";
        if (align === "end") return "100%";
        return "50%";
      })();
      const originY = (() => {
        if (side === "top") return "100%";
        if (side === "bottom") return "0%";
        if (align === "start") return "0%";
        if (align === "end") return "100%";
        return "50%";
      })();
      this.style.setProperty("--wc-popover-transform-origin", `${originX} ${originY}`);
      this.#content.style.transformOrigin = `var(--wc-popover-transform-origin)`;

      this.#positionArrow(side, align, triggerRect, coords, { width, height });
    }

    /**
     * @param {"top" | "right" | "bottom" | "left"} side
     */
    #oppositeSide(side) {
      switch (side) {
        case "top":
          return "bottom";
        case "bottom":
          return "top";
        case "left":
          return "right";
        case "right":
        default:
          return "left";
      }
    }

    /**
     * @param {"top" | "right" | "bottom" | "left"} side
     * @param {"start" | "center" | "end"} align
     * @param {DOMRect} triggerRect
     * @param {{ top: number; left: number }} coords
     * @param {{ width: number; height: number }} size
     */
    #positionArrow(side, align, triggerRect, coords, size) {
      if (this.#hideArrow) {
        this.#arrow.style.display = "none";
        return;
      }
      this.#arrow.style.display = "block";
      const arrowSize = parseNumber(
        getComputedStyle(this.#content).getPropertyValue("--wc-popover-arrow-size"),
        12,
      );
      const arrowOffset = parseNumber(
        getComputedStyle(this.#content).getPropertyValue("--wc-popover-arrow-offset"),
        12,
      );
      this.#arrow.style.top = "";
      this.#arrow.style.bottom = "";
      this.#arrow.style.left = "";
      this.#arrow.style.right = "";

      if (side === "top") {
        this.#arrow.style.bottom = `${-arrowSize / 2}px`;
      } else if (side === "bottom") {
        this.#arrow.style.top = `${-arrowSize / 2}px`;
      } else if (side === "left") {
        this.#arrow.style.right = `${-arrowSize / 2}px`;
      } else {
        this.#arrow.style.left = `${-arrowSize / 2}px`;
      }

      if (side === "top" || side === "bottom") {
        const triggerCenter = triggerRect.left + triggerRect.width / 2;
        const contentLeft = coords.left;
        let arrowLeft = triggerCenter - contentLeft - arrowSize / 2;
        if (align === "start") {
          arrowLeft = arrowOffset;
        } else if (align === "end") {
          arrowLeft = size.width - arrowOffset - arrowSize;
        }
        arrowLeft = Math.max(arrowOffset, Math.min(size.width - arrowOffset - arrowSize, arrowLeft));
        this.#arrow.style.left = `${arrowLeft}px`;
      } else {
        const triggerMiddle = triggerRect.top + triggerRect.height / 2;
        const contentTop = coords.top;
        let arrowTop = triggerMiddle - contentTop - arrowSize / 2;
        if (align === "start") {
          arrowTop = arrowOffset;
        } else if (align === "end") {
          arrowTop = size.height - arrowOffset - arrowSize;
        }
        arrowTop = Math.max(arrowOffset, Math.min(size.height - arrowOffset - arrowSize, arrowTop));
        this.#arrow.style.top = `${arrowTop}px`;
      }
    }

    #applyArrowVisibility() {
      if (this.#hideArrow) {
        this.#arrow.style.display = "none";
      } else {
        this.#arrow.style.display = "block";
      }
    }

    #attachAfterRenderPositioning() {
      if (this.#rafId !== null) {
        cancelAnimationFrame(this.#rafId);
      }
      this.#rafId = requestAnimationFrame(() => {
        this.#rafId = null;
        if (this.#open) {
          this.#positionContent();
        }
      });
    }
  }

  if (!customElements.get("wc-popover")) {
    customElements.define("wc-popover", WcPopover);
  }
})();

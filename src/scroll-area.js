/**
 * @file scroll-area.js
 * @version 1.0.0
 *
 * Custom scroll area web component inspired by the Radix UI Scroll Area anatomy.
 * Provides overlay scrollbars with custom styling hooks while preserving native scrolling.
 *
 * Usage:
 * <wc-scroll-area style="inline-size: 240px; block-size: 260px;">
 *   <div style="display: grid; gap: 0.75rem;">
 *     <strong>Tags</strong>
 *     <span>v1.2.0-beta.50</span>
 *     <span>v1.2.0-beta.49</span>
 *     <!-- … -->
 *   </div>
 * </wc-scroll-area>
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
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * @typedef {"negative" | "positive" | "reverse"} RtlScrollBehavior
   */

  /** @type {RtlScrollBehavior | null} */
  let rtlScrollBehavior = null;

  /**
   * Detects browser specific RTL scrollLeft behavior.
   *
   * @returns {RtlScrollBehavior}
   */
  const getRtlScrollBehavior = () => {
    if (rtlScrollBehavior) {
      return rtlScrollBehavior;
    }

    if (typeof document === "undefined") {
      rtlScrollBehavior = "negative";
      return rtlScrollBehavior;
    }

    const container = document.createElement("div");
    const content = document.createElement("div");

    container.dir = "rtl";
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.width = "4px";
    container.style.height = "1px";
    container.style.overflow = "scroll";
    container.style.visibility = "hidden";

    content.style.width = "8px";
    content.style.height = "1px";

    container.append(content);
    (document.body ?? document.documentElement).append(container);

    container.scrollLeft = -1;
    if (container.scrollLeft < 0) {
      rtlScrollBehavior = "negative";
    } else {
      container.scrollLeft = 1;
      rtlScrollBehavior = container.scrollLeft === 0 ? "reverse" : "positive";
    }

    container.remove();

    return rtlScrollBehavior;
  };

  const VALID_TYPES = new Set(["hover", "scroll", "always"]);
  const DEFAULT_SCROLL_HIDE_DELAY = 600;
  const DEFAULT_MIN_THUMB_SIZE = 24;

  if (customElements.get("wc-scroll-area")) {
    return;
  }

  class WcScrollArea extends HTMLElement {
    static get observedAttributes() {
      return ["type", "scroll-hide-delay", "dir"];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #viewport;
    /** @type {HTMLDivElement} */
    #content;
    /** @type {HTMLDivElement} */
    #verticalScrollbar;
    /** @type {HTMLDivElement} */
    #horizontalScrollbar;
    /** @type {HTMLDivElement} */
    #corner;
    /** @type {HTMLDivElement} */
    #verticalThumb;
    /** @type {HTMLDivElement} */
    #horizontalThumb;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {ResizeObserver | null} */
    #resizeObserver = null;
    /** @type {Set<Element>} */
    #observedElements = new Set();
    /** @type {number} */
    #scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY;
    /** @type {number | null} */
    #hideTimer = null;
    /** @type {number} */
    #updateRaf = 0;
    /** @type {number} */
    #scrollRaf = 0;
    /** @type {boolean} */
    #hasVertical = false;
    /** @type {boolean} */
    #hasHorizontal = false;
    /** @type {(event: Event) => void} */
    #boundHandleScroll;
    /** @type {(event: PointerEvent) => void} */
    #boundPointerEnter;
    /** @type {(event: PointerEvent) => void} */
    #boundPointerLeave;
    /** @type {() => void} */
    #boundSlotChange;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            --scroll-area-background: #ffffff;
            --scroll-area-radius: 0.75rem;
            --scroll-area-border: none;
            --scroll-area-scrollbar-girth: 12px;
            --scroll-area-scrollbar-padding: 3px;
            --scroll-area-scrollbar-background: rgba(24, 24, 27, 0.08);
            --scroll-area-scrollbar-background-hover: rgba(24, 24, 27, 0.16);
            --scroll-area-thumb-background: rgba(82, 82, 91, 0.45);
            --scroll-area-thumb-background-hover: rgba(82, 82, 91, 0.65);
            --scroll-area-thumb-radius: 999px;
            --scroll-area-thumb-min-size: ${DEFAULT_MIN_THUMB_SIZE}px;
            --scroll-area-scrollbar-transition-duration: 160ms;
            display: inline-block;
            position: relative;
            color: inherit;
            inline-size: 100%;
            block-size: auto;
            box-sizing: border-box;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="viewport"] {
            position: relative;
            inline-size: 100%;
            block-size: 100%;
            overflow: auto;
            background: var(--scroll-area-background);
            border: var(--scroll-area-border);
            border-radius: var(--scroll-area-radius);
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          [part="viewport"]::-webkit-scrollbar {
            display: none;
          }

          [part="content"] {
            min-inline-size: 100%;
            box-sizing: border-box;
          }

          [part="scrollbar"],
          [part="corner"] {
            position: absolute;
            z-index: 1;
            pointer-events: auto;
          }

          [part="scrollbar"] {
            display: block;
            box-sizing: border-box;
            padding: var(--scroll-area-scrollbar-padding);
            border-radius: calc(var(--scroll-area-scrollbar-girth) / 2);
            background: var(--scroll-area-scrollbar-background);
            transition: opacity var(--scroll-area-scrollbar-transition-duration) ease,
              background-color 160ms ease;
            opacity: 1;
            touch-action: none;
            user-select: none;
          }

          [part="scrollbar"]:hover {
            background: var(--scroll-area-scrollbar-background-hover);
          }

          [part="scrollbar"][data-orientation="vertical"] {
            inset-block-start: 0;
            inset-block-end: 0;
            inset-inline-end: 0;
            inline-size: var(--scroll-area-scrollbar-girth);
          }

          :host([dir="rtl"]) [part="scrollbar"][data-orientation="vertical"] {
            inset-inline-end: auto;
            inset-inline-start: 0;
          }

          [part="scrollbar"][data-orientation="horizontal"] {
            inset-inline-start: 0;
            inset-inline-end: 0;
            inset-block-end: 0;
            block-size: var(--scroll-area-scrollbar-girth);
          }

          :host([data-has-vertical][data-has-horizontal]) [part="scrollbar"][data-orientation="vertical"] {
            inset-block-end: var(--scroll-area-scrollbar-girth);
          }

          :host([data-has-vertical][data-has-horizontal]) [part="scrollbar"][data-orientation="horizontal"] {
            inset-inline-end: var(--scroll-area-scrollbar-girth);
          }

          [part="scrollbar"][hidden] {
            display: none;
          }

          [part="thumb"] {
            position: absolute;
            inset-inline-start: var(--scroll-area-scrollbar-padding);
            inset-block-start: var(--scroll-area-scrollbar-padding);
            inset-inline-end: var(--scroll-area-scrollbar-padding);
            inset-block-end: auto;
            border-radius: var(--scroll-area-thumb-radius);
            background: var(--scroll-area-thumb-background);
            box-sizing: border-box;
            pointer-events: auto;
            transition: background-color 160ms ease;
          }

          [part="scrollbar"][data-orientation="vertical"] [part="thumb"] {
            inline-size: calc(100% - (var(--scroll-area-scrollbar-padding) * 2));
            min-block-size: var(--scroll-area-thumb-min-size);
          }

          [part="scrollbar"][data-orientation="horizontal"] [part="thumb"] {
            block-size: calc(100% - (var(--scroll-area-scrollbar-padding) * 2));
            min-inline-size: var(--scroll-area-thumb-min-size);
          }

          [part="thumb"][data-active="true"],
          [part="scrollbar"]:hover [part="thumb"] {
            background: var(--scroll-area-thumb-background-hover);
          }

          [part="corner"] {
            inset-inline-end: 0;
            inset-block-end: 0;
            inline-size: var(--scroll-area-scrollbar-girth);
            block-size: var(--scroll-area-scrollbar-girth);
            background: var(--scroll-area-scrollbar-background);
            border-bottom-right-radius: calc(var(--scroll-area-scrollbar-girth) / 2);
            border-bottom-left-radius: calc(var(--scroll-area-scrollbar-girth) / 2);
            opacity: 1;
            transition: opacity var(--scroll-area-scrollbar-transition-duration) ease;
            pointer-events: none;
          }

          :host([dir="rtl"]) [part="corner"] {
            inset-inline-end: auto;
            inset-inline-start: 0;
          }

          [part="corner"][hidden] {
            display: none;
          }

          :host(:not([data-scrollbar-type="always"])) [part="scrollbar"],
          :host(:not([data-scrollbar-type="always"])) [part="corner"] {
            opacity: 0;
            pointer-events: none;
          }

          :host([data-scrollbar-type="hover"]:hover) [part="scrollbar"],
          :host([data-scrollbar-type="hover"]:hover) [part="corner"],
          :host([data-scrollbar-visibility="visible"]) [part="scrollbar"],
          :host([data-scrollbar-visibility="visible"]) [part="corner"] {
            opacity: 1;
            pointer-events: auto;
          }

          :host([data-scrollbar-type="scroll"]) [part="scrollbar"],
          :host([data-scrollbar-type="scroll"]) [part="corner"] {
            transition-duration: var(--scroll-area-scrollbar-transition-duration);
          }

          [part="viewport"]:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.45);
            outline-offset: 3px;
          }
        </style>
        <div part="viewport" tabindex="0" role="group" aria-label="Scroll area viewport">
          <div part="content">
            <slot></slot>
          </div>
        </div>
        <div part="scrollbar" data-orientation="vertical" aria-hidden="true">
          <div part="thumb" data-active="false"></div>
        </div>
        <div part="scrollbar" data-orientation="horizontal" aria-hidden="true">
          <div part="thumb" data-active="false"></div>
        </div>
        <div part="corner" aria-hidden="true"></div>
      `;

      this.#viewport = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="viewport"]'));
      this.#content = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="content"]'));
      this.#verticalScrollbar = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="scrollbar"][data-orientation="vertical"]')
      );
      this.#horizontalScrollbar = /** @type {HTMLDivElement} */ (
        this.#root.querySelector('[part="scrollbar"][data-orientation="horizontal"]')
      );
      this.#corner = /** @type {HTMLDivElement} */ (this.#root.querySelector('[part="corner"]'));
      this.#verticalThumb = /** @type {HTMLDivElement} */ (
        this.#verticalScrollbar.querySelector('[part="thumb"]')
      );
      this.#horizontalThumb = /** @type {HTMLDivElement} */ (
        this.#horizontalScrollbar.querySelector('[part="thumb"]')
      );
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));

      this.#boundHandleScroll = this.#handleScroll.bind(this);
      this.#boundSlotChange = this.#handleSlotChange.bind(this);
      this.#boundPointerLeave = this.#handlePointerLeave.bind(this);
      this.#boundPointerEnter = this.#handlePointerEnter.bind(this);
    }

    connectedCallback() {
      upgradeProperty(this, "type");
      upgradeProperty(this, "scrollHideDelay");

      this.dataset.scrollbarType = this.type;
      this.dataset.scrollbarVisibility = "hidden";

      this.#viewport.addEventListener("scroll", this.#boundHandleScroll, { passive: true });
      this.addEventListener("pointerenter", this.#boundPointerEnter);
      this.addEventListener("pointerleave", this.#boundPointerLeave);
      this.#slot.addEventListener("slotchange", this.#boundSlotChange);

      this.#verticalThumb.addEventListener("pointerdown", (event) => {
        this.#startThumbDrag("vertical", event);
      });
      this.#horizontalThumb.addEventListener("pointerdown", (event) => {
        this.#startThumbDrag("horizontal", event);
      });

      if ("ResizeObserver" in window) {
        this.#resizeObserver = new ResizeObserver(() => {
          this.#scheduleUpdate();
        });
        this.#resizeObserver.observe(this.#viewport);
        this.#resizeObserver.observe(this.#content);
      }

      this.#handleSlotChange();
      this.#scheduleUpdate();
    }

    disconnectedCallback() {
      this.#viewport.removeEventListener("scroll", this.#boundHandleScroll);
      this.removeEventListener("pointerenter", this.#boundPointerEnter);
      this.removeEventListener("pointerleave", this.#boundPointerLeave);
      this.#slot.removeEventListener("slotchange", this.#boundSlotChange);

      if (this.#resizeObserver) {
        this.#resizeObserver.unobserve(this.#viewport);
        this.#resizeObserver.unobserve(this.#content);
        for (const element of this.#observedElements) {
          this.#resizeObserver.unobserve(element);
        }
        this.#observedElements.clear();
        this.#resizeObserver.disconnect();
        this.#resizeObserver = null;
      }

      if (this.#hideTimer !== null) {
        window.clearTimeout(this.#hideTimer);
        this.#hideTimer = null;
      }

      if (this.#updateRaf) {
        window.cancelAnimationFrame(this.#updateRaf);
        this.#updateRaf = 0;
      }

      if (this.#scrollRaf) {
        window.cancelAnimationFrame(this.#scrollRaf);
        this.#scrollRaf = 0;
      }
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      if (name === "type") {
        const normalized = newValue && VALID_TYPES.has(newValue) ? newValue : "hover";
        this.dataset.scrollbarType = normalized;
        if (newValue && !VALID_TYPES.has(newValue)) {
          this.removeAttribute("type");
        }
        if (normalized === "always") {
          this.dataset.scrollbarVisibility = "visible";
        } else if (this.dataset.scrollbarVisibility !== "visible") {
          this.dataset.scrollbarVisibility = "hidden";
        }
      }

      if (name === "scroll-hide-delay") {
        if (newValue === null || newValue === "") {
          this.#scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY;
        } else {
          const parsed = Number.parseInt(newValue, 10);
          if (Number.isFinite(parsed) && parsed >= 0) {
            this.#scrollHideDelay = parsed;
          } else {
            this.#scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY;
            this.removeAttribute("scroll-hide-delay");
          }
        }
      }

      if (name === "dir") {
        this.#scheduleUpdate();
      }
    }

    /**
     * Scrollbar visibility mode. Accepts "hover", "scroll", or "always".
     *
     * @returns {"hover" | "scroll" | "always"}
     */
    get type() {
      const attr = this.getAttribute("type");
      return attr && VALID_TYPES.has(attr) ? /** @type {"hover" | "scroll" | "always"} */ (attr) : "hover";
    }

    /**
     * @param {"hover" | "scroll" | "always"} value
     */
    set type(value) {
      if (!VALID_TYPES.has(value)) {
        this.removeAttribute("type");
        return;
      }
      this.setAttribute("type", value);
    }

    /**
     * Delay in milliseconds before scrollbars fade after interaction.
     *
     * @returns {number}
     */
    get scrollHideDelay() {
      return this.#scrollHideDelay;
    }

    /**
     * @param {number} value
     */
    set scrollHideDelay(value) {
      if (!Number.isFinite(value) || value < 0) {
        this.removeAttribute("scroll-hide-delay");
        return;
      }
      this.setAttribute("scroll-hide-delay", String(Math.round(value)));
    }

    /**
     * @returns {"ltr" | "rtl"}
     */
    #getDirection() {
      const attr = this.getAttribute("dir") || this.closest("[dir]")?.getAttribute("dir");
      if (attr === "rtl") {
        return "rtl";
      }
      if (attr === "ltr") {
        return "ltr";
      }
      const documentDir = this.ownerDocument?.dir;
      return documentDir === "rtl" ? "rtl" : "ltr";
    }

    #handlePointerEnter() {
      if (this.type === "scroll") {
        this.#showScrollbars();
      }
    }

    #handlePointerLeave() {
      if (this.type === "always") {
        return;
      }
      this.#scheduleHide();
    }

    /**
     * @param {"vertical" | "horizontal"} orientation
     * @param {PointerEvent} event
     */
    #startThumbDrag(orientation, event) {
      if ((orientation === "vertical" && !this.#hasVertical) || (orientation === "horizontal" && !this.#hasHorizontal)) {
        return;
      }

      const thumb = orientation === "vertical" ? this.#verticalThumb : this.#horizontalThumb;
      const scrollbar = orientation === "vertical" ? this.#verticalScrollbar : this.#horizontalScrollbar;

      if (thumb.hasPointerCapture(event.pointerId)) {
        return;
      }

      event.preventDefault();

      const startPointer = orientation === "vertical" ? event.clientY : event.clientX;
      const startScroll =
        orientation === "vertical"
          ? this.#viewport.scrollTop
          : this.#getNormalizedScrollLeft();
      const maxScroll =
        orientation === "vertical"
          ? Math.max(this.#viewport.scrollHeight - this.#viewport.clientHeight, 0)
          : Math.max(this.#viewport.scrollWidth - this.#viewport.clientWidth, 0);

      if (maxScroll === 0) {
        return;
      }

      const { trackSize } = this.#measureScrollbar(scrollbar, orientation);
      const thumbSize =
        orientation === "vertical"
          ? this.#verticalThumb.offsetHeight
          : this.#horizontalThumb.offsetWidth;
      const maxThumbOffset = Math.max(trackSize - thumbSize, 0);

      if (trackSize <= 0) {
        return;
      }

      this.#showScrollbars();

      thumb.setPointerCapture(event.pointerId);
      thumb.dataset.active = "true";

      const handlePointerMove = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId) {
          return;
        }
        moveEvent.preventDefault();

        const currentPointer = orientation === "vertical" ? moveEvent.clientY : moveEvent.clientX;
        const delta = currentPointer - startPointer;
        const scrollDelta = maxThumbOffset === 0 ? 0 : (maxScroll / maxThumbOffset) * delta;
        const nextScroll = clamp(startScroll + scrollDelta, 0, maxScroll);

        if (orientation === "vertical") {
          this.#viewport.scrollTop = nextScroll;
        } else {
          this.#setNormalizedScrollLeft(nextScroll);
        }
      };

      const cleanup = (endEvent) => {
        if (endEvent.pointerId !== event.pointerId) {
          return;
        }

        thumb.dataset.active = "false";
        thumb.releasePointerCapture(event.pointerId);

        this.ownerDocument?.removeEventListener("pointermove", handlePointerMove);
        this.ownerDocument?.removeEventListener("pointerup", cleanup);
        this.ownerDocument?.removeEventListener("pointercancel", cleanup);

        this.#scheduleUpdate();
        this.#scheduleHide();
      };

      this.ownerDocument?.addEventListener("pointermove", handlePointerMove);
      this.ownerDocument?.addEventListener("pointerup", cleanup);
      this.ownerDocument?.addEventListener("pointercancel", cleanup);
    }

    #handleScroll() {
      this.#showScrollbars();
      this.#scheduleThumbSync();
    }

    #handleSlotChange() {
      if (!this.#resizeObserver) {
        this.#scheduleUpdate();
        return;
      }

      const assignedElements = this.#slot.assignedElements({ flatten: true });
      const nextObserved = new Set(assignedElements);

      for (const element of this.#observedElements) {
        if (!nextObserved.has(element)) {
          this.#resizeObserver.unobserve(element);
          this.#observedElements.delete(element);
        }
      }

      for (const element of assignedElements) {
        if (!this.#observedElements.has(element)) {
          this.#resizeObserver.observe(element);
          this.#observedElements.add(element);
        }
      }

      this.#scheduleUpdate();
    }

    #scheduleUpdate() {
      if (this.#updateRaf) {
        return;
      }
      this.#updateRaf = window.requestAnimationFrame(() => {
        this.#updateRaf = 0;
        this.#updateMetrics();
      });
    }

    #scheduleThumbSync() {
      if (this.#scrollRaf) {
        return;
      }
      this.#scrollRaf = window.requestAnimationFrame(() => {
        this.#scrollRaf = 0;
        this.#syncThumbs();
      });
    }

    #updateMetrics() {
      const viewport = this.#viewport;
      const verticalNeeded = viewport.scrollHeight > viewport.clientHeight + 0.5;
      const horizontalNeeded = viewport.scrollWidth > viewport.clientWidth + 0.5;

      this.#hasVertical = verticalNeeded;
      this.#hasHorizontal = horizontalNeeded;

      this.toggleAttribute("data-has-vertical", verticalNeeded);
      this.toggleAttribute("data-has-horizontal", horizontalNeeded);

      this.#verticalScrollbar.hidden = !verticalNeeded;
      this.#verticalScrollbar.dataset.state = verticalNeeded ? "visible" : "hidden";
      this.#horizontalScrollbar.hidden = !horizontalNeeded;
      this.#horizontalScrollbar.dataset.state = horizontalNeeded ? "visible" : "hidden";

      const cornerVisible = verticalNeeded && horizontalNeeded;
      this.#corner.hidden = !cornerVisible;
      this.#corner.dataset.state = cornerVisible ? "visible" : "hidden";

      if (!verticalNeeded && !horizontalNeeded) {
        this.dataset.scrollbarVisibility = this.type === "always" ? "visible" : "hidden";
      }

      this.#syncThumbs();
    }

    #syncThumbs() {
      const viewport = this.#viewport;
      const hostStyle = getComputedStyle(this);
      const minThumbSize = Number.parseFloat(hostStyle.getPropertyValue("--scroll-area-thumb-min-size")) || DEFAULT_MIN_THUMB_SIZE;

      if (this.#hasVertical && !this.#verticalScrollbar.hidden) {
        const { trackSize, paddingStart } = this.#measureScrollbar(this.#verticalScrollbar, "vertical");
        const maxScroll = Math.max(viewport.scrollHeight - viewport.clientHeight, 0);
        const thumbSize = Math.max((viewport.clientHeight / viewport.scrollHeight) * trackSize, minThumbSize);
        const maxThumbOffset = Math.max(trackSize - thumbSize, 0);
        const scrollOffset = clamp(viewport.scrollTop, 0, maxScroll);
        const thumbOffset = paddingStart + (maxScroll === 0 ? 0 : (scrollOffset / maxScroll) * maxThumbOffset);

        this.#verticalThumb.style.height = `${thumbSize}px`;
        this.#verticalThumb.style.top = `${thumbOffset}px`;
      }

      if (this.#hasHorizontal && !this.#horizontalScrollbar.hidden) {
        const { trackSize, paddingStart } = this.#measureScrollbar(this.#horizontalScrollbar, "horizontal");
        const maxScroll = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
        const thumbSize = Math.max((viewport.clientWidth / viewport.scrollWidth) * trackSize, minThumbSize);
        const maxThumbOffset = Math.max(trackSize - thumbSize, 0);
        const scrollOffset = this.#getNormalizedScrollLeft();
        const thumbOffset = paddingStart + (maxScroll === 0 ? 0 : (scrollOffset / maxScroll) * maxThumbOffset);

        this.#horizontalThumb.style.width = `${thumbSize}px`;
        this.#horizontalThumb.style.left = `${thumbOffset}px`;
      }
    }

    /**
     * @param {HTMLElement} scrollbar
     * @param {"vertical" | "horizontal"} orientation
     */
    #measureScrollbar(scrollbar, orientation) {
      const computed = getComputedStyle(scrollbar);
      const paddingStart = Number.parseFloat(
        orientation === "vertical" ? computed.paddingTop : computed.paddingLeft
      ) || 0;
      const paddingEnd = Number.parseFloat(
        orientation === "vertical" ? computed.paddingBottom : computed.paddingRight
      ) || 0;
      const trackSize =
        (orientation === "vertical" ? scrollbar.clientHeight : scrollbar.clientWidth) -
        paddingStart -
        paddingEnd;

      return { trackSize, paddingStart };
    }

    #showScrollbars() {
      const type = this.type;
      if (type === "always") {
        this.dataset.scrollbarVisibility = "visible";
        return;
      }

      this.dataset.scrollbarVisibility = "visible";

      if (this.#hideTimer !== null) {
        window.clearTimeout(this.#hideTimer);
        this.#hideTimer = null;
      }

      this.#scheduleHide();
    }

    #scheduleHide() {
      const type = this.type;
      if (type === "always") {
        this.dataset.scrollbarVisibility = "visible";
        return;
      }

      if (this.#hideTimer !== null) {
        window.clearTimeout(this.#hideTimer);
      }

      this.#hideTimer = window.setTimeout(() => {
        if (this.type === "always") {
          this.dataset.scrollbarVisibility = "visible";
          return;
        }
        this.dataset.scrollbarVisibility = "hidden";
        this.#hideTimer = null;
      }, this.#scrollHideDelay);
    }

    #getNormalizedScrollLeft() {
      const viewport = this.#viewport;
      const max = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
      let scrollLeft = viewport.scrollLeft;

      if (this.#getDirection() === "rtl") {
        const behavior = getRtlScrollBehavior();
        if (behavior === "negative") {
          scrollLeft = -scrollLeft;
        } else if (behavior === "positive") {
          scrollLeft = max - scrollLeft;
        } else {
          scrollLeft = scrollLeft;
        }
      }

      return clamp(scrollLeft, 0, max);
    }

    #setNormalizedScrollLeft(value) {
      const viewport = this.#viewport;
      const max = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
      const target = clamp(value, 0, max);

      if (this.#getDirection() === "rtl") {
        const behavior = getRtlScrollBehavior();
        if (behavior === "negative") {
          viewport.scrollLeft = -target;
        } else if (behavior === "positive") {
          viewport.scrollLeft = max - target;
        } else {
          viewport.scrollLeft = target;
        }
      } else {
        viewport.scrollLeft = target;
      }
    }
  }

  customElements.define("wc-scroll-area", WcScrollArea);
})();


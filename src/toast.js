/**
 * @file toast.js
 * @version 1.0.0
 *
 * Accessible toast notification web component inspired by Radix UI Toast.
 * It provides automatic dismissal, pause on user attention, keyboard & swipe
 * interactions, and styling hooks through CSS custom properties and parts.
 *
 * Usage:
 * ```html
 * <wc-toast id="calendar-toast" title="Scheduled: Catch up" action-label="Undo">
 *   <time slot="description"></time>
 * </wc-toast>
 *
 * <script type="module" src="toast.js"></script>
 * <script type="module">
 *   const toast = document.getElementById("calendar-toast");
 *   document
 *     .getElementById("calendar-trigger")
 *     ?.addEventListener("click", () => {
 *       toast.show({ description: new Date().toString() });
 *     });
 * </script>
 * ```
 */

(() => {
  if (customElements.get("wc-toast")) {
    return;
  }

  const SWIPE_THRESHOLD = 80;
  const DEFAULT_DURATION = 5000;
  const DEFAULT_LABEL = "Notifications ({hotkey})";
  const DEFAULT_HOTKEY = "F8";

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
   * @param {number} fallback
   */
  const numberOr = (value, fallback) => {
    if (value === null || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  /**
   * @param {string} value
   */
  const normaliseHotkeys = (value) => {
    /**
     * @param {string} token
     */
    const normaliseToken = (token) => {
      const lower = token.toLowerCase();
      if (lower === "alt" || lower === "altkey") {
        return "alt";
      }
      if (lower === "control" || lower === "ctrl" || lower === "controlkey") {
        return "ctrl";
      }
      if (lower === "meta" || lower === "cmd" || lower === "win") {
        return "meta";
      }
      if (lower === "shift" || lower === "shiftkey") {
        return "shift";
      }
      return token;
    };

    return value
      .split(",")
      .map((combo) =>
        combo
          .trim()
          .split("+")
          .map((part) => normaliseToken(part.trim()))
          .filter(Boolean)
      )
      .filter((combo) => combo.length > 0);
  };

  class WcToast extends HTMLElement {
    static get observedAttributes() {
      return [
        "open",
        "duration",
        "title",
        "description",
        "action-label",
        "label",
        "hotkey",
        "type",
        "default-open",
      ];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #viewport;
    /** @type {HTMLDivElement} */
    #toast;
    /** @type {HTMLElement} */
    #titleSlotWrapper;
    /** @type {HTMLElement} */
    #descriptionSlotWrapper;
    /** @type {HTMLSlotElement} */
    #titleSlot;
    /** @type {HTMLSlotElement} */
    #descriptionSlot;
    /** @type {HTMLButtonElement} */
    #actionButton;
    /** @type {HTMLSlotElement} */
    #actionSlot;
    /** @type {HTMLButtonElement} */
    #closeButton;
    /** @type {boolean} */
    #open = false;
    /** @type {boolean} */
    #reflecting = false;
    /** @type {number} */
    #duration = DEFAULT_DURATION;
    /** @type {number} */
    #remaining = DEFAULT_DURATION;
    /** @type {number | null} */
    #timer = null;
    /** @type {number} */
    #timerStart = 0;
    /** @type {string[][]} */
    #hotkeys = [[DEFAULT_HOTKEY]];
    /** @type {boolean} */
    #paused = false;
    /** @type {boolean} */
    #swiping = false;
    /** @type {number} */
    #swipePointer = 0;
    /** @type {number} */
    #swipeStartX = 0;
    /** @type {"foreground" | "background"} */
    #type = "foreground";

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-toast-duration: ${DEFAULT_DURATION}ms;
            --wc-toast-background: #ffffff;
            --wc-toast-foreground: #0f172a;
            --wc-toast-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
            --wc-toast-border: 1px solid rgba(15, 23, 42, 0.08);
            --wc-toast-radius: 12px;
            --wc-toast-padding: 0.9rem 1rem;
            --wc-toast-gap: 0.65rem;
            --wc-toast-action-background: #dcfce7;
            --wc-toast-action-color: #166534;
            --wc-toast-close-color: rgba(15, 23, 42, 0.6);
            --wc-toast-z-index: 2147483647;
            --wc-toast-swipe-move-x: 0px;
            --wc-toast-swipe-move-y: 0px;
            --wc-toast-swipe-end-x: 100%;
            --wc-toast-swipe-end-y: 0px;
            display: block;
          }

          :host([hidden]) {
            display: none !important;
          }

          .viewport {
            position: fixed;
            bottom: 0;
            inset-inline-end: 0;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding: var(--wc-toast-viewport-padding, 1.25rem);
            width: min(390px, 100vw);
            max-width: 100vw;
            list-style: none;
            margin: 0;
            z-index: var(--wc-toast-z-index);
            outline: none;
            border: none;
            background: transparent;
          }

          .viewport:focus {
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.35);
            border-radius: 12px;
          }

          .toast {
            display: grid;
            grid-template-columns: auto max-content;
            grid-template-areas:
              "title action"
              "description action";
            gap: 0.4rem 0.9rem;
            padding: var(--wc-toast-padding);
            border-radius: var(--wc-toast-radius);
            background: var(--wc-toast-background);
            color: var(--wc-toast-foreground);
            box-shadow: var(--wc-toast-shadow);
            border: var(--wc-toast-border);
            transform: translate3d(0, 0, 0);
            opacity: 0;
            pointer-events: none;
            transition: opacity 150ms ease, transform 150ms ease;
          }

          .toast[data-state="open"] {
            opacity: 1;
            pointer-events: auto;
            animation: slide-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .toast[data-state="closing"] {
            opacity: 0;
            pointer-events: none;
            animation: fade-out 120ms ease forwards;
          }

          .toast[data-swipe="move"] {
            transform: translateX(var(--wc-toast-swipe-move-x))
              translateY(var(--wc-toast-swipe-move-y));
          }

          .toast[data-swipe="cancel"] {
            transform: translateX(0) translateY(0);
            transition: transform 200ms ease-out;
          }

          .toast[data-swipe="end"] {
            animation: swipe-out 120ms ease-out forwards;
          }

          .title {
            grid-area: title;
            font-size: 0.95rem;
            font-weight: 600;
            margin: 0;
          }

          .description {
            grid-area: description;
            font-size: 0.82rem;
            margin: 0;
            color: rgba(15, 23, 42, 0.75);
          }

          ::slotted([slot="title"]) {
            font: inherit;
            margin: 0;
          }

          ::slotted([slot="description"]) {
            font: inherit;
            margin: 0;
            color: inherit;
          }

          .action {
            grid-area: action;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            align-items: flex-end;
          }

          .action ::slotted(*) {
            display: inline-flex;
          }

          .action-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 0.3rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            background: var(--wc-toast-action-background);
            color: var(--wc-toast-action-color);
            border: 1px solid transparent;
            cursor: pointer;
          }

          .action-button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.35);
          }

          .close-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 999px;
            padding: 0.35rem;
            background: transparent;
            color: var(--wc-toast-close-color);
            cursor: pointer;
          }

          .close-button:hover {
            background: rgba(15, 23, 42, 0.05);
          }

          .close-button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
          }

          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes fade-out {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes swipe-out {
            from {
              transform: translateX(var(--wc-toast-swipe-end-x))
                translateY(var(--wc-toast-swipe-end-y));
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        </style>
        <div
          class="viewport"
          part="viewport"
          tabindex="-1"
          role="region"
          aria-live="assertive"
          aria-atomic="false"
        >
          <div
            class="toast"
            part="toast"
            data-state="closed"
            role="status"
            aria-live="assertive"
            aria-atomic="false"
          >
            <div class="title" part="title">
              <slot name="title"></slot>
            </div>
            <div class="description" part="description">
              <slot name="description"></slot>
            </div>
            <div class="action" part="actions">
              <slot name="action"></slot>
              <button class="action-button" part="action" type="button"></button>
              <button
                class="close-button"
                part="close"
                type="button"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      `;

      this.#viewport = /** @type {HTMLDivElement} */ (
        this.#root.querySelector(".viewport")
      );
      this.#viewport.setAttribute("hidden", "");
      this.#toast = /** @type {HTMLDivElement} */ (
        this.#root.querySelector(".toast")
      );
      this.#titleSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="title"]')
      );
      this.#descriptionSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="description"]')
      );
      this.#actionSlot = /** @type {HTMLSlotElement} */ (
        this.#root.querySelector('slot[name="action"]')
      );
      this.#actionButton = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector(".action-button")
      );
      this.#closeButton = /** @type {HTMLButtonElement} */ (
        this.#root.querySelector(".close-button")
      );

      this.#titleSlotWrapper = /** @type {HTMLElement} */ (
        this.#root.querySelector(".title")
      );
      this.#descriptionSlotWrapper = /** @type {HTMLElement} */ (
        this.#root.querySelector(".description")
      );

      this.#handlePointerDown = this.#handlePointerDown.bind(this);
      this.#handlePointerMove = this.#handlePointerMove.bind(this);
      this.#handlePointerUp = this.#handlePointerUp.bind(this);
      this.#handlePointerCancel = this.#handlePointerCancel.bind(this);
      this.#handleKeydown = this.#handleKeydown.bind(this);
      this.#handleHotkey = this.#handleHotkey.bind(this);
      this.#handleVisibilityPause = this.#handleVisibilityPause.bind(this);
      this.#handleVisibilityResume = this.#handleVisibilityResume.bind(this);
      this.#handleMousePause = this.#handleMousePause.bind(this);
      this.#handleMouseResume = this.#handleMouseResume.bind(this);
      this.#handleFocusPause = this.#handleFocusPause.bind(this);
      this.#handleFocusResume = this.#handleFocusResume.bind(this);
      this.#onSlotChange = this.#onSlotChange.bind(this);
    }

    connectedCallback() {
      upgradeProperty(this, "open");
      upgradeProperty(this, "duration");
      upgradeProperty(this, "title");
      upgradeProperty(this, "description");

      this.#actionButton.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("wc-toast-action", {
            bubbles: true,
            composed: true,
          })
        );
        this.close("action");
      });

      this.#closeButton.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("wc-toast-close", {
            detail: { reason: "close-button" },
            bubbles: true,
            composed: true,
          })
        );
        this.close("close-button");
      });

      this.#toast.addEventListener("pointerdown", this.#handlePointerDown);
      this.#toast.addEventListener("pointermove", this.#handlePointerMove);
      this.#toast.addEventListener("pointerup", this.#handlePointerUp);
      this.#toast.addEventListener("pointercancel", this.#handlePointerCancel);

      this.#toast.addEventListener("keydown", this.#handleKeydown);
      this.#toast.addEventListener("mouseenter", this.#handleMousePause);
      this.#toast.addEventListener("mouseleave", this.#handleMouseResume);
      this.#toast.addEventListener("focusin", this.#handleFocusPause);
      this.#toast.addEventListener("focusout", this.#handleFocusResume);

      window.addEventListener("blur", this.#handleVisibilityPause);
      window.addEventListener("focus", this.#handleVisibilityResume);
      document.addEventListener("keydown", this.#handleHotkey);

      this.#titleSlot.addEventListener("slotchange", this.#onSlotChange);
      this.#descriptionSlot.addEventListener("slotchange", this.#onSlotChange);
      this.#actionSlot.addEventListener("slotchange", this.#onSlotChange);

      this.#syncFromAttributes();

      if (this.hasAttribute("default-open")) {
        this.open = true;
      }
    }

    disconnectedCallback() {
      this.#clearTimer();
      this.#toast.removeEventListener("pointerdown", this.#handlePointerDown);
      this.#toast.removeEventListener("pointermove", this.#handlePointerMove);
      this.#toast.removeEventListener("pointerup", this.#handlePointerUp);
      this.#toast.removeEventListener("pointercancel", this.#handlePointerCancel);
      this.#toast.removeEventListener("keydown", this.#handleKeydown);
      this.#toast.removeEventListener("mouseenter", this.#handleMousePause);
      this.#toast.removeEventListener("mouseleave", this.#handleMouseResume);
      this.#toast.removeEventListener("focusin", this.#handleFocusPause);
      this.#toast.removeEventListener("focusout", this.#handleFocusResume);
      window.removeEventListener("blur", this.#handleVisibilityPause);
      window.removeEventListener("focus", this.#handleVisibilityResume);
      document.removeEventListener("keydown", this.#handleHotkey);
      this.#titleSlot.removeEventListener("slotchange", this.#onSlotChange);
      this.#descriptionSlot.removeEventListener("slotchange", this.#onSlotChange);
      this.#actionSlot.removeEventListener("slotchange", this.#onSlotChange);
    }

    /**
     * Reflect attributes into component state.
     */
    #syncFromAttributes() {
      this.#duration = numberOr(this.getAttribute("duration"), DEFAULT_DURATION);
      this.#type = this.getAttribute("type") === "background" ? "background" : "foreground";
      const attrHotkey = this.getAttribute("hotkey");
      this.#hotkeys = attrHotkey
        ? normaliseHotkeys(attrHotkey)
        : normaliseHotkeys(DEFAULT_HOTKEY);
      this.#updateLabel();
      this.#syncTitleAndDescription();
      this.#syncActionButton();
      if (this.hasAttribute("open")) {
        this.#setOpen(true, "attribute");
      } else {
        this.#setOpen(false, "attribute");
      }
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      if (this.#reflecting) {
        return;
      }
      switch (name) {
        case "open":
          this.#setOpen(newValue !== null, "attribute");
          break;
        case "duration":
          this.#duration = numberOr(newValue, DEFAULT_DURATION);
          if (this.#open) {
            this.#startTimer();
          }
          break;
        case "title":
        case "description":
          this.#syncTitleAndDescription();
          break;
        case "action-label":
          this.#syncActionButton();
          break;
        case "label":
        case "hotkey":
          this.#hotkeys = newValue
            ? normaliseHotkeys(newValue)
            : normaliseHotkeys(DEFAULT_HOTKEY);
          this.#updateLabel();
          break;
        case "type":
          this.#type = newValue === "background" ? "background" : "foreground";
          this.#updateLiveRegion();
          break;
      }
    }

    /**
     * Controls the open state.
     *
     * @returns {boolean}
     */
    get open() {
      return this.#open;
    }

    set open(value) {
      this.#setOpen(Boolean(value), "property");
    }

    /**
     * Duration in milliseconds.
     *
     * @returns {number}
     */
    get duration() {
      return this.#duration;
    }

    set duration(value) {
      const number = Number(value);
      const resolved = Number.isFinite(number) ? number : DEFAULT_DURATION;
      this.#duration = resolved;
      this.#reflecting = true;
      this.setAttribute("duration", String(resolved));
      this.#reflecting = false;
      if (this.#open) {
        this.#startTimer();
      }
    }

    /**
     * Shortcut for updating the description when invoking {@link show}.
     *
     * @returns {string}
     */
    get description() {
      return this.getAttribute("description") ?? "";
    }

    set description(value) {
      if (value == null) {
        this.removeAttribute("description");
      } else {
        this.setAttribute("description", String(value));
      }
    }

    /**
     * Opens the toast and optionally updates its content.
     *
     * @param {{
     *   title?: string,
     *   description?: string,
     *   actionLabel?: string,
     *   duration?: number,
     * }} [options]
     */
    show(options) {
      if (options?.title !== undefined) {
        this.setAttribute("title", options.title);
      }
      if (options?.description !== undefined) {
        this.setAttribute("description", options.description);
      }
      if (options?.actionLabel !== undefined) {
        this.setAttribute("action-label", options.actionLabel);
      }
      if (options?.duration !== undefined) {
        this.duration = options.duration;
      }
      this.open = true;
    }

    /**
     * Closes the toast.
     *
     * @param {"api" | "timeout" | "action" | "close-button" | "swipe" | "escape"} [reason]
     */
    close(reason = "api") {
      this.#setOpen(false, reason);
    }

    #setOpen(value, reason) {
      if (this.#open === value) {
        return;
      }
      this.#open = value;
      this.#reflecting = true;
      if (value) {
        this.setAttribute("open", "");
      } else {
        this.removeAttribute("open");
      }
      this.#reflecting = false;
      this.#applyOpenState(reason);
    }

    #applyOpenState(reason) {
      if (this.#open) {
        this.#toast.dataset.state = "open";
        this.#toast.removeAttribute("aria-hidden");
        this.#viewport.removeAttribute("hidden");
        this.#updateLiveRegion();
        delete this.#toast.dataset.swipe;
        this.#startTimer();
        this.dispatchEvent(
          new CustomEvent("wc-toast-open", {
            detail: { reason },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        this.#toast.dataset.state = "closing";
        this.#toast.setAttribute("aria-hidden", "true");
        this.#clearTimer();
        window.setTimeout(() => {
          this.#toast.dataset.state = "closed";
          delete this.#toast.dataset.swipe;
          this.#viewport.setAttribute("hidden", "");
        }, 150);
        this.dispatchEvent(
          new CustomEvent("wc-toast-close", {
            detail: { reason },
            bubbles: true,
            composed: true,
          })
        );
      }
    }

    #startTimer() {
      this.#clearTimer();
      if (this.#duration <= 0) {
        return;
      }
      this.#remaining = this.#duration;
      this.#timerStart = performance.now();
      this.#timer = window.setTimeout(() => {
        this.close("timeout");
      }, this.#remaining);
      this.#paused = false;
    }

    #clearTimer() {
      if (this.#timer !== null) {
        window.clearTimeout(this.#timer);
        this.#timer = null;
      }
    }

    #pauseTimer(source) {
      if (!this.#open || this.#timer === null) {
        return;
      }
      const elapsed = performance.now() - this.#timerStart;
      this.#remaining = Math.max(0, this.#remaining - elapsed);
      window.clearTimeout(this.#timer);
      this.#timer = null;
      if (!this.#paused) {
        this.dispatchEvent(
          new CustomEvent("wc-toast-pause", {
            detail: { source },
            bubbles: true,
            composed: true,
          })
        );
      }
      this.#paused = true;
    }

    #resumeTimer(source) {
      if (!this.#open || this.#duration <= 0 || this.#timer !== null) {
        return;
      }
      if (this.#remaining <= 0) {
        this.close("timeout");
        return;
      }
      this.#timerStart = performance.now();
      this.#timer = window.setTimeout(() => {
        this.close("timeout");
      }, this.#remaining);
      if (this.#paused) {
        this.dispatchEvent(
          new CustomEvent("wc-toast-resume", {
            detail: { source },
            bubbles: true,
            composed: true,
          })
        );
      }
      this.#paused = false;
    }

    #handlePointerDown(event) {
      if (!this.#open) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      this.#swiping = true;
      this.#swipePointer = event.pointerId;
      this.#swipeStartX = event.clientX;
      this.#toast.dataset.swipe = "start";
      this.#toast.setPointerCapture(this.#swipePointer);
      this.style.setProperty("--wc-toast-swipe-move-x", "0px");
      this.style.setProperty("--wc-toast-swipe-end-x", "0px");
      this.#pauseTimer("swipe");
    }

    #handlePointerMove(event) {
      if (!this.#swiping || event.pointerId !== this.#swipePointer) {
        return;
      }
      const deltaX = Math.max(0, event.clientX - this.#swipeStartX);
      this.style.setProperty("--wc-toast-swipe-move-x", `${deltaX}px`);
      this.#toast.dataset.swipe = "move";
    }

    #handlePointerUp(event) {
      if (!this.#swiping || event.pointerId !== this.#swipePointer) {
        return;
      }
      const deltaX = Math.max(0, event.clientX - this.#swipeStartX);
      const pointerId = this.#swipePointer;
      this.#swiping = false;
      this.#swipePointer = 0;
      this.#toast.releasePointerCapture(pointerId);
      if (deltaX >= SWIPE_THRESHOLD) {
        this.style.setProperty("--wc-toast-swipe-end-x", `${deltaX}px`);
        this.#toast.dataset.swipe = "end";
        this.close("swipe");
      } else {
        this.#toast.dataset.swipe = "cancel";
        this.style.setProperty("--wc-toast-swipe-move-x", "0px");
        this.#resumeTimer("swipe");
        window.requestAnimationFrame(() => {
          delete this.#toast.dataset.swipe;
        });
      }
    }

    #handlePointerCancel(event) {
      if (!this.#swiping || event.pointerId !== this.#swipePointer) {
        return;
      }
      const pointerId = this.#swipePointer;
      this.#swiping = false;
      this.#swipePointer = 0;
      this.#toast.dataset.swipe = "cancel";
      this.style.setProperty("--wc-toast-swipe-move-x", "0px");
      this.#resumeTimer("swipe");
      window.requestAnimationFrame(() => {
        delete this.#toast.dataset.swipe;
      });
      if (pointerId) {
        this.#toast.releasePointerCapture(pointerId);
      }
    }

    #handleMousePause() {
      this.#pauseTimer("pointer");
    }

    #handleMouseResume() {
      this.#resumeTimer("pointer");
    }

    #handleFocusPause() {
      this.#pauseTimer("focus");
    }

    #handleFocusResume(event) {
      const relatedTarget = /** @type {Node | null} */ (event.relatedTarget);
      const remainsInside =
        (relatedTarget !== null && this.contains(relatedTarget)) ||
        (relatedTarget !== null && this.shadowRoot?.contains(relatedTarget));
      if (!remainsInside) {
        this.#resumeTimer("focus");
      }
    }

    #handleVisibilityPause() {
      this.#pauseTimer("visibility");
    }

    #handleVisibilityResume() {
      this.#resumeTimer("visibility");
    }

    #handleKeydown(event) {
      if (event.defaultPrevented) {
        return;
      }
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        this.close("escape");
      }
    }

    #handleHotkey(event) {
      if (event.defaultPrevented) {
        return;
      }
      for (const combo of this.#hotkeys) {
        if (combo.length === 0) {
          continue;
        }
        const modifiers = new Set(combo.slice(0, -1));
        const code = combo[combo.length - 1];
        if (typeof code !== "string") {
          continue;
        }
        const requiresAlt = modifiers.has("alt");
        const requiresCtrl = modifiers.has("ctrl");
        const requiresMeta = modifiers.has("meta");
        const requiresShift = modifiers.has("shift");
        const matches =
          event.code === code &&
          event.altKey === requiresAlt &&
          event.ctrlKey === requiresCtrl &&
          event.metaKey === requiresMeta &&
          event.shiftKey === requiresShift;
        if (matches) {
          event.preventDefault();
          this.#viewport.focus();
          break;
        }
      }
    }

    #syncTitleAndDescription() {
      const hasTitleSlot = this.#titleSlot.assignedNodes({ flatten: true }).length > 0;
      const titleText = this.getAttribute("title");
      this.#titleSlotWrapper.toggleAttribute("hidden", !hasTitleSlot && !titleText);
      if (!hasTitleSlot) {
        this.#titleSlotWrapper.textContent = titleText ?? "";
      } else {
        this.#titleSlotWrapper.textContent = "";
      }

      const hasDescriptionSlot =
        this.#descriptionSlot.assignedNodes({ flatten: true }).length > 0;
      const descriptionText = this.getAttribute("description");
      this.#descriptionSlotWrapper.toggleAttribute(
        "hidden",
        !hasDescriptionSlot && !descriptionText
      );
      if (!hasDescriptionSlot) {
        this.#descriptionSlotWrapper.textContent = descriptionText ?? "";
      } else {
        this.#descriptionSlotWrapper.textContent = "";
      }
    }

    #syncActionButton() {
      const hasSlottedAction = this.#actionSlot.assignedElements({ flatten: true }).length > 0;
      const actionLabel = this.getAttribute("action-label");
      this.#actionButton.hidden = Boolean(hasSlottedAction || !actionLabel);
      if (!this.#actionButton.hidden) {
        this.#actionButton.textContent = actionLabel ?? "";
      }
    }

    #updateLabel() {
      const labelTemplate = this.getAttribute("label") ?? DEFAULT_LABEL;
      const hotkeyHuman = this.#hotkeys
        .map((combo) =>
          combo
            .map((part) => {
              switch (part) {
                case "alt":
                  return "Alt";
                case "ctrl":
                  return "Ctrl";
                case "meta":
                  return "Meta";
                case "shift":
                  return "Shift";
                default:
                  return part;
              }
            })
            .join("+")
        )
        .join(", ");
      const resolvedLabel = labelTemplate.replace("{hotkey}", hotkeyHuman || "F8");
      this.#viewport.setAttribute("aria-label", resolvedLabel);
    }

    #updateLiveRegion() {
      const liveValue = this.#type === "background" ? "polite" : "assertive";
      this.#viewport.setAttribute("aria-live", liveValue);
      this.#toast.setAttribute("aria-live", liveValue);
    }

    #onSlotChange() {
      this.#syncTitleAndDescription();
      this.#syncActionButton();
    }
  }

  customElements.define("wc-toast", WcToast);
})();


/**
 * @file carousel.js
 * @version 1.0.0
 *
 * Accessible, swipeable carousel built with an Embla-compatible API.
 * Supports horizontal and vertical orientation, looped navigation,
 * programmatic control, and plugin hooks.
 *
 * Usage:
 * <wc-carousel>
 *   <wc-carousel-content>
 *     <wc-carousel-item>One</wc-carousel-item>
 *     <wc-carousel-item>Two</wc-carousel-item>
 *   </wc-carousel-content>
 *   <wc-carousel-previous></wc-carousel-previous>
 *   <wc-carousel-next></wc-carousel-next>
 * </wc-carousel>
 */

(() => {
  /**
   * @template {keyof HTMLElementTagNameMap} K
   * @param {HTMLElement} element
   * @param {K} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * @param {any} value
   * @returns {value is Record<string, any>}
   */
  const isPlainObject = (value) => Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;

  const ORIENTATIONS = /** @type {const} */ (['horizontal', 'vertical']);
  const ALIGNS = /** @type {const} */ (['start', 'center', 'end']);

  /**
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * @param {Element[]} nodes
   */
  const filterElementNodes = (nodes) => /** @type {HTMLElement[]} */ (nodes.filter((node) => node instanceof HTMLElement));

  class WcCarouselItem extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 0 0 auto;
            width: var(--wc-carousel-item-width, 100%);
            min-width: 0;
            scroll-snap-align: var(--wc-carousel-align, center);
            scroll-snap-stop: always;
            box-sizing: border-box;
          }
          :host([hidden]) {
            display: none !important;
          }
          ::slotted(*) {
            box-sizing: border-box;
          }
        </style>
        <slot part="content"></slot>
      `;
    }
  }

  class WcCarouselContent extends HTMLElement {
    /** @type {'horizontal' | 'vertical'} */
    #orientation = 'horizontal';
    /** @type {'start' | 'center' | 'end'} */
    #align = 'center';
    /** @type {HTMLElement[]} */
    #slides = [];
    /** @type {number[]} */
    #snapPoints = [];
    /** @type {ResizeObserver | null} */
    #resizeObserver = null;
    /** @type {number | null} */
    #lastPointerId = null;
    /** @type {number} */
    #selectedIndex = 0;
    /** @type {boolean} */
    #isDragging = false;
    /** @type {number} */
    #startPointer = 0;
    /** @type {number} */
    #startScroll = 0;
    /** @type {number | null} */
    #scrollAnimationFrame = null;
    /** @type {boolean} */
    #isPointerScrolling = false;

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #viewport;
    /** @type {HTMLDivElement} */
    #track;
    /** @type {HTMLSlotElement} */
    #slot;

    /** @type {() => void} */
    #handleSlotChange = () => {
      const elements = filterElementNodes(this.#slot.assignedElements());
      this.#slides = elements.filter((el) => el.tagName === 'WC-CAROUSEL-ITEM');
      this.#slides.forEach((slide, index) => {
        slide.setAttribute('role', 'option');
        slide.setAttribute('aria-label', `Slide ${index + 1} of ${this.#slides.length}`);
      });
      this.#selectedIndex = clamp(this.#selectedIndex, 0, Math.max(0, this.#slides.length - 1));
      this.#setupResizeObserver();
      this.#updateSnapPoints();
      this.dispatchEvent(
        new CustomEvent('carousel-content-layout', {
          bubbles: true,
          composed: true,
          detail: {
            count: this.#slides.length,
            snapPoints: this.snapPoints,
            selectedIndex: this.#selectedIndex
          }
        })
      );
    };

    /** @type {() => void} */
    #handleScroll = () => {
      if (this.#scrollAnimationFrame !== null) {
        cancelAnimationFrame(this.#scrollAnimationFrame);
      }
      this.#scrollAnimationFrame = requestAnimationFrame(() => {
        this.#scrollAnimationFrame = null;
        const index = this.nearestSnapIndex();
        if (index !== this.#selectedIndex) {
          this.#selectedIndex = index;
          this.dispatchEvent(
            new CustomEvent('carousel-content-select', {
              bubbles: true,
              composed: true,
              detail: { index }
            })
          );
        }
      });
    };

    /** @type {(event: PointerEvent) => void} */
    #handlePointerDown = (event) => {
      if (!event.isPrimary) {
        return;
      }
      this.#isDragging = true;
      this.#lastPointerId = event.pointerId;
      this.#isPointerScrolling = true;
      this.#startPointer = this.#orientation === 'vertical' ? event.clientY : event.clientX;
      this.#startScroll = this.#orientation === 'vertical' ? this.#viewport.scrollTop : this.#viewport.scrollLeft;
      if (this.#viewport.setPointerCapture) {
        try {
          this.#viewport.setPointerCapture(event.pointerId);
        } catch (_) {
          // Ignore capture errors when unsupported.
        }
      }
      this.#viewport.style.scrollBehavior = 'auto';
      this.dispatchEvent(
        new CustomEvent('carousel-content-pointer-down', {
          bubbles: true,
          composed: true
        })
      );
      this.#viewport.addEventListener('pointermove', this.#handlePointerMove);
    };

    /** @type {(event: PointerEvent) => void} */
    #handlePointerMove = (event) => {
      if (!this.#isDragging || this.#lastPointerId !== event.pointerId) {
        return;
      }
      const currentPointer = this.#orientation === 'vertical' ? event.clientY : event.clientX;
      const delta = currentPointer - this.#startPointer;
      const target = this.#startScroll - delta;
      if (this.#orientation === 'vertical') {
        this.#viewport.scrollTop = target;
      } else {
        this.#viewport.scrollLeft = target;
      }
    };

    /** @type {(event: PointerEvent) => void} */
    #handlePointerUp = (event) => {
      if (!this.#isDragging || (this.#lastPointerId !== null && event.pointerId !== this.#lastPointerId)) {
        return;
      }
      this.#isDragging = false;
      this.#isPointerScrolling = false;
      if (this.#lastPointerId !== null && this.#viewport.hasPointerCapture?.(this.#lastPointerId)) {
        try {
          this.#viewport.releasePointerCapture(this.#lastPointerId);
        } catch (_) {
          // Ignore capture release errors on unsupported browsers.
        }
      }
      this.#lastPointerId = null;
      this.#viewport.style.scrollBehavior = 'smooth';
      const index = this.nearestSnapIndex();
      this.scrollToIndex(index, 'smooth');
      this.dispatchEvent(
        new CustomEvent('carousel-content-pointer-up', {
          bubbles: true,
          composed: true
        })
      );
      this.dispatchEvent(
        new CustomEvent('carousel-content-settle', {
          bubbles: true,
          composed: true,
          detail: { index }
        })
      );
      this.#viewport.removeEventListener('pointermove', this.#handlePointerMove);
    };

    /** @type {(event: KeyboardEvent) => void} */
    #handleKeydown = (event) => {
      if (event.defaultPrevented) {
        return;
      }
      const prevKeys = this.#orientation === 'vertical' ? ['ArrowUp', 'PageUp'] : ['ArrowLeft', 'PageUp'];
      const nextKeys = this.#orientation === 'vertical' ? ['ArrowDown', 'PageDown'] : ['ArrowRight', 'PageDown'];
      if (prevKeys.includes(event.key)) {
        event.preventDefault();
        this.scrollToIndex(this.#selectedIndex - 1);
      } else if (nextKeys.includes(event.key)) {
        event.preventDefault();
        this.scrollToIndex(this.#selectedIndex + 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.scrollToIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this.scrollToIndex(this.#slides.length - 1);
      }
    };

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            overflow: visible;
          }
          .viewport {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: var(--wc-carousel-radius, 0.75rem);
            background: var(--wc-carousel-background, transparent);
            box-sizing: border-box;
            touch-action: pan-y;
            scroll-behavior: smooth;
            scrollbar-width: none;
          }
          .viewport::-webkit-scrollbar {
            display: none;
          }
          .track {
            display: flex;
            gap: var(--wc-carousel-gap, 0px);
            width: max-content;
            min-width: 100%;
            min-height: 100%;
            will-change: transform;
          }
          :host([data-orientation='vertical']) .viewport {
            touch-action: pan-x;
          }
          :host([data-orientation='vertical']) .track {
            flex-direction: column;
            width: 100%;
          }
          :host([data-orientation='horizontal']) .track {
            flex-direction: row;
          }
          ::slotted(wc-carousel-item) {
            flex: 0 0 auto;
          }
        </style>
        <div class="viewport" part="viewport" role="listbox" aria-orientation="horizontal">
          <div class="track" part="track">
            <slot></slot>
          </div>
        </div>
      `;
      this.#viewport = /** @type {HTMLDivElement} */ (this.#root.querySelector('.viewport'));
      this.#track = /** @type {HTMLDivElement} */ (this.#root.querySelector('.track'));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
    }

    connectedCallback() {
      this.#slot.addEventListener('slotchange', this.#handleSlotChange);
      this.#viewport.addEventListener('scroll', this.#handleScroll, { passive: true });
      this.#viewport.addEventListener('pointerdown', this.#handlePointerDown);
      this.#viewport.addEventListener('pointerup', this.#handlePointerUp);
      this.#viewport.addEventListener('pointercancel', this.#handlePointerUp);
      this.#viewport.addEventListener('pointerleave', this.#handlePointerUp);
      this.#viewport.addEventListener('keydown', this.#handleKeydown);
      this.#viewport.tabIndex = 0;
      this.#viewport.setAttribute('aria-live', 'polite');
      this.#viewport.setAttribute('aria-roledescription', 'carousel viewport');
      this.#viewport.setAttribute('role', 'listbox');
      this.#viewport.setAttribute('aria-orientation', this.#orientation);
      this.#applyOrientation();
      this.#handleSlotChange();
    }

    disconnectedCallback() {
      this.#slot.removeEventListener('slotchange', this.#handleSlotChange);
      this.#viewport.removeEventListener('scroll', this.#handleScroll);
      this.#viewport.removeEventListener('pointerdown', this.#handlePointerDown);
      this.#viewport.removeEventListener('pointerup', this.#handlePointerUp);
      this.#viewport.removeEventListener('pointercancel', this.#handlePointerUp);
      this.#viewport.removeEventListener('pointerleave', this.#handlePointerUp);
      this.#viewport.removeEventListener('pointermove', this.#handlePointerMove);
      this.#viewport.removeEventListener('keydown', this.#handleKeydown);
      this.#disconnectResizeObserver();
    }

    /**
     * @returns {HTMLElement[]}
     */
    get slides() {
      return [...this.#slides];
    }

    /**
     * @returns {number[]}
     */
    get snapPoints() {
      return [...this.#snapPoints];
    }

    /**
     * @returns {number}
     */
    get selectedIndex() {
      return this.#selectedIndex;
    }

    /**
     * @param {'horizontal' | 'vertical'} value
     */
    setOrientation(value) {
      if (this.#orientation === value) {
        return;
      }
      this.#orientation = value;
      this.#viewport.setAttribute('aria-orientation', value);
      this.#applyOrientation();
      this.#updateSnapPoints();
    }

    /**
     * @param {'start' | 'center' | 'end'} value
     */
    setAlign(value) {
      if (this.#align === value) {
        return;
      }
      this.#align = value;
      this.style.setProperty('--wc-carousel-align', value);
      this.#updateSnapPoints();
    }

    /**
     * @param {number} index
     * @param {ScrollBehavior} behavior
     */
    scrollToIndex(index, behavior = 'smooth') {
      if (!this.#slides.length) {
        return;
      }
      const boundedIndex = clamp(index, 0, this.#slides.length - 1);
      const target = this.#snapPoints[boundedIndex] ?? 0;
      if (this.#orientation === 'vertical') {
        this.#viewport.scrollTo({ top: target, behavior });
      } else {
        this.#viewport.scrollTo({ left: target, behavior });
      }
    }

    /**
     * @returns {number}
     */
    nearestSnapIndex() {
      if (!this.#slides.length) {
        return 0;
      }
      const current = this.#orientation === 'vertical' ? this.#viewport.scrollTop : this.#viewport.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      this.#snapPoints.forEach((point, index) => {
        const distance = Math.abs(point - current);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      return closestIndex;
    }

    /**
     * @returns {number[]}
     */
    slidesInView() {
      const viewportRect = this.#viewport.getBoundingClientRect();
      const startKey = this.#orientation === 'vertical' ? 'top' : 'left';
      const endKey = this.#orientation === 'vertical' ? 'bottom' : 'right';
      return this.#slides
        .map((slide, index) => ({ slide, index }))
        .filter(({ slide }) => {
          const rect = slide.getBoundingClientRect();
          return rect[endKey] > viewportRect[startKey] && rect[startKey] < viewportRect[endKey];
        })
        .map(({ index }) => index);
    }

    /**
     * @param {(event: CustomEvent) => void} callback
     */
    onLayout(callback) {
      this.addEventListener('carousel-content-layout', callback);
    }

    #applyOrientation() {
      this.setAttribute('data-orientation', this.#orientation);
      if (this.#orientation === 'vertical') {
        this.#viewport.style.scrollSnapType = 'y mandatory';
        this.#viewport.style.touchAction = 'pan-x';
      } else {
        this.#viewport.style.scrollSnapType = 'x mandatory';
        this.#viewport.style.touchAction = 'pan-y';
      }
    }

    #disconnectResizeObserver() {
      if (this.#resizeObserver) {
        this.#resizeObserver.disconnect();
        this.#resizeObserver = null;
      }
    }

    #setupResizeObserver() {
      this.#disconnectResizeObserver();
      if (!('ResizeObserver' in window)) {
        return;
      }
      this.#resizeObserver = new ResizeObserver(() => {
        this.#updateSnapPoints();
      });
      this.#resizeObserver.observe(this.#viewport);
      this.#slides.forEach((slide) => this.#resizeObserver?.observe(slide));
    }

    #updateSnapPoints() {
      const viewportSize = this.#orientation === 'vertical' ? this.#viewport.clientHeight : this.#viewport.clientWidth;
      const scrollSize =
        this.#orientation === 'vertical'
          ? Math.max(0, this.#viewport.scrollHeight - this.#viewport.clientHeight)
          : Math.max(0, this.#viewport.scrollWidth - this.#viewport.clientWidth);
      this.#snapPoints = this.#slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const viewportRect = this.#viewport.getBoundingClientRect();
        const size = this.#orientation === 'vertical' ? rect.height : rect.width;
        const start = this.#orientation === 'vertical' ? rect.top - viewportRect.top + this.#viewport.scrollTop : rect.left - viewportRect.left + this.#viewport.scrollLeft;
        let offset = start;
        if (this.#align === 'center') {
          offset -= (viewportSize - size) / 2;
        } else if (this.#align === 'end') {
          offset -= viewportSize - size;
        }
        return clamp(offset, 0, scrollSize);
      });
      const previousIndex = this.#selectedIndex;
      this.#selectedIndex = this.nearestSnapIndex();
      if (previousIndex !== this.#selectedIndex) {
        this.dispatchEvent(
          new CustomEvent('carousel-content-select', {
            bubbles: true,
            composed: true,
            detail: { index: this.#selectedIndex }
          })
        );
      }
    }

    

    /**
     * Programmatically force the viewport to the nearest snap point.
     */
    settleToNearest() {
      const index = this.nearestSnapIndex();
      this.scrollToIndex(index, 'smooth');
    }

    get isPointerScrolling() {
      return this.#isPointerScrolling;
    }

    get viewport() {
      return this.#viewport;
    }
  }

  class WcCarouselControlBase extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLButtonElement} */
    #button;
    /** @type {WcCarousel | null} */
    #carousel = null;
    /** @type {'previous' | 'next'} */
    #type;
    /** @type {() => void} */
    #onClick;

    /**
     * @param {'previous' | 'next'} type
     * @param {string} defaultLabel
     */
    constructor(type, defaultLabel) {
      super();
      this.#type = type;
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: var(--wc-carousel-control-size, 2.5rem);
            height: var(--wc-carousel-control-size, 2.5rem);
            border-radius: var(--wc-carousel-control-radius, 9999px);
            background: var(--wc-carousel-control-background, rgba(17, 24, 39, 0.7));
            color: var(--wc-carousel-control-color, white);
            box-shadow: var(--wc-carousel-control-shadow, 0 2px 10px rgba(15, 23, 42, 0.3));
            backdrop-filter: var(--wc-carousel-control-backdrop, blur(4px));
            position: relative;
            border: none;
          }
          :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
          }
          button {
            all: unset;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
          svg {
            width: 1.25rem;
            height: 1.25rem;
          }
        </style>
        <button part="button" type="button">
          <slot>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M15.53 4.53a.75.75 0 0 0-1.06-1.06l-7 7a.75.75 0 0 0 0 1.06l7 7a.75.75 0 0 0 1.06-1.06L9.06 12z" />
            </svg>
          </slot>
        </button>
      `;
      this.#button = /** @type {HTMLButtonElement} */ (this.#root.querySelector('button'));
      if (type === 'next') {
        const path = this.#root.querySelector('path');
        if (path) {
          path.setAttribute('d', 'M8.47 4.53a.75.75 0 0 1 1.06-1.06l7 7a.75.75 0 0 1 0 1.06l-7 7a.75.75 0 0 1-1.06-1.06L14.94 12z');
        }
      }
      this.#onClick = () => {
        this.#carousel?.[this.#type === 'next' ? 'scrollNext' : 'scrollPrevious']();
      };
      this.#button.setAttribute('aria-label', defaultLabel);
    }

    connectedCallback() {
      this.#button.addEventListener('click', this.#onClick);
      const carousel = this.closest('wc-carousel');
      if (carousel instanceof WcCarousel) {
        this.#carousel = carousel;
        carousel.registerCarouselControl(this, this.#type);
      }
    }

    disconnectedCallback() {
      this.#button.removeEventListener('click', this.#onClick);
      if (this.#carousel) {
        this.#carousel.unregisterCarouselControl(this, this.#type);
      }
      this.#carousel = null;
    }

    /**
     * @param {boolean} disabled
     */
    setDisabled(disabled) {
      this.toggleAttribute('disabled', disabled);
      if (disabled) {
        this.#button.setAttribute('tabindex', '-1');
      } else {
        this.#button.removeAttribute('tabindex');
      }
      this.#button.setAttribute('aria-disabled', String(disabled));
    }
  }

  class WcCarouselPrevious extends WcCarouselControlBase {
    constructor() {
      super('previous', 'Scroll to previous slide');
    }
  }

  class WcCarouselNext extends WcCarouselControlBase {
    constructor() {
      super('next', 'Scroll to next slide');
    }
  }

  class WcCarousel extends HTMLElement {
    static get observedAttributes() {
      return ['loop', 'orientation', 'align'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {EventTarget} */
    #events = new EventTarget();
    /** @type {WcCarouselContent | null} */
    #content = null;
    /** @type {Set<WcCarouselControlBase>} */
    #previousControls = new Set();
    /** @type {Set<WcCarouselControlBase>} */
    #nextControls = new Set();
    /** @type {{ loop: boolean; align: 'start' | 'center' | 'end'; orientation: 'horizontal' | 'vertical'; }} */
    #options = {
      loop: false,
      align: 'center',
      orientation: 'horizontal'
    };
    /** @type {number} */
    #selectedIndex = 0;
    /** @type {number} */
    #slideCount = 0;
    /** @type {Array<{ init?: (api: CarouselApi) => void; destroy?: () => void }>} */
    #pluginInstances = [];
    /** @type {Array<{ init?: (api: CarouselApi) => void; destroy?: () => void }> | null} */
    #pendingPlugins = null;
    /** @type {(api: CarouselApi) => void | undefined} */
    #setApi;
    /** @type {CarouselApi} */
    #api;

    /** @type {(event: KeyboardEvent) => void} */
    #handleKeydown = (event) => {
      if (event.defaultPrevented) {
        return;
      }
      const horizontal = this.#options.orientation === 'horizontal';
      const prevKeys = horizontal ? ['ArrowLeft', 'PageUp'] : ['ArrowUp', 'PageUp'];
      const nextKeys = horizontal ? ['ArrowRight', 'PageDown'] : ['ArrowDown', 'PageDown'];
      if (prevKeys.includes(event.key)) {
        event.preventDefault();
        this.scrollPrevious();
      } else if (nextKeys.includes(event.key)) {
        event.preventDefault();
        this.scrollNext();
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.scrollTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this.scrollTo(this.#slideCount - 1);
      }
    };

    /** @type {(event: CustomEvent<{ index: number }>) => void} */
    #handleContentSelect = (event) => {
      const { index } = event.detail;
      if (index === this.#selectedIndex) {
        return;
      }
      this.#selectedIndex = index;
      if (this.#slideCount > 0) {
        this.setAttribute('aria-label', `Slide ${index + 1} of ${this.#slideCount}`);
      }
      this.#emit('select', { index });
      this.dispatchEvent(
        new CustomEvent('carousel-select', {
          detail: { index },
          bubbles: true,
          composed: true
        })
      );
      this.#updateControls();
    };

    /** @type {(event: CustomEvent<{ count: number }>) => void} */
    #handleContentLayout = (event) => {
      const { count } = event.detail;
      this.#slideCount = count;
      if (count > 0) {
        this.setAttribute('aria-label', `Slide ${this.#selectedIndex + 1} of ${count}`);
      } else {
        this.removeAttribute('aria-label');
      }
      this.#emit('resize', { count });
      this.#updateControls();
    };

    /** @type {() => void} */
    #handleContentPointerDown = () => {
      this.#emit('pointerDown', undefined);
    };

    /** @type {() => void} */
    #handleContentPointerUp = () => {
      this.#emit('pointerUp', undefined);
    };

    /** @type {(event: CustomEvent<{ index: number }>) => void} */
    #handleContentSettle = (event) => {
      this.#emit('settle', { index: event.detail.index });
    };

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            width: var(--wc-carousel-width, 100%);
            box-sizing: border-box;
          }
          :host(:focus-visible) {
            outline: var(--wc-carousel-focus-outline, 2px solid var(--wc-carousel-accent, hsl(222 89% 52%)));
            outline-offset: 4px;
          }
          ::slotted(wc-carousel-previous) {
            position: absolute;
            top: 50%;
            left: var(--wc-carousel-control-offset, 0.75rem);
            transform: translateY(-50%);
            z-index: 10;
          }
          ::slotted(wc-carousel-next) {
            position: absolute;
            top: 50%;
            right: var(--wc-carousel-control-offset, 0.75rem);
            transform: translateY(-50%);
            z-index: 10;
          }
        </style>
        <div part="container" class="container" tabindex="0">
          <slot></slot>
        </div>
      `;

      this.#api = this.#createApi();
    }

    connectedCallback() {
      this.setAttribute('role', 'region');
      this.setAttribute('aria-roledescription', 'carousel');
      upgradeProperty(this, 'opts');
      upgradeProperty(this, 'setApi');
      upgradeProperty(this, 'plugins');
      this.#findContent();
      this.addEventListener('keydown', this.#handleKeydown);
      this.#setApi?.(this.#api);
      this.#initializePlugins();
      this.#emit('ready', undefined);
    }

    disconnectedCallback() {
      this.removeEventListener('keydown', this.#handleKeydown);
      this.#teardownContent();
      this.#destroyPlugins();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }
      if (name === 'loop') {
        this.#options.loop = newValue !== null;
      } else if (name === 'orientation' && ORIENTATIONS.includes(/** @type {any} */ (newValue))) {
        this.#options.orientation = /** @type {'horizontal' | 'vertical'} */ (newValue);
      } else if (name === 'align' && ALIGNS.includes(/** @type {any} */ (newValue))) {
        this.#options.align = /** @type {'start' | 'center' | 'end'} */ (newValue);
      }
      if (this.isConnected) {
        this.#applyOptions();
      }
    }

    /**
     * @returns {CarouselOptions}
     */
    get opts() {
      return { ...this.#options };
    }

    /**
     * @param {CarouselOptions} value
     */
    set opts(value) {
      if (!isPlainObject(value)) {
        return;
      }
      this.#options = {
        loop: Boolean(value.loop ?? this.#options.loop),
        align: ALIGNS.includes(/** @type {any} */ (value.align)) ? /** @type {any} */ (value.align) : this.#options.align,
        orientation: ORIENTATIONS.includes(/** @type {any} */ (value.orientation))
          ? /** @type {any} */ (value.orientation)
          : this.#options.orientation
      };
      this.toggleAttribute('loop', this.#options.loop);
      this.setAttribute('orientation', this.#options.orientation);
      this.setAttribute('align', this.#options.align);
      this.#applyOptions();
    }

    /**
     * @param {(api: CarouselApi) => void} callback
     */
    set setApi(callback) {
      if (typeof callback !== 'function') {
        this.#setApi = undefined;
        return;
      }
      this.#setApi = callback;
      if (this.isConnected) {
        callback(this.#api);
      }
    }

    get setApi() {
      return this.#setApi;
    }

    /**
     * @param {Array<{ init?: (api: CarouselApi) => void; destroy?: () => void }> | undefined | null} value
     */
    set plugins(value) {
      if (!Array.isArray(value)) {
        this.#pendingPlugins = null;
        return;
      }
      this.#pendingPlugins = value;
      if (this.isConnected) {
        this.#initializePlugins();
      }
    }

    get plugins() {
      return this.#pendingPlugins;
    }

    /**
     * @param {WcCarouselControlBase} control
     * @param {'previous' | 'next'} type
     */
    registerCarouselControl(control, type) {
      if (type === 'previous') {
        this.#previousControls.add(control);
      } else {
        this.#nextControls.add(control);
      }
      this.#updateControls();
    }

    /**
     * @param {WcCarouselControlBase} control
     * @param {'previous' | 'next'} type
     */
    unregisterCarouselControl(control, type) {
      if (type === 'previous') {
        this.#previousControls.delete(control);
      } else {
        this.#nextControls.delete(control);
      }
    }

    scrollNext() {
      if (!this.#content) {
        return;
      }
      const targetIndex = this.#selectedIndex + 1;
      if (targetIndex >= this.#slideCount) {
        if (this.#options.loop && this.#slideCount > 0) {
          this.#content.scrollToIndex(0);
        }
        return;
      }
      this.#content.scrollToIndex(targetIndex);
    }

    scrollPrevious() {
      if (!this.#content) {
        return;
      }
      const targetIndex = this.#selectedIndex - 1;
      if (targetIndex < 0) {
        if (this.#options.loop && this.#slideCount > 0) {
          this.#content.scrollToIndex(this.#slideCount - 1);
        }
        return;
      }
      this.#content.scrollToIndex(targetIndex);
    }

    scrollTo(index) {
      this.#content?.scrollToIndex(index);
    }

    reInit() {
      this.#applyOptions();
      this.#content?.settleToNearest();
      this.#emit('reInit', undefined);
    }

    /**
     * @returns {HTMLElement[]}
     */
    slides() {
      return this.#content?.slides ?? [];
    }

    /**
     * @returns {number[]}
     */
    snapPoints() {
      return this.#content?.snapPoints ?? [];
    }

    /**
     * @returns {number}
     */
    selectedScrollSnap() {
      return this.#selectedIndex;
    }

    /**
     * @returns {number[]}
     */
    slidesInView() {
      return this.#content?.slidesInView() ?? [];
    }

    /**
     * @param {string} eventName
     * @param {(event: CustomEvent<any>) => void} callback
     */
    on(eventName, callback) {
      this.#events.addEventListener(eventName, callback);
    }

    /**
     * @param {string} eventName
     * @param {(event: CustomEvent<any>) => void} callback
     */
    off(eventName, callback) {
      this.#events.removeEventListener(eventName, callback);
    }

    /**
     * @template T
     * @param {string} eventName
     * @param {T} detail
     */
    #emit(eventName, detail) {
      this.#events.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    #findContent() {
      const content = this.querySelector('wc-carousel-content');
      if (content instanceof WcCarouselContent) {
        this.#attachContent(content);
      }
    }

    /**
     * @param {WcCarouselContent} content
     */
    #attachContent(content) {
      if (this.#content === content) {
        return;
      }
      this.#teardownContent();
      this.#content = content;
      content.setOrientation(this.#options.orientation);
      content.setAlign(this.#options.align);
      content.addEventListener('carousel-content-select', this.#handleContentSelect);
      content.addEventListener('carousel-content-layout', this.#handleContentLayout);
      content.addEventListener('carousel-content-pointer-down', this.#handleContentPointerDown);
      content.addEventListener('carousel-content-pointer-up', this.#handleContentPointerUp);
      content.addEventListener('carousel-content-settle', this.#handleContentSettle);
      this.#slideCount = content.slides.length;
      this.#selectedIndex = content.selectedIndex;
      this.#updateControls();
    }

    #teardownContent() {
      if (!this.#content) {
        return;
      }
      this.#content.removeEventListener('carousel-content-select', this.#handleContentSelect);
      this.#content.removeEventListener('carousel-content-layout', this.#handleContentLayout);
      this.#content.removeEventListener('carousel-content-pointer-down', this.#handleContentPointerDown);
      this.#content.removeEventListener('carousel-content-pointer-up', this.#handleContentPointerUp);
      this.#content.removeEventListener('carousel-content-settle', this.#handleContentSettle);
      this.#content = null;
    }

    #applyOptions() {
      if (!this.#content) {
        return;
      }
      this.#content.setOrientation(this.#options.orientation);
      this.#content.setAlign(this.#options.align);
      this.#updateControls();
    }

    #updateControls() {
      const canScrollPrev = this.#options.loop || this.#selectedIndex > 0;
      const canScrollNext = this.#options.loop || this.#selectedIndex < this.#slideCount - 1;
      this.#previousControls.forEach((control) => control.setDisabled(!canScrollPrev || this.#slideCount <= 1));
      this.#nextControls.forEach((control) => control.setDisabled(!canScrollNext || this.#slideCount <= 1));
    }

    #createApi() {
      const self = this;
      /** @type {CarouselApi} */
      const api = {
        scrollNext() {
          self.scrollNext();
        },
        scrollPrev() {
          self.scrollPrevious();
        },
        scrollTo(index) {
          self.scrollTo(index);
        },
        selectedScrollSnap() {
          return self.selectedScrollSnap();
        },
        scrollSnapList() {
          return self.snapPoints();
        },
        slidesInView() {
          return self.slidesInView();
        },
        slides() {
          return self.slides();
        },
        reInit() {
          self.reInit();
        },
        options() {
          return self.opts;
        },
        rootNode() {
          return self;
        },
        containerNode() {
          return self.#content?.viewport ?? null;
        },
        on(eventName, handler) {
          self.on(eventName, handler);
        },
        off(eventName, handler) {
          self.off(eventName, handler);
        }
      };
      return api;
    }

    #initializePlugins() {
      this.#destroyPlugins();
      const pending = this.#pendingPlugins ?? [];
      this.#pluginInstances = pending.map((plugin) => {
        if (plugin && typeof plugin.init === 'function') {
          plugin.init(this.#api);
        }
        return plugin;
      });
    }

    #destroyPlugins() {
      this.#pluginInstances.forEach((plugin) => {
        plugin?.destroy?.();
      });
      this.#pluginInstances = [];
    }
  }

  /**
   * @typedef {Object} CarouselOptions
   * @property {'start' | 'center' | 'end'} [align]
   * @property {boolean} [loop]
   * @property {'horizontal' | 'vertical'} [orientation]
   */

  /**
   * @typedef {Object} CarouselApi
   * @property {() => void} scrollNext
   * @property {() => void} scrollPrev
   * @property {(index: number) => void} scrollTo
   * @property {() => number} selectedScrollSnap
   * @property {() => number[]} scrollSnapList
   * @property {() => number[]} slidesInView
   * @property {() => HTMLElement[]} slides
   * @property {() => void} reInit
   * @property {() => CarouselOptions} options
   * @property {() => HTMLElement | null} containerNode
   * @property {() => HTMLElement} rootNode
   * @property {(eventName: string, handler: (event: CustomEvent<any>) => void) => void} on
   * @property {(eventName: string, handler: (event: CustomEvent<any>) => void) => void} off
   */

  if (!customElements.get('wc-carousel')) {
    customElements.define('wc-carousel', WcCarousel);
  }
  if (!customElements.get('wc-carousel-content')) {
    customElements.define('wc-carousel-content', WcCarouselContent);
  }
  if (!customElements.get('wc-carousel-item')) {
    customElements.define('wc-carousel-item', WcCarouselItem);
  }
  if (!customElements.get('wc-carousel-previous')) {
    customElements.define('wc-carousel-previous', WcCarouselPrevious);
  }
  if (!customElements.get('wc-carousel-next')) {
    customElements.define('wc-carousel-next', WcCarouselNext);
  }
})();

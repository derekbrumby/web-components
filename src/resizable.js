/**
 * @file resizable.js
 * @version 1.0.0
 *
 * Accessible resizable panel group components inspired by React Resizable Panels.
 * Provides keyboard and pointer resizing with orientation awareness and rich styling hooks.
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
   * @param {number} fallback
   */
  const numberAttribute = (value, fallback) => {
    if (value === null || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  /**
   * Clamp `value` between `min` and `max`.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * Normalises keyboard step increments based on modifier keys.
   * @param {KeyboardEvent} event
   */
  const keyStep = (event) => (event.shiftKey ? 10 : event.altKey ? 1 : 4);

  /**
   * @typedef {'horizontal' | 'vertical'} Orientation
   */

  class WcResizablePanel extends HTMLElement {
    static get observedAttributes() {
      return ['default-size', 'min-size', 'max-size', 'disabled'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #container;
    /** @type {Orientation} */
    #orientation = 'horizontal';
    /** @type {number} */
    #size = 0;
    /** @type {number} */
    #defaultSize = NaN;
    /** @type {number} */
    #minSize = 5;
    /** @type {number} */
    #maxSize = 100;
    /** @type {boolean} */
    #disabled = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            min-width: 0;
            min-height: 0;
            --wc-resizable-panel-background: transparent;
            --wc-resizable-panel-color: inherit;
            --wc-resizable-panel-padding: 0;
            --wc-resizable-panel-border: 0;
          }

          :host([data-disabled]) {
            pointer-events: none;
            opacity: var(--wc-resizable-panel-disabled-opacity, 0.45);
          }

          [part="panel"] {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: stretch;
            box-sizing: border-box;
            background: var(--wc-resizable-panel-background);
            color: var(--wc-resizable-panel-color);
            padding: var(--wc-resizable-panel-padding);
            border: var(--wc-resizable-panel-border);
            width: 100%;
            height: 100%;
          }
        </style>
        <div part="panel" class="panel" role="presentation">
          <slot></slot>
        </div>
      `;
      this.#container = /** @type {HTMLElement} */ (this.#root.querySelector('.panel'));
    }

    connectedCallback() {
      upgradeProperty(this, 'defaultSize');
      upgradeProperty(this, 'minSize');
      upgradeProperty(this, 'maxSize');
      upgradeProperty(this, 'disabled');
      this.#reflectDisabled();
      this.#applySize();
    }

    attributeChangedCallback(name) {
      if (name === 'default-size') {
        this.#defaultSize = Number.isFinite(Number(this.getAttribute('default-size')))
          ? Number(this.getAttribute('default-size'))
          : NaN;
      } else if (name === 'min-size') {
        this.#minSize = clamp(numberAttribute(this.getAttribute('min-size'), 5), 0, 100);
        this.#applySize();
      } else if (name === 'max-size') {
        this.#maxSize = clamp(numberAttribute(this.getAttribute('max-size'), 100), 0, 100);
        this.#applySize();
      } else if (name === 'disabled') {
        this.#disabled = this.hasAttribute('disabled');
        this.#reflectDisabled();
      }
    }

    /**
     * @param {Orientation} orientation
     */
    setOrientation(orientation) {
      this.#orientation = orientation;
      this.toggleAttribute('data-vertical', orientation === 'vertical');
      this.#applySize();
    }

    /**
     * Apply an explicit percentage size to the panel.
     * @param {number} value
     */
    setSize(value) {
      this.#size = clamp(value, this.#minSize, this.#maxSize);
      this.#applySize();
    }

    /**
     * The current size in percentages.
     */
    get size() {
      return this.#size;
    }

    /**
     * Default size request read from the attribute.
     */
    get defaultSize() {
      return this.#defaultSize;
    }

    set defaultSize(value) {
      if (!Number.isFinite(value)) {
        this.removeAttribute('default-size');
      } else {
        this.setAttribute('default-size', String(value));
      }
    }

    /**
     * Minimum size in percentages.
     */
    get minSize() {
      return this.#minSize;
    }

    set minSize(value) {
      this.setAttribute('min-size', String(value));
    }

    /**
     * Maximum size in percentages.
     */
    get maxSize() {
      return this.#maxSize;
    }

    set maxSize(value) {
      this.setAttribute('max-size', String(value));
    }

    get disabled() {
      return this.#disabled;
    }

    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     * @param {number} delta
     */
    adjustSize(delta) {
      this.setSize(this.#size + delta);
    }

    #applySize() {
      const basis = `${this.#size}%`;
      if (this.#orientation === 'horizontal') {
        this.style.flex = `0 0 ${basis}`;
        this.style.width = basis;
        this.style.height = '';
        this.style.minWidth = `${this.#minSize}%`;
        this.style.maxWidth = `${this.#maxSize}%`;
        this.style.minHeight = '';
        this.style.maxHeight = '';
      } else {
        this.style.flex = `0 0 ${basis}`;
        this.style.height = basis;
        this.style.width = '';
        this.style.minHeight = `${this.#minSize}%`;
        this.style.maxHeight = `${this.#maxSize}%`;
        this.style.minWidth = '';
        this.style.maxWidth = '';
      }
      this.style.flexBasis = basis;
      this.style.setProperty('--wc-resizable-panel-size', basis);
    }

    #reflectDisabled() {
      this.toggleAttribute('data-disabled', this.#disabled);
    }
  }

  class WcResizableHandle extends HTMLElement {
    static get observedAttributes() {
      return ['with-handle'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {Orientation} */
    #orientation = 'horizontal';
    /** @type {WcResizableGroup | null} */
    #group = null;
    /** @type {WcResizablePanel | null} */
    #previousPanel = null;
    /** @type {WcResizablePanel | null} */
    #nextPanel = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-resizable-handle-size: 1px;
            --wc-resizable-handle-hit-area: 12px;
            --wc-resizable-handle-color: rgba(15, 23, 42, 0.18);
            --wc-resizable-handle-hover-color: rgba(79, 70, 229, 0.6);
            --wc-resizable-handle-active-color: rgba(67, 56, 202, 0.9);
            position: relative;
            display: block;
            cursor: col-resize;
            touch-action: none;
          }

          :host([data-orientation="vertical"]) {
            cursor: row-resize;
          }

          :host([hidden]) {
            display: none !important;
          }

          [part="hit-area"] {
            position: absolute;
            inset: 0;
          }

          [part="separator"] {
            position: absolute;
            inset: 0;
            margin: auto;
            background: var(--wc-resizable-handle-color);
            border-radius: 999px;
            transition: background-color 160ms ease;
          }

          :host(:focus-visible) [part="separator"],
          :host(:hover) [part="separator"] {
            background: var(--wc-resizable-handle-hover-color);
          }

          :host([data-active]) [part="separator"] {
            background: var(--wc-resizable-handle-active-color);
          }

          :host([data-orientation="horizontal"]) [part="separator"] {
            width: var(--wc-resizable-handle-size);
            height: 100%;
          }

          :host([data-orientation="horizontal"]) {
            min-width: var(--wc-resizable-handle-hit-area);
          }

          :host([data-orientation="vertical"]) [part="separator"] {
            height: var(--wc-resizable-handle-size);
            width: 100%;
          }

          :host([data-orientation="vertical"]) {
            min-height: var(--wc-resizable-handle-hit-area);
          }

          [part="grip"] {
            display: none;
            position: absolute;
            inset: 50% auto auto 50%;
            translate: -50% -50%;
            border-radius: 999px;
            background: currentColor;
            opacity: 0.6;
          }

          :host([data-with-handle]) [part="grip"] {
            display: block;
          }

          :host([data-orientation="horizontal"]) [part="grip"] {
            width: var(--wc-resizable-grip-width, 0.65rem);
            height: var(--wc-resizable-grip-height, 2.4rem);
          }

          :host([data-orientation="vertical"]) [part="grip"] {
            height: var(--wc-resizable-grip-width, 0.65rem);
            width: var(--wc-resizable-grip-height, 2.4rem);
          }
        </style>
        <div part="hit-area" aria-hidden="true"></div>
        <div part="separator" class="separator"></div>
        <div part="grip"></div>
      `;
    }

    connectedCallback() {
      this.setAttribute('role', 'separator');
      if (!this.hasAttribute('tabindex')) {
        this.tabIndex = 0;
      }
      this.addEventListener('pointerdown', this.#onPointerDown);
      this.addEventListener('keydown', this.#onKeyDown);
      this.addEventListener('blur', () => this.removeAttribute('data-active'));
      this.#updateOrientation();
      this.#updateHandleVisibility();
    }

    disconnectedCallback() {
      this.removeEventListener('pointerdown', this.#onPointerDown);
      this.removeEventListener('keydown', this.#onKeyDown);
    }

    attributeChangedCallback() {
      this.#updateHandleVisibility();
    }

    /**
     * @param {Orientation} orientation
     */
    setOrientation(orientation) {
      this.#orientation = orientation;
      this.setAttribute('data-orientation', orientation);
      this.setAttribute('aria-orientation', orientation);
      this.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      this.#updateOrientation();
    }

    /**
     * @param {WcResizableGroup | null} group
     * @param {WcResizablePanel | null} previous
     * @param {WcResizablePanel | null} next
     */
    attach(group, previous, next) {
      this.#group = group;
      this.#previousPanel = previous;
      this.#nextPanel = next;
      this.toggleAttribute('data-disabled', !previous || !next);
      if (!previous || !next) {
        this.removeAttribute('aria-valuemin');
        this.removeAttribute('aria-valuemax');
        this.removeAttribute('aria-valuenow');
        this.removeAttribute('aria-valuetext');
        this.tabIndex = -1;
      } else {
        this.tabIndex = 0;
        this.#updateAriaValues();
      }
    }

    detach() {
      this.#group = null;
      this.#previousPanel = null;
      this.#nextPanel = null;
      this.removeAttribute('data-disabled');
      this.removeAttribute('aria-valuenow');
      this.removeAttribute('aria-valuetext');
      this.removeAttribute('aria-valuemin');
      this.removeAttribute('aria-valuemax');
      this.tabIndex = -1;
    }

    #onPointerDown = (event) => {
      if (event.button !== 0) {
        return;
      }
      if (!this.#group || !this.#previousPanel || !this.#nextPanel) {
        return;
      }
      this.setPointerCapture(event.pointerId);
      this.setAttribute('data-active', '');
      this.#group.startInteraction(this, this.#previousPanel, this.#nextPanel, event);
    };

    #onKeyDown = (event) => {
      if (!this.#group || !this.#previousPanel || !this.#nextPanel) {
        return;
      }
      const isHorizontal = this.#orientation === 'horizontal';
      const step = keyStep(event);
      const key = event.key;
      let delta = 0;
      if ((key === 'ArrowLeft' && isHorizontal) || (key === 'ArrowUp' && !isHorizontal)) {
        delta = -step;
      } else if ((key === 'ArrowRight' && isHorizontal) || (key === 'ArrowDown' && !isHorizontal)) {
        delta = step;
      } else if (key === 'Home') {
        delta = -1000;
      } else if (key === 'End') {
        delta = 1000;
      }

      if (delta !== 0) {
        event.preventDefault();
        this.#group.nudgePanels(this.#previousPanel, this.#nextPanel, delta);
        this.#updateAriaValues();
      }
    };

    #updateOrientation() {
      const orientation = this.#orientation;
      this.toggleAttribute('data-orientation', orientation === 'vertical');
      this.setAttribute('data-orientation', orientation);
    }

    #updateHandleVisibility() {
      this.toggleAttribute('data-with-handle', this.hasAttribute('with-handle'));
    }

    #updateAriaValues() {
      if (!this.#previousPanel || !this.#nextPanel) {
        return;
      }
      const prevSize = Math.round(this.#previousPanel.size);
      const nextSize = Math.round(this.#nextPanel.size);
      this.setAttribute('aria-valuemin', String(Math.round(this.#previousPanel.minSize)));
      this.setAttribute('aria-valuemax', String(Math.round(this.#previousPanel.maxSize)));
      this.setAttribute('aria-valuenow', String(prevSize));
      this.setAttribute('aria-valuetext', `${prevSize}% and ${nextSize}%`);
    }
  }

  class WcResizableGroup extends HTMLElement {
    static get observedAttributes() {
      return ['direction'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #container;
    /** @type {HTMLSlotElement} */
    #slot;
    /** @type {Orientation} */
    #orientation = 'horizontal';
    /** @type {MutationObserver | null} */
    #observer = null;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            display: block;
            --wc-resizable-border-radius: 0.75rem;
            --wc-resizable-border-color: rgba(15, 23, 42, 0.08);
            --wc-resizable-background: rgba(255, 255, 255, 0.75);
            --wc-resizable-gap: 0;
          }

          [part="container"] {
            display: flex;
            border-radius: var(--wc-resizable-border-radius);
            border: var(--wc-resizable-border, 1px solid var(--wc-resizable-border-color));
            background: var(--wc-resizable-background);
            overflow: hidden;
            position: relative;
            gap: var(--wc-resizable-gap);
          }

          :host([data-orientation="vertical"]) [part="container"] {
            flex-direction: column;
          }
        </style>
        <div part="container" class="container">
          <slot></slot>
        </div>
      `;
      this.#container = /** @type {HTMLElement} */ (this.#root.querySelector('.container'));
      this.#slot = /** @type {HTMLSlotElement} */ (this.#root.querySelector('slot'));
    }

    connectedCallback() {
      this.setAttribute('role', 'presentation');
      upgradeProperty(this, 'direction');
      this.#applyOrientation();
      this.#setupAssignedElements();
      this.#slot.addEventListener('slotchange', this.#setupAssignedElements);
      this.#observer = new MutationObserver(this.#setupAssignedElements);
      this.#observer.observe(this, { attributes: true, childList: true, subtree: false });
    }

    disconnectedCallback() {
      this.#slot.removeEventListener('slotchange', this.#setupAssignedElements);
      this.#observer?.disconnect();
      this.#observer = null;
    }

    attributeChangedCallback() {
      this.#applyOrientation();
      this.#setupAssignedElements();
    }

    get direction() {
      return this.#orientation;
    }

    set direction(value) {
      if (value === 'vertical') {
        this.setAttribute('direction', 'vertical');
      } else {
        this.setAttribute('direction', 'horizontal');
      }
    }

    /**
     * @param {WcResizablePanel} previous
     * @param {WcResizablePanel} next
     * @param {number} deltaPercent
     */
    nudgePanels(previous, next, deltaPercent) {
      const total = previous.size + next.size;
      let nextPrev = clamp(previous.size + deltaPercent, previous.minSize, previous.maxSize);
      let nextNext = total - nextPrev;
      nextNext = clamp(nextNext, next.minSize, next.maxSize);
      nextPrev = total - nextNext;
      this.#applyPanelSizes(previous, next, nextPrev, nextNext);
    }

    /**
     * @param {WcResizableHandle} handle
     * @param {WcResizablePanel} previous
     * @param {WcResizablePanel} next
     * @param {PointerEvent} startEvent
     */
    startInteraction(handle, previous, next, startEvent) {
      startEvent.preventDefault();
      const rect = this.getBoundingClientRect();
      const total = previous.size + next.size;
      const axis = this.#orientation === 'horizontal' ? 'clientX' : 'clientY';
      const startPosition = /** @type {number} */ (startEvent[axis]);
      const previousStart = previous.size;

      const onPointerMove = (moveEvent) => {
        const currentPosition = /** @type {number} */ (moveEvent[axis]);
        const deltaPx = currentPosition - startPosition;
        const track = this.#orientation === 'horizontal' ? rect.width : rect.height;
        if (!track) {
          return;
        }
        const deltaPercent = (deltaPx / track) * 100;
        let proposedPrev = clamp(previousStart + deltaPercent, previous.minSize, previous.maxSize);
        let proposedNext = total - proposedPrev;
        proposedNext = clamp(proposedNext, next.minSize, next.maxSize);
        proposedPrev = total - proposedNext;
        this.#applyPanelSizes(previous, next, proposedPrev, proposedNext);
        handle.setAttribute('aria-valuenow', String(Math.round(previous.size)));
        handle.setAttribute('aria-valuetext', `${Math.round(previous.size)}% and ${Math.round(next.size)}%`);
      };

      const endInteraction = () => {
        handle.removeEventListener('lostpointercapture', endInteraction);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endInteraction);
        window.removeEventListener('pointercancel', endInteraction);
        handle.removeAttribute('data-active');
        if (handle.hasPointerCapture(startEvent.pointerId)) {
          handle.releasePointerCapture(startEvent.pointerId);
        }
      };

      handle.addEventListener('lostpointercapture', endInteraction, { once: true });
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endInteraction, { once: true });
      window.addEventListener('pointercancel', endInteraction, { once: true });
    }

    #setupAssignedElements = () => {
      const nodes = this.#slot
        .assignedNodes({ flatten: true })
        .filter((node) => node.nodeType === Node.ELEMENT_NODE);
      /** @type {WcResizablePanel[]} */
      const panels = [];
      /** @type {{ handle: WcResizableHandle; previous: WcResizablePanel | null; next: WcResizablePanel | null; }} */
      const handlePairs = [];

      for (const node of nodes) {
        if (node instanceof WcResizablePanel) {
          panels.push(node);
        }
      }

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        if (node instanceof WcResizableHandle) {
          let previous = null;
          let next = null;
          for (let back = index - 1; back >= 0; back -= 1) {
            const candidate = nodes[back];
            if (candidate instanceof WcResizablePanel) {
              previous = candidate;
              break;
            }
          }
          for (let forward = index + 1; forward < nodes.length; forward += 1) {
            const candidate = nodes[forward];
            if (candidate instanceof WcResizablePanel) {
              next = candidate;
              break;
            }
          }
          handlePairs.push({ handle: node, previous, next });
        }
      }

      if (panels.length === 0) {
        for (const node of nodes) {
          if (node instanceof WcResizableHandle) {
            node.detach();
          }
        }
        return;
      }

      const specifiedPanels = panels.filter((panel) => Number.isFinite(panel.defaultSize));
      const specifiedTotal = specifiedPanels.reduce(
        (total, panel) => total + (Number.isFinite(panel.defaultSize) ? Number(panel.defaultSize) : 0),
        0
      );
      const unspecifiedPanels = panels.filter((panel) => !Number.isFinite(panel.defaultSize));

      /** @type {Map<WcResizablePanel, number>} */
      const sizeMap = new Map();

      if (specifiedPanels.length === 0) {
        const equal = 100 / panels.length;
        for (const panel of panels) {
          sizeMap.set(panel, equal);
        }
      } else if (specifiedTotal >= 100 || unspecifiedPanels.length === 0) {
        const scale = specifiedTotal > 0 ? 100 / specifiedTotal : 1;
        for (const panel of panels) {
          const desired = Number.isFinite(panel.defaultSize) ? Number(panel.defaultSize) * scale : 0;
          sizeMap.set(panel, desired);
        }
      } else {
        const remaining = Math.max(100 - specifiedTotal, 0);
        const fallback = remaining / unspecifiedPanels.length;
        for (const panel of panels) {
          if (Number.isFinite(panel.defaultSize)) {
            sizeMap.set(panel, Number(panel.defaultSize));
          } else {
            sizeMap.set(panel, fallback);
          }
        }
      }

      for (const panel of panels) {
        panel.setOrientation(this.#orientation);
        const size = sizeMap.get(panel) ?? 100 / panels.length;
        panel.setSize(size);
      }

      for (const pair of handlePairs) {
        pair.handle.setOrientation(this.#orientation);
        pair.handle.attach(this, pair.previous, pair.next);
      }

      const activeHandles = new Set(handlePairs.map((pair) => pair.handle));
      for (const node of nodes) {
        if (node instanceof WcResizableHandle && !activeHandles.has(node)) {
          node.detach();
        }
      }
    };

    #applyPanelSizes(previous, next, previousSize, nextSize) {
      previous.setSize(previousSize);
      next.setSize(nextSize);
      this.dispatchEvent(
        new CustomEvent('wc-resize', {
          detail: {
            orientation: this.#orientation,
            previous,
            next,
            sizes: [previous.size, next.size]
          }
        })
      );
    }

    #applyOrientation() {
      const directionAttr = this.getAttribute('direction');
      this.#orientation = directionAttr === 'vertical' ? 'vertical' : 'horizontal';
      this.setAttribute('data-orientation', this.#orientation);
      this.#container.style.flexDirection = this.#orientation === 'vertical' ? 'column' : 'row';
    }
  }

  if (!customElements.get('wc-resizable-panel')) {
    customElements.define('wc-resizable-panel', WcResizablePanel);
  }
  if (!customElements.get('wc-resizable-handle')) {
    customElements.define('wc-resizable-handle', WcResizableHandle);
  }
  if (!customElements.get('wc-resizable-group')) {
    customElements.define('wc-resizable-group', WcResizableGroup);
  }
})();

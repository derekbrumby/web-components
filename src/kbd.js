/**
 * @file kbd.js
 * @version 1.0.0
 *
 * Keyboard key badge components inspired by the shadcn/ui kbd primitives. The
 * `<wc-kbd>` element renders a stylised keycap wrapper while `<wc-kbd-group>`
 * arranges multiple keys or separators with configurable orientation.
 *
 * Usage:
 * ```html
 * <wc-kbd>Ctrl</wc-kbd>
 * <wc-kbd-group>
 *   <wc-kbd>Ctrl</wc-kbd>
 *   <span>+</span>
 *   <wc-kbd>B</wc-kbd>
 * </wc-kbd-group>
 * ```
 */

(() => {
  const kbdTemplate = document.createElement('template');
  kbdTemplate.innerHTML = `
    <style>
      :host {
        --wc-kbd-background: rgba(15, 23, 42, 0.05);
        --wc-kbd-border-color: rgba(148, 163, 184, 0.6);
        --wc-kbd-border-width: 1px;
        --wc-kbd-border-style: solid;
        --wc-kbd-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.6);
        --wc-kbd-radius: 0.45rem;
        --wc-kbd-padding-inline: 0.5rem;
        --wc-kbd-padding-block: 0.35rem;
        --wc-kbd-font-size: 0.75rem;
        --wc-kbd-font-weight: 600;
        --wc-kbd-font-family: "SFMono-Regular", "SFMono", "JetBrains Mono", "Fira Mono", "Consolas", "Liberation Mono", monospace;
        --wc-kbd-line-height: 1.1;
        --wc-kbd-letter-spacing: 0.03em;
        --wc-kbd-color: inherit;
        --wc-kbd-min-width: 2ch;
        --wc-kbd-align-items: center;
        display: inline-flex;
        vertical-align: middle;
      }

      :host([hidden]) {
        display: none !important;
      }

      [part="surface"] {
        display: inline-flex;
        align-items: var(--wc-kbd-align-items);
        justify-content: center;
        gap: 0.25rem;
        min-inline-size: var(--wc-kbd-min-width);
        padding-inline: var(--wc-kbd-padding-inline);
        padding-block: var(--wc-kbd-padding-block);
        border-radius: var(--wc-kbd-radius);
        border: var(--wc-kbd-border-width) var(--wc-kbd-border-style) var(--wc-kbd-border-color);
        background: var(--wc-kbd-background);
        color: var(--wc-kbd-color);
        font-family: var(--wc-kbd-font-family);
        font-size: var(--wc-kbd-font-size);
        font-weight: var(--wc-kbd-font-weight);
        line-height: var(--wc-kbd-line-height);
        letter-spacing: var(--wc-kbd-letter-spacing);
        box-shadow: var(--wc-kbd-shadow);
        text-transform: var(--wc-kbd-text-transform, none);
        user-select: none;
        white-space: nowrap;
      }

      ::slotted(svg),
      ::slotted(span[role="img"]),
      ::slotted(i[role="img"]) {
        inline-size: 1em;
        block-size: 1em;
        flex-shrink: 0;
      }
    </style>
    <kbd part="surface"><slot></slot></kbd>
  `;

  /**
   * Stylised keyboard key wrapper. Renders light DOM content inside a semantic
   * `<kbd>` element with configurable padding, font, and border via CSS custom
   * properties.
   */
  class WcKbd extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.append(kbdTemplate.content.cloneNode(true));
    }
  }

  const groupTemplate = document.createElement('template');
  groupTemplate.innerHTML = `
    <style>
      :host {
        --wc-kbd-group-gap: 0.5rem;
        --wc-kbd-group-align: center;
        --wc-kbd-group-justify: flex-start;
        --wc-kbd-group-wrap: nowrap;
        display: inline-flex;
        align-items: var(--wc-kbd-group-align);
        justify-content: var(--wc-kbd-group-justify);
        gap: var(--wc-kbd-group-gap);
        flex-wrap: var(--wc-kbd-group-wrap);
      }

      :host([hidden]) {
        display: none !important;
      }

      :host([data-orientation="vertical"]) {
        flex-direction: column;
        align-items: flex-start;
      }

      [part="container"] {
        display: contents;
      }

      ::slotted(*) {
        margin: 0;
      }

      ::slotted(span),
      ::slotted(div),
      ::slotted(em),
      ::slotted(strong) {
        font: inherit;
        color: inherit;
      }
    </style>
    <slot part="container"></slot>
  `;

  /**
   * Flexible wrapper that groups keyboard badges and separators. Supports
   * horizontal and vertical orientations while maintaining consistent spacing.
   */
  class WcKbdGroup extends HTMLElement {
    static get observedAttributes() {
      return ['orientation'];
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.append(groupTemplate.content.cloneNode(true));
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }

      this.#updateOrientation();
    }

    attributeChangedCallback(name) {
      if (name === 'orientation') {
        this.#updateOrientation();
      }
    }

    /**
     * Returns the current orientation of the group.
     *
     * @returns {"horizontal" | "vertical"}
     */
    get orientation() {
      const value = this.getAttribute('orientation');
      return value === 'vertical' ? 'vertical' : 'horizontal';
    }

    set orientation(value) {
      if (value === 'vertical') {
        this.setAttribute('orientation', 'vertical');
      } else if (value === 'horizontal' || value === '' || value === null) {
        this.removeAttribute('orientation');
      }
    }

    #updateOrientation() {
      this.setAttribute('data-orientation', this.orientation);
    }
  }

  if (!customElements.get('wc-kbd')) {
    customElements.define('wc-kbd', WcKbd);
  }

  if (!customElements.get('wc-kbd-group')) {
    customElements.define('wc-kbd-group', WcKbdGroup);
  }
})();

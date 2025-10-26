/**
 * @file table.js
 * @version 1.0.0
 *
 * Responsive data table primitives that mirror the shadcn/ui table API while
 * remaining framework agnostic. The component accepts declarative child
 * elements for captions, headers, bodies, rows, and cells, and renders a fully
 * semantic `<table>` inside an auto-sized scroll container. Styling hooks are
 * exposed through CSS custom properties and `::part` selectors so consuming
 * applications can restyle the surface without breaking encapsulation.
 */

(() => {
  if (customElements.get('wc-table')) {
    return;
  }

  /**
   * Collects and clones the child nodes of an element so they can be rehydrated
   * inside the shadow DOM without disturbing the source markup.
   *
   * @param {Element} source
   * @returns {Node[]}
   */
  const cloneChildNodes = (source) =>
    Array.from(source.childNodes).map((node) => node.cloneNode(true));

  /**
   * Copies presentational attributes such as `style`, `data-*`, and `aria-*`
   * from the source element to the target.
   *
   * @param {Element} source
   * @param {Element} target
   */
  const mirrorPresentationalAttributes = (source, target) => {
    for (const name of source.getAttributeNames()) {
      if (name === 'id' || name === 'slot') {
        continue;
      }

      const value = source.getAttribute(name);
      if (name === 'style') {
        target.setAttribute('style', value ?? '');
      } else if (
        name.startsWith('data-') ||
        name.startsWith('aria-') ||
        name === 'title' ||
        name === 'abbr'
      ) {
        target.setAttribute(name, value ?? '');
      }
    }
  };

  /**
   * Base class used for declarative light DOM fragments. Each instance hides
   * itself to prevent duplicate rendering while keeping the markup available
   * for the table renderer.
   */
  class WcTableDefinition extends HTMLElement {
    constructor() {
      super();
      this.hidden = true;
      this.setAttribute('aria-hidden', 'true');
    }

    connectedCallback() {
      this.hidden = true;
      this.setAttribute('aria-hidden', 'true');
    }
  }

  class WcTable extends HTMLElement {
    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement | null} */
    #container;
    /** @type {MutationObserver} */
    #observer;
    /** @type {boolean} */
    #rendering;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --table-background: rgba(255, 255, 255, 0.86);
            --table-border-color: rgba(148, 163, 184, 0.28);
            --table-radius: 1rem;
            --table-shadow: 0 32px 64px -40px rgba(15, 23, 42, 0.35);
            --table-text-color: #0f172a;
            --table-muted-color: rgba(71, 85, 105, 0.85);
            --table-header-background: rgba(248, 250, 252, 0.9);
            --table-header-color: #0f172a;
            --table-footer-background: rgba(248, 250, 252, 0.75);
            --table-row-border: 1px solid rgba(148, 163, 184, 0.22);
            --table-row-hover: rgba(99, 102, 241, 0.08);
            --table-row-selected: rgba(79, 70, 229, 0.12);
            --table-cell-padding-block: 0.75rem;
            --table-cell-padding-inline: 1rem;
            --table-caption-color: rgba(71, 85, 105, 0.92);
            display: block;
            color: var(--table-text-color);
          }

          :host([hidden]) {
            display: none !important;
          }

          figure {
            margin: 0;
            background: var(--table-background);
            border-radius: var(--table-radius);
            border: 1px solid var(--table-border-color);
            box-shadow: var(--table-shadow);
            color: inherit;
          }

          .table-wrapper {
            overflow-x: auto;
            scrollbar-width: thin;
          }

          .table-wrapper:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.45);
            outline-offset: 4px;
          }

          .table-wrapper::-webkit-scrollbar {
            height: 0.6rem;
          }

          .table-wrapper::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.6);
            border-radius: 999px;
          }

          table {
            width: 100%;
            min-width: 40rem;
            border-collapse: collapse;
            color: inherit;
          }

          caption {
            caption-side: bottom;
            padding: 0.75rem 1rem 1rem;
            text-align: left;
            font-size: 0.9rem;
            color: var(--table-caption-color);
          }

          thead th {
            background: var(--table-header-background);
            color: var(--table-header-color);
            font-weight: 600;
            font-size: 0.9rem;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }

          tfoot td {
            background: var(--table-footer-background);
            font-weight: 600;
          }

          th,
          td {
            padding: var(--table-cell-padding-block) var(--table-cell-padding-inline);
            text-align: left;
            border-bottom: var(--table-row-border);
            vertical-align: middle;
          }

          tbody tr:hover {
            background: var(--table-row-hover);
          }

          tbody tr[data-state="selected"] {
            background: var(--table-row-selected);
          }

          td[data-align="right"],
          th[data-align="right"] {
            text-align: right;
          }

          td[data-align="center"],
          th[data-align="center"] {
            text-align: center;
          }

          @media (max-width: 720px) {
            table {
              min-width: 32rem;
            }
          }
        </style>
        <figure part="surface">
          <div class="table-wrapper" part="wrapper" data-table-root tabindex="0"></div>
        </figure>
      `;
      this.#container = this.#root.querySelector('[data-table-root]');
      this.#observer = new MutationObserver(() => this.#render());
      this.#rendering = false;
    }

    connectedCallback() {
      this.#render();
      this.#observer.observe(this, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }

    disconnectedCallback() {
      this.#observer.disconnect();
    }

    /**
     * Builds a `<tbody>`, `<thead>`, or `<tfoot>` element from a declarative
     * section definition.
     *
     * @param {HTMLElement} source
     * @param {'thead' | 'tbody' | 'tfoot'} tagName
     */
    #renderSection(source, tagName) {
      const section = document.createElement(tagName);
      const sectionPart =
        tagName === 'thead'
          ? 'section section--header'
          : tagName === 'tfoot'
          ? 'section section--footer'
          : 'section section--body';
      section.setAttribute('part', sectionPart);
      if (source.id) {
        section.id = source.id;
      }

      const rows = source.querySelectorAll(':scope > wc-table-row');
      for (const row of rows) {
        section.append(this.#renderRow(row, tagName));
      }

      return section;
    }

    /**
     * Converts a `<wc-table-row>` definition into a `<tr>` element.
     *
     * @param {HTMLElement} source
     * @param {'thead' | 'tbody' | 'tfoot'} context
     */
    #renderRow(source, context) {
      const row = document.createElement('tr');
      const rowPart =
        context === 'thead'
          ? 'row row--header'
          : context === 'tfoot'
          ? 'row row--footer'
          : 'row row--body';
      row.setAttribute('part', rowPart);

      if (source.id) {
        row.id = source.id;
      }

      if (source.hasAttribute('data-state')) {
        row.dataset.state = source.getAttribute('data-state') ?? '';
      } else if (source.hasAttribute('state')) {
        row.dataset.state = source.getAttribute('state') ?? '';
      }

      if (source.hasAttribute('aria-selected')) {
        row.setAttribute('aria-selected', source.getAttribute('aria-selected') ?? 'false');
      }

      const cells = Array.from(source.children).filter((child) =>
        child.tagName === 'WC-TABLE-CELL' || child.tagName === 'WC-TABLE-HEAD'
      );

      for (const cellSource of cells) {
        const tagName = cellSource.tagName === 'WC-TABLE-HEAD' ? 'th' : 'td';
        const cell = document.createElement(tagName);
        const cellPart =
          tagName === 'th'
            ? 'cell cell--head'
            : context === 'tfoot'
            ? 'cell cell--footer'
            : 'cell';
        cell.setAttribute('part', cellPart);

        if (cellSource.id) {
          cell.id = cellSource.id;
        }

        const alignValue = cellSource.getAttribute('align') ?? cellSource.getAttribute('data-align');
        if (alignValue) {
          cell.setAttribute('data-align', alignValue);
        }

        const colspan = cellSource.getAttribute('colspan');
        if (colspan) {
          cell.setAttribute('colspan', colspan);
        }

        const rowspan = cellSource.getAttribute('rowspan');
        if (rowspan) {
          cell.setAttribute('rowspan', rowspan);
        }

        if (tagName === 'th') {
          const scope = cellSource.getAttribute('scope') ?? (context === 'thead' ? 'col' : undefined);
          if (scope) {
            cell.setAttribute('scope', scope);
          }
        }

        mirrorPresentationalAttributes(cellSource, cell);
        cell.append(...cloneChildNodes(cellSource));
        row.append(cell);
      }

      return row;
    }

    /**
     * Re-renders the internal table when the declarative definition changes.
     */
    #render() {
      if (this.#rendering || !this.#container) {
        return;
      }

      this.#rendering = true;

      try {
        const table = document.createElement('table');
        table.setAttribute('part', 'table');
        table.setAttribute('role', 'table');

        const captionSource = this.querySelector('wc-table-caption');
        if (captionSource) {
          const caption = document.createElement('caption');
          caption.setAttribute('part', 'caption');
          mirrorPresentationalAttributes(captionSource, caption);
          caption.append(...cloneChildNodes(captionSource));
          table.append(caption);
        }

        const headerSections = this.querySelectorAll('wc-table-header');
        for (const header of headerSections) {
          table.append(this.#renderSection(header, 'thead'));
        }

        const bodySections = this.querySelectorAll('wc-table-body');
        if (bodySections.length === 0) {
          table.append(document.createElement('tbody'));
        } else {
          for (const body of bodySections) {
            table.append(this.#renderSection(body, 'tbody'));
          }
        }

        const footerSections = this.querySelectorAll('wc-table-footer');
        for (const footer of footerSections) {
          table.append(this.#renderSection(footer, 'tfoot'));
        }

        this.#container.innerHTML = '';
        this.#container.append(table);
      } finally {
        this.#rendering = false;
      }
    }
  }

  class WcTableCaption extends WcTableDefinition {}
  class WcTableHeader extends WcTableDefinition {}
  class WcTableBody extends WcTableDefinition {}
  class WcTableFooter extends WcTableDefinition {}
  class WcTableRow extends WcTableDefinition {}
  class WcTableHead extends WcTableDefinition {}
  class WcTableCell extends WcTableDefinition {}

  customElements.define('wc-table', WcTable);
  customElements.define('wc-table-caption', WcTableCaption);
  customElements.define('wc-table-header', WcTableHeader);
  customElements.define('wc-table-body', WcTableBody);
  customElements.define('wc-table-footer', WcTableFooter);
  customElements.define('wc-table-row', WcTableRow);
  customElements.define('wc-table-head', WcTableHead);
  customElements.define('wc-table-cell', WcTableCell);
})();

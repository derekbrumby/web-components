/**
 * @file data-table.js
 * @version 1.0.0
 *
 * Accessible data grid web component with sorting, filtering, pagination,
 * column visibility toggles, and row selection. Designed to mirror the
 * TanStack Table example shipped in the design spec while remaining framework
 * agnostic and dependency free.
 */

(() => {
  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        display: block;
        color: inherit;
        font-family: inherit;
        --data-table-background: #ffffff;
        --data-table-border-color: rgba(15, 23, 42, 0.12);
        --data-table-radius: 0.75rem;
        --data-table-text-color: #0f172a;
        --data-table-muted-color: #475569;
        --data-table-toolbar-gap: 0.75rem;
        --data-table-toolbar-background: transparent;
        --data-table-toolbar-padding: 0 0 1rem 0;
        --data-table-filter-background: #ffffff;
        --data-table-filter-border: 1px solid rgba(148, 163, 184, 0.35);
        --data-table-filter-radius: 0.6rem;
        --data-table-filter-padding: 0.5rem 0.75rem;
        --data-table-filter-color: inherit;
        --data-table-filter-placeholder: rgba(100, 116, 139, 0.85);
        --data-table-header-background: rgba(248, 250, 252, 0.75);
        --data-table-header-color: #1e293b;
        --data-table-header-font-weight: 600;
        --data-table-row-hover: rgba(99, 102, 241, 0.08);
        --data-table-row-selected: rgba(129, 140, 248, 0.16);
        --data-table-row-border: 1px solid rgba(148, 163, 184, 0.18);
        --data-table-pagination-gap: 0.5rem;
        --data-table-control-radius: 0.6rem;
        --data-table-control-border: 1px solid rgba(99, 102, 241, 0.3);
        --data-table-control-background: transparent;
        --data-table-control-color: inherit;
        --data-table-control-disabled-opacity: 0.45;
        --data-table-menu-background: #ffffff;
        --data-table-menu-border: 1px solid rgba(148, 163, 184, 0.25);
        --data-table-menu-radius: 0.75rem;
        --data-table-menu-shadow: 0 24px 48px -28px rgba(30, 64, 175, 0.35);
        --data-table-menu-item-hover: rgba(99, 102, 241, 0.12);
        --data-table-actions-trigger-size: 2rem;
      }

      :host([hidden]) {
        display: none !important;
      }

      .table {
        display: grid;
        gap: 1rem;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: var(--data-table-toolbar-gap);
        padding: var(--data-table-toolbar-padding);
        background: var(--data-table-toolbar-background);
        color: var(--data-table-text-color);
      }

      .toolbar__filter {
        position: relative;
        flex: 1 1 16rem;
        max-width: 24rem;
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

      .toolbar__filter input[type='search'] {
        width: 100%;
        box-sizing: border-box;
        padding: var(--data-table-filter-padding);
        border-radius: var(--data-table-filter-radius);
        border: var(--data-table-filter-border);
        background: var(--data-table-filter-background);
        color: var(--data-table-filter-color);
        font: inherit;
      }

      .toolbar__filter input[type='search']::placeholder {
        color: var(--data-table-filter-placeholder);
      }

      .toolbar__filter input[type='search']:focus-visible {
        outline: 3px solid rgba(99, 102, 241, 0.35);
        outline-offset: 2px;
      }

      .toolbar__column-picker {
        position: relative;
        margin-left: auto;
      }

      .toolbar__button {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border: var(--data-table-control-border);
        border-radius: var(--data-table-control-radius);
        background: var(--data-table-control-background);
        color: var(--data-table-control-color);
        padding: 0.45rem 0.75rem;
        font: inherit;
        cursor: pointer;
        transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
      }

      .toolbar__button:hover,
      .toolbar__button:focus-visible {
        border-color: rgba(99, 102, 241, 0.55);
        color: #3730a3;
      }

      .column-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        z-index: 10;
        min-width: 12rem;
        padding: 0.5rem;
        border-radius: var(--data-table-menu-radius);
        border: var(--data-table-menu-border);
        background: var(--data-table-menu-background);
        box-shadow: var(--data-table-menu-shadow);
        display: grid;
        gap: 0.25rem;
      }

      .column-menu[hidden] {
        display: none;
      }

      .column-menu label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--data-table-text-color);
      }

      .column-menu input[type='checkbox'] {
        width: 1rem;
        height: 1rem;
      }

      .table__surface {
        overflow: hidden;
        border-radius: var(--data-table-radius);
        border: 1px solid var(--data-table-border-color);
        background: var(--data-table-background);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
      }

      thead {
        background: var(--data-table-header-background);
        color: var(--data-table-header-color);
      }

      th,
      td {
        padding: 0.75rem 1rem;
        border-bottom: var(--data-table-row-border);
        text-align: left;
        vertical-align: middle;
      }

      tbody tr:hover {
        background: var(--data-table-row-hover);
      }

      tbody tr[data-selected='true'] {
        background: var(--data-table-row-selected);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      .header-button {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font: inherit;
        font-weight: var(--data-table-header-font-weight);
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
      }

      .header-button:focus-visible {
        outline: 3px solid rgba(99, 102, 241, 0.45);
        outline-offset: 3px;
      }

      .header-button .indicator {
        display: inline-flex;
        flex-direction: column;
        font-size: 0.6rem;
        line-height: 0.6rem;
      }

      .header-button .indicator span {
        opacity: 0.25;
      }

      th[aria-sort='ascending'] .indicator span:first-child,
      th[aria-sort='descending'] .indicator span:last-child {
        opacity: 1;
        color: #4338ca;
      }

      tbody td[data-align='right'] {
        text-align: right;
      }

      tbody td[data-align='center'] {
        text-align: center;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--data-table-muted-color);
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--data-table-pagination-gap);
        color: var(--data-table-muted-color);
      }

      .pagination__summary {
        margin-right: auto;
        color: var(--data-table-muted-color);
        font-size: 0.9rem;
      }

      .pagination__controls button {
        border: var(--data-table-control-border);
        border-radius: var(--data-table-control-radius);
        background: var(--data-table-control-background);
        color: var(--data-table-control-color);
        padding: 0.4rem 0.75rem;
        font: inherit;
        cursor: pointer;
      }

      .pagination__controls button:hover,
      .pagination__controls button:focus-visible {
        border-color: rgba(99, 102, 241, 0.55);
        color: #3730a3;
      }

      .pagination__controls button[disabled] {
        opacity: var(--data-table-control-disabled-opacity);
        cursor: not-allowed;
      }

      .selection-cell,
      .selection-header {
        width: 2.5rem;
      }

      .selection-checkbox {
        width: 1rem;
        height: 1rem;
      }

      .actions-trigger {
        width: var(--data-table-actions-trigger-size);
        height: var(--data-table-actions-trigger-size);
        border-radius: 999px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
      }

      .actions-trigger:focus-visible {
        outline: 3px solid rgba(129, 140, 248, 0.5);
        outline-offset: 2px;
      }

      .actions-menu {
        position: absolute;
        top: calc(100% + 0.35rem);
        right: 0;
        z-index: 20;
        display: grid;
        gap: 0.25rem;
        padding: 0.4rem;
        border-radius: var(--data-table-menu-radius);
        border: var(--data-table-menu-border);
        background: var(--data-table-menu-background);
        box-shadow: var(--data-table-menu-shadow);
      }

      .actions-menu[hidden] {
        display: none;
      }

      .actions-menu button {
        border: none;
        background: transparent;
        font: inherit;
        text-align: left;
        padding: 0.4rem 0.65rem;
        border-radius: 0.5rem;
        cursor: pointer;
      }

      .actions-menu button:hover,
      .actions-menu button:focus-visible {
        background: var(--data-table-menu-item-hover);
        color: #1e1b4b;
        outline: none;
      }

      .actions {
        position: relative;
      }

      @media (max-width: 720px) {
        .toolbar {
          flex-wrap: wrap;
        }

        .toolbar__filter {
          flex: 1 0 100%;
        }

        .pagination {
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }

        .pagination__summary {
          width: 100%;
          text-align: center;
          margin: 0;
        }
      }
    </style>
    <div class="table" part="container">
      <div class="toolbar" part="toolbar">
        <label class="toolbar__filter">
          <span class="sr-only">Filter results</span>
          <input type="search" data-role="filter" part="filter" placeholder="Filter rows" />
        </label>
        <div class="toolbar__column-picker" data-role="column-picker">
          <button type="button" class="toolbar__button" data-role="column-trigger" aria-expanded="false">Columns</button>
          <div class="column-menu" data-role="column-menu" hidden part="column-menu"></div>
        </div>
      </div>
      <div class="table__surface" part="surface">
        <table part="table">
          <thead part="header">
            <tr data-role="header-row"></tr>
          </thead>
          <tbody data-role="body" part="body"></tbody>
        </table>
      </div>
      <div class="pagination" part="pagination">
        <div class="pagination__summary" data-role="summary" part="selection-summary"></div>
        <div class="pagination__controls">
          <button type="button" data-role="prev" part="pagination-previous">Previous</button>
          <button type="button" data-role="next" part="pagination-next">Next</button>
        </div>
      </div>
    </div>
  `;

  /**
   * @template {Record<string, any>} T
   * @param {T} element
   * @param {keyof T} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  const ASC = 'ascending';
  const DESC = 'descending';

  /**
   * @typedef {Object} DataTableColumn
   * @property {string} id
   * @property {(row: any) => any} accessor
   * @property {(context: { column: InternalColumn }) => Node | string | null} [renderHeader]
   * @property {(context: { column: InternalColumn; row: any; value: any; rowIndex: number }) => Node | string | null} [renderCell]
   * @property {(value: any, row: any) => any} [formatter]
   * @property {(row: any, filter: string) => boolean} [filter]
   * @property {boolean} sortable
   * @property {boolean} filterable
   * @property {boolean} hideable
   * @property {boolean} visible
   * @property {'left'|'right'|'center'} align
   * @property {string} headerText
   * @property {Array<{ id: string; label: string; intent?: 'default'|'primary'|'danger'; detail?: any; action?: (row: any) => void }>} [actions]
   */

  /** @typedef {DataTableColumn & { raw: any }} InternalColumn */

  class WcDataTable extends HTMLElement {
    static get observedAttributes() {
      return ['page-size', 'filter-placeholder', 'selectable', 'row-id-key'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {InternalColumn[]} */
    #columns = [];
    /** @type {Map<string, InternalColumn>} */
    #columnMap = new Map();
    /** @type {any[]} */
    #data = [];
    /** @type {Set<string>} */
    #selection = new Set();
    /** @type {{ id: string; direction: 'ascending'|'descending' } | null} */
    #sort = null;
    /** @type {string} */
    #filter = '';
    /** @type {number} */
    #pageIndex = 0;
    /** @type {number} */
    #pageSize = 5;
    /** @type {boolean} */
    #selectable = true;
    /** @type {string} */
    #rowIdKey = 'id';
    /** @type {(row: any, index: number) => string} */
    #getRowId = (row, index) => {
      const key = this.#rowIdKey;
      const value = key && row && typeof row === 'object' ? row[key] : undefined;
      if (value == null) {
        return String(index);
      }
      return String(value);
    };
    /** @type {HTMLElement} */
    #columnMenu;
    /** @type {HTMLButtonElement} */
    #columnTrigger;
    /** @type {HTMLInputElement} */
    #filterInput;
    /** @type {HTMLTableSectionElement} */
    #thead;
    /** @type {HTMLTableSectionElement} */
    #tbody;
    /** @type {HTMLElement} */
    #summary;
    /** @type {HTMLButtonElement} */
    #prevBtn;
    /** @type {HTMLButtonElement} */
    #nextBtn;
    /** @type {(event: MouseEvent) => void} */
    #documentClickHandler;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.appendChild(TEMPLATE.content.cloneNode(true));
      this.#columnMenu = /** @type {HTMLElement} */ (this.#root.querySelector('[data-role="column-menu"]'));
      this.#columnTrigger = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[data-role="column-trigger"]'));
      this.#filterInput = /** @type {HTMLInputElement} */ (this.#root.querySelector('[data-role="filter"]'));
      this.#thead = /** @type {HTMLTableSectionElement} */ (this.#root.querySelector('[data-role="header-row"]'));
      this.#tbody = /** @type {HTMLTableSectionElement} */ (this.#root.querySelector('[data-role="body"]'));
      this.#summary = /** @type {HTMLElement} */ (this.#root.querySelector('[data-role="summary"]'));
      this.#prevBtn = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[data-role="prev"]'));
      this.#nextBtn = /** @type {HTMLButtonElement} */ (this.#root.querySelector('[data-role="next"]'));
      this.#documentClickHandler = (event) => {
        if (!this.isConnected) return;
        const target = /** @type {Node} */ (event.target);
        if (!this.#columnMenu.hidden && !this.#columnMenu.contains(target) && event.target !== this.#columnTrigger) {
          this.#toggleColumnMenu(false);
        }
        if (target instanceof HTMLElement && !target.closest('[data-role="actions"]')) {
          this.#closeAllActionMenus();
        }
      };
    }

    connectedCallback() {
      upgradeProperty(this, 'data');
      upgradeProperty(this, 'columns');
      upgradeProperty(this, 'pageSize');
      upgradeProperty(this, 'selectable');
      upgradeProperty(this, 'filterPlaceholder');
      upgradeProperty(this, 'rowIdKey');
      this.#attachEventListeners();
      this.#render();
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.#documentClickHandler, { capture: true });
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'page-size': {
          const next = Number(newValue);
          if (!Number.isNaN(next) && next > 0) {
            this.#pageSize = next;
            this.#pageIndex = 0;
            this.#render();
          }
          break;
        }
        case 'filter-placeholder': {
          const placeholder = newValue ?? '';
          if (this.#filterInput) {
            this.#filterInput.placeholder = placeholder || 'Filter rows';
          }
          break;
        }
        case 'selectable': {
          this.#selectable = newValue !== null;
          this.#render();
          break;
        }
        case 'row-id-key': {
          this.#rowIdKey = newValue || 'id';
          this.#selection.clear();
          this.#render();
          break;
        }
      }
    }

    /** @param {() => void} fn */
    #withRender(fn) {
      fn();
      this.#render();
    }

    #attachEventListeners() {
      if (this.#filterInput) {
        this.#filterInput.addEventListener('input', () => {
          this.#filter = this.#filterInput.value.trim().toLowerCase();
          this.#pageIndex = 0;
          this.#render();
        });
      }

      if (this.#columnTrigger) {
        this.#columnTrigger.addEventListener('click', () => {
          const expanded = this.#columnTrigger.getAttribute('aria-expanded') === 'true';
          this.#toggleColumnMenu(expanded);
        });
      }

      this.#thead.addEventListener('click', (event) => {
        const button = /** @type {HTMLElement|null} */ (event.target instanceof HTMLElement ? event.target.closest('[data-role="sort"]') : null);
        if (button) {
          const columnId = button.getAttribute('data-column-id');
          if (columnId) {
            this.#toggleSort(columnId);
          }
        }
        const selectAll = /** @type {HTMLInputElement|null} */ (event.target instanceof HTMLElement ? event.target.closest('[data-role="select-all"]') : null);
        if (selectAll) {
          event.preventDefault();
          const rows = this.#getPagedRows();
          if (selectAll.checked) {
            for (const row of rows) {
              this.#selection.add(row.__rowId);
            }
          } else {
            for (const row of rows) {
              this.#selection.delete(row.__rowId);
            }
          }
          this.#emitSelectionChange();
          this.#render();
        }
      });

      this.#tbody.addEventListener('change', (event) => {
        const checkbox = /** @type {HTMLInputElement|null} */ (event.target instanceof HTMLElement ? event.target.closest('[data-role="select-row"]') : null);
        if (!checkbox) return;
        const rowId = checkbox.getAttribute('data-row-id');
        if (!rowId) return;
        if (checkbox.checked) {
          this.#selection.add(rowId);
        } else {
          this.#selection.delete(rowId);
        }
        this.#emitSelectionChange();
        this.#render();
      });

      this.#tbody.addEventListener('click', (event) => {
        const trigger = /** @type {HTMLElement|null} */ (event.target instanceof HTMLElement ? event.target.closest('[data-role="actions-trigger"]') : null);
        if (trigger) {
          const rowId = trigger.getAttribute('data-row-id');
          const menu = trigger.nextElementSibling;
          if (menu instanceof HTMLElement) {
            const hidden = menu.hasAttribute('hidden');
            this.#closeAllActionMenus();
            if (hidden) {
              menu.removeAttribute('hidden');
              trigger.setAttribute('aria-expanded', 'true');
            }
          }
        }
        const actionButton = /** @type {HTMLElement|null} */ (event.target instanceof HTMLElement ? event.target.closest('[data-role="action"]') : null);
        if (actionButton) {
          const actionId = actionButton.getAttribute('data-action-id');
          const rowId = actionButton.getAttribute('data-row-id');
          if (!actionId || !rowId) return;
          const row = this.#dataWithIds().find((item) => item.__rowId === rowId);
          if (!row) return;
          const columnId = actionButton.getAttribute('data-column-id') || '';
          this.dispatchEvent(
            new CustomEvent('data-table-action', {
              bubbles: true,
              composed: true,
              detail: {
                action: actionId,
                row: row.original,
                columnId,
                rowId,
                actionLabel: actionButton.textContent?.trim() || '',
              },
            })
          );
          const column = this.#columnMap.get(columnId);
          if (column?.actions) {
            const action = column.actions.find((item) => item.id === actionId);
            if (action && typeof action.action === 'function') {
              action.action(row.original);
            }
          }
          this.#closeAllActionMenus();
        }
      });

      this.#prevBtn.addEventListener('click', () => {
        if (this.#pageIndex > 0) {
          this.#pageIndex -= 1;
          this.#render();
        }
      });

      this.#nextBtn.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(this.#applyFilters(this.#dataWithIds()).length / this.#pageSize));
        if (this.#pageIndex < totalPages - 1) {
          this.#pageIndex += 1;
          this.#render();
        }
      });
    }

    #toggleColumnMenu(forceClose) {
      const shouldClose = forceClose === true || !this.#columnMenu.hidden;
      if (shouldClose) {
        this.#columnMenu.hidden = true;
        this.#columnTrigger.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', this.#documentClickHandler, { capture: true });
      } else {
        this.#columnMenu.hidden = false;
        this.#columnTrigger.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
          document.addEventListener('click', this.#documentClickHandler, { capture: true });
        }, 0);
      }
    }

    #closeAllActionMenus() {
      const menus = this.#tbody.querySelectorAll('[data-role="actions-menu"]');
      menus.forEach((menu) => {
        if (menu instanceof HTMLElement) {
          menu.setAttribute('hidden', '');
          const trigger = menu.previousElementSibling;
          if (trigger instanceof HTMLElement && trigger.getAttribute('data-role') === 'actions-trigger') {
            trigger.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    #toggleSort(columnId) {
      const column = this.#columnMap.get(columnId);
      if (!column || !column.sortable) return;
      if (!this.#sort || this.#sort.id !== columnId) {
        this.#sort = { id: columnId, direction: ASC };
      } else if (this.#sort.direction === ASC) {
        this.#sort = { id: columnId, direction: DESC };
      } else {
        this.#sort = null;
      }
      this.#pageIndex = 0;
      this.#render();
    }

    #emitSelectionChange() {
      const selected = this.#dataWithIds().filter((row) => this.#selection.has(row.__rowId));
      const rows = selected.map((row) => row.original);
      this.dispatchEvent(
        new CustomEvent('data-table-selection-change', {
          bubbles: true,
          composed: true,
          detail: {
            rows,
            rowIds: selected.map((row) => row.__rowId),
          },
        })
      );
    }

    /** @returns {Array<{ original: any; __rowId: string }>} */
    #dataWithIds() {
      return this.#data.map((item, index) => ({ original: item, __rowId: this.#getRowId(item, index) }));
    }

    /**
     * @param {Array<{ original: any; __rowId: string }>} rows
     */
    #applyFilters(rows) {
      if (!this.#filter) return rows;
      const filterValue = this.#filter;
      return rows.filter((item) => {
        for (const column of this.#columns) {
          if (!column.visible && column.hideable) continue;
          if (!column.filterable) continue;
          if (typeof column.filter === 'function') {
            if (column.filter(item.original, filterValue)) {
              return true;
            }
          } else {
            const value = column.accessor(item.original);
            if (value == null) continue;
            const text = String(value).toLowerCase();
            if (text.includes(filterValue)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    /**
     * @param {Array<{ original: any; __rowId: string }>} rows
     */
    #applySort(rows) {
      if (!this.#sort) return rows;
      const column = this.#columnMap.get(this.#sort.id);
      if (!column) return rows;
      const sorted = [...rows];
      const direction = this.#sort.direction === ASC ? 1 : -1;
      sorted.sort((a, b) => {
        const valueA = column.accessor(a.original);
        const valueB = column.accessor(b.original);
        if (column.formatter && typeof column.formatter === 'function') {
          // Formatting may convert to comparable values (e.g. numbers)
        }
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return -direction;
        if (valueB == null) return direction;
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return (valueA - valueB) * direction;
        }
        const textA = String(valueA).toLowerCase();
        const textB = String(valueB).toLowerCase();
        if (textA < textB) return -direction;
        if (textA > textB) return direction;
        return 0;
      });
      return sorted;
    }

    #getPagedRows() {
      const withIds = this.#dataWithIds();
      const filtered = this.#applyFilters(withIds);
      const sorted = this.#applySort(filtered);
      const totalPages = Math.max(1, Math.ceil(sorted.length / this.#pageSize));
      if (this.#pageIndex >= totalPages) {
        this.#pageIndex = totalPages - 1;
      }
      const start = this.#pageIndex * this.#pageSize;
      const pageRows = sorted.slice(start, start + this.#pageSize);
      return pageRows.map((item) => ({ ...item }));
    }

    #render() {
      if (!this.isConnected) return;
      this.#filterInput.placeholder = this.filterPlaceholder || this.getAttribute('filter-placeholder') || 'Filter rows';
      if (this.#columns.length === 0) {
        this.#renderHeaders([]);
        this.#renderBody([]);
        this.#renderPagination({ total: 0, filtered: 0, pageRows: [] });
        return;
      }
      const withIds = this.#dataWithIds();
      const filtered = this.#applyFilters(withIds);
      const sorted = this.#applySort(filtered);
      const pageRows = this.#getPagedRows();
      this.#renderHeaders(pageRows);
      this.#renderBody(pageRows);
      this.#renderColumnMenu();
      this.#renderPagination({ total: withIds.length, filtered: filtered.length, pageRows });
    }

    /**
     * @param {Array<{ original: any; __rowId: string }>} pageRows
     */
    #renderHeaders(pageRows) {
      this.#thead.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const columns = this.#getVisibleColumns();
      if (this.#selectable) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.classList.add('selection-header');
        th.setAttribute('part', 'header-cell');
        const label = document.createElement('label');
        label.classList.add('sr-only');
        label.textContent = 'Select all on page';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('selection-checkbox');
        checkbox.setAttribute('data-role', 'select-all');
        checkbox.setAttribute('aria-label', 'Select page');
        const selectedOnPage = pageRows.filter((row) => this.#selection.has(row.__rowId));
        checkbox.checked = selectedOnPage.length > 0 && selectedOnPage.length === pageRows.length;
        checkbox.indeterminate = selectedOnPage.length > 0 && selectedOnPage.length < pageRows.length;
        th.appendChild(checkbox);
        fragment.appendChild(th);
      }
      for (const column of columns) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.setAttribute('part', 'header-cell');
        if (column.align === 'right') th.dataset.align = 'right';
        if (column.align === 'center') th.dataset.align = 'center';
        if (column.sortable) {
          th.setAttribute('aria-sort', this.#sort && this.#sort.id === column.id ? this.#sort.direction : 'none');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'header-button';
          button.setAttribute('data-role', 'sort');
          button.setAttribute('data-column-id', column.id);
          const label = column.renderHeader
            ? column.renderHeader({ column })
            : column.headerText;
          if (label instanceof Node) {
            button.appendChild(label);
          } else {
            const span = document.createElement('span');
            span.textContent = label ?? column.id;
            button.appendChild(span);
          }
          const indicator = document.createElement('span');
          indicator.className = 'indicator';
          indicator.innerHTML = '<span>▲</span><span>▼</span>';
          button.appendChild(indicator);
          th.appendChild(button);
        } else {
          const content = column.renderHeader ? column.renderHeader({ column }) : column.headerText;
          if (content instanceof Node) {
            th.appendChild(content);
          } else {
            th.textContent = content ?? column.id;
          }
        }
        fragment.appendChild(th);
      }
      this.#thead.appendChild(fragment);
    }

    /**
     * @param {Array<{ original: any; __rowId: string }>} pageRows
     */
    #renderBody(pageRows) {
      this.#tbody.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const columns = this.#getVisibleColumns();
      if (pageRows.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = columns.length + (this.#selectable ? 1 : 0);
        cell.className = 'empty-state';
        cell.setAttribute('part', 'empty');
        cell.textContent = 'No results.';
        row.appendChild(cell);
        fragment.appendChild(row);
        this.#tbody.appendChild(fragment);
        return;
      }
      pageRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-row-id', row.__rowId);
        const isSelected = this.#selection.has(row.__rowId);
        tr.dataset.selected = String(isSelected);
        tr.setAttribute('part', 'row');
        if (this.#selectable) {
          const td = document.createElement('td');
          td.classList.add('selection-cell');
          td.setAttribute('part', 'cell');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'selection-checkbox';
          checkbox.checked = isSelected;
          checkbox.setAttribute('data-role', 'select-row');
          checkbox.setAttribute('data-row-id', row.__rowId);
          checkbox.setAttribute('aria-label', 'Select row');
          td.appendChild(checkbox);
          tr.appendChild(td);
        }
        columns.forEach((column) => {
          const td = document.createElement('td');
          td.setAttribute('part', 'cell');
          if (column.align) {
            td.dataset.align = column.align;
          }
          if (column.actions && column.actions.length > 0) {
            td.classList.add('actions');
            const trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'actions-trigger';
            trigger.setAttribute('data-role', 'actions-trigger');
            trigger.setAttribute('data-row-id', row.__rowId);
            trigger.setAttribute('data-column-id', column.id);
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-label', 'Open row actions');
            trigger.textContent = '⋯';
            const menu = document.createElement('div');
            menu.className = 'actions-menu';
            menu.setAttribute('hidden', '');
            menu.setAttribute('data-role', 'actions-menu');
            column.actions.forEach((action) => {
              const button = document.createElement('button');
              button.type = 'button';
              button.setAttribute('data-role', 'action');
              button.setAttribute('data-action-id', action.id);
              button.setAttribute('data-row-id', row.__rowId);
              button.setAttribute('data-column-id', column.id);
              button.textContent = action.label;
              menu.appendChild(button);
            });
            td.appendChild(trigger);
            td.appendChild(menu);
          } else {
            const value = column.accessor(row.original);
            const rendered = column.renderCell
              ? column.renderCell({ column, row: row.original, value, rowIndex: index })
              : column.formatter
              ? column.formatter(value, row.original)
              : value;
            if (rendered instanceof Node) {
              td.appendChild(rendered);
            } else if (rendered != null) {
              td.textContent = String(rendered);
            } else {
              td.textContent = '';
            }
          }
          tr.appendChild(td);
        });
        fragment.appendChild(tr);
      });
      this.#tbody.appendChild(fragment);
    }

    #renderColumnMenu() {
      this.#columnMenu.innerHTML = '';
      const columns = this.#columns.filter((column) => column.hideable);
      if (columns.length === 0) {
        const note = document.createElement('p');
        note.textContent = 'All columns are fixed.';
        note.setAttribute('part', 'column-menu-empty');
        note.style.fontSize = '0.85rem';
        note.style.color = 'var(--data-table-muted-color)';
        this.#columnMenu.appendChild(note);
        return;
      }
      columns.forEach((column) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = column.visible;
        checkbox.addEventListener('change', () => {
          column.visible = checkbox.checked;
          this.#render();
        });
        const span = document.createElement('span');
        span.textContent = column.headerText;
        label.appendChild(checkbox);
        label.appendChild(span);
        this.#columnMenu.appendChild(label);
      });
    }

    /**
     * @param {{ total: number; filtered: number; pageRows: Array<{ original: any; __rowId: string }> }} state
     */
    #renderPagination(state) {
      if (this.#selectable) {
        const totalSelectedFiltered = this.#applyFilters(this.#dataWithIds()).reduce(
          (count, row) => (this.#selection.has(row.__rowId) ? count + 1 : count),
          0
        );
        this.#summary.textContent = `${totalSelectedFiltered} of ${state.filtered} row(s) selected.`;
      } else {
        const start = state.filtered === 0 ? 0 : this.#pageIndex * this.#pageSize + 1;
        const end = Math.min(state.filtered, (this.#pageIndex + 1) * this.#pageSize);
        this.#summary.textContent = `Showing ${start === 0 ? 0 : start}-${end} of ${state.filtered} row(s).`;
      }
      const totalPages = Math.max(1, Math.ceil(state.filtered / this.#pageSize));
      this.#prevBtn.disabled = this.#pageIndex === 0;
      this.#nextBtn.disabled = this.#pageIndex >= totalPages - 1;
      this.#prevBtn.setAttribute('aria-label', 'Go to previous page');
      this.#nextBtn.setAttribute('aria-label', 'Go to next page');
      this.#summary.setAttribute('aria-live', 'polite');
    }

    /** @returns {InternalColumn[]} */
    #getVisibleColumns() {
      return this.#columns.filter((column) => column.visible || !column.hideable);
    }

    /**
     * @param {any[]} value
     */
    set columns(value) {
      const previousVisibility = new Map(this.#columns.map((column) => [column.id, column.visible]));
      const sanitised = Array.isArray(value) ? value : [];
      this.#columns = sanitised.map((column, index) => this.#normaliseColumn(column, index, previousVisibility));
      this.#columnMap = new Map(this.#columns.map((column) => [column.id, column]));
      this.#render();
    }

    get columns() {
      return this.#columns.map((column) => ({ ...column.raw }));
    }

    /**
     * @param {any[]} value
     */
    set data(value) {
      const array = Array.isArray(value) ? value : [];
      this.#data = array;
      const validIds = new Set(this.#dataWithIds().map((row) => row.__rowId));
      for (const id of [...this.#selection]) {
        if (!validIds.has(id)) {
          this.#selection.delete(id);
        }
      }
      this.#pageIndex = 0;
      this.#render();
    }

    get data() {
      return [...this.#data];
    }

    set pageSize(value) {
      const next = Number(value);
      if (!Number.isNaN(next) && next > 0) {
        this.#pageSize = next;
        this.setAttribute('page-size', String(next));
        this.#pageIndex = 0;
        this.#render();
      }
    }

    get pageSize() {
      return this.#pageSize;
    }

    set selectable(value) {
      this.#selectable = Boolean(value);
      if (this.#selectable) {
        this.setAttribute('selectable', '');
      } else {
        this.removeAttribute('selectable');
        this.#selection.clear();
      }
      this.#render();
    }

    get selectable() {
      return this.#selectable;
    }

    set filterPlaceholder(value) {
      const placeholder = value == null ? '' : String(value);
      if (placeholder) {
        this.setAttribute('filter-placeholder', placeholder);
      } else {
        this.removeAttribute('filter-placeholder');
      }
      if (this.#filterInput) {
        this.#filterInput.placeholder = placeholder || 'Filter rows';
      }
    }

    get filterPlaceholder() {
      return this.getAttribute('filter-placeholder') || '';
    }

    set rowIdKey(value) {
      this.#rowIdKey = value || 'id';
      if (value) {
        this.setAttribute('row-id-key', value);
      } else {
        this.removeAttribute('row-id-key');
      }
      this.#selection.clear();
      this.#render();
    }

    get rowIdKey() {
      return this.#rowIdKey;
    }

    get selectedRows() {
      const withIds = this.#dataWithIds();
      return withIds.filter((row) => this.#selection.has(row.__rowId)).map((row) => row.original);
    }

    /**
     * @param {any} column
     * @param {number} index
     * @param {Map<string, boolean>} previousVisibility
     * @returns {InternalColumn}
     */
    #normaliseColumn(column, index, previousVisibility) {
      const raw = column ?? {};
      const idCandidate = raw.id ?? raw.key ?? raw.accessor ?? `column-${index}`;
      const id = String(idCandidate);
      const headerText = typeof raw.header === 'string' ? raw.header : this.#toTitle(id);
      /** @type {(row: any) => any} */
      let accessor;
      if (typeof raw.accessor === 'function') {
        accessor = raw.accessor;
      } else if (typeof raw.accessor === 'string') {
        accessor = (row) => (row ? row[raw.accessor] : undefined);
      } else {
        accessor = (row) => (row ? row[id] : undefined);
      }
      /** @type {(context: { column: InternalColumn }) => Node | string | null} */
      const renderHeader = typeof raw.renderHeader === 'function' ? raw.renderHeader : typeof raw.header === 'function' ? raw.header : undefined;
      /** @type {(context: { column: InternalColumn; row: any; value: any; rowIndex: number }) => Node | string | null} */
      const renderCell = typeof raw.renderCell === 'function' ? raw.renderCell : undefined;
      /** @type {(value: any, row: any) => any} */
      const formatter = typeof raw.formatter === 'function' ? raw.formatter : undefined;
      /** @type {(row: any, filter: string) => boolean} */
      const filter = typeof raw.filter === 'function' ? raw.filter : undefined;
      const sortable = Boolean(raw.sortable);
      const filterable = raw.filterable !== undefined ? Boolean(raw.filterable) : true;
      const hideable = raw.hideable !== undefined ? Boolean(raw.hideable) : true;
      const visible = raw.visible !== undefined ? Boolean(raw.visible) : previousVisibility.get(id) ?? true;
      const align = raw.align === 'right' || raw.align === 'center' ? raw.align : 'left';
      const actions = Array.isArray(raw.actions)
        ? raw.actions.map((action, actionIndex) => ({
            id: String(action?.id ?? `${id}-action-${actionIndex}`),
            label: String(action?.label ?? 'Action'),
            detail: action?.detail,
            intent: action?.intent,
            action: typeof action?.action === 'function' ? action.action : undefined,
          }))
        : undefined;
      return {
        id,
        headerText,
        accessor,
        renderHeader,
        renderCell,
        formatter,
        filter,
        sortable,
        filterable,
        hideable,
        visible,
        align,
        actions,
        raw,
      };
    }

    #toTitle(value) {
      return value
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, (_, a, b) => `${a} ${b}`)
        .replace(/^\w/, (char) => char.toUpperCase());
    }
  }

  if (!customElements.get('wc-data-table')) {
    customElements.define('wc-data-table', WcDataTable);
  }
})();

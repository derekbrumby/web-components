# Web Components

A curated collection of zero-dependency Web Components built to drop directly into any project. Each
module in [`src/`](./src) self-registers its custom element, exposes typed public APIs through JSDoc,
and ships in a format that works out of the box from a CDN or your preferred bundler.

## Table of contents

- [Getting started](#getting-started)
  - [Use from a CDN](#use-from-a-cdn)
  - [Run the local demos](#run-the-local-demos)
- [Component catalogue](#component-catalogue)
  - [Data display](#data-display)
  - [Inputs & forms](#inputs--forms)
  - [Navigation](#navigation)
  - [Layout & structure](#layout--structure)
  - [Feedback & overlays](#feedback--overlays)
  - [Utilities](#utilities)
- [Detailed reference](#detailed-reference)
  - [`<wc-markdown-viewer>`](#wc-markdown-viewer)
  - [`<wc-code-viewer>`](#wc-code-viewer)
  - [`<wc-chart>`](#wc-chart)
  - [Chart variants](#chart-variants)
  - [`<wc-data-table>`](#wc-data-table)
  - [`<wc-table>`](#wc-table)
  - [`<wc-form>`](#wc-form)
  - [`<wc-field>`](#wc-field)
  - [`<wc-checkbox>`](#wc-checkbox)
  - [`<wc-input-group>`](#wc-input-group)
  - [`<wc-spinner>`](#wc-spinner)
  - [`<wc-skeleton>`](#wc-skeleton)
  - [`<wc-countdown>`](#wc-countdown)
  - [`<wc-diff>`](#wc-diff)
- [`<wc-badge>`](#wc-badge)
- [`<wc-chat-message>`](#wc-chat-message)
- [`<wc-button>`](#wc-button)
- [`<wc-input>`](#wc-input)
- [`<wc-file-input>`](#wc-file-input)
- [`<wc-alert>`](#wc-alert)
- [`<wc-kbd>` & `<wc-kbd-group>`](#wc-kbd--wc-kbd-group)
- [`<wc-label>`](#wc-label)
- [`<wc-textarea>`](#wc-textarea)
- [`<wc-rating>`](#wc-rating)
- [`<wc-ascii-icon>`](#wc-ascii-icon)
- [`<wc-separator>`](#wc-separator)
- [`<qr-code>`](#qr-code)

## Getting started

### Use from a CDN

Every component ships as an ES module that can be imported straight from a CDN. Reference only the
modules you need:

```html
<script type="module" src="https://cdn.example.com/web-components/button.js"></script>
<script type="module" src="https://cdn.example.com/web-components/tooltip.js"></script>
```

Once the module is loaded the custom element is available globally:

```html
<wc-button variant="outline">Save changes</wc-button>
<wc-tooltip for="submit-button">Send now</wc-tooltip>
```

### Run the local demos

1. Clone this repository.
2. Open [`index.html`](./index.html) in your browser.
3. Explore the live demos that showcase each component and its configurable options.

No build step is required—the examples load the modules directly from `src/`.

## Component catalogue

The library covers a wide range of UI patterns. Browse the tables below for a quick overview and jump
to the detailed reference for deeper usage notes.

### Data display

| Component | Summary | Reference |
| --- | --- | --- |
| `<wc-chart>` | Responsive grouped bar chart with keyboard-friendly tooltips. | [Docs](#wc-chart) |
| `<wc-area-chart>` / `<wc-line-chart>` / `<wc-pie-chart>` / `<wc-radar-chart>` / `<wc-radial-chart>` | SVG chart variants that reuse the base chart API. | [Docs](#chart-variants) |
| `<wc-data-table>` | Headless data grid with sorting, filters, pagination, and row actions. | [Docs](#wc-data-table) |
| `<wc-table>` | Responsive table surface with caption, header, body, and footer primitives. | [Docs](#wc-table) |
| `<wc-card>` | Flexible content container mirroring shadcn/ui card styling. | — |
| `<wc-pricing-card>` | Pricing layout with highlighted tiers and call-to-action slots. | — |
| `<wc-carousel>` | Accessible carousel with autoplay controls and pagination dots. | — |
| `<wc-progress>` | Determinate and indeterminate progress indicator with ARIA semantics. | — |
| `<wc-diff>` | Before/after comparison slider for images or text. | — |
| `<wc-skeleton>` | Shimmering skeleton placeholder for loading states. | [Docs](#wc-skeleton) |
| `<wc-spinner>` | Polite loading spinner with customisable stroke and messaging. | [Docs](#wc-spinner) |
| `<wc-countdown>` | Animated numeric ticker for timers and stat transitions. | [Docs](#wc-countdown) |
| `<wc-ascii-icon>` | Converts single-colour SVG paths into scalable ASCII art glyphs. | [Docs](#wc-ascii-icon) |

### Inputs & forms

| Component | Summary | Reference |
| --- | --- | --- |
| `<wc-form>` | Drop-in contact form with validation helpers and error slots. | [Docs](#wc-form) |
| `<wc-input>` | Single-line input with file support and shadcn-inspired styling. | [Docs](#wc-input) |
| `<wc-file-input>` | Styled file picker with colour, size, and ghost variants. | [Docs](#wc-file-input) |
| `<wc-checkbox>` | Tri-state checkbox with form association. | [Docs](#wc-checkbox) |
| `<wc-radio-group>` | Accessible radio group mirroring Radix UI behaviour. | — |
| `<wc-toggle-group>` | Single or multi-select toggle buttons. | — |
| `<wc-button-group>` | Toolbar-aligned button group with roving tabindex. | — |
| `<wc-combobox>` | Filterable combo box backed by native listbox semantics. | — |
| `<wc-select>` | Custom select with searchable list and keyboard support. | — |
| `<wc-slider>` | Single or range slider with custom styling. | — |
| `<wc-rating>` | Star rating input with fractional values and colour palettes. | — |
| `<wc-switch>` | Toggle switch with form integration and ARIA roles. | — |
| `<wc-otp-field>` | Multi-input one-time passcode entry with auto-focus handling. | — |
| `<wc-password-toggle-field>` | Password input that exposes a reveal button. | — |
| `<wc-input-group>` suite | Compose inputs, text, and buttons with shared focus and styling. | [Docs](#wc-input-group) |

### Navigation

| Component | Summary |
| --- | --- |
| `<wc-navigation-menu>` | Top-level navigation with animated submenus. |
| `<wc-sidebar>` | Collapsible sidebar scaffold with resize handle integration. |
| `<wc-breadcrumb>` | Breadcrumb trail with separator slots. |
| `<wc-menubar>` | Horizontal menu bar with keyboard navigation. |
| `<wc-dropdown-menu>` / `<wc-context-menu>` | Menu primitives driven by the same API. |
| `<wc-tabs>` | Roving tabindex tabs with animation hooks. |
| `<wc-toolbar>` | Toolbar container with roving focus management. |
| `<wc-pagination>` | Paginates collections with summary text and ellipsis handling. |
| `<wc-tooltip>` | Tooltip primitive for hover and focus affordances. |
| `<wc-popover>` / `<wc-hover-card>` | Rich overlays for contextual content. |

### Layout & structure

| Component | Summary |
| --- | --- |
| `<wc-separator>` | Semantic divider with vertical orientation support. |
| `<wc-item>` | Flex-based item rows with media, titles, descriptions, and actions. |
| `<wc-resizable>` | Wrapper that turns any element into a draggable resizable panel. |
| `<wc-drawer>` | Sliding panel with trap-focus behaviour. |
| `<wc-sheet>` | Dialog-inspired sheet for supplementary workflows. |
| `<wc-dialog>` / `<wc-alert-dialog>` | Modal primitives with configurable titles, descriptions, and actions. |
| `<wc-aspect-ratio>` | Enforces intrinsic ratios for responsive media. |
| `<wc-avatar>` | Avatar component with fallbacks and status badges. |
| `<wc-chat-message>` | Chat bubble line item with avatar, metadata, and colour variants. |
| `<wc-mockup-phone>` | Presentation frame for screenshot marketing. |
| `<wc-calendar>` / `<wc-date-picker>` | Calendar grid and date picker built on the same foundation. |
| `<wc-accordion>` / `<wc-collapsible>` | Disclosure widgets for stacked or inline content. |

### Feedback & overlays

| Component | Summary |
| --- | --- |
| `<wc-alert>` | Inline callouts for success, info, or destructive messaging. |
| `<wc-toast>` | Toast notifications with queueing support. |
| `<wc-sonner>` | Opinionated multi-type toaster with promise helpers. [Docs](#wc-sonner) |
| `<wc-audio-player>` | Minimal audio player with timeline and volume controls. |
| `<wc-progress>` | Visualises task completion. |
| `<wc-spinner>` | Loading spinner with accessible announcements. |
| `<wc-skeleton>` | Loading placeholder that maintains layout structure. |

### Utilities

| Component | Summary | Reference |
| --- | --- | --- |
| `<wc-markdown-viewer>` | Renders sanitised Markdown from inline strings or remote files. | [Docs](#wc-markdown-viewer) |
| `<wc-code-viewer>` | Syntax highlighted code blocks with remote loading support. | [Docs](#wc-code-viewer) |
| `<qr-code>` | Generates an SVG QR code for URLs or text values. | [Docs](#qr-code) |
| `<wc-label>` | Accessible label helper that mirrors native `<label>` semantics. | [Docs](#wc-label) |
| `<wc-kbd>` / `<wc-kbd-group>` | Inline keyboard hints styled like keycaps. | [Docs](#wc-kbd--wc-kbd-group) |
| `<wc-badge>` | Pill-style badges and status chips. | [Docs](#wc-badge) |
| `<wc-button>` | Styled action button or anchor element with variant support. | [Docs](#wc-button) |
| `<wc-toolbar>` | Toolbar container with roving tabindex. | — |
| `<wc-scroll-area>` | Scrollable viewport with styled scrollbar track. | — |

## Detailed reference

### `<wc-markdown-viewer>`

Render Markdown from an inline string or fetch it from a remote `.md` file while keeping the output
sanitised. Slots expose loading and empty states so the component integrates neatly with dynamic
content.

```html
<script type="module" src="https://cdn.example.com/web-components/markdown-viewer.js"></script>

<wc-markdown-viewer markdown="# Hello!\nBuilt for CDN delivery."></wc-markdown-viewer>

<wc-markdown-viewer src="/docs/welcome.md">
  <span slot="loading">Loading documentation…</span>
</wc-markdown-viewer>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `markdown` | string | `""` | Inline Markdown string rendered immediately. Escaped newlines are normalised. |
| `src` | string | `""` | URL pointing to a Markdown resource that will be fetched and rendered. |

#### Slots

- _(default)_ — Optional fallback Markdown text when neither `markdown` nor `src` provide content.
- `loading` — Displayed while a remote `src` document loads.

#### Events

- `markdown-loadstart` — Fired when a remote request begins. `event.detail` includes `{ source }`.
- `markdown-load` — Emitted after fetching content. `event.detail.markdown` contains the raw string.
- `markdown-error` — Fired when fetching fails. `event.detail.error` exposes the thrown error.

#### Styling hooks

- Custom properties: `--markdown-viewer-color`, `--markdown-viewer-background`,
  `--markdown-viewer-padding`, `--markdown-viewer-code-background`, `--markdown-viewer-code-color`,
  `--markdown-viewer-inline-code-background`, `--markdown-viewer-inline-code-color`,
  `--markdown-viewer-link-color`, `--markdown-viewer-heading-margin`, and more.
- Parts: `::part(container)`, `::part(empty)`, `::part(error)`.

### `<wc-code-viewer>`

Render syntax-highlighted code blocks from inline snippets or remote files. The element dedents light
DOM content, infers languages from filenames or shebangs, and exposes a loading slot for remote
requests.

```html
<script type="module" src="https://cdn.example.com/web-components/code-viewer.js"></script>

<wc-code-viewer language="ts">
import { createSignal } from 'solid-js';

export const useCounter = () => {
  const [count, setCount] = createSignal(0);
  return { count, increment: () => setCount((value) => value + 1) };
};
</wc-code-viewer>

<wc-code-viewer id="demo-viewer"></wc-code-viewer>
<script type="module">
  const viewer = document.querySelector('#demo-viewer');
  viewer.code = "console.log('Shipped as a standalone module');";
</script>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | string | `""` | Inline code string rendered immediately. Escaped newlines are normalised. |
| `src` | string | `""` | URL to fetch when remote code should be displayed. Only `http:` and `https:` schemes are allowed. |
| `language` | string | `""` | Optional syntax hint (e.g. `javascript`, `typescript`, `css`, `html`, `json`, `python`, `shell`, `yaml`). |
| `filename` | string | `""` | Hint used when inferring the language for inline snippets (e.g. `example.ts`). |

#### Slots

- `loading` — Displayed while a remote `src` file is being fetched.

#### Events

- `code-loadstart` — Fired when a remote request begins. `event.detail` includes `{ source }`.
- `code-load` — Emitted after fetching content. `event.detail.code` contains the raw string.
- `code-error` — Fired when fetching fails. `event.detail.error` surfaces the thrown error.

#### Styling hooks

- CSS custom properties: `--code-viewer-background`, `--code-viewer-foreground`,
  `--code-viewer-padding`, `--code-viewer-radius`, `--code-viewer-shadow`,
  `--code-viewer-font-family`, `--code-viewer-font-size`, `--code-viewer-comment-color`,
  `--code-viewer-keyword-color`, `--code-viewer-string-color`, `--code-viewer-number-color`,
  `--code-viewer-attribute-color`, `--code-viewer-tag-color`, `--code-viewer-entity-color`,
  `--code-viewer-variable-color`, `--code-viewer-punctuation-color`, `--code-viewer-accent`.
- Parts: `::part(container)`, `::part(surface)`, `::part(code)`, `::part(empty)`, `::part(error)`.

### `<qr-code>`

Render a crisp SVG QR code for URLs or arbitrary text. The component wraps a battle-tested encoder and
lets you tweak size, quiet zone, and error correction without additional dependencies.

```html
<script type="module" src="https://cdn.example.com/web-components/qr-code.js"></script>

<qr-code value="https://example.com" size="180" error-correction="H">
  <span>Scan to visit our docs</span>
</qr-code>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Data encoded in the QR code. Supports UTF-8 strings such as URLs. |
| `size` | number | `160` | Render size in CSS pixels for the square SVG. |
| `quiet-zone` | number | `4` | Padding around the QR modules, measured in module units. |
| `error-correction` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction strength following the QR specification. |

#### Slots

- _(default)_ — Optional caption or instructions displayed beneath the QR code.

#### Events

- `qr-code-error` — Fired if encoding fails. `event.detail` carries the error message.

#### Styling hooks

- Custom properties: `--qr-background`, `--qr-foreground`, `--qr-size`.
- Parts: `::part(container)`.

### `<wc-chart>`

Render responsive grouped bar charts without shipping a client-side framework. Configure each data
series with human-readable labels and colours, then pass data objects to plot your metrics.

```html
<script type="module" src="https://cdn.example.com/web-components/chart.js"></script>

<wc-chart id="sessions-chart" caption="Monthly sessions"></wc-chart>
<script type="module">
  const chart = document.querySelector('#sessions-chart');
  chart.categoryKey = 'month';
  chart.config = {
    desktop: { label: 'Desktop', color: 'hsl(221 83% 53%)' },
    mobile: { label: 'Mobile', color: 'hsl(213 94% 68%)' },
  };
  chart.data = [
    { month: 'January', desktop: 186, mobile: 80 },
    { month: 'February', desktop: 305, mobile: 200 },
    { month: 'March', desktop: 237, mobile: 120 },
  ];
</script>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | string | `[]` | JSON-serialised array of records rendered as bars. Prefer the property for large datasets. |
| `config` | string | `{}` | JSON-serialised object describing each series (`{ [key]: { label, color } }`). |
| `category-key` | string | `"category"` | Property name on each record used for the x-axis label. |
| `caption` | string | `""` | Optional label announced with the chart when `aria-label` is not provided. |
| `hide-legend` | boolean | `false` | Hides the legend element. Toggle via the `hideLegend` property at runtime. |

Set the `data`, `config`, `categoryKey`, and `hideLegend` properties from JavaScript for richer
interactivity.

#### Styling hooks

- CSS custom properties: `--wc-chart-background`, `--wc-chart-foreground`, `--wc-chart-border`,
  `--wc-chart-grid`, `--wc-chart-muted`, `--wc-chart-tooltip-background`,
  `--wc-chart-tooltip-foreground`, `--wc-chart-tooltip-muted`, `--wc-chart-bar-radius`.
- Parts: `::part(container)`, `::part(chart)`, `::part(legend)`, `::part(tooltip)`, `::part(empty)`.

#### Accessibility

- Bars are focusable and support keyboard-triggered tooltips (Space/Enter to show, Escape to hide).
- Tooltips expose the current category and series values while legends provide textual colour keys.
- Provide an `aria-label` or `caption` for screen-reader-friendly summaries.

### Chart variants

Import [`chart-variants.js`](./src/chart-variants.js) once and access five focused custom elements for
area, line, pie, radar, and radial bar visualisations. Each element mirrors the API surface of
`<wc-chart>` so you can reuse the same `data` and `config` objects across chart types.

```html
<script type="module" src="https://cdn.example.com/web-components/chart-variants.js"></script>

<wc-area-chart id="traffic-area" caption="Stacked traffic by device" category-key="date"></wc-area-chart>
<script type="module">
  const chart = document.querySelector('#traffic-area');
  chart.config = {
    desktop: { label: 'Desktop', color: 'hsl(221 83% 53%)' },
    mobile: { label: 'Mobile', color: 'hsl(213 94% 68%)' },
  };
  chart.data = [
    { date: '2024-06-01', desktop: 178, mobile: 200 },
    { date: '2024-06-02', desktop: 470, mobile: 410 },
    { date: '2024-06-03', desktop: 103, mobile: 160 },
  ];
</script>
```

#### Shared attributes & properties

| Name | Applies to | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `data` | all | string | `[]` | JSON-serialised array of records. Prefer the property setter for large datasets. |
| `config` | all | string | `{}` | JSON-serialised object describing each series (`{ [key]: { label, color } }`). |
| `caption` | all | string | `""` | Optional label surfaced to assistive tech when `aria-label` is not set. |
| `legend` | all | boolean | `true` | Toggle the legend. Set `legend="false"` or `element.legend = false` to hide it. |

#### Axis-based charts (`<wc-area-chart>`, `<wc-line-chart>`, `<wc-radar-chart>`)

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `category-key` | string | `"category"` | Property name used for category labels (x-axis for area/line, spokes for radar). |
| `stacked` | boolean | `true` | (Area only) When `false`, each series renders independently instead of stacking. |
| `curve` | string | `"linear"` | (Area/line) Set to `"smooth"` for monotone cubic interpolation between points. |

Toggle the `curve` attribute or property at runtime to transition between angular (`"linear"`) and
smoothed (`"smooth"`) area and line charts without reconfiguring the dataset.

#### Pie & radial charts

Provide data objects with `value` (or `visitors`) keys and optional `label` (or `name`) properties.
Colours can be provided in the dataset (`{ color: "hsl(...)" }`) or through the shared `config`
object using matching keys.

#### Styling hooks

- CSS custom properties: `--wc-chart-background`, `--wc-chart-foreground`, `--wc-chart-border`,
  `--wc-chart-grid`, `--wc-chart-muted`, `--wc-chart-tooltip-background`,
  `--wc-chart-tooltip-foreground`, `--wc-chart-tooltip-muted`.
- Parts: `::part(container)`, `::part(body)`, `::part(svg)`, `::part(legend)`, `::part(tooltip)`.

#### Accessibility

- Charts expose grouped roles and fall back to the `caption` or `aria-label` for assistive copy.
- Tooltips follow pointer interactions to reveal series breakdowns without requiring focus shifts.
- Provide short, descriptive captions for each chart to summarise the metric being visualised.

### `<wc-data-table>`

Build interactive data grids with sortable columns, filtering, pagination, column visibility controls,
and row actions. The component embraces headless patterns so you can describe columns and data via
JavaScript without shipping a framework runtime.

```html
<script type="module" src="https://cdn.example.com/web-components/data-table.js"></script>

<wc-data-table id="payments-table" page-size="5" filter-placeholder="Filter emails…"></wc-data-table>
<script type="module">
  const table = document.querySelector('#payments-table');
  table.columns = [
    { id: 'status', header: 'Status', accessor: 'status', sortable: true },
    { id: 'email', header: 'Email', accessor: 'email', sortable: true, filterable: true },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      align: 'right',
      sortable: true,
      formatter: (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    },
    {
      id: 'actions',
      accessor: () => '',
      hideable: false,
      actions: [
        { id: 'copy-id', label: 'Copy payment ID', action: (row) => navigator.clipboard?.writeText?.(row.id ?? '') },
        { id: 'view-details', label: 'View payment details' }
      ]
    }
  ];
  table.data = [
    { id: 'm5gr84i9', amount: 316, status: 'success', email: 'ken99@example.com' },
    { id: '3u1reuv4', amount: 242, status: 'success', email: 'abe45@example.com' }
  ];
</script>
```

#### Attributes

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `page-size` | number | `5` | Number of rows rendered per page before pagination kicks in. |
| `filter-placeholder` | string | `"Filter rows"` | Customises the placeholder copy for the search input. |
| `selectable` | boolean | `true` | When present the table renders a checkbox column so users can select rows. |
| `row-id-key` | string | `"id"` | Property used to derive stable row identifiers for plain object data. |

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `columns` | `Array<DataTableColumn>` | Column configuration describing headers, accessors, formatting, sortability, filters, and actions. |
| `data` | `Array<object>` | Data rows rendered by the table. Swap at runtime to drive live updates. |
| `pageSize` | number | Getter/setter mirroring the `page-size` attribute. |
| `selectable` | boolean | Reflects the `selectable` attribute so you can toggle row selection from JavaScript. |
| `selectedRows` | `Array<object>` | Read-only list of the currently selected data objects after filtering. |

`DataTableColumn` objects support:

- `id` — unique column identifier used for sorting and visibility.
- `header` — string or function returning header content.
- `accessor` — string key or function returning cell values.
- `formatter` — optional value formatter for display.
- `renderCell` — custom renderer returning DOM nodes or strings.
- `sortable`, `filterable`, `hideable`, `align` — behavioural flags.
- `actions` — array of `{ id, label, action }` descriptors for per-row dropdown menus.

#### Events

- `data-table-selection-change` — Fired whenever the checked row set changes. `event.detail.rows`
  contains the selected objects.
- `data-table-action` — Emitted when an item inside a row action menu is activated. Provides
  `{ action, row, columnId, rowId }` in `event.detail`.

#### Styling hooks

- CSS custom properties: `--data-table-background`, `--data-table-border-color`, `--data-table-radius`,
  `--data-table-text-color`, `--data-table-muted-color`, `--data-table-toolbar-gap`,
  `--data-table-toolbar-padding`, `--data-table-filter-background`, `--data-table-filter-border`,
  `--data-table-filter-radius`, `--data-table-filter-padding`, `--data-table-filter-color`,
  `--data-table-filter-placeholder`, `--data-table-header-background`, `--data-table-header-color`,
  `--data-table-row-hover`, `--data-table-row-selected`, `--data-table-row-border`,
  `--data-table-pagination-gap`, `--data-table-control-radius`, `--data-table-control-border`,
  `--data-table-control-background`, `--data-table-control-color`,
  `--data-table-control-disabled-opacity`, `--data-table-menu-background`,
  `--data-table-menu-border`, `--data-table-menu-radius`, `--data-table-menu-shadow`,
  `--data-table-menu-item-hover`, `--data-table-actions-trigger-size`.
- Parts: `::part(container)`, `::part(toolbar)`, `::part(filter)`, `::part(column-menu)`,
  `::part(surface)`, `::part(table)`, `::part(header)`, `::part(row)`, `::part(cell)`, `::part(empty)`,
  `::part(pagination)`, `::part(selection-summary)`, `::part(pagination-previous)`,
  `::part(pagination-next)`, `::part(column-menu-empty)`.

### `<wc-table>`

Lightweight table surface that mirrors the shadcn/ui table primitives. Compose captions, headers,
bodies, and footers declaratively with `wc-table-*` child elements and the component renders a
semantic `<table>` with responsive overflow handling inside its shadow root.

```html
<script type="module" src="https://cdn.example.com/web-components/table.js"></script>

<wc-table>
  <wc-table-caption>A list of your recent invoices.</wc-table-caption>
  <wc-table-header>
    <wc-table-row>
      <wc-table-head style="width: 7.5rem;">Invoice</wc-table-head>
      <wc-table-head>Status</wc-table-head>
      <wc-table-head>Method</wc-table-head>
      <wc-table-head align="right">Amount</wc-table-head>
    </wc-table-row>
  </wc-table-header>
  <wc-table-body>
    <wc-table-row>
      <wc-table-cell>INV001</wc-table-cell>
      <wc-table-cell>Paid</wc-table-cell>
      <wc-table-cell>Credit Card</wc-table-cell>
      <wc-table-cell align="right">$250.00</wc-table-cell>
    </wc-table-row>
    <wc-table-row>
      <wc-table-cell>INV002</wc-table-cell>
      <wc-table-cell>Pending</wc-table-cell>
      <wc-table-cell>PayPal</wc-table-cell>
      <wc-table-cell align="right">$150.00</wc-table-cell>
    </wc-table-row>
  </wc-table-body>
  <wc-table-footer>
    <wc-table-row>
      <wc-table-cell colspan="3">Total</wc-table-cell>
      <wc-table-cell align="right">$400.00</wc-table-cell>
    </wc-table-row>
  </wc-table-footer>
</wc-table>
```

Rows accept `data-state="selected"` (or the shorthand `state="selected"`) to highlight the current
selection, and header or data cells respect `align="left|center|right"` for text alignment. Inline
`style`, `aria-*`, and `data-*` attributes set on the declarative child elements are forwarded to the
rendered table cells so you can surface tooltips or additional metadata.

#### Declarative children

| Element | Description |
| --- | --- |
| `<wc-table-caption>` | Provides an accessible caption rendered beneath the table surface. |
| `<wc-table-header>` | Wraps header rows that should render inside `<thead>`. |
| `<wc-table-body>` | Declares one or more body row groups rendered inside `<tbody>`. |
| `<wc-table-footer>` | Optional summary or totals rendered inside `<tfoot>`. |
| `<wc-table-row>` | Defines a table row. Place `wc-table-head`/`wc-table-cell` elements inside. |
| `<wc-table-head>` | Header cell rendered as `<th scope="col">` by default. |
| `<wc-table-cell>` | Data cell rendered as `<td>`. |

#### Styling hooks

- CSS custom properties: `--table-background`, `--table-border-color`, `--table-radius`,
  `--table-shadow`, `--table-text-color`, `--table-muted-color`, `--table-header-background`,
  `--table-header-color`, `--table-footer-background`, `--table-row-border`, `--table-row-hover`,
  `--table-row-selected`, `--table-cell-padding-block`, `--table-cell-padding-inline`,
  `--table-caption-color`.
- Parts: `::part(surface)`, `::part(wrapper)`, `::part(table)`, `::part(caption)`, `::part(section)`,
  `::part(row)`, `::part(cell)`.

#### Accessibility

- The declarative caption is rendered as a semantic `<caption>` for screen reader support.
- Header cells default to `scope="col"` so column associations remain intact. Override `scope` on a
  `<wc-table-head>` element for row headers.
- Overflow is handled within a focusable wrapper so keyboard users can scroll horizontally on small
  screens without losing context.

### `<wc-form>`

An opinionated contact form that mirrors the Radix UI demo experience. It wires native constraint
validation to accessible inline messages, automatically focuses the first invalid control, and exposes
helpers for server-driven errors.

```html
<wc-form id="support-form" submit-label="Post question"></wc-form>

<script type="module" src="https://cdn.example.com/web-components/form.js"></script>
<script type="module">
  const form = document.getElementById('support-form');
  form.addEventListener('wc-form-data', (event) => {
    console.log('Form payload', event.detail);
  });
  form.addEventListener('wc-form-submit', (event) => {
    fetch('/api/support', { method: 'POST', body: event.detail });
  });
</script>
```

#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `submit-label` | string | `"Post question"` | Customises the text shown on the submit button. |

#### Methods

- `reset()` — Clears the form, removes validation messages, and resets custom errors.
- `setCustomError(name: string, message: string)` — Toggles a custom validation message for a field
  (`"email"` or `"question"`).
- `clearCustomError(name: string)` — Convenience wrapper around `setCustomError(name, "")`.

#### Events

- `wc-form-submit` — Fired after successful validation. `event.detail` is the `FormData` instance ready
  for network submission.
- `wc-form-data` — Fired alongside `wc-form-submit` with a plain object version of the current values.

#### Styling hooks

- Custom properties: `--wc-form-background`, `--wc-form-foreground`, `--wc-form-muted`,
  `--wc-form-field-background`, `--wc-form-field-border`, `--wc-form-field-border-hover`,
  `--wc-form-field-border-focus`, `--wc-form-submit-background`, `--wc-form-submit-color`,
  `--wc-form-submit-hover`, `--wc-form-radius`, `--wc-form-field-radius`, `--wc-form-shadow`,
  `--wc-form-input-padding`, `--wc-form-message-error`, `--wc-form-message-error-color`, and more.
- Parts: `::part(container)`, `::part(header)`, `::part(title)`, `::part(description)`, `::part(form)`,
  `::part(field)`, `::part(label)`, `::part(messages)`, `::part(message)`, `::part(control)`,
  `::part(submit)`.

### `<wc-input>`

Single-line text input that mirrors the shadcn/ui aesthetic while staying purely web-component based. It
is form associated, exposes native methods such as `focus()` and `setSelectionRange()`, and forwards
the majority of HTML input attributes.

```html
<script type="module" src="https://cdn.example.com/web-components/input.js"></script>

<wc-input type="email" placeholder="Email address"></wc-input>
```

### `<wc-file-input>`

File picker control with daisyUI-inspired styling, colour palettes, and ghost or solid variants. The
component mirrors native file input semantics so it works in forms, supports keyboard activation, and
exposes CSS hooks for deeper customisation.

```html
<script type="module" src="https://cdn.example.com/web-components/file-input.js"></script>

<wc-file-input name="assets" accept=".pdf,.png" multiple color="primary"></wc-file-input>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `value` | string | `""` | Read the native value. Set to an empty string to clear the current selection. |
| `name` / `name` | string | `""` | Field name submitted with a parent form. |
| `accept` / `accept` | string | `""` | Comma-separated list of accepted MIME types or extensions. |
| `capture` / `capture` | string | `null` | Hint for camera or microphone capture on supporting devices. |
| `multiple` / `multiple` | boolean | `false` | Allows choosing more than one file. |
| `disabled` / `disabled` | boolean | `false` | Disables interaction and applies a `data-disabled` attribute for styling. |
| `required` / `required` | boolean | `false` | Marks the control as required for constraint validation. |
| `variant` / `variant` | `"solid" \| "ghost"` | `"solid"` | Switches between filled and ghost chrome. |
| `color` / `color` | string | `"neutral"` | Theme token for the button and focus accents (`primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`). |
| `size` / `size` | string | `"md"` | Size presets (`xs`, `sm`, `md`, `lg`, `xl`) that update height and typography. |
| `files` (readonly) | `FileList \| null` | `null` | Currently selected files. |
| `form` (readonly) | `HTMLFormElement \| null` | `null` | Associated form when nested inside a `<form>`. |

#### Methods

- `clear()` — Programmatically remove the currently selected files.
- `click()`, `focus()`, `blur()` — Proxy native input methods for imperative control.

#### Events

- `input` — Re-dispatched when the underlying control emits `input`.
- `change` — Re-dispatched after the selected files change.

#### Styling hooks

- CSS custom properties: `--wc-file-input-font-family`, `--wc-file-input-font-size`,
  `--wc-file-input-font-weight`, `--wc-file-input-letter-spacing`, `--wc-file-input-line-height`,
  `--wc-file-input-radius`, `--wc-file-input-height`, `--wc-file-input-inline-size`,
  `--wc-file-input-border-width`, `--wc-file-input-background`, `--wc-file-input-background-hover`,
  `--wc-file-input-background-disabled`, `--wc-file-input-border-color`,
  `--wc-file-input-border-color-hover`, `--wc-file-input-border-color-focus`, `--wc-file-input-shadow`,
  `--wc-file-input-shadow-focus`, `--wc-file-input-color`, `--wc-file-input-placeholder`,
  `--wc-file-input-disabled-color`, `--wc-file-input-button-background`,
  `--wc-file-input-button-background-hover`, `--wc-file-input-button-border`,
  `--wc-file-input-button-color`, `--wc-file-input-button-shadow`, `--wc-file-input-button-radius`,
  `--wc-file-input-transition`.
- Parts: `::part(container)`, `::part(input)`.
- Data attributes: `[data-variant]`, `[data-color]`, `[data-size]`, `[data-disabled]`, `[data-has-files]`.

#### Notes

- Form-associated: participates in native submission, reset, and validation flows.
- `data-has-files` toggles automatically, enabling contextual styling when files are selected.
- Combine `variant="ghost"` and the colour presets to mirror daisyUI’s ghost, solid, and stateful
  treatments without additional CSS.

### `<wc-field>`

Composable form layout primitives for stacking labels, controls, helper text, and error messaging. The
suite mirrors the shadcn/ui `Field` API so you can port JSX examples to standards-based HTML while
retaining semantic `<fieldset>` and `<legend>` structure.

```html
<script type="module" src="https://cdn.example.com/web-components/field.js"></script>
<script type="module" src="https://cdn.example.com/web-components/switch.js"></script>

<wc-field-set>
  <wc-field-legend>Profile</wc-field-legend>
  <wc-field-description>This information appears on invoices.</wc-field-description>
  <wc-field-group>
    <wc-field>
      <wc-field-label for="full-name">Full name</wc-field-label>
      <input id="full-name" autocomplete="name" placeholder="Avery Johnson" required />
      <wc-field-description>Use your legal name.</wc-field-description>
    </wc-field>
    <wc-field orientation="horizontal">
      <wc-switch id="newsletter"></wc-switch>
      <wc-field-label for="newsletter">Subscribe to announcements</wc-field-label>
    </wc-field>
  </wc-field-group>
</wc-field-set>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `value` | string | `""` | Current value of the control. Setting it programmatically keeps the internal input in sync. |
| `type` / `type` | string | `"text"` | Native input type (`email`, `password`, `search`, `file`, etc.). |
| `placeholder` / `placeholder` | string | `""` | Hint text shown while the field is empty. |
| `name` / `name` | string | `""` | Name submitted with the parent form. |
| `disabled` / `disabled` | boolean | `false` | Disables interaction and applies a `data-disabled` attribute for styling. |
| `readonly` / `readOnly` | boolean | `false` | Keeps the value visible while blocking edits. |
| `required` / `required` | boolean | `false` | Marks the field as required for native constraint validation. |
| `autocomplete` / `autocomplete` | string | `""` | Browser autocomplete hint (for example `email`, `name`). |
| `inputmode` / `inputMode` | string | `""` | Suggests an on-screen keyboard layout on touch devices. |
| `pattern` / `pattern` | string | `""` | Regular expression checked during native validation. |
| `min` / `min` | string | `""` | Lower bound for numeric, date, or time inputs. |
| `max` / `max` | string | `""` | Upper bound for numeric, date, or time inputs. |
| `step` / `step` | string | `""` | Value granularity for numeric interfaces. |
| `minlength` / `minLength` | number | `null` | Minimum number of characters required. |
| `maxlength` / `maxLength` | number | `null` | Maximum number of characters accepted. |
| `enterkeyhint` / `enterKeyHint` | string | `""` | Sets the action hint for software keyboards. |
| `autocapitalize` / `autocapitalize` | string | `""` | Controls automatic capitalisation behaviour. |
| `autocorrect` / `autocorrect` | string | `""` | Toggles autocorrect on supporting platforms. |
| `spellcheck` / `spellcheck` | string | `""` | Enables or disables spell checking. |
| `form` (readonly) | `HTMLFormElement \| null` | `null` | Parent form when the element is associated. |
| `files` (readonly) | `FileList \| null` | `null` | Selected files when `type="file"`. |
| `inputElement` (readonly) | `HTMLInputElement` | — | Direct reference to the underlying `<input>`. |

#### Events

- `input` — Mirrors the native event whenever the value changes.
- `change` — Fired when the underlying control emits `change`.
- `invalid` — Re-emitted when native constraint validation fails.

#### Styling hooks

- Custom properties: `--wc-input-inline-size`, `--wc-input-font-family`, `--wc-input-font-size`,
  `--wc-input-font-weight`, `--wc-input-letter-spacing`, `--wc-input-line-height`, `--wc-input-radius`,
  `--wc-input-padding-inline`, `--wc-input-padding-block`, `--wc-input-background`,
  `--wc-input-background-hover`, `--wc-input-background-disabled`, `--wc-input-border`,
  `--wc-input-border-hover`, `--wc-input-border-focus`, `--wc-input-shadow-focus`, `--wc-input-color`,
  `--wc-input-placeholder`, `--wc-input-caret-color`, `--wc-input-transition-duration`.
- Parts: `::part(container)`, `::part(input)`.

#### Notes

- Form-associated: participates in native submission, reset, and state restoration cycles.
- Exposes `data-empty`, `data-disabled`, and `data-has-files` attributes to target common UI states.
- Supports file uploads via `type="file"`; the `files` property surfaces the active `FileList`.
| `orientation` | `"vertical" \| "horizontal" \| "responsive"` | `"vertical"` | Switches the layout for the slotted controls. `responsive` swaps to columns when the host crosses a `min-width: 640px` container query. |

#### Slots

- _(default)_ — Labels, controls, helper text, and nested field containers.

#### Styling hooks

- CSS custom properties: `--wc-field-gap`, `--wc-field-horizontal-gap`, `--wc-field-responsive-gap`,
  `--wc-field-min-label-width`, `--wc-field-border-width`, `--wc-field-border-inset`,
  `--wc-field-border-color`, `--wc-field-invalid-border`.
- Parts: `::part(root)` styles the internal flex container.
- Data attributes: `[data-orientation="vertical" | "horizontal" | "responsive"]`,
  `[data-invalid]` for invalid styling states.

#### Supporting elements

- `<wc-field-group>` — Stacks related fields and exposes `::part(group)` for layout. Customise spacing
  with `--wc-field-group-gap`. The host enables container queries so responsive fields adapt to the
  available width.
- `<wc-field-set>` — Renders a semantic `<fieldset>` wrapper. Style spacing with `--wc-field-set-gap`,
  `--wc-field-set-padding`, `--wc-field-set-border`, `--wc-field-set-radius`, and
  `--wc-field-set-background`.
- `<wc-field-legend>` — Accessible legend element. Set `variant="label"` to reuse label sizing.
  Shares CSS hooks `--wc-field-legend-size`, `--wc-field-legend-weight`, `--wc-field-legend-color` and
  surfaces `::part(legend)`.
- `<wc-field-label>` — Styled label that forwards the `for`/`htmlFor` property to the underlying
  `<label>`. Adjust typography with `--wc-field-label-size`, `--wc-field-label-weight`, and
  `--wc-field-label-color`. Exposes `::part(label)`.
- `<wc-field-content>` — Flex column wrapper to group a label, title, and descriptions beside a
  control. Tweak spacing with `--wc-field-content-gap`. Exposes `::part(content)` and adds a
  `data-field-content` attribute for selector targeting from ancestor styles.
- `<wc-field-description>` — Helper text component with `::part(description)` and tokens
  `--wc-field-description-color`, `--wc-field-description-size`.
- `<wc-field-title>` — Secondary heading for richer labels. Customise via `--wc-field-title-size`,
  `--wc-field-title-weight`, and `::part(title)`.
- `<wc-field-separator>` — Visual divider with optional inline text. Adjust with
  `--wc-field-separator-color`, `--wc-field-separator-gap`, `--wc-field-separator-size`, and
  `::part(separator)`.
- `<wc-field-error>` — Accessible error container announcing changes with `role="alert"`. Bind an
  array of validation issues via the `errors` property and customise styles with
  `--wc-field-error-color`, `--wc-field-error-background`, `--wc-field-error-radius`,
  `--wc-field-error-padding`, `--wc-field-error-font-size`, plus parts `::part(error)`,
  `::part(error-message)`, and `::part(error-list)`.
- `<wc-field-title>` and `<wc-field-description>` are often paired inside `<wc-field-content>` for
  horizontal or responsive layouts.

`<wc-field-error>` accepts either slotted content or an `errors` property containing objects with a
`message` string. Multiple messages render as a list automatically, enabling interoperability with
React Hook Form, TanStack Form, or any validator that outputs `[{ message: string }]` structures.

### `<wc-checkbox>`

An accessible, tri-state checkbox control that mirrors Radix UI’s anatomy. It supports indeterminate
states, full keyboard navigation, and form association.

```html
<form onsubmit="event.preventDefault();">
  <wc-checkbox name="terms" value="accepted" required checked>
    Accept terms and conditions.
  </wc-checkbox>
</form>
```

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | boolean | `false` | Sets the checkbox to the checked state. Reflects to the `checked` property. |
| `indeterminate` | boolean | `false` | Displays the indeterminate (mixed) state without marking it as checked. |
| `disabled` | boolean | `false` | Removes the checkbox from the focus order and blocks interaction. |
| `required` | boolean | `false` | Marks the checkbox as required when used inside a form. |
| `value` | string | `"on"` | Value submitted with the parent form whenever the checkbox is checked. |
| `name` | string | `""` | Associates the element with form submission entries. |

Call `toggle(force?: boolean)` to flip the state or force a particular value.

#### Events

- `input` — Fired whenever user interaction updates the state. Bubbles and is composed.
- `change` — Mirrors the native checkbox `change` event semantics.

#### Styling hooks

- CSS custom properties: `--checkbox-size`, `--checkbox-radius`, `--checkbox-border-width`,
  `--checkbox-border-color`, `--checkbox-background`, `--checkbox-background-checked`,
  `--checkbox-background-indeterminate`, `--checkbox-foreground`, `--checkbox-shadow`,
  `--checkbox-focus-ring`, `--checkbox-gap`, `--checkbox-label-color`.
- Parts: `::part(root)`, `::part(control)`, `::part(indicator)`, `::part(label)`.
- Data attributes: `[data-state="checked" | "unchecked" | "indeterminate"]`, `[data-disabled="true"]`.

### `<wc-input-group>`

Compose inputs, buttons, icons, and helper text inside a single surface. The input group keeps
focus-visible styles in sync, supports stacked addons for textareas, and embraces custom
controls by watching the shared `data-slot="input-group-control"` marker.

```html
<script type="module" src="https://cdn.example.com/web-components/input-group.js"></script>

<wc-input-group>
  <wc-input-group-input placeholder="Search..." aria-label="Search documentation"></wc-input-group-input>
  <wc-input-group-addon>
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="m15.5 14.1 2.4 2.4m-1.9-6.2a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  </wc-input-group-addon>
  <wc-input-group-addon align="inline-end">
    <wc-input-group-button variant="secondary" size="xs">Search</wc-input-group-button>
  </wc-input-group-addon>
</wc-input-group>
```

#### Slots

- `inline-start` — Auto-assigned to addons that appear before the control.
- `inline-end` — Auto-assigned to addons that trail the control (usually buttons or counters).
- `block-start` — For stacked content rendered above a multiline control.
- `block-end` — For stacked content rendered below a multiline control.
- `input-group-control` — Reserved for the primary input or textarea. `<wc-input-group-input>` and
  `<wc-input-group-textarea>` set this automatically; custom elements can opt-in by adding the data
  attribute.

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | boolean | `false` | Applies `aria-disabled="true"`, mutes hover styles, and disables pointer interaction. |

#### Styling hooks

- CSS custom properties: `--input-group-radius`, `--input-group-background`,
  `--input-group-background-disabled`, `--input-group-border-color`,
  `--input-group-border-hover`, `--input-group-border-focus`,
  `--input-group-shadow-focus`, `--input-group-inline-gap`,
  `--input-group-inline-padding-block`, `--input-group-inline-padding-inline`,
  `--input-group-block-gap`, `--input-group-block-padding-block`,
  `--input-group-block-padding-inline`, `--input-group-divider-color`,
  `--input-group-text-color`, `--input-group-min-height`.
- Parts: `::part(wrapper)`, `::part(block-start)`, `::part(block-end)`, `::part(inline-start)`,
  `::part(inline-end)`, `::part(control)`.
- Data attributes: `[data-has-inline-start]`, `[data-has-inline-end]`, `[data-has-block-start]`,
  `[data-has-block-end]`, `[data-disabled]`, `[data-focus-within]`, `[data-focus-visible]`.

#### Related elements

Each helper element lives in the same module and can be used individually:

##### `<wc-input-group-addon>`

Wraps icons, text, buttons, or dropdown triggers. Use the `align` attribute to control where it
renders.

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | `"inline-start" \| "inline-end" \| "block-start" \| "block-end"` | `"inline-start"` | Positions the addon next to the control or stacks it for textarea layouts. |

##### `<wc-input-group-button>`

Button primitive sized for dense toolbars.

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"ghost"` | Visual style. |
| `size` | `"xs" \| "icon-xs" \| "sm" \| "icon-sm"` | `"xs"` | Adjusts padding and icon sizing. |
| `disabled` | boolean | `false` | Forwards the disabled state to the underlying `<button>`. |

##### `<wc-input-group-input>` & `<wc-input-group-textarea>`

Form-associated controls that forward common attributes to the native input/textarea while applying
group-friendly spacing. Add custom controls by setting `data-slot="input-group-control"` on any
element that implements the same semantics.

| Attribute | Type | Description |
| --- | --- | --- |
| `value`, `name`, `placeholder`, `min`, `max`, `step`, `autocomplete`, `inputmode`, `required`, `readonly`, `disabled`, `rows` (textarea) | string/boolean | Forwarded to the native element. |

##### `<wc-input-group-text>`

Simple text wrapper for inline metrics (“12 results”, “USD”, etc.). Use Tailwind utility classes or
CSS to tweak the typography.

### `<wc-rating>`

`<wc-rating>` renders a row of tappable shapes that behave like a native rating input. It supports
fractional steps, RTL layouts, per-item colour palettes, and form participation via
`ElementInternals`. Keyboard users can adjust the value with the arrow keys, Home/End, and delete to
clear when `clearable` is present.

```html
<script type="module" src="https://cdn.example.com/web-components/rating.js"></script>

<wc-rating
  value="3.5"
  step="0.5"
  shape="star-2"
  palette="#fb923c,#facc15,#a3e635,#22c55e"
  aria-label="Rate support quality"
>
  Support quality
</wc-rating>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | number | `0` | Current rating value. Rounded to the nearest multiple of `step`. |
| `max` | number | `5` | Number of shapes rendered across the track. |
| `step` | number | `1` | Minimum increment between values. Accepts fractional values such as `0.5`. |
| `shape` | `"star" \| "star-2" \| "heart"` | `"star"` | Shape mask applied to every item. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Predefined scale for icon size and spacing. |
| `clearable` | boolean | `false` | When present, toggling the active value or pressing Delete resets the control to `0` and omits it from form submissions. |
| `palette` | string | `""` | Comma-separated list of CSS colours applied to successive items. Fallbacks to `--wc-rating-active-color` when shorter than `max`. |
| `readonly` | boolean | `false` | Disables interaction while keeping the current value visible. |
| `disabled` | boolean | `false` | Removes the component from the tab order and dims the icons. |
| `name` | string | `""` | Associates the control with a form. Only submitted when the value is greater than `0`. |

#### Events

- `input` — Fired whenever a pointer or keyboard interaction updates the value.
- `change` — Emitted after a committed value change, mirroring native radio controls.

#### Styling hooks

- CSS custom properties: `--wc-rating-size`, `--wc-rating-gap`, `--wc-rating-active-color`,
  `--wc-rating-inactive-color`, `--wc-rating-focus-ring`, `--wc-rating-hit-area`,
  `--wc-rating-focus-padding`, `--wc-rating-focus-radius`, `--wc-rating-disabled-opacity`,
  `--wc-rating-label-gap`.
- Parts: `::part(root)`, `::part(track)`, `::part(item)`, `::part(icon)`, `::part(label)`.
- Data attributes: `[data-size]`, `[data-shape]`, `[data-disabled="true"]`,
  `[data-readonly="true"]`, `[data-direction="rtl"]`.

### `<wc-spinner>`

An accessible loading indicator with no runtime dependencies. Customise the spinner’s size, stroke,
and colour with CSS custom properties while keeping a polite status message for assistive
technologies.

```html
<wc-spinner label="Processing payment"></wc-spinner>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `"Loading"` | Sets the accessible status text announced to assistive technologies. Mirrors to `aria-label` when one is not provided. |
| `visual-label` | boolean | `false` | Reveals the accessible label next to the indicator so the status is shown visually as well. |

#### Slots

- _(default)_ — Optional inline content displayed after the spinner.

#### Styling hooks

- CSS custom properties: `--wc-spinner-size`, `--wc-spinner-stroke-width`, `--wc-spinner-track-color`,
  `--wc-spinner-color`, `--wc-spinner-gap`, `--wc-spinner-duration`.
- Parts: `::part(icon)` for the SVG container, `::part(label)` for the accessible status text (visible
  when `visual-label` is present).

The element defaults to `role="status"`, `aria-live="polite"`, and `aria-busy="true"` so updates are
announced without stealing focus.

### `<wc-sonner>`

Opinionated toaster that mirrors the Sonner React API in a framework-agnostic package. Queue
multiple notifications, switch between success/info/warning/error variants, and track async work with
`toast.promise` helpers.

```html
<script type="module" src="https://cdn.example.com/web-components/sonner.js"></script>

<wc-sonner id="demo-sonner" position="bottom-right"></wc-sonner>
<button id="sonner-trigger" type="button">Show toast</button>

<script type="module">
  const toaster = document.getElementById('demo-sonner');
  document.getElementById('sonner-trigger')?.addEventListener('click', () => {
    toaster.toast.success('Event has been created', {
      description: 'Sunday, December 03, 2023 at 9:00 AM',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
      },
    });
  });
</script>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'top-left' \| 'top-right' \| 'top-center' \| 'bottom-left' \| 'bottom-right' \| 'bottom-center'` | `'top-right'` | Controls where the viewport is anchored on screen. |
| `duration` | number | `4000` | Default auto-dismiss timeout in milliseconds when none is supplied per toast. Use `Infinity` to persist. |
| `close-on-click` | boolean | `false` | When present, clicking the toast surface dismisses it (action and close buttons are unaffected). |
| `toast` (property) | `function` | — | Bound helper that mirrors Sonner’s `toast` API (see helpers below). |

#### Helpers

- `toast(title, options?)` — Push a neutral toast. `options` accepts `description`,
  `duration`, `label`, `dismissible`, and `action: { label, onClick }`.
- `toast.success/info/warning/error/loading(title, options?)` — Typed variants with matching icons.
- `toast.promise(promiseOrFactory, { loading, success, error })` — Show a loading toast while the
  promise runs, replacing it with success or error messaging afterwards.
- `toast.dismiss(id?)` — Dismiss a toast by id or clear the queue when no id is provided.

#### Events

- `wc-sonner-open` — Fired whenever a toast is enqueued. `event.detail` exposes `{ id, record }`.
- `wc-sonner-action` — Emitted after the action button runs. `event.detail` includes `{ id, record }`.
- `wc-sonner-dismiss` — Fired when a toast leaves. `event.detail` contains `{ id, record, reason }` with
  `reason` set to `"manual"`, `"action"`, `"timeout"`, or `"click"`.

#### Styling hooks

- CSS custom properties: `--sonner-z-index`, `--sonner-gap`, `--sonner-max-width`, `--sonner-radius`,
  `--sonner-font-family`, `--sonner-color`, `--sonner-background`, `--sonner-border`, `--sonner-shadow`,
  `--sonner-success`, `--sonner-info`, `--sonner-warning`, `--sonner-error`, `--sonner-loading`.
- Data attributes: `[data-type]` and `[data-state]` on each toast for variant/transition styling.
- Parts: `::part(viewport)`, `::part(toast)`, `::part(icon)`, `::part(body)`, `::part(title)`,
  `::part(description)`, `::part(actions)`, `::part(action-button)`, `::part(close-button)`.

### `<wc-skeleton>`

Skeleton placeholders help communicate that content is still loading while maintaining the layout of
the final UI. Adjust each instance’s width, height, and border radius with CSS custom properties or
host styles.

```html
<wc-skeleton style="--wc-skeleton-width: 12rem; --wc-skeleton-height: 1rem;"></wc-skeleton>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `still` | boolean | `false` | When present, pauses the shimmer animation for a calmer loading state. |
| `rounded` | string | `""` | Set to `"full"` to force a perfectly round radius without adjusting CSS variables. |

#### Accessibility

- Defaults to `role="presentation"` and `aria-hidden="true"` so assistive tech ignores decorative placeholders.
- Supply `aria-label` when the skeleton should describe its purpose (e.g. “Loading user avatar”).

#### Styling hooks

- CSS custom properties: `--wc-skeleton-width`, `--wc-skeleton-height`, `--wc-skeleton-radius`,
  `--wc-skeleton-base-color`, `--wc-skeleton-highlight-color`,
  `--wc-skeleton-animation-duration`.
- Parts: `::part(base)` exposes the animated surface for advanced overrides.

### `<wc-countdown>`

Animate numeric transitions between 0 and 999 with a rolling digit effect. The element mirrors the
structure of daisyUI’s countdown utility, automatically updating the `--value` CSS variable and text
content whenever the `value` property changes.

```html
<wc-countdown value="59"></wc-countdown>

<script>
  const timer = document.querySelector('wc-countdown');
  let value = 59;
  setInterval(() => {
    value = value === 0 ? 59 : value - 1;
    timer.value = value;
  }, 1000);
</script>
### `<wc-item>`

Compose flexible content rows with optional media, descriptions, and actions. The suite mirrors the
shadcn/ui Item primitives while remaining framework agnostic and themable through CSS variables and
parts.

```html
<script type="module" src="https://cdn.example.com/web-components/item.js"></script>

<wc-item variant="outline">
  <wc-item-media variant="icon">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4 10-10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </wc-item-media>
  <wc-item-content>
    <wc-item-title>Workspace created</wc-item-title>
    <wc-item-description>Invite your team to collaborate and assign tasks.</wc-item-description>
  </wc-item-content>
  <wc-item-actions>
    <button type="button">Open</button>
  </wc-item-actions>
</wc-item>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | number | `0` | Current numeric value. Clamped between 0 and 999 and reflected back to the attribute. |
| `digits` | number | — | Optional hint (1–3) for the minimum digits to display. Mirrors the `digits` property. |

#### Accessibility

- Sets `role="timer"`, `aria-live="polite"`, and `aria-atomic="true"` so updates announce without stealing focus.
- Provide a custom `aria-label` when the countdown should include context such as units or labels.

#### Styling hooks

- CSS custom properties: `--digits`, `--wc-countdown-transition-duration`, `--wc-countdown-transition-easing`,
  `--wc-countdown-width-delay`, `--wc-countdown-width-duration`, `--wc-countdown-width-easing`.
- Parts: `::part(value)` exposes the animated digit container, `::part(sr-label)` exposes the live region.
| `variant` | string | `"default"` | Switch between `default`, `outline`, or `muted` visual treatments. |
| `size` | string | `"default"` | Adjust spacing presets. Supports `default` or compact `sm`. |
| `interactive` | boolean | `false` | When present the item receives `tabindex="0"`, pointer cursor, and focus ring styling. |

#### Slots

- _(default)_ — Compose the row using the companion primitives below, or inline content for simple
  layouts.
- Place `<wc-item-header>` before other children to span imagery above the row.
- Append `<wc-item-footer>` for supporting details or actions that should stretch full width.

#### Related elements

- `<wc-item-media>` — Leading visual container. Accepts `variant="icon"` (padded icon badge) or
  `variant="image"` (cropped square/rectangular media).
- `<wc-item-content>` — Vertical stack for `<wc-item-title>` and `<wc-item-description>`.
- `<wc-item-title>` — Semibold title text rendered as a paragraph for flexible semantics.
- `<wc-item-description>` — Muted description copy that inherits the item colour scheme.
- `<wc-item-actions>` — Right-aligned flex container for buttons, icons, or supporting metadata.
- `<wc-item-header>` / `<wc-item-footer>` — Optional regions that span the full width above or below
  the main row.
- `<wc-item-group>` — Wrap multiple items to maintain consistent spacing.
- `<wc-item-separator>` — Divider element intended for use between grouped items.

#### Styling hooks

- CSS custom properties: `--wc-item-background`, `--wc-item-foreground`,
  `--wc-item-muted-foreground`, `--wc-item-border-color`, `--wc-item-hover-border-color`,
  `--wc-item-hover-shadow`, `--wc-item-radius`, `--wc-item-padding-inline`,
  `--wc-item-padding-block`, `--wc-item-gap`, `--wc-item-actions-gap`, `--wc-item-content-gap`,
  `--wc-item-footer-gap`, `--wc-item-footer-padding`, `--wc-item-group-gap`,
  `--wc-item-media-radius`, `--wc-item-media-background`.
- Parts: `::part(surface)`, `::part(content)`, `::part(media)`, `::part(title)`,
  `::part(description)`, `::part(actions)`, `::part(header)`, `::part(footer)`, `::part(group)`,
  `::part(separator)`.

### `<wc-badge>`

Display statuses, counts, or links with a compact inline badge. The element mirrors the shadcn/ui
variants while remaining fully stylable through CSS variables and part hooks.

```html
<script type="module" src="https://cdn.example.com/web-components/badge.js"></script>

<wc-badge>New</wc-badge>
<wc-badge variant="secondary">In review</wc-badge>
<wc-badge href="/changelog">View changelog</wc-badge>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | string | `"default"` | Switch between `default`, `secondary`, `destructive`, or `outline` colour themes. |
| `href` | string | `""` | When provided the badge renders as an anchor element. |
| `target` | string | `""` | Optional anchor target. Defaults to `_self`; `_blank` automatically applies `rel="noopener noreferrer"`. |
| `rel` | string | `""` | Custom relationship attribute when the badge is acting as a link. |

#### Slots

- _(default)_ — Badge label, icons, or counters. SVG icons inherit the badge colour automatically.

#### Styling hooks

- CSS custom properties: `--wc-badge-background`, `--wc-badge-color`, `--wc-badge-border-color`,
  `--wc-badge-hover-background`, `--wc-badge-hover-border-color`, `--wc-badge-focus-ring-color`,
  `--wc-badge-radius`, `--wc-badge-padding-inline`, `--wc-badge-padding-block`,
  `--wc-badge-font-size`, `--wc-badge-font-weight`, `--wc-badge-letter-spacing`, `--wc-badge-gap`,
  `--wc-badge-min-width`, `--wc-badge-min-height`, `--wc-badge-shadow`,
  `--wc-badge-text-transform`.
- Parts: `::part(surface)` targets the pill surface for advanced customisation.

### `<wc-chat-message>`

Display a single line of conversation with optional avatar, header, and footer slots. Alignment and
colour variants mirror daisyUI chat bubbles while remaining fully themeable through CSS custom
properties.

```html
<script type="module" src="https://cdn.example.com/web-components/chat.js"></script>

<wc-chat-message align="start">
  <img slot="avatar" src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp" alt="Obi-Wan" />
  <span slot="header">Obi-Wan Kenobi <time>12:45</time></span>
  You were the Chosen One!
  <span slot="footer">Delivered</span>
</wc-chat-message>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | string | `"start"` | Sets bubble alignment. Accepts `start` (left) or `end` (right). |
| `variant` | string | `"neutral"` | Visual style. Choose from `neutral`, `primary`, `secondary`, `accent`, `info`, `success`, `warning`, or `error`. |

#### Slots

- `avatar` — Optional media or initials displayed inside the circular portrait well.
- `header` — Metadata positioned above the bubble (e.g. author name and timestamp).
- _(default)_ — Chat message body content. Accepts rich inline HTML.
- `footer` — Subtext below the bubble for delivery status or reactions.

#### Styling hooks

- CSS custom properties: `--wc-chat-gap`, `--wc-chat-avatar-size`, `--wc-chat-bubble-radius`,
  `--wc-chat-bubble-padding-inline`, `--wc-chat-bubble-padding-block`, `--wc-chat-bubble-background`,
  `--wc-chat-bubble-color`, `--wc-chat-bubble-shadow`, `--wc-chat-bubble-max-width`,
  `--wc-chat-bubble-font-size`, `--wc-chat-meta-color`, `--wc-chat-meta-font-size`.
- Parts: `::part(root)`, `::part(avatar)`, `::part(body)`, `::part(header)`, `::part(bubble)`,
  `::part(footer)`.

#### Accessibility

- Wrap transcripts in a parent element with `aria-label` or headings to give context to assistive
  technologies.
- Provide `alt` text for avatars or slot alternative content so authors are identifiable when the
  image fails to load.

### `<wc-button>`

Display accessible call-to-action buttons or anchored links with consistent styling, hover states, and
focus rings. The component mirrors shadcn/ui variants and includes dedicated icon sizes for compact or
prominent icon buttons.

> **Changelog:** Added `icon-sm` and `icon-lg` size presets to complement the existing `icon` option.

```html
<script type="module" src="https://cdn.example.com/web-components/button.js"></script>

<wc-button variant="outline">Button</wc-button>
<wc-button variant="outline" size="icon" aria-label="Submit">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14m7-7H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
</wc-button>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | string | `"default"` | Visual style. Choose from `default`, `outline`, `ghost`, `destructive`, `secondary`, or `link`. |
| `size` | string | `"default"` | Spacing preset. Supports `sm`, `default`, `lg`, `icon`, `icon-sm`, and `icon-lg`. |
| `disabled` | boolean | `false` | Disables interaction, removes hover/active effects, and sets `aria-disabled` when rendered as a link. |
| `href` | string | `""` | When provided the control renders as an anchor while keeping button visuals. |
| `target` | string | `""` | Optional anchor target such as `_blank`. Ignored when `href` is omitted. |
| `rel` | string | `""` | Relationship metadata for linked buttons. Useful with external targets. |
| `type` | string | `"button"` | Forwarded to the underlying `<button>` when no `href` is present (`button`, `submit`, or `reset`). |

#### Slots

- _(default)_ — Button label, icons, or spinner elements. Icons inherit the foreground colour; add
  `aria-label` when the button contains only an icon.

#### Styling hooks

- CSS custom properties: `--wc-button-font-family`, `--wc-button-font-weight`,
  `--wc-button-font-size`, `--wc-button-letter-spacing`, `--wc-button-radius`, `--wc-button-gap`,
  `--wc-button-border-width`, `--wc-button-padding-inline`, `--wc-button-padding-block`,
  `--wc-button-min-inline-size`, `--wc-button-min-block-size`, `--wc-button-background`,
  `--wc-button-background-hover`, `--wc-button-foreground`, `--wc-button-foreground-hover`,
  `--wc-button-border-color`, `--wc-button-border-color-hover`, `--wc-button-focus-ring`,
  `--wc-button-disabled-opacity`, `--wc-button-shadow`, `--wc-button-shadow-hover`.
- Parts: `::part(control)` targets the interactive surface.

#### Pointer cursor

Tailwind CSS v4 switched the base button cursor to `default`. To keep pointer feedback for all button
roles in your global styles, add:

```css
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

#### Accessibility

- Supply an `aria-label` (or descriptive text) for icon-only buttons.
- Disabled anchor buttons expose `aria-disabled="true"` and become unfocusable while preserving link
  URLs for later re-enablement.

### `<wc-alert>`

Display inline callouts for success, info, or destructive messaging with optional icon, title, and
rich description content. Slots mirror the shadcn/ui structure so existing markup ports cleanly.

```html
<script type="module" src="https://cdn.example.com/web-components/alert.js"></script>

<wc-alert>
  <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9.5 12.5l1.75 1.75L15 10.5"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
    ></path>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"></circle>
  </svg>
  <span slot="title">Success! Your changes have been saved.</span>
  <p>This is an alert with icon, title, and description.</p>
</wc-alert>

<wc-alert variant="destructive">
  <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 9v4" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path>
    <path d="M12 17h.01" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path>
    <path
      d="M10.29 3.86L2.82 17.14A1.5 1.5 0 0 0 4.13 19.5h15.74a1.5 1.5 0 0 0 1.31-2.36L13.69 3.86a1.5 1.5 0 0 0-2.6 0z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    ></path>
  </svg>
  <span slot="title">Unable to process your payment.</span>
  <ul>
    <li>Check your card details</li>
    <li>Ensure sufficient funds</li>
    <li>Verify billing address</li>
  </ul>
</wc-alert>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | string | `"default"` | Visual treatment for the alert. Supports `default` (subtle) or `destructive`. |

#### Slots

- `icon` — Optional leading graphic. SVG icons inherit the configured icon colour.
- `title` — Prominent heading rendered with semibold styling.
- _(default)_ — Rich body content such as paragraphs, lists, or links.

#### Accessibility

- Defaults to `role="status"` and `aria-live="polite"` so updates announce without stealing focus.
- Switch to `role="alert"` for urgent, high-priority messages that require immediate attention.

#### Styling hooks

- CSS custom properties: `--wc-alert-background`, `--wc-alert-border-color`, `--wc-alert-color`,
  `--wc-alert-icon-color`, `--wc-alert-icon-background`, `--wc-alert-icon-size`, `--wc-alert-radius`,
  `--wc-alert-padding-inline`, `--wc-alert-padding-block`, `--wc-alert-gap`,
  `--wc-alert-content-gap`, `--wc-alert-title-color`, `--wc-alert-title-font-size`,
  `--wc-alert-title-font-weight`, `--wc-alert-description-color`,
  `--wc-alert-description-font-size`, `--wc-alert-shadow`.
- Parts: `::part(surface)`, `::part(icon)`, `::part(content)`, `::part(title)`, `::part(description)`.

### `<wc-kbd>` & `<wc-kbd-group>`

Display keyboard shortcuts, command palette hints, or game controls with inline keycaps. Pair the base
`<wc-kbd>` element with `<wc-kbd-group>` to sequence keys and separators while keeping spacing consistent.

```html
<script type="module" src="https://cdn.example.com/web-components/kbd.js"></script>

<p>
  Press <wc-kbd>?</wc-kbd> anywhere to open help or use
  <wc-kbd-group>
    <wc-kbd>Ctrl</wc-kbd>
    <span>+</span>
    <wc-kbd>K</wc-kbd>
  </wc-kbd-group>
  for the command palette.
</p>
```

#### `<wc-kbd>` slots

- _(default)_ — Key label, icon, or glyph rendered within the semantic `<kbd>` element.

#### `<wc-kbd>` styling hooks

- CSS custom properties: `--wc-kbd-background`, `--wc-kbd-border-color`, `--wc-kbd-border-width`,
  `--wc-kbd-border-style`, `--wc-kbd-shadow`, `--wc-kbd-radius`, `--wc-kbd-padding-inline`,
  `--wc-kbd-padding-block`, `--wc-kbd-font-size`, `--wc-kbd-font-weight`, `--wc-kbd-font-family`,
  `--wc-kbd-line-height`, `--wc-kbd-letter-spacing`, `--wc-kbd-color`, `--wc-kbd-min-width`,
  `--wc-kbd-text-transform`, `--wc-kbd-align-items`.
- Parts: `::part(surface)` targets the rendered keycap.

#### `<wc-kbd-group>` attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Toggle layout direction for the grouped keys. |

#### `<wc-kbd-group>` slots

- _(default)_ — Keyboard keys, separators (such as `+`), or descriptive text nodes.

#### `<wc-kbd-group>` styling hooks

- CSS custom properties: `--wc-kbd-group-gap`, `--wc-kbd-group-align`,
  `--wc-kbd-group-justify`, `--wc-kbd-group-wrap`.
- Parts: `::part(container)` exposes the flex container for fine-grained styling.

### `<wc-label>`

An accessible label element that stays associated with controls whether you link them via the `for`
attribute or nest the control inside the component.

```html
<wc-label for="first-name">First name</wc-label>
<input id="first-name" type="text" value="Pedro Duarte" />

<wc-label>
  Email notifications
  <input slot="control" type="checkbox" checked />
</wc-label>
```

#### Key attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `for` | string | `""` | Associates the label with a control by id, identical to the native attribute. |
| `htmlFor` (property) | string | `""` | Property alias for `for`, useful when setting the target programmatically. |
| `control` (property) | `HTMLElement \| null` | `null` | Accesses the associated control element, prioritising slotted content. |

#### Slots

- _(default)_ — Label text or inline content.
- `control` — Place a native control to wrap it with the label while keeping interactions intact.

#### Styling hooks

- Custom properties: `--label-gap`, `--label-gap-with-control`, `--label-font-size`,
  `--label-font-weight`, `--label-line-height`, `--label-color`, `--label-background`,
  `--label-radius`, `--label-focus-outline`, and more.
- Parts: `::part(label)`, `::part(text)`, `::part(control)`.

### `<wc-textarea>`

A multiline textarea inspired by shadcn/ui with accessible defaults, form association, and rich styling
hooks. The component mirrors native textarea behaviour while exposing CSS custom properties and
Shadow Parts so you can tweak borders, focus rings, and sizing without writing selectors against the
internal markup.

```html
<script type="module" src="https://cdn.example.com/web-components/textarea.js"></script>

<wc-textarea name="message" placeholder="Type your message here."></wc-textarea>
```

#### Key attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Current textarea value. Updates whenever the user types or the property changes. |
| `name` | string | `""` | Name submitted with the form when the component is inside a `<form>`. |
| `placeholder` | string | `""` | Hint text displayed while the field is empty. |
| `rows` | number | `4` | Preferred row count, mirroring the native attribute. |
| `disabled` | boolean | `false` | Disables user input and dims the control. |
| `readonly` | boolean | `false` | Prevents editing while keeping the value selectable. |
| `required` | boolean | `false` | Marks the field as required for native constraint validation. |
| `maxlength` | number | — | Maximum character count allowed. |
| `minlength` | number | — | Minimum character count required. |
| `autocomplete` | string | `""` | Passes through to the inner textarea for autofill hints. |

#### Events

- `input` — Fires whenever the value changes.
- `change` — Fires when the value is committed, typically on blur.

#### Styling hooks

- Custom properties: `--wc-textarea-color`, `--wc-textarea-min-block-size`, `--wc-textarea-padding`,
  `--wc-textarea-radius`, `--wc-textarea-border`, `--wc-textarea-border-hover`,
  `--wc-textarea-border-focus`, `--wc-textarea-background`, `--wc-textarea-background-hover`,
  `--wc-textarea-background-focus`, `--wc-textarea-resize`, `--wc-textarea-shadow`,
  `--wc-textarea-shadow-focus`, `--wc-textarea-placeholder`.
- Parts: `::part(base)` for the wrapper span and `::part(textarea)` for the internal control.

### `<wc-ascii-icon>`

Transform any single-colour SVG path into playful ASCII art rendered inside a scalable SVG. Supply the
`path` attribute with the `d` data from your icon set and the component will sample the silhouette into a
character grid. By default the component renders a 32 × 32 matrix, and you can dial the resolution up or
down with either plural (`columns`/`rows`) or singular (`column`/`row`) attributes.

```html
<script type="module" src="https://cdn.example.com/web-components/ascii-icon.js"></script>

<wc-ascii-icon
  path="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Zm-1 6.5v7l6-3.5z"
  character="@"
  aria-label="Play icon rendered as ASCII"
></wc-ascii-icon>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `path` | string | — | SVG path data (`d` attribute) that will be sampled into ASCII characters. |
| `character` | string | `"█"` | Glyph used for filled cells; accepts any printable character(s). |
| `columns` | number | `32` | Preferred column count for the ASCII grid (alias: `column`). |
| `column` | number | `32` | Singular alias for `columns`, useful when mirroring JSX-style props. |
| `rows` | number | `32` | Preferred row count for the ASCII grid (alias: `row`). |
| `row` | number | `32` | Singular alias for `rows`. |
| `cell-size` | number | `8` | Target pixel size for cells when `columns`/`rows` aren’t provided. |
| `padding` | number | `0` | Expands the measured path bounds before sampling to add breathing room. |
| `gap` | number | `0` | Shrinks each sampled cell to introduce spacing between characters. |

#### Styling hooks

- CSS custom properties: `--wc-ascii-icon-size`, `--wc-ascii-icon-character-color`,
  `--wc-ascii-icon-background`, `--wc-ascii-icon-font-family`, `--wc-ascii-icon-font-weight`,
  `--wc-ascii-icon-letter-spacing`.
- Parts: `::part(wrapper)` targets the flex container, `::part(art)` exposes the generated SVG.

### `<wc-separator>`

A flexible divider that mirrors the semantics of `<hr>` while offering vertical orientation support and
decorative presentation for purely visual usage. By default the component exposes `role="separator"` so
assistive technologies understand its purpose.

```html
<div class="stack">
  <h3>Integrations</h3>
  <p>Connect to your existing workflow with a few clicks.</p>
  <wc-separator></wc-separator>
  <div class="links">
    <a href="#">Docs</a>
    <wc-separator orientation="vertical" decorative></wc-separator>
    <a href="#">API status</a>
  </div>
</div>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Controls the axis the separator occupies. Vertical separators stretch to the available height. |
| `decorative` | boolean | `false` | Removes the structural `role` and hides the separator from assistive tech for purely visual separation. |
| `orientation` (property) | `"horizontal" \| "vertical"` | `"horizontal"` | Property alias for the orientation attribute. |
| `decorative` (property) | boolean | `false` | Reflects to the `decorative` attribute for imperative toggling. |

#### Styling hooks

- CSS custom properties: `--separator-thickness`, `--separator-color`, `--separator-length`,
  `--separator-radius`, `--separator-margin`.
- Parts: `::part(separator)` targets the internal rule element without breaking encapsulation.
- Data attributes: `[data-orientation="horizontal" | "vertical"]` for orientation-aware styling.

### `<wc-sheet>`

Slide-in companion panel that extends the dialog foundation. Use it to present tasks that complement the
primary screen—profile editors, filters, or automation presets—without fully leaving the current
context. The component traps focus, restores it on close, and exposes slots and styling hooks for
complete control.

#### Usage

```html
<script type="module" src="https://cdn.example.com/web-components/sheet.js"></script>

<wc-sheet side="right">
  <button slot="trigger">Open sheet</button>
  <span slot="title">Edit profile</span>
  <span slot="description">Make changes to your profile here.</span>
  <form>
    <!-- sheet body -->
  </form>
  <div slot="footer">
    <button type="submit">Save</button>
    <button type="button" data-sheet-close>Cancel</button>
  </div>
</wc-sheet>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | Toggles whether the sheet is visible. Reflects to the `open` property. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Controls which edge the sheet slides from. Reflects to the `side` property. |
| `open` (property) | `boolean` | `false` | Programmatic alias for the `open` attribute. |
| `side` (property) | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Property helper that updates the `side` attribute. |

#### Methods

| Name | Signature | Description |
| --- | --- | --- |
| `show()` | `(): void` | Opens the sheet. |
| `hide()` | `(): void` | Closes the sheet. |
| `toggle(force?)` | `(force?: boolean): void` | Toggles the open state, optionally forcing a specific value. |

#### Events

| Event | `detail` | Description |
| --- | --- | --- |
| `sheet-open` | `void` | Fired after the sheet finishes opening. |
| `sheet-close` | `void` | Fired after the sheet finishes closing. |

#### Slots

- `trigger` — Interactive element that toggles the sheet.
- `title` — Heading text announced to assistive technology.
- `description` — Additional context for the sheet's content.
- `close` — Custom close control rendered next to the title.
- `footer` — Action buttons displayed in the footer.
- `default` — Main body content of the sheet.

#### Styling hooks

- CSS custom properties: `--sheet-background`, `--sheet-body-gap`, `--sheet-color`, `--sheet-description-color`,
  `--sheet-description-size`, `--sheet-footer-gap`, `--sheet-header-gap`, `--sheet-max-height`,
  `--sheet-max-width`, `--sheet-overlay-backdrop-filter`, `--sheet-overlay-background`, `--sheet-padding`,
  `--sheet-radius`, `--sheet-section-gap`, `--sheet-shadow`, `--sheet-title-size`, `--sheet-title-tracking`,
  `--sheet-title-weight`, `--sheet-transition-duration`, `--sheet-transition-easing`, `--sheet-width`,
  `--sheet-z-index`.
- Parts: `::part(portal)`, `::part(overlay)`, `::part(positioner)`, `::part(panel)`, `::part(header)`,
  `::part(title)`, `::part(description)`, `::part(close)`, `::part(body)`, `::part(footer)`.
- Data attributes: `[data-side]` on the internal positioner and panel to target slide-in direction,
  `[data-sheet-close]` on slotted elements to wire up close controls.

#### Notes

- Elements slotted with `data-sheet-close` automatically close the sheet when activated.
- Trigger elements receive `aria-expanded` to indicate the current state to assistive technology.

### `<wc-diff>`

Reveal visual or textual changes with an accessible before/after slider. Users can drag the handle,
click anywhere on the surface, or use the keyboard to adjust the split between the two slotted
panes.

```html
<script type="module" src="https://cdn.example.com/web-components/diff.js"></script>

<wc-diff value="45" aria-label="Compare original and retouched imagery">
  <img slot="first" src="/images/before.jpg" alt="Before editing" />
  <img slot="second" src="/images/after.jpg" alt="After editing" />
</wc-diff>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | number | `50` | Current divider position between `min` and `max`. Values snap to `step` increments. |
| `min` | number | `0` | Smallest allowed position. Useful when working with custom ranges. |
| `max` | number | `100` | Largest allowed position. |
| `step` | number | `1` | Amount the slider moves per arrow-key press or drag snap. |
| `disabled` | boolean | `false` | Prevents pointer and keyboard interaction while maintaining the visual state. |

#### Slots

- `first` — Content displayed on top of the second slot. It is progressively revealed as the value increases.
- `second` — Baseline content that remains visible at all times.

#### Events

- `input` — Fires continuously as the divider moves. `event.detail.value` exposes the numeric position.
- `change` — Emits after pointer drags end or keyboard interactions settle. `event.detail.value` mirrors `input`.

#### Styling hooks

- CSS custom properties: `--wc-diff-min-height`, `--wc-diff-background`, `--wc-diff-border-radius`,
  `--wc-diff-border`, `--wc-diff-shadow`, `--wc-diff-divider-width`, `--wc-diff-divider-color`,
  `--wc-diff-handle-size`, `--wc-diff-handle-color`, `--wc-diff-handle-shadow`,
  `--wc-diff-focus-ring`, `--wc-diff-handle-hit-area`, `--wc-diff-object-fit`.
- Parts: `::part(container)`, `::part(first)`, `::part(second)`, `::part(handle)`.


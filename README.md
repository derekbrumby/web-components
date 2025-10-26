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
  - [`<wc-form>`](#wc-form)
  - [`<wc-checkbox>`](#wc-checkbox)
  - [`<wc-spinner>`](#wc-spinner)
  - [`<wc-skeleton>`](#wc-skeleton)
  - [`<wc-badge>`](#wc-badge)
  - [`<wc-button>`](#wc-button)
  - [`<wc-alert>`](#wc-alert)
  - [`<wc-kbd>` & `<wc-kbd-group>`](#wc-kbd--wc-kbd-group)
  - [`<wc-label>`](#wc-label)
  - [`<wc-separator>`](#wc-separator)

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
| `<wc-card>` | Flexible content container mirroring shadcn/ui card styling. | — |
| `<wc-pricing-card>` | Pricing layout with highlighted tiers and call-to-action slots. | — |
| `<wc-carousel>` | Accessible carousel with autoplay controls and pagination dots. | — |
| `<wc-progress>` | Determinate and indeterminate progress indicator with ARIA semantics. | — |
| `<wc-skeleton>` | Shimmering skeleton placeholder for loading states. | [Docs](#wc-skeleton) |
| `<wc-spinner>` | Polite loading spinner with customisable stroke and messaging. | [Docs](#wc-spinner) |

### Inputs & forms

| Component | Summary | Reference |
| --- | --- | --- |
| `<wc-form>` | Drop-in contact form with validation helpers and error slots. | [Docs](#wc-form) |
| `<wc-checkbox>` | Tri-state checkbox with form association. | [Docs](#wc-checkbox) |
| `<wc-radio-group>` | Accessible radio group mirroring Radix UI behaviour. | — |
| `<wc-toggle-group>` | Single or multi-select toggle buttons. | — |
| `<wc-button-group>` | Toolbar-aligned button group with roving tabindex. | — |
| `<wc-combobox>` | Filterable combo box backed by native listbox semantics. | — |
| `<wc-select>` | Custom select with searchable list and keyboard support. | — |
| `<wc-slider>` | Single or range slider with custom styling. | — |
| `<wc-switch>` | Toggle switch with form integration and ARIA roles. | — |
| `<wc-otp-field>` | Multi-input one-time passcode entry with auto-focus handling. | — |
| `<wc-password-toggle-field>` | Password input that exposes a reveal button. | — |

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
| `<wc-resizable>` | Wrapper that turns any element into a draggable resizable panel. |
| `<wc-drawer>` | Sliding panel with trap-focus behaviour. |
| `<wc-dialog>` / `<wc-alert-dialog>` | Modal primitives with configurable titles, descriptions, and actions. |
| `<wc-aspect-ratio>` | Enforces intrinsic ratios for responsive media. |
| `<wc-avatar>` | Avatar component with fallbacks and status badges. |
| `<wc-mockup-phone>` | Presentation frame for screenshot marketing. |
| `<wc-calendar>` / `<wc-date-picker>` | Calendar grid and date picker built on the same foundation. |
| `<wc-accordion>` / `<wc-collapsible>` | Disclosure widgets for stacked or inline content. |

### Feedback & overlays

| Component | Summary |
| --- | --- |
| `<wc-alert>` | Inline callouts for success, info, or destructive messaging. |
| `<wc-toast>` | Toast notifications with queueing support. |
| `<wc-audio-player>` | Minimal audio player with timeline and volume controls. |
| `<wc-progress>` | Visualises task completion. |
| `<wc-spinner>` | Loading spinner with accessible announcements. |
| `<wc-skeleton>` | Loading placeholder that maintains layout structure. |

### Utilities

| Component | Summary | Reference |
| --- | --- | --- |
| `<wc-markdown-viewer>` | Renders sanitised Markdown from inline strings or remote files. | [Docs](#wc-markdown-viewer) |
| `<wc-code-viewer>` | Syntax highlighted code blocks with remote loading support. | [Docs](#wc-code-viewer) |
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


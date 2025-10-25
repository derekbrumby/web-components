# Web Components

A collection of zero-dependency web components designed for CDN delivery. Each component lives in
[`src/`](./src) as a standalone module that registers its custom element when loaded.

## Getting started

Include the scripts in any HTML page. The files expose ES modules so they can be referenced with
`type="module"` script tags or bundled with your favorite tooling.

```html
<script type="module" src="https://cdn.example.com/web-components/otp-field.js"></script>
<script type="module" src="https://cdn.example.com/web-components/accordion.js"></script>
<script type="module" src="https://cdn.example.com/web-components/alert-dialog.js"></script>
<script type="module" src="https://cdn.example.com/web-components/dialog.js"></script>
<script type="module" src="https://cdn.example.com/web-components/avatar.js"></script>
<script type="module" src="https://cdn.example.com/web-components/navigation-menu.js"></script>
<script type="module" src="https://cdn.example.com/web-components/sidebar.js"></script>
<script type="module" src="https://cdn.example.com/web-components/label.js"></script>
<script type="module" src="https://cdn.example.com/web-components/hover-card.js"></script>
<script type="module" src="https://cdn.example.com/web-components/tooltip.js"></script>
<script type="module" src="https://cdn.example.com/web-components/form.js"></script>
<script type="module" src="https://cdn.example.com/web-components/collapsible.js"></script>
<script type="module" src="https://cdn.example.com/web-components/checkbox.js"></script>
<script type="module" src="https://cdn.example.com/web-components/toggle-group.js"></script>
<script type="module" src="https://cdn.example.com/web-components/radio-group.js"></script>
<script type="module" src="https://cdn.example.com/web-components/select.js"></script>
<script type="module" src="https://cdn.example.com/web-components/password-toggle-field.js"></script>
<script type="module" src="https://cdn.example.com/web-components/slider.js"></script>
<script type="module" src="https://cdn.example.com/web-components/switch.js"></script>
<script type="module" src="https://cdn.example.com/web-components/tabs.js"></script>
<script type="module" src="https://cdn.example.com/web-components/toggle.js"></script>
<script type="module" src="https://cdn.example.com/web-components/spinner.js"></script>
<script type="module" src="https://cdn.example.com/web-components/skeleton.js"></script>
<script type="module" src="https://cdn.example.com/web-components/scroll-area.js"></script>
<script type="module" src="https://cdn.example.com/web-components/popover.js"></script>
<script type="module" src="https://cdn.example.com/web-components/separator.js"></script>
<script type="module" src="https://cdn.example.com/web-components/toolbar.js"></script>
<script type="module" src="https://cdn.example.com/web-components/date-picker.js"></script>
<script type="module" src="https://cdn.example.com/web-components/progress.js"></script>
<script type="module" src="https://cdn.example.com/web-components/drawer.js"></script>
<script type="module" src="https://cdn.example.com/web-components/badge.js"></script>
```

Alternatively, clone this repository and open [`index.html`](./index.html) to explore interactive
examples for each component.

## Components

### `<wc-markdown-viewer>`

Render markdown from an inline string or fetch it from a remote `.md` file while keeping the output
sanitized. The component ships zero runtime dependencies, exposing slots for loading states and CSS
hooks for theming. GitHub-flavoured tables render with or without leading pipes so documentation
copy pastes cleanly.

```html
<script type="module" src="https://cdn.example.com/web-components/markdown-viewer.js"></script>

<!-- Inline markdown -->
<wc-markdown-viewer markdown="# Hello!\nBuilt for CDN delivery."></wc-markdown-viewer>

<!-- Attribute escaping is automatically normalised -->
<wc-markdown-viewer markdown="Line one\nLine two"></wc-markdown-viewer>

<!-- Remote markdown -->
<wc-markdown-viewer src="/docs/welcome.md">
  <span slot="loading">Loading documentation…</span>
</wc-markdown-viewer>

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `markdown` | string | `""` | Inline markdown string to render immediately. Backslash escaped newlines (e.g. `\n`) are normalised. |
| `src` | string | `""` | URL pointing to a markdown resource that will be fetched and rendered. |

#### Slots

- _(default)_ — Optional fallback markdown text. Used when neither `markdown` nor `src` provide content.
- `loading` — Displayed while a remote `src` document is loading.

#### Events

- `markdown-loadstart` — Fired when a remote request begins. `event.detail` includes `{ source }`.
- `markdown-load` — Emitted after successfully fetching content. `event.detail.markdown` contains the raw string.
- `markdown-error` — Fired when fetching fails. Access the thrown `error` through `event.detail.error`.

#### Styling hooks

- Custom properties: `--markdown-viewer-color`, `--markdown-viewer-background`, `--markdown-viewer-padding`, `--markdown-viewer-code-background`, `--markdown-viewer-code-color`, `--markdown-viewer-inline-code-background`, `--markdown-viewer-inline-code-color`, `--markdown-viewer-link-color`, `--markdown-viewer-heading-margin`, and more.
- Parts: `::part(container)`, `::part(empty)`, `::part(error)`.

### `<wc-code-viewer>`

Render syntax-highlighted code blocks from inline snippets or remote files. The element dedents light DOM content, infers languages from filenames or shebangs, and exposes a loading slot for remote requests.

```html
<script type="module" src="https://cdn.example.com/web-components/code-viewer.js"></script>

<!-- Inline code via light DOM -->
<wc-code-viewer language="ts">
import { createSignal } from 'solid-js';

export const useCounter = () => {
  const [count, setCount] = createSignal(0);
  return { count, increment: () => setCount((value) => value + 1) };
};
</wc-code-viewer>

<!-- Property assignment -->
<wc-code-viewer id="demo-viewer"></wc-code-viewer>
<script type="module">
  const viewer = document.querySelector('#demo-viewer');
  viewer.code = "console.log('Shipped as a standalone module');";
</script>

<!-- Remote file -->
<wc-code-viewer src="/snippets/example.js">
  <span slot="loading">Loading snippet…</span>
</wc-code-viewer>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | string | `""` | Inline code string to render immediately. Escaped newlines (e.g. `\n`) are normalised for convenience. |
| `src` | string | `""` | URL to fetch when remote code should be displayed. Only `http:` and `https:` schemes are allowed. |
| `language` | string | `""` | Optional syntax hint (e.g. `javascript`, `typescript`, `css`, `html`, `json`, `python`, `shell`, `yaml`). When omitted the component infers the language from the filename, `src`, or shebang. |
| `filename` | string | `""` | Hint used when inferring the language for inline snippets (for example `example.ts` or `workflow.yaml`). |

#### Slots

- `loading` — Displayed while a remote `src` file is being fetched.

#### Events

- `code-loadstart` — Fired when a remote request begins. `event.detail` includes `{ source }`.
- `code-load` — Emitted after successfully fetching content. `event.detail.code` contains the raw string.
- `code-error` — Fired when fetching fails. Access the thrown `error` through `event.detail.error`.

#### Styling hooks

- CSS custom properties: `--code-viewer-background`, `--code-viewer-foreground`, `--code-viewer-padding`, `--code-viewer-radius`, `--code-viewer-shadow`, `--code-viewer-font-family`, `--code-viewer-font-size`, `--code-viewer-comment-color`, `--code-viewer-keyword-color`, `--code-viewer-string-color`, `--code-viewer-number-color`, `--code-viewer-attribute-color`, `--code-viewer-tag-color`, `--code-viewer-entity-color`, `--code-viewer-variable-color`, `--code-viewer-punctuation-color`, `--code-viewer-accent`.
- Parts: `::part(container)`, `::part(surface)`, `::part(code)`, `::part(empty)`, `::part(error)`.
### `<wc-spinner>`

An accessible loading indicator with no runtime dependencies. Customize the spinner’s size, stroke, and color with
CSS custom properties while keeping a polite status message for assistive technologies.

```html
<wc-spinner label="Processing payment"></wc-spinner>
```

#### Attributes & properties

| `label` | string | `"Loading"` | Sets the accessible status text announced to assistive technologies. Mirrors to `aria-label` when one is not provided. |
| `visual-label` | boolean | `false` | Reveals the accessible label next to the indicator so the status is shown visually as well. |

#### Slots

- _(default)_ — Optional inline content displayed after the spinner. Useful for custom status text or icons.

#### Styling hooks

- CSS custom properties: `--wc-spinner-size`, `--wc-spinner-stroke-width`, `--wc-spinner-track-color`,
  `--wc-spinner-color`, `--wc-spinner-gap`, `--wc-spinner-duration`.
- Parts: `::part(icon)` for the SVG container, `::part(label)` for the accessible status text (visible when
  `visual-label` is present).

The element defaults to `role="status"`, `aria-live="polite"`, and `aria-busy="true"` so updates are announced without
stealing focus.

### `<wc-skeleton>`

Skeleton placeholders help communicate that content is still loading while maintaining the layout of the final UI.
Adjust each instance’s width, height, and border radius with CSS custom properties or host styles.

```html
<wc-skeleton style="--wc-skeleton-width: 12rem; --wc-skeleton-height: 1rem;"></wc-skeleton>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `still` | boolean | `false` | When present, pauses the shimmer animation for a calmer loading state. |
| `rounded` | string | `""` | Set to `"full"` to force a perfectly round radius without adjusting CSS variables. |

#### Accessibility

- Defaults to `role="presentation"` and `aria-hidden="true"` so assistive tech ignores purely decorative placeholders.
- Supply `aria-label` when the skeleton should describe its purpose (e.g. “Loading user avatar”).

#### Styling hooks

- CSS custom properties: `--wc-skeleton-width`, `--wc-skeleton-height`, `--wc-skeleton-radius`,
  `--wc-skeleton-base-color`, `--wc-skeleton-highlight-color`, `--wc-skeleton-animation-duration`.
- Parts: `::part(base)` exposes the animated surface for advanced overrides.

### `<wc-badge>`

Display statuses, counts, or links with a compact inline badge. The element mirrors the shadcn/ui
variants while remaining fully stylable through CSS variables and the exposed part hook.

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
| `href` | string | `""` | When provided the badge renders as an anchor element, inheriting the supplied URL. |
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
| `htmlFor` property | string | `""` | Property alias for `for`, useful when setting the target programmatically. |
| `control` property | `HTMLElement \| null` | `null` | Accesses the associated control element, prioritizing slotted content. |

#### Slots

- _(default)_ — Label text or inline content.
- `control` — Place a native control to wrap it with the label while keeping interactions intact.

#### Styling hooks

Tune presentation with CSS custom properties and parts:

- Custom properties: `--label-gap`, `--label-gap-with-control`, `--label-font-size`, `--label-font-weight`,
  `--label-line-height`, `--label-color`, `--label-background`, `--label-radius`, `--label-focus-outline`, and
  more.
- Parts: `::part(label)`, `::part(text)`, `::part(control)` for scoped theming without breaking internals.
### `<wc-separator>`

A flexible divider that mirrors the semantics of `<hr>` while offering vertical orientation support and
decorative presentation for purely visual usage. By default the component exposes `role="separator"`
so assistive technologies understand its purpose.

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
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Controls the axis the separator occupies. Vertical separators collapse their width and stretch to the available height. |
| `decorative` | boolean | `false` | Removes the structural `role` and hides the separator from assistive tech for purely visual separation. |
| `orientation` property | `"horizontal" \| "vertical"` | `"horizontal"` | Property alias for the orientation attribute. |
| `decorative` property | boolean | `false` | Reflects to the `decorative` attribute for imperative toggling. |

#### Styling hooks

- CSS custom properties: `--separator-thickness`, `--separator-color`, `--separator-length`,
  `--separator-radius`, `--separator-margin`.
- Parts: `::part(separator)` targets the internal rule element without breaking encapsulation.
- Data attributes: `[data-orientation="horizontal" | "vertical"]` for orientation aware styling.

### `<wc-form>`

An opinionated contact form that mirrors the Radix UI demo experience. It wires native constraint
validation to accessible inline messages, automatically focuses the first invalid control, and exposes
helpers for server-driven errors.

```html
<wc-form id="support-form" submit-label="Post question"></wc-form>

<script type="module" src="https://cdn.example.com/web-components/form.js"></script>
<script type="module">
  const form = document.getElementById('support-form');
  form?.addEventListener('wc-form-data', (event) => {
    console.log('Form payload', event.detail);
  });
  form?.addEventListener('wc-form-submit', (event) => {
    // Forward FormData to your API endpoint
    fetch('/api/support', { method: 'POST', body: event.detail });
  });
</script>
```

#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `submit-label` | string | `"Post question"` | Customises the text shown on the submit button. |

#### Methods

- `reset()` — clears the form, removes validation messages, and resets custom errors.
- `setCustomError(name: string, message: string)` — toggles a custom validation message for a field
  (`"email"` or `"question"`).
- `clearCustomError(name: string)` — convenience wrapper around `setCustomError(name, "")`.

#### Events

- `wc-form-submit` — fired after successful validation. `event.detail` is the `FormData` instance ready
  for network submission.
- `wc-form-data` — fired alongside `wc-form-submit` with a plain object version of the current values.

#### Styling hooks

- Custom properties: `--wc-form-background`, `--wc-form-foreground`, `--wc-form-muted`,
  `--wc-form-field-background`, `--wc-form-field-border`, `--wc-form-field-border-hover`,
  `--wc-form-field-border-focus`, `--wc-form-submit-background`, `--wc-form-submit-color`,
  `--wc-form-submit-hover`, `--wc-form-radius`, `--wc-form-field-radius`, `--wc-form-shadow`,
  `--wc-form-input-padding`, `--wc-form-message-error`, `--wc-form-message-error-color`, and more.
- Parts: `::part(container)`, `::part(header)`, `::part(title)`, `::part(description)`, `::part(form)`,
  `::part(field)`, `::part(label)`, `::part(messages)`, `::part(message)`, `::part(control)`,
  `::part(submit)` allow deep theming.
### `<wc-checkbox>`

An accessible, tri-state checkbox control that mirrors Radix UI’s anatomy without runtime dependencies. It
supports indeterminate states, full keyboard navigation, and form association.

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

Imperatively call `toggle(force?: boolean)` to flip the state or force a particular value.

#### Events

- `input`: Fired whenever user interaction updates the state. Bubbles and is composed.
- `change`: Mirrors the native checkbox `change` event semantics.

#### Styling hooks

- CSS custom properties: `--checkbox-size`, `--checkbox-radius`, `--checkbox-border-width`,
  `--checkbox-border-color`, `--checkbox-background`, `--checkbox-background-checked`,
  `--checkbox-background-indeterminate`, `--checkbox-foreground`, `--checkbox-shadow`, `--checkbox-focus-ring`,
  `--checkbox-gap`, `--checkbox-label-color`.
- Parts: `::part(root)`, `::part(control)`, `::part(indicator)`, `::part(label)`.
- Data attributes: `[data-state="checked" | "unchecked" | "indeterminate"]`, `[data-disabled="true"]`.

### `<wc-slider>`

An accessible slider that supports one or many thumbs, pointer and keyboard interaction, and native form
integration. It mirrors the Radix UI Slider API with attributes for orientation, inversion, and minimum spacing
between thumbs.

```html
<label id="demo-volume-label" for="demo-volume">Output volume</label>
<wc-slider
  id="demo-volume"
  aria-labelledby="demo-volume-label"
  thumb-labels="Volume"
  value="25"
  max="200"
  step="5"
  name="volume"
></wc-slider>
### `<wc-switch>`

An accessible binary toggle that mimics the Radix UI Switch while staying dependency-free. It exposes keyboard
controls, optional form participation, and styling hooks for both the track and thumb.

```html
<wc-switch name="airplane" value="enabled" checked>Airplane mode</wc-switch>
### `<wc-toggle-group>`

An accessible collection of on/off buttons. Configure it for single selection (like radio behaviour) or multiple
selection (like toggle buttons) with identical markup. Each item supports roving focus, keyboard navigation, and
ARIA pressed states.

```html
<wc-toggle-group aria-label="Text alignment" default-value="center">
  <button type="button" data-value="left" aria-label="Align left">L</button>
  <button type="button" data-value="center" aria-label="Align center">C</button>
  <button type="button" data-value="right" aria-label="Align right">R</button>
</wc-toggle-group>

<wc-toggle-group
  class="formatting-group"
  aria-label="Formatting"
  type="multiple"
  default-values="bold italic"
>
  <button type="button" data-value="bold">B</button>
  <button type="button" data-value="italic">I</button>
  <button type="button" data-value="underline">U</button>
</wc-toggle-group>
```

#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `single` \| `multiple` | `single` | Controls whether one or many buttons can be active. |
| `value` | string | `null` | Selected value in single mode. Reflects user interaction when uncontrolled. |
| `values` | space-delimited string | `""` | Active values in multiple mode. Reflects when uncontrolled. |
| `default-value` | string | `null` | Initial value for single mode without forcing control. |
| `default-values` | space-delimited string | `""` | Initial values for multiple mode without forcing control. |
| `disabled` | boolean | `false` | Disables all items and removes them from the focus order. |
| `orientation` | `horizontal` \| `vertical` | `horizontal` | Adjusts keyboard navigation and flex layout direction. |
| `loop` | boolean | `true` | Wrap keyboard navigation from end to start. Set `loop="false"` to disable wrapping. |

#### Properties

- `value: string | null` — mirrors the attribute for single mode.
- `values: string[]` — mirrors the attribute for multiple mode.
- `disabled: boolean` — toggles the component disabled state.
- `orientation: "horizontal" | "vertical"` — runtime orientation control.
- `loop: boolean` — enables or disables wrap-around focus navigation.

#### Events

- `wc-toggle-group-change` — fired whenever user interaction updates selection. `event.detail` contains
  `{ value: string | null, values: string[] }` representing the toggled value and the current collection.

#### Slots

- _(default)_ — Place any number of focusable elements (typically `<button>`). Provide `data-value` or `value`
  attributes so the group can track each item.

#### Styling hooks

- CSS custom properties: `--toggle-group-background`, `--toggle-group-shadow`, `--toggle-group-radius`,
  `--toggle-group-gap`, `--toggle-group-padding`, `--toggle-group-font-family`, `--toggle-group-item-size`,
  `--toggle-group-item-radius`, `--toggle-group-item-background`, `--toggle-group-item-color`,
  `--toggle-group-item-hover`, `--toggle-group-item-active-background`, `--toggle-group-item-active-color`,
  `--toggle-group-item-disabled-opacity`, `--toggle-group-item-focus-ring`.
- Parts: `::part(root)` for the container and `::part(item)` for each toggle button.
- Data attributes: host `[data-orientation]`, `[data-disabled]`; items `[data-state]`, `[data-disabled]`,
  `[data-position]`, and `[data-focus]` for granular styling.
### `<wc-radio-group>`

An accessible radio group with roving focus, loopable keyboard navigation, and form association built in. Each
`<wc-radio-group-item>` renders a stylable control and indicator while ensuring only one option stays selected.

```html
<wc-radio-group name="density" default-value="comfortable">
  <wc-radio-group-item value="default">Default</wc-radio-group-item>
  <wc-radio-group-item value="comfortable">Comfortable</wc-radio-group-item>
  <wc-radio-group-item value="compact">Compact</wc-radio-group-item>
</wc-radio-group>
### `<wc-select>`

Framework-agnostic select element that composes a trigger button, floating listbox, grouped options, separators,
and typeahead navigation. Inspired by the Radix UI Select primitive, the component ships with zero runtime
dependencies and exposes rich styling hooks.

```html
<wc-select placeholder="Select a fruit…">
  <wc-select-group label="Fruits">
    <wc-select-option value="apple">Apple</wc-select-option>
    <wc-select-option value="banana">Banana</wc-select-option>
    <wc-select-option value="blueberry">Blueberry</wc-select-option>
  </wc-select-group>

  <wc-select-separator></wc-select-separator>

  <wc-select-group label="Vegetables">
    <wc-select-option value="aubergine">Aubergine</wc-select-option>
    <wc-select-option value="carrot" disabled>Carrot</wc-select-option>
  </wc-select-group>
</wc-select>
### `<wc-progress>`

Display task completion with a lightweight, accessible progress indicator. The component mirrors the Radix UI
progress bar API while keeping the markup minimal and themable through CSS custom properties.

```html
<wc-progress id="task-progress" value="32" max="80" label="File upload"></wc-progress>
<script type="module" src="https://cdn.example.com/web-components/progress.js"></script>
<script type="module">
  const progress = document.getElementById('task-progress');
  progress?.addEventListener('click', () => {
    progress.value = Math.min(progress.value + 8, progress.max);
  });
</script>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Space or comma separated numbers that seed the slider thumbs. The `value` property returns a `number[]`. |
| `min` | number | `0` | Lower bound for all thumbs. |
| `max` | number | `100` | Upper bound for all thumbs. |
| `step` | number | `1` | Interval applied when dragging or using the keyboard. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Switches between horizontal and vertical layouts. |
| `inverted` | boolean | `false` | Flips the direction of increasing values. |
| `name` | string | `""` | When set, slider values participate in form submission using one entry per thumb. |
| `disabled` | boolean | `false` | Removes the slider from the focus order and blocks pointer interaction. |
| `min-steps-between-thumbs` | number | `0` | Enforces a minimum gap, expressed in steps, between neighbouring thumbs. |
| `thumb-labels` | string | `""` | Comma separated labels applied to thumbs for assistive technologies. Falls back to the host’s `aria-label`/`aria-labelledby`. |

#### Events

- `input` — Fired whenever a thumb moves. Bubbles and crosses the shadow boundary.
- `change` — Fired after a pointer drag ends or keyboard interaction commits.

#### Styling hooks

- Custom properties: `--wc-slider-width`, `--wc-slider-height`, `--wc-slider-gap`, `--wc-slider-track-size`,
  `--wc-slider-track-radius`, `--wc-slider-track-background`, `--wc-slider-range-background`,
  `--wc-slider-thumb-size`, `--wc-slider-thumb-radius`, `--wc-slider-thumb-background`,
  `--wc-slider-thumb-shadow`, `--wc-slider-thumb-focus-outline`.
- Parts: `::part(root)`, `::part(track)`, `::part(range)`, `::part(thumb)`.
| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | boolean | `false` | Sets the switch to the “on” position. Reflects to the `checked` property. |
| `disabled` | boolean | `false` | Removes the control from the tab order and blocks pointer/keyboard interaction. |
| `required` | boolean | `false` | Marks the control as required for native form validation. |
| `name` | string | `""` | Associates the component with a form entry when checked. |
| `value` | string | `"on"` | Value submitted with the parent form while checked. |

Call `toggle(force?: boolean)` to imperatively flip the value or force a specific state.

#### Events

- `input` — fires whenever the checked state changes. Bubbles and crosses shadow boundaries.
- `change` — mirrors native switch/checkbox change semantics.

#### Styling hooks

- CSS custom properties: `--switch-width`, `--switch-height`, `--switch-padding`, `--switch-radius`,
  `--switch-track-background`, `--switch-track-background-checked`, `--switch-thumb-size`,
  `--switch-thumb-background`, `--switch-thumb-shadow`, `--switch-focus-ring`, `--switch-gap`,
  `--switch-label-color`.
- Parts: `::part(root)`, `::part(control)`, `::part(thumb)`, `::part(label)`.
- Data attributes: `[data-state="checked" | "unchecked"]`, `[data-disabled="true"]`.
| `value` | string | First enabled item's value | Currently selected option. Reflects to the `value` property. |
| `default-value` | string | `""` | Initial value applied when no `value` attribute or property is set. |
| `name` | string | `""` | Associates the group with form submissions; uses the selected value. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Switch between stacked and inline layouts and keyboard direction. |
| `disabled` | boolean | `false` | Disables the entire group and removes items from the tab order. |
| `required` | boolean | `false` | When true, native validation requires a selection before form submission. |
| `loop` | boolean | `true` | Allows arrow-key navigation to wrap from the last item back to the first. |

Set `disabled` on individual `<wc-radio-group-item>` elements to remove specific choices while keeping the rest
interactive.

#### Events

- `wc-radio-group-value-change` — fired whenever the selection changes. `event.detail` contains the new `value`
  and the `origin` (`"pointer"` or `"keyboard"`).
- `input` — mirrors the native `input` event, useful for reacting to changes in real time.
- `change` — dispatched after the group updates, matching native form semantics.

#### Styling hooks

- Group-level custom properties: `--wc-radio-group-gap`, `--wc-radio-group-direction`.
- Item-level custom properties: `--wc-radio-item-size`, `--wc-radio-item-indicator-size`, `--wc-radio-item-gap`,
  `--wc-radio-item-radius`, `--wc-radio-item-background`, `--wc-radio-item-background-hover`,
  `--wc-radio-item-border`, `--wc-radio-item-shadow`, `--wc-radio-item-focus-ring`,
  `--wc-radio-item-indicator-color`, `--wc-radio-item-label-color`.
- Parts: `::part(root)` on the group, and `::part(item)`, `::part(control)`, `::part(indicator)`, `::part(label)` on
  each item for fine-grained theming.
- Data attributes: `[data-state="checked"|"unchecked"]`, `[data-disabled="true"]`, and `[data-orientation]` support
  state-based styling.
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Currently selected option value. Reflects to the `value` property. |
| `placeholder` | string | `"Select an option"` | Text shown inside the trigger when no item is selected. |
| `disabled` | boolean | `false` | Removes the component from the focus order and blocks interaction. |
| `open` property | boolean (read-only) | `false` | Indicates whether the dropdown content is visible. |

Call `open()` and `close()` to imperatively toggle the dropdown. The component also emits native `input` and
`change` events whenever the selection changes.

#### Child elements

- `<wc-select-option>` — individual choice with `value`, `disabled`, and optional `text-value` attributes for custom
  typeahead labels.
- `<wc-select-group>` — wraps related options and exposes a `label` attribute for accessible grouping.
- `<wc-select-separator>` — renders a visual separator between option clusters.

#### Events

- `wc-select-toggle` — fired whenever the dropdown opens or closes. `event.detail.open` is a boolean.
- `wc-select-change` — dispatched after the value changes. `event.detail.value` provides the new value and
  `event.detail.option` references the selected `<wc-select-option>` element.

#### Styling hooks

- CSS custom properties: `--wc-select-trigger-height`, `--wc-select-trigger-padding`,
  `--wc-select-trigger-radius`, `--wc-select-trigger-background`, `--wc-select-trigger-color`,
  `--wc-select-trigger-placeholder`, `--wc-select-trigger-border`, `--wc-select-trigger-shadow`,
  `--wc-select-trigger-focus-ring`, `--wc-select-content-background`, `--wc-select-content-border`,
  `--wc-select-content-radius`, `--wc-select-content-shadow`, `--wc-select-viewport-padding`,
  `--wc-select-viewport-max-height`, `--wc-select-icon-color`, `--wc-select-option-radius`,
  `--wc-select-option-padding`, `--wc-select-option-color`, `--wc-select-option-background`,
  `--wc-select-option-highlighted-background`, `--wc-select-option-highlighted-color`,
  `--wc-select-option-disabled-color`, `--wc-select-option-indicator-color`, `--wc-select-group-label-color`,
  `--wc-select-separator-color`.
- Parts: `::part(trigger)`, `::part(value)`, `::part(icon)`, `::part(content)`, `::part(viewport)`,
  `::part(option)`, `::part(indicator)`, `::part(text)`, `::part(group)`, `::part(label)`, `::part(group-options)`,
  `::part(separator)`.
| `value` | number \| null | `null` | Sets the current completion value. Remove the attribute or set to `null` for the indeterminate state. |
| `max` | number | `100` | Defines the maximum completion value that represents 100%. Must be greater than 0. |
| `label` | string | `""` | Optional accessible label forwarded to `aria-label`. Omit when labelling externally via `aria-labelledby`. |
| `value-text` | string | `""` | Custom text announced to assistive tech. Defaults to a generated percentage description when determinate. |

#### Slots

- `label` — Provide visible helper text that appears below the progress indicator while remaining outside the track.

#### Styling hooks

- CSS custom properties: `--progress-width`, `--progress-min-width`, `--progress-height`, `--progress-radius`,
  `--progress-background`, `--progress-indicator-background`, `--progress-indicator-foreground`,
  `--progress-transition-duration`, `--progress-transition-timing`, `--progress-complete-duration`,
  `--progress-indeterminate-duration`, `--progress-indeterminate-easing`.
- Parts: `::part(track)`, `::part(indicator)`, `::part(label)`.
- Data attributes: `[data-state="loading" | "complete" | "indeterminate"]`, `[data-value]`, `[data-max]` for
  state-driven styling.

### `<wc-password-toggle-field>`

Reveal or mask passwords with a single component that handles focus management, accessibility, and form
integration. Pointer toggles return focus to the input for fast editing, while keyboard toggles preserve button
focus for consistent navigation. After submission, the component re-masks the value to avoid accidental plaintext
storage.

```html
<form onsubmit="event.preventDefault();">
  <wc-password-toggle-field
    name="password"
    placeholder="Enter password"
    autocomplete="current-password"
    show-label="Show password"
    hide-label="Hide password"
    required
  ></wc-password-toggle-field>
  <button type="submit">Submit</button>
</form>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Current password value. Reflects the form submission value. |
| `default-visible` | boolean | `false` | Shows the password on first render while leaving the attribute free to reflect live visibility. |
| `visible` property | boolean | `false` | Runtime visibility flag. Updates automatically when the toggle is used. |
| `label` | string | `""` | Provides an `aria-label` for the input when no external label is linked. |
| `show-label` | string | `"Show password"` | Accessible text announced when the password is hidden. |
| `hide-label` | string | `"Hide password"` | Accessible text announced when the password is visible. |
| `disabled` | boolean | `false` | Disables both the input and toggle button. |
| `required` | boolean | `false` | Marks the field as required when used in forms. |
| `autocomplete` | string | `"current-password"` | Pass through to the internal input for password managers. |

Standard `<input>` attributes such as `name`, `placeholder`, `pattern`, `inputmode`, `autofocus`, `minlength`, and
`maxlength` forward directly to the internal control.

#### Events

- `visibilitychange` — fired whenever the reveal state changes. The event detail is `{ visible: boolean }` and the
  event bubbles across shadow boundaries.

#### Styling hooks

- CSS custom properties: `--wc-password-field-height`, `--wc-password-field-radius`,
  `--wc-password-field-background`, `--wc-password-field-border`, `--wc-password-field-border-hover`,
  `--wc-password-field-border-focus`, `--wc-password-field-shadow-focus`, `--wc-password-field-gap`,
  `--wc-password-field-color`, `--wc-password-field-placeholder`, `--wc-password-field-toggle-size`,
  `--wc-password-field-toggle-color`, `--wc-password-field-toggle-color-active`,
  `--wc-password-field-toggle-background`, `--wc-password-field-toggle-background-hover`.
- Parts: `::part(wrapper)`, `::part(input)`, `::part(toggle)`, `::part(icon)`, `::part(assistive-text)`.
- Data attributes: `[data-visible="true" | "false"]` on the host and toggle button for style adjustments.

### `<wc-toggle>`

An accessible, two-state toggle button that mirrors the Radix UI Toggle. It supports controlled and uncontrolled
usage, full keyboard interaction, ARIA labelling, and emits a `pressed-change` event whenever the state flips.

```html
<wc-toggle aria-label="Toggle italic text">
  <span aria-hidden="true" style="font-style: italic;">I</span>
</wc-toggle>

<p id="toggle-preview">Preview text</p>

<script type="module" src="./src/toggle.js"></script>
<script type="module">
  const italicToggle = document.querySelector('wc-toggle');
  const preview = document.getElementById('toggle-preview');
  italicToggle?.addEventListener('pressed-change', (event) => {
    preview?.classList.toggle('is-italic', event.detail.pressed);
### `<wc-toolbar>`

An accessible formatting toolbar that groups common text controls, mimicking the Radix UI toolbar demo.
It ships with multiple toggle buttons for bold, italic, and strikethrough, an exclusive alignment toggle
group, a metadata link, and a share action. Keyboard users can cycle through controls with the arrow keys
thanks to the roving tabindex implementation.

```html
<wc-toolbar alignment="left"></wc-toolbar>

<script type="module" src="https://cdn.example.com/web-components/toolbar.js"></script>
<script type="module">
  const toolbar = document.querySelector('wc-toolbar');
  toolbar?.addEventListener('wc-toolbar-share', (event) => {
    const { alignment, formats } = event.detail;
    console.log(`Share clicked with ${alignment} alignment and formats:`, formats);
  });
</script>
```

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `pressed` | boolean | `false` | Reflects the current state. Set the attribute or property for controlled usage. |
| `default-pressed` | boolean | `false` | Initial value when the element manages its own state. Combine with `reset()` to reapply. |
| `disabled` | boolean | `false` | Removes the toggle from the tab order and blocks pointer/keyboard interaction. |

#### Methods

- `toggle(force?: boolean)` — flips the pressed state or forces a specific boolean value.
- `reset()` — clears the `pressed` attribute (if present) and restores the default pressed state.

#### Events

- `pressed-change` — bubbles with `{ pressed: boolean }` whenever user interaction toggles the state.

#### Styling hooks

- CSS custom properties: `--toggle-size`, `--toggle-radius`, `--toggle-background`,
  `--toggle-background-hover`, `--toggle-background-on`, `--toggle-foreground`, `--toggle-foreground-on`,
  `--toggle-shadow`, `--toggle-focus-ring`.
- Parts: `::part(control)` and `::part(label)` for scoped visual overrides.
- Data attributes: `[data-state="on" | "off"]`, `[data-disabled="true"]`.
#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `alignment` | string | `"center"` | Controls the active alignment toggle. Accepts `"left"`, `"center"`, or `"right"`. |
| `aria-label` | string | `"Formatting options"` | Overrides the accessible label announced for the toolbar container. |

#### Properties

- `formats: string[]` — read-only array describing the currently active formatting toggles.

#### Events

- `wc-toolbar-format-change` — fired when a formatting toggle is activated or deactivated. Detail includes the
  active `value` array and information about the toggled control.
- `wc-toolbar-alignment-change` — emitted whenever the alignment selection changes. Detail contains the active
  alignment.
- `wc-toolbar-share` — triggered when the share button is pressed. Detail carries the alignment and format
  selections at the moment of activation.

#### Styling hooks

- Custom properties: `--toolbar-background`, `--toolbar-radius`, `--toolbar-shadow`, `--toolbar-color`,
  `--toolbar-accent`, `--toolbar-accent-contrast`, `--toolbar-accent-hover`, `--toolbar-hover`,
  `--toolbar-hover-contrast`, `--toolbar-focus-ring`, `--toolbar-separator-color`, `--toolbar-font-family`.
- Parts: `::part(toolbar)`, `::part(toggle-group)`, `::part(toggle)`, `::part(separator)`, `::part(metadata)`,
  `::part(share)`.

### `<wc-otp-field>`

A form-associated input optimized for one-time-password (OTP) or verification codes. It handles cell
focus management, paste-to-fill, keyboard navigation, validation, auto-submit, and exposes events for
integration.

```html
<form onsubmit="event.preventDefault();">
  <wc-otp-field
    name="otp"
    length="6"
    validation-type="numeric"
    auto-submit
    placeholder="•"
    autocomplete="one-time-code"
    style="
      --otp-gap: 0.75rem;
      --otp-input-size: 56px;
      --otp-font-size: 20px;
      --otp-border-focus: 2px solid #4f46e5;
      --otp-shadow-focus: 0 0 0 6px rgba(79, 70, 229, 0.15);
    "
  ></wc-otp-field>
  <button type="submit">Verify</button>
</form>
```

#### Key attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | number | `6` | Number of input cells. |
| `validation-type` | `numeric` \| `alphanumeric` \| `any` | `numeric` | Allowed character set. |
| `type` | `text` \| `password` | `text` | Controls masking for display. |
| `orientation` | `horizontal` \| `vertical` | `horizontal` | Layout direction for the cells. |
| `auto-submit` | boolean | `false` | Automatically submits the host form when all cells are filled. |
| `placeholder` | string | `""` | Placeholder glyph shown in empty cells. |
| `dir` | `ltr` \| `rtl` \| `auto` | `ltr` | Sets text direction for input cells. |

The element also forwards standard attributes like `name`, `autocomplete`, `autofocus`, and `disabled`.

#### Events

- `valuechange`: fired whenever the combined value changes. The event detail includes `{ value: string }`.
- `autosubmit`: emitted when `auto-submit` is enabled and the component completes entry without a native
  `form` available.

#### Styling hooks

Customize the component with CSS custom properties and parts:

- Custom properties: `--otp-gap`, `--otp-input-size`, `--otp-font-size`, `--otp-radius`, `--otp-bg`,
  `--otp-color`, `--otp-border`, `--otp-border-focus`, `--otp-shadow-focus`, etc.
- Parts: `::part(root)`, `::part(cell)`, `::part(input)`, `::part(hidden-input)` for granular theming.

### `<wc-accordion>` + `<wc-accordion-item>`

An accessible accordion system that mirrors the Radix UI anatomy. Use the root element to orchestrate
items and configure expansion behavior.

```html
<wc-accordion type="single" collapsible>
  <wc-accordion-item value="item-1">
    <span slot="trigger">Is it accessible?</span>
    <p slot="content">Yes. It adheres to the WAI-ARIA accordion pattern.</p>
  </wc-accordion-item>
  <wc-accordion-item value="item-2">
    <span slot="trigger">Can it be restyled?</span>
    <p slot="content">Absolutely! Override CSS custom properties or use ::part selectors.</p>
  </wc-accordion-item>
</wc-accordion>
```

Each `<wc-accordion-item>` exposes a `slot="trigger"` for the clickable label and a `slot="content"` for
panel content. Items generate a fallback unique `value` if one is not supplied, ensuring controlled
interaction even when used declaratively.

#### Root attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `single` \| `multiple` | `single` | Controls whether multiple panels can be open. |
| `collapsible` | boolean | `false` | When `type="single"`, allows closing the active item. |
| `orientation` | `vertical` \| `horizontal` | `vertical` | Adjusts keyboard navigation and layout hints. |
| `value` | string | `""` | Currently open item when `type="single"`. |
| `values` | comma-delimited string | `""` | Open items when `type="multiple"`. |

#### Item attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | auto-generated | Unique identifier used for programmatic control. |
| `open` | boolean | `false` | Forces the panel open. Useful for defaults. |
| `disabled` | boolean | `false` | Removes the item from interaction and focus order. |
| `heading-level` | 1-6 | `3` | Sets the `aria-level` for the internal header. |

#### Events

- `change` (emitted from `<wc-accordion>`): includes `{ value: string }` for single mode or
  `{ values: string[] }` for multiple mode.

#### Styling hooks

Both the root and items expose rich customization options:

- Root CSS properties: `--accordion-radius`, `--accordion-border`, `--accordion-surface`, `--accordion-gap`.
- Item CSS properties: `--accordion-trigger-background`, `--accordion-trigger-padding`,
  `--accordion-transition-duration`, `--accordion-content-background`, and more.
- Parts: `::part(item)`, `::part(trigger)`, `::part(trigger-label)`, `::part(indicator)`,
  `::part(panel)`, `::part(panel-inner)` allow precise targeting.

### `<wc-collapsible>`

An interactive disclosure that mirrors the Radix UI Collapsible primitive. It exposes dedicated slots for
the summary line, an optional preview area, and the collapsible body so you can recreate complex layouts
without extra wrappers.

```html
<wc-collapsible style="--collapsible-width: 300px;">
  <span slot="summary">@peduarte starred 3 repositories</span>
  <div slot="peek">@radix-ui/primitives</div>
  <div>
    <div>@radix-ui/colors</div>
    <div>@radix-ui/themes</div>
  </div>
</wc-collapsible>
```

The component manages keyboard interaction (Enter/Space), exposes imperative `show()`, `hide()`, and
`toggle()` methods, and emits an `openchange` event whenever the visibility switches.

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls visibility. Can be set declaratively or via the `open` property. |
| `disabled` | boolean | `false` | Disables interaction and updates the button's focusability. |

#### Slots

- `summary`: Required. Text or elements displayed alongside the toggle button.
- `peek`: Optional. Content that remains visible regardless of state (for featured items or previews).
- _default_: Collapsible body content shown when expanded.

#### Events

- `openchange`: Bubbles with `{ open: boolean }` whenever the panel expands or collapses.

#### Styling hooks

Tune the component using custom properties or part selectors:

- Custom properties: `--collapsible-width`, `--collapsible-background`, `--collapsible-trigger-size`,
  `--collapsible-trigger-background`, `--collapsible-summary-color`, `--collapsible-content-background`,
  `--collapsible-content-gap`, and more.
- Parts: `::part(container)`, `::part(header)`, `::part(summary)`, `::part(trigger)`, `::part(preview)`,
  `::part(content)`, `::part(icon-open)`, `::part(icon-closed)`.

### `<wc-aspect-ratio>`

A lightweight container that locks its slotted content to a specific ratio. Useful for media, embeds,
and previews where consistent sizing is required regardless of the viewport width.

```html
<wc-aspect-ratio ratio="16/9" style="max-width: 320px;">
  <img
    src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=640&dpr=2&q=80"
    alt="Landscape photograph by Tobias Tullius"
    style="border-radius: inherit;"
  />
</wc-aspect-ratio>
```

#### Key attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `ratio` | number \| string | `1` | Desired width/height ratio (supports decimals, `16/9`, or `4:3` strings). |

The component also exposes a `ratio` property for imperative updates.

#### Styling hooks

Tune the container with CSS custom properties or target internal parts:

- Custom properties: `--aspect-ratio-background`, `--aspect-ratio-border`, `--aspect-ratio-border-radius`,
  `--aspect-ratio-shadow`, `--aspect-ratio-overflow`, `--aspect-ratio-content-align`,
  `--aspect-ratio-content-justify`, `--aspect-ratio-object-fit`.
- Parts: `::part(frame)`, `::part(content)` allow scoped overrides.

### `<wc-scroll-area>`

Overlay scrollbars that sit on top of the viewport while leaving layout untouched. The component keeps
native scrolling behaviour—including keyboard navigation—while exposing hooks to restyle the bars and
thumbs.

```html
<wc-scroll-area style="inline-size: 220px; block-size: 240px; --scroll-area-background: #fff;">
  <div class="tag-stack">
    <h4>Tags</h4>
    <ul>
      <li>v1.2.0-beta.50</li>
      <li>v1.2.0-beta.49</li>
      <li>v1.2.0-beta.48</li>
      <!-- ... -->
    </ul>
  </div>
</wc-scroll-area>
```

#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'hover' \| 'scroll' \| 'always'` | `'hover'` | Controls when scrollbars are shown. `hover` reveals them on hover or scroll, `scroll` only during interaction, and `always` keeps them visible. |
| `scroll-hide-delay` | number | `600` | Milliseconds to wait before fading the bars after scrolling when `type` is `hover` or `scroll`. |
| `dir` | `'ltr' \| 'rtl'` | inherit | Forces the scrollbar placement and horizontal math for right-to-left layouts. |

#### Styling hooks

- CSS custom properties: `--scroll-area-background`, `--scroll-area-radius`, `--scroll-area-border`,
  `--scroll-area-scrollbar-girth`, `--scroll-area-scrollbar-padding`,
  `--scroll-area-scrollbar-background`, `--scroll-area-scrollbar-background-hover`,
  `--scroll-area-thumb-background`, `--scroll-area-thumb-background-hover`,
  `--scroll-area-thumb-radius`, `--scroll-area-thumb-min-size`,
  `--scroll-area-scrollbar-transition-duration`.
- Parts: `::part(viewport)`, `::part(content)`, `::part(scrollbar)`, `::part(thumb)`, `::part(corner)`.
- Data attributes: `[data-has-vertical]`, `[data-has-horizontal]`, `[data-scrollbar-type]`,
  `[data-scrollbar-visibility]`, and scrollbar-specific `[data-state="visible" | "hidden"]`.

### `<wc-dialog>`

An adaptable dialog window supporting modal and non-modal presentations. Inspired by Radix UI's Dialog, the
component handles focus management, labelling, and overlay rendering without external dependencies.

```html
<wc-dialog id="profile-dialog">
  <button slot="trigger">Edit profile</button>
  <span slot="title">Edit profile</span>
  <span slot="description">Make changes to your profile and save when you're done.</span>
  <form style="display: grid; gap: 1rem;">
    <label style="display: grid; gap: 0.35rem;">
      <span>Name</span>
      <input type="text" value="Pedro Duarte" />
    </label>
    <label style="display: grid; gap: 0.35rem;">
      <span>Username</span>
      <input type="text" value="@peduarte" />
    </label>
  </form>
  <div slot="footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
    <button type="button" class="ghost-button">Cancel</button>
    <button type="button">Save changes</button>
  </div>
</wc-dialog>
```

Slots cover the trigger, title, description, an optional footer region, and a default slot for arbitrary
content. Provide a `slot="close"` element to override the built-in close button.

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls visibility. Use the `open` property or `show()`/`hide()` methods for imperative control. |
| `modal` | boolean | `true` | When `false`, the dialog behaves non-modally (no overlay, no focus trap, page remains scrollable). |

#### Methods

- `show()` – opens the dialog.
- `hide()` – closes the dialog.
- `toggle(force?: boolean)` – toggles open state, optionally forcing a boolean value.

#### Styling hooks

Tune the presentation with CSS custom properties and parts:

- Custom properties: `--dialog-width`, `--dialog-max-height`, `--dialog-padding`, `--dialog-radius`,
  `--dialog-background`, `--dialog-color`, `--dialog-overlay-background`, `--dialog-shadow`,
  `--dialog-close-background`, etc.
- Parts: `::part(trigger)`, `::part(portal)`, `::part(overlay)`, `::part(content)`, `::part(header)`,
  `::part(title)`, `::part(description)`, `::part(body)`, `::part(footer)`, `::part(close-button)`.

### `<wc-drawer>`

A mobile-first sheet that slides from any edge of the viewport while keeping focus safely trapped. The drawer is
ideal for dense forms or confirmation flows on small screens and mirrors Vaul's ergonomics without depending on
React.

```html
<wc-drawer id="activity-drawer" placement="bottom">
  <button slot="trigger" class="ghost-button">Open drawer</button>
  <span slot="title">Move goal</span>
  <span slot="description">Set your daily activity goal.</span>
  <div class="goal-adjuster">
    <button type="button" data-step="-10">-</button>
    <output id="goal-output" for="activity-goal">350</output>
    <button type="button" data-step="10">+</button>
  </div>
  <wc-progress value="62"></wc-progress>
  <div slot="footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
    <button type="button" data-drawer-close class="ghost-button">Cancel</button>
    <button type="button">Save goal</button>
  </div>
</wc-drawer>
```

Attach your trigger via the dedicated slot and describe the sheet with the `title`/`description` slots. Buttons inside
the panel can close the sheet by adding `data-drawer-close`. The default slot renders the main body content while the
`footer` slot is perfect for stacked actions.

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls visibility. Use the property, `show()`/`hide()`, or `toggle()` for imperative control. |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Determines which edge of the viewport the drawer animates from. |

#### Methods

- `show()` – opens the drawer.
- `hide()` – closes the drawer.
- `toggle(force?: boolean)` – toggles visibility, optionally forcing a boolean value.

#### Slots

- `trigger` — Element that opens the drawer.
- `title` — Heading content announced as the accessible name.
- `description` — Supplementary text announced as the accessible description.
- _(default)_ — Main content area.
- `footer` — Sticky action region rendered after the main content.
- `close` — Optional custom close control rendered after the footer.

#### Events

- `drawer-open` — Fired after the sheet becomes visible.
- `drawer-close` — Fired after the sheet hides.

#### Styling hooks

- CSS custom properties: `--drawer-width`, `--drawer-height`, `--drawer-max-width`, `--drawer-max-height`,
  `--drawer-padding`, `--drawer-radius`, `--drawer-background`, `--drawer-color`, `--drawer-overlay-background`,
  `--drawer-overlay-backdrop-filter`, `--drawer-shadow`, `--drawer-transition-duration`, `--drawer-transition-easing`,
  `--drawer-section-gap`, `--drawer-title-size`, `--drawer-title-weight`, `--drawer-description-color`.
- Parts: `::part(trigger)`, `::part(portal)`, `::part(overlay)`, `::part(positioner)`, `::part(panel)`,
  `::part(header)`, `::part(title)`, `::part(description)`, `::part(body)`, `::part(footer)`, `::part(close)`.

### `<wc-alert-dialog>`

An accessible, focus-trapped confirmation dialog that mirrors the Radix UI alert dialog experience while
remaining dependency-free.

```html
<wc-alert-dialog>
  <button slot="trigger">Delete account</button>
  <span slot="title">Are you absolutely sure?</span>
  <span slot="description">
    This action cannot be undone. This will permanently delete your account and remove your data from our
    servers.
  </span>
  <div>
    <p>You can export your account data before continuing.</p>
  </div>
  <button slot="cancel">Cancel</button>
  <button slot="action">Yes, delete account</button>
</wc-alert-dialog>
```

Slots include `trigger`, `title`, `description`, optional default content for rich bodies, and paired
`cancel`/`action` buttons. The component provides fallback buttons when the action slots are omitted.

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls visibility. Can be set declaratively or via the `open` property. |

Programmatic helpers `show()`, `hide()`, and `toggle(force?: boolean)` are exposed for imperative control.

#### Events

- `confirm`: Fired when the primary action is activated. Cancel the event to keep the dialog open (for async
  work) and call `hide()` when ready.
- `cancel`: Emitted when the user dismisses the dialog (Cancel button, overlay click, or Escape key).

#### Keyboard support

- `Esc` closes the dialog and refocuses the trigger.
- `Tab`/`Shift+Tab` cycle focus within the dialog.
- Focus is trapped while open and returns to the invoking trigger on close.

#### Styling hooks

Customize via CSS custom properties and exposed parts:

- Custom properties: `--alert-dialog-overlay-background`, `--alert-dialog-transition-duration`,
  `--alert-dialog-padding`, `--alert-dialog-radius`, `--alert-dialog-action-background`, and more.
- Parts: `::part(overlay)`, `::part(content)`, `::part(title)`, `::part(description)`, `::part(body)`,
  `::part(footer)`, `::part(cancel-button)`, `::part(action-button)`.

### `<wc-avatar>`

An inline avatar element that progressively loads an image and gracefully falls back to initials or any custom
content. Fallback rendering can be delayed to avoid flashing while the image loads, mirroring the ergonomics of
Radix UI's Avatar component.

```html
<div class="avatar-row">
  <wc-avatar
    src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&dpr=2&q=80"
    alt="Colm Tuite"
    initials="CT"
    fallback-delay="600"
  ></wc-avatar>
  <wc-avatar
    src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?w=128&h=128&dpr=2&q=80"
    alt="Pedro Duarte"
    initials="PD"
    fallback-delay="600"
    loading="lazy"
  ></wc-avatar>
  <wc-avatar
    alt="Polly Doe"
    style="--avatar-fallback-background: #1e1b4b; --avatar-fallback-color: #ede9fe;"
  >
    PD
  </wc-avatar>
</div>
```

#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | string | `""` | Image source URL. When omitted the fallback content renders. |
| `alt` | string | `""` | Accessible label for the avatar. Use an empty string for decorative avatars. |
| `initials` | string | `""` | Default fallback text when no slotted content is supplied. Auto-generated from `alt` if omitted. |
| `fallback-delay` | number | `0` | Milliseconds to wait before revealing the fallback while the image is loading. |
| `loading` | `lazy` \| `eager` \| `auto` | `auto` | Native image loading hint forwarded to the internal `<img>`. |
| `size` | CSS length | `45px` | Convenience attribute that sets the `--avatar-size` custom property. |

The element also exposes a read-only `state` property (`"empty"`, `"loading"`, `"loaded"`, or `"error"`) and
property setters for `src`, `alt`, `initials`, and `fallbackDelay` for imperative control.

#### Slots

- _default_: optional fallback content. When empty the component uses `initials` or derives them from `alt`.

#### Styling hooks

- Custom properties: `--avatar-size`, `--avatar-radius`, `--avatar-background`, `--avatar-border`,
  `--avatar-transition`, `--avatar-fallback-background`, `--avatar-fallback-color`,
  `--avatar-fallback-font-size`, `--avatar-fallback-font-weight`, `--avatar-loading-opacity`.
- Parts: `::part(root)`, `::part(image)`, `::part(fallback)`, `::part(fallback-text)` for precise theming.

### `<wc-navigation-menu>`

An animated navigation system with triggers, indicator, and viewport-driven content inspired by the Radix UI
Navigation Menu example. The component renders a centered list of triggers, swaps contextual content into an
animated viewport, and keeps the active trigger highlighted with an indicator that tracks pointer or keyboard
interaction.

```html
<wc-navigation-menu></wc-navigation-menu>
```

The viewport resizes automatically based on the active panel and exposes CSS variables so the transitions match the
Radix demo. Use `ArrowDown` to open the focused trigger, `ArrowLeft`/`ArrowRight` or `Home`/`End` to move between
triggers, and `Escape` to close the menu. Focus is restored to the current trigger when the menu closes.

#### Styling hooks

- Custom properties: `--navigation-menu-font-family`, `--navigation-menu-foreground`, `--navigation-menu-surface`,
  `--navigation-menu-surface-shadow`, `--navigation-menu-radius`, `--navigation-menu-trigger-radius`,
  `--navigation-menu-trigger-color`, `--navigation-menu-trigger-hover`, `--navigation-menu-trigger-active`,
  `--navigation-menu-trigger-focus`, `--navigation-menu-icon-color`, `--navigation-menu-viewport-surface`,
  `--navigation-menu-viewport-shadow`, `--navigation-menu-viewport-radius`, `--navigation-menu-indicator-color`.
- Parts: `::part(root)`, `::part(surface)`, `::part(list)`, `::part(trigger)`, `::part(link)`, `::part(indicator)`,
  `::part(viewport)`, `::part(content)`.

### `<wc-sidebar-provider>`, `<wc-sidebar>`, `<wc-sidebar-trigger>`, `<wc-sidebar-menu>`

A full sidebar system that mirrors the shadcn/ui primitives. Compose collapsible navigation, sticky headers and
footers, menu badges, nested sections, and icon rails while keeping keyboard shortcuts and persisted state out of the
box.

```html
<wc-sidebar-provider persist-state>
  <wc-sidebar collapsible="icon">
    <wc-sidebar-header>...</wc-sidebar-header>
    <wc-sidebar-content>
      <wc-sidebar-group>
        <wc-sidebar-group-label>Workspace</wc-sidebar-group-label>
        <wc-sidebar-group-content>
          <wc-sidebar-menu>
            <wc-sidebar-menu-item>
              <wc-sidebar-menu-button href="#" active>
                <span>Overview</span>
              </wc-sidebar-menu-button>
              <wc-sidebar-menu-badge>12</wc-sidebar-menu-badge>
            </wc-sidebar-menu-item>
          </wc-sidebar-menu>
        </wc-sidebar-group-content>
      </wc-sidebar-group>
    </wc-sidebar-content>
    <wc-sidebar-footer>...</wc-sidebar-footer>
    <wc-sidebar-rail></wc-sidebar-rail>
  </wc-sidebar>
  <wc-sidebar-inset>
    <header>
      <wc-sidebar-trigger></wc-sidebar-trigger>
      <!-- main content -->
    </header>
  </wc-sidebar-inset>
</wc-sidebar-provider>
```

#### Key elements

- `<wc-sidebar-provider>` — manages expanded/collapsed state, keyboard shortcuts (`⌘/Ctrl + B` by default), and an
  optional persisted cookie.
- `<wc-sidebar>` — the panel itself. Supports `collapsible="icon"`, `collapsible="offcanvas"`, and non-collapsible
  variants with optional inset/floating skins.
- `<wc-sidebar-inset>` — wraps the main application area and reacts to the provider’s state so spacing stays aligned.
- `<wc-sidebar-trigger>` — button that toggles the closest provider. Works inside the sidebar or the inset content.
- `<wc-sidebar-menu>` family — render menu items, actions, badges, and sub-navigation with consistent spacing.

#### `<wc-sidebar-provider>` attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `true` | Controlled open state. Can be managed via property or attribute. |
| `default-open` | boolean | `true` | Sets the initial open value without forcing a controlled state. |
| `persist-state` | boolean | `false` | When present, the component stores the current state in a cookie. |
| `cookie-name` | string | `"sidebar_state"` | Customise the cookie key used when `persist-state` is enabled. |
| `shortcut` | string | `"b"` | Keyboard shortcut letter for the toggle (`⌘+shortcut` on macOS, `Ctrl+shortcut` elsewhere). |
| `mobile-query` | string | `"(max-width: 960px)"` | Media query that switches the sidebar into an offcanvas overlay. |

#### `<wc-sidebar>` attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `sidebar` \| `floating` \| `inset` | `sidebar` | Controls framing and border radius. |
| `collapsible` | `icon` \| `offcanvas` \| `none` | `icon` | Determines collapsed behaviour. `offcanvas` hides the panel entirely. |
| `side` | `left` \| `right` | `left` | Positions the sidebar on the chosen edge of the provider. |

#### Menu primitives

- `<wc-sidebar-menu-item>` groups controls horizontally so badges and actions align.
- `<wc-sidebar-menu-button>` renders a link or button. Use the `href` attribute for navigation and `active` to flag the
  current page.
- `<wc-sidebar-menu-action>` exposes an auxiliary button next to the main item (e.g. for dropdown menus).
- `<wc-sidebar-menu-badge>` displays counts or statuses.
- `<wc-sidebar-menu-sub>` / `<wc-sidebar-menu-sub-item>` / `<wc-sidebar-menu-sub-button>` render nested navigation.
- `<wc-sidebar-menu-skeleton>` mirrors the final layout for loading states.

#### Styling hooks

- Custom properties: `--wc-sidebar-width`, `--wc-sidebar-width-mobile`, `--wc-sidebar-collapsed-width`,
  `--wc-sidebar-transition-duration`, `--wc-sidebar-transition-easing`, `--sidebar`, `--sidebar-foreground`,
  `--sidebar-border`, `--sidebar-ring`, `--sidebar-group-gap`, `--sidebar-menu-button-gap`,
  `--sidebar-menu-action-padding`, `--sidebar-inset-padding`, and more exposed across the subcomponents.
- Parts: `::part(base)`, `::part(scroll)`, `::part(header)`, `::part(content)`, `::part(footer)`, `::part(group)`,
  `::part(group-header)`, `::part(group-content)`, `::part(menu)`, `::part(menu-item)`, `::part(menu-button)`,
  `::part(menu-action)`, `::part(menu-badge)`, `::part(menu-sub)`, `::part(menu-skeleton)`.

### `<wc-menubar>`

A desktop-style menu bar that mirrors the Radix UI example with nested submenus, checkable items, and radio
groups. The component manages focus, keyboard navigation, and menu positioning without external
dependencies.

```html
<wc-menubar
  style="
    --menubar-surface: #ffffff;
    --menubar-item-highlight: linear-gradient(135deg, #7c3aed, #6366f1);
    --menubar-focus-ring: 0 0 0 2px rgba(99, 102, 241, 0.35);
  "
></wc-menubar>
```

#### Events

| Event | Detail | Description |
| --- | --- | --- |
| `menubar-select` | `{ menu: string \| null, label: string }` | Fired when a standard menu item is activated. |
| `menubar-checkbox-toggle` | `{ item: string, checked: boolean }` | Emitted when a checkbox item is toggled. |
| `menubar-radio-change` | `{ value: string }` | Emitted when a different radio profile is selected. |

#### Styling hooks

- Custom properties: `--menubar-surface`, `--menubar-shadow`, `--menubar-trigger-color`,
  `--menubar-trigger-highlight`, `--menubar-panel-surface`, `--menubar-panel-shadow`,
  `--menubar-item-color`, `--menubar-item-highlight`, `--menubar-shortcut-color`,
  `--menubar-focus-ring`, and more.
- Parts: `::part(menubar)`, `::part(trigger)`, `::part(menu)`, `::part(menu-item)`, `::part(shortcut)`,
  `::part(indicator)`, `::part(submenu)`.
### `<wc-hover-card>`

A hover-activated preview surface that reveals supplemental information next to a trigger element. Inspired by
the Radix UI Hover Card, it remains focus-aware, delay-configurable, and ships with collision-aware styling hooks.

```html
<wc-hover-card open-delay="0" close-delay="120">
  <button slot="trigger" type="button" style="border-radius: 999px; padding: 0.25rem 0.75rem;">
    Hover for profile
  </button>
  <div slot="content" style="display: grid; gap: 0.5rem;">
    <strong>Radix UI</strong>
    <p style="margin: 0;">Accessible components, icons, and design tokens for building better UI.</p>
  </div>
</wc-hover-card>
```

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls visibility. When set the card stays open until cleared. |
| `default-open` | boolean | `false` | Opens the card on first render without setting `open`. Useful for demos. |
| `open-delay` | number | `700` | Milliseconds to wait before opening after pointer hover/focus. |
| `close-delay` | number | `300` | Milliseconds to wait before closing once the pointer/focus leaves. |
| `side` | `top` \| `right` \| `bottom` \| `left` | `bottom` | Placement of the content relative to the trigger. |
| `align` | `start` \| `center` \| `end` | `center` | Alignment along the cross axis for the chosen side. |
| `side-offset` | number | `8` | Gap between the trigger and the card, in pixels. |
| `align-offset` | number | `0` | Fine-tunes alignment in pixels along the cross axis. |
| `hide-arrow` | boolean | `false` | Removes the pointing arrow from the rendered content. |

The element mirrors these attributes with camelCase properties (`openDelay`, `closeDelay`, etc.).

#### Events

- `openchange`: fired whenever visibility toggles. Detail payload: `{ open: boolean }`.

#### Methods

- `show()`: Opens immediately, bypassing delays.
- `hide()`: Closes immediately.
- `toggle(force?: boolean)`: Toggles visibility or forces a state when `force` is provided.

#### Styling hooks

Customize using CSS custom properties and parts:

- Custom properties: `--hover-card-surface`, `--hover-card-color`, `--hover-card-radius`,
  `--hover-card-shadow`, `--hover-card-border`, `--hover-card-padding`, `--hover-card-gap`,
  `--hover-card-side-offset`, `--hover-card-align-offset`, `--hover-card-transition-duration`,
  `--hover-card-transition-timing`, `--hover-card-arrow-size`, `--hover-card-arrow-shadow`.
-- Parts: `::part(trigger)`, `::part(content)`, `::part(arrow)` and the default `::part(trigger-button)`
  fallback.

#### Keyboard support

### `<wc-tooltip>`

An accessible tooltip surface that opens when its trigger receives hover or focus and closes on pointer exit,
trigger activation, or the Escape key. Configure per-instance delays, placement, and arrow visibility while
keeping the implementation dependency free.

```html
<wc-tooltip open-delay="200" close-delay="120" side="bottom">
  <button slot="trigger" type="button" aria-label="Add to library">＋</button>
  <span>Add to library</span>
</wc-tooltip>
### `<wc-popover>`

Display contextual surfaces that stay anchored to a trigger while respecting viewport constraints. The component
supports modal and non-modal modes, optional arrows, collision-aware placement, and a fully-managed focus lifecycle.

```html
<wc-popover side="bottom" align="center">
  <button slot="trigger" type="button">Open popover</button>
  <div slot="content">
    <h3>Team settings</h3>
    <p>Promote collaborators or update plan limits directly in place.</p>
    <button type="button" data-popover-close>Close</button>
  </div>
</wc-popover>

<script type="module" src="https://cdn.example.com/web-components/popover.js"></script>
```

#### Attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Forces the tooltip open. Remove the attribute to return to interactive behavior. |
| `default-open` | boolean | `false` | Opens on first render without reflecting the `open` attribute. Ideal for demos. |
| `open-delay` | number | `700` | Milliseconds to wait before opening after pointer hover. Keyboard focus opens instantly. |
| `close-delay` | number | `150` | Milliseconds to wait before closing once focus or hover leaves the trigger/content. |
| `side` | `top` \| `right` \| `bottom` \| `left` | `top` | Placement of the tooltip content relative to the trigger. |
| `align` | `start` \| `center` \| `end` | `center` | Cross-axis alignment for the chosen side. |
| `side-offset` | number | `6` | Gap in pixels between the trigger and tooltip. |
| `align-offset` | number | `0` | Additional pixel offset along the alignment axis. |
| `hide-arrow` | boolean | `false` | Removes the decorative arrow while leaving positioning intact. |

Each attribute also exposes a camelCase property counterpart (`openDelay`, `closeDelay`, etc.) for imperative
control.

#### Styling hooks

- Custom properties: `--tooltip-surface`, `--tooltip-color`, `--tooltip-border`, `--tooltip-radius`,
  `--tooltip-padding`, `--tooltip-shadow`, `--tooltip-font-size`, `--tooltip-font-weight`,
  `--tooltip-line-height`, `--tooltip-side-offset`, `--tooltip-align-offset`, `--tooltip-arrow-size`,
  `--tooltip-transition-duration`, `--tooltip-transition-timing`, `--tooltip-trigger-focus-shadow`.
- Parts: `::part(trigger)`, `::part(content)`, `::part(arrow)`.
- Data attributes: `[data-state="open" | "closed"]`, `[data-side]`, `[data-align]`, `[data-hide-arrow]` for
  state-aware theming.
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls visibility. When omitted, the component manages its own open state. |
| `default-open` | boolean | `false` | Opens the popover on first render without reflecting the `open` attribute. |
| `modal` | boolean | `false` | When present, focus is trapped inside the popover until it closes. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Preferred side for positioning relative to the anchor. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alignment on the cross axis. |
| `side-offset` | number | `8` | Pixel offset applied away from the anchor along the chosen side. |
| `align-offset` | number | `0` | Additional shift along the alignment axis. |
| `collision-padding` | number | `8` | Minimum distance to keep between the surface and viewport edges. |
| `avoid-collisions` | boolean | `true` | Disable to prevent automatic side flipping when the preferred side overflows. |
| `hide-arrow` | boolean | `false` | Removes the decorative arrow element. |
| `close-on-escape` | boolean | `true` | Toggle whether pressing Escape dismisses the popover. |
| `close-on-interact-outside` | boolean | `true` | Disable to keep the popover open when clicking or focusing outside. |
| `open` property | boolean | `false` | Imperative property that mirrors the `open` attribute. |
| `modal` property | boolean | `false` | Imperative property controlling modal behaviour. |

#### Methods

- `show()` — opens the popover.
- `hide()` — closes the popover.
- `toggle(force?: boolean)` — toggles visibility or forces a specific state when `force` is supplied.

#### Events

- `wc-popover-open` — fired whenever the popover transitions to the open state.
- `wc-popover-close` — fired whenever the popover transitions to the closed state.

#### Slots

- `trigger` — interactive element that toggles the popover when activated.
- `anchor` — optional positioning reference. When omitted, the trigger is used as the anchor.
- `content` — rich content rendered inside the floating surface.

#### Styling hooks

- CSS custom properties: `--wc-popover-surface`, `--wc-popover-color`, `--wc-popover-border`,
  `--wc-popover-shadow`, `--wc-popover-radius`, `--wc-popover-padding`, `--wc-popover-gap`,
  `--wc-popover-arrow-size`, `--wc-popover-arrow-offset`, `--wc-popover-transform-origin`,
  `--wc-popover-trigger-width`, `--wc-popover-trigger-height`, `--wc-popover-content-available-width`,
  `--wc-popover-content-available-height`, `--wc-popover-collision-padding`, `--wc-popover-z-index`.
- Parts: `::part(trigger)`, `::part(content)`, `::part(arrow)` for scoped theming.
- Data attributes: `[data-state="open" | "closed"]`, `[data-side]`, `[data-align]`, and `[data-modal]` enable
  direction-aware transitions.

### `<wc-date-picker>`

An all-in-one calendar popover for capturing single dates or ranges. It bundles range highlighting, quick presets,
keyboard navigation, and locale-aware formatting while staying dependency free.

```html
<wc-date-picker mode="range" value="2024-05-01..2024-05-07"></wc-date-picker>

<script type="module" src="https://cdn.example.com/web-components/date-picker.js"></script>
```

#### Attributes & properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Selected date as `YYYY-MM-DD` or range as `start..end`. Mirrors the `value` property. |
| `mode` | `"single" \| "range"` | `"single"` | Switch between a single date or start/end range picker. |
| `min` | string | `""` | Lower bound in `YYYY-MM-DD`. Disabled days before this date. |
| `max` | string | `""` | Upper bound in `YYYY-MM-DD`. Disabled days after this date. |
| `locale` | string | Browser locale | Custom locale passed to `Intl.DateTimeFormat`. Updates weekday/month labels. |
| `first-day-of-week` | number | `0` | Index of the first weekday (0 = Sunday, 1 = Monday, ...). |
| `placeholder` | string | `"Select date" / "Select dates"` | Custom text when no selection is made. |
| `hide-presets` | boolean | `false` | Removes the quick preset column for a slimmer layout. |
| `value` property | string | `""` | Programmatic mirror of the attribute. Setting it reflects back to the DOM. |
| `mode` property | `"single" \| "range"` | `"single"` | Imperatively toggle the selection mode. |

#### Methods

- `open()` — reveals the calendar popover.
- `close()` — hides the popover.

#### Events

- `date-change` — fired after a confirmed selection. `event.detail` includes `{ value, start, end }` with native `Date`
  instances (the `end` value is `null` when `mode="single"`).

#### Styling hooks

- CSS custom properties: `--wc-date-picker-background`, `--wc-date-picker-border-color`,
  `--wc-date-picker-radius`, `--wc-date-picker-shadow`, `--wc-date-picker-accent`,
  `--wc-date-picker-accent-soft`, `--wc-date-picker-muted`, `--wc-date-picker-gap`.
- Parts: `::part(trigger)`, `::part(label)`, `::part(icon)`, `::part(panel)`, `::part(calendar)`, `::part(month)`,
  `::part(month-title)`, `::part(nav)`, `::part(weekdays)`, `::part(grid)`, `::part(day)`, `::part(presets)`,
  `::part(preset-button)`, `::part(status)`.
- Data attributes: `[data-open]`, `[data-empty]`, `[data-selected]`, `[data-in-range]`, `[data-range-start]`,
  `[data-range-end]`, `[data-today]`, `[data-outside]`, `[data-disabled]` for targeted styling.

### `<wc-dropdown-menu>` and friends

A composable dropdown menu system inspired by Radix UI. It offers a declarative API for menu triggers, items,
separators, labels, submenus, checkbox items, and radio groups while keeping focus management and keyboard
navigation accessible by default.

```html
<wc-dropdown-menu>
  <button slot="trigger" aria-label="Customise options" class="menu-trigger">
    ☰
  </button>

  <wc-dropdown-item shortcut="⌘+T">New Tab</wc-dropdown-item>
  <wc-dropdown-item shortcut="⌘+N">New Window</wc-dropdown-item>
  <wc-dropdown-item shortcut="⇧+⌘+N" disabled>New Private Window</wc-dropdown-item>

  <wc-dropdown-submenu>
    More Tools
    <wc-dropdown-item slot="submenu" shortcut="⌘+S">Save Page As…</wc-dropdown-item>
    <wc-dropdown-item slot="submenu">Create Shortcut…</wc-dropdown-item>
    <wc-dropdown-item slot="submenu">Name Window…</wc-dropdown-item>
    <wc-dropdown-separator slot="submenu"></wc-dropdown-separator>
    <wc-dropdown-item slot="submenu">Developer Tools</wc-dropdown-item>
  </wc-dropdown-submenu>

  <wc-dropdown-separator></wc-dropdown-separator>
  <wc-dropdown-checkbox-item shortcut="⌘+B" checked>Show Bookmarks</wc-dropdown-checkbox-item>
  <wc-dropdown-checkbox-item>Show Full URLs</wc-dropdown-checkbox-item>

  <wc-dropdown-separator></wc-dropdown-separator>
  <wc-dropdown-label>People</wc-dropdown-label>
  <wc-dropdown-radio-group value="pedro">
    <wc-dropdown-radio-item value="pedro">Pedro Duarte</wc-dropdown-radio-item>
    <wc-dropdown-radio-item value="colm">Colm Tuite</wc-dropdown-radio-item>
  </wc-dropdown-radio-group>
</wc-dropdown-menu>
```

#### Root attributes & properties

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls menu visibility. Toggle with the `open` property or `toggle()` method. |

#### Menu building blocks

| Element | Purpose |
| --- | --- |
| `<wc-dropdown-item>` | Standard actionable menu row supporting optional shortcut text via the `shortcut` attribute. |
| `<wc-dropdown-checkbox-item>` | Toggleable checkbox item. Reflects `checked`/`indeterminate` states and emits `wc-dropdown-checkbox-change`. |
| `<wc-dropdown-radio-group>` | Groups radio items. Control the active value with the `value` attribute/property. |
| `<wc-dropdown-radio-item>` | Exclusive selection item inside a radio group. Emits `wc-dropdown-radio-change` on selection. |
| `<wc-dropdown-submenu>` | Opens a nested fly-out menu. Place submenu children with `slot="submenu"`. |
| `<wc-dropdown-label>` | Visual label for a section. |
| `<wc-dropdown-separator>` | Renders a horizontal rule between sections. |

#### Events

- `wc-dropdown-select`: Fired whenever a menu item (including checkbox/radio items) is activated.
- `wc-dropdown-checkbox-change`: Emitted from `<wc-dropdown-checkbox-item>` with `{ checked, item }`.
- `wc-dropdown-radio-change`: Emitted from `<wc-dropdown-radio-item>` with `{ value, item }` when a new option is chosen.
- `wc-dropdown-toggle`: Emitted from `<wc-dropdown-menu>` whenever the root open state changes.

#### Styling hooks

- Root custom properties: `--wc-dropdown-width`, `--wc-dropdown-radius`, `--wc-dropdown-background`,
  `--wc-dropdown-padding`, `--wc-dropdown-shadow`, `--wc-dropdown-border-color`, `--wc-dropdown-offset`,
  `--wc-dropdown-trigger-background`, `--wc-dropdown-trigger-color`.
- Item custom properties: `--wc-dropdown-item-radius`, `--wc-dropdown-item-padding`,
  `--wc-dropdown-item-background`, `--wc-dropdown-item-background-hover`, `--wc-dropdown-item-background-active`,
  `--wc-dropdown-item-shortcut-color`, `--wc-dropdown-focus-outline`.
- Parts: `::part(trigger)`, `::part(trigger-button)`, `::part(content)`, `::part(button)`, `::part(label)`,
  `::part(indicator)`, `::part(submenu)`, `::part(submenu-indicator)` for fine-grained overrides.

The component manages focus, supports `Escape`, arrow key navigation, Home/End, and closes on outside interaction
by default. Nested submenus inherit keyboard support (Arrow Right/Left) and reuse the same styling tokens for
consistent theming.
### `<wc-context-menu>`

A pointer-positioned context menu that mirrors the Radix UI anatomy while remaining dependency free. Right-click,
keyboard shortcuts, or long-press on touch devices to summon the menu.

```html
<wc-context-menu></wc-context-menu>
```

The element renders a fully working menu with submenus, checkable items, and a radio group. It manages focus,
collision-aware positioning (including horizontal/vertical flipping to avoid viewport overflow), and dismiss
behaviour automatically.

#### Events

- `select`: Fired when a standard menu item (non-checkbox/radio) is activated. The `detail` includes
  `{ command: string | null }`.
- `toggle`: Fired when a checkbox or radio item changes. The detail is
  `{ type: 'checkbox', name: string | undefined, checked: boolean }` for checkboxes and
  `{ type: 'radio', group: string | undefined, value: string }` for radios.

#### Interaction features

- Context menu triggers on right-click, `Shift+F10`, the dedicated context-menu key, or a 550&nbsp;ms long press.
- Arrow keys, Home/End, and Escape work as expected for navigating and dismissing.
- Submenus open on hover, focus, arrow-right, or click, with responsive collision handling.
- Checkboxes and radios reflect their state visually with built-in indicators and emit change events.

#### Styling hooks

Tune the appearance with CSS properties or style parts directly:

- Custom properties: `--context-menu-trigger-background`, `--context-menu-trigger-border`,
  `--context-menu-trigger-color`, `--context-menu-background`, `--context-menu-shadow`,
  `--context-menu-item-highlight`, `--context-menu-separator-color`, `--context-menu-indicator-color`, etc.
- Parts: `::part(trigger)`, `::part(menu)`, `::part(submenu)`.

### `<wc-tabs>`

An accessible tab system composed of a root controller plus lightweight triggers and panels. It mirrors the
Radix UI tabs anatomy with support for horizontal or vertical layouts, automatic or manual activation, and
roving focus that follows arrow keys.

```html
<wc-tabs default-value="account">
  <wc-tablist aria-label="Manage your account">
    <wc-tab value="account">Account</wc-tab>
    <wc-tab value="password">Password</wc-tab>
  </wc-tablist>
  <wc-tabpanel value="account">
    <p>Make changes to your account here. Click save when you're done.</p>
  </wc-tabpanel>
  <wc-tabpanel value="password">
    <p>Change your password here. After saving, you'll be logged out.</p>
  </wc-tabpanel>
</wc-tabs>
```

#### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | `""` | Current active tab value. Reflects whenever selection changes; set it to control the component imperatively. |
| `default-value` | string | `""` | Initial tab when `value` is not provided. Useful for uncontrolled usage. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Lays out triggers across the top/bottom (`horizontal`) or side (`vertical`). |
| `activation-mode` | `"automatic" \| "manual"` | `"automatic"` | Automatic switches panels on arrow navigation. Manual keeps focus movement separate until Enter/Space activates a tab. |

#### Child elements

- `<wc-tablist>` wraps the interactive triggers. Apply `aria-label`/`aria-labelledby` to describe the set.
- `<wc-tab value="...">` renders a focusable trigger. Add `disabled` to remove it from interaction and roving focus.
- `<wc-tabpanel value="...">` hosts the associated content. Its `value` must match a `<wc-tab>`.

#### Events

- `wc-tabs-change` — fired when the active tab updates. `event.detail.value` contains the new value.

#### Styling hooks

- CSS custom properties: `--tabs-width`, `--tabs-max-width`, `--tabs-background`, `--tabs-border`, `--tabs-radius`,
  `--tabs-shadow`, `--tabs-list-background`, `--tabs-list-border`, `--tabs-list-gap`, `--tabs-list-min-width`,
  `--tabs-trigger-padding`, `--tabs-trigger-font-size`, `--tabs-trigger-font-weight`, `--tabs-trigger-color`,
  `--tabs-trigger-active-color`, `--tabs-trigger-background`, `--tabs-trigger-background-hover`,
  `--tabs-trigger-background-active`, `--tabs-trigger-radius`, `--tabs-trigger-focus-ring`,
  `--tabs-trigger-gap`, `--tabs-trigger-active-shadow`, `--tabs-panel-padding`, `--tabs-panel-background`,
  `--tabs-panel-color`, `--tabs-panel-radius`, `--tabs-panel-radius-vertical`, `--tabs-panel-shadow`,
  `--tabs-panel-focus-ring`.
- Parts: `::part(container)`, `::part(list)`, `::part(trigger)`, `::part(panel)`.
- Data attributes: `[data-orientation]` and `[data-value]` on `<wc-tabs>`, `[data-state]`, `[data-disabled]` on
  `<wc-tab>`, and `[data-state]` on `<wc-tabpanel>`.
### `<wc-toast>`

An accessible toast notification component that mirrors Radix UI's Toast primitives without dependencies. It provides
automatic dismissal with pause/resume handling, viewport hotkeys, swipe-to-dismiss gestures, and styling hooks for a
foreground or background announcement.

```html
<button id="toast-trigger" type="button">Add to calendar</button>

<wc-toast
  id="calendar-toast"
  title="Scheduled: Catch up"
  action-label="Undo"
  label="Notifications ({hotkey})"
  hotkey="F8"
>
  <time slot="description"></time>
</wc-toast>

<script type="module" src="./src/toast.js"></script>
<script type="module">
  const toast = document.getElementById("calendar-toast");
  const description = toast?.querySelector('time[slot="description"]');
  const trigger = document.getElementById("toast-trigger");

  const oneWeekAway = () => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  };

  trigger?.addEventListener("click", () => {
    const eventDate = oneWeekAway();
    if (description) {
      description.dateTime = eventDate.toISOString();
      description.textContent = eventDate.toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      });
    }
    toast?.show();
  });
</script>
```

#### Attributes & properties

| Attribute / Property | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Controls whether the toast is visible. Toggle with the `open` property or the `show()` / `close()` methods. |
| `default-open` | boolean | `false` | Opens the toast once when the component is initialised. |
| `duration` | number | `5000` | Auto-dismiss timeout in milliseconds. Set to `0` to disable automatic closing. |
| `title` | string | `""` | Text content used when no slotted `title` node is supplied. |
| `description` | string | `""` | Text content used when no slotted `description` node is supplied. |
| `action-label` | string | `""` | Label for the default action button. Supply a node in the `action` slot to fully customise the action. |
| `label` | string | `"Notifications ({hotkey})"` | Accessible label applied to the toast viewport. `{hotkey}` expands to the configured keyboard shortcut. |
| `hotkey` | string | `"F8"` | Keyboard shortcut (comma separated combinations such as `"Alt+KeyT"`) that focuses the toast viewport. |
| `type` | `"foreground" \| "background"` | `"foreground"` | Controls the `aria-live` politeness level. |

#### Methods

- `show(options?: { title?: string; description?: string; actionLabel?: string; duration?: number; })` — Opens the toast
  and optionally overrides its content or duration for that display.
- `close(reason?: "api" | "timeout" | "action" | "close-button" | "swipe" | "escape")` — Closes the toast and emits a
  `wc-toast-close` event with the supplied reason.

#### Events

- `wc-toast-open` — Fired when the toast becomes visible. `event.detail.reason` indicates why the toast opened.
- `wc-toast-close` — Fired when the toast closes. The detail includes a `reason` such as `timeout`, `action`, or
  `swipe`.
- `wc-toast-action` — Emitted when the default action button is activated.
- `wc-toast-pause` / `wc-toast-resume` — Fired when the auto-dismiss timer pauses or resumes because of pointer,
  focus, swipe, or visibility interactions.

#### Styling hooks

Customise appearance with CSS properties or the exposed parts:

- Custom properties: `--wc-toast-background`, `--wc-toast-foreground`, `--wc-toast-shadow`, `--wc-toast-border`,
  `--wc-toast-radius`, `--wc-toast-padding`, `--wc-toast-viewport-padding`, `--wc-toast-action-background`,
  `--wc-toast-action-color`, `--wc-toast-close-color`, `--wc-toast-swipe-move-x`, `--wc-toast-swipe-end-x`, etc.
- Parts: `::part(viewport)`, `::part(toast)`, `::part(title)`, `::part(description)`, `::part(actions)`,
  `::part(action)`, `::part(close)`.

### Examples

See [`index.html`](./index.html) for live demos showcasing:

- OTP field variations (numeric, masked, vertical layouts) with event logging.
- Accordion setups demonstrating `single`/`multiple` behavior, custom theming, and horizontal orientation.
- Alert dialogs with destructive confirmations, async flows, and custom styling via CSS properties.
- Aspect ratio containers framing responsive images and responsive embeds.
- Hover cards that preview Radix UI social metadata with delayed entry/exit.
- Dropdown menus with submenus, checkboxes, and radio groups mirroring Radix UI ergonomics.
- Tabs demonstrating automatic activation, manual vertical layouts, and live value change events.
- Toast notifications with programmatic triggers, accessible time descriptions, and swipe-to-dismiss behaviour.

## Contributing

- Place new components inside [`src/`](./src) as standalone modules.
- Export functionality by registering custom elements within the file and guarding repeated registrations.
- Document attributes, events, and styling hooks in this README and surface usage examples in `index.html`.

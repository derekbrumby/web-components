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
<script type="module" src="https://cdn.example.com/web-components/avatar.js"></script>
<script type="module" src="https://cdn.example.com/web-components/form.js"></script>
<script type="module" src="https://cdn.example.com/web-components/collapsible.js"></script>
<script type="module" src="https://cdn.example.com/web-components/checkbox.js"></script>
```

Alternatively, clone this repository and open [`index.html`](./index.html) to explore interactive
examples for each component.

## Components

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

### Examples

See [`index.html`](./index.html) for live demos showcasing:

- OTP field variations (numeric, masked, vertical layouts) with event logging.
- Accordion setups demonstrating `single`/`multiple` behavior, custom theming, and horizontal orientation.
- Alert dialogs with destructive confirmations, async flows, and custom styling via CSS properties.
- Aspect ratio containers framing responsive images and responsive embeds.

## Contributing

- Place new components inside [`src/`](./src) as standalone modules.
- Export functionality by registering custom elements within the file and guarding repeated registrations.
- Document attributes, events, and styling hooks in this README and surface usage examples in `index.html`.

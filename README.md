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
```

Alternatively, clone this repository and open [`index.html`](./index.html) to explore interactive
examples for each component.

## Components

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

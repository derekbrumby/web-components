# Web Components

A collection of zero-dependency web components designed for CDN delivery. Each component lives in
[`src/`](./src) as a standalone module that registers its custom element when loaded.

## Getting started

Include the scripts in any HTML page. The files expose ES modules so they can be referenced with
`type="module"` script tags or bundled with your favorite tooling.

```html
<script type="module" src="https://cdn.example.com/web-components/otp-field.js"></script>
<script type="module" src="https://cdn.example.com/web-components/accordion.js"></script>
```

Alternatively, clone this repository and open [`index.html`](./index.html) to explore interactive
examples for each component.

## Components

### `<otp-field>`

A form-associated input optimized for one-time-password (OTP) or verification codes. It handles cell
focus management, paste-to-fill, keyboard navigation, validation, auto-submit, and exposes events for
integration.

```html
<form onsubmit="event.preventDefault();">
  <otp-field
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
  ></otp-field>
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

### Examples

See [`index.html`](./index.html) for live demos showcasing:

- OTP field variations (numeric, masked, vertical layouts) with event logging.
- Accordion setups demonstrating `single`/`multiple` behavior, custom theming, and horizontal orientation.

## Contributing

- Place new components inside [`src/`](./src) as standalone modules.
- Export functionality by registering custom elements within the file and guarding repeated registrations.
- Document attributes, events, and styling hooks in this README and surface usage examples in `index.html`.

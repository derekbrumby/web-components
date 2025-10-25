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
<script type="module" src="https://cdn.example.com/web-components/label.js"></script>
<script type="module" src="https://cdn.example.com/web-components/hover-card.js"></script>
<script type="module" src="https://cdn.example.com/web-components/form.js"></script>
<script type="module" src="https://cdn.example.com/web-components/collapsible.js"></script>
<script type="module" src="https://cdn.example.com/web-components/checkbox.js"></script>
<script type="module" src="https://cdn.example.com/web-components/password-toggle-field.js"></script>
<script type="module" src="https://cdn.example.com/web-components/scroll-area.js"></script>
```

Alternatively, clone this repository and open [`index.html`](./index.html) to explore interactive
examples for each component.

## Components

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

### Examples

See [`index.html`](./index.html) for live demos showcasing:

- OTP field variations (numeric, masked, vertical layouts) with event logging.
- Accordion setups demonstrating `single`/`multiple` behavior, custom theming, and horizontal orientation.
- Alert dialogs with destructive confirmations, async flows, and custom styling via CSS properties.
- Aspect ratio containers framing responsive images and responsive embeds.
- Hover cards that preview Radix UI social metadata with delayed entry/exit.
- Dropdown menus with submenus, checkboxes, and radio groups mirroring Radix UI ergonomics.

## Contributing

- Place new components inside [`src/`](./src) as standalone modules.
- Export functionality by registering custom elements within the file and guarding repeated registrations.
- Document attributes, events, and styling hooks in this README and surface usage examples in `index.html`.

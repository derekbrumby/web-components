# Web Components Repository Guidelines

- Place all shipped web components inside [`src/`](./src) as standalone modules. Each module must:
  - Self-register its custom element(s) when loaded (guard `customElements.define` with an existence check).
  - Use JSDoc annotations for public APIs and types.
  - Expose customization hooks via CSS custom properties and `::part` selectors.
  - Avoid external runtime dependencies and bundlers; the file should be CDN friendly as-is.
- When introducing or updating a component:
  - Update [`README.md`](./README.md) with usage, attributes/events, and styling notes.
  - Refresh [`index.html`](./index.html) with live examples that demonstrate the new or changed API surface.
- Keep documentation in Markdown with descriptive headings and tables where appropriate.
- Prefer modern, accessible semantics (aria attributes, keyboard interactions) for UI components.

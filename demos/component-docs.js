/*
 * Shared helper to render component documentation panels inside demo pages.
 * Each demo inserts a <section data-docs="wc-component"></section> container
 * and calls renderComponentDocs(tagName) from a module script.
 */

import { componentDocs } from './component-docs-data.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatInlineCode = (text) => text.replace(/`([^`]+)`/g, '<code>$1</code>');

const createTable = (items, columns) => {
  if (!items || items.length === 0) {
    return '';
  }

  const header = `<thead><tr>${columns
    .map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`)
    .join('')}</tr></thead>`;
  const body = `<tbody>${items
    .map((item) => `<tr>${columns
        .map((column) => {
          const raw = column.format
            ? column.format(item[column.key], item)
            : escapeHtml(item[column.key] ?? '');
          return `<td>${raw}</td>`;
        })
        .join('')}</tr>`)
    .join('')}</tbody>`;
  return `<table>${header}${body}</table>`;
};

const renderSection = (doc) => {
  const parts = [];
  parts.push(
    `<header><h2>${escapeHtml(doc.title)}</h2>${doc.tagline ? `<p>${escapeHtml(doc.tagline)}</p>` : ''}</header>`
  );

  if (doc.usage) {
    const usage = Array.isArray(doc.usage) ? doc.usage : [doc.usage];
    parts.push(
      `<section class="docs-subsection"><h3>Usage</h3>${usage
        .map((entry) => {
          const imports = entry.imports
            ? `<p class="docs-muted">Load${entry.imports.length > 1 ? ' modules' : ' module'}: ${entry.imports
                .map((path) => `<code>${escapeHtml(path)}</code>`)
                .join(', ')}</p>`
            : '';
          const snippet = entry.snippet
            ? `<pre><code>${escapeHtml(entry.snippet)}</code></pre>`
            : '';
          const description = entry.description ? `<p>${escapeHtml(entry.description)}</p>` : '';
          return `<article>${imports}${snippet}${description}</article>`;
        })
        .join('')}</section>`
    );
  }

  if (doc.attributes?.length) {
    parts.push(
      `<section class="docs-subsection"><h3>Attributes &amp; properties</h3>${createTable(doc.attributes, [
        { key: 'name', label: 'Name', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'type', label: 'Type', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'default', label: 'Default', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'description', label: 'Description', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
      ])}</section>`
    );
  }

  if (doc.properties?.length) {
    parts.push(
      `<section class="docs-subsection"><h3>Properties</h3>${createTable(doc.properties, [
        { key: 'name', label: 'Name', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'type', label: 'Type', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'default', label: 'Default', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'description', label: 'Description', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
      ])}</section>`
    );
  }

  if (doc.slots?.length) {
    parts.push(
      `<section class="docs-subsection"><h3>Slots</h3><ul>${doc.slots
        .map((slot) => {
          const name = slot.name === 'default' ? 'default' : escapeHtml(slot.name);
          const description = slot.description
            ? ` — ${formatInlineCode(escapeHtml(slot.description))}`
            : '';
          return `<li><strong>${name}</strong>${description}</li>`;
        })
        .join('')}</ul></section>`
    );
  }

  if (doc.events?.length) {
    parts.push(
      `<section class="docs-subsection"><h3>Events</h3>${createTable(doc.events, [
        { key: 'name', label: 'Event', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'detail', label: 'detail', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
        { key: 'description', label: 'Description', format: (value) => formatInlineCode(escapeHtml(value ?? '')) },
      ])}</section>`
    );
  }

  if (doc.css?.length) {
    parts.push(
      `<section class="docs-subsection"><h3>Styling hooks</h3><ul>${doc.css
        .map((item) => `<li>${formatInlineCode(escapeHtml(item))}</li>`)
        .join('')}</ul></section>`
    );
  }

  if (doc.notes?.length) {
    parts.push(
      `<section class="docs-subsection"><h3>Notes</h3><ul>${doc.notes
        .map((note) => `<li>${formatInlineCode(escapeHtml(note))}</li>`)
        .join('')}</ul></section>`
    );
  }

  if (doc.related?.length) {
    parts.push(
      `<section class="docs-subsection related"><h3>Related elements</h3>${doc.related
        .map((child) => renderSection(child))
        .join('')}</section>`
    );
  }

  return parts.join('');
};

export const renderComponentDocs = (tagName, container = document.querySelector(`[data-docs="${tagName}"]`)) => {
  if (!container) {
    console.warn(`[component-docs] Unable to find container for`, tagName);
    return;
  }

  const doc = componentDocs[tagName];
  if (!doc) {
    container.innerHTML = `<header><h2>${tagName}</h2><p class="docs-muted">Documentation coming soon.</p></header>`;
    container.classList.add('docs-section');
    return;
  }

  container.classList.add('docs-section');
  container.innerHTML = renderSection(doc);
};

export { componentDocs };

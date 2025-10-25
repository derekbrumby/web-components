/**
 * @license MIT
 *
 * MarkdownViewer web component renders markdown content from a string or a URL.
 *
 * Features:
 * - Parses common Markdown syntax (headings, lists, emphasis, block quotes, code blocks, tables).
 * - Sanitizes the generated HTML to prevent XSS and enforces safe URL protocols.
 * - Supports loading remote markdown documents via the `src` attribute or property.
 * - Provides styling hooks through CSS custom properties and `::part` selectors.
 */
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      color: var(--markdown-viewer-color, inherit);
      font-family: var(--markdown-viewer-font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      background: var(--markdown-viewer-background, transparent);
      line-height: 1.6;
    }

    :host([hidden]) {
      display: none !important;
    }

    article {
      box-sizing: border-box;
      padding: var(--markdown-viewer-padding, 0);
      color: inherit;
    }

    article :where(h1, h2, h3, h4, h5, h6) {
      line-height: 1.25;
      margin: var(--markdown-viewer-heading-margin, 1.5em 0 0.5em);
      font-weight: var(--markdown-viewer-heading-weight, 600);
    }

    article p {
      margin: 1em 0;
    }

    article pre {
      margin: 1.5em 0;
      padding: 1em;
      background: var(--markdown-viewer-code-background, #0f172a);
      color: var(--markdown-viewer-code-color, #e2e8f0);
      border-radius: 0.5em;
      overflow-x: auto;
      font-family: var(--markdown-viewer-mono-font, ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
      font-size: 0.95em;
    }

    article code:not(pre code) {
      background: var(--markdown-viewer-inline-code-background, rgba(15, 23, 42, 0.08));
      color: var(--markdown-viewer-inline-code-color, inherit);
      padding: 0.15em 0.4em;
      border-radius: 0.35em;
      font-size: 0.95em;
    }

    article blockquote {
      margin: 1.5em 0;
      padding-left: 1em;
      border-left: 0.25em solid var(--markdown-viewer-quote-border, currentColor);
      color: var(--markdown-viewer-quote-color, inherit);
      opacity: 0.9;
    }

    article ul,
    article ol {
      margin: 1em 0 1em 1.5em;
      padding: 0;
    }

    article table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-size: 0.95em;
      overflow-x: auto;
    }

    article th,
    article td {
      border: 1px solid var(--markdown-viewer-table-border, rgba(148, 163, 184, 0.4));
      padding: 0.6em 0.8em;
      text-align: left;
    }

    article th {
      background: var(--markdown-viewer-table-header-background, rgba(148, 163, 184, 0.15));
      font-weight: 600;
    }

    article hr {
      border: none;
      border-top: 1px solid var(--markdown-viewer-divider-color, currentColor);
      margin: 2em 0;
      opacity: 0.4;
    }

    article a {
      color: var(--markdown-viewer-link-color, #2563eb);
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-decoration-color: color-mix(in srgb, currentColor 60%, transparent);
    }

    article img {
      max-width: 100%;
      height: auto;
      border-radius: var(--markdown-viewer-image-radius, 0.5em);
    }

    article ::selection {
      background: color-mix(in srgb, var(--markdown-viewer-accent, #2563eb) 20%, transparent);
    }
  </style>
  <article part="container" role="document" aria-live="polite"></article>
`;

const LIST_MARKER_PATTERN = /^\s*(?:[-+*]|\d+\.)\s+/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/;
const HORIZONTAL_RULE_PATTERN = /^\s*(?:\*{3,}|-{3,}|_{3,})\s*$/;
const BLOCKQUOTE_PATTERN = /^\s*>/;
const CODE_FENCE_PATTERN = /^```(.*)$/;

/**
 * Escape HTML entities for safe text rendering.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape attribute values while preserving URI semantics.
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/**
 * Determine whether a URI is safe for inclusion in markup.
 * @param {string} uri
 * @returns {boolean}
 */
function isSafeUri(uri) {
  try {
    const parsed = new URL(uri, 'http://localhost');
    if (!parsed.protocol || parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') {
      return true;
    }
    if (parsed.protocol === 'data:') {
      return /^data:image\/(?:png|gif|jpeg|webp);base64,/i.test(uri);
    }
  } catch (error) {
    return false;
  }
  return false;
}

/**
 * Split a markdown table row into cells while respecting escaped separators.
 * @param {string} row
 * @returns {string[]}
 */
function splitTableRow(row) {
  let trimmed = row.trim();
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith('|')) {
    trimmed = trimmed.slice(0, -1);
  }
  const cells = [];
  let buffer = '';
  let escaping = false;
  for (const char of trimmed) {
    if (escaping) {
      buffer += char;
      escaping = false;
      continue;
    }
    if (char === '\\') {
      escaping = true;
      continue;
    }
    if (char === '|') {
      cells.push(buffer.trim());
      buffer = '';
      continue;
    }
    buffer += char;
  }
  cells.push(buffer.trim());
  return cells.map((cell) => cell.replace(/\\\|/g, '|'));
}

/**
 * Parse alignment definition row for markdown tables.
 * @param {string} row
 * @returns {("left"|"center"|"right"|null)[]}
 */
function parseAlignmentRow(row) {
  return splitTableRow(row).map((cell) => {
    const trimmed = cell.trim();
    const starts = trimmed.startsWith(':');
    const ends = trimmed.endsWith(':');
    if (starts && ends) {
      return 'center';
    }
    if (starts) {
      return 'left';
    }
    if (ends) {
      return 'right';
    }
    return null;
  });
}

/**
 * Tokenize markdown content into block-level tokens.
 * @param {string} markdown
 * @returns {Array<object>}
 */
function tokenize(markdown) {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const tokens = [];
  let index = 0;

  const pushParagraph = (start) => {
    const parts = [lines[start]];
    let i = start + 1;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === '') {
        break;
      }
      if (CODE_FENCE_PATTERN.test(next) || HEADING_PATTERN.test(next.trim()) || HORIZONTAL_RULE_PATTERN.test(next) || BLOCKQUOTE_PATTERN.test(next) || LIST_MARKER_PATTERN.test(next.trim()) || (next.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*\|/.test(lines[i + 1]))) {
        break;
      }
      parts.push(next);
      i += 1;
    }
    return [{ type: 'paragraph', text: parts.join('\n') }, i];
  };

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const fenceMatch = line.match(CODE_FENCE_PATTERN);
    if (fenceMatch) {
      const language = fenceMatch[1].trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !CODE_FENCE_PATTERN.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      tokens.push({ type: 'code', language, content: codeLines.join('\n') });
      continue;
    }

    if (/^\s{4,}/.test(line)) {
      const codeLines = [];
      while (index < lines.length && /^\s{4,}/.test(lines[index])) {
        codeLines.push(lines[index].replace(/^\s{4}/, ''));
        index += 1;
      }
      tokens.push({ type: 'code', language: '', content: codeLines.join('\n') });
      continue;
    }

    const headingMatch = line.trim().match(HEADING_PATTERN);
    if (headingMatch) {
      tokens.push({ type: 'heading', depth: headingMatch[1].length, text: headingMatch[2] });
      index += 1;
      continue;
    }

    if (HORIZONTAL_RULE_PATTERN.test(line)) {
      tokens.push({ type: 'hr' });
      index += 1;
      continue;
    }

    if (BLOCKQUOTE_PATTERN.test(line)) {
      const quoteLines = [];
      while (index < lines.length && BLOCKQUOTE_PATTERN.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      tokens.push({ type: 'blockquote', tokens: tokenize(quoteLines.join('\n')) });
      continue;
    }

    if (LIST_MARKER_PATTERN.test(line.trim())) {
      const [listToken, nextIndex] = parseList(lines, index);
      tokens.push(listToken);
      index = nextIndex;
      continue;
    }

    if (line.trim().startsWith('|') && index + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*\|/.test(lines[index + 1])) {
      const headerCells = splitTableRow(line);
      const alignCells = parseAlignmentRow(lines[index + 1]);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      tokens.push({ type: 'table', header: headerCells, aligns: alignCells, rows });
      continue;
    }

    const [paragraphToken, nextIndex] = pushParagraph(index);
    tokens.push(paragraphToken);
    index = nextIndex;
  }

  return tokens;
}

/**
 * Parse list blocks and return a list token with nested tokens per item.
 * @param {string[]} lines
 * @param {number} start
 * @returns {[object, number]}
 */
function parseList(lines, start) {
  const firstMatch = lines[start].match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
  if (!firstMatch) {
    return [{ type: 'paragraph', text: lines[start] }, start + 1];
  }
  const baseIndent = firstMatch[1].length;
  const ordered = /\d+\./.test(firstMatch[2]);
  const items = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
    if (!match) {
      break;
    }
    const indent = match[1].length;
    const markerOrdered = /\d+\./.test(match[2]);
    if (indent < baseIndent || markerOrdered !== ordered) {
      break;
    }
    if (indent > baseIndent) {
      const [nested, newIndex] = parseList(lines, index);
      if (items.length > 0) {
        items[items.length - 1].tokens.push(nested);
      }
      index = newIndex;
      continue;
    }

    const item = { tokens: [] };
    const contentLines = [match[3]];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];
      if (nextLine.trim() === '') {
        contentLines.push('');
        index += 1;
        continue;
      }
      const nextMatch = nextLine.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
      if (nextMatch) {
        const nextIndent = nextMatch[1].length;
        const nextOrdered = /\d+\./.test(nextMatch[2]);
        if (nextIndent < baseIndent || (nextIndent === baseIndent && nextOrdered === ordered)) {
          break;
        }
        if (nextIndent > baseIndent) {
          const [nested, newIndex] = parseList(lines, index);
          item.tokens.push(nested);
          index = newIndex;
          continue;
        }
      }
      contentLines.push(nextLine.slice(Math.min(nextLine.length, baseIndent + 2)));
      index += 1;
    }

    const text = contentLines.join('\n').trim();
    if (text) {
      const childTokens = tokenize(text);
      if (childTokens.length) {
        item.tokens.push(...childTokens);
      } else {
        item.tokens.push({ type: 'paragraph', text });
      }
    }
    items.push(item);
  }

  return [{ type: 'list', ordered, items }, index];
}

/**
 * Convert inline markdown markers within text into HTML.
 * @param {string} text
 * @returns {string}
 */
function renderInline(text) {
  const placeholders = [];
  const placeholder = (content) => {
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(content);
    return token;
  };

  let working = text;

  working = working.replace(/\\([\\`*_\[\]{}()#+\-.!|>~])/g, (_, char) => placeholder(escapeHtml(char)));
  working = working.replace(/```([\s\S]+?)```/g, (_, code) => placeholder(`<code>${escapeHtml(code.trim())}</code>`));
  working = working.replace(/`([^`]+)`/g, (_, code) => placeholder(`<code>${escapeHtml(code)}</code>`));

  working = working.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => {
    if (!isSafeUri(url)) {
      return placeholder(`<span>${escapeHtml(alt)}</span>`);
    }
    const attrs = [`src="${escapeAttribute(url)}"`, `alt="${escapeHtml(alt)}"`];
    if (title) {
      attrs.push(`title="${escapeHtml(title)}"`);
    }
    return placeholder(`<img ${attrs.join(' ')} loading="lazy" decoding="async" />`);
  });

  working = working.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, url, title) => {
    if (!isSafeUri(url)) {
      return escapeHtml(label);
    }
    const attrs = [`href="${escapeAttribute(url)}"`, 'rel="noreferrer noopener"'];
    if (title) {
      attrs.push(`title="${escapeHtml(title)}"`);
    }
    return placeholder(`<a ${attrs.join(' ')}>${escapeHtml(label)}</a>`);
  });

  working = working.replace(/<((?:https?|mailto|tel):[^>\s]+)>/g, (_, url) => {
    if (!isSafeUri(url)) {
      return escapeHtml(`<${url}>`);
    }
    return placeholder(`<a href="${escapeAttribute(url)}" rel="noreferrer noopener">${escapeHtml(url)}</a>`);
  });

  working = escapeHtml(working);

  working = working.replace(/(\*\*|__)(?!\s)([\s\S]+?)(?<!\s)\1/g, '<strong>$2</strong>');
  working = working.replace(/(\*|_)(?!\s)([\s\S]+?)(?<!\s)\1/g, '<em>$2</em>');
  working = working.replace(/~~(?!\s)([\s\S]+?)(?<!\s)~~/g, '<del>$1</del>');
  working = working.replace(/\^([^\s]+)/g, '<sup>$1</sup>');
  working = working.replace(/~([^\s]+)/g, '<sub>$1</sub>');
  working = working.replace(/ {2,}\n/g, '<br />');

  return working.replace(/\u0000(\d+)\u0000/g, (_, key) => placeholders[Number(key)] || '');
}

/**
 * Render block-level tokens into sanitized HTML.
 * @param {Array<object>} tokens
 * @returns {string}
 */
function renderTokens(tokens) {
  return tokens
    .map((token) => {
      switch (token.type) {
        case 'paragraph':
          return `<p>${renderInline(token.text)}</p>`;
        case 'heading':
          return `<h${token.depth}>${renderInline(token.text)}</h${token.depth}>`;
        case 'code':
          return `<pre><code${token.language ? ` class="language-${escapeAttribute(token.language)}"` : ''}>${escapeHtml(token.content)}</code></pre>`;
        case 'blockquote':
          return `<blockquote>${renderTokens(token.tokens)}</blockquote>`;
        case 'list': {
          const tag = token.ordered ? 'ol' : 'ul';
          const items = token.items
            .map((item) => `<li>${renderTokens(item.tokens)}</li>`)
            .join('');
          return `<${tag}>${items}</${tag}>`;
        }
        case 'hr':
          return '<hr />';
        case 'table': {
          const header = token.header
            .map((cell, index) => {
              const align = token.aligns[index];
              const attr = align ? ` style="text-align:${align}"` : '';
              return `<th${attr}>${renderInline(cell)}</th>`;
            })
            .join('');
          const body = token.rows
            .map((row) => {
              return `<tr>${row
                .map((cell, index) => {
                  const align = token.aligns[index];
                  const attr = align ? ` style="text-align:${align}"` : '';
                  return `<td${attr}>${renderInline(cell)}</td>`;
                })
                .join('')}</tr>`;
            })
            .join('');
          return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
        }
        default:
          return '';
      }
    })
    .join('');
}

/**
 * Sanitize the generated HTML output by removing disallowed elements/attributes.
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowedTags = new Set([
    'A',
    'ABBR',
    'B',
    'BLOCKQUOTE',
    'BR',
    'CODE',
    'DEL',
    'EM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HR',
    'I',
    'IMG',
    'KBD',
    'LI',
    'OL',
    'P',
    'PRE',
    'S',
    'SECTION',
    'SPAN',
    'STRONG',
    'SUB',
    'SUP',
    'TABLE',
    'TBODY',
    'TD',
    'TH',
    'THEAD',
    'TR',
    'UL'
  ]);

  const allowedAttributes = {
    A: new Set(['href', 'title', 'rel', 'target']),
    IMG: new Set(['src', 'alt', 'title', 'loading', 'decoding']),
    CODE: new Set(['class']),
    TD: new Set(['style']),
    TH: new Set(['style'])
  };

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }
    if (!allowedTags.has(node.nodeName)) {
      const parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      return;
    }

    [...node.attributes].forEach((attribute) => {
      const tag = node.nodeName;
      const allowed = allowedAttributes[tag];
      if (!allowed || !allowed.has(attribute.name)) {
        node.removeAttribute(attribute.name);
        return;
      }
      if ((attribute.name === 'href' || attribute.name === 'src') && !isSafeUri(attribute.value)) {
        node.removeAttribute(attribute.name);
        return;
      }
      if (attribute.name === 'target') {
        node.setAttribute('target', '_blank');
      }
      if (attribute.name === 'rel') {
        node.setAttribute('rel', 'noreferrer noopener');
      }
    });

    [...node.childNodes].forEach((child) => sanitizeNode(child));
  };

  [...template.content.childNodes].forEach((child) => sanitizeNode(child));
  return template.innerHTML;
}

/**
 * Convert markdown string to sanitized HTML output.
 * @param {string} markdown
 * @returns {string}
 */
function renderMarkdown(markdown) {
  const tokens = tokenize(markdown);
  const rawHtml = renderTokens(tokens);
  return sanitizeHtml(rawHtml);
}

/**
 * Extract fallback markdown content from an element's direct text nodes.
 * @param {HTMLElement} element
 * @returns {string}
 */
function getFallbackMarkdown(element) {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim();
}

/**
 * @typedef {Object} MarkdownViewerLoadEventDetail
 * @property {string} source - The URL that was requested.
 * @property {string} markdown - The raw markdown text that was fetched.
 */

/**
 * Custom element that renders markdown passed through an attribute, property or remote URL.
 */
export class MarkdownViewer extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'markdown'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
    /** @type {AbortController | null} */
    this.#abortController = null;
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'article');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    this.#render();
  }

  disconnectedCallback() {
    this.#abortController?.abort();
    this.#abortController = null;
  }

  /**
   * A URL pointing to a markdown document that should be rendered.
   * @returns {string | null}
   */
  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('src');
    } else {
      this.setAttribute('src', value);
    }
  }

  /**
   * Inline markdown string to render.
   * @returns {string | null}
   */
  get markdown() {
    return this.getAttribute('markdown');
  }

  set markdown(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('markdown');
    } else {
      this.setAttribute('markdown', value);
    }
  }

  /**
   * Observe attribute updates to trigger re-rendering.
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (name === 'src' || name === 'markdown') {
      this.#render();
    }
  }

  /**
   * Fetch markdown from the configured `src` attribute.
   * @returns {Promise<string>}
   */
  async #loadFromSource() {
    const source = this.src;
    if (!source) {
      return '';
    }
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const detail = { source, markdown: '' };
    this.dispatchEvent(new CustomEvent('markdown-loadstart', { detail }));
    try {
      const response = await fetch(source, { signal: this.#abortController.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status} ${response.statusText}`);
      }
      const markdownText = await response.text();
      detail.markdown = markdownText;
      this.dispatchEvent(new CustomEvent('markdown-load', { detail }));
      return markdownText;
    } catch (error) {
      this.dispatchEvent(new CustomEvent('markdown-error', { detail: { source, error } }));
      throw error;
    }
  }

  /**
   * Render markdown content into the article container.
   * @returns {Promise<void>}
   */
  async #render() {
    const container = this.shadowRoot?.querySelector('article');
    if (!container) {
      return;
    }

    container.innerHTML = '';
    const spinner = document.createElement('slot');
    spinner.name = 'loading';
    container.appendChild(spinner);

    try {
      let markdown = this.markdown ?? '';
      if (!markdown && this.src) {
        markdown = await this.#loadFromSource();
      }
      if (!markdown) {
        const fallback = getFallbackMarkdown(this);
        if (fallback) {
          markdown = fallback;
        }
      }
      const sanitized = markdown ? renderMarkdown(markdown) : '';
      container.innerHTML = sanitized || '<p part="empty">No markdown to display.</p>';
    } catch (error) {
      container.innerHTML = `<p part="error" role="alert">${escapeHtml(error.message || String(error))}</p>`;
    }
  }

  #abortController;
}

if (!customElements.get('wc-markdown-viewer')) {
  customElements.define('wc-markdown-viewer', MarkdownViewer);
}

export default MarkdownViewer;


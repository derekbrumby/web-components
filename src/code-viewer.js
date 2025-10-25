/**
 * @license MIT
 *
 * CodeViewer web component renders formatted code snippets from an inline string or remote source.
 *
 * Features:
 * - Displays content inside a styled <pre><code> block with accessible defaults.
 * - Supports fetching remote files via the `src` attribute while exposing loading/error events.
 * - Applies lightweight syntax highlighting heuristics based on language hints or file extensions.
 * - Provides CSS custom properties and parts for custom theming.
 */
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 100%;
      min-inline-size: 0;
      color: var(--code-viewer-foreground, #e2e8f0);
      background: var(--code-viewer-background, #0f172a);
      border-radius: var(--code-viewer-radius, 0.75rem);
      box-shadow: var(--code-viewer-shadow, 0 24px 48px -32px rgba(15, 23, 42, 0.5));
      font-family: var(--code-viewer-font-family, ui-monospace, SFMono-Regular, "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
      line-height: 1.55;
      overflow: hidden;
    }

    :host([hidden]) {
      display: none !important;
    }

    .viewer {
      position: relative;
      display: block;
      background: inherit;
      color: inherit;
      overflow-x: auto;
    }

    pre {
      margin: 0;
      padding: var(--code-viewer-padding, 1.5rem);
      background: inherit;
      color: inherit;
      overflow: auto;
      font-size: var(--code-viewer-font-size, 0.95rem);
      scrollbar-gutter: stable both-edges;
    }

    pre:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--code-viewer-accent, #6366f1) 45%, transparent);
      outline-offset: 4px;
    }

    code {
      display: block;
      background: inherit;
      color: inherit;
      white-space: pre;
      min-width: 0;
    }

    .viewer > slot[name='loading'] {
      display: block;
      padding: var(--code-viewer-padding, 1.5rem);
      color: color-mix(in srgb, var(--code-viewer-foreground, #e2e8f0) 70%, transparent);
      font-size: var(--code-viewer-font-size, 0.95rem);
    }

    .viewer > p {
      margin: 0;
      padding: var(--code-viewer-padding, 1.5rem);
      font-size: var(--code-viewer-font-size, 0.95rem);
    }

    [part~='empty'] {
      color: color-mix(in srgb, var(--code-viewer-foreground, #e2e8f0) 65%, transparent);
      font-style: italic;
    }

    [part~='error'] {
      color: var(--code-viewer-error-color, #f87171);
      background: color-mix(in srgb, var(--code-viewer-error-background, #7f1d1d) 18%, transparent);
      border-top: 1px solid color-mix(in srgb, var(--code-viewer-error-color, #f87171) 20%, transparent);
    }

    .token.comment {
      color: var(--code-viewer-comment-color, #94a3b8);
      font-style: italic;
    }

    .token.keyword {
      color: var(--code-viewer-keyword-color, #c084fc);
    }

    .token.literal {
      color: var(--code-viewer-literal-color, #f472b6);
    }

    .token.string {
      color: var(--code-viewer-string-color, #facc15);
    }

    .token.number {
      color: var(--code-viewer-number-color, #38bdf8);
    }

    .token.attribute,
    .token.property {
      color: var(--code-viewer-attribute-color, #f472b6);
    }

    .token.tag,
    .token.selector {
      color: var(--code-viewer-tag-color, #60a5fa);
    }

    .token.punctuation {
      color: var(--code-viewer-punctuation-color, color-mix(in srgb, var(--code-viewer-foreground, #e2e8f0) 80%, transparent));
    }

    .token.variable {
      color: var(--code-viewer-variable-color, #34d399);
    }

    .token.entity {
      color: var(--code-viewer-entity-color, #fcd34d);
    }
  </style>
  <div class="viewer" part="container" data-role="output">
    <pre part="surface" aria-live="off"><code part="code"></code></pre>
  </div>
`;

const LANGUAGE_ALIASES = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  typescript: 'typescript',
  jsx: 'javascript',
  json: 'json',
  css: 'css',
  scss: 'css',
  less: 'css',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  svg: 'xml',
  py: 'python',
  python: 'python',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
};

const EXTENSION_LANGUAGE_MAP = new Map([
  ['.js', 'javascript'],
  ['.mjs', 'javascript'],
  ['.cjs', 'javascript'],
  ['.ts', 'typescript'],
  ['.tsx', 'typescript'],
  ['.jsx', 'javascript'],
  ['.json', 'json'],
  ['.css', 'css'],
  ['.scss', 'css'],
  ['.less', 'css'],
  ['.html', 'html'],
  ['.htm', 'html'],
  ['.xml', 'xml'],
  ['.svg', 'xml'],
  ['.py', 'python'],
  ['.sh', 'shell'],
  ['.bash', 'shell'],
  ['.zsh', 'shell'],
  ['.yml', 'yaml'],
  ['.yaml', 'yaml'],
]);

const SUPPORTED_LANGUAGES = new Set([
  'javascript',
  'typescript',
  'json',
  'css',
  'html',
  'xml',
  'python',
  'shell',
  'yaml',
]);

/**
 * Escape HTML entities for safe rendering inside code blocks.
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
 * Determine whether a URI is safe for network requests.
 * @param {string} uri
 * @returns {boolean}
 */
function isSafeUri(uri) {
  try {
    const parsed = new URL(uri, 'http://localhost');
    if (!parsed.protocol) {
      return true;
    }
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

/**
 * Convert a string that may use escaped newlines into actual newlines.
 * @param {string} value
 * @returns {string}
 */
function normalizeEscapes(value) {
  if (!value) {
    return '';
  }
  const hasActualNewline = /[\r\n]/.test(value);
  let normalized = value.replace(/\r\n?/g, '\n');
  if (!hasActualNewline && /\\[nr]/.test(normalized)) {
    normalized = normalized
      .replace(/\\r\\n/g, '\n')
      .replace(/\\r/g, '\n')
      .replace(/\\n/g, '\n');
  }
  return normalized;
}

/**
 * Remove shared indentation and surrounding blank lines.
 * @param {string} value
 * @returns {string}
 */
function stripSharedIndent(value) {
  const lines = value.split('\n');
  while (lines.length && !lines[0].trim()) {
    lines.shift();
  }
  while (lines.length && !lines[lines.length - 1].trim()) {
    lines.pop();
  }
  let minIndent = null;
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';
    if (minIndent === null || indent.length < minIndent.length) {
      minIndent = indent;
    }
  }
  if (!minIndent) {
    return lines.join('\n');
  }
  return lines
    .map((line) => (line.startsWith(minIndent) ? line.slice(minIndent.length) : line))
    .join('\n');
}

/**
 * Normalise code text read from attributes, properties or inline children.
 * @param {string} value
 * @returns {string}
 */
function normalizeCodeInput(value) {
  if (!value) {
    return '';
  }
  const normalized = stripSharedIndent(normalizeEscapes(value));
  return normalized;
}

/**
 * Extract inline fallback code from text nodes.
 * @param {HTMLElement} element
 * @returns {string}
 */
function getInlineCode(element) {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? '')
    .join('');
}

/**
 * Determine the language identifier for highlighting.
 * @param {CodeViewer} element
 * @param {string} code
 * @returns {string}
 */
function resolveLanguage(element, code) {
  const explicit = element.getAttribute('language');
  if (explicit) {
    const normalised = normaliseLanguage(explicit);
    if (normalised) {
      return normalised;
    }
  }

  const filename = element.getAttribute('filename');
  const source = element.src || filename || '';
  if (source) {
    const match = /\.([^.\\/]+)$/.exec(source);
    if (match) {
      const extension = `.${match[1].toLowerCase()}`;
      const mapped = EXTENSION_LANGUAGE_MAP.get(extension);
      if (mapped) {
        return mapped;
      }
    }
  }

  if (code.startsWith('#!')) {
    const firstLine = code.split('\n', 1)[0];
    if (/python/.test(firstLine)) {
      return 'python';
    }
    if (/bash|sh/.test(firstLine)) {
      return 'shell';
    }
  }

  if (/^\s*</.test(code)) {
    return 'html';
  }

  if (/^\s*\{[\s\S]*\}\s*$/.test(code)) {
    return 'json';
  }

  return 'plaintext';
}

/**
 * Map arbitrary language names to supported identifiers.
 * @param {string} value
 * @returns {string}
 */
function normaliseLanguage(value) {
  const key = value.trim().toLowerCase();
  if (!key) {
    return '';
  }
  const mapped = LANGUAGE_ALIASES[key] || key;
  if (SUPPORTED_LANGUAGES.has(mapped)) {
    return mapped;
  }
  return mapped === 'plaintext' ? 'plaintext' : '';
}

/**
 * Tokenize code using ordered regex rules.
 * @param {string} code
 * @param {{ type: string, pattern: RegExp }[]} rules
 * @returns {{ type: string, text: string }[]}
 */
function tokenizeWithRules(code, rules) {
  const segments = [];
  let index = 0;

  while (index < code.length) {
    let matched = false;
    for (const rule of rules) {
      rule.pattern.lastIndex = index;
      const match = rule.pattern.exec(code);
      if (match && match.index === index) {
        segments.push({ type: rule.type, text: match[0] });
        index = rule.pattern.lastIndex;
        matched = true;
        break;
      }
    }
    if (!matched) {
      segments.push({ type: code[index] === '\n' ? 'newline' : 'text', text: code[index] });
      index += 1;
    }
  }

  return segments;
}

/**
 * Generate language specific tokenization rules.
 * @param {string} language
 * @returns {{ type: string, pattern: RegExp }[]}
 */
function getLanguageRules(language) {
  switch (language) {
    case 'javascript':
    case 'typescript': {
      const keywordPattern = new RegExp(
        String.raw`\\b(?:abstract|asserts|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|satisfies|set|static|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\\b`,
        'y'
      );
      return [
        { type: 'comment', pattern: /\/\*[\s\S]*?\*\//y },
        { type: 'comment', pattern: /\/\/[^\n]*/y },
        { type: 'string', pattern: /`(?:\\.|[^`])*`/y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'string', pattern: /'(?:\\.|[^'\\])*'/y },
        { type: 'number', pattern: /\b(?:0[xX][\da-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/y },
        { type: 'literal', pattern: /\b(?:true|false|null|undefined|NaN|Infinity)\b/y },
        { type: 'keyword', pattern: keywordPattern },
      ];
    }
    case 'json':
      return [
        { type: 'property', pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'number', pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y },
        { type: 'literal', pattern: /\b(?:true|false|null)\b/y },
        { type: 'punctuation', pattern: /[{}[\],:]/y },
      ];
    case 'css':
      return [
        { type: 'comment', pattern: /\/\*[\s\S]*?\*\//y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'string', pattern: /'(?:\\.|[^'\\])*'/y },
        { type: 'keyword', pattern: /@[\w-]+/y },
        { type: 'selector', pattern: /[.#]?[A-Za-z_][\w-]*(?=\s*[,{])/y },
        { type: 'property', pattern: /[A-Za-z-]+(?=\s*:)/y },
        { type: 'number', pattern: /(?:\b|\B)(?:\d+\.\d+|\d+)(?:%|px|rem|em|vh|vw|ch|s|ms)?/y },
        { type: 'literal', pattern: /#[0-9a-fA-F]{3,8}\b/y },
      ];
    case 'html':
    case 'xml':
      return [
        { type: 'comment', pattern: /<!--[\s\S]*?-->/y },
        { type: 'keyword', pattern: /<!DOCTYPE[^>]*>/y },
        { type: 'tag', pattern: /<\/?[A-Za-z][\w:.-]*/y },
        { type: 'attribute', pattern: /\s+[A-Za-z_:][\w:.-]*(?=\s*=)/y },
        { type: 'punctuation', pattern: /\/?\s*>/y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'string', pattern: /'(?:\\.|[^'\\])*'/y },
        { type: 'entity', pattern: /&[A-Za-z#][\w-]*;/y },
      ];
    case 'python':
      return [
        { type: 'comment', pattern: /#[^\n]*/y },
        { type: 'string', pattern: /"""[\s\S]*?"""/y },
        { type: 'string', pattern: /'''[\s\S]*?'''/y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'string', pattern: /'(?:\\.|[^'\\])*'/y },
        {
          type: 'keyword',
          pattern: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/y,
        },
        { type: 'number', pattern: /\b(?:0[xX][\da-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/y },
      ];
    case 'shell':
      return [
        { type: 'comment', pattern: /#[^\n]*/y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'string', pattern: /'(?:\\.|[^'\\])*'/y },
        { type: 'keyword', pattern: /\b(?:if|then|fi|elif|else|for|in|do|done|case|esac|while|until|function|select)\b/y },
        { type: 'variable', pattern: /\$\{?[A-Za-z_][\w]*\}?/y },
      ];
    case 'yaml':
      return [
        { type: 'comment', pattern: /#[^\n]*/y },
        { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
        { type: 'string', pattern: /'(?:\\.|[^'\\])*'/y },
        { type: 'keyword', pattern: /\b(?:true|false|null|yes|no|on|off)\b/yi },
        { type: 'number', pattern: /-?\d+(?:\.\d+)?/y },
        { type: 'property', pattern: /^(?:\s*-\s*)?[A-Za-z0-9_-]+(?=\s*:)/ym },
      ];
    default:
      return [];
  }
}

/**
 * Highlight code according to language specific rules.
 * @param {string} code
 * @param {string} language
 * @returns {string}
 */
function highlight(code, language) {
  if (!code) {
    return '';
  }
  if (!SUPPORTED_LANGUAGES.has(language)) {
    return escapeHtml(code);
  }

  const rules = getLanguageRules(language).map((rule) => ({
    type: rule.type,
    pattern: new RegExp(rule.pattern.source, rule.pattern.flags),
  }));

  const segments = tokenizeWithRules(code, rules);
  return segments
    .map((segment) => {
      if (segment.type === 'newline') {
        return '\n';
      }
      if (segment.type === 'text') {
        return escapeHtml(segment.text);
      }
      return `<span class="token ${segment.type}">${escapeHtml(segment.text)}</span>`;
    })
    .join('');
}

/**
 * @typedef {Object} CodeViewerLoadDetail
 * @property {string} source - Requested URL.
 * @property {string} code - Raw code string when available.
 */

export class CodeViewer extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'code', 'language', 'filename'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
    /** @type {AbortController | null} */
    this.#abortController = null;
    /** @type {MutationObserver | null} */
    this.#lightObserver = null;
    /** @type {symbol | null} */
    this.#renderToken = null;
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'region');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (!this.hasAttribute('aria-busy')) {
      this.setAttribute('aria-busy', 'false');
    }
    if (!this.hasAttribute('data-language')) {
      this.setAttribute('data-language', 'plaintext');
    }

    this.#observeLightDom();
    this.#render();
  }

  disconnectedCallback() {
    this.#abortController?.abort();
    this.#abortController = null;
    this.#lightObserver?.disconnect();
    this.#lightObserver = null;
  }

  /**
   * Remote URL that will be fetched when set.
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
   * Inline code string provided via attribute or property.
   * @returns {string | null}
   */
  get code() {
    return this.getAttribute('code');
  }

  set code(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('code');
    } else {
      this.setAttribute('code', value);
    }
  }

  /**
   * Language hint controlling syntax highlighting.
   * @returns {string | null}
   */
  get language() {
    return this.getAttribute('language');
  }

  set language(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('language');
    } else {
      this.setAttribute('language', value);
    }
  }

  /**
   * Optional filename hint used when inferring the language.
   * @returns {string | null}
   */
  get filename() {
    return this.getAttribute('filename');
  }

  set filename(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('filename');
    } else {
      this.setAttribute('filename', value);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (name === 'src' || name === 'code' || name === 'language' || name === 'filename') {
      this.#render();
    }
  }

  /**
   * Ensure inline updates trigger a rerender when using fallback text nodes.
   */
  #observeLightDom() {
    this.#lightObserver?.disconnect();
    this.#lightObserver = new MutationObserver((mutations) => {
      if (this.code || this.src) {
        return;
      }
      if (mutations.some((mutation) => mutation.type === 'characterData' || mutation.type === 'childList')) {
        this.#render();
      }
    });
    this.#lightObserver.observe(this, { characterData: true, childList: true, subtree: true });
  }

  /**
   * Fetch code from a remote source.
   * @returns {Promise<string>}
   */
  async #loadFromSource() {
    const source = this.src;
    if (!source) {
      return '';
    }
    if (!isSafeUri(source)) {
      throw new Error('Blocked unsafe URL scheme. Only http and https are supported.');
    }

    this.#abortController?.abort();
    this.#abortController = new AbortController();

    const detail = /** @type {CodeViewerLoadDetail} */ ({ source, code: '' });
    this.dispatchEvent(new CustomEvent('code-loadstart', { detail }));

    try {
      const response = await fetch(source, { signal: this.#abortController.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch code: ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      detail.code = text;
      this.dispatchEvent(new CustomEvent('code-load', { detail }));
      return text;
    } catch (error) {
      this.dispatchEvent(new CustomEvent('code-error', { detail: { source, error } }));
      throw error;
    }
  }

  /**
   * Render code content into the viewer.
   * @returns {Promise<void>}
   */
  async #render() {
    const container = this.shadowRoot?.querySelector('[data-role="output"]');
    if (!container) {
      return;
    }

    const token = Symbol('render');
    this.#renderToken = token;
    this.setAttribute('aria-busy', 'true');

    const showLoading = () => {
      container.innerHTML = '<slot name="loading">Loading code…</slot>';
    };

    const finish = () => {
      this.setAttribute('aria-busy', 'false');
    };

    let rawCode = normalizeCodeInput(this.code ?? '');
    if (!rawCode) {
      const inline = normalizeCodeInput(getInlineCode(this));
      if (inline) {
        rawCode = inline;
      }
    }

    if (!rawCode && this.src) {
      showLoading();
      try {
        rawCode = normalizeCodeInput(await this.#loadFromSource());
      } catch (error) {
        if (this.#renderToken !== token) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        container.innerHTML = `<p part="error" role="alert">${escapeHtml(message)}</p>`;
        finish();
        return;
      }
    }

    if (this.#renderToken !== token) {
      return;
    }

    if (!rawCode) {
      container.innerHTML = '<p part="empty">No code to display.</p>';
      finish();
      return;
    }

    const language = resolveLanguage(this, rawCode);
    const highlighted = highlight(rawCode, language);

    const pre = document.createElement('pre');
    pre.setAttribute('part', 'surface');
    pre.setAttribute('aria-live', 'off');
    pre.tabIndex = 0;

    const codeElement = document.createElement('code');
    codeElement.setAttribute('part', 'code');
    if (language && language !== 'plaintext') {
      codeElement.setAttribute('data-language', language);
      codeElement.classList.add(`language-${language}`);
      this.setAttribute('data-language', language);
    } else {
      codeElement.removeAttribute('data-language');
      this.setAttribute('data-language', 'plaintext');
    }
    codeElement.innerHTML = highlighted || escapeHtml(rawCode);

    pre.appendChild(codeElement);
    container.innerHTML = '';
    container.appendChild(pre);
    finish();
  }

  #abortController;
  #lightObserver;
  #renderToken;
}

if (!customElements.get('wc-code-viewer')) {
  customElements.define('wc-code-viewer', CodeViewer);
}

export default CodeViewer;

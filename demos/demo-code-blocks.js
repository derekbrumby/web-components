import '../src/code-viewer.js';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function formatAttributes(element) {
  return Array.from(element.attributes)
    .filter((attr) => attr.name !== 'data-code-example' && !attr.name.startsWith('data-code-'))
    .map((attr) => {
      if (attr.value === '') {
        return attr.name;
      }
      return `${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`;
    })
    .join(' ');
}

function formatTextNode(node, indent, parentTagName) {
  const textContent = node.textContent ?? '';
  if (!textContent.trim()) {
    return '';
  }

  if (parentTagName === 'pre' || parentTagName === 'code') {
    return `${'  '.repeat(indent)}${textContent.replace(/\n$/, '')}`;
  }

  const normalised = textContent.replace(/\s+/g, ' ').trim();
  return normalised ? `${'  '.repeat(indent)}${normalised}` : '';
}

function formatNode(node, indent, parentTagName) {
  if (node.nodeType === Node.TEXT_NODE) {
    return formatTextNode(node, indent, parentTagName);
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    const content = node.textContent?.trim();
    if (!content) return '';
    return `${'  '.repeat(indent)}<!-- ${content} -->`;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = /** @type {Element} */ (node);
  const tagName = element.tagName.toLowerCase();
  const attributes = formatAttributes(element);
  const openTag = attributes ? `<${tagName} ${attributes}>` : `<${tagName}>`;
  const isVoid = VOID_ELEMENTS.has(tagName);

  if (isVoid) {
    return `${'  '.repeat(indent)}${attributes ? `<${tagName} ${attributes} />` : `<${tagName} />`} `
      .trimEnd();
  }

  const childNodes = Array.from(element.childNodes);
  const formattedChildren = childNodes
    .map((child) => formatNode(child, indent + 1, tagName))
    .filter(Boolean);

  if (formattedChildren.length === 0) {
    return `${'  '.repeat(indent)}${openTag}</${tagName}>`;
  }

  const hasMultilineChild = formattedChildren.some((child) => child.includes('\n'));
  const isSingleInlineText =
    formattedChildren.length === 1 &&
    !hasMultilineChild &&
    !/</.test(formattedChildren[0].trimStart());

  if (isSingleInlineText) {
    const inline = formattedChildren[0].trim();
    return `${'  '.repeat(indent)}${openTag}${inline}</${tagName}>`;
  }

  const indentString = '  '.repeat(indent);
  const childrenBlock = formattedChildren.join('\n');
  return `${indentString}${openTag}\n${childrenBlock}\n${indentString}</${tagName}>`;
}

function buildSnippet(element) {
  return formatNode(element, 0, element.parentElement?.tagName.toLowerCase());
}

function attachViewers() {
  const examples = document.querySelectorAll('[data-code-example]');
  examples.forEach((example) => {
    if (!(example instanceof HTMLElement)) return;

    const language = example.dataset.codeLanguage || 'html';
    const filename = example.dataset.codeFilename;
    const insertAfter = example.dataset.codeAppend === 'parent' ? example.parentElement : example;
    if (!insertAfter) return;

    const snippet = buildSnippet(example);
    if (!snippet.trim()) return;

    const viewer = document.createElement('wc-code-viewer');
    viewer.setAttribute('language', language);
    viewer.textContent = `${snippet}\n`;

    if (filename) {
      viewer.setAttribute('filename', filename);
    }

    insertAfter.insertAdjacentElement('afterend', viewer);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachViewers);
} else {
  attachViewers();
}


import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const srcDir = join(repoRoot, 'src');
const demoDir = join(repoRoot, 'demos');

const attributeDescriptionLookup = new Map([
  ['variant', 'Selects the visual variant or tone for the surface.'],
  ['size', 'Adjusts spacing, padding, or icon sizing presets.'],
  ['disabled', 'Disables user interaction and applies aria-disabled semantics.'],
  ['href', 'Turns the component into a navigational link pointing to the provided URL.'],
  ['target', 'Forwarded to the underlying link target when `href` is set.'],
  ['rel', 'Relationship metadata for anchored buttons or links.'],
  ['type', 'Sets the underlying control type or behaviour preset.'],
  ['open', 'Controls whether the component is expanded or visible.'],
  ['collapsible', 'Allows the open item to be collapsed via repeated activation.'],
  ['orientation', 'Switches between horizontal and vertical layout behaviours.'],
  ['value', 'Currently selected value.'],
  ['values', 'Comma-separated list or array of selected values.'],
  ['aria-label', 'Accessible label forwarded to the underlying control.'],
  ['aria-labelledby', 'Associates the control with labelled element IDs.'],
  ['checked', 'Marks the control as checked.'],
  ['indeterminate', 'Sets the control to the mixed/indeterminate state.'],
  ['name', 'Name used when participating in forms or for identification.'],
  ['placeholder', 'Hint text displayed when no value is provided.'],
  ['pattern', 'Validation pattern applied to the input.'],
  ['required', 'Marks the control as required for form submission.'],
  ['readonly', 'Prevents user edits while keeping value selectable.'],
  ['min', 'Lower bound for numeric or date ranges.'],
  ['max', 'Upper bound for numeric or date ranges.'],
  ['step', 'Increment step applied when adjusting numeric values.'],
  ['loop', 'Repeats playback when media reaches the end.'],
  ['autoplay', 'Begins playback automatically when possible.'],
  ['preload', 'Hints how aggressively the browser should preload media.'],
  ['src', 'External resource URL loaded by the component.'],
  ['locale', 'Locales or language codes used for formatting.'],
  ['dir', 'Directional text context (ltr or rtl).'],
  ['modal', 'Treats the component as a modal surface that traps focus.'],
  ['side', 'Preferred side for popover-like placements.'],
  ['side-offset', 'Offset distance between trigger and surface.'],
  ['align', 'Alignment within the chosen side.'],
  ['align-offset', 'Pixel adjustment applied after alignment.'],
  ['placement', 'Preferred tooltip or popover placement position.'],
  ['show-label', 'Toggle label visibility for icon-only variants.'],
  ['badge-label', 'Accessible label describing the badge count.'],
  ['initials', 'Fallback initials rendered inside avatars.'],
  ['hotkey', 'Shortcut hint displayed within keycap components.'],
  ['auto-submit', 'Automatically submits the surrounding form when the value changes.'],
  ['duration', 'Animation duration or autoplay interval in milliseconds.'],
  ['loading', 'Indicates that the component is in a loading state.'],
  ['autofocus', 'Focuses the control automatically when it connects.'],
  ['autocomplete', 'Native autocomplete hint forwarded to the input.'],
  ['inputmode', 'Input mode hint for virtual keyboards.'],
  ['maxlength', 'Upper bound on input character length.'],
  ['minlength', 'Minimum number of characters required.'],
  ['mask', 'Mask pattern for OTP or password utilities.'],
  ['ratio', 'Specifies the width:height aspect ratio.'],
  ['show-outside-days', 'Whether the calendar should render trailing and leading days from adjacent months.'],
  ['first-day-of-week', 'Sets the starting weekday (0 = Sunday).'],
  ['length', 'Number of inputs or steps rendered.'],
  ['period', 'Which date period should be highlighted or computed.'],
  ['page-size', 'Number of items displayed per page.'],
  ['default-value', 'Initial value before user interaction.'],
  ['default-values', 'Initial set of values for multi-select components.'],
  ['default-open', 'Expands the element the first time it renders.'],
  ['default-pressed', 'Initial pressed state for toggle controls.'],
  ['default-visible', 'Shows the overlay on first render.'],
  ['hide-arrow', 'Hides decorative arrows from overlay surfaces.'],
  ['hide-label', 'Visually hides the label while keeping it accessible.'],
  ['hide-legend', 'Suppresses chart legends from rendering.'],
  ['inverted', 'Switches to an inverted color scheme.'],
  ['alignment', 'Adjusts layout alignment preferences.'],
  ['data', 'JSON configuration used to render the component.'],
  ['config', 'Chart.js or data table configuration object.'],
  ['category-key', 'Key used to read category/group labels from data entries.'],
  ['value-text', 'Accessible text alternative describing the current value.'],
  ['thumb-labels', 'Shows value labels above slider thumbs.'],
  ['min-steps-between-thumbs', 'Minimum distance allowed between range slider thumbs.'],
  ['activation-mode', 'Determines how selections are activated (e.g. on focus vs click).'],
  ['avoid-collisions', 'Prevents overlay placement from intersecting viewport edges.'],
  ['collision-padding', 'Padding used when auto-correcting overlay position.'],
  ['close-delay', 'Delay in milliseconds before closing on pointer leave.'],
  ['open-delay', 'Delay before opening after pointer enter or focus.'],
  ['close-on-escape', 'Closes the overlay when Escape is pressed.'],
  ['close-on-interact-outside', 'Closes when pointer or focus occurs outside the surface.'],
  ['filter-placeholder', 'Placeholder text shown in filter inputs.'],
  ['empty-label', 'Label displayed when no items match.'],
  ['search-placeholder', 'Placeholder text for search input fields.'],
  ['search-label', 'Accessible label for search input fields.'],
  ['still', 'URL for the static preview image.'],
  ['wallpaper', 'Background image applied to device mockups.'],
  ['cta-label', 'Label text for call-to-action buttons.'],
  ['submit-label', 'Label for submit buttons in forms.'],
  ['action-label', 'Label describing an action button or menu entry.'],
  ['plan', 'Pricing plan identifier used by pricing cards.'],
  ['price', 'Primary price string displayed by pricing cards.'],
  ['recommended', 'Highlights the pricing card as recommended.'],
  ['visible', 'Controls whether the surface is currently shown.'],
]);

const fallbackDescription = (name) => {
  if (attributeDescriptionLookup.has(name)) {
    return attributeDescriptionLookup.get(name);
  }
  if (name.startsWith('aria-')) {
    return 'Forwards the corresponding ARIA attribute for accessibility.';
  }
  if (name.startsWith('data-')) {
    return 'Custom data attribute reflected for styling hooks.';
  }
  return `Configures the \`${name}\` setting.`;
};

const toPropertyName = (attribute) => attribute.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

const parseCommentBlock = (content) => {
  const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!commentMatch) {
    return { summary: '', features: [], usage: '' };
  }
  const raw = commentMatch[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .map((line) => line.trimEnd());

  const lines = raw.filter((line) => !line.startsWith('@'));

  const summaryLines = [];
  let index = 0;
  while (index < lines.length && lines[index] !== '' && !/^Features:/i.test(lines[index])) {
    summaryLines.push(lines[index]);
    index += 1;
  }

  const summary = summaryLines.join(' ').trim();

  let features = [];
  const featuresIndex = lines.findIndex((line) => /^Features:/i.test(line));
  if (featuresIndex !== -1) {
    const collected = [];
    for (let i = featuresIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.startsWith('- ')) {
        collected.push(line.slice(2));
      } else if (line.trim() === '') {
        continue;
      } else if (!line.startsWith(' ')) {
        break;
      }
    }
    features = collected;
  }

  let usage = '';
  const usageIndex = lines.findIndex((line) => /^Usage:/i.test(line));
  if (usageIndex !== -1) {
    const snippet = [];
    for (let i = usageIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.startsWith('```')) {
        continue;
      }
      if (line.trim() === '' && snippet.length > 0) {
        break;
      }
      snippet.push(line);
    }
    usage = snippet.join('\n').trim();
  }

  return { summary, features, usage };
};

const extractClassBlock = (content, className) => {
  const classRegex = new RegExp(`class\\s+${className}\\s+extends`);
  const match = classRegex.exec(content);
  const classStart = match ? match.index : -1;
  if (classStart === -1) {
    return '';
  }
  const firstBrace = content.indexOf('{', classStart);
  if (firstBrace === -1) {
    return '';
  }
  let depth = 0;
  for (let i = firstBrace; i < content.length; i += 1) {
    const char = content[i];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(classStart, i + 1);
      }
    }
  }
  return '';
};

const parseAttributes = (classBlock) => {
  const match = classBlock.match(/static\s+get\s+observedAttributes\s*\(\)\s*{[\s\S]*?return\s*\[([\s\S]*?)\];?/m);
  if (!match) {
    return [];
  }
  return match[1]
    .split(',')
    .map((value) => value.replace(/['"`\s]/g, ''))
    .filter(Boolean);
};

const extractGetterTypes = (classBlock) => {
  const map = new Map();
  const regex = /\/\*\*[\s\S]*?@returns\s*{([^}]+)}[\s\S]*?\*\/\s*get\s+(\w+)\s*\(/g;
  for (const match of classBlock.matchAll(regex)) {
    const type = match[1].trim();
    const property = match[2];
    map.set(property, type);
  }
  return map;
};

const getterType = (classBlock, propertyName, typeMap) => {
  if (typeMap.has(propertyName)) {
    return typeMap.get(propertyName);
  }
  const bodyRegex = new RegExp(String.raw`get\s+${propertyName}\s*\(\)\s*{([\s\S]*?)}\s*`, 'm');
  const bodyMatch = classBlock.match(bodyRegex);
  if (!bodyMatch) {
    return '';
  }
  const body = bodyMatch[1];
  if (/hasAttribute\(/.test(body)) {
    return 'boolean';
  }
  if (/Number\(/.test(body) || /parse(Float|Int)\(/.test(body)) {
    return 'number';
  }
  if (/JSON\.parse/.test(body)) {
    return 'object';
  }
  return 'string';
};

const getterDefault = (classBlock, propertyName) => {
  const bodyRegex = new RegExp(String.raw`get\s+${propertyName}\s*\(\)\s*{([\s\S]*?)}\s*`, 'm');
  const bodyMatch = classBlock.match(bodyRegex);
  if (!bodyMatch) {
    return '';
  }
  const body = bodyMatch[1];
  if (/hasAttribute\(/.test(body)) {
    return '`false`';
  }
  const nullish = body.match(/\?\?\s*['"]([^'"]*)['"]/);
  if (nullish) {
    return `\`${nullish[1] ? `"${nullish[1]}"` : ''}\``;
  }
  const literal = body.match(/return\s+['"]([^'"]*)['"]/);
  if (literal) {
    return `\`${literal[1]}\``;
  }
  const boolMatch = body.match(/return\s+(true|false);/);
  if (boolMatch) {
    return `\`${boolMatch[1]}\``;
  }
  return '';
};

const parseEvents = (classBlock) => {
  const events = new Map();
  const regex = /new\s+CustomEvent\(['"]([^'"]+)['"],\s*{([\s\S]*?)}\s*\)/g;
  for (const match of classBlock.matchAll(regex)) {
    const name = match[1];
    const options = match[2];
    let detail = '';
    const detailMatch = options.match(/detail:\s*({[\s\S]*?})/);
    if (detailMatch) {
      detail = '`' + detailMatch[1].replace(/\s+/g, ' ').trim() + '`';
    }
    events.set(name, detail);
  }
  return [...events.entries()].map(([name, detail]) => ({
    name: `\`${name}\``,
    detail,
    description: detail ? 'Emitted with a detail payload.' : 'Emitted event.',
  }));
};

const parseSlots = (classBlock) => {
  const slots = new Set();
  const regex = /slot=['"]([^'"]+)['"]/g;
  for (const match of classBlock.matchAll(regex)) {
    const name = match[1];
    if (!name) continue;
    slots.add(name);
  }
  return [...slots].map((name) => ({
    name: name === 'default' ? 'default' : `\`${name}\``,
    description: '',
  }));
};

const parseCssHooks = (classBlock) => {
  const hooks = new Set();
  const regex = /--[a-z0-9-]+/gi;
  for (const match of classBlock.matchAll(regex)) {
    hooks.add(match[0]);
  }
  return [...hooks].sort();
};

const buildDocs = async () => {
  const files = await fs.readdir(srcDir);
  const docs = {};

  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const fullPath = join(srcDir, file);
    const content = await fs.readFile(fullPath, 'utf8');
    const comment = parseCommentBlock(content);

    const definitions = [
      ...content.matchAll(/customElements\.define\(['"]([^'"]+)['"],\s*(\w+)\)/g),
      ...content.matchAll(/defineElement\(['"](wc-[^'"]+)['"],\s*(\w+)\)/g),
      ...content.matchAll(/\[['"](wc-[^'"]+)['"],\s*(\w+)\]/g),
    ];
    for (const [_, tagName, className] of definitions) {
      const classBlock = extractClassBlock(content, className);
      if (!classBlock) continue;

      const getterTypes = extractGetterTypes(classBlock);
      const attributes = parseAttributes(classBlock).map((attribute) => {
        const propertyName = toPropertyName(attribute);
        const type = getterType(classBlock, propertyName, getterTypes);
        const defaultValue = getterDefault(classBlock, propertyName);
        return {
          name: `\`${attribute}\` / \`${propertyName}\``,
          type: type ? `\`${type}\`` : '',
          default: defaultValue || '—',
          description: fallbackDescription(attribute),
        };
      });

      const events = parseEvents(classBlock);
      const slots = parseSlots(classBlock);
      const css = parseCssHooks(classBlock);

      docs[tagName] = {
        title: `<${tagName}>`,
        tagline: comment.summary || `Documentation for <${tagName}>`,
        usage: comment.usage ? { snippet: comment.usage } : undefined,
        attributes,
        events,
        slots,
        css,
        notes: comment.features && comment.features.length ? comment.features : undefined,
      };
    }
  }

  return docs;
};

const docs = await buildDocs();
const outputPath = join(demoDir, 'component-docs-data.js');
const fileContents = `// Auto-generated by scripts/build-component-docs.mjs
export const componentDocs = ${JSON.stringify(
  docs,
  null,
  2
)};
`;

await fs.writeFile(outputPath, fileContents, 'utf8');
console.log(`Wrote documentation for ${Object.keys(docs).length} components.`);

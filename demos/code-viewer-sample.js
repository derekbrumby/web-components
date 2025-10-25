export const theme = {
  accent: '#6366f1',
  surface: 'hsl(222 47% 11%)',
};

/**
 * Highlight a code string by wrapping keywords in spans.
 * Very small helper used to demonstrate the component fetching.
 */
export function highlightSnippet(code, language = 'javascript') {
  const start = performance.now();
  const lines = code.trimEnd().split('\n');
  const metadata = {
    language,
    lineCount: lines.length,
    createdAt: new Date().toISOString(),
  };

  console.info(`Highlighting ${metadata.lineCount} lines as ${language}`);

  return {
    metadata,
    tokens: lines.map((line, index) => ({
      line: index + 1,
      content: line,
    })),
    duration: Number((performance.now() - start).toFixed(2)),
  };
}

export function formatDuration(value) {
  return `${value.toFixed(2)}ms`;
}

/**
 * Regex-aware blank detection utilities.
 *
 * Rules for what is NOT a blank:
 * 1. URLs – any token that starts with http:// or https:// (the underscores
 *    inside a URL must be preserved verbatim, not turned into input blanks).
 *
 * A "blank" is defined as a SINGLE standalone underscore `_` that does NOT
 * fall inside the protected URL pattern above.
 */

// ── Regex that matches things we want to PROTECT (not treat as blanks) ──────
// Order matters – longer / more specific patterns first.
//
// 1. Quoted URLs:  "https://..." or 'https://...'  (greedy up to closing quote)
// 2. Unquoted URLs that start with http(s):// and run until whitespace / quote / >
// 3. HTML/JS target attribute: _blank
const PROTECTED_PATTERN =
  /(?:["']https?:\/\/[^"']*["'])|(?:https?:\/\/[^\s"'<>]+)|(?:_blank)/g;

/**
 * Replace every protected region with a same-length placeholder that contains
 * NO underscores, so a naive check only sees real blanks.
 */
const maskProtectedRegions = (line) => {
  const restorations = [];
  // Replace each match with a placeholder of the same length (using \x00)
  const masked = line.replace(PROTECTED_PATTERN, (match, offset) => {
    restorations.push({ index: offset, length: match.length, original: match });
    // Use a character that will never appear in source code as placeholder
    return '\x00'.repeat(match.length);
  });
  return { masked, restorations };
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Split a single line of question text into parts around blank placeholders,
 * ignoring underscores inside URLs and _blank.
 *
 * @param {string} line - One line of the question template
 * @returns {string[]} Array of text parts (blanks sit between consecutive parts)
 */
export const splitLineIntoBlanks = (line) => {
  if (!line || typeof line !== 'string') return [line || ''];

  const { restorations } = maskProtectedRegions(line);

  let restoredWithMarkers = '';
  let i = 0;
  const BLANK_MARKER = '\x01';

  while (i < line.length) {
    // Check if this position is at the start of a protected region
    const activeRestoration = restorations.find(r => i === r.index);

    if (activeRestoration) {
      restoredWithMarkers += activeRestoration.original;
      i += activeRestoration.length;
    } else if (line[i] === '_') {
      // We found a non-protected underscore.
      // Consume all consecutive underscores that are not protected.
      while (
        i < line.length &&
        line[i] === '_' &&
        !restorations.some(r => i >= r.index && i < r.index + r.length)
      ) {
        i++;
      }
      restoredWithMarkers += BLANK_MARKER;
    } else {
      restoredWithMarkers += line[i];
      i++;
    }
  }

  // Split on the single blank marker
  return restoredWithMarkers.split(BLANK_MARKER);
};

/**
 * Count how many real blanks exist in a line (excludes URLs, _blank, etc.).
 *
 * @param {string} line
 * @returns {number}
 */
export const countBlanksInLine = (line) => {
  const parts = splitLineIntoBlanks(line);
  return parts.length - 1;
};

/**
 * Given a full multi-line question, compute the split parts for every line.
 *
 * @param {string} questionText - Full question with \n separators
 * @returns {{ lineParts: string[][], totalBlanks: number }}
 */
export const parseQuestionBlanks = (questionText) => {
  if (!questionText) return { lineParts: [], totalBlanks: 0 };

  const lines = questionText.split('\n');
  const lineParts = [];
  let totalBlanks = 0;

  for (const line of lines) {
    const parts = splitLineIntoBlanks(line);
    const blanksInLine = parts.length - 1;
    totalBlanks += blanksInLine;
    lineParts.push(parts);
  }

  return { lineParts, totalBlanks };
};


export const scrollToNextBlank = (scrollViewRef, blankRefs, currentQuestion, selectedAnswers, selectedBlankIndex, viewportHeight = 0) => {
  if (!scrollViewRef?.current || !blankRefs?.current) {
    return;
  }

  const nextBlankRef = blankRefs.current[selectedBlankIndex];

  if (!nextBlankRef) {
    return;
  }

  setTimeout(() => {
    try {
      if (nextBlankRef && scrollViewRef.current) {
        nextBlankRef.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            // Center the blank in the viewport
            const halfViewport = viewportHeight > 0 ? viewportHeight / 2 : 120;
            const targetY = Math.max(0, y - halfViewport + height / 2);
            scrollViewRef.current?.scrollTo({
              x: 0,
              y: targetY,
              animated: true,
            });
          },
          () => { }
        );
      }
    } catch (_) { }
  }, 100);
};


export const calculateGlobalBlankIndex = (currentQuestion, lineIndex) => {
  if (!currentQuestion?.question) {
    return 0;
  }

  const { lineParts } = parseQuestionBlanks(currentQuestion.question);

  let blankIndex = 0;
  for (let i = 0; i < lineIndex && i < lineParts.length; i++) {
    blankIndex += lineParts[i].length - 1;
  }

  return blankIndex;
};
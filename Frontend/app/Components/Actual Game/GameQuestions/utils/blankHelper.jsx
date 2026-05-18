/**
 * Regex-aware blank detection utilities.
 *
 * Rules for what is NOT a blank:
 * 1. URLs – any token that starts with http:// or https:// (the underscores
 *    inside a URL must be preserved verbatim, not turned into input blanks).
 * 2. _blank – a common HTML attribute value (e.g. target="_blank").
 * 3. Standalone underscores that are part of identifiers like __init__, __name__,
 *    __main__ etc. – consecutive underscores (2+) are never blanks.
 *
 * A "blank" is defined as a SINGLE standalone underscore `_` that does NOT
 * fall inside one of the protected patterns above.
 */

// ── Regex that matches things we want to PROTECT (not treat as blanks) ──────
// Order matters – longer / more specific patterns first.
//
// 1. Quoted URLs:  "https://..." or 'https://...'  (greedy up to closing quote)
// 2. Unquoted URLs that start with http(s):// and run until whitespace / quote / >
// 3. _blank (with optional surrounding quotes)
// 4. Dunder / multi-underscore identifiers like __init__, __name__, etc.
const PROTECTED_PATTERN =
  /(?:["']https?:\/\/[^"']*["'])|(?:https?:\/\/[^\s"'<>]+)|(?:_blank)|(?:_{2,}\w*_{0,})/g;

/**
 * Replace every protected region with a same-length placeholder that contains
 * NO underscores, so a naive `split('_')` afterwards only sees real blanks.
 *
 * Returns { masked, restorations } where `restorations` is an array of
 * { index, length, original } so we can put the originals back.
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

/**
 * Restore the protected regions back into an array of parts.
 * `parts` comes from `masked.split('_')` — we walk through each part and
 * replace any placeholder chars with the original text.
 */
const restoreParts = (parts, restorations, masked) => {
  if (restorations.length === 0) return parts;

  // Rebuild the full string with blanks marked, then swap placeholders back
  // Strategy: join parts with '_', replace placeholders, then re-split.
  let joined = parts.join('_');
  // Sort restorations by index descending so replacements don't shift offsets
  const sorted = [...restorations].sort((a, b) => b.index - a.index);
  for (const r of sorted) {
    const placeholder = '\x00'.repeat(r.length);
    const pos = joined.indexOf(placeholder);
    if (pos !== -1) {
      joined = joined.slice(0, pos) + r.original + joined.slice(pos + r.length);
    }
  }
  // Now re-split on '_' but ONLY on real blanks.
  // We know where real blanks are: they are at the positions in `masked` that have '_'.
  // Easiest: walk the masked string, collect split positions.
  return smartSplit(joined, masked);
};

/**
 * Split `original` at positions where `masked` has a lone `_`.
 * This gives us the exact same split boundaries as masked.split('_'),
 * but applied to the restored (un-masked) text.
 */
const smartSplit = (original, masked) => {
  const result = [];
  let lastSplit = 0;

  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === '_') {
      result.push(original.slice(lastSplit, i));
      lastSplit = i + 1;
    }
  }
  result.push(original.slice(lastSplit));
  return result;
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Split a single line of question text into parts around blank placeholders,
 * ignoring underscores inside URLs, _blank, and multi-underscore identifiers.
 *
 * If `expectedBlankCount` is provided, the result is clamped so that
 * (parts.length - 1) never exceeds `expectedBlankCount`. Extra underscores
 * beyond the expected count are left as literal text.
 *
 * @param {string} line - One line of the question template
 * @param {number|null} expectedBlankCount - Optional cap from correctAnswer.length
 * @returns {string[]} Array of text parts (blanks sit between consecutive parts)
 */
export const splitLineIntoBlanks = (line, expectedBlankCount = null) => {
  if (!line || typeof line !== 'string') return [line || ''];

  const { masked, restorations } = maskProtectedRegions(line);

  // Split the masked string on single underscores (real blanks)
  const rawParts = masked.split('_');

  // Restore protected text back into each part
  const parts = restoreParts(rawParts, restorations, masked);

  // If no cap requested, return as-is
  if (expectedBlankCount == null || parts.length - 1 <= expectedBlankCount) {
    return parts;
  }

  // Clamp: merge excess blanks back into text (re-insert literal '_')
  const clamped = parts.slice(0, expectedBlankCount + 1);
  // Join the remaining excess parts with '_' (they are not real blanks)
  const excess = parts.slice(expectedBlankCount + 1).join('_');
  clamped[clamped.length - 1] += '_' + excess;
  return clamped;
};

/**
 * Count how many real blanks exist in a line (excludes URLs, _blank, etc.).
 *
 * @param {string} line
 * @param {number|null} expectedTotalBlanks - Optional cap
 * @returns {number}
 */
export const countBlanksInLine = (line, expectedTotalBlanks = null) => {
  const parts = splitLineIntoBlanks(line, expectedTotalBlanks);
  return parts.length - 1;
};

/**
 * Given a full multi-line question and an answer array, compute the
 * split parts for every line, clamping total blanks to answer count.
 *
 * @param {string} questionText - Full question with \n separators
 * @param {Array} correctAnswers - Array of correct answers (for clamping)
 * @returns {{ lineParts: string[][], totalBlanks: number }}
 */
export const parseQuestionBlanks = (questionText, correctAnswers = null) => {
  if (!questionText) return { lineParts: [], totalBlanks: 0 };

  const lines = questionText.split('\n');
  const maxBlanks = correctAnswers?.length ?? Infinity;
  const lineParts = [];
  let totalBlanks = 0;

  for (const line of lines) {
    // How many blanks can this line contribute?
    const remainingBudget = maxBlanks - totalBlanks;
    const parts = splitLineIntoBlanks(line, remainingBudget);
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
          () => {}
        );
      }
    } catch (_) {}
  }, 100);
};


export const calculateGlobalBlankIndex = (currentQuestion, lineIndex) => {
  if (!currentQuestion?.question) {
    return 0;
  }

  const correctAnswers = currentQuestion.correctAnswer || null;
  const { lineParts } = parseQuestionBlanks(currentQuestion.question, correctAnswers);

  let blankIndex = 0;
  for (let i = 0; i < lineIndex && i < lineParts.length; i++) {
    blankIndex += lineParts[i].length - 1;
  }
  
  return blankIndex;
};
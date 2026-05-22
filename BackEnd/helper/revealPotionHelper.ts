type BlankType = "underscore" | "bracket" | "blank" | "open_tag" | "close_tag";

interface BlankMatch {
  index: number;
  length: number;
  match: string;
  type: BlankType;
  htmlAttrs?: string;
}

const COMBINED_BLANK_REGEX =
  /(?:["']https?:\/\/[^"']*["'])|(?:https?:\/\/[^\s"'<>]+)|(?:_blank)|(<_([^>]*)>)|(<\/_>)|(\{blank\})|(_+)/g;

export function parseAndValidateBlanks(question: string): BlankMatch[] {
  const matches: BlankMatch[] = [];
  const regex = new RegExp(COMBINED_BLANK_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(question)) !== null) {
    if (
      match[1] === undefined &&
      match[3] === undefined &&
      match[4] === undefined &&
      match[5] === undefined
    ) {
      continue;
    }

    const raw = match[0];
    let type: BlankType = "underscore";
    let htmlAttrs: string | undefined = undefined;

    if (match[1] !== undefined) {
      type = "open_tag";
      htmlAttrs = match[2] ?? "";
    } else if (match[3] !== undefined) {
      type = "close_tag";
    } else if (match[4] !== undefined) {
      type = "blank";
    } else {
      type = "underscore";
    }

    matches.push({
      index: match.index,
      length: raw.length,
      match: raw,
      type,
      htmlAttrs,
    });
  }

  return matches;
}

function fillBlank(match: BlankMatch, answer: string): string {
  if (match.type === "open_tag") {
    return `<${answer}${match.htmlAttrs || ""}>`;
  }
  if (match.type === "close_tag") {
    return `</${answer}>`;
  }
  return answer;
}

function revealBlanksByIndices(
  question: string,
  answers: string[],
  indicesToReveal: Set<number>,
  blanks: BlankMatch[],
): {
  success: boolean;
  filledQuestion?: string;
  remainingAnswers?: string[];
  error?: string;
} {
  if (blanks.length === 0) {
    return { success: false, error: "No blanks found in question" };
  }

  let errorMsg = undefined;
  if (blanks.length !== answers.length) {
    errorMsg = `Mismatch: ${blanks.length} blanks vs ${answers.length} answers`;
  }

  let filledQuestion = question;
  let offset = 0;
  const remainingAnswers: string[] = [];

  const limit = Math.min(blanks.length, answers.length);

  for (let i = 0; i < limit; i++) {
    const blank = blanks[i];
    const answer = answers[i];

    if (indicesToReveal.has(i)) {
      const replacement = fillBlank(blank, answer);
      const actualIndex = blank.index + offset;

      filledQuestion =
        filledQuestion.substring(0, actualIndex) +
        replacement +
        filledQuestion.substring(actualIndex + blank.length);

      offset += replacement.length - blank.length;
    } else {
      remainingAnswers.push(answer);
    }
  }

  return {
    success: true,
    filledQuestion,
    remainingAnswers,
    error: errorMsg,
  };
}

export function revealAllBlanks(
  question: string,
  answers: string[],
  maxToReveal?: number,
): {
  success: boolean;
  filledQuestion?: string;
  error?: string;
  blanks?: BlankMatch[];
  revealedCount?: number;
} {
  const blanks = parseAndValidateBlanks(question);

  if (blanks.length === 0) {
    return { success: false, error: "No blanks found in question", blanks };
  }

  let errorMsg = undefined;
  if (blanks.length !== answers.length) {
    errorMsg = `Blank count mismatch: ${blanks.length} blanks but ${answers.length} answers`;
  }

  let filledQuestion = question;
  let offset = 0;

  const limit = Math.min(
    maxToReveal !== undefined ? maxToReveal : blanks.length,
    blanks.length,
    answers.length,
  );

  for (let i = 0; i < limit; i++) {
    const blank = blanks[i];
    const answer = answers[i];
    const replacement = fillBlank(blank, answer);

    const actualIndex = blank.index + offset;

    filledQuestion =
      filledQuestion.substring(0, actualIndex) +
      replacement +
      filledQuestion.substring(actualIndex + blank.length);

    offset += replacement.length - blank.length;
  }

  return {
    success: true,
    filledQuestion,
    blanks,
    revealedCount: limit,
    error: errorMsg,
  };
}

export function revealRandomBlanks(
  question: string,
  answers: string[],
  countToReveal: number,
): {
  success: boolean;
  filledQuestion?: string;
  remainingAnswers?: string[];
  error?: string;
} {
  const blanks = parseAndValidateBlanks(question);

  const limit = Math.min(blanks.length, answers.length);
  const allIndices = Array.from({ length: limit }, (_, i) => i);

  const shuffled = allIndices.sort(() => 0.5 - Math.random());
  const indicesToReveal = new Set(shuffled.slice(0, countToReveal));

  return revealBlanksByIndices(question, answers, indicesToReveal, blanks);
}

export async function applyRetryReveal(
  currentChallenge: any,
  effectiveCorrectAnswer: string[],
  persistedRevealIndices?: number[],
): Promise<{
  success: boolean;
  revealedChallenge?: any;
  error?: string;
  isPartialReveal: boolean;
  revealedIndices?: number[];
}> {
  const totalBlanks = effectiveCorrectAnswer.length;

  if (totalBlanks < 8) {
    return {
      success: true,
      revealedChallenge: currentChallenge,
      isPartialReveal: false,
    };
  }

  const blanksToLeave = 5;
  const amountToReveal = totalBlanks - blanksToLeave;

  const question = currentChallenge.question ?? "";
  const blanks = parseAndValidateBlanks(question);
  const limit = Math.min(blanks.length, effectiveCorrectAnswer.length);

  const existingIndices = Array.isArray(persistedRevealIndices)
    ? persistedRevealIndices
      .filter((index) => Number.isInteger(index))
      .filter((index) => index >= 0 && index < limit)
    : [];

  const indicesToReveal =
    existingIndices.length > 0
      ? existingIndices
      : Array.from({ length: limit }, (_, i) => i)
        .sort(() => 0.5 - Math.random())
        .slice(0, amountToReveal);

  const result = revealBlanksByIndices(
    question,
    effectiveCorrectAnswer,
    new Set(indicesToReveal),
    blanks,
  );

  if (!result.success) {
    console.error("Retry random reveal failed:", result.error);
    return { success: false, error: result.error, isPartialReveal: false };
  }

  let modifiedChallenge = {
    ...currentChallenge,
    question: result.filledQuestion,
    answer: result.remainingAnswers,
    options: currentChallenge.options,
  };

  return {
    success: true,
    revealedChallenge: modifiedChallenge,
    isPartialReveal: true,
    revealedIndices: [...new Set(indicesToReveal)].sort((a, b) => a - b),
  };
}

export async function applyRevealPotion(
  currentChallenge: any,
  effectiveCorrectAnswer: string[],
): Promise<{ success: boolean; revealedChallenge?: any; error?: string }> {
  const result = revealAllBlanks(
    currentChallenge.question ?? "",
    effectiveCorrectAnswer,
  );

  if (!result.success && !result.filledQuestion) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    revealedChallenge: {
      ...currentChallenge,
      question: result.filledQuestion,
      options: ["Attack"],
      answer: effectiveCorrectAnswer,
    },
  };
}

export function debugBlanks(question: string): void {
  const blanks = parseAndValidateBlanks(question);
  console.log(`Found ${blanks.length} blanks:`);
  blanks.forEach((b, i) => {
    console.log(`  ${i + 1}. "${b.match}" at position ${b.index}`);
  });
}
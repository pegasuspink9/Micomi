interface BlankMatch {
  index: number;
  match: string;
  type: "underscore";
}

function parseAndValidateBlanks(question: string): BlankMatch[] {
  const matches: BlankMatch[] = [];

  const regex = /_/g;
  let match;

  while ((match = regex.exec(question)) !== null) {
    matches.push({
      index: match.index,
      match: "_",
      type: "underscore",
    });
  }

  return matches;
}

function fillBlank(match: BlankMatch, answer: string): string {
  return answer;
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
    return {
      success: false,
      error: "No blanks found in question",
      blanks,
    };
  }

  if (blanks.length !== answers.length) {
    return {
      success: false,
      error: `Blank count mismatch: ${blanks.length} blanks but ${answers.length} answers`,
      blanks,
    };
  }

  let filledQuestion = question;
  let offset = 0;

  const limit =
    maxToReveal !== undefined
      ? Math.min(maxToReveal, blanks.length)
      : blanks.length;

  for (let i = 0; i < blanks.length; i++) {
    if (i >= limit) {
      break;
    }

    const blank = blanks[i];
    const answer = answers[i];
    const replacement = fillBlank(blank, answer);

    const actualIndex = blank.index + offset;

    filledQuestion =
      filledQuestion.substring(0, actualIndex) +
      replacement +
      filledQuestion.substring(actualIndex + 1);

    offset += replacement.length - 1;
  }

  return {
    success: true,
    filledQuestion,
    blanks,
    revealedCount: limit,
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

  if (blanks.length !== answers.length) {
    return {
      success: false,
      error: `Mismatch: ${blanks.length} blanks vs ${answers.length} answers`,
    };
  }

  const allIndices = Array.from({ length: blanks.length }, (_, i) => i);

  const shuffled = allIndices.sort(() => 0.5 - Math.random());
  const indicesToReveal = new Set(shuffled.slice(0, countToReveal));

  let filledQuestion = question;
  let offset = 0;
  const remainingAnswers: string[] = [];

  for (let i = 0; i < blanks.length; i++) {
    const blank = blanks[i];
    const answer = answers[i];

    if (indicesToReveal.has(i)) {
      const replacement = fillBlank(blank, answer);
      const actualIndex = blank.index + offset;

      filledQuestion =
        filledQuestion.substring(0, actualIndex) +
        replacement +
        filledQuestion.substring(actualIndex + 1);

      offset += replacement.length - 1;
    } else {
      remainingAnswers.push(answer);
    }
  }

  return {
    success: true,
    filledQuestion,
    remainingAnswers,
  };
}

export async function applyRetryReveal(
  currentChallenge: any,
  effectiveCorrectAnswer: string[],
): Promise<{
  success: boolean;
  revealedChallenge?: any;
  error?: string;
  isPartialReveal: boolean;
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

  const result = revealRandomBlanks(
    currentChallenge.question ?? "",
    effectiveCorrectAnswer,
    amountToReveal,
  );

  if (!result.success) {
    console.error("Retry random reveal failed:", result.error);
    return {
      success: false,
      error: result.error,
      isPartialReveal: false,
    };
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

  if (!result.success) {
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
    console.log(`  ${i + 1}. "_" at position ${b.index}`);
  });
}

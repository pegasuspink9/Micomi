interface BlankMatch {
  index: number;
  match: string;
  type: "underscore";
}

function parseAndValidateBlanks(question: string): BlankMatch[] {
  const matches: BlankMatch[] = [];

  for (let i = 0; i < question.length; i++) {
    if (question[i] === "_") {
      matches.push({
        index: i,
        match: "_",
        type: "underscore",
      });
    }
  }

  return matches;
}

function fillBlank(match: BlankMatch, answer: string): string {
  return answer;
}

export function revealAllBlanks(
  question: string,
  answers: string[],
): {
  success: boolean;
  filledQuestion?: string;
  error?: string;
  blanks?: BlankMatch[];
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

  for (let i = 0; i < blanks.length; i++) {
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
    console.error("Reveal potion failed:", result.error);
    return {
      success: false,
      error: result.error,
    };
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

interface BlankMatch {
  index: number;
  match: string;
  type:
    | "underscore"
    | "quote_double"
    | "quote_single"
    | "quote_smart_double"
    | "quote_smart_single"
    | "backtick"
    | "curly"
    | "bracket";
  preserveQuotes?: boolean;
}

function parseAndValidateBlanks(question: string): BlankMatch[] {
  const matches: BlankMatch[] = [];
  const occupiedRanges: Array<{ start: number; end: number }> = [];

  const patterns = [
    { regex: /"(_+)"/g, type: "quote_double" as const, preserveQuotes: true },
    { regex: /'(_+)'/g, type: "quote_single" as const, preserveQuotes: true },
    {
      regex: /"(_+)"/g,
      type: "quote_smart_double" as const,
      preserveQuotes: true,
    },
    {
      regex: /'(_+)'/g,
      type: "quote_smart_single" as const,
      preserveQuotes: true,
    },
    { regex: /`(_+)`/g, type: "backtick" as const, preserveQuotes: true },
    { regex: /\{blank\}/g, type: "curly" as const },
    { regex: /\[_+\]/g, type: "bracket" as const },
    { regex: /_+/g, type: "underscore" as const },
  ];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;

    let match;
    while ((match = pattern.regex.exec(question)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const isOccupied = occupiedRanges.some(
        (range) => start < range.end && end > range.start
      );

      if (!isOccupied) {
        matches.push({
          index: start,
          match: match[0],
          type: pattern.type,
          preserveQuotes: pattern.preserveQuotes,
        });
        occupiedRanges.push({ start, end });
      }
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

function fillBlank(match: BlankMatch, answer: string): string {
  switch (match.type) {
    case "quote_double":
      return `"${answer}"`;
    case "quote_single":
      return `'${answer}'`;
    case "quote_smart_double":
      return `"${answer}"`;
    case "quote_smart_single":
      return `'${answer}'`;
    case "backtick":
      return `\`${answer}\``;
    case "curly":
      return answer;
    case "bracket":
      return answer;
    case "underscore":
      return answer;
    default:
      return answer;
  }
}

export function revealAllBlanks(
  question: string,
  answers: string[]
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
      error: `Blank count mismatch: ${blanks.length} blanks but ${
        answers.length
      } answers. Found: ${blanks.map((b) => b.match).join(", ")}`,
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
      filledQuestion.substring(actualIndex + blank.match.length);

    offset += replacement.length - blank.match.length;
  }

  const remainingBlanks = parseAndValidateBlanks(filledQuestion);
  if (remainingBlanks.length > 0) {
    return {
      success: false,
      error: `Failed to fill all blanks: ${remainingBlanks.length} remaining`,
      blanks: remainingBlanks,
    };
  }

  return {
    success: true,
    filledQuestion,
    blanks,
  };
}

export async function applyRevealPotion(
  currentChallenge: any,
  effectiveCorrectAnswer: string[]
): Promise<{ success: boolean; revealedChallenge?: any; error?: string }> {
  const result = revealAllBlanks(
    currentChallenge.question ?? "",
    effectiveCorrectAnswer
  );

  if (!result.success) {
    console.error("Reveal potion failed:", result.error);
    console.error(
      "Blanks found:",
      result.blanks?.map((b) => `"${b.match}" at position ${b.index}`)
    );
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
    console.log(`  ${i + 1}. "${b.match}" (${b.type}) at position ${b.index}`);
  });
}

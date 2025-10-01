export const generateDynamicMessage = (
  isCorrect: boolean,
  characterName: string,
  hintUsed: boolean,
  consecutiveCorrects: number,
  playerHealth: number,
  playerMaxHealth: number,
  isFinalChallenge: boolean,
  elapsed: number,
  enemyName: string
): string => {
  const lowHealth = playerHealth <= playerMaxHealth * 0.2;
  const streak = consecutiveCorrects >= 3 ? consecutiveCorrects : 0;
  const quickAnswer = elapsed < 3;

  const correctMessages = {
    base: [
      `Great job, ${characterName}!`,
      `Excellent work, ${characterName}!`,
      `Well done, ${characterName}!`,
      `Spot on, ${characterName}!`,
      `Sharp strike, ${characterName}!`,
      `Brains beat ${enemyName}!`,
      `Well played, ${characterName}!`,
      `Nice hit, ${characterName}!`,
      `Solid move, ${characterName}!`,
      `Clean strike, ${characterName}!`,
      `Perfect timing, ${characterName}!`,
      `Right on target, ${characterName}!`,
      `Brilliant effort, ${characterName}!`,
      `Strong blow, ${characterName}!`,
      `Direct hit, ${characterName}!`,
      `Superb strike, ${characterName}!`,
      `Impressive skill, ${characterName}!`,
      `You nailed it, ${characterName}!`,
      `That was flawless, ${characterName}!`,
      `Bullseye, ${characterName}!`,
      `Crushing move, ${characterName}!`,
    ],
    streak: [
      `Incredible streak, ${characterName}!`,
      `${streak} in a row – you're on fire!`,
      `${streak} correct answers in a row!`,
      `What a combo, ${characterName}!`,
      `Unstoppable, ${characterName}!`,
      `That's ${streak} straight hits`,
      `${enemyName} fears streaks!`,
      `Keep rolling, ${characterName}!`,
      `Hot streak, ${characterName}!`,
      `${characterName} can’t be stopped!`,
      `${streak} wins straight!`,
      `Victory rush, ${characterName}!`,
      `Momentum is yours, ${characterName}!`,
      `Keep crushing, ${characterName}!`,
      `${streak} wins in style!`,
      `Combo master, ${characterName}!`,
      `No stopping you, ${characterName}!`,
      `${streak} and counting strong!`,
      `Blazing trail, ${characterName}!`,
      `Record streak, ${characterName}!`,
      `${enemyName} is overwhelmed!`,
    ],
    quick: [
      `Lightning fast, ${characterName}!`,
      `Your speed just blasted ${enemyName}!`,
      `Blazing quick, ${characterName}!`,
      `Swift strike, ${characterName}!`,
      `${enemyName} too slow!`,
      `Fast win, ${characterName}!`,
      `Quick thinking, ${characterName}!`,
      `Rapid strike, ${characterName}!`,
      `No chance for ${enemyName}!`,
      `Speed demon, ${characterName}!`,
      `That was instant, ${characterName}!`,
      `Rapid-fire success, ${characterName}!`,
      `Turbo charged, ${characterName}!`,
      `Sonic boom, ${characterName}!`,
      `So fast, ${characterName}!`,
      `Quick reflexes, ${characterName}!`,
      `Blitz move, ${characterName}!`,
      `Swift genius, ${characterName}!`,
      `Rapid thinker, ${characterName}!`,
    ],
    lowHealth: [
      `Hang in there, ${characterName}!`,
      `You're battered but brilliant, ${characterName}!`,
      `Tough spot, ${characterName}`,
      `Stand tall, ${characterName}!`,
      `${enemyName} won’t win!`,
      `Endure it, ${characterName}!`,
      `Still fighting, ${characterName}!`,
      `Stay strong, ${characterName}!`,
      `Last push, ${characterName}!`,
      `Resilient as ever, ${characterName}!`,
      `Push through, ${characterName}!`,
      `Refuse to fall, ${characterName}!`,
      `Defy the odds, ${characterName}!`,
      `Never surrender, ${characterName}!`,
      `Keep battling, ${characterName}!`,
      `Stay fierce, ${characterName}!`,
      `Hero’s grit, ${characterName}!`,
      `Dig deep, ${characterName}!`,
      `Fight on, ${characterName}!`,
      `Undaunted, ${characterName}!`,
    ],
    hint: [
      `Clever use of the hint, ${characterName}!`,
      `You uncovered the secret ${characterName}!`,
      `Smart move with the hint, ${characterName}!`,
      `Smart play, ${characterName}!`,
      `${enemyName} got tricked!`,
      `Clever move, ${characterName}!`,
      `Nice strategy, ${characterName}!`,
      `Tactical genius, ${characterName}!`,
      `Hints pay off, ${characterName}!`,
      `Brilliant reveal, ${characterName}!`,
      `Smart edge, ${characterName}!`,
      `You solved it, ${characterName}!`,
      `Strategic strike, ${characterName}!`,
      `Cunning move, ${characterName}!`,
      `Knowledge is power, ${characterName}!`,
      `That was clever, ${characterName}!`,
      `Insight wins, ${characterName}!`,
      `Brain over brawn, ${characterName}!`,
      `Secret unlocked, ${characterName}!`,
    ],
  };

  const wrongMessages = {
    base: [
      `Oof, close one, ${characterName}!`,
      `Not quite, ${characterName}!`,
      `Tough break, ${characterName}!`,
      `Missed it, ${characterName}!`,
      `${enemyName} got lucky!`,
      `Shake it, ${characterName}!`,
      `Next time, ${characterName}!`,
      `Don’t give up, ${characterName}!`,
      `Stay sharp, ${characterName}!`,
      `Keep trying, ${characterName}!`,
      `You’ll get it, ${characterName}!`,
      `That was tricky, ${characterName}!`,
      `Learn and strike back, ${characterName}!`,
      `Stay focused, ${characterName}!`,
      `No worries, ${characterName}!`,
      `Bounce back, ${characterName}!`,
      `Almost had it, ${characterName}!`,
      `Regroup, ${characterName}!`,
      `Shake it off, ${characterName}!`,
    ],
    lowHealth: [
      `${enemyName} is weakening!`,
      `Finish ${enemyName} now!`,
      `${enemyName} can’t last!`,
      `${enemyName} is crumbling!`,
      `End ${enemyName} soon!`,
      `${enemyName} falters fast!`,
      `${enemyName} is trembling!`,
      `${enemyName}'s days are numbered!`,
      `${enemyName} won’t hold out!`,
      `${enemyName} nearly finished!`,
      `${enemyName} close to defeat!`,
      `Crush ${enemyName} quickly!`,
      `${enemyName} slipping away!`,
      `Endgame for ${enemyName}!`,
      `Final blow coming!`,
      `Collapse awaits ${enemyName}!`,
      `${enemyName} is fading!`,
      `${enemyName} about to fall!`,
      `Weakness shows in ${enemyName}!`,
      `${enemyName} won’t survive!`,
    ],
    final: [
      `Almost there, ${characterName}!`,
      `So close to glory, ${characterName}!`,
      `The final hurdle, ${characterName}!`,
      `Finish ${enemyName} now!`,
      `End it, ${characterName}!`,
      `${enemyName} falls today!`,
      `Victory is near, ${characterName}!`,
      `One last step, ${characterName}!`,
      `The end for ${enemyName}!`,
      `Push through, ${characterName}!`,
      `This is it, ${characterName}!`,
      `Glory awaits, ${characterName}!`,
      `Claim victory, ${characterName}!`,
      `No mercy, ${characterName}!`,
      `Final strike, ${characterName}!`,
      `${enemyName} won’t escape!`,
      `Endgame move, ${characterName}!`,
      `History is yours, ${characterName}!`,
      `Last chance, ${characterName}!`,
    ],
  };

  if (isCorrect) {
    let messages = correctMessages.base;
    if (hintUsed) {
      messages = correctMessages.hint;
    } else if (streak > 0) {
      messages = correctMessages.streak;
    } else if (quickAnswer) {
      messages = correctMessages.quick;
    } else if (lowHealth) {
      messages = correctMessages.lowHealth;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    let messages = wrongMessages.base;
    if (lowHealth) {
      messages = wrongMessages.lowHealth;
    } else if (isFinalChallenge) {
      messages = wrongMessages.final;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }
};

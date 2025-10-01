export const generateDynamicMessage = (
  isCorrect: boolean,
  playerName: string,
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
      `Great job, ${playerName}! Your sharp mind struck ${enemyName} hard!`,
      `Excellent work, ${playerName}! The foe ${enemyName} reels from your clever attack!`,
      `Well done, ${playerName}! You've landed a solid blow on ${enemyName}!`,
      `Spot on, ${playerName}! Your answer pierced ${enemyName}'s defenses!`,
    ],
    streak: [
      `Incredible streak, ${playerName}! ${streak} in a row – you're on fire! ${enemyName} is trembling!`,
      `What a combo, ${playerName}! ${streak} correct answers in a row! Keep the momentum going against ${enemyName}!`,
      `Unstoppable, ${playerName}! That's ${streak} straight hits – ${enemyName}'s days are numbered!`,
    ],
    quick: [
      `Lightning fast, ${playerName}! Your speedy smarts just blasted ${enemyName}!`,
      `Blazing quick, ${playerName}! That rapid-fire answer crushed ${enemyName}!`,
    ],
    lowHealth: [
      `Hang in there, ${playerName}! Despite the bruises, that was a heroic strike on ${enemyName}! Fight on!`,
      `You're battered but brilliant, ${playerName}! One more clever hit like that, and ${enemyName} is done for!`,
      `Tough spot, ${playerName}, but your grit shines through! ${enemyName} felt that one!`,
    ],
    hint: [
      `Clever use of the hint, ${playerName}! You uncovered the secret and slammed ${enemyName}!`,
      `Smart move with the hint, ${playerName}! Revealing the truth and delivering a punishing blow to ${enemyName}!`,
      `Hint activated like a pro, ${playerName}! Now ${enemyName}'s paying the price for your wisdom!`,
    ],
  };

  const wrongMessages = {
    base: [
      `Oof, close one, ${playerName}! Shake it off – you'll nail it next time and strike back at ${enemyName}!`,
      `Not quite, ${playerName}, but every miss is a lesson. Gear up for the rematch with ${enemyName}!`,
      `Tough break, ${playerName}! ${enemyName} dodged this time, but your next swing will connect!`,
    ],
    lowHealth: [
      `That stung, ${playerName}, and you're hurting too. Rest up? Nah – rally and roar back at ${enemyName}!`,
      `Rough hit, ${playerName}, with your health low. But warriors like you turn the tide against ${enemyName}! Dig deep!`,
      `Enemy got you good, ${playerName}, and you're on the ropes. Channel that fire – redemption against ${enemyName} awaits!`,
    ],
    final: [
      `Almost there, ${playerName}! This one's the key to victory over ${enemyName} – focus your genius and conquer it!`,
      `So close to glory, ${playerName}! Double down on this challenge; ${enemyName}'s end is near!`,
      `The final hurdle, ${playerName}! You've come this far – unlock your inner champ and crush ${enemyName}!`,
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

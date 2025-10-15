export const generateDynamicMessage = (
  isCorrect: boolean,
  characterName: string,
  hintUsed: boolean,
  consecutiveCorrects: number,
  playerHealth: number,
  playerMaxHealth: number,
  elapsed: number,
  enemyName: string,
  enemyHealth: number
): { text: string; audio: string[] } => {
  const lowHealth = playerHealth <= 50 && playerHealth > 0;
  const streak = consecutiveCorrects >= 3 ? consecutiveCorrects : 0;
  const quickAnswer = elapsed < 3;
  const enemyLowHealth = enemyHealth <= 30 && enemyHealth > 0;

  const characterAudioMap: Record<string, string> = {
    Gino: "https://res.cloudinary.com/dpbocuozx/video/upload/v1760350698/Gino_gs5neq.wav",
    ShiShi:
      "https://res.cloudinary.com/dpbocuozx/video/upload/v1760350771/ShiShi_aw8bl2.wav",
    Leon: "https://res.cloudinary.com/dpbocuozx/video/upload/v1760350712/Leon_zh37ro.wav",
    Ryron:
      "https://res.cloudinary.com/dpbocuozx/video/upload/v1760350763/RyRon_yi9vut.wav",
  };

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
    lowHealth: [
      `Hang in there, ${characterName}!`,
      `You're battered but brilliant, ${characterName}!`,
      `Tough spot, ${characterName}`,
      `Stand tall, ${characterName}!`,
      `Endure it, ${characterName}!`,
      `Still fighting, ${characterName}!`,
      `Stay strong, ${characterName}!`,
      `Resilient as ever, ${characterName}!`,
      `Push through, ${characterName}!`,
      `Refuse to fall, ${characterName}!`,
      `Defy the odds, ${characterName}!`,
      `Never surrender, ${characterName}!`,
      `Keep battling, ${characterName}!`,
      `Stay fierce, ${characterName}!`,
      `Dig deep, ${characterName}!`,
      `Fight on, ${characterName}!`,
      `Undaunted, ${characterName}!`,
    ],
  };

  const wrongMessages = {
    base: [
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
      `Hang in there, ${characterName}!`,
      `You're battered but brilliant, ${characterName}!`,
      `Tough spot, ${characterName}`,
      `Stand tall, ${characterName}!`,
      `Endure it, ${characterName}!`,
      `Still fighting, ${characterName}!`,
      `Stay strong, ${characterName}!`,
      `Resilient as ever, ${characterName}!`,
      `Push through, ${characterName}!`,
      `Refuse to fall, ${characterName}!`,
      `Defy the odds, ${characterName}!`,
      `Never surrender, ${characterName}!`,
      `Keep battling, ${characterName}!`,
      `Stay fierce, ${characterName}!`,
      `Dig deep, ${characterName}!`,
      `Fight on, ${characterName}!`,
      `Undaunted, ${characterName}!`,
    ],
    lost: [
      `Better luck next time, ${characterName}.`,
      `Fell in combat, ${characterName}.`,
      `Victory slipped away, ${characterName}.`,
      `Not strong enough, ${characterName}.`,
      `Defeated this round, ${characterName}.`,
      `${enemyName} proved superior.`,
      `This battle lost, ${characterName}.`,
      `Could not prevail, ${characterName}.`,
      `Try again, ${characterName}!`,
      `No match for ${enemyName}.`,
      `Overwhelmed by ${enemyName}.`,
      `Failed to win, ${characterName}.`,
      `A tough loss, ${characterName}.`,
      `The day lost, ${characterName}.`,
      `${enemyName} was too much.`,
      `The journey ends here, ${characterName}.`,
      `Rest in peace, ${characterName}.`,
      `Fallen in battle, ${characterName}.`,
      `Your adventure is over, ${characterName}.`,
      `${characterName} met their end.`,
      `Silence falls on ${characterName}.`,
      `No more fights, ${characterName}.`,
      `Perished by ${enemyName}'s hand.`,
      `The ultimate defeat, ${characterName}.`,
      `A hero's demise, ${characterName}.`,
      `Darkness consumes ${characterName}.`,
      `Until next time, ${characterName}.`,
      `Game over, ${characterName}.`,
      `${characterName} is no more.`,
      `The final breath, ${characterName}.`,
    ],
  };

  let messageList: string[];

  if (isCorrect) {
    if (hintUsed) messageList = correctMessages.hint;
    else if (streak > 0) messageList = correctMessages.streak;
    else if (quickAnswer) messageList = correctMessages.quick;
    else if (lowHealth) messageList = correctMessages.lowHealth;
    else if (enemyLowHealth) messageList = correctMessages.final;
    else messageList = correctMessages.base;
  } else {
    if (playerHealth <= 0) messageList = wrongMessages.lost;
    else if (lowHealth) messageList = wrongMessages.lowHealth;
    else messageList = wrongMessages.base;
  }

  const selectedText =
    messageList[Math.floor(Math.random() * messageList.length)];

  const cleanMessage = selectedText
    .replace(new RegExp(characterName, "gi"), "")
    .replace(new RegExp(enemyName, "gi"), "")
    .replace(/[^\w\s]/g, "")
    .trim();

  const audioFiles: string[] = [`${cleanMessage}.mp3`];

  if (selectedText.includes(characterName)) {
    const characterAudio = characterAudioMap[characterName];
    if (characterAudio) {
      audioFiles.push(characterAudio);
    }
  }

  return {
    text: selectedText,
    audio: audioFiles,
  };
};

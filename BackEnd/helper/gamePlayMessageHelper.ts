const CHARACTER_AUDIO: Record<string, string> = {
  Gino: "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Gino_gs5neq.wav",
  Leon: "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Leon_zh37ro.wav",
  Ryron: "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/RyRon_yi9vut.wav",
  ShiShi:
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/ShiShi_aw8bl2.wav",
};

const PHRASE_AUDIO: Record<string, string> = {
  //streaks
  "Hot streak":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Hot_Streak_luafhc.wav",
  "Incredible streak":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Incredible_Streak_cbxmoa.wav",
  "Blazing trail":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Blazing_Trail_fgldwf.wav",
  "What a combo":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/What_a_Comboru_rwq9jj.wav",
  Unstoppable:
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Unstoppable_ltkl3x.wav",
  "Keep rolling":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Keep_Rolling_ayh8ah.wav",
  "Victory rush":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Victory_Rush_ikfhht.wav",
  "Momentum is yours":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Momentum_is_Yours_ibyama.wav",
  "Keep crushing":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Keep_Crushing_v6hvzx.wav",
  "Combo master":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Combo_Master_tcqhxv.wav",
  "No stopping you":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/No_Stopping_You_fremig.wav",
  "Record streak":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Record_Streak_ahsmyn.wav",
  //correct answer base
  "Great job":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Great_Job_pq4o7t.wav",
  "Excellent work":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Exellent_Work_xdkitb.wav",
  "Well done":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Well_Done_pwxo3d.wav",
  "Spot on":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Spot_On_wylfp9.wav",
  "Sharp strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Sharp_Strike_tx0wbk.wav",
  "Brains beat":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Brains_Bit_kriurs.wav",
  "Well played":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Well_Played_mvugak.wav",
  "Nice hit":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Nice_Hit_pxvrsv.wav",
  "Solid move":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Solid_Move_ldi2ys.wav",
  "Clean strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Clean_Strike_lzivsi.wav",
  "Perfect timing":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Perfect_Timing_vq7c6t.wav",
  "Right on target":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Right_On_Target_ukmenc.wav",
  "Brilliant effort":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Brilliant_Effort_oala3k.wav",
  "Strong blow":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Strong_Blow_x8njag.wav",
  "Direct hit":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Direct_Hit_wz4wub.wav",
  "Superb strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Superb_Strike_hfgnhw.wav",
  "Impressive skill":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Impressive_Skills_ho08rh.wav",
  "You nailed it":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/You_Nailed_It_sm9ug9.wav",
  "That was flawless":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/That_Was_Flawless_usnnl3.wav",
  Bullseye:
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Bullseye_xbbqiv.wav",
  "Crushing move":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Crushing_Move_h8igvo.wav",

  //quick
  "Lightning fast":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Lightning_Fast_jngyuv.wav",
  "Your speed just blasted":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Your_Speed_Just_Blasted_psc2cs.wav",
  "Blazing quick":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Blazing_Quick_etbeyv.wav",
  "Swift strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Swift_Strike_hvsskp.wav",
  "too slow":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Too_Slow_yv2y4i.wav",
  "Fast win":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Fast_Win_kref4r.wav",
  "Quick thinking":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Quick_Thinking_urkrjg.wav",
  "Rapid strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Rapid_Strike_lfa2sm.wav",
  "Rapid-fire success":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Rapid_Fire_Success_nr5sww.wav",
  "Turbo charged":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Turbo_Charge_z1nuoh.wav",
  "Sonic boom":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Sonic_Boom_dqnxtf.wav",
  "So fast":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/So_Fast_fajdou.wav",
  "Quick reflexes":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Quick_Reflexes_jubads.wav",
  "Blitz move":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Blitz_Move_gjjlwv.wav",
  "Swift genius":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Swift_Genius_hahp31.wav",
  "Rapid thinker":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Rapid_Thinker_zsux2l.wav",

  //hint
  "Clever use of the hint":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Clever_Use_of_The_Hint_klze4r.wav",
  "You uncovered the secret":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/You_Undercover_The_Secret_w1axck.wav",
  "Smart play":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Smart_Play_a7jdz7.wav",
  "Smart move with the hint":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Smart_Move_With_A_Hint_sesvfz.wav",
  "Clever move":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Clever_Move_k5wa5i.wav",
  "Nice strategy":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Nice_Strategy_juqqfj.wav",
  "Tactical genius":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Tactical_Genius_gq4ywy.wav",
  "Hints pay off":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Hints_Payoff_t4jiyw.wav",
  "Brilliant reveal":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Brilliant_Reveal_xzjhpi.wav",
  "Smart edge":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Smart_Edge_inspp9.wav",
  "You solved it":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/You_Solved_It_n9awdp.wav",
  "Strategic strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Strategic_Strike_qubtqp.wav",
  "Cunning move":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Cunning_Move_ivufb9.wav",
  "Knowledge is power":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Knowledge_is_Power_eraebw.wav",
  "That was clever":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/That_was_Clever_gsrped.wav",
  "Insight wins":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Insight_Wins_y7njz9.wav",
  "Brain over brawn":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Brain_Over_Brawns_bscf3p.wav",
  "Secret unlocked":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Secret_Unlocked_h2ymn4.wav",

  //final
  "Almost there":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Almost_There_h5jgdx.wav",
  "So close to glory":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/So_Close_to_Glory_bqoi8e.wav",
  "The final hurdle":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/The_Final_Hurdle_z3c3og.wav",
  Finish:
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Finish_Enemy_Now_r5xmjf.wav",
  "End it":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/End_It_ndzdg8.wav",
  "falls today":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Falls_Today_Victory_s_Near_t3anob.wav",
  "One last step":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/One_Last_Step_fy8oq1.wav",
  "The end for":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/The_End_For_Enemy_bvtfl1.wav",
  "Push through":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Push_Through_f09jbp.wav",
  "This is it":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/This_is_It_qxkfcv.wav",
  "Glory awaits":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Glory_Awaits_sjr6mg.wav",
  "Claim victory":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Claim_Victory_vxydpk.wav",
  "No mercy":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/No_Mercy_adwmmw.wav",
  "Final strike":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Final_Strike_hsptgl.wav",
  "Endgame move":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/End_Game_Move_roylje.wav",
  "History is yours":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/History_is_Yours_o6ljqn.wav",

  //lowHealth
  "Hang in there":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Hang_in_There_dlupb7.wav",
  "Youre battered but brilliant":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/You_re_Buttered_But_Brilliant_yz8brx.wav",
  "Tough spot":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Tough_Spot_ywtjlc.wav",
  "Stand tall":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Stand_Tall_tigoeb.wav",
  "Endure it":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Endure_It_maxb76.wav",
  "Still fighting":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Still_Fighting_dnmjva.wav",
  "Stay strong":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Stay_Strong_krgsoo.wav",
  "Resilient as ever":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Resillience_as_Ever_qqapo5.wav",
  "Refuse to fall":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Refuse_To_Fall_ggvxl3.wav",
  "Defy the odds":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Defied_Odds_jruvpz.wav",
  "Never surrender":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Never_Surrender_o80cyz.wav",
  "Keep battling":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Keep_Battling_mnjxof.wav",
  "Stay fierce":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Stay_Fierce_yyjds3.wav",
  "Dig deep":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Dig_Deep_rcztkz.wav",
  "Fight on":
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Fight_On_yvf60f.wav",
  Undaunted:
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/Undaunted_ebyo3d.wav",

  //wrong answer base
  "Not quite":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Not_Quite_igbhsn.wav",
  "Tough break":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Tough_Break_v94r6h.wav",
  "Missed it":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Missed_It_gwgxcv.wav",
  "got lucky":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Enemy_Got_Lucky_lguoac.wav",
  "Shake it":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Shake_It_nal5d1.wav",
  "Shake it off":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Shake_it_Off_qvbrws.wav",
  "Next time":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Next_Time_xbukom.wav",
  "Dont give up":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Dont_Give_Up_kae9xf.wav",
  "Stay sharp":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Stay_Sharp_glkn4e.wav",
  "Keep trying":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Keep_Trying_cwpdzz.wav",
  "Youll get it":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/You_ll_Get_It_wupf5e.wav",
  "That was tricky":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/That_Was_Tricky_xbtcky.wav",
  "Learn and strike back":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Learn_and_Strike_Back_ghlkor.wav",
  "Stay focused":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Stay_Focused_uea42l.wav",
  "No worries":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/No_Worries_ggaokf.wav",
  "Bounce back":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Bounce_Back_wap7go.wav",
  "Almost had it":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Almost_Had_It_zz7nj2.wav",
  Regroup:
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Regroup_lfqmql.wav",

  //lost
  "Better luck next time":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Better_Luck_Next_Time_ye2wwj.wav",
  "Fell in combat":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Fell_in_Combat_cfx2hm.wav",
  "Victory slipped away":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Victory_Slipped_Away_fnwsda.wav",
  "Not strong enough":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Not_Strong_Enough_jhxywu.wav",
  "Defeated this round":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Defeat_This_Round_vgafsj.wav",
  "This battle lost":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/This_Battle_Lost_sqpfqx.wav",
  "Could not prevail":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Could_Not_Prevail_b3syzx.wav",
  "Try again":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Try_Again_itiqhr.wav",
  "No match for":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/No_Much_For_The_Enemy_ywjbua.wav",
  "Overwhelmed by":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Overwhelmed_By_The_Enemy_eyvbio.wav",
  "Failed to win":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Failed_To_Win_r0o9ls.wav",
  "A tough loss":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/A_Tough_Loss_jonjup.wav",
  "The day lost":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/The_Day_Lost_w0hzsh.wav",
  "was too much":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Enemy_Was_Too_Much_m9vtws.wav",
  "The journey ends here":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/The_Journey_Ends_Here_hait4k.wav",
  "Rest in peace":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Rest_in_Peace_ogbczn.wav",
  "Fallen in battle":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Fallen_in_Battle_u7dfkd.wav",
  "Your adventure is over":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Your_Adventure_is_Over_vo6gpv.wav",
  "Silence falls on":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Silence_Falls_On_slnxqc.wav",
  "No more fights":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/No_More_Fight_benfzf.wav",
  "Perished by":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Perished_By_The_Enemy_s_Hand_wqqtmv.wav",
  "The ultimate defeat":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/The_Ultimate_Defeat_ldkinm.wav",
  "Darkness consumes":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Darkness_Consumed_certhj.wav",
  "Until next time":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Until_Next_Time_egj3ra.wav",
  "Game over":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/Game_Over_wis8iw.wav",
  "The final breath":
    "micomi-assets.me/Sounds/In%20Game/Wrong%20Answers!/The_Final_Breath_jemyrw.wav",

  //no bonus message yet
};

export const generateDynamicMessage = (
  isCorrect: boolean,
  characterName: string,
  hintUsed: boolean,
  consecutiveCorrects: number,
  playerHealth: number,
  playerMaxHealth: number,
  elapsed: number,
  enemyName: string,
  enemyHealth: number,
  isBonusRound: boolean
): { text: string; audio: string[] } => {
  const lowHealth = playerHealth <= 50 && playerHealth > 0;
  const streak = consecutiveCorrects >= 3 ? consecutiveCorrects : 0;
  const quickAnswer = elapsed < 3;
  const enemyLowHealth = enemyHealth <= 30 && enemyHealth > 0;

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
      `What a combo, ${characterName}!`,
      `Unstoppable, ${characterName}!`,
      `Keep rolling, ${characterName}!`,
      `Hot streak, ${characterName}!`,
      `Victory rush, ${characterName}!`,
      `Momentum is yours, ${characterName}!`,
      `Keep crushing, ${characterName}!`,
      `Combo master, ${characterName}!`,
      `No stopping you, ${characterName}!`,
      `Blazing trail, ${characterName}!`,
      `Record streak, ${characterName}!`,
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
      `Clever use of the hint!`,
      `You uncovered the secret!`,
      `Smart move with the hint!`,
      `Smart play, ${characterName}!`,
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
      `So close to glory!`,
      `The final hurdle, ${characterName}!`,
      `Finish ${enemyName} now!`,
      `End it, ${characterName}!`,
      `${enemyName} falls today!`,
      `One last step, ${characterName}!`,
      `The end for ${enemyName}!`,
      `Push through, ${characterName}!`,
      `This is it, ${characterName}!`,
      `Glory awaits, ${characterName}!`,
      `Claim victory, ${characterName}!`,
      `No mercy, ${characterName}!`,
      `Final strike, ${characterName}!`,
      `Endgame move, ${characterName}!`,
      `History is yours, ${characterName}!`,
    ],
    lowHealth: [
      `Hang in there, ${characterName}!`,
      `You're battered but brilliant!`,
      `Tough spot, ${characterName}`,
      `Stand tall, ${characterName}!`,
      `Endure it, ${characterName}!`,
      `Still fighting, ${characterName}!`,
      `Stay strong, ${characterName}!`,
      `Resilient as ever, ${characterName}!`,
      `Refuse to fall, ${characterName}!`,
      `Defy the odds, ${characterName}!`,
      `Never surrender, ${characterName}!`,
      `Keep battling, ${characterName}!`,
      `Stay fierce, ${characterName}!`,
      `Dig deep, ${characterName}!`,
      `Fight on, ${characterName}!`,
      `Undaunted, ${characterName}!`,
    ],
    bonus: [
      `Bonus time, ${characterName}!`,
      `Don’t miss this chance!`,
      `Make it count!`,
      `Go for glory!`,
      `Claim your bonus, ${characterName}!`,
      `Double the reward!`,
      `This is the moment!`,
      `Cash it in!`,
      `Strike while it’s hot!`,
      `Finish this now!`,
      `All or nothing!`,
      `Max the score!`,
      `Hit it hard!`,
      `Make it legendary!`,
      `Earn big, ${characterName}!`,
      `Bonus attack ready!`,
      `It’s payday time!`,
      `Power moment, ${characterName}!`,
      `This one’s golden!`,
      `Don’t waste it!`,
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
      `Learn and strike back!`,
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
      `Better luck next time!`,
      `Fell in combat, ${characterName}.`,
      `Victory slipped away, ${characterName}.`,
      `Not strong enough, ${characterName}.`,
      `Defeated this round, ${characterName}.`,
      `This battle lost, ${characterName}.`,
      `Could not prevail, ${characterName}.`,
      `Try again, ${characterName}!`,
      `No match for ${enemyName}.`,
      `Overwhelmed by ${enemyName}.`,
      `Failed to win, ${characterName}.`,
      `A tough loss, ${characterName}.`,
      `The day lost, ${characterName}.`,
      `${enemyName} was too much.`,
      `The journey ends here.`,
      `Rest in peace, ${characterName}.`,
      `Fallen in battle, ${characterName}.`,
      `Your adventure is over.`,
      `Silence falls on ${characterName}.`,
      `No more fights, ${characterName}.`,
      `Perished by ${enemyName}'s hand.`,
      `The ultimate defeat, ${characterName}.`,
      `Darkness consumes ${characterName}.`,
      `Until next time, ${characterName}.`,
      `Game over, ${characterName}.`,
      `The final breath, ${characterName}.`,
    ],
    bonus: [
      `Bonus time, ${characterName}!`,
      `Don’t miss this chance!`,
      `Make it count!`,
      `Go for glory!`,
      `Claim your bonus, ${characterName}!`,
      `Double the reward!`,
      `This is the moment!`,
      `Cash it in!`,
      `Strike while it’s hot!`,
      `Finish this now!`,
      `All or nothing!`,
      `Max the score!`,
      `Hit it hard!`,
      `Make it legendary!`,
      `Earn big, ${characterName}!`,
      `Bonus attack ready!`,
      `It’s payday time!`,
      `Power moment, ${characterName}!`,
      `This one’s golden!`,
      `Don’t waste it!`,
    ],
  };

  let messageList: string[];

  if (isCorrect) {
    if (hintUsed) messageList = correctMessages.hint;
    else if (streak > 0) messageList = correctMessages.streak;
    else if (quickAnswer) messageList = correctMessages.quick;
    else if (lowHealth) messageList = correctMessages.lowHealth;
    else if (enemyLowHealth) messageList = correctMessages.final;
    else if (isBonusRound) messageList = correctMessages.bonus;
    else messageList = correctMessages.base;
  } else {
    if (playerHealth <= 0) messageList = wrongMessages.lost;
    else if (isBonusRound) messageList = wrongMessages.bonus;
    else if (lowHealth) messageList = wrongMessages.lowHealth;
    else messageList = wrongMessages.base;
  }

  const selectedText =
    messageList[Math.floor(Math.random() * messageList.length)];

  const PHRASE_AUDIO_NORMALIZED = Object.fromEntries(
    Object.entries(PHRASE_AUDIO).map(([key, val]) => [
      key
        .toLowerCase()
        .replace(/[,!?.]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      val,
    ])
  );

  const cleanPhrase = selectedText
    .replace(new RegExp(`\\b${characterName}\\b`, "gi"), "")
    .replace(new RegExp(`\\b${enemyName}\\b`, "gi"), "")
    .replace(/[,!?.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const phraseAudioUrl =
    PHRASE_AUDIO_NORMALIZED[cleanPhrase] ||
    Object.entries(PHRASE_AUDIO_NORMALIZED).find(([key]) =>
      cleanPhrase.startsWith(key)
    )?.[1] ||
    Object.entries(PHRASE_AUDIO_NORMALIZED).find(([key]) =>
      cleanPhrase.includes(key)
    )?.[1];
  const finalPhraseUrl =
    phraseAudioUrl ||
    "micomi-assets.me/Sounds/In%20Game/Correct%20Answer!/cheer_generic.wav";

  const charClips = CHARACTER_AUDIO[characterName] || [];
  const characterAudioArray = Array.isArray(charClips)
    ? charClips
    : charClips
    ? [charClips]
    : [];

  let audio: string[] = [];

  const nameAppears = selectedText
    .toLowerCase()
    .includes(characterName.toLowerCase());
  const nameIsFirst = selectedText.trimStart().startsWith(characterName);

  if (nameAppears) {
    if (nameIsFirst) {
      audio = [...characterAudioArray, finalPhraseUrl];
    } else {
      audio = [finalPhraseUrl, ...characterAudioArray];
    }
  } else {
    audio = [finalPhraseUrl];
  }

  return {
    text: selectedText,
    audio,
  };
};

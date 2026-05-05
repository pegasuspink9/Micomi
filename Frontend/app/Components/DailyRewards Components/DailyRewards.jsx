import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, Platform, StatusBar, ImageBackground, Image } from 'react-native';
import { useDailyReward } from '../../hooks/useDailyReward';
import { gameScale } from '../Responsiveness/gameResponsive';

const DAILY_BOARD = require('./Daily Reward Assets/dailyBoard.png');
const DAILY_BOX = require('./Daily Reward Assets/dailyBoxes.png');
const COINS_IMG = require('../../Components/icons/coins.png');
const DAILY_ICON = require('../Map/Assets/daily.png');

export default function DailyRewards() {
  const [isDailyRewardVisible, setIsDailyRewardVisible] = useState(false);
  const {
    dailyReward,
    loading: dailyRewardLoading,
    claiming: dailyRewardClaiming,
    error: dailyRewardError,
    claimDailyReward,
  } = useDailyReward();

  const handleOpenDailyReward = useCallback(() => setIsDailyRewardVisible(true), []);

  const handleClose = useCallback(() => setIsDailyRewardVisible(false), []);

  const handleClaim = useCallback(async () => {
    const currentReward = dailyReward?.rewards?.find((reward) => reward.is_current);
    if (!currentReward || !dailyReward?.can_claim_today) return;
    await claimDailyReward(currentReward.reward_id);
  }, [claimDailyReward, dailyReward]);

  return (
    <>
      <TouchableOpacity style={styles.dailyRewardButton} activeOpacity={0.9} onPress={handleOpenDailyReward}>
        <Image source={DAILY_ICON} style={styles.dailyRewardIcon} resizeMode="contain" />
      </TouchableOpacity>

      <Modal
        visible={isDailyRewardVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.dailyRewardOverlay}>
          <ImageBackground source={DAILY_BOARD} style={styles.dailyRewardBoard} resizeMode="contain" />

          <TouchableOpacity style={styles.dailyRewardCloseTop} onPress={handleClose}>
            <Text style={styles.dailyRewardCloseTopText}>X</Text>
          </TouchableOpacity>
          
          <View style={styles.dailyRewardInner}>

            {dailyRewardLoading ? (
              <View style={styles.dailyRewardLoading}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.dailyRewardLoadingText}>Loading rewards...</Text>
              </View>
            ) : dailyRewardError ? (
              <Text style={styles.dailyRewardError}>{dailyRewardError}</Text>
            ) : (
              <View style={styles.dailyRewardGrid}>
                {(dailyReward?.rewards || []).map((reward) => {
                  const isClaimed = reward.is_claimed;
                  return (
                    <View
                      key={reward.reward_id}
                      style={[
                        styles.dailyRewardCard,
                        isClaimed && styles.dailyRewardCardClaimed,
                        !isClaimed && styles.dailyRewardCardClaimable,
                      ]}
                    > 
                      <ImageBackground
                        source={DAILY_BOX}
                        style={styles.dailyRewardCardBg}
                        resizeMode="contain"
                      />
                      <Text style={styles.dailyRewardDay}>Day {reward.day}</Text>
                      <View style={styles.rewardContent}>
                        <ImageBackground source={COINS_IMG} style={styles.coinIcon} resizeMode="contain" />
                        <Text style={styles.dailyRewardValue}>{reward.coins}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.dailyRewardClaimTextWrapper}>
              <Text
                style={[
                  styles.dailyRewardClaimText,
                  (!dailyReward?.can_claim_today || dailyRewardClaiming) && styles.dailyRewardClaimTextDisabled,
                ]}
                onPress={dailyReward?.can_claim_today && !dailyRewardClaiming ? handleClaim : undefined}
              >
                {dailyReward?.can_claim_today ? 'Claim' : 'Claimed'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dailyRewardButton: {
    alignItems: 'center', justifyContent: 'center', zIndex: 120,
  },
  dailyRewardIcon: { width: gameScale(60), height: gameScale(60), marginBottom: gameScale(10) },
  dailyRewardOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  dailyRewardBoard: {
    marginBottom: gameScale(100),
    position: 'absolute',
    width: gameScale(700),
    height: gameScale(700),
  },
  dailyRewardInner: { alignItems: 'center', justifyContent: 'center', },
  dailyRewardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: gameScale(150) },
  dailyRewardCard: {
    position: 'relative',
    width: gameScale(100),
    height: gameScale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyRewardCardBg: {
    position: 'absolute',
    width: gameScale(100),
    height: gameScale(100),
  },
  dailyRewardCardClaimed: { opacity: 0.2 },
  dailyRewardCardClaimable: { backgroundColor: 'transparent', opacity: 1 },
  dailyRewardDay: { color: '#FFD700', fontFamily: 'Grobold', fontSize: 12, marginBottom: 4, zIndex: 10 },
  dailyRewardValue: { color: '#ffffff', fontFamily: 'DynaPuff', fontSize: 11, zIndex: 10 },
  rewardContent: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  coinIcon: { width: gameScale(30), height: gameScale(30), marginBottom: 4 },
  dailyRewardLoading: { alignItems: 'center', paddingVertical: 20 },
  dailyRewardLoadingText: { color: '#ffffff', fontFamily: 'DynaPuff', marginTop: 10 },
  dailyRewardError: { color: '#ffb3b3', fontFamily: 'DynaPuff', textAlign: 'center', marginVertical: 10 },

  mapModalTitleText: { color: '#FFD700', fontSize: 30, fontFamily: 'Grobold', marginBottom: 10, textAlign: 'center', textShadowOffset:{width:1, height:1}, textShadowRadius:2, textShadowColor:'black' },
  mapModalBtnText: { color: '#fff', fontFamily: 'Grobold', fontSize: 16 },
  dailyRewardCloseTop: { position: 'absolute', top: gameScale(260), right: gameScale(10), backgroundColor: '#d9534f', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 2, borderColor: '#a94442', zIndex: 20 },
  dailyRewardCloseTopText: { color: '#fff', fontFamily: 'Grobold', fontSize: 14 },
  dailyRewardClaimTextWrapper: { position: 'absolute', bottom: gameScale(-49), left: 0, right: 0, alignItems: 'center' },
  dailyRewardClaimText: { color: '#dec013', fontFamily: 'Grobold', fontSize: 23 },
  dailyRewardClaimTextDisabled: { color: '#dec013c5' },
});

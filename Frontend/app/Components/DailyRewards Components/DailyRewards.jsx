import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDailyReward } from '../../hooks/useDailyReward';

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
        <MaterialCommunityIcons name="gift" size={22} color="#FFE7B3" />
        <Text style={styles.dailyRewardButtonText}>Daily</Text>
      </TouchableOpacity>

      <Modal
        visible={isDailyRewardVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.dailyRewardOverlay}>
          <View style={styles.dailyRewardFrame}>
            <View style={styles.woodySlotContent}>
              <View style={styles.dailyRewardInner}>
                <Text style={styles.mapModalTitleText}>Daily Rewards</Text>

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
                      const isDisabled = !reward.is_current || reward.is_claimed;
                      return (
                        <View
                          key={reward.reward_id}
                          style={[
                            styles.dailyRewardCard,
                            isDisabled && styles.dailyRewardCardDisabled,
                            reward.is_current && styles.dailyRewardCardCurrent,
                          ]}
                        >
                          <Text style={styles.dailyRewardDay}>Day {reward.day}</Text>
                          <Text style={styles.dailyRewardValue}>+{reward.coins} coins</Text>
                          <Text style={styles.dailyRewardValue}>+{reward.exp} exp</Text>
                          {reward.is_claimed && <Text style={styles.dailyRewardClaimed}>Claimed</Text>}
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.dailyRewardActions}>
                  <TouchableOpacity style={styles.mapModalCloseBtn} onPress={handleClose}>
                    <Text style={styles.mapModalBtnText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mapModalEnterBtn,
                      (!dailyReward?.can_claim_today || dailyRewardClaiming) && styles.disabledBtn,
                    ]}
                    onPress={handleClaim}
                    disabled={!dailyReward?.can_claim_today || dailyRewardClaiming}
                  >
                    {dailyRewardClaiming ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.mapModalBtnText}>{dailyReward?.can_claim_today ? 'Claim' : 'Come back tomorrow'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dailyRewardButton: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(148, 63, 2, 0.9)',
    borderWidth: 2, borderColor: '#c46623', alignItems: 'center', justifyContent: 'center', zIndex: 120, elevation: 10,
  },
  dailyRewardButtonText: { color: '#FFE7B3', fontSize: 11, fontFamily: 'Grobold', marginTop: 2 },

  dailyRewardOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 },
  dailyRewardFrame: {
    width: '90%', backgroundColor: '#943f02', borderRadius: 15, padding: 6, elevation: 20,
    borderColor: '#c46623', borderWidth: 3, borderBottomColor: '#4a1e00', borderRightColor: '#6e2f01',
  },
  woodySlotContent: { backgroundColor: '#7c3200', borderRadius: 10, padding: 4 },
  dailyRewardInner: { padding: 16, alignItems: 'center' },
  dailyRewardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  dailyRewardCard: {
    width: '28%',
    backgroundColor: '#7c3200',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#c46623',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  dailyRewardCardCurrent: { backgroundColor: '#8d3f05', borderColor: '#f7c36a' },
  dailyRewardCardDisabled: { opacity: 0.45 },
  dailyRewardDay: { color: '#FFD700', fontFamily: 'Grobold', fontSize: 12, marginBottom: 4 },
  dailyRewardValue: { color: '#ffffff', fontFamily: 'DynaPuff', fontSize: 11 },
  dailyRewardClaimed: { color: '#b3f7b3', fontFamily: 'DynaPuff', fontSize: 10, marginTop: 6 },
  dailyRewardActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  dailyRewardLoading: { alignItems: 'center', paddingVertical: 20 },
  dailyRewardLoadingText: { color: '#ffffff', fontFamily: 'DynaPuff', marginTop: 10 },
  dailyRewardError: { color: '#ffb3b3', fontFamily: 'DynaPuff', textAlign: 'center', marginVertical: 10 },

  mapModalTitleText: { color: '#FFD700', fontSize: 30, fontFamily: 'Grobold', marginBottom: 10, textAlign: 'center', textShadowOffset:{width:1, height:1}, textShadowRadius:2, textShadowColor:'black' },
  mapModalCloseBtn: { backgroundColor: '#d9534f', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 2, borderColor: '#a94442' },
  mapModalEnterBtn: { backgroundColor: '#5cb85c', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, borderWidth: 2, borderColor: '#4cae4c' },
  mapModalBtnText: { color: '#fff', fontFamily: 'Grobold', fontSize: 16 },
  disabledBtn: { backgroundColor: '#555', borderColor: '#333' },
});

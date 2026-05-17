import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';
import { questService } from '../../services/questService';
import { RewardModal } from './RewardModal';

const QuestCard = ({ quest, onClaim, claiming = false }) => {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  const {
    player_quest_id,
    quest_id,
    title,
    description,
    objective_type,
    target_value,
    current_value,
    reward_exp,
    reward_coins,
    quest_period,
    is_completed,
    is_claimed,
    progress_percentage
  } = quest;

  const progressPercent = progress_percentage || (current_value / target_value * 100);
  const isClaimable = is_completed && !is_claimed;
  const objectiveLabel = questService.formatObjectiveType(objective_type);

  const dots = useMemo(() => {
    const dotArray = [];
    const dotCount = 12;
    for (let i = 0; i < dotCount; i++) {
      dotArray.push({
        id: i,
        top: `${Math.random() * 90 + 5}%`,
        left: `${Math.random() * 90 + 5}%`,
        size: gameScale(Math.random() * 6 + 3),
        opacity: Math.random() * 0.15 + 0.05,
        isLight: Math.random() > 0.5,
      });
    }
    return dotArray;
  }, [player_quest_id]);

  const getGradientColors = () => {
    if (is_claimed) return ['#3a5a1a', '#2a4a12'];
    if (isClaimable) return ['#4a6b2a', '#2a4a12'];
    switch (quest_period) {
      case 'daily': return ['#6b4420', '#3e2208'];
      case 'weekly': return ['#5a3a18', '#2a1500'];
      case 'monthly': return ['#7a5020', '#4a2c10'];
      default: return ['#6b4420', '#3e2208'];
    }
  };

  const getBorderColors = () => {
    if (is_claimed) {
      return {
        outerBg: '#4a6b2a', outerBorderTop: '#3a5a1a', outerBorderBottom: '#6b8b3a',
        middleBg: '#3a5a1a', middleBorderTop: '#6bba30', middleBorderBottom: '#1a3a0a',
        innerBg: 'rgba(107, 186, 48, 0.15)', innerBorder: 'rgba(107, 186, 48, 0.3)',
      };
    }
    if (isClaimable) {
      return {
        outerBg: '#4a6b2a', outerBorderTop: '#2a4a12', outerBorderBottom: '#6bba30',
        middleBg: '#2a4a12', middleBorderTop: '#7bc840', middleBorderBottom: '#1a3a0a',
        innerBg: 'rgba(107, 186, 48, 0.2)', innerBorder: 'rgba(123, 200, 64, 0.4)',
      };
    }
    switch (quest_period) {
      case 'daily':
        return {
          outerBg: '#5a3a1e', outerBorderTop: '#3e2208', outerBorderBottom: '#8b6b3d',
          middleBg: '#4a2c10', middleBorderTop: '#c4904a', middleBorderBottom: '#2a1500',
          innerBg: 'rgba(180, 120, 50, 0.15)', innerBorder: 'rgba(180, 120, 50, 0.3)',
        };
      case 'weekly':
        return {
          outerBg: '#5a3a18', outerBorderTop: '#3e2208', outerBorderBottom: '#8b6830',
          middleBg: '#4a2c10', middleBorderTop: '#b87a28', middleBorderBottom: '#2a1500',
          innerBg: 'rgba(184, 122, 40, 0.15)', innerBorder: 'rgba(184, 122, 40, 0.3)',
        };
      case 'monthly':
        return {
          outerBg: '#6b4420', outerBorderTop: '#4a2c10', outerBorderBottom: '#a07838',
          middleBg: '#5a3a18', middleBorderTop: '#d49a38', middleBorderBottom: '#3e2208',
          innerBg: 'rgba(212, 154, 56, 0.15)', innerBorder: 'rgba(212, 154, 56, 0.3)',
        };
      default:
        return {
          outerBg: '#5a3a1e', outerBorderTop: '#3e2208', outerBorderBottom: '#8b6b3d',
          middleBg: '#4a2c10', middleBorderTop: '#c4904a', middleBorderBottom: '#2a1500',
          innerBg: 'rgba(180, 120, 50, 0.15)', innerBorder: 'rgba(180, 120, 50, 0.3)',
        };
    }
  };

  const getProgressBarColor = () => {
    if (is_completed) return '#6bba30';
    if (progressPercent >= 75) return '#a0c040';
    if (progressPercent >= 50) return '#c98930';
    if (progressPercent >= 25) return '#b87a28';
    return '#8b5e2f';
  };

  const getButtonBorderColors = () => {
    if (is_claimed || isClaimable) return { top: '#6bba30', bottom: '#2a4a12' };
    switch (quest_period) {
      case 'daily': return { top: '#c4904a', bottom: '#3e2208' };
      case 'weekly': return { top: '#b87a28', bottom: '#2a1500' };
      case 'monthly': return { top: '#d49a38', bottom: '#4a2c10' };
      default: return { top: '#c4904a', bottom: '#3e2208' };
    }
  };

  const handleClaim = async () => {
    if (isClaimable && onClaim) {
      try {
        await onClaim(quest_id);
        setRewardData({ exp: reward_exp, coins: reward_coins });
        setShowRewardModal(true);
      } catch (error) {
        console.error('Claim failed:', error);
      }
    }
  };

  const closeModal = () => setShowRewardModal(false);

  const borderColors = getBorderColors();
  const buttonBorderColors = getButtonBorderColors();

  return (
    <>
      <View style={[
        styles.cardBorderOuter, 
        { 
          backgroundColor: borderColors.outerBg,
          borderTopColor: borderColors.outerBorderTop,
          borderLeftColor: borderColors.outerBorderTop,
          borderBottomColor: borderColors.outerBorderBottom,
          borderRightColor: borderColors.outerBorderBottom,
        }, 
        is_claimed && styles.claimedCard
      ]}>
        <View style={[
          styles.cardBorderMiddle, 
          { 
            backgroundColor: borderColors.middleBg,
            borderTopColor: borderColors.middleBorderTop,
            borderLeftColor: borderColors.middleBorderTop,
            borderBottomColor: borderColors.middleBorderBottom,
            borderRightColor: borderColors.middleBorderBottom,
          }
        ]}>
          <View style={[
            styles.cardBorderInner,
            {
              backgroundColor: borderColors.innerBg,
              borderColor: borderColors.innerBorder,
            }
          ]}>
            <LinearGradient
              colors={getGradientColors()}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.dotsOverlay} pointerEvents="none">
                {dots.map((dot) => (
                  <View
                    key={dot.id}
                    style={[
                      styles.dot,
                      {
                        top: dot.top,
                        left: dot.left,
                        width: dot.size,
                        height: dot.size,
                        borderRadius: dot.size / 2,
                        backgroundColor: dot.isLight 
                          ? `rgba(255, 255, 255, ${dot.opacity})` 
                          : `rgba(0, 0, 0, ${dot.opacity})`,
                      }
                    ]}
                  />
                ))}
              </View>

              <View style={styles.rewardsSection}>
                <View style={[styles.rewardBox, { borderColor: borderColors.innerBorder }]}>
                  <Text style={styles.rewardTitle}>Rewards</Text>
                  <View style={styles.rewardRow}>
                    <View style={styles.rewardItem}>
                      <Image
                        source={require('../icons/points.png')}
                        style={styles.rewardIconImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.rewardValue}>{reward_exp}</Text>
                    </View>
                    <View style={[styles.rewardDivider, { backgroundColor: borderColors.middleBorderTop }]} />
                    <View style={styles.rewardItem}>
                      <Image
                        source={require('../icons/coins.png')}
                        style={styles.rewardIconImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.rewardValue}>{reward_coins}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.detailsSection, { borderRightColor: borderColors.innerBorder }]}>
                <View style={styles.descriptionRow}>
                  <Text style={styles.questTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.questDescription} numberOfLines={2}>{description}</Text>
                </View>
                
                <View style={styles.progressRow}>
                  <View style={[styles.progressBarContainer, { borderColor: borderColors.innerBorder }]}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${Math.min(progressPercent, 100)}%`,
                          backgroundColor: getProgressBarColor()
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {current_value}/{target_value}
                  </Text>
                </View>
                
                <View style={styles.objectiveRow}>
                  <View style={[styles.objectiveTag, { borderColor: borderColors.innerBorder }]}>
                    <Text style={styles.objectiveLabel}>{objectiveLabel}</Text>
                  </View>
                  {is_claimed && (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.claimedBadgeText}>Claimed</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.claimSection}>
                <TouchableOpacity
                  style={[
                    styles.claimButton,
                    {
                      borderTopColor: buttonBorderColors.top,
                      borderLeftColor: buttonBorderColors.top,
                      borderBottomColor: buttonBorderColors.bottom,
                      borderRightColor: buttonBorderColors.bottom,
                    },
                    !isClaimable && styles.claimButtonDisabled,
                    isClaimable && styles.claimButtonActive,
                    is_claimed && styles.claimButtonClaimed
                  ]}
                  onPress={handleClaim}
                  disabled={!isClaimable || claiming}
                  activeOpacity={0.7}
                >
                  {claiming ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[
                      styles.claimButtonText,
                      !isClaimable && styles.claimButtonTextDisabled
                    ]}>
                      {is_claimed ? '✓' : isClaimable ? 'Claim' : 'In Progress'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
      <RewardModal visible={showRewardModal} onClose={closeModal} rewards={rewardData} />
    </>
  );
};

const styles = StyleSheet.create({
  cardBorderOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    shadowColor: '#000',
    shadowOffset: { width: gameScale(2), height: gameScale(3) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(4),
    elevation: 5,
    overflow: 'hidden',
    borderRadius: gameScale(12),
  },
  claimedCard: {
    opacity: 0.7,
  },
  cardBorderMiddle: {
    flex: 1,
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(12),
    overflow: 'hidden',
  },
  cardBorderInner: {
    flex: 1,
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    padding: gameScale(4),
    minHeight: gameScale(75),
    position: 'relative',
  },
  dotsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  dot: {
    position: 'absolute',
  },
  rewardsSection: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rewardBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: gameScale(3),
    borderRadius: gameScale(8),
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: gameScale(1),
  },
  rewardTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
    marginBottom: gameScale(3),
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gameScale(10),
  },
  rewardItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIcon: {
    fontSize: gameScale(12),
  },
  rewardIconImage: {
    width: gameScale(18),
    height: gameScale(18),
  },
  rewardValue: {
    color: '#f0c56e',
    fontSize: gameScale(11),
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    textShadowColor: '#1a0e00',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  rewardDivider: {
    width: gameScale(1),
    height: gameScale(20),
    opacity: 0.5,
  },
  detailsSection: {
    width: '50%',
    paddingHorizontal: gameScale(8),
    justifyContent: 'space-between',
    borderRightWidth: gameScale(1),
    zIndex: 1,
  },
  descriptionRow: {
    flex: 1,
    justifyContent: 'center',
  },
  questTitle: {
    color: '#f4e7d1',
    fontSize: gameScale(11),
    fontFamily: 'Grobold',
    marginBottom: gameScale(1),
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
  questDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    lineHeight: gameScale(10),
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(6),
    marginVertical: gameScale(1),
  },
  progressBarContainer: {
    flex: 1,
    height: gameScale(8),
    backgroundColor: '#2a1500',
    borderRadius: gameScale(4),
    overflow: 'hidden',
    borderWidth: gameScale(1),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: gameScale(4),
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
    minWidth: gameScale(40),
    left: gameScale(5),
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  objectiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(3),
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
  },
  objectiveLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
  },
  claimedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(2),
    borderRadius: gameScale(6),
    borderWidth: gameScale(1),
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  claimedBadgeText: {
    color: '#6bba30',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
  },
  claimSection: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: gameScale(8),
    zIndex: 1,
  },
  claimButton: {
    width: '100%',
    paddingVertical: gameScale(6),
    borderRadius: gameScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: gameScale(2),
  },
  claimButtonDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
  },
  claimButtonActive: {
    backgroundColor: '#6bba30',
    shadowColor: '#6bba30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  claimButtonClaimed: {
    backgroundColor: 'rgba(107, 186, 48, 0.2)',
  },
  claimButtonText: {
    color: '#f4e7d1',
    fontSize: gameScale(11),
    fontFamily: 'Grobold',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
  claimButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default QuestCard;
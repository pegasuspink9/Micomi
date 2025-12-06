import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';
import { questService } from '../../services/questService';

const QuestCard = ({ quest, onClaim, claiming = false }) => {
  const {
    player_quest_id,
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

  // Generate random dots for cartoonish effect - memoized to prevent re-renders
  const dots = useMemo(() => {
    const dotArray = [];
    const dotCount = 12; // Number of dots
    
    for (let i = 0; i < dotCount; i++) {
      dotArray.push({
        id: i,
        top: `${Math.random() * 90 + 5}%`,
        left: `${Math.random() * 90 + 5}%`,
        size: gameScale(Math.random() * 6 + 3), // Random size between 3-9
        opacity: Math.random() * 0.15 + 0.05, // Random opacity between 0.05-0.2
        isLight: Math.random() > 0.5, // Randomly light or dark dot
      });
    }
    return dotArray;
  }, [player_quest_id]); // Regenerate only when quest changes

    const getGradientColors = () => {
    if (is_claimed) {
      return ['#2d4a2d', '#1a2e1a'];
    }
    if (isClaimable) {
      return ['#2d5a2d', '#1a3d1a'];
    }
    switch (quest_period) {
      case 'daily':
        return ['#1e3a5f', '#0d1f33']; // Dark blue
      case 'weekly':
        return ['#2a4a6e', '#15304d']; // Medium blue
      case 'monthly':
        return ['#1a5276', '#0e3a52']; // Teal blue
      default:
        return ['#1e3a5f', '#0d1f33'];
    }
  };

  // Get theme-blended border colors based on quest period
 const getBorderColors = () => {
    if (is_claimed) {
      return {
        outerBg: '#3d5a3d',
        outerBorderTop: '#2d4a2d',
        outerBorderBottom: '#4a6b4a',
        middleBg: '#2d4a2d',
        middleBorderTop: '#4CAF50',
        middleBorderBottom: '#1a2e1a',
        innerBg: 'rgba(76, 175, 80, 0.15)',
        innerBorder: 'rgba(76, 175, 80, 0.3)',
      };
    }
    if (isClaimable) {
      return {
        outerBg: '#2d5a2d',
        outerBorderTop: '#1a3d1a',
        outerBorderBottom: '#4CAF50',
        middleBg: '#1a3d1a',
        middleBorderTop: '#66BB6A',
        middleBorderBottom: '#0d260d',
        innerBg: 'rgba(76, 175, 80, 0.2)',
        innerBorder: 'rgba(102, 187, 106, 0.4)',
      };
    }
    switch (quest_period) {
      case 'daily':
        return {
          outerBg: '#1e3a5f',
          outerBorderTop: '#0d1f33',
          outerBorderBottom: '#2d5a87',
          middleBg: '#152d4a',
          middleBorderTop: '#4a90d9',
          middleBorderBottom: '#0a1929',
          innerBg: 'rgba(74, 144, 217, 0.15)',
          innerBorder: 'rgba(74, 144, 217, 0.3)',
        };
      case 'weekly':
        return {
          outerBg: '#2a4a6e',
          outerBorderTop: '#15304d',
          outerBorderBottom: '#3d6a94',
          middleBg: '#1f3a57',
          middleBorderTop: '#5a9fd4',
          middleBorderBottom: '#0f2536',
          innerBg: 'rgba(90, 159, 212, 0.15)',
          innerBorder: 'rgba(90, 159, 212, 0.3)',
        };
      case 'monthly':
        return {
          outerBg: '#1a5276',
          outerBorderTop: '#0e3a52',
          outerBorderBottom: '#2980b9',
          middleBg: '#14415e',
          middleBorderTop: '#3498db',
          middleBorderBottom: '#0a2d42',
          innerBg: 'rgba(52, 152, 219, 0.15)',
          innerBorder: 'rgba(52, 152, 219, 0.3)',
        };
      default:
        return {
          outerBg: '#1e3a5f',
          outerBorderTop: '#0d1f33',
          outerBorderBottom: '#2d5a87',
          middleBg: '#152d4a',
          middleBorderTop: '#4a90d9',
          middleBorderBottom: '#0a1929',
          innerBg: 'rgba(74, 144, 217, 0.15)',
          innerBorder: 'rgba(74, 144, 217, 0.3)',
        };
    }
  };

  const getProgressBarColor = () => {
    if (is_completed) return '#4CAF50';
    if (progressPercent >= 75) return '#8BC34A';
    if (progressPercent >= 50) return '#FFC107';
    if (progressPercent >= 25) return '#FF9800';
    return '#2196F3';
  };

  const getButtonBorderColors = () => {
    if (is_claimed || isClaimable) {
      return {
        top: '#66BB6A',
        bottom: '#2d4a2d',
      };
    }
    switch (quest_period) {
      case 'daily':
        return { top: '#4a90d9', bottom: '#0d1f33' }; // Dark blue - matches daily theme
      case 'weekly':
        return { top: '#5a9fd4', bottom: '#0f2536' }; // Medium blue - matches weekly theme
      case 'monthly':
        return { top: '#3498db', bottom: '#0a2d42' }; // Teal blue - matches monthly theme
      default:
        return { top: '#4a90d9', bottom: '#0d1f33' };
    }
  };

  const handleClaim = () => {
    if (isClaimable && onClaim) {
      onClaim(player_quest_id);
    }
  };

  const borderColors = getBorderColors();
  const buttonBorderColors = getButtonBorderColors();

  return (
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
            {/* Cartoonish Dots Overlay */}
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

            {/* Rewards Section - 25% */}
            <View style={styles.rewardsSection}>
              <View style={[styles.rewardBox, { borderColor: borderColors.innerBorder }]}>
                <Text style={styles.rewardTitle}>Rewards</Text>
                <View style={styles.rewardRow}>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>⭐</Text>
                    <Text style={styles.rewardValue}>{reward_exp}</Text>
                  </View>
                  <View style={[styles.rewardDivider, { backgroundColor: borderColors.middleBorderTop }]} />
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>🪙</Text>
                    <Text style={styles.rewardValue}>{reward_coins}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Details Section - 50% */}
            <View style={[styles.detailsSection, { borderRightColor: borderColors.innerBorder }]}>
              {/* Row 1: Description */}
              <View style={styles.descriptionRow}>
                <Text style={styles.questTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.questDescription} numberOfLines={2}>{description}</Text>
              </View>
              
              {/* Row 2: Progress Bar */}
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
              
              {/* Row 3: Objective Type */}
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

            {/* Claim Button Section - 25% */}
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
  );
};

const styles = StyleSheet.create({
   cardBorderOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(1), // Reduced
    shadowColor: '#000',
    shadowOffset: { width: gameScale(2), height: gameScale(3) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(4),
    elevation: 5,
    overflow: 'hidden',
    borderRadius: gameScale(12), // Slightly smaller
  },
  claimedCard: {
    opacity: 0.7,
  },
  // Middle border - theme colored
  cardBorderMiddle: {
    flex: 1,
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(12),
    overflow: 'hidden',
  },
  // Inner border - theme colored
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
  // Cartoonish dots overlay
  dotsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  dot: {
    position: 'absolute',
  },
  // Rewards Section - 25%
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
  rewardValue: {
    color: '#FFD700',
    fontSize: gameScale(11),
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  rewardDivider: {
    width: gameScale(1),
    height: gameScale(20),
    opacity: 0.5,
  },
  // Details Section - 50%
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
    height: gameScale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    color: '#4CAF50',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
  },
  // Claim Button Section - 25%
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
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  claimButtonClaimed: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
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
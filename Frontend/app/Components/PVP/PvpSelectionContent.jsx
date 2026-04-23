import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { gameScale } from '../Responsiveness/gameResponsive';

const TOPIC_PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945939/473288860-e8a1b478-91d3-44c9-8a59-4bc46db4d1c0_jaroj9.png';

const PvpSelectionContent = ({
  loadingPreview,
  findingMatch,
  startingMatch,
  settingTopic,
  hasResumableMatch,
  currentTopic,
  pvpTopicsLength,
  pvpError,
  primaryButtonLabel,
  onPreviousTopic,
  onNextTopic,
  onStartPvpMatch,
  onClose,
  onCancelPvpSearch,
}) => {
  const isBusy = startingMatch || settingTopic;
  const isActionDisabled = !pvpTopicsLength || findingMatch || isBusy;
  const isPlayDisabled = isBusy || loadingPreview || (!hasResumableMatch && !currentTopic);

  return (
    <View style={styles.contentWrap}>
      {loadingPreview ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#BFE2FF" size="small" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      ) : (
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={onPreviousTopic}
            activeOpacity={0.85}
            disabled={isActionDisabled}
          >
            <MaterialCommunityIcons name="chevron-left" size={gameScale(36)} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topicCard}
            activeOpacity={0.9}
            onPress={onStartPvpMatch}
            disabled={isActionDisabled}
          >
            <ImageBackground
              source={{ uri: TOPIC_PLACEHOLDER_IMAGE }}
              style={styles.topicPlaceholderImage}
              imageStyle={styles.topicPlaceholderImageStyle}
              resizeMode="cover"
            >
              <View style={styles.topicPlaceholderOverlay}>
                <Text style={styles.topicLabel}>Topic</Text>
                <Text style={styles.topicValue} numberOfLines={2} adjustsFontSizeToFit>
                  {currentTopic || 'No Topic'}
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={onNextTopic}
            activeOpacity={0.85}
            disabled={isActionDisabled}
          >
            <MaterialCommunityIcons name="chevron-right" size={gameScale(36)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {pvpError ? <Text style={styles.errorText}>{pvpError}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.closeButton]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>Close</Text>
        </TouchableOpacity>

        {findingMatch ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancelPvpSearch}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Cancel Search</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={onStartPvpMatch}
            activeOpacity={0.85}
            disabled={isPlayDisabled}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>{primaryButtonLabel}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: gameScale(14),
    paddingBottom: gameScale(30),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gameScale(8),
    paddingVertical: gameScale(16),
  },
  loadingText: {
    color: '#DCEEFF',
    fontSize: gameScale(13),
    fontFamily: 'DynaPuff',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: gameScale(20),
  },
  arrowButton: {
    width: gameScale(58),
    height: gameScale(58),
    borderRadius: gameScale(29),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 36, 72, 0.84)',
    borderWidth: gameScale(2),
    borderColor: '#58B5FF',
  },
  topicCard: {
    width: gameScale(220),
    height: gameScale(250),
    marginHorizontal: gameScale(10),
    borderRadius: gameScale(14),
    overflow: 'hidden',
    borderWidth: gameScale(2),
    borderColor: '#8FD1FF',
    backgroundColor: 'rgba(16, 36, 72, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(8) },
    shadowOpacity: 0.35,
    shadowRadius: gameScale(10),
    elevation: gameScale(10),
  },
  topicPlaceholderImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topicPlaceholderImageStyle: {
    borderRadius: gameScale(12),
  },
  topicPlaceholderOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: gameScale(14),
    paddingVertical: gameScale(16),
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topicLabel: {
    color: '#D6EEFF',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(3),
  },
  topicValue: {
    color: '#FFFFFF',
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
  errorText: {
    color: '#FFB6B6',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(8),
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: gameScale(10),
    marginTop: gameScale(6),
  },
  actionButton: {
    flex: 1,
    borderRadius: gameScale(10),
    paddingVertical: gameScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: gameScale(1),
  },
  closeButton: {
    backgroundColor: '#8A3344',
    borderColor: '#C15F71',
  },
  playButton: {
    backgroundColor: '#0B7DA7',
    borderColor: '#65BFF2',
  },
  cancelButton: {
    backgroundColor: '#5E3C93',
    borderColor: '#8F6BC8',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: gameScale(13),
    fontFamily: 'Grobold',
  },
});

export default PvpSelectionContent;
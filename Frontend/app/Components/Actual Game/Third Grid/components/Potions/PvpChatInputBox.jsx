import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { gameScale } from '../../../../Responsiveness/gameResponsive';
import { soundManager } from '../../../Sounds/UniversalSoundManager';

const PvpChatInputBox = ({
  matchId = null,
  disabled = false,
  sending = false,
  onSendMessage = null,
  onInputActivityChange = null,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setIsFocused(false);
      inputRef.current?.blur();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const isInputActive = isFocused || isKeyboardVisible;

  useEffect(() => {
    if (typeof onInputActivityChange === 'function') {
      onInputActivityChange(isInputActive);
    }
  }, [isInputActive, onInputActivityChange]);

  const canSend = useMemo(() => {
    return !disabled && !sending && message.trim().length > 0;
  }, [disabled, message, sending]);

  const handleSend = useCallback(async () => {
    if (!canSend) {
      return;
    }

    if (typeof onSendMessage !== 'function') {
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    soundManager.playGameButtonTapSound();
    const result = await onSendMessage(trimmedMessage);

    if (result?.success === false) {
      console.warn('Failed to send PvP chat message:', result?.error || 'Unknown error');
      return;
    }

    setMessage('');
  }, [canSend, message, onSendMessage]);

  return (
    <View style={[styles.host, isKeyboardVisible && styles.hostKeyboardVisible]} pointerEvents="box-none">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
        pointerEvents="box-none"
      >
        <View style={[styles.inputRow, disabled && styles.inputRowDisabled]}>
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            maxLength={50} 
            editable={!disabled}
            placeholder="Type a message..."
            placeholderTextColor="rgba(194, 225, 255, 0.65)"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCorrect={false}
            autoCapitalize="sentences"
          />

          <Pressable
            onPress={handleSend}
            disabled={!canSend || typeof onSendMessage !== 'function'}
            style={({ pressed }) => [
              styles.sendButton,
              (!canSend || typeof onSendMessage !== 'function') && styles.sendButtonDisabled,
              pressed && canSend ? styles.sendButtonPressed : null,
            ]}
          >
            <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
          </Pressable>
        </View>

        <Text style={styles.hintText} accessible={false}>
          {matchId
            ? 'PvP live chat sends reaction bubbles in real time'
            : 'Waiting for match sync...'}
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    width: '100%',
    minHeight: gameScale(82),
    justifyContent: 'center'
  },
  hostKeyboardVisible: {
    marginBottom: gameScale(30), 
  },
  wrapper: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(6),
  },

  inputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: gameScale(10),
    borderTopWidth: gameScale(2),
    borderTopColor: '#7cc5ff',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#7cc5ff',
    borderBottomWidth: gameScale(3),
    borderBottomColor: '#0e4589',
    borderRightWidth: gameScale(3),
    borderRightColor: '#0e4589',
    backgroundColor: '#0a4f9c',
    minHeight: gameScale(50),
    padding: gameScale(6),
  },

  inputRowDisabled: {
    opacity: 0.7,
  },

  input: {
    flex: 1,
    minHeight: gameScale(36),
    color: '#f0f8ff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
    paddingHorizontal: gameScale(10),
    borderRadius: gameScale(8),
    backgroundColor: 'rgba(6, 29, 56, 0.55)',
  },

  sendButton: {
    marginLeft: gameScale(8),
    minWidth: gameScale(56),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: gameScale(8),
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(10),
    backgroundColor: '#2f8fff',
    borderTopWidth: gameScale(1),
    borderTopColor: '#9cd0ff',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#9cd0ff',
    borderBottomWidth: gameScale(2),
    borderBottomColor: '#1557a8',
    borderRightWidth: gameScale(2),
    borderRightColor: '#1557a8',
  },

  sendButtonDisabled: {
    backgroundColor: '#4f6f95',
    borderTopColor: '#7f95b4',
    borderLeftColor: '#7f95b4',
    borderBottomColor: '#334b69',
    borderRightColor: '#334b69',
  },

  sendButtonPressed: {
    transform: [{ translateY: gameScale(1) }],
  },

  sendButtonText: {
    color: '#ffffff',
    fontFamily: 'Grobold',
    fontSize: gameScale(10),
    textAlign: 'center',
  },

  hintText: {
    opacity: 0,
    fontFamily: 'DynaPuff',
    fontSize: gameScale(9),
    textAlign: 'center',
  },
});

export default React.memo(PvpChatInputBox);
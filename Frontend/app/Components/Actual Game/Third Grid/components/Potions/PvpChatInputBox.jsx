import React, { useCallback, useMemo, useState } from 'react';
import {
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

const PvpChatInputBox = ({ disabled = false }) => {
  const [message, setMessage] = useState('');

  const canSend = useMemo(() => {
    return !disabled && message.trim().length > 0;
  }, [disabled, message]);

  const handleSend = useCallback(() => {
    if (!canSend) {
      return;
    }

    soundManager.playGameButtonTapSound();
    console.log('PvP chat input placeholder:', message.trim());
    setMessage('');
  }, [canSend, message]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.wrapper}
    >
      <View style={[styles.inputRow, disabled && styles.inputRowDisabled]}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          editable={!disabled}
          placeholder="Type a message..."
          placeholderTextColor="rgba(194, 225, 255, 0.65)"
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend ? styles.sendButtonPressed : null,
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>

      <Text style={styles.hintText}>PvP chat keyboard placeholder (logic coming soon)</Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
    marginTop: gameScale(6),
    color: '#9fd5ff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(9),
    textAlign: 'center',
  },
});

export default React.memo(PvpChatInputBox);

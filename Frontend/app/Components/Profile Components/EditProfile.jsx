import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, TextInput, StyleSheet, ScrollView } from 'react-native';
import SpriteActivityIndicator from '../Actual Game/Loading/SpriteActivityIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gameScale } from '../Responsiveness/gameResponsive';

const EditProfile = ({
  visible,
  onClose,
  playerData,
  availableAvatars = [],
  updateProfile,
  updateAvatar,
  isSelectingAvatar = false,
  isAvatarModalVisible,
  setIsAvatarModalVisible,
}) => {
  const [editingField, setEditingField] = useState(null);
  const [tempName, setTempName] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  useEffect(() => {
    if (visible) {
      setTempName(playerData?.playerName || '');
      setTempUsername(playerData?.username || '');
      setTempEmail(playerData?.email || '');
      setTempPassword('');
      setTempConfirmPassword('');
      setPasswordError('');
      setEditingField(null);
    }
  }, [visible, playerData]);

  const togglePasswordEdit = () => {
    if (editingField === 'password') {
      // Validate before closing the inline edit
      if (tempPassword || tempConfirmPassword) {
        if (tempPassword !== tempConfirmPassword) {
          setPasswordError('Passwords do not match');
          return;
        }
      }
      setPasswordError('');
      setEditingField(null);
    } else {
      setEditingField('password');
    }
  };

  const handleSaveProfile = async () => {
    // Validate password match if they are trying to save while typing a password
    if (tempPassword || tempConfirmPassword) {
      if (tempPassword !== tempConfirmPassword) {
        setPasswordError('Passwords do not match');
        setEditingField('password'); // keep them on the password edit view
        return;
      }
    }

    try {
      setIsSavingProfile(true);
      const payload = {};
      if (tempName !== (playerData?.playerName || '')) payload.player_name = tempName;
      if (tempUsername !== (playerData?.username || '')) payload.username = tempUsername;
      if (tempEmail !== (playerData?.email || '')) payload.email = tempEmail;
      if (tempPassword && tempPassword.length > 0) payload.password = tempPassword;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const result = await updateProfile(payload);
      if (result && result.success) {
        onClose();
      } else {
        console.error('Profile update failed', result);
      }
    } catch (err) {
      console.error('Save profile error', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUseAvatar = async () => {
    if (!selectedAvatarId) return;
    try {
      await updateAvatar(selectedAvatarId);
      setSelectedAvatarId(null);
      setIsAvatarModalVisible(false);
    } catch (err) {
      console.error('Use avatar failed', err);
    }
  };

  if (!visible) return null;

  return (
    <View style={localStyles.modalOverlay}>
      {isAvatarModalVisible ? (
        /* ================= AVATAR CHOOSER MODAL ================= */
        <LinearGradient colors={['#1a2a44', '#0d1625']} style={[localStyles.modalContent, { maxHeight: '85%' }]}>
          <Text style={localStyles.modalTitle}>Choose Your Avatar</Text>

          <FlatList
            data={availableAvatars}
            numColumns={3}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ alignItems: 'center' }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[localStyles.avatarOption, selectedAvatarId === item.id && localStyles.avatarOptionSelected]} onPress={() => setSelectedAvatarId(item.id)}>
                <View style={localStyles.modalAvatarOuter}>
                  <View style={localStyles.modalAvatarInner}>
                    <Image source={{ uri: item.url }} style={localStyles.modalAvatarImage} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={localStyles.modalButtonContainer}>
            <TouchableOpacity style={[localStyles.modalButton, localStyles.cancelButton]} onPress={() => { setIsAvatarModalVisible(false); setSelectedAvatarId(null); }}>
              <Text style={localStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[localStyles.modalButton, localStyles.confirmButton, (!selectedAvatarId || isSelectingAvatar) && { opacity: 0.5 }]} onPress={handleUseAvatar} disabled={!selectedAvatarId || isSelectingAvatar}>
              {isSelectingAvatar ? <SpriteActivityIndicator size={gameScale(25)} /> : <Text style={localStyles.buttonText}>Use Avatar</Text>}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ) : (
        /* ================= EDIT PROFILE MODAL ================= */
        <LinearGradient colors={['#1a2a44', '#0d1625']} style={[localStyles.modalContent, { maxHeight: '85%' }]}>
          <Text style={localStyles.modalTitle}>Profile</Text>

          <View style={{ alignItems: 'center', marginBottom: gameScale(12) }}>
            <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)}>
              <View style={localStyles.modalAvatarOuter}>
                <View style={localStyles.modalAvatarInner}>
                  <Image source={{ uri: playerData.playerAvatar }} style={localStyles.modalAvatarImage} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
            <View style={{ gap: gameScale(10), paddingBottom: gameScale(5) }}>
              {/* NAME FIELD */}
              <View style={localStyles.fieldRow}>
                {editingField === 'name' ? (
                  <TextInput style={localStyles.fieldInput} value={tempName} onChangeText={setTempName} placeholder="Player name" placeholderTextColor="#aaa" autoFocus />
                ) : (
                  <Text style={localStyles.fieldText}>{tempName || 'Player name'}</Text>
                )}
                <TouchableOpacity onPress={() => setEditingField(editingField === 'name' ? null : 'name')}>
                  <Ionicons name={editingField === 'name' ? 'save' : 'create-outline'} size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* USERNAME FIELD */}
              <View style={localStyles.fieldRow}>
                {editingField === 'username' ? (
                  <TextInput style={localStyles.fieldInput} value={tempUsername} onChangeText={setTempUsername} placeholder="Username" placeholderTextColor="#aaa" autoCapitalize="none" autoFocus />
                ) : (
                  <Text style={localStyles.fieldText}>{tempUsername || 'Username'}</Text>
                )}
                <TouchableOpacity onPress={() => setEditingField(editingField === 'username' ? null : 'username')}>
                  <Ionicons name={editingField === 'username' ? 'save' : 'create-outline'} size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* EMAIL FIELD */}
              <View style={localStyles.fieldRow}>
                {editingField === 'email' ? (
                  <TextInput style={localStyles.fieldInput} value={tempEmail} onChangeText={setTempEmail} placeholder="Email" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" autoFocus />
                ) : (
                  <Text style={localStyles.fieldText}>{tempEmail || 'No email'}</Text>
                )}
                <TouchableOpacity onPress={() => setEditingField(editingField === 'email' ? null : 'email')}>
                  <Ionicons name={editingField === 'email' ? 'save' : 'create-outline'} size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* PASSWORD FIELD */}
              <View style={[localStyles.fieldRow, editingField === 'password' && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                {editingField === 'password' ? (
                  <View style={{ width: '100%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <TextInput 
                        style={localStyles.fieldInput} 
                        value={tempPassword} 
                        onChangeText={(val) => { setTempPassword(val); setPasswordError(''); }} 
                        placeholder="New password" 
                        placeholderTextColor="#aaa" 
                        secureTextEntry 
                        autoFocus 
                      />
                      <TouchableOpacity onPress={togglePasswordEdit}>
                        <Ionicons name="save" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={localStyles.divider} />
                    
                    {/* Wrapped in a row so flex: 1 works horizontally instead of vertically collapsing */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput 
                        style={localStyles.fieldInput} 
                        value={tempConfirmPassword} 
                        onChangeText={(val) => { setTempConfirmPassword(val); setPasswordError(''); }} 
                        placeholder="Confirm password" 
                        placeholderTextColor="#aaa" 
                        secureTextEntry 
                      />
                    </View>

                    {passwordError ? (
                      <Text style={localStyles.errorText}>{passwordError}</Text>
                    ) : null}
                  </View>
                ) : (
                  <>
                    <Text style={localStyles.fieldText}>{'•'.repeat(8)}</Text>
                    <TouchableOpacity onPress={togglePasswordEdit}>
                      <Ionicons name="create-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: gameScale(20) }}>
            <TouchableOpacity style={[localStyles.modalButton, localStyles.cancelButton]} onPress={() => { onClose(); setEditingField(null); }}>
              <Text style={localStyles.buttonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[localStyles.modalButton, localStyles.confirmButton]} onPress={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? <SpriteActivityIndicator size={gameScale(25)} /> : <Text style={localStyles.buttonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: gameScale(20),
    padding: gameScale(20),
    borderWidth: gameScale(2),
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: gameScale(20),
  },
  modalAvatarOuter: {
    borderWidth: gameScale(1.5),
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: gameScale(5),
    padding: gameScale(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalAvatarInner: {
    borderWidth: gameScale(0.5),
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: gameScale(5),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalAvatarImage: {
    width: gameScale(70),
    height: gameScale(70),
    borderRadius: gameScale(5),
    resizeMode: 'cover',
  },
  avatarOption: {
    margin: gameScale(8),
    padding: gameScale(4),
    borderRadius: gameScale(10),
  },
  avatarOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#4CAF50',
    borderWidth: gameScale(2),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: gameScale(20),
  },
  modalButton: {
    flex: 1,
    padding: gameScale(12),
    borderRadius: gameScale(10),
    alignItems: 'center',
    marginHorizontal: gameScale(5),
  },
  cancelButton: { backgroundColor: '#ff4444' },
  confirmButton: { backgroundColor: '#005dc8' },
  buttonText: { color: '#fff', fontFamily: 'DynaPuff', fontSize: gameScale(14) },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: gameScale(8),
    paddingHorizontal: gameScale(12),
    borderRadius: gameScale(8),
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fieldText: { 
    color: '#fff', 
    fontSize: gameScale(14), 
    flex: 1, 
    marginRight: gameScale(8), 
    fontFamily: 'DynaPuff' 
  },
  fieldInput: { 
    color: '#fff', 
    fontSize: gameScale(14), 
    flex: 1, 
    marginRight: gameScale(8), 
    fontFamily: 'DynaPuff', 
    paddingVertical: gameScale(4) // Added padding to prevent text cutoff inside input
  },
  divider: {
    height: gameScale(1),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: gameScale(8),
    width: '100%',
  },
  errorText: {
    color: '#ff4444',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(6),
  }
});

export default EditProfile;
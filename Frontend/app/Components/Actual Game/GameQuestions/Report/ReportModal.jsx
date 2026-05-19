import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Dimensions, Modal } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const ReportModal = ({ isVisible, onClose, submitReport }) => {
  const [reportText, setReportText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState(null);

  const handleClose = () => {
    setReportText('');
    setStatusMessage(null);
    setStatusType(null);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report Challenge</Text>
          
          <TextInput
            style={[
              styles.reportInput,
              statusType === 'success' ? { display: 'none' } : {}
            ]}
            multiline
            maxLength={100}
            placeholder="What's wrong with this challenge? (Max. 100 characters)"
            placeholderTextColor="#888"
            value={reportText}
            onChangeText={(text) => {
              setReportText(text);
              if (statusType === 'error') {
                setStatusMessage(null);
                setStatusType(null);
              }
            }}
            editable={statusType !== 'success'}
          />

          {statusType !== 'success' && (
            <Text style={styles.characterCountText}>
              {reportText.length} / 100
            </Text>
          )}

          {statusMessage && (
            <Text style={[
              styles.statusMessage, 
              statusType === 'success' ? styles.successMessage : styles.errorMessage
            ]}>
              {statusMessage}
            </Text>
          )}

          <View style={styles.modalActions}>
            {statusType === 'success' ? (
              <Pressable
                onPress={handleClose}
                style={[styles.modalButton, styles.submitButton]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={handleClose}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (reportText.trim().length === 0) {
                      setStatusMessage('Report cannot be empty.');
                      setStatusType('error');
                      return;
                    }
                    if (reportText.length > 100) {
                      setStatusMessage('Report must be at most 100 characters long.');
                      setStatusType('error');
                      return;
                    }
                    
                    const res = await submitReport(reportText);
                    if (res && res.success) {
                      setStatusMessage(res.message || 'Challenge report saved successfully.');
                      setStatusType('success');
                      setReportText('');
                    } else {
                      setStatusMessage(res?.error || 'Failed to submit report.');
                      setStatusType('error');
                    }
                  }}
                  style={[
                    styles.modalButton, 
                    styles.submitButton,
                    (reportText.length === 0 || reportText.length > 100) ? { opacity: 0.5 } : {}
                  ]}
                  disabled={reportText.length === 0 || reportText.length > 100}
                >
                  <Text style={styles.modalButtonText}>Submit</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(20),
  },
  modalContent: {
    backgroundColor: '#2d2d30',
    width: '100%',
    maxWidth: gameScale(400),
    borderRadius: gameScale(12),
    padding: gameScale(20),
    elevation: gameScale(10),
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: gameScale(18),
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(15),
    textAlign: 'center',
  },
  reportInput: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    borderRadius: gameScale(8),
    padding: gameScale(15),
    minHeight: gameScale(120),
    textAlignVertical: 'top',
    fontSize: gameScale(14),
    fontFamily: 'monospace',
    borderWidth: gameScale(1),
    borderColor: '#555',
    marginBottom: gameScale(5),
  },
  characterCountText: {
    color: '#aaa',
    fontSize: gameScale(10),
    fontFamily: 'monospace',
    textAlign: 'right',
    marginBottom: gameScale(15),
  },
  statusMessage: {
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginBottom: gameScale(15),
  },
  successMessage: {
    color: '#27ca3f',
  },
  errorMessage: {
    color: '#ff5f56',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: gameScale(12),
    borderRadius: gameScale(8),
    alignItems: 'center',
    marginHorizontal: gameScale(5),
  },
  cancelButton: {
    backgroundColor: '#ff5f56',
  },
  submitButton: {
    backgroundColor: '#27ca3f',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
  },
});

export default ReportModal;

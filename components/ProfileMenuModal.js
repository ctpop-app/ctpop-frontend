import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ProfileMenuModal = ({ visible, onClose, onBlock, onReport, isBlocked }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={onBlock}
              >
                <MaterialIcons 
                  name={isBlocked ? "block-flipped" : "block"} 
                  size={24} 
                  color="#FF3B30"
                />
                <Text style={[styles.menuText, { color: '#FF3B30' }]}>
                  {isBlocked ? '차단 해제' : '차단하기'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={onReport}
              >
                <MaterialIcons name="report" size={24} color="#FF3B30" />
                <Text style={[styles.menuText, { color: '#FF3B30' }]}>
                  신고하기
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
}); 
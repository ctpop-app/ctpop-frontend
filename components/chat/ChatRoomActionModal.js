import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ChatRoomActionModal = ({ 
  visible, 
  onClose, 
  onViewProfile,
  onLeave, 
  onBlock, 
  onReport,
  isBlocked = false,
  chatRoomName = '채팅방'
}) => {
  const handleViewProfile = () => {
    onViewProfile();
    onClose();
  };

  const handleLeave = () => {
    Alert.alert(
      '대화방 나가기',
      `${chatRoomName}에서 나가시겠습니까?\n나가면 대화 내용이 모두 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '나가기', 
          style: 'destructive',
          onPress: () => {
            onLeave();
            onClose();
          }
        }
      ]
    );
  };

  const handleBlock = () => {
    const action = isBlocked ? '차단 해제' : '차단';
    const message = isBlocked 
      ? `${chatRoomName}님의 차단을 해제하시겠습니까?`
      : `${chatRoomName}님을 차단하시겠습니까?\n차단하면 더 이상 메시지를 주고받을 수 없습니다.`;

    Alert.alert(
      action,
      message,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: action, 
          style: isBlocked ? 'default' : 'destructive',
          onPress: () => {
            onBlock();
            onClose();
          }
        }
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      '신고하기',
      `${chatRoomName}님을 신고하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '신고', 
          style: 'destructive',
          onPress: () => {
            onReport();
            onClose();
          }
        }
      ]
    );
  };

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
              {/* 프로필 보기 */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleViewProfile}
              >
                <MaterialIcons 
                  name="person" 
                  size={24} 
                  color="#007AFF"
                />
                <Text style={[styles.menuText, { color: '#007AFF' }]}>
                  프로필 보기
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* 대화방 나가기 */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleLeave}
              >
                <MaterialIcons 
                  name="exit-to-app" 
                  size={24} 
                  color="#FF6B6B"
                />
                <Text style={[styles.menuText, { color: '#FF6B6B' }]}>
                  대화방 나가기
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* 차단/차단 해제 */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleBlock}
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

              {/* 신고하기 */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleReport}
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
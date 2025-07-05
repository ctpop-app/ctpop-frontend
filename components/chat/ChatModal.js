import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createChatRoom } from '../../api/chat';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

export const ChatModal = ({ visible, onClose, onConfirm, otherUser, talkData }) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleConfirm = async () => {
    console.log('=== ChatModal handleConfirm 시작 ===');
    console.log('현재 사용자:', user);
    console.log('상대방 정보:', otherUser);
    
    if (!user?.uuid || !otherUser?.uuid) {
      console.error('사용자 정보 누락:', { userUuid: user?.uuid, otherUserUuid: otherUser?.uuid });
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    setIsCreating(true);
    console.log('채팅방 생성 시작...');

    try {
      // 기존 채팅방이 있는지 확인 (선택사항)
      // 여기서는 바로 새 채팅방을 생성합니다
      
      const roomData = {
        participants: [user.uuid, otherUser.uuid]
      };

      console.log('채팅방 생성 데이터:', roomData);
      
      const result = await createChatRoom(roomData);
      console.log('채팅방 생성 결과:', result);
      
      if (!result.success) {
        throw new Error(result.error || '채팅방 생성에 실패했습니다.');
      }

      const chatRoomId = result.data.id;
      console.log('채팅방 생성 성공 - ID:', chatRoomId);

      // 채팅방 생성 성공 시 콜백 호출
      if (onConfirm) {
        console.log('onConfirm 콜백 호출:', { chatRoomId, otherUser });
        onConfirm(chatRoomId, otherUser);
      } else {
        console.warn('onConfirm 콜백이 없습니다.');
      }

    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      Alert.alert('오류', error.message || '채팅방 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
      console.log('=== ChatModal handleConfirm 종료 ===');
    }
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
              <Image
                source={
                  otherUser?.mainPhotoURL && otherUser.mainPhotoURL.startsWith('http') 
                    ? { uri: otherUser.mainPhotoURL } 
                    : require('../../assets/default-profile.png')
                }
                style={styles.profileImage}
              />
              <Text style={styles.modalTitle}>
                {otherUser?.nickname || '익명'}님과의 채팅
              </Text>
              <Text style={styles.modalDescription}>
                채팅을 시작하시겠습니까?
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isCreating}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.confirmButton, isCreating && styles.disabledButton]}
                  onPress={handleConfirm}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>채팅 시작하기</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 
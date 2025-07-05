import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';

/**
 * 제출 버튼 컴포넌트
 * @param {Object} props
 * @param {boolean} props.loading - 로딩 상태
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {Function} props.onPress - 클릭 이벤트
 * @param {string} props.text - 버튼 텍스트
 */
export const SubmitButton = ({
  loading = false,
  disabled = false,
  onPress,
  text = "토크하기"
}) => {
  const isDisabled = disabled || loading;

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          isDisabled && styles.submitButtonDisabled
        ]}
        onPress={onPress}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>{text}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ddd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
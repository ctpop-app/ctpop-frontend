import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput
} from 'react-native';
import { TALK_CONSTANTS } from '../../constants/talkConstants';

/**
 * 텍스트 입력과 글자 수 카운터 컴포넌트
 * @param {Object} props
 * @param {string} props.value - 입력 값
 * @param {Function} props.onChangeText - 텍스트 변경 함수
 * @param {number} props.maxLength - 최대 글자 수
 * @param {boolean} props.editable - 편집 가능 여부
 * @param {string} props.placeholder - 플레이스홀더
 */
export const TextInputWithCounter = ({
  value,
  onChangeText,
  maxLength = TALK_CONSTANTS.MAX_CONTENT_LENGTH,
  editable = true,
  placeholder = "무슨 생각을 하고 계신가요?"
}) => {
  const currentLength = value.length;
  const isOverLimit = currentLength > maxLength;

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, isOverLimit && styles.inputError]}
        placeholder={placeholder}
        multiline
        maxLength={maxLength}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        textAlignVertical="top"
      />
      
      <View style={styles.characterCount}>
        <Text style={[
          styles.characterCountText,
          isOverLimit && styles.characterCountError
        ]}>
          {currentLength}/{maxLength}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    flex: 1,
    textAlignVertical: 'top',
    padding: 0,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: '#666',
  },
  characterCountError: {
    color: '#FF6B6B',
  },
}); 
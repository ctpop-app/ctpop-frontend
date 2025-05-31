import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export const SaveButton = ({ 
  onPress, 
  disabled = false, 
  loading = false,
  text = '프로필 저장하기',
  loadingText = '저장중...'
}) => {
  return (
    <TouchableOpacity
      style={[styles.save, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.saveText}>
        {loading ? loadingText : text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  save: { 
    backgroundColor: '#FF6B6B',
    padding: 15, 
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10 
  },
  disabled: {
    opacity: 0.7
  },
  saveText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
}); 
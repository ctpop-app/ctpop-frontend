import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

const ServerTestButton = ({ onPress, disabled = false }) => {
  return (
    <TouchableOpacity 
      style={[styles.testButton, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.testButtonText}>서버 연결 테스트</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  testButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
});

export default ServerTestButton; 
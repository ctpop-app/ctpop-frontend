import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const LoadingFooter = ({ loadingMore }) => {
  if (!loadingMore) return null;
  
  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator color="#FF6B6B" />
      <Text style={styles.loadingText}>더 많은 토크를 불러오는 중...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingFooter: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default LoadingFooter; 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyState = ({ showMyTalk }) => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {showMyTalk ? '내 토크가 없습니다.' : '아직 토크가 없습니다.'}
      </Text>
      <Text style={styles.emptySubText}>
        {showMyTalk ? '첫 번째 토크를 작성해보세요!' : '첫 번째 토크를 작성해보세요!'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default EmptyState; 
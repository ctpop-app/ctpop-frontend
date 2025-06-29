import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BoardHeader({ onFilterPress }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>토크</Text>
      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <Text style={styles.filterButtonText}>필터</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
}); 
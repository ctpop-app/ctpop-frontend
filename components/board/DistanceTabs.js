import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DISTANCE_TABS = [
  { id: 'all', label: '전체' },
  { id: '50km', label: '동네' },
  { id: '30km', label: '주변' },
  { id: '10km', label: '근처' }
];

export default function DistanceTabs({ showMyTalk, onMyTalkToggle }) {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {DISTANCE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => {}} // 임시로 비활성화
            >
              <Text style={styles.tabText}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.myTalkButton, showMyTalk && styles.myTalkButtonActive]}
          onPress={onMyTalkToggle}
        >
          <Ionicons 
            name="person-outline" 
            size={16} 
            color={showMyTalk ? '#fff' : '#FF6B6B'} 
          />
          <Text style={[styles.myTalkButtonText, showMyTalk && styles.myTalkButtonTextActive]}>
            내 토크
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    flex: 1,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  myTalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  myTalkButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  myTalkButtonText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '600',
  },
  myTalkButtonTextActive: {
    color: '#fff',
  },
}); 
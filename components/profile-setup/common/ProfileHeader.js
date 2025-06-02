import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

export const ProfileHeader = ({ 
  title = '프로필 설정',
  subtitle = '프로필을 완성하여 매칭을 시작하세요'
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    zIndex: 1000,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  }
}); 
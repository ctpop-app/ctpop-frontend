import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const ProfileHeader = ({ 
  title = '프로필 설정',
  subtitle = '프로필을 완성하여 매칭을 시작하세요',
  photoTitle = '프로필 사진 (최대 6장)',
  instruction = '사진을 탭해서 추가하세요'
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.photoTitle}>{photoTitle}</Text>
      <Text style={styles.instruction}>{instruction}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { 
    padding: 20, 
    paddingTop: 60, 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FF6B6B', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 20 
  },
  photoTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 5 
  },
  instruction: { 
    fontSize: 12, 
    color: '#FF6B6B', 
    marginBottom: 15 
  }
}); 
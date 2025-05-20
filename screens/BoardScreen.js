// BoardScreen.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BoardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>게시판 화면</Text>
      <Text style={styles.subtitle}>다양한 게시물을 볼 수 있는 곳입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 
// HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const dummyUsers = [
  {
    id: '1',
    name: '김민준',
    age: 28,
    location: '서울',
    profilePhotoURL: null,
    bio: '커뮤니티에서 만나게 되어 반갑습니다.',
  },
  {
    id: '2',
    name: '이서연',
    age: 24,
    location: '부산',
    profilePhotoURL: null,
    bio: '친구를 만들고 싶어요.',
  },
  {
    id: '3',
    name: '박지훈',
    age: 30,
    location: '대구',
    profilePhotoURL: null,
    bio: '취미는 영화 감상과 여행입니다.',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  const renderUserCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // 프로필 상세 페이지로 이동 (구현 예정)
        console.log(`사용자 ${item.id} 프로필 보기`);
      }}
    >
      <Image 
        style={styles.profilePhoto}
        source={item.profilePhotoURL ? { uri: item.profilePhotoURL } : require('../assets/default-profile.png')}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}, {item.age}</Text>
        <Text style={styles.userLocation}>{item.location}</Text>
        <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CTpop</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>필터</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={dummyUsers}
        renderItem={renderUserCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
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
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
}); 
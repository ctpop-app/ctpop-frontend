import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useProfile } from '../hooks/useProfile';
import { useDummyProfile } from '../hooks/useDummyProfile';

// 간단한 랜덤 문자열 생성 함수
const generateRandomId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `superpass-${timestamp}-${random}`;
};

export default function ProfileTestScreen() {
  const { getAll } = useProfile();
  const { create: createDummyProfile, update: updateDummyProfile } = useDummyProfile();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState('10');
  const [refreshing, setRefreshing] = useState(false);

  // 프로필 목록 로드
  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await getAll();
      setProfiles(data);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      Alert.alert('오류', '프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 컴포넌트 마운트 시 프로필 로드
  useEffect(() => {
    loadProfiles();
  }, []);

  // 더미 프로필 생성
  const generateDummyProfiles = async () => {
    const numProfiles = parseInt(count, 10);
    if (isNaN(numProfiles) || numProfiles <= 0 || numProfiles > 50) {
      Alert.alert('입력 오류', '1~50 사이의 숫자를 입력해주세요.');
      return;
    }

    setGenerating(true);
    try {
      const dummyProfiles = Array(numProfiles).fill().map(() => ({
        uuid: generateRandomId(),
        nickname: `테스트${Math.floor(Math.random() * 1000)}`,
        age: Math.floor(Math.random() * 20) + 20, // 20-40세
        height: Math.floor(Math.random() * 30) + 160, // 160-190cm
        weight: Math.floor(Math.random() * 20) + 50, // 50-70kg
        orientation: ['트젠', '시디', '러버', '기타'][Math.floor(Math.random() * 4)],
        city: ['서울', '부산', '인천', '대구', '광주'][Math.floor(Math.random() * 5)],
        district: ['강남구', '서초구', '송파구', '마포구', '용산구'][Math.floor(Math.random() * 5)],
        bio: '안녕하세요! 반갑습니다.',
        isActive: true,
        lastActive: new Date(),
        mainPhotoURL: 'https://picsum.photos/200',
        photoURLs: ['https://picsum.photos/200', 'https://picsum.photos/200'],
        blockedUuid: []
      }));

      for (const profile of dummyProfiles) {
        await createDummyProfile(profile);
      }

      Alert.alert('성공', `${numProfiles}개의 더미 프로필이 생성되었습니다.`);
      loadProfiles(); // 목록 새로고침
    } catch (error) {
      console.error('더미 프로필 생성 실패:', error);
      Alert.alert('오류', '더미 프로필을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  // 프로필 삭제 (비활성화)
  const deleteProfile = async (uuid) => {
    try {
      await updateDummyProfile(uuid);
      Alert.alert('성공', '프로필이 삭제되었습니다.');
      loadProfiles(); // 목록 새로고침
    } catch (error) {
      console.error('프로필 삭제 실패:', error);
      Alert.alert('오류', '프로필을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 프로필 확인 후 삭제
  const confirmDeleteProfile = (profile) => {
    Alert.alert(
      '프로필 삭제',
      `정말 "${profile.nickname}" 프로필을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => deleteProfile(profile.uuid) }
      ]
    );
  };

  // 프로필 카드 렌더링
  const renderProfileCard = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.mainPhotoURL }}
        style={styles.profileImage}
        defaultSource={require('../assets/default-profile.png')}
      />
      
      <View style={styles.profileInfo}>
        <Text style={styles.name}>{item.nickname}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.details}>
            {item.age}세 • {item.height}cm • {item.weight}kg
          </Text>
        </View>
        <Text style={styles.location}>{item.city} {item.district}</Text>
        <Text style={styles.preference}>{item.orientation}</Text>
        <Text style={styles.bio} numberOfLines={1} ellipsizeMode="tail">{item.bio}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDeleteProfile(item)}
      >
        <Text style={styles.deleteButtonText}>삭제</Text>
      </TouchableOpacity>
    </View>
  );

  // 로딩 인디케이터
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>프로필 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필 테스트</Text>
        <Text style={styles.headerSubtitle}>
          총 {profiles.length}개의 프로필
        </Text>
      </View>
      
      <View style={styles.generateContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>생성할 프로필 수:</Text>
          <TextInput
            style={styles.input}
            value={count}
            onChangeText={setCount}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.disabledButton]}
          onPress={generateDummyProfiles}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>더미 프로필 생성</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={profiles}
        renderItem={renderProfileCard}
        keyExtractor={item => item.uuid}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadProfiles();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>프로필이 없습니다.</Text>
            <Text style={styles.emptySubText}>위의 버튼을 눌러 더미 프로필을 생성해보세요.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#FF6B6B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  generateContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 50,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#4a6fa5',
    marginBottom: 4,
  },
  preference: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#444',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 
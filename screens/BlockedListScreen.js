import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';
import { useBlock } from '../hooks/useBlock';

export default function BlockedListScreen() {
  const navigation = useNavigation();
  const { userProfile, setUserProfile } = useUserStore();
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { unblockUser } = useBlock();

  useEffect(() => {
    const loadBlockedProfiles = async () => {
      setLoading(true);
      try {
        const blockedUuids = userProfile?.blockedUuid || [];
        if (blockedUuids.length === 0) {
          setBlockedProfiles([]);
        } else {
          // 여러 uuid로 프로필 정보 가져오기
          const profiles = await Promise.all(
            blockedUuids.map(uuid => profileService.getProfile(uuid))
          );
          setBlockedProfiles(profiles.filter(Boolean));
        }
      } catch (err) {
        setBlockedProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    loadBlockedProfiles();
  }, [userProfile]);

  const handleUnblock = async (blockedUuid) => {
    try {
      await unblockUser(blockedUuid);
      // 내 프로필을 새로고침해서 상태 갱신
      if (userProfile?.uuid) {
        const updatedProfile = await profileService.getProfile(userProfile.uuid);
        setUserProfile(updatedProfile);
      }
      Alert.alert('알림', '차단을 해제했습니다.');
    } catch (err) {
      Alert.alert('오류', err.message || '차단 해제에 실패했습니다.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        style={styles.profilePhoto}
        source={item.mainPhotoURL ? { uri: item.mainPhotoURL } : require('../assets/default-profile.png')}
      />
      <View style={styles.info}>
        <Text style={styles.nickname}>{item.nickname}</Text>
        <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.uuid)}
      >
        <Text style={styles.unblockButtonText}>차단 해제</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>차단한 사용자 목록</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : blockedProfiles.length === 0 ? (
        <Text style={styles.emptyText}>차단한 사용자가 없습니다.</Text>
      ) : (
        <FlatList
          data={blockedProfiles}
          renderItem={renderItem}
          keyExtractor={item => item.uuid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    marginTop: 40,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  unblockButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  unblockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 
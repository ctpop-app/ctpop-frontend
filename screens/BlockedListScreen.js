import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlock } from '../hooks/useBlock';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';

export default function BlockedListScreen() {
  const navigation = useNavigation();
  const { userProfile } = useUserStore();
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
      // 차단 해제 후 userProfile이 자동으로 업데이트되므로 별도의 새로고침이 필요 없음
    } catch (err) {
      // 에러 처리는 useBlock 훅에서 이미 하고 있으므로 여기서는 추가 처리가 필요 없음
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
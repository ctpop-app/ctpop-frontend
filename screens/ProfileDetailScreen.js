import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getLastActiveText } from '../utils/dateUtils';
import { getOrientationColor } from '../utils/colors';

const { width } = Dimensions.get('window');

export default function ProfileDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { profile } = route.params;
  const { isUserOnline } = useOnlineStatus();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 프로필 이미지 배열 생성 (메인 사진 + 추가 사진들)
  const images = [
    profile.mainPhotoURL,
    ...(profile.photoURLs || []).filter(url => url !== profile.mainPhotoURL)
  ].filter(url => url); // null이나 undefined 제거

  // 이미지가 없을 경우 기본 이미지 사용
  if (images.length === 0) {
    images.push(require('../assets/default-profile.png'));
  }

  const renderImage = ({ item }) => (
    <Image
      source={typeof item === 'string' ? { uri: item } : item}
      style={styles.mainImage}
      resizeMode="cover"
    />
  );

  const renderPagination = () => {
    if (images.length <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationWrapper}>
          <Text style={styles.paginationText}>
            {currentImageIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 이미지 섹션 */}
      <View style={styles.imageSection}>
        <FlatList
          data={images}
          renderItem={renderImage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
          keyExtractor={(_, index) => index.toString()}
          style={styles.imageList}
          contentContainerStyle={styles.imageListContent}
        />
        {renderPagination()}
      </View>

      {/* 기본 정보 섹션 */}
      <View style={styles.infoSection}>
        <View style={styles.nameAgeContainer}>
          <Text style={styles.name}>{profile.nickname}</Text>
          {profile.age && <Text style={styles.age}>{profile.age}세</Text>}
          <View style={styles.statusContainer}>
            {isUserOnline(profile.uuid) ? (
              <>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>접속중</Text>
              </>
            ) : (
              <Text style={styles.lastActiveText}>
                {getLastActiveText(profile.lastActive)}
              </Text>
            )}
          </View>
        </View>

        {/* 기본 정보 */}
        <View style={styles.infoRow}>
          <View style={[styles.orientationBadge, { backgroundColor: getOrientationColor(profile.orientation) }]}>
            <Text style={styles.orientationText}>{profile.orientation || '미입력'}</Text>
          </View>
          <Text style={styles.userInfo}>
            {profile.height && `${profile.height}cm`}
            {profile.weight && ` ${profile.weight}kg`}
            {(profile.height || profile.weight) && (profile.city || profile.district) ? ' · ' : ''}
            {profile.city && `${profile.city} ${profile.district || ''}`}
          </Text>
        </View>

        {/* 자기소개 */}
        <View style={styles.bioSection}>
          <Text style={styles.bioTitle}>자기소개</Text>
          <Text style={styles.bioText}>{profile.bio || '자기소개가 없습니다.'}</Text>
        </View>

        {/* 관심사 */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsSection}>
            <Text style={styles.interestsTitle}>관심사</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageButtonText}>메시지 보내기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageSection: {
    width: width,
    height: width,
    position: 'relative',
  },
  imageList: {
    width: width,
    height: width,
  },
  imageListContent: {
    flexGrow: 1,
  },
  mainImage: {
    width: width,
    height: width,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  paginationWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paginationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  age: {
    fontSize: 22,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  lastActiveText: {
    color: '#999',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orientationBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 12,
  },
  orientationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  bioSection: {
    marginBottom: 24,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  interestsSection: {
    marginBottom: 24,
  },
  interestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#666',
    fontSize: 14,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
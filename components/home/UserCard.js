import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getLastActiveText } from '../../utils/dateUtils';
import { getOrientationColor } from '../../utils/colors';

const UserCard = ({ item, onPress, isUserOnline }) => {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        style={styles.profilePhoto}
        source={item.mainPhotoURL ? { uri: item.mainPhotoURL } : require('../../assets/default-profile.png')}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameAgeContainer}>
          <Text style={styles.userName}>{item.nickname}</Text>
          {item.age && <Text style={styles.userAge}>{item.age}세</Text>}
          <View style={styles.statusContainer}>
            {isUserOnline(item.uuid) ? (
              <>
                <View style={[styles.onlineDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.onlineText, { color: '#4CAF50' }]}>접속중</Text>
              </>
            ) : (
              <Text style={styles.lastActiveText}>{getLastActiveText(item.lastActive)}</Text>
            )}
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.orientationBadge, { backgroundColor: getOrientationColor(item.orientation) }]}>
            <Text style={styles.orientationText}>{item.orientation || '미입력'}</Text>
          </View>
          <Text style={styles.userInfoText}>
            {item.height && `${item.height}cm`}
            {item.weight && ` ${item.weight}kg`}
            {(item.height || item.weight) && (item.city || item.district) ? ' · ' : ''}
            {item.city && `${item.city} ${item.district || ''}`}
          </Text>
        </View>
        <Text style={styles.userBio} numberOfLines={1} ellipsizeMode="tail">{item.bio || ''}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 24,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  userAge: {
    fontSize: 15,
    color: '#666',
  },
  userLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  userBio: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 13,
    color: '#4CAF50',
  },
  lastActiveText: {
    fontSize: 13,
    color: '#999',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orientationBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  orientationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfoText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
});

export default UserCard; 
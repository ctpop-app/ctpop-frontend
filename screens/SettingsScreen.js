import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import userStore from '../store/userStore';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../navigation/constants';
import { CommonActions } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile, setUserProfile } = userStore();
  const { handleLogout, loadUserProfile, handleEditProfile, handleWithdraw } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const onEditProfile = () => {
    const serializedProfile = handleEditProfile();
    if (serializedProfile) {
      navigation.navigate(ROUTES.PROFILE.EDIT, { 
        currentProfile: serializedProfile,
        isEdit: true 
      });
    }
  };

  const logout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('로그아웃 시작');
              const result = await handleLogout();
              console.log('handleLogout 결과:', result);
              if (!result) {
                Alert.alert('오류', '로그아웃에 실패했습니다.');
              }
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const onWithdraw = async () => {
    if (!user?.uuid) return;

    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await handleWithdraw();
              if (success) {
                // 로그인 화면으로 이동
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: ROUTES.AUTH.LOGIN
                      }
                    ]
                  })
                );
              }
            } catch (error) {
              Alert.alert('오류', '회원 탈퇴 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (icon, title, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={24} color="#555" style={styles.itemIcon} />
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d9d9d9', true: '#FF6B6B' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderLinkItem = (icon, title, onPress) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={24} color="#555" style={styles.itemIcon} />
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#aaa" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <ScrollView style={styles.settingsContainer}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <Image
            source={userProfile?.mainPhotoURL ? { uri: userProfile.mainPhotoURL } : require('../assets/default-profile.png')}
            style={styles.profilePhoto}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.nickname || '사용자'}</Text>
            <Text style={styles.profileEmail}>{userProfile?.location || '위치 미설정'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
            <Ionicons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* 알림 설정 */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          {renderSettingItem(
            'notifications-outline',
            '앱 알림',
            true,
            () => {}
          )}
          {renderSettingItem(
            'location-outline',
            '위치 서비스',
            true,
            () => {}
          )}
        </View>

        {/* 일반 설정 */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>일반 설정</Text>
          {renderSettingItem(
            'moon-outline',
            '다크 모드',
            false,
            () => {}
          )}
          {renderLinkItem('globe-outline', '언어 설정', () => Alert.alert('준비중', '곧 서비스될 예정입니다.'))}
          {renderLinkItem('lock-closed-outline', '개인정보 설정', () => Alert.alert('준비중', '곧 서비스될 예정입니다.'))}
        </View>

        {/* 지원 및 정보 */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>지원 및 정보</Text>
          {renderLinkItem('help-circle-outline', '도움말', () => Alert.alert('준비중', '곧 서비스될 예정입니다.'))}
          {renderLinkItem('information-circle-outline', '이용약관', () => Alert.alert('준비중', '곧 서비스될 예정입니다.'))}
          {renderLinkItem('shield-outline', '개인정보 처리방침', () => Alert.alert('준비중', '곧 서비스될 예정입니다.'))}
        </View>

        {/* 개발자 옵션 */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>개발자 옵션</Text>
          {renderLinkItem('people-outline', '프로필 테스트', () => navigation.navigate(ROUTES.MAIN.PROFILE_TEST))}
        </View>

        {/* 로그아웃 및 회원탈퇴 */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
          <TouchableOpacity style={styles.withdrawButton} onPress={onWithdraw}>
            <Text style={styles.withdrawalText}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>버전 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
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
  settingsContainer: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profilePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#FF6B6B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  withdrawButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  withdrawalText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
  },
}); 

export default SettingsScreen; 
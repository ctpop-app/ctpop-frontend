import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as authApi from '../api/auth';
import { testNetworkConnection } from '../api/client';
import useUserStore from '../store/userStore';
import config from '../utils/config';
import { discoverServer, resetServerIp } from '../utils/discovery';
import { updateApiUrl } from '../utils/config';
import { profileService } from '../services/profileService';

export default function JwtPhoneLoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState(null);
  const { setUser } = useUserStore();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authApi.isAuthenticated();
        if (authenticated) {
          // Navigate to home if already logged in
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
  }, [navigation]);

  // 네트워크 연결 테스트
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // 서버 재검색 실행
      const apiUrl = await discoverServer();
      
      if (apiUrl) {
        // 발견된 서버로 API URL 업데이트
        updateApiUrl(apiUrl);
        
        // API URL이 제대로 적용되었는지 테스트
        setTimeout(async () => {
          const networkTest = await testNetworkConnection();
          if (networkTest.connected) {
            setNetworkStatus({ connected: true });
            Alert.alert(
              '연결 성공', 
              `서버와 연결되었습니다.\n발견된 서버: ${apiUrl}\n현재 baseURL: ${config.API_URL}`
            );
          } else {
            setNetworkStatus({ connected: false, error: networkTest.error });
            Alert.alert('연결 실패', `서버는 발견되었으나 API 연결에 실패했습니다: ${networkTest.error}`);
          }
        }, 500); // API Client가 업데이트될 시간을 주기 위해 약간의 딜레이 추가
      } else {
        setNetworkStatus({ connected: false, error: '서버를 찾을 수 없습니다.' });
        
        Alert.alert(
          '연결 실패', 
          `서버를 찾을 수 없습니다. 현재 API URL: ${config.API_URL}\n\n서버 설정을 초기화하려면 다시 테스트하세요.`,
          [
            { 
              text: '취소', 
              style: 'cancel' 
            },
            { 
              text: '설정 초기화', 
              onPress: async () => {
                await resetServerIp();
                Alert.alert('알림', '서버 설정이 초기화되었습니다. 다시 테스트해보세요.');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('오류', '연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    // Basic validation
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      Alert.alert('알림', '올바른 전화번호를 입력해주세요. (예: +821012345678)');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.sendOtp(phoneNumber.trim());
      if (response.success) {
        setOtpSent(true);
        Alert.alert('알림', '인증번호가 전송되었습니다. SMS를 확인해주세요.');
      } else {
        Alert.alert('오류', response.message || '인증번호 전송에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', error.message || '서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    // Basic validation
    if (!verificationCode || verificationCode.trim().length < 4) {
      Alert.alert('알림', '올바른 인증번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyOtp(phoneNumber.trim(), verificationCode.trim());
      
      if (result.success) {
        // Set the user in the store with a dummy user object
        // In a real app, you'd fetch user details from your backend
        const userInfo = { 
          uid: phoneNumber, 
          phoneNumber: phoneNumber 
        };
        setUser(userInfo);
        
        // Firestore에서 사용자 프로필이 존재하는지 확인
        const profileCheck = await profileService.checkProfileExists(phoneNumber);
        
        if (profileCheck.success) {
          if (profileCheck.exists) {
            // 프로필이 존재하면 메인으로 이동
            console.log('기존 프로필이 있어 메인 화면으로 이동합니다.');
            
            // 프로필 데이터를 저장
            useUserStore.getState().updateUserProfile(phoneNumber, profileCheck.data);
            
            // 메인 화면으로 바로 이동하지 않고 App.js에서 처리하도록 함
            Alert.alert('로그인 성공', '인증이 완료되었습니다.', [
              {
                text: '확인',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }], // Login으로 돌아가면 useEffect에서 인증 체크가 다시 실행됨
                  });
                }
              }
            ]);
          } else {
            // 프로필이 없으면 프로필 설정 페이지로 이동
            console.log('프로필이 없어 프로필 설정 페이지로 이동합니다.');
            Alert.alert('회원가입', '프로필을 설정해주세요.', [
              {
                text: '확인',
                onPress: () => {
                  navigation.navigate('ProfileSetup', { phoneNumber });
                }
              }
            ]);
          }
        } else {
          // 프로필 확인 중 오류 발생
          console.error('프로필 확인 중 오류:', profileCheck.error);
          Alert.alert('오류', `프로필 확인 중 오류가 발생했습니다: ${profileCheck.error}`, [
            {
              text: '확인',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]);
        }
      } else {
        Alert.alert('인증 실패', result.message || '인증번호가 올바르지 않습니다.');
      }
    } catch (error) {
      Alert.alert('오류', error.message || '인증 과정에서 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CTpop</Text>
        <Text style={styles.subtitle}>성소수자를 위한 매칭 및 커뮤니티</Text>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>CTpop</Text>
        <Text style={styles.subtitle}>성소수자를 위한 매칭 및 커뮤니티</Text>

        <View style={styles.formContainer}>
          {/* 네트워크 연결 테스트 버튼 */}
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestConnection}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>서버 연결 테스트</Text>
          </TouchableOpacity>

          <Text style={styles.label}>📱 전화번호</Text>
          <TextInput
            placeholder="01012345678"
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
            value={phoneNumber}
            editable={!otpSent || loading}
          />

          {!otpSent ? (
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>인증번호 보내기</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.label}>🔑 인증번호 입력</Text>
              <TextInput
                placeholder="인증번호 6자리"
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                style={styles.input}
                value={verificationCode}
                editable={!loading}
              />
              <TouchableOpacity 
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>로그인 완료</Text>
                )}
              </TouchableOpacity>
              
              {otpSent && (
                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={() => {
                    setOtpSent(false);
                    setVerificationCode('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>
                    번호 다시 입력하기
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  resendButton: {
    padding: 10,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  testButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
  },
}); 
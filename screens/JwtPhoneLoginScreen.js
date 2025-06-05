import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import PhoneInput from '../components/auth/PhoneInput';
import OtpInput from '../components/auth/OtpInput';
import AuthButton from '../components/auth/AuthButton';
import ServerTestButton from '../components/auth/ServerTestButton';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../navigation/constants';
import { refreshAccessToken } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import * as authApi from '../api/auth';

export default function JwtPhoneLoginScreen() {
  const navigation = useNavigation();
  const {
    isLoading,
    error,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    otpSent,
    setOtpSent,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    checkAuth,
    authState,
    handleTestConnection,
    setUser,
    storeTokens,
    clearTokens,
  } = useAuth();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        console.log('초기 인증 상태 확인:', isAuthenticated, authState);
        if (isAuthenticated && authState.hasProfile) {
          navigation.reset({
            index: 0,
            routes: [{ name: ROUTES.MAIN.MAIN_TABS }]
          });
        }
      } catch (error) {
        console.error('초기 인증 확인 중 오류:', error);
      }
    };
    checkInitialAuth();
  }, []);

  // 인증번호 전송
  const handleSendOtpPress = async () => {
    const success = await handleSendOtp();
    if (success) {
      setOtpSent(true);
    }
  };

  // 인증번호 확인
  const handleOtpVerification = async () => {
    const result = await handleVerifyOtp();
    if (result.success) {
      // 토큰이 있으면 인증 성공으로 간주
      if (result.data.accessToken) {
        // 1. 토큰 저장
        await storeTokens(result.data.accessToken, result.data.refreshToken);
        
        // 2. 사용자 정보 생성 (UUID만 사용)
        const user = {
          uuid: result.data.uuid,
          createdAt: new Date().toISOString()
        };
        
        // 3. 사용자 정보 저장
        await authApi.storeUser(user);
        
        // 4. 서버에 인증 상태 확인
        const isAuth = await authApi.isAuthenticated();
        if (isAuth) {
          setUser(user);
          // 프로필 설정 화면으로 이동 (UUID 전달)
          navigation.replace(ROUTES.AUTH.PROFILE_SETUP, { uuid: user.uuid });
          return true;
        } else {
          // 인증 실패 시 토큰 삭제
          await clearTokens();
          Alert.alert('오류', '인증 상태 확인에 실패했습니다.');
          return false;
        }
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CTpop</Text>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <Text style={styles.title}>CTpop</Text>

        <View style={styles.formContainer}>
          <ServerTestButton 
            onPress={handleTestConnection}
            disabled={isLoading}
          />

          <PhoneInput
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            disabled={otpSent || isLoading}
          />

          {!otpSent ? (
            <AuthButton
              onPress={handleSendOtpPress}
              loading={isLoading}
              text="인증번호 보내기"
            />
          ) : (
            <>
              <OtpInput
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                disabled={isLoading}
              />
              <AuthButton
                onPress={handleOtpVerification}
                loading={isLoading}
                text="로그인 완료"
              />
              
              {otpSent && (
                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={isLoading}
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
  resendButton: {
    padding: 10,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#FF6B6B',
  },
}); 
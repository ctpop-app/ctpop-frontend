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
} from 'react-native';
import PhoneInput from '../components/auth/PhoneInput';
import OtpInput from '../components/auth/OtpInput';
import AuthButton from '../components/auth/AuthButton';
import ServerTestButton from '../components/auth/ServerTestButton';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/authService';
import useUserStore from '../store/userStore';

export default function JwtPhoneLoginScreen() {
  const {
    isLoading,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    otpSent,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleTestConnection,
    handleSuperPass,
  } = useAuth();

  const { setUser } = useUserStore();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const result = await authService.validateAndRefreshToken();
        
        if (result.success) {
          // 토큰이 유효하고 갱신된 경우
          const user = await authService.getStoredUser();
          if (user) {
            setUser(user);
            // 네비게이션 제거 - 상태 변경만으로 App.js가 자동으로 화면 전환
          }
        } else if (result.shouldLogout) {
          // 토큰이 유효하지 않거나 만료된 경우
          await authService.logout();
        }
      } catch (error) {
        console.error('초기 인증 확인 실패:', error);
        // 에러 발생 시 로그아웃 처리
        await authService.logout();
      }
    };

    checkInitialAuth();
  }, []);

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

          <TouchableOpacity 
            style={styles.superPassButton}
            onPress={handleSuperPass}
            disabled={isLoading}
          >
            <Text style={styles.superPassButtonText}>
              슈퍼패스 (개발용)
            </Text>
          </TouchableOpacity>

          <PhoneInput
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            disabled={otpSent || isLoading}
          />

          {!otpSent ? (
            <AuthButton
              onPress={handleSendOtp}
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
                onPress={handleVerifyOtp}
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resendButton: {
    marginTop: 15,
    padding: 10,
  },
  resendButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  superPassButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  superPassButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
}); 
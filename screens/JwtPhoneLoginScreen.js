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
import { useNavigation } from '@react-navigation/native';
import PhoneInput from '../components/auth/PhoneInput';
import OtpInput from '../components/auth/OtpInput';
import AuthButton from '../components/auth/AuthButton';
import ServerTestButton from '../components/auth/ServerTestButton';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, navigationUtils } from '../navigation/constants';

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
    isAuthenticated,
    hasProfile,
    handleTestConnection,
  } = useAuth();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const isAuth = await checkAuth();
        if (isAuth && hasProfile) {
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
  }, [checkAuth, hasProfile, navigation]);

  // 인증번호 전송
  const handleSendOtpPress = async () => {
    const success = await handleSendOtp();
    if (success) {
      Alert.alert('성공', '인증번호가 전송되었습니다.');
    } else if (error) {
      Alert.alert('오류', error);
    }
  };

  // 인증번호 확인
  const handleOtpVerification = async () => {
    const result = await handleVerifyOtp();
    if (result.success) {
      Alert.alert('성공', '인증되었습니다.');
      // 네비게이션 제거 - 상태 변경만으로 App.js가 자동으로 화면 전환
    } else if (error) {
      Alert.alert('오류', error);
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
}); 
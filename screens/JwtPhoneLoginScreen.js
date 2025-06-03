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
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    checkAuth,
    authState,
    handleTestConnection
  } = useAuth();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkInitialAuth = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated && authState.hasProfile) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: ROUTES.MAIN.STACK,
                state: {
                  routes: [
                    {
                      name: ROUTES.MAIN.HOME
                    }
                  ]
                }
              }
            ]
          })
        );
      }
    };
    checkInitialAuth();
  }, []);

  // 인증 상태 변경 감지
  useEffect(() => {
    if (authState.isAuthenticated && authState.hasProfile) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: ROUTES.MAIN.STACK,
              state: {
                routes: [
                  {
                    name: ROUTES.MAIN.HOME
                  }
                ]
              }
            }
          ]
        })
      );
    }
  }, [authState.isAuthenticated, authState.hasProfile, navigation]);

  // 인증번호 전송
  const handleSendOtpPress = async () => {
    const success = await handleSendOtp();
    if (success) {
      setOtpSent(true);
    }
  };

  // 인증번호 확인
  const handleOtpVerification = async () => {
    const success = await handleVerifyOtp();
    if (success) {
      if (authState.hasProfile) {
        navigation.replace(ROUTES.MAIN.STACK);
      } else {
        navigation.replace(ROUTES.AUTH.PROFILE_SETUP, { phone: phoneNumber });
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
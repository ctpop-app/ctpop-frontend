import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const OtpInput = ({ verificationCode, setVerificationCode, disabled }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>인증번호</Text>
      <TextInput
        style={styles.input}
        value={verificationCode}
        onChangeText={setVerificationCode}
        placeholder="인증번호 6자리"
        keyboardType="number-pad"
        maxLength={6}
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});

export default OtpInput; 
import React from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';

const PhoneInput = ({ 
  phoneNumber, 
  setPhoneNumber, 
  disabled = false 
}) => {
  return (
    <View>
      <Text style={styles.label}>📱 전화번호</Text>
      <TextInput
        placeholder="01012345678"
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        style={styles.input}
        value={phoneNumber}
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default PhoneInput; 
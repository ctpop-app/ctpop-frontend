import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export const FormInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style
}) => {
  return (
    <TextInput
      style={[
        styles.input,
        multiline && styles.multilineInput,
        style
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top'
  }
}); 
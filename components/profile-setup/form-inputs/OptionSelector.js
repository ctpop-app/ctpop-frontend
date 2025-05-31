import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export const OptionSelector = ({ 
  label, 
  options, 
  selectedValue, 
  onSelect 
}) => {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              selectedValue === option && styles.selectedOption
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.optionText,
              selectedValue === option && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333'
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  option: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10
  },
  selectedOption: {
    backgroundColor: '#FF6B6B'
  },
  optionText: {
    color: '#444',
    fontSize: 14
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500'
  }
}); 
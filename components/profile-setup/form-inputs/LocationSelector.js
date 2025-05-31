import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, LOCATION_DATA } from '../constants';

export const LocationSelector = ({ 
  selectedCity, 
  selectedDistrict, 
  onCitySelect, 
  onDistrictSelect 
}) => {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    // 도시 목록 설정
    setCities(Object.keys(LOCATION_DATA));
  }, []);

  useEffect(() => {
    // 선택된 도시에 따른 구/군 목록 설정
    if (selectedCity) {
      setDistricts(LOCATION_DATA[selectedCity]);
    } else {
      setDistricts([]);
    }
  }, [selectedCity]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>위치</Text>
      
      {/* 도시 선택 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.cityScroll}
      >
        {cities.map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.cityButton,
              selectedCity === city && styles.selectedButton
            ]}
            onPress={() => {
              onCitySelect(city);
              onDistrictSelect(''); // 도시가 변경되면 구/군 선택 초기화
            }}
          >
            <Text style={[
              styles.buttonText,
              selectedCity === city && styles.selectedButtonText
            ]}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 구/군 선택 */}
      {selectedCity && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.districtScroll}
        >
          {districts.map((district) => (
            <TouchableOpacity
              key={district}
              style={[
                styles.districtButton,
                selectedDistrict === district && styles.selectedButton
              ]}
              onPress={() => onDistrictSelect(district)}
            >
              <Text style={[
                styles.buttonText,
                selectedDistrict === district && styles.selectedButtonText
              ]}>
                {district}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  cityScroll: {
    marginBottom: SPACING.sm,
  },
  districtScroll: {
    marginBottom: SPACING.sm,
  },
  cityButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    marginRight: SPACING.sm,
  },
  districtButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    marginRight: SPACING.sm,
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
  },
  selectedButtonText: {
    color: COLORS.text.light,
  },
}); 
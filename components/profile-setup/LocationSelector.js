import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getLocations } from '../../services/locationService';

export const LocationSelector = ({ value, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedDong, setSelectedDong] = useState(null);
  const [step, setStep] = useState('city'); // 'city', 'district', 'dong'

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedDistrict(null);
    setSelectedDong(null);
    setStep('district');
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setSelectedDong(null);
    setStep('dong');
  };

  const handleDongSelect = (dong) => {
    setSelectedDong(dong);
    const fullLocation = `${selectedCity.name} ${district.name} ${dong.name}`;
    onChange(fullLocation);
    setModalVisible(false);
    setStep('city');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        if (step === 'city') handleCitySelect(item);
        else if (step === 'district') handleDistrictSelect(item);
        else if (step === 'dong') handleDongSelect(item);
      }}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    if (step === 'city') return locations;
    if (step === 'district') return selectedCity?.districts || [];
    if (step === 'dong') return selectedDistrict?.dongs || [];
    return [];
  };

  const getHeaderTitle = () => {
    if (step === 'city') return '시/도 선택';
    if (step === 'district') return `${selectedCity?.name} 구/군 선택`;
    if (step === 'dong') return `${selectedDistrict?.name} 동/읍/면 선택`;
    return '';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>
          {value || '위치 선택'}
        </Text>
        <MaterialIcons name="location-on" size={24} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (step === 'district') {
                    setStep('city');
                    setSelectedDistrict(null);
                  } else if (step === 'dong') {
                    setStep('district');
                    setSelectedDong(null);
                  } else {
                    setModalVisible(false);
                  }
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{getHeaderTitle()}</Text>
              <View style={{ width: 24 }} />
            </View>

            <FlatList
              data={getCurrentData()}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
}); 
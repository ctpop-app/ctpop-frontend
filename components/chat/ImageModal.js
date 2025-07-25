import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  StatusBar,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageModal = ({ visible, imageUri, onClose }) => {
  const [zoomScale, setZoomScale] = useState(1);

  const handleZoomIn = () => {
    console.log('🔍 [DEBUG] 줌인 버튼 클릭');
    setZoomScale(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    console.log('🔍 [DEBUG] 줌아웃 버튼 클릭');
    setZoomScale(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleReset = () => {
    console.log('🔄 [DEBUG] 리셋 버튼 클릭');
    setZoomScale(1);
  };

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          {/* 줌 컨트롤 버튼들 */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
              <MaterialIcons name="zoom-out" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleReset}>
              <MaterialIcons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
              <MaterialIcons name="zoom-in" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* 이미지 */}
          <ScrollView
            style={styles.imageContainer}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={3}
            minimumZoomScale={0.5}
            zoomScale={zoomScale}
            onZoomScaleChange={(scale) => {
              console.log('📱 [DEBUG] ScrollView 줌 변경:', scale.toFixed(2));
              setZoomScale(scale);
            }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent={true}
            scrollEnabled={true}
            pinchGestureEnabled={true}
            doubleTapToZoomEnabled={true}
            onScroll={(event) => {
              console.log('📱 [DEBUG] ScrollView 스크롤 이벤트');
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, { transform: [{ scale: zoomScale }] }]}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    padding: 10,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  zoomButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

export default ImageModal;
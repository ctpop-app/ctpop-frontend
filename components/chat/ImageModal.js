import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageModal = ({ visible, imageUri, onClose }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  
  const panRef = useRef();
  const pinchRef = useRef();

  // 모달이 열릴 때마다 값들 초기화
  useEffect(() => {
    if (visible) {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      focalX.value = 0;
      focalY.value = 0;
    }
  }, [visible]);

  const resetTransform = () => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    focalX.value = 0;
    focalY.value = 0;
  };

  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      runOnJS(console.log)('🤏 [DEBUG] 핀치 제스처 시작');
      context.startScale = scale.value;
      focalX.value = _.focalX;
      focalY.value = _.focalY;
    },
    onActive: (event, context) => {
      const newScale = Math.min(Math.max(context.startScale * event.scale, 0.5), 3);
      scale.value = newScale;
      
      runOnJS(console.log)('🤏 [DEBUG] 핀치 제스처 활성:', { scale: newScale.toFixed(2) });
      
      // 줌 중심점 기준으로 이미지 위치 조정
      const deltaX = (event.focalX - focalX.value) * (newScale - 1);
      const deltaY = (event.focalY - focalY.value) * (newScale - 1);
      
      translateX.value = deltaX;
      translateY.value = deltaY;
    },
    onEnd: () => {
      runOnJS(console.log)('🤏 [DEBUG] 핀치 제스처 종료, 현재 스케일:', scale.value.toFixed(2));
      if (scale.value < 1) {
        runOnJS(console.log)('🔄 [DEBUG] 스케일 1미만, 리셋 실행');
        runOnJS(resetTransform)();
      }
    },
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      runOnJS(console.log)('👆 [DEBUG] 드래그 제스처 시작');
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (scale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;
        
        translateX.value = Math.min(
          Math.max(context.startX + event.translationX, -maxTranslateX),
          maxTranslateX
        );
        translateY.value = Math.min(
          Math.max(context.startY + event.translationY, -maxTranslateY),
          maxTranslateY
        );
        
        runOnJS(console.log)('👆 [DEBUG] 드래그 중:', { 
          x: translateX.value.toFixed(0), 
          y: translateY.value.toFixed(0),
          scale: scale.value.toFixed(2)
        });
      } else {
        runOnJS(console.log)('👆 [DEBUG] 드래그 무시 (스케일 1 이하)');
      }
    },
    onEnd: () => {
      runOnJS(console.log)('👆 [DEBUG] 드래그 제스처 종료');
      if (scale.value <= 1) {
        runOnJS(console.log)('🔄 [DEBUG] 스케일 1 이하, 리셋 실행');
        runOnJS(resetTransform)();
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

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
          
          {/* 이미지 */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
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
    zIndex: 1,
    padding: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ImageModal;
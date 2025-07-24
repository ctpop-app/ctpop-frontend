import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  interpolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ImageUploadSkeleton = ({ progress = 0, width: customWidth = 200, height: customHeight = 150 }) => {
  const shimmerAnimation = useSharedValue(0);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    // 쉬머 애니메이션
    shimmerAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    // 진행률 애니메이션
    progressValue.value = withTiming(progress, { duration: 300 });
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerAnimation.value, [0, 1], [0.3, 0.7]);
    return {
      opacity,
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    const height = interpolate(progressValue.value, [0, 100], [0, customHeight]);
    return {
      height,
    };
  });

  return (
    <View style={[styles.container, { width: customWidth, height: customHeight }]}>
      {/* 기본 스켈레톤 */}
      <Animated.View style={[styles.skeleton, shimmerStyle]} />
      
      {/* 물처럼 차오르는 프로그레스 */}
      <Animated.View style={[styles.progressFill, progressStyle]} />
      
      {/* 물결 효과 */}
      <View style={styles.waveContainer}>
        <Animated.View style={[styles.wave, styles.wave1]} />
        <Animated.View style={[styles.wave, styles.wave2]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  skeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
    height: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.5)',
    borderRadius: 10,
  },
  wave1: {
    animationDelay: '0s',
  },
  wave2: {
    animationDelay: '0.5s',
  },
});

export default ImageUploadSkeleton;
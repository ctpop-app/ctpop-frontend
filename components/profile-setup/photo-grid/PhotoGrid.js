import React, { useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { PhotoItem } from './PhotoItem';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 80) / 3;
const MAX_PHOTOS = 6;
const GRID_START_Y = 200;

// 단일 사진 아이템 컴포넌트
const PhotoGridItem = ({ item, index, onPress, onRemove, onMove }) => {
  const dragging = useSharedValue(false);
  const draggedIndex = useSharedValue(-1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const moveItem = useCallback((fromIdx, toIdx) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= MAX_PHOTOS || toIdx >= MAX_PHOTOS) return;
    onMove(fromIdx, toIdx);
  }, [onMove]);

  const gestureHandler = useCallback((event) => {
    'worklet';
    const { state, translationX, translationY, absoluteX, absoluteY } = event.nativeEvent;
    
    if (state === 2) { // BEGAN
      if (index < 0 || index >= MAX_PHOTOS) return;
      draggedIndex.value = index;
      dragging.value = true;
    } else if (state === 4) { // ACTIVE
      if (draggedIndex.value < 0) return;
      translateX.value = translationX;
      translateY.value = translationY;
    } else if (state === 5) { // END
      if (draggedIndex.value < 0) return;

      const cellSize = PHOTO_SIZE + 10;
      const relativeY = absoluteY - GRID_START_Y;
      
      const col = Math.min(2, Math.max(0, Math.floor(absoluteX / cellSize)));
      const row = Math.min(1, Math.max(0, Math.floor(relativeY / cellSize)));
      const dropIndex = Math.min(MAX_PHOTOS - 1, row * 3 + col);

      if (dropIndex !== draggedIndex.value) {
        runOnJS(moveItem)(draggedIndex.value, dropIndex);
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      dragging.value = false;
      draggedIndex.value = -1;
    }
  }, [index, moveItem]);

  const getAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: draggedIndex.value === index ? translateX.value : 0 },
      { translateY: draggedIndex.value === index ? translateY.value : 0 },
      { scale: dragging.value && draggedIndex.value === index ? 1.1 : 1 }
    ],
    zIndex: dragging.value && draggedIndex.value === index ? 1000 : 1
  }));

  return (
    <PanGestureHandler
      key={`pan-${item.key}`}
      enabled={!!item.photo?.uri}
      onGestureEvent={gestureHandler}
      onHandlerStateChange={gestureHandler}
      activeOffsetX={[-20, 20]}
      activeOffsetY={[-20, 20]}
    >
      <Animated.View style={getAnimatedStyle}>
        <PhotoItem
          item={item}
          index={index}
          onPress={onPress}
          onRemove={onRemove}
          disabled={!item.isAddable && !item.photo?.uri}
        />
      </Animated.View>
    </PanGestureHandler>
  );
};

export const PhotoGrid = ({ 
  photos, 
  onPhotoPress, 
  onPhotoRemove, 
  onPhotoMove 
}) => {
  // 실제 사진이 있는 개수 계산
  const photoCount = photos ? photos.filter(p => p?.photo?.uri).length : 0;
  
  // 표시할 아이템 개수 계산 (최소 1개, 최대 6개)
  const displayCount = Math.min(photoCount + 1, MAX_PHOTOS);

  // 표시할 아이템들 생성
  const displayItems = [];
  for (let i = 0; i < displayCount; i++) {
    const photo = photos && photos[i] ? photos[i] : null;
    const hasPhoto = photo?.photo?.uri;
    const isAddButton = !hasPhoto && photoCount < MAX_PHOTOS;
    
    displayItems.push({ 
      key: hasPhoto ? `${photo.photo.uri}-${i}` : `empty-${i}`, 
      uri: hasPhoto ? photo.photo.uri : null, 
      empty: !hasPhoto, 
      idx: i,
      isAddable: isAddButton,
      photo: photo?.photo,
      isAddButton
    });
  }

  return (
    <View style={styles.photoGrid}>
      {displayItems.map((item) => (
        <PhotoGridItem
          key={item.key}
          item={item}
          index={item.idx}
          onPress={onPhotoPress}
          onRemove={onPhotoRemove}
          onMove={onPhotoMove}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 20 
  }
}); 
import React, { useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS,
  useAnimatedGestureHandler
} from 'react-native-reanimated';
import { PhotoItem } from './PhotoItem';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 80) / 3;
const MAX_PHOTOS = 6;
const GRID_START_Y = 200; // 그리드 시작 Y 좌표 수정

export const PhotoGrid = ({ 
  photos, 
  onPhotoPress, 
  onPhotoRemove, 
  onPhotoMove 
}) => {
  const dragging = useSharedValue(false);
  const draggedIndex = useSharedValue(-1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const getLastUsedIndex = useCallback(() => {
    const lastIndex = photos.findIndex(photo => !photo?.photo?.uri);
    return lastIndex === -1 ? MAX_PHOTOS - 1 : lastIndex - 1;
  }, [photos]);

  const moveItem = useCallback((fromIdx, toIdx) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= MAX_PHOTOS || toIdx >= MAX_PHOTOS) return;
    const lastUsedIndex = getLastUsedIndex();
    if (toIdx > lastUsedIndex + 1) return;
    onPhotoMove(fromIdx, toIdx);
  }, [getLastUsedIndex, onPhotoMove]);

  const createPanGestureHandler = (index) => 
    useAnimatedGestureHandler({
      onStart: (_, ctx) => {
        if (index < 0 || index >= MAX_PHOTOS) return;
        draggedIndex.value = index;
        dragging.value = true;
        ctx.startX = translateX.value;
        ctx.startY = translateY.value;
      },
      onActive: (event, ctx) => {
        if (draggedIndex.value < 0) return;
        translateX.value = ctx.startX + event.translationX;
        translateY.value = ctx.startY + event.translationY;
      },
      onEnd: (event) => {
        if (draggedIndex.value < 0) return;

        const cellSize = PHOTO_SIZE + 10;
        const relativeY = event.absoluteY - GRID_START_Y;
        
        const col = Math.min(2, Math.max(0, Math.floor(event.absoluteX / cellSize)));
        const row = Math.min(1, Math.max(0, Math.floor(relativeY / cellSize)));
        const dropIndex = row * 3 + col;

        if (dropIndex !== draggedIndex.value) {
          runOnJS(moveItem)(draggedIndex.value, dropIndex);
        }

        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        dragging.value = false;
        draggedIndex.value = -1;
      }
    });

  const getAnimatedStyle = useCallback((index) => useAnimatedStyle(() => ({
    transform: [
      { translateX: draggedIndex.value === index ? translateX.value : 0 },
      { translateY: draggedIndex.value === index ? translateY.value : 0 },
      { scale: dragging.value && draggedIndex.value === index ? 1.1 : 1 }
    ],
    zIndex: dragging.value && draggedIndex.value === index ? 1000 : 1
  })), [draggedIndex, dragging, translateX, translateY]);

  const photoList = photos.map((p, i) => {
    const lastUsedIndex = getLastUsedIndex();
    const isAddable = i <= lastUsedIndex + 1;
    
    return { 
      key: p?.photo?.uri ? `${p.photo.uri}-${i}` : `empty-${i}`, 
      uri: p?.photo?.uri || null, 
      empty: p?.photo === null, 
      idx: i,
      isAddable,
      photo: p?.photo
    };
  });

  return (
    <View style={styles.photoGrid}>
      {photoList.map((item, index) => (
        <PanGestureHandler
          key={`pan-${item.key}`}
          enabled={!!item.photo?.uri}
          onGestureEvent={createPanGestureHandler(index)}
          onHandlerStateChange={createPanGestureHandler(index)}
          activeOffsetX={[-20, 20]}
          activeOffsetY={[-20, 20]}
        >
          <Animated.View style={getAnimatedStyle(index)}>
            <PhotoItem
              item={item}
              index={index}
              onPress={onPhotoPress}
              onRemove={onPhotoRemove}
              disabled={!item.isAddable}
            />
          </Animated.View>
        </PanGestureHandler>
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
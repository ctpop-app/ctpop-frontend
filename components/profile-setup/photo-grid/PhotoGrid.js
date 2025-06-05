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

const createPanGestureHandler = (index, positions, draggedIndex, dragging, moveItem) => 
  useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (index < 0 || index >= MAX_PHOTOS) return;
      draggedIndex.value = index;
      dragging.value = true;
      ctx.startX = positions[index].x.value;
      ctx.startY = positions[index].y.value;
    },
    onActive: (event, ctx) => {
      if (draggedIndex.value < 0) return;
      positions[draggedIndex.value].x.value = ctx.startX + event.translationX;
      positions[draggedIndex.value].y.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      if (draggedIndex.value < 0) return;

      const GRID_TOP = 280;
      const absX = event.absoluteX;
      const absY = Math.max(0, event.absoluteY - GRID_TOP);

      const itemWidth = PHOTO_SIZE + 10;
      const itemHeight = PHOTO_SIZE + 10;
      
      const maxCol = 2;
      const maxRow = Math.ceil(MAX_PHOTOS / 3) - 1;
      
      const col = Math.min(Math.max(0, Math.floor(absX / itemWidth)), maxCol);
      const row = Math.min(Math.max(0, Math.floor(absY / itemHeight)), maxRow);
      
      const dropIndex = row * 3 + col;
      
      if (dropIndex >= 0 && dropIndex < MAX_PHOTOS && 
          dropIndex !== draggedIndex.value) {
        runOnJS(moveItem)(draggedIndex.value, dropIndex);
      }
      
      positions[draggedIndex.value].x.value = withSpring(0);
      positions[draggedIndex.value].y.value = withSpring(0);
      dragging.value = false;
      draggedIndex.value = -1;
    }
  });

export const PhotoGrid = ({ 
  photos, 
  onPhotoPress, 
  onPhotoRemove, 
  onPhotoMove 
}) => {
  const dragging = useSharedValue(false);
  const draggedIndex = useSharedValue(-1);
  const positions = photos.map((_, index) => ({
    x: useSharedValue(0),
    y: useSharedValue(0)
  }));

  // 마지막으로 사용된 사진의 인덱스를 찾는 함수
  const getLastUsedIndex = useCallback(() => {
    const lastIndex = photos.findIndex(photo => !photo?.photo?.uri);
    return lastIndex === -1 ? MAX_PHOTOS - 1 : lastIndex - 1;
  }, [photos]);

  const moveItem = useCallback((fromIdx, toIdx) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= MAX_PHOTOS || toIdx >= MAX_PHOTOS) {
      console.log('Invalid move attempted:', { fromIdx, toIdx });
      return;
    }

    const lastUsedIndex = getLastUsedIndex();
    if (toIdx > lastUsedIndex) {
      console.log('Invalid move: Cannot move beyond the last used photo');
      return;
    }

    onPhotoMove(fromIdx, toIdx);
  }, [getLastUsedIndex, onPhotoMove]);

  const getAnimatedStyle = useCallback((index) => useAnimatedStyle(() => {
    if (draggedIndex.value === index) {
      return {
        transform: [
          { translateX: positions[index].x.value },
          { translateY: positions[index].y.value },
          { scale: dragging.value ? 1.1 : 1 }
        ],
        zIndex: dragging.value ? 1000 : 1
      };
    }
    return {
      transform: [
        { translateX: 0 },
        { translateY: 0 },
        { scale: 1 }
      ],
      zIndex: 1
    };
  }), [draggedIndex, dragging, positions]);

  const photoList = photos.map((p, i) => {
    const lastUsedIndex = getLastUsedIndex();
    const isAddable = i <= lastUsedIndex + 1;
    
    return { 
      key: p?.photo?.uri || `empty-${i}`, 
      uri: p?.photo?.uri || null, 
      empty: p?.photo === null, 
      idx: i,
      isAddable,
      photo: p?.photo
    };
  });

  console.log('PhotoGrid photoList:', photoList.map(p => ({
    uri: p.photo?.uri,
    isAddable: p.isAddable,
    empty: p.empty
  })));

  return (
    <View style={styles.photoGrid}>
      {photoList.map((item, index) => (
        <PanGestureHandler
          key={`pan-${item.key}`}
          enabled={!!item.photo?.uri}
          onGestureEvent={createPanGestureHandler(index, positions, draggedIndex, dragging, moveItem)}
          onHandlerStateChange={createPanGestureHandler(index, positions, draggedIndex, dragging, moveItem)}
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
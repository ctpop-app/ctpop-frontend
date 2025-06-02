import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 80) / 3;

const AnimatedView = Animated.createAnimatedComponent(View);

export const PhotoItem = ({ 
  item, 
  index, 
  onPress, 
  onRemove
}) => {
  const { uri, empty, isAddable } = item;
  const isMainPhoto = index === 0;

  const handlePress = () => {
    if (empty) {
      if (isAddable) {
        onPress(index);
      }
    } else {
      onPress(index);
    }
  };

  if (empty) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.emptyContainer]}
        onPress={isAddable ? handlePress : undefined}
        disabled={!isAddable}
      >
        <Ionicons 
          name="add-circle-outline" 
          size={32} 
          color={isAddable ? "#666" : "#ccc"} 
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
      />
      {isMainPhoto && (
        <View style={styles.mainPhotoBadge}>
          <Ionicons name="star" size={12} color="#fff" />
        </View>
      )}
      {!isMainPhoto && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(index)}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 
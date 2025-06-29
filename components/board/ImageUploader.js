import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 이미지 업로드 컴포넌트
 * @param {Object} props
 * @param {string} props.imageUri - 이미지 URI
 * @param {boolean} props.uploadingImage - 업로드 중 여부
 * @param {Function} props.onPickImage - 이미지 선택 함수
 * @param {Function} props.onRemoveImage - 이미지 제거 함수
 */
export const ImageUploader = ({
  imageUri,
  uploadingImage,
  onPickImage,
  onRemoveImage
}) => {
  const hasImage = !!imageUri;

  return (
    <View style={styles.imageContainer}>
      {hasImage ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoveImage}
            disabled={uploadingImage}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
          {uploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.uploadingText}>업로드 중...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={onPickImage}
          disabled={uploadingImage}
        >
          <Ionicons name="camera-outline" size={32} color="#666" />
          <Text style={styles.addImageText}>사진 추가</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  addImageButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    marginTop: 4,
    fontSize: 10,
    color: '#666',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
}); 
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const usePhotoGrid = (maxPhotos = 6) => {
  const [photos, setPhotos] = useState(Array(maxPhotos).fill(null));

  const pickImage = async (index) => {
    const firstEmpty = photos.findIndex(p => p === null);
    if (index !== firstEmpty) {
      throw new Error('사진을 순서대로 등록해주세요.');
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('갤러리 접근을 허용해주세요.');
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!res.canceled && res.assets[0]) {
      const next = [...photos];
      next[index] = res.assets[0].uri;
      setPhotos(next);
      return res.assets[0].uri;
    }
    return null;
  };

  const removePhoto = (index) => {
    const arr = [...photos];
    for (let j = index; j < arr.length - 1; j++) arr[j] = arr[j + 1];
    arr[arr.length - 1] = null;
    setPhotos(arr);
  };

  const movePhoto = (fromIdx, toIdx) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= maxPhotos || toIdx >= maxPhotos) {
      throw new Error('Invalid move attempted');
    }

    const lastUsedIndex = photos.findIndex(photo => photo === null) - 1;
    const lastIndex = lastUsedIndex === -2 ? maxPhotos - 1 : lastUsedIndex;

    if (toIdx > lastIndex + 1) {
      throw new Error('Cannot move beyond the next available position');
    }

    const newPhotos = [...photos];
    const [movedItem] = newPhotos.splice(fromIdx, 1);
    newPhotos.splice(toIdx, 0, movedItem);
    setPhotos(newPhotos);
  };

  return {
    photos,
    setPhotos,
    pickImage,
    removePhoto,
    movePhoto
  };
}; 
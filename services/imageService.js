import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentKST } from '../utils/dateUtils';

/**
 * 프로필 사진을 Firebase Storage에 업로드합니다.
 * @param {Object} photo - 업로드할 사진 객체 { uri, name }
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<string>} - 업로드된 이미지의 URL
 */
export const uploadProfilePhoto = async (photo, uuid) => {
  if (!photo?.uri || !uuid) {
    throw new Error('사진과 사용자 ID가 필요합니다.');
  }

  try {
    // 이미지 압축 및 리사이징
    const manipResult = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Blob으로 변환
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();
    
    // 파일명 생성
    const timestamp = getCurrentKST().replace(/[:.]/g, '-');
    const originalName = photo.name || 'photo';
    const filename = `${timestamp}_${originalName}.jpg`;
    
    // Storage 참조 생성
    const storageRef = ref(storage, `profiles/${uuid}/${filename}`);
    
    // 메타데이터 설정
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: getCurrentKST(),
        originalName: originalName,
        uuid: uuid,
        originalWidth: manipResult.width.toString(),
        originalHeight: manipResult.height.toString()
      }
    };
    
    // 업로드
    await uploadBytes(storageRef, blob, metadata);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('프로필 사진 업로드 실패:', error);
    throw new Error('프로필 사진 업로드에 실패했습니다.');
  }
};

/**
 * 여러 프로필 사진을 업로드합니다.
 * @param {Object[]} photos - 업로드할 사진 객체 배열
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<string[]>} - 업로드된 이미지들의 URL 배열
 */
export const uploadProfilePhotos = async (photos, uuid) => {
  console.log('imageService - uploadProfilePhotos input:', { photos, uuid });
  
  if (!photos?.length || !uuid) {
    console.error('imageService - uploadProfilePhotos validation failed:', { photos, uuid });
    throw new Error('사진과 사용자 ID가 필요합니다.');
  }

  try {
    const uploadPromises = photos.map(photo => {
      console.log('imageService - processing photo:', photo);
      if (photo.uri.startsWith('https://')) {
        console.log('imageService - photo is already a URL:', photo.uri);
        return Promise.resolve(photo.uri);
      }
      return uploadProfilePhoto(photo, uuid);
    });

    const urls = await Promise.all(uploadPromises);
    console.log('imageService - uploadProfilePhotos result:', urls);
    return urls;
  } catch (error) {
    console.error('프로필 사진 업로드 실패:', error);
    throw new Error('프로필 사진 업로드에 실패했습니다.');
  }
};

/**
 * 채팅 이미지를 업로드합니다.
 * @param {Object} photo - 업로드할 사진 객체
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<string>} - 업로드된 이미지의 URL
 */
export const uploadChatImage = async (photo, uuid) => {
  if (!photo?.uri || !uuid) {
    throw new Error('사진과 사용자 ID가 필요합니다.');
  }

  try {
    // 이미지 압축 및 리사이징
    const manipResult = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Blob으로 변환
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();
    
    // 파일명 생성
    const timestamp = getCurrentKST().replace(/[:.]/g, '-');
    const filename = `${timestamp}_chat.jpg`;
    
    // Storage 참조 생성
    const storageRef = ref(storage, `chat/${uuid}/${filename}`);
    
    // 메타데이터 설정
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: getCurrentKST(),
        uuid: uuid,
        type: 'chat'
      }
    };
    
    // 업로드
    await uploadBytes(storageRef, blob, metadata);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('채팅 이미지 업로드 실패:', error);
    throw new Error('채팅 이미지 업로드에 실패했습니다.');
  }
};

/**
 * 이미지를 Firebase Storage에 업로드합니다.
 * @param {string} uri - 이미지 URI
 * @param {string} path - 저장할 경로 (예: 'profile', 'chat')
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<string>} - 업로드된 이미지의 URL
 */
export const uploadImage = async (uri, path = 'profile', uuid = null) => {
  try {
    console.log('이미지 업로드 시작:', { uri, path, uuid });

    // 이미지 압축 및 리사이징
    console.log('이미지 압축 시작...');
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    console.log('이미지 압축 완료:', { 
      width: manipResult.width, 
      height: manipResult.height,
      uri: manipResult.uri 
    });

    // Blob으로 변환
    console.log('Blob 변환 시작...');
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();
    console.log('Blob 변환 완료:', { 
      size: blob.size,
      type: blob.type 
    });

    // 파일명 생성
    const timestamp = getCurrentKST().replace(/[:.]/g, '-');
    const filename = uuid 
      ? `${path}/${uuid}_${timestamp}.jpg`
      : `${path}/${timestamp}.jpg`;
    
    const storageRef = ref(storage, filename);
    console.log('Storage 참조 생성:', { filename });
    
    // 메타데이터와 함께 업로드
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        'uploadedAt': getCurrentKST(),
        'originalWidth': manipResult.width.toString(),
        'originalHeight': manipResult.height.toString(),
        'uuid': uuid || 'unknown'
      }
    };
    console.log('메타데이터 준비 완료:', metadata);

    console.log('Storage 업로드 시작...');
    await uploadBytes(storageRef, blob, metadata);
    console.log('Storage 업로드 완료');

    // 다운로드 URL 반환
    console.log('다운로드 URL 가져오기 시작...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('다운로드 URL 가져오기 완료:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 실패:', {
      error: error.message,
      uri,
      path,
      uuid
    });
    throw new Error('이미지 업로드에 실패했습니다.');
  }
};

/**
 * 여러 이미지를 Firebase Storage에 업로드합니다.
 * @param {string[]} uris - 이미지 URI 배열
 * @param {string} path - 저장할 경로
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<string[]>} - 업로드된 이미지들의 URL 배열
 */
export const uploadMultipleImages = async (uris, path = 'profile', uuid = null) => {
  try {
    const uploadPromises = uris.map(uri => uploadImage(uri, path, uuid));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
};

/**
 * 이미지 URL이 유효한지 확인합니다.
 * @param {string} url - 확인할 이미지 URL
 * @returns {Promise<boolean>} - URL 유효성 여부
 */
export const isValidImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * 이미지 URL에서 파일명을 추출합니다.
 * @param {string} url - 이미지 URL
 * @returns {string} - 파일명
 */
export const getFilenameFromUrl = (url) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.split('/').pop().split('?')[0];
  } catch (error) {
    console.error('Error getting filename from URL:', error);
    return null;
  }
};

export const imageService = {
  pickImage: async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('갤러리 접근 권한이 필요합니다.');
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      return result;
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      throw error;
    }
  },

  // 프로필 사진 관련
  uploadProfilePhoto,
  uploadProfilePhotos,

  // 채팅 이미지 관련
  uploadChatImage,

  // 유틸리티 함수
  isValidImageUrl,
  getFilenameFromUrl
}; 
import { storage } from '../firebase';
import { ref, uploadBytesWithMetadata, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * 이미지를 Firebase Storage에 업로드합니다.
 * @param {string} uri - 이미지 URI
 * @param {string} path - 저장할 경로 (예: 'profile', 'chat')
 * @returns {Promise<string>} - 업로드된 이미지의 URL
 */
export const uploadImage = async (uri, path = 'profile') => {
  try {
    console.log('이미지 업로드 시작:', { uri, path });

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

    // Firebase Storage에 업로드
    const filename = `${path}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    console.log('Storage 참조 생성:', { filename });
    
    // 메타데이터와 함께 업로드
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        'uploadedAt': new Date().toISOString(),
        'originalWidth': manipResult.width.toString(),
        'originalHeight': manipResult.height.toString()
      }
    };
    console.log('메타데이터 준비 완료:', metadata);

    console.log('Storage 업로드 시작...');
    await uploadBytesWithMetadata(storageRef, blob, metadata);
    console.log('Storage 업로드 완료');

    // 다운로드 URL 반환
    console.log('다운로드 URL 가져오기 시작...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('다운로드 URL 가져오기 완료:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 실패:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error('이미지 업로드에 실패했습니다.');
  }
};

/**
 * 여러 이미지를 Firebase Storage에 업로드합니다.
 * @param {string[]} uris - 이미지 URI 배열
 * @param {string} path - 저장할 경로
 * @returns {Promise<string[]>} - 업로드된 이미지들의 URL 배열
 */
export const uploadMultipleImages = async (uris, path = 'profile') => {
  try {
    const uploadPromises = uris.map(uri => uploadImage(uri, path));
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
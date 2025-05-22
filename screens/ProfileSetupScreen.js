import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Alert, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Dimensions,
  PanResponder,
  Animated
} from 'react-native';
import { storage } from '../firebase';
import useUserStore from '../store/userStore';
import { Profile } from '../models/Profile';
import { profileService } from '../services/profileService';
import { MaterialIcons } from '@expo/vector-icons';

// 기본 프로필 이미지 URL
const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';
const MAX_PHOTOS = 6; // 최대 사진 개수 (대표사진 1개 + 추가사진 5개)
const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_BOX_SIZE = (SCREEN_WIDTH - 60) / 3; // 3개씩 나열, 좌우 여백 20, 사이 여백 10

export default function ProfileSetupScreen({ navigation, route }) {
  const { phoneNumber } = route.params || {}; // 로그인 화면에서 전달받은 전화번호
  const { updateUserProfile } = useUserStore();
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [orientation, setOrientation] = useState('');
  const [photos, setPhotos] = useState(Array(MAX_PHOTOS).fill(null)); // 6개의 null로 초기화된 배열
  const [saving, setSaving] = useState(false);
  
  // 드래그 앤 드롭 관련 상태
  const [dragging, setDragging] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef(null);
  const photoMeasurements = useRef([]);

  const orientationOptions = ['트젠', '시디', '러버', '기타'];
  const locationOptions = [
    '서울', '부산', '인천', '대구', 
    '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', 
    '전북', '전남', '경북', '경남', '제주'
  ];
  
  // 컴포넌트 마운트/언마운트 시 처리
  useEffect(() => {
    // 컴포넌트 마운트 시 초기화
    photoMeasurements.current = Array(MAX_PHOTOS).fill(null);
    
    return () => {
      // 컴포넌트 언마운트 시 정리
      setDragging(false);
      setDraggedIndex(null);
      setDraggedPhoto(null);
    };
  }, []);
  
  // 드래그 시작 처리
  const startDrag = (index, event) => {
    // 빈 사진은 드래그 불가
    if (photos[index] === null) return;
    
    const { pageX, pageY } = event.nativeEvent;
    const { x, y, width, height } = photoMeasurements.current[index] || { x: 0, y: 0, width: PHOTO_BOX_SIZE, height: PHOTO_BOX_SIZE };
    
    // 터치 위치를 기준으로 초기 위치 설정 (손가락 위치에서 사진 중앙까지의 오프셋)
    const offsetX = pageX - (x + width/2);
    const offsetY = pageY - (y + height/2);
    
    // 초기 위치 설정
    pan.setValue({ x: offsetX, y: offsetY });
    
    // 드래그 상태 설정
    setDragging(true);
    setDraggedIndex(index);
    setDraggedPhoto(photos[index]);
  };
  
  // PanResponder 설정
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => dragging,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => dragging,
      
      onPanResponderGrant: (evt, gestureState) => {
        // 드래그 중이 아니면 처리하지 않음
        if (!dragging) return;
        
        // 초기 상태 설정
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // 드래그 중이 아니면 처리하지 않음
        if (!dragging) return;
        
        const { dx, dy } = gestureState;
        pan.setValue({ x: dx, y: dy });
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        // 드래그 중이 아니면 처리하지 않음
        if (!dragging) return;
        
        // 오프셋 초기화
        pan.flattenOffset();
        
        // 드롭한 위치 계산
        const { moveX, moveY } = gestureState;
        
        // 드롭한 위치에 있는 사진 박스 찾기
        const dropIndex = findPhotoBoxAtPosition(moveX, moveY);
        console.log('Drop at:', { moveX, moveY, dropIndex });
        
        // 유효한 위치에 드롭한 경우 사진 위치 교환
        if (dropIndex !== -1 && dropIndex !== draggedIndex) {
          swapPhotos(draggedIndex, dropIndex);
        }
        
        // 드래그 상태 초기화
        setDragging(false);
        setDraggedIndex(null);
        setDraggedPhoto(null);
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderTerminate: (evt, gestureState) => {
        // 드래그 상태 초기화
        setDragging(false);
        setDraggedIndex(null);
        setDraggedPhoto(null);
        pan.setValue({ x: 0, y: 0 });
      }
    })
  ).current;
  
  // 주어진 화면 좌표에서 사진 박스 인덱스 찾기
  const findPhotoBoxAtPosition = (x, y) => {
    // 스크롤 오프셋 고려
    const scrollOffset = scrollViewRef.current?._scrollOffset?.y || 0;
    const adjustedY = y + scrollOffset;
    
    // 각 사진 박스의 측정값을 확인하여 포함하는 박스 찾기
    for (let i = 0; i < photoMeasurements.current.length; i++) {
      const measurement = photoMeasurements.current[i];
      
      // 측정값이 존재하고 사진이 존재하는 경우에만 확인
      if (measurement && photos[i] !== null) {
        const { x: boxX, y: boxY, width, height } = measurement;
        
        // 좌표가 박스 내에 있는지 확인
        if (
          x >= boxX && 
          x <= boxX + width && 
          adjustedY >= boxY && 
          adjustedY <= boxY + height
        ) {
          return i;
        }
      }
    }
    
    return -1;
  };
  
  // 사진 업로드
  const uploadImages = async () => {
    // 빈 슬롯을 제외한 사진들만 필터링
    const validPhotos = photos.filter(photo => photo !== null);
    
    if (validPhotos.length === 0) return { mainPhotoURL: null, photoURLs: [] };
    
    try {
      const uploadedURLs = [];
      
      // 모든 사진 업로드
      for (let i = 0; i < validPhotos.length; i++) {
        const response = await fetch(validPhotos[i]);
        const blob = await response.blob();
        
        const filename = `profileImage_${phoneNumber}_${i}_${Date.now()}`;
        const storageRef = ref(storage, `profileImages/${phoneNumber}/${filename}`);
        await uploadBytes(storageRef, blob);
        
        const downloadURL = await getDownloadURL(storageRef);
        uploadedURLs.push(downloadURL);
      }
      
      // 대표사진 URL과 나머지 사진 URL 분리
      const mainPhotoURL = uploadedURLs[0];
      const photoURLs = uploadedURLs.slice(1);
      
      return { mainPhotoURL, photoURLs };
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  };

  // 박스 클릭 시 해당 위치에 사진 등록
  const pickImage = async (index) => {
    console.log('pickImage 시작:', index);
    
    // 대표사진이 없는데 다른 사진을 추가하려는 경우
    if (photos[0] === null && index !== 0) {
      Alert.alert('알림', '대표사진을 먼저 등록해주세요.');
      return;
    }
    
    // 다음 빈 슬롯 찾기
    const nextEmptySlot = photos.findIndex(photo => photo === null);
    console.log('다음 빈 슬롯:', nextEmptySlot);
    
    // 모든 슬롯이 이미 찼는지 확인
    if (nextEmptySlot === -1) {
      Alert.alert('알림', '이미 최대 개수의 사진이 등록되었습니다.');
      return;
    }
    
    // 항상 다음 빈 슬롯에 사진 등록 (대표사진은 예외)
    const targetIndex = (index === 0 && photos[0] === null) ? 0 : nextEmptySlot;
    console.log('실제 등록할 슬롯:', targetIndex);
    
    // 권한 요청
    try {
      console.log('권한 요청 시작');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('권한 상태:', status);
      
      if (status !== 'granted') {
        Alert.alert('권한이 필요합니다', '갤러리 접근 권한을 허용해주세요.');
        return;
      }
      
      // 이미지 선택 실행
      console.log('이미지 피커 실행');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      console.log('이미지 피커 결과:', JSON.stringify(result, null, 2));
      
      // 선택 취소되지 않았고 결과가 있는 경우
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        console.log('선택된 이미지:', selectedImage);
        
        // 사진 추가
        const newPhotos = [...photos];
        newPhotos[targetIndex] = selectedImage;
        setPhotos(newPhotos);
        console.log('사진 등록 성공:', targetIndex, selectedImage);
      } else {
        console.log('사진 선택 취소됨 또는 결과 없음');
      }
    } catch (error) {
      console.error('사진 선택 오류:', error);
      Alert.alert('오류', '사진을 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 사진 삭제
  const removePhoto = (index) => {
    // 대표사진을 삭제하려는 경우 다른 사진이 있으면 다음 사진이 대표사진이 됨
    if (index === 0 && photos.some((photo, idx) => idx !== 0 && photo !== null)) {
      Alert.alert(
        '대표사진 삭제',
        '대표사진을 삭제하면 두 번째 사진이 대표사진이 됩니다. 계속하시겠습니까?',
        [
          { 
            text: '취소', 
            style: 'cancel' 
          },
          {
            text: '삭제',
            onPress: () => {
              // 다른 사진들 한 칸씩 앞으로 당기기
              const newPhotos = [...photos];
              for (let i = 0; i < newPhotos.length - 1; i++) {
                newPhotos[i] = newPhotos[i + 1];
              }
              // 마지막은 항상 null
              newPhotos[newPhotos.length - 1] = null;
              setPhotos(newPhotos);
              
              Alert.alert('알림', '대표사진이 변경되었습니다.');
            },
            style: 'destructive'
          }
        ]
      );
      return;
    }
    
    // 일반 사진 삭제 시 빈 공간이 생기지 않도록 정리
    const newPhotos = [...photos];
    const photoToRemove = newPhotos[index];
    
    if (photoToRemove !== null) {
      // 지우려는 사진 위치부터 끝까지 한 칸씩 당기기
      for (let i = index; i < newPhotos.length - 1; i++) {
        newPhotos[i] = newPhotos[i + 1];
      }
      // 마지막은 항상 null
      newPhotos[newPhotos.length - 1] = null;
      setPhotos(newPhotos);
    }
  };

  // 사진 순서 변경
  const swapPhotos = (fromIndex, toIndex) => {
    const newPhotos = [...photos];
    const temp = newPhotos[fromIndex];
    newPhotos[fromIndex] = newPhotos[toIndex];
    newPhotos[toIndex] = temp;
    setPhotos(newPhotos);
    
    // 대표사진이 변경된 경우 알림
    if (fromIndex === 0 || toIndex === 0) {
      Alert.alert('알림', '대표사진이 변경되었습니다.');
    }
  };

  // 사진 그리드 렌더링
  const renderPhotoGrid = () => {
    return (
      <View style={styles.photoGrid}>
        {Array.from({ length: Math.ceil(MAX_PHOTOS / 3) }).map((_, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.photoRow}>
            {Array.from({ length: 3 }).map((_, colIndex) => {
              const index = rowIndex * 3 + colIndex;
              if (index < MAX_PHOTOS) {
                return renderPhotoBox(index);
              }
              return null;
            })}
          </View>
        ))}
      </View>
    );
  };
  
  // 사진 박스 렌더링
  const renderPhotoBox = (index) => {
    const isMainPhoto = index === 0;
    const hasPhoto = photos[index] !== null;
    const isDragging = dragging && draggedIndex === index;
    
    // 드래깅 중인 요소 스타일을 위한 애니메이션 값
    const photoBoxStyle = isDragging 
      ? [
          styles.photoBox,
          isMainPhoto && styles.mainPhotoBox,
          hasPhoto && styles.photoBoxWithImage,
          { opacity: 0.5 } // 드래그 중인 아이템 반투명 처리
        ]
      : [
          styles.photoBox,
          isMainPhoto && styles.mainPhotoBox,
          hasPhoto && styles.photoBoxWithImage
        ];
    
    return (
      <View 
        key={`photo-${index}`} 
        style={[
          styles.photoBoxContainer,
          index === 0 && styles.mainPhotoContainer
        ]}
        onLayout={(event) => {
          // 각 사진 박스의 위치와 크기 측정 저장
          const { x, y, width, height } = event.nativeEvent.layout;
          photoMeasurements.current[index] = { x, y, width, height };
        }}
      >
        <TouchableOpacity
          style={photoBoxStyle}
          onPress={() => pickImage(index)}
          onLongPress={(event) => {
            // 사진이 있는 경우에만 드래그 시작
            if (hasPhoto) {
              startDrag(index, event);
            }
          }}
        >
          {hasPhoto ? (
            <>
              <Image 
                source={{ uri: photos[index] }} 
                style={styles.photo}
              />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => removePhoto(index)}
              >
                <MaterialIcons name="close" size={18} color="white" />
              </TouchableOpacity>
              {isMainPhoto && (
                <View style={styles.mainPhotoIndicator}>
                  <Text style={styles.mainPhotoText}>대표</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons 
                name="add-photo-alternate" 
                size={24} 
                color="gray" 
              />
              <Text style={styles.photoPlaceholderText}>
                {isMainPhoto ? '대표사진' : '선택'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const saveProfile = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    
    if (!age || isNaN(parseInt(age)) || parseInt(age) < 18) {
      Alert.alert('알림', '유효한 나이를 입력해주세요. 18세 이상이어야 합니다.');
      return;
    }
    
    if (!height || isNaN(parseInt(height))) {
      Alert.alert('알림', '유효한 키를 입력해주세요.');
      return;
    }
    
    if (!weight || isNaN(parseInt(weight))) {
      Alert.alert('알림', '유효한 몸무게를 입력해주세요.');
      return;
    }
    
    if (!location) {
      Alert.alert('알림', '위치를 선택해주세요.');
      return;
    }
    
    if (!orientation) {
      Alert.alert('알림', '성향을 선택해주세요.');
      return;
    }
    
    if (photos[0] === null) {
      Alert.alert('알림', '대표사진을 등록해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      // 사진 업로드
      const { mainPhotoURL, photoURLs } = await uploadImages();
      
      // Profile 모델 객체 생성
      const profileData = new Profile({
        uid: phoneNumber,
        nickname: nickname.trim(),
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
        location,
        orientation,
        bio: bio.trim(),
        mainPhotoURL,
        photoURLs,
        isActive: true
      });
      
      // profileService를 사용하여 프로필 생성
      const createdProfile = await profileService.createProfile(profileData);
      console.log('프로필 저장 성공:', createdProfile);
      
      // 스토어에도 저장
      useUserStore.getState().updateUserProfile(phoneNumber, createdProfile);
      
      Alert.alert('성공', '프로필이 저장되었습니다.', [
        { 
          text: '확인', 
          onPress: () => {
            try {
              navigation.navigate('Main');
            } catch (error) {
              console.error('메인 화면 이동 오류:', error);
              
              // 대체 네비게이션 방법 시도
              try {
                if (navigation.reset) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                } else {
                  // 마지막 수단: 앱 새로고침 제안
                  Alert.alert(
                    '알림', 
                    '프로필 설정이 완료되었습니다. 앱을 다시 시작해주세요.',
                    [{ text: '확인' }]
                  );
                }
              } catch (navError) {
                console.error('네비게이션 재시도 오류:', navError);
              }
            }
          } 
        }
      ]);
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      Alert.alert('오류', '프로필을 저장하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={(e) => {
          // 스크롤 위치 저장
          if (scrollViewRef.current) {
            scrollViewRef.current._scrollOffset = { 
              y: e.nativeEvent.contentOffset.y 
            };
          }
        }}
        {...panResponder.panHandlers} // 스크롤뷰에도 PanResponder 핸들러 적용
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>프로필 설정</Text>
          <Text style={styles.subtitle}>프로필을 완성하여 매칭을 시작하세요</Text>
        </View>

        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>프로필 사진 (최대 6장)</Text>
          <Text style={styles.sectionSubtitle}>대표사진을 포함하여 최소 1장 이상의 사진이 필요합니다.</Text>
          
          {renderPhotoGrid()}
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
          />

          <Text style={styles.label}>나이</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="만 나이"
            keyboardType="number-pad"
          />

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>키 (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="170"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>몸무게 (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="65"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>위치</Text>
          <View style={styles.optionsContainer}>
            {locationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  location === option && styles.selectedOptionButton
                ]}
                onPress={() => setLocation(option)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    location === option && styles.selectedOptionButtonText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>성향</Text>
          <View style={styles.optionsContainer}>
            {orientationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  orientation === option && styles.selectedOptionButton
                ]}
                onPress={() => setOrientation(option)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    orientation === option && styles.selectedOptionButtonText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>자기소개</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="당신에 대해 간략히 설명해주세요"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.savingButton]}
            onPress={saveProfile}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? '저장 중...' : '프로필 저장하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* 드래그 중인 사진 렌더링 (최상단에 렌더링하기 위해 ScrollView 밖에 배치) */}
      {dragging && draggedPhoto && (
        <Animated.View
          style={[
            styles.draggingPhoto,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <Image 
            source={{ uri: draggedPhoto }} 
            style={styles.photo}
            resizeMode="cover"
          />
          {draggedIndex === 0 && (
            <View style={styles.mainPhotoIndicator}>
              <Text style={styles.mainPhotoText}>대표</Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative', // 드래깅 요소의 절대 위치 지정을 위해 필요
  },
  titleContainer: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  photoSection: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  photoGrid: {
    marginBottom: 10,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  photoBoxContainer: {
    width: PHOTO_BOX_SIZE,
    height: PHOTO_BOX_SIZE,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  photoBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  mainPhotoBox: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  mainPhotoContainer: {
    width: PHOTO_BOX_SIZE,
    height: PHOTO_BOX_SIZE,
  },
  photoBoxWithImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoIndicator: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mainPhotoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  halfInput: {
    width: '48%',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedOptionButton: {
    backgroundColor: '#FF6B6B',
  },
  optionButtonText: {
    color: '#444',
    fontSize: 14,
  },
  selectedOptionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  draggingPhoto: {
    position: 'absolute',
    width: PHOTO_BOX_SIZE,
    height: PHOTO_BOX_SIZE,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
}); 
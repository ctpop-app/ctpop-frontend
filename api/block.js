import { collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

// 사용자 차단
export const blockUser = async (blockerUuid, blockedUuid) => {
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('uuid', '==', blockerUuid));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('차단자 프로필이 존재하지 않습니다.');
    }
    const userDocRef = querySnapshot.docs[0].ref;
    await updateDoc(userDocRef, {
      blockedUuid: arrayUnion(blockedUuid)
    });
    return { message: '사용자를 차단했습니다.' };
  } catch (error) {
    console.error('Error blocking user:', error);
    throw new Error('사용자 차단에 실패했습니다.');
  }
};

// 사용자 차단 해제
export const unblockUser = async (blockerUuid, blockedUuid) => {
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('uuid', '==', blockerUuid));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('차단자 프로필이 존재하지 않습니다.');
    }
    const userDocRef = querySnapshot.docs[0].ref;
    await updateDoc(userDocRef, {
      blockedUuid: arrayRemove(blockedUuid)
    });
    return { message: '차단을 해제했습니다.' };
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw new Error('차단 해제에 실패했습니다.');
  }
};

// 차단된 사용자 목록 조회
export const getBlockedUsers = async (blockerUuid) => {
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('uuid', '==', blockerUuid));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('차단자 프로필이 존재하지 않습니다.');
    }
    const userDoc = querySnapshot.docs[0];
    return userDoc.data().blockedUuid || [];
  } catch (error) {
    console.error('Error getting blocked users:', error);
    throw new Error('차단 목록 조회에 실패했습니다.');
  }
}; 
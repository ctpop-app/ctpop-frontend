// 서울시 자치구 목록
const seoulDistricts = [
  { id: 'gangnam', name: '강남구' },
  { id: 'gangdong', name: '강동구' },
  { id: 'gangbuk', name: '강북구' },
  { id: 'gangseo', name: '강서구' },
  { id: 'gwanak', name: '관악구' },
  { id: 'gwangjin', name: '광진구' },
  { id: 'guro', name: '구로구' },
  { id: 'geumcheon', name: '금천구' },
  { id: 'nowon', name: '노원구' },
  { id: 'dobong', name: '도봉구' },
  { id: 'dongdaemun', name: '동대문구' },
  { id: 'dongjak', name: '동작구' },
  { id: 'mapo', name: '마포구' },
  { id: 'seodaemun', name: '서대문구' },
  { id: 'seocho', name: '서초구' },
  { id: 'seongdong', name: '성동구' },
  { id: 'seongbuk', name: '성북구' },
  { id: 'songpa', name: '송파구' },
  { id: 'yangcheon', name: '양천구' },
  { id: 'yeongdeungpo', name: '영등포구' },
  { id: 'yongsan', name: '용산구' },
  { id: 'eunpyeong', name: '은평구' },
  { id: 'jongno', name: '종로구' },
  { id: 'jung', name: '중구' },
  { id: 'jungnang', name: '중랑구' }
];

// 예시 동/읍/면 데이터 (실제로는 더 많은 데이터가 필요)
const dongData = {
  gangnam: [
    { id: 'apgujeong', name: '압구정동' },
    { id: 'cheongdam', name: '청담동' },
    { id: 'sinsa', name: '신사동' },
    { id: 'nonhyeon', name: '논현동' },
    { id: 'samseong', name: '삼성동' }
  ],
  mapo: [
    { id: 'hongdae', name: '홍대입구' },
    { id: 'sinchon', name: '신촌' },
    { id: 'hapjeong', name: '합정' },
    { id: 'gongdeok', name: '공덕' },
    { id: 'mangwon', name: '망원' }
  ]
  // 다른 구의 동 데이터도 추가
};

// 위치 데이터 가져오기
export const getLocations = async () => {
  // 실제로는 API 호출이나 데이터베이스에서 가져와야 함
  return [
    {
      id: 'seoul',
      name: '서울특별시',
      districts: seoulDistricts.map(district => ({
        ...district,
        dongs: dongData[district.id] || []
      }))
    }
    // 다른 시/도 데이터도 추가 가능
  ];
}; 
const io = require('socket.io-client');

// 테스트용 사용자 데이터
const testUsers = [
  { uuid: 'test-user-1', name: '사용자1', lat: 37.4979, lng: 127.0276 },
  { uuid: 'test-user-2', name: '사용자2', lat: 37.5079, lng: 127.0376 },
  { uuid: 'test-user-3', name: '사용자3', lat: 37.4879, lng: 127.0176 }
];

console.log('🧪 백엔드 소켓 연결 테스트 시작...\n');

// 소켓 연결 옵션
const socketOptions = {
  query: { uuid: testUsers[0].uuid },
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true
};

console.log('🔌 소켓 연결 옵션:', socketOptions);

// 첫 번째 사용자로 연결 테스트
const socket1 = io.connect('http://localhost:9090', socketOptions);

socket1.on('connect', () => {
  console.log('✅ 사용자1 소켓 연결 성공!');
  console.log('🔗 소켓 ID:', socket1.id);
  
  // 위치 업데이트 전송
  const locationData = {
    latitude: testUsers[0].lat,
    longitude: testUsers[0].lng,
    timestamp: Date.now()
  };
  
  console.log('📍 위치 업데이트 전송:', locationData);
  socket1.emit('updateLocation', locationData);
  
  // 온라인 사용자 목록 요청
  console.log('👥 온라인 사용자 목록 요청...');
  socket1.emit('getOnlineUsers');
  
  // 거리 정보 요청
  console.log('📏 거리 정보 요청...');
  socket1.emit('requestNearbyDistances');
});

socket1.on('connect_error', (error) => {
  console.error('❌ 소켓 연결 에러:', error.message);
  console.error('🔍 에러 상세:', error);
});

socket1.on('nearbyDistances', (distances) => {
  console.log('🎯 거리 정보 수신:', distances);
});

socket1.on('nearbyDistancesResponse', (distances) => {
  console.log('📡 거리 정보 응답:', distances);
});

socket1.on('onlineUsersList', (users) => {
  console.log('👥 온라인 사용자 목록:', users);
});

socket1.on('disconnect', (reason) => {
  console.log('❌ 사용자1 소켓 연결 해제. 이유:', reason);
});

socket1.on('error', (error) => {
  console.error('❌ 소켓 에러:', error);
});

// 5초 후 두 번째 사용자 연결
setTimeout(() => {
  console.log('\n🔄 두 번째 사용자 연결 시도...');
  
  const socket2 = io.connect('http://localhost:9090', {
    query: { uuid: testUsers[1].uuid },
    transports: ['websocket', 'polling'],
    timeout: 5000,
    forceNew: true
  });

  socket2.on('connect', () => {
    console.log('✅ 사용자2 소켓 연결 성공!');
    console.log('🔗 소켓 ID:', socket2.id);
    
    // 위치 업데이트 전송
    const locationData = {
      latitude: testUsers[1].lat,
      longitude: testUsers[1].lng,
      timestamp: Date.now()
    };
    
    console.log('📍 사용자2 위치 업데이트:', locationData);
    socket2.emit('updateLocation', locationData);
  });

  socket2.on('connect_error', (error) => {
    console.error('❌ 사용자2 소켓 연결 에러:', error.message);
  });

  socket2.on('nearbyDistances', (distances) => {
    console.log('🎯 사용자2 거리 정보 수신:', distances);
  });

  socket2.on('error', (error) => {
    console.error('❌ 사용자2 소켓 에러:', error);
  });
}, 5000);

// 15초 후 테스트 종료
setTimeout(() => {
  console.log('\n🏁 테스트 종료');
  if (socket1.connected) {
    socket1.disconnect();
  }
  process.exit(0);
}, 15000); 
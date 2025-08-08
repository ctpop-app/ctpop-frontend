import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useUserAgent() {
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    const getUserAgent = () => {
      try {
        // Platform 정보를 사용하여 기본적인 User Agent 생성
        const platform = Platform.OS;
        const version = Platform.Version;
        
        const userAgentString = `${platform} ${version}`;
        setUserAgent(userAgentString);
      } catch (error) {
        console.error('User Agent 정보를 가져오는데 실패했습니다:', error);
        setUserAgent('unknown');
      }
    };

    getUserAgent();
  }, []);

  return userAgent;
} 
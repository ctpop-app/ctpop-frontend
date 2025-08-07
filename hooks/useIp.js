import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const useIp = () => {
  const [ipAddress, setIpAddress] = useState(null);

  useEffect(() => {
    const getIpAddress = async () => {
      try {
        // React Native에서는 외부 API를 사용하여 IP 주소를 가져와야 합니다
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error('IP 주소를 가져오는데 실패했습니다:', error);
        setIpAddress('unknown');
      }
    };

    getIpAddress();
  }, []);

  return ipAddress;
};

export default useIp;

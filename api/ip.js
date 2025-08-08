export async function getPublicIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('[getPublicIp] IP 가져오기 실패:', error);
    return 'unknown';
  }
} 
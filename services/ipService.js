import { getPublicIp } from '../api/ip';

export async function getPublicIpAddress() {
  return await getPublicIp();
} 
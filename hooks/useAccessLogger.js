import { logAccessLog } from "../services/accessLogService";

export function useAccessLogger() {
  return { log: logAccessLog };
} 
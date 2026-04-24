import { v4 as uuidv4 } from "uuid";

const DEVICE_UUID_KEY = "sight_device_uuid";

/**
 * localStorage holds ONLY the anonymous device UUID — a non-sensitive random string.
 * All session research data goes to IndexedDB exclusively.
 */
export function getOrCreateDeviceUUID(): string {
  let uuid = localStorage.getItem(DEVICE_UUID_KEY);
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem(DEVICE_UUID_KEY, uuid);
  }
  return uuid;
}

export function getDeviceMetadata() {
  return {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  };
}

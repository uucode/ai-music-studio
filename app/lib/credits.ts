const STORAGE_KEY = 'ai_music_credits';
const DEVICE_ID_KEY = 'ai_music_device_id';
const FREE_CREDITS = 3;

interface CreditData {
  deviceId: string;
  used: number;
  bonus: number;
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getData(): CreditData {
  if (typeof window === 'undefined') return { deviceId: '', used: 0, bonus: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { deviceId: getDeviceId(), used: 0, bonus: 0 };
}

function saveData(data: CreditData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCreditsInfo() {
  const data = getData();
  const total = FREE_CREDITS + data.bonus;
  const remaining = Math.max(0, total - data.used);
  return {
    deviceId: data.deviceId || getDeviceId(),
    remaining,
    used: data.used,
    free: FREE_CREDITS,
    bonus: data.bonus,
    total,
  };
}

export function useOneCredit(): boolean {
  const data = getData();
  data.deviceId = data.deviceId || getDeviceId();
  const total = FREE_CREDITS + data.bonus;
  if (data.used >= total) return false;
  data.used += 1;
  saveData(data);
  return true;
}

export function addCredits(amount: number) {
  const data = getData();
  data.deviceId = data.deviceId || getDeviceId();
  data.bonus += amount;
  saveData(data);
}

export { getDeviceId };

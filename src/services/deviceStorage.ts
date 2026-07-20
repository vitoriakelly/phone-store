import type {
  Device,
  DeviceStatus,
} from '../types/device';

const STORAGE_KEY = '@phone-store:devices';

export function getDevices(): Device[] {
  try {
    const storedDevices = localStorage.getItem(STORAGE_KEY);

    if (!storedDevices) {
      return [];
    }

    const devices = JSON.parse(storedDevices);

    return Array.isArray(devices) ? devices : [];
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    return [];
  }
}

export function getDeviceById(
  deviceId: string,
): Device | undefined {
  return getDevices().find(
    (device) => device.id === deviceId,
  );
}

export function saveDevice(device: Device): void {
  const devices = getDevices();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...devices, device]),
  );
}

export function updateDevice(
  updatedDevice: Device,
): Device | undefined {
  const devices = getDevices();

  const deviceExists = devices.some(
    (device) => device.id === updatedDevice.id,
  );

  if (!deviceExists) {
    return undefined;
  }

  const updatedDevices = devices.map((device) =>
    device.id === updatedDevice.id
      ? updatedDevice
      : device,
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedDevices),
  );

  return updatedDevice;
}

export function deviceExistsByImei(
  imei: string,
  ignoredDeviceId?: string,
): boolean {
  return getDevices().some(
    (device) =>
      device.imei === imei &&
      device.id !== ignoredDeviceId,
  );
}

export function updateDeviceStatus(
  deviceId: string,
  status: DeviceStatus,
): Device | undefined {
  const device = getDeviceById(deviceId);

  if (!device) {
    return undefined;
  }

  return updateDevice({
    ...device,
    status,
  });
}

export function deleteDevice(
  deviceId: string,
): void {
  const updatedDevices = getDevices().filter(
    (device) => device.id !== deviceId,
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedDevices),
  );
}
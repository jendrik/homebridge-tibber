import type { Logger, PlatformConfig } from 'homebridge';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';

export interface TibberDeviceConfig {
  name: string;
  id: string;
  level: PriceLevel;
}

export interface ResolvedTibberPlatformConfig {
  apiKey?: string;
  devices: TibberDeviceConfig[];
}

type ConfigLogger = Pick<Logger, 'error' | 'warn'>;

const PRICE_LEVELS = new Set<string>(Object.values(PriceLevel));

function readRequiredString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPriceLevel(value: unknown): PriceLevel | undefined {
  if (typeof value !== 'string' || !PRICE_LEVELS.has(value)) {
    return undefined;
  }

  return value as PriceLevel;
}

export function resolveTibberPlatformConfig(config: PlatformConfig, log: ConfigLogger): ResolvedTibberPlatformConfig {
  const apiKey = readRequiredString(config.apiKey);
  if (apiKey === undefined) {
    log.error('Tibber API key is required; no Tibber accessories will be created.');
    return {
      devices: [],
    };
  }

  if (!Array.isArray(config.devices)) {
    log.warn('Tibber devices must be configured as an array; no Tibber accessories will be created.');
    return {
      apiKey,
      devices: [],
    };
  }

  const devices: TibberDeviceConfig[] = [];

  config.devices.forEach((device, index) => {
    const name = readRequiredString(device?.name);
    const id = readRequiredString(device?.id);
    const level = readPriceLevel(device?.level);

    if (name === undefined || id === undefined || level === undefined) {
      log.warn(`Skipping invalid Tibber device at index ${index}; name, id, and supported level are required.`);
      return;
    }

    devices.push({ name, id, level });
  });

  return {
    apiKey,
    devices,
  };
}

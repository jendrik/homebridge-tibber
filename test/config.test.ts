import { describe, expect, it, vi } from 'vitest';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel.js';
import type { PlatformConfig } from 'homebridge';

import { resolveTibberPlatformConfig } from '../src/config.js';

function logger() {
  return {
    error: vi.fn(),
    warn: vi.fn(),
  };
}

describe('resolveTibberPlatformConfig', () => {
  it('accepts valid configured devices', () => {
    const log = logger();
    const config = {
      apiKey: 'token',
      devices: [
        { name: 'Cheap power', id: 'home-1', level: 'CHEAP' },
        { name: 'Normal power', id: 'home-2', level: 'NORMAL' },
      ],
    } as PlatformConfig;

    const result = resolveTibberPlatformConfig(config, log);

    expect(result.apiKey).toBe('token');
    expect(result.devices).toEqual([
      { name: 'Cheap power', id: 'home-1', level: PriceLevel.CHEAP },
      { name: 'Normal power', id: 'home-2', level: PriceLevel.NORMAL },
    ]);
    expect(log.error).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('reports missing apiKey and returns no devices', () => {
    const log = logger();
    const config = {
      devices: [
        { name: 'Cheap power', id: 'home-1', level: 'CHEAP' },
      ],
    } as PlatformConfig;

    const result = resolveTibberPlatformConfig(config, log);

    expect(result.apiKey).toBeUndefined();
    expect(result.devices).toEqual([]);
    expect(log.error).toHaveBeenCalledWith('Tibber API key is required; no Tibber accessories will be created.');
  });

  it('warns and returns no devices when devices is missing', () => {
    const log = logger();
    const config = { apiKey: 'token' } as PlatformConfig;

    const result = resolveTibberPlatformConfig(config, log);

    expect(result.apiKey).toBe('token');
    expect(result.devices).toEqual([]);
    expect(log.warn).toHaveBeenCalledWith('Tibber devices must be configured as an array; no Tibber accessories will be created.');
  });

  it('skips invalid device entries', () => {
    const log = logger();
    const config = {
      apiKey: 'token',
      devices: [
        { name: 'Valid', id: 'home-1', level: 'EXPENSIVE' },
        { name: '', id: 'home-2', level: 'NORMAL' },
        { name: 'Missing id', level: 'NORMAL' },
        { name: 'Bad level', id: 'home-4', level: 'UNKNOWN' },
      ],
    } as PlatformConfig;

    const result = resolveTibberPlatformConfig(config, log);

    expect(result.devices).toEqual([
      { name: 'Valid', id: 'home-1', level: PriceLevel.EXPENSIVE },
    ]);
    expect(log.warn).toHaveBeenCalledTimes(3);
  });
});

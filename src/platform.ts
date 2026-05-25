import { Characteristic, Service, uuid } from 'homebridge';
import type { API, AccessoryPlugin, Logger, PlatformConfig, StaticPlatformPlugin } from 'homebridge';

import type { IConfig } from 'tibber-api';

import { TibberAccessory } from './accessory.js';
import { resolveTibberPlatformConfig } from './config.js';

export class TibberPlatform implements StaticPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly uuid: typeof uuid;

  public readonly tibberConfig: IConfig;

  private readonly devices: TibberAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.uuid = this.api.hap.uuid;

    const resolvedConfig = resolveTibberPlatformConfig(config, log);

    // Config object needed when instantiating TibberQuery
    this.tibberConfig = {
      active: true,
      apiEndpoint: {
        apiKey: resolvedConfig.apiKey ?? '',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
      },
    };

    resolvedConfig.devices.forEach((device) => {
      this.devices.push(new TibberAccessory(this, device));
    });

    api.on('shutdown', () => {
      this.devices.forEach((device) => {
        device.shutdown();
      });
    });

    log.info(`Finished initializing Tibber platform with ${this.devices.length} accessory/accessories.`);
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(this.devices);
  }
}

import { API, StaticPlatformPlugin, Logger, PlatformConfig, AccessoryPlugin, Service, Characteristic, uuid, AccessoryConfig } from 'homebridge';

import { IConfig } from 'tibber-api';

import { TibberAccessory } from './accessory';

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

    // Config object needed when instantiating TibberQuery
    this.tibberConfig = {
      active: true,
      apiEndpoint: {
        apiKey: config.apiKey,
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
      },
    };

    // read devices
    config.devices.forEach((element: AccessoryConfig) => {
      if (element.name !== undefined && element.id !== undefined) {
        this.devices.push(new TibberAccessory(this, element));
      }
    });

    log.info('finished initializing!');
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(this.devices);
  }
}

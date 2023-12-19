import { API, StaticPlatformPlugin, Logger, PlatformConfig, AccessoryPlugin, Service, Characteristic, uuid } from 'homebridge';

import { IConfig } from 'tibber-api';

import { TibberAccessory } from './accessory';


export class TibberPlatform implements StaticPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly uuid: typeof uuid = this.api.hap.uuid;

  public readonly fakeGatoHistoryService;

  public readonly tibberConfig: IConfig;

  private readonly devices: TibberAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    // Config object needed when instantiating TibberQuery
    this.tibberConfig = {
      active: true,
      apiEndpoint: {
        apiKey: config.apiKey,
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
      },
    };

    // read homes
    config.homes.forEach(element => {
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

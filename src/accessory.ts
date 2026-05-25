import { Service } from 'homebridge';
import type { AccessoryPlugin } from 'homebridge';

import { TibberQuery } from 'tibber-api';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';

import type { TibberDeviceConfig } from './config.js';
import { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DISPLAY_NAME } from './settings.js';

import type { TibberPlatform } from './platform.js';

const PRICE_UPDATE_INTERVAL_MS = 60 * 1000;

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return String(error);
}

export class TibberAccessory implements AccessoryPlugin {
  private readonly uuid_base: string;
  private readonly name: string;
  private readonly homeID: string;
  private readonly level: PriceLevel;
  private readonly displayName: string;

  private readonly tibberQuery: TibberQuery;

  private readonly contactSensorService: Service;

  private readonly informationService: Service;

  private readonly updateInterval: NodeJS.Timeout;

  constructor(
    private readonly platform: TibberPlatform,
    private readonly config: TibberDeviceConfig,
  ) {
    this.name = config.name;
    this.homeID = config.id;
    this.level = config.level;
    this.uuid_base = platform.uuid.generate(PLUGIN_NAME + '-' + this.name + '-' + this.homeID);
    this.displayName = this.uuid_base;

    this.tibberQuery = new TibberQuery(this.platform.tibberConfig);

    this.informationService = new platform.Service.AccessoryInformation()
      .setCharacteristic(platform.Characteristic.Name, this.name)
      .setCharacteristic(platform.Characteristic.Identify, this.name)
      .setCharacteristic(platform.Characteristic.Manufacturer, '@jendrik')
      .setCharacteristic(platform.Characteristic.Model, PLUGIN_DISPLAY_NAME)
      .setCharacteristic(platform.Characteristic.SerialNumber, this.displayName)
      .setCharacteristic(platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);

    this.contactSensorService = new platform.Service.ContactSensor(this.name);

    void this.updateCurrentEnergyPrice();

    this.updateInterval = setInterval(() => {
      void this.updateCurrentEnergyPrice();
    }, PRICE_UPDATE_INTERVAL_MS);
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.contactSensorService,
    ];
  }

  shutdown(): void {
    clearInterval(this.updateInterval);
  }

  async updateCurrentEnergyPrice(): Promise<void> {
    let level: PriceLevel;
    try {
      const result = await this.tibberQuery.getCurrentEnergyPrice(this.homeID);
      level = result.level ?? PriceLevel.NORMAL;
      this.platform.log.info(`Energy Level: ${level}`);
    } catch (error) {
      level = PriceLevel.NORMAL;
      this.platform.log.error(`Tibber energy price update failed for "${this.name}": ${formatError(error)}`);
      this.platform.log.warn('Resetting Energy Level Price to Normal');
    }

    this.contactSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(
      level === this.level ?
        this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
        this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
  }
}

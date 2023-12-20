import { AccessoryConfig, AccessoryPlugin, Service } from 'homebridge';

import { TibberQuery } from 'tibber-api';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';

import { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DISPLAY_NAME } from './settings';

import { TibberPlatform } from './platform';

export class TibberAccessory implements AccessoryPlugin {
  private readonly uuid_base: string;
  private readonly name: string;
  private readonly homeID: string;
  private readonly level: PriceLevel;
  private readonly displayName: string;

  private readonly tibberQuery: TibberQuery;

  private readonly contactSensorService: Service;

  private readonly informationService: Service;

  constructor(
    private readonly platform: TibberPlatform,
    private readonly config: AccessoryConfig,
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

    // update price every minute
    setInterval(async () => {
      await this.updateCurrentEnergyPrice();
    }, 60 * 1000);
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.contactSensorService,
    ];
  }

  async updateCurrentEnergyPrice() {
    let level: PriceLevel;
    try {
      const result = await this.tibberQuery.getCurrentEnergyPrice(this.homeID);
      level = result.level;
      this.platform.log.info(`Energy Level: ${result.level}`);
    } catch (error) {
      level = PriceLevel.NORMAL;
      this.platform.log.error(`Error: ${JSON.stringify(error)}`);
      this.platform.log.warn('Resetting Energy Level Price to Normal');
    }

    this.contactSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(
      level === this.level ?
        this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
        this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
  }
}
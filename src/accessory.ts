import { AccessoryConfig, AccessoryPlugin, Service } from 'homebridge';

import { TibberQuery } from 'tibber-api';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';

import { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DISPLAY_NAME } from './settings';

import { TibberPlatform } from './platform';

export class TibberAccessory implements AccessoryPlugin {
  private readonly uuid_base: string;
  private readonly name: string;
  private readonly homeID: string;
  private readonly displayName: string;

  private readonly tibberQuery: TibberQuery;

  private readonly veryCheapService: Service;
  private readonly cheapService: Service;
  private readonly normalService: Service;
  private readonly expensiveService: Service;
  private readonly veryExpensiveService: Service;

  private readonly informationService: Service;

  constructor(
    private readonly platform: TibberPlatform,
    private readonly config: AccessoryConfig,
  ) {
    this.name = config.name;
    this.homeID = config.id;
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

    this.veryCheapService = new platform.Service.ContactSensor(this.name + ' @ Very Cheap  Energy');
    this.cheapService = new platform.Service.ContactSensor(this.name + ' @ Cheap  Energy');
    this.normalService = new platform.Service.ContactSensor(this.name + ' @ Normal  Energy');
    this.expensiveService = new platform.Service.ContactSensor(this.name + ' @ Expensive Energy');
    this.veryExpensiveService = new platform.Service.ContactSensor(this.name + ' @ Very Expensive Energy');

    // update price every minute
    setInterval(async () => {
      this.updateCurrentEnergyPrice();
    }, 60 * 1000);
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.veryCheapService,
      this.cheapService,
      this.normalService,
      this.expensiveService,
      this.veryExpensiveService,
    ];
  }

  async updateCurrentEnergyPrice() {
    const result = await this.tibberQuery.getCurrentEnergyPrice(this.config.homeID);
    this.platform.log.info(`Energy Level: ${result.level}`);
    
    this.veryCheapService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(result.level == PriceLevel.VERY_CHEAP ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    this.cheapService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(result.level == PriceLevel.CHEAP ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    this.normalService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(result.level == PriceLevel.NORMAL ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    this.expensiveService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(result.level == PriceLevel.EXPENSIVE ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    this.veryExpensiveService.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(result.level == PriceLevel.VERY_EXPENSIVE ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
  }
}
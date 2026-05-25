import { readFileSync } from 'node:fs';

interface PackageMetadata {
  displayName: string;
  version: string;
}

const packageMetadata = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as PackageMetadata;

/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'tibber';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-' + PLATFORM_NAME;
export const PLUGIN_DISPLAY_NAME = packageMetadata.displayName;
export const PLUGIN_VERSION = packageMetadata.version;

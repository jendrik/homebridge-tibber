# Homebridge 2 Modernization Design

## Context

`@jendrik/homebridge-tibber` is a small static Homebridge platform plugin. It creates configured contact sensors that indicate whether the current Tibber energy price level matches each configured level.

Homebridge 2 has shipped and now requires an ESM-compatible plugin runtime on Node 22 or Node 24. The plugin already declares `"type": "module"` and the current working tree has local TypeScript imports updated to include `.js` extensions, but package metadata still targets Homebridge 1 and Node 18/20/22. `src/settings.ts` still reads `package.json` via CommonJS `require()`, which should be removed for a Homebridge 2-only ESM package.

## Goals

- Make the plugin explicitly Homebridge 2-only.
- Keep the plugin as a static platform.
- Preserve the existing user-facing configuration shape.
- Update dependencies and package metadata for the current Homebridge 2 runtime.
- Remove remaining CommonJS usage from source code.
- Harden startup config handling and Tibber polling cleanup.
- Verify lint, build, package contents, and plugin load behavior where practical.

## Non-Goals

- Do not migrate to a dynamic platform.
- Do not add Tibber home discovery.
- Do not change the HomeKit service model away from configured contact sensors.
- Do not add Matter-specific behavior in this pass.
- Do not redesign the configuration UI beyond schema correctness and validation improvements.

## Architecture

The plugin remains a static platform named `tibber`.

`src/index.ts` remains the entry point and registers `TibberPlatform` with Homebridge.

`src/platform.ts` owns Homebridge API references, constructs the Tibber API configuration from plugin config, validates configured devices, and returns configured accessories from `accessories()`.

`src/accessory.ts` owns one configured sensor. It creates the accessory information service, contact sensor service, Tibber query client, and polling loop. Each poll calls Tibber for the current energy price and updates `ContactSensorState` to detected when the returned price level equals the configured level.

## Package And Runtime

The package should advertise the runtime it is designed for:

- `engines.homebridge`: `^2.0.0`
- `engines.node`: `^22 || ^24`
- `devDependencies.homebridge`: current Homebridge 2 release

The package remains ESM-only through `"type": "module"`. Source code should avoid `require()`. Package metadata needed at runtime should come from an ESM-safe path, such as a JSON import supported by the selected TypeScript module settings or an explicit generated/static metadata export.

The implementation should keep existing `.js` extensions on local TypeScript imports because the emitted JavaScript runs as ESM.

## Dependencies

Update dependencies deliberately rather than by accepting every latest major version:

- Update `homebridge` to current Homebridge 2.
- Update `tibber-api` to latest `5.x`.
- Update TypeScript, ESLint, `typescript-eslint`, `rimraf`, `nodemon`, and Node type declarations to current compatible versions.
- Remove `homebridge-lib` unless implementation inspection finds an actual import or runtime need.

Avoid adopting unrelated tooling changes unless the update is required by Homebridge 2, Node 22/24, or the current lint/build toolchain.

## Configuration

The public config shape remains:

- `apiKey`
- `devices[].name`
- `devices[].id`
- `devices[].level`

The JSON schema should mark required properties in valid JSON Schema locations:

- `apiKey` is required at the root schema level.
- `devices` is required at the root schema level.
- `name`, `id`, and `level` are required inside each device item.
- `level` remains constrained to Tibber price levels: `VERY_CHEAP`, `CHEAP`, `NORMAL`, `EXPENSIVE`, and `VERY_EXPENSIVE`.

Runtime validation should avoid opaque startup crashes:

- Missing `apiKey` logs a clear configuration error and avoids creating accessories that cannot query Tibber.
- Missing or non-array `devices` logs a warning and returns no accessories.
- Invalid device entries are skipped with a warning that identifies the entry.
- Unsupported price levels are skipped rather than passed into accessory construction.

## Polling Lifecycle

Each accessory should poll Tibber periodically as it does today. The polling interval remains one minute unless implementation discovers a Tibber API recommendation that requires a different default.

The interval handle must be stored and cleared on Homebridge shutdown. `TibberPlatform` can subscribe once to `api.on('shutdown', ...)` and ask all accessories to stop, or each accessory can register its own shutdown handler. The preferred shape is platform-owned shutdown coordination because it keeps Homebridge lifecycle wiring in the platform.

Accessories should perform an initial update soon after construction so HomeKit does not wait a full minute for the first meaningful state.

## Error Handling

Tibber API failures should not crash Homebridge. On failure, the accessory should:

- Log a useful error message, preserving `Error.message` when available.
- Fall back to `PriceLevel.NORMAL`, matching current behavior.
- Update the contact sensor based on that fallback level.

The implementation should avoid `JSON.stringify(error)` as the only error formatting because many JavaScript `Error` objects stringify to `{}`.

## Verification

Run these checks after implementation:

- `npm run lint`
- `npm run build`
- `npm pack --dry-run`
- A minimal local Homebridge startup/load check with a temporary config, if practical after dependency updates.

The load check should verify that Homebridge can import the ESM entry point, register the static platform, and reach plugin startup far enough to validate config without crashing on import.

## Migration Notes

Existing Homebridge 1 users will need to upgrade Homebridge and Node before installing this version. This is intentional for the Homebridge 2-only release.

Existing Homebridge 2 users should not need to change plugin configuration. Their configured Tibber price-level contact sensors should keep the same visible behavior.

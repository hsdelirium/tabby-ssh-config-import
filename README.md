# tabby-ssh-config-import

An AI-generated [Tabby](https://tabby.sh) terminal plugin for bulk importing SSH profiles from `~/.ssh/config` into Tabby's profile list.

## Features

- Reads hosts from Tabby's built-in SSH config importer (`~/.ssh/config`)
- Shows only hosts that are **not yet saved** as Tabby profiles (deduplication by host address)
- Editable **Hostname** and **IP/Host** fields per row before importing
- **Group** selector with option to create a new group inline
- **Icon** picker with recently used icons, manual name input, and a full FontAwesome Free gallery with search
- **Color** picker with rainbow presets, black & white, and custom HEX input
- Checkboxes for selecting individual hosts; **Add selected** and **Add all** buttons
- After import, imported rows are removed from the list and a success message is shown

## Screenshots

The plugin adds a new **SSH Config Import** entry to the Settings sidebar (under Profiles & connections).

## Installation

### From dist (pre-built)

1. Create the plugin directory:
   ```
   %APPDATA%\tabby\plugins\node_modules\tabby-ssh-config-import\
   ```
2. Copy `dist\` folder and `package.json` into it.
3. Restart Tabby.

### From npm (when published)

Open Tabby → Settings → Plugins, search for `tabby-ssh-config-import` and install.

## Building from source

### Prerequisites

- Node.js 18+
- npm 9+

### Steps

```bash
# 1. Clone or download the source
cd tabby-ssh-config-import

# 2. Install dependencies
#    --legacy-peer-deps is required because tabby-settings pulls in Angular 15
#    peer deps that conflict with the locally resolved TypeScript version.
#    This is safe: all Tabby packages are externals and are not bundled.
npm install --legacy-peer-deps

# 3. Build
npm run build
```

The output will be in `dist/index.js`.

### Project structure

```
tabby-ssh-config-import/
├── src/
│   ├── index.ts             # NgModule — registers the settings tab provider
│   ├── settingsTab.ts       # SettingsTabProvider — adds the sidebar entry
│   ├── importComponent.ts   # Main Angular component with all UI logic
│   └── faIcons.ts           # FontAwesome Free 6 icon name list (~230 icons)
├── dist/                    # Build output (generated)
├── package.json
├── tsconfig.json
└── webpack.config.js
```

### How it works

Tabby already parses `~/.ssh/config` via its built-in `OpenSSHImporter` and exposes the hosts as builtin profiles in the group `"Imported from .ssh/config"`. This plugin reads those profiles via `ProfilesService.getProfiles({ includeBuiltin: true })`, filters out any whose `options.host` is already present among saved (non-builtin) SSH profiles, and presents the remainder in an editable table for bulk import.

All Tabby packages (`tabby-core`, `tabby-settings`, `@angular/*`) are declared as webpack `externals` and are **not** bundled — they are provided at runtime by the host Tabby application.

## License

MIT

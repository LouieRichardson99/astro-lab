# Astrolab UI

Astrolab UI is an Astro integration that brings an isolated UI development tool into your Astro environment. Astrolab brings all your repositories Astro components into one place where you can view and modify your props and slots on the fly.

## ✨ Features

- Zero-config: just add the integration and start your dev server
- Automatic discovery of your Astro components
- Live prop + slot playground per component
- Hot reload of component metadata when you edit components
- Optional global stylesheets & scripts injection for consistent preview styling

## 📦 Installation

Install as a dev dependency (recommended):

```bash
npm i -D astrolab-ui
# or
pnpm add -D astrolab-ui
# or
yarn add -D astrolab-ui
```

### Compatibility

- Astro 5.x and up
- SSG and SSR projects (Astrolab UI only runs in development so we won't interfere with your deployment approach)

## 🛠 Usage

Register the integration in your `astro.config.mjs` (or `.ts`).

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import astrolab from 'astrolab-ui';

export default defineConfig({
  integrations: [
    astrolab({
      // Optional
      componentsDir: 'src/components',
      stylesheets: ['/src/styles/global.css'],
      scripts: ['/src/script.js']
    })
  ]
});
```

Run your dev server:

```bash
npm run dev
```

Open Astrolab UI either by:

- Clicking the icon in the Astro Dev Toolbar, or
- Visiting `/_astrolab` directly

### Supplying JSON Data (Labs)

You can prefill and keep your component playground data in simple JSON "lab" files.

Where to put lab files

- Create files under `src/labs` in your Astro project.
- One file per component, named exactly after the component file name.
  - Example: `src/components/Button.astro` → `src/labs/Button.json`.

**Schema**

- A lab file supports two top-level keys:
  - `props`: JSON object of prop values to pass to the component.
  - `slots`: JSON object of slot contents. Keys are slot names; values should be strings (HTML allowed). Use `"default"` for the default slot.

**Example**

```json
{
  "props": {
    "variant": "primary",
    "disabled": false,
    "label": "Click me"
  },
  "slots": {
    "default": "<strong>Click me</strong>"
  }
}
```

**Notes**

- `props` values must be valid JSON. Complex objects/arrays are supported.
- `slots` values are rendered as HTML.

## ⚙️ Options

| Option          | Type       | Default            | Description                                                                                                                            |
| --------------- | ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `componentsDir` | `string`   | `'src/components'` | Root (relative to project) scanned for `.astro` component files.                                                                       |
| `stylesheets`   | `string[]` | `[]`               | List of stylesheet paths or absolute `http(s)` URLs to inject into the preview document `<head>`. Useful for global and reset styling. |
| `scripts`       | `string[]` | `[]`               | List of script paths or absolute URLs injected at the bottom of the `<body>` element in the preview document.                          |

## 👷🏻‍♂️ Contributions

Contributions to Astrolab UI are always welcome and appreciated! Please feel free to open issues or pull requests for bugs and features.

## 📃 License

Astrolab UI is licensed under the [MIT License](https://github.com/LouieRichardson99/astrolab-ui/blob/main/LICENSE).

Made by [Louie Richardson](https://louierichardson.com) 👨🏻‍🚀

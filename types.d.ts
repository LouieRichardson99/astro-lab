/// <reference types="astro/client" />
/// <reference types="vite/client" />

declare module 'virtual:astrolab-stylesheets' {
  export const stylesheets: string[];
}

declare module 'virtual:astrolab-scripts' {
  export const scripts: string[];
}

declare module 'virtual:astrolab-component-files' {
  export const componentFiles: { id: string; name: string; path: string }[];
}

declare module 'virtual:astrolab-component-modules' {
  export const componentModules: Record<string, () => Promise<any>>;
}

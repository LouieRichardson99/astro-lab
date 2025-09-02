import type { AstroIntegration } from 'astro';
import path from 'path';
import potionIcon from './icons/potion.svg?raw';

export interface AstrolabOptions {
  stylesheets?: string[];
  scripts?: string[];
  componentsDir?: string;
}

let origin: string | null = null;

export default function (options: AstrolabOptions): AstroIntegration {
  const stylesheets = (options?.stylesheets || []).map(normaliseResourcePath);
  const scripts = (options?.scripts || []).map(normaliseResourcePath);
  const componentsDir = (options?.componentsDir || 'src/components')
    // Normalize componentsDir to a root-relative path without leading './'
    .replace(/^\.\//, '')
    .replace(/^\//, '');

  return {
    name: 'astrolab',
    hooks: {
      'astro:config:setup': ({
        injectRoute,
        addDevToolbarApp,
        command,
        updateConfig
      }) => {
        // Currently only supports development mode
        if (command !== 'dev') return;

        // Page Routes
        injectRoute({
          pattern: '/_astrolab',
          entrypoint: 'astrolab/src/pages/index.astro'
        });
        injectRoute({
          pattern: '/_astrolab/preview',
          entrypoint: 'astrolab/src/pages/preview.astro'
        });

        // API Routes
        injectRoute({
          pattern: '/_astrolab/api/component',
          entrypoint: 'astrolab/src/api/component.ts'
        });

        // Dev Toolbar
        addDevToolbarApp({
          id: 'astrolab',
          name: 'Astrolab',
          icon: potionIcon,
          entrypoint: new URL('./toolbar-app.ts', import.meta.url)
        });

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'astrolab-stylesheets-plugin',
                resolveId(id: string) {
                  if (id === 'virtual:astrolab-stylesheets') return id;
                },
                load(id: string) {
                  if (id === 'virtual:astrolab-stylesheets') {
                    return `export const stylesheets = ${JSON.stringify(
                      stylesheets
                    )};`;
                  }
                }
              },
              {
                name: 'astrolab-scripts-plugin',
                resolveId(id: string) {
                  if (id === 'virtual:astrolab-scripts') return id;
                },
                load(id: string) {
                  if (id === 'virtual:astrolab-scripts') {
                    return `export const scripts = ${JSON.stringify(scripts)};`;
                  }
                }
              },
              {
                name: 'astrolab-component-modules-plugin',
                resolveId(id: string) {
                  if (id === 'virtual:astrolab-component-modules') return id;
                },
                load(id: string) {
                  if (id === 'virtual:astrolab-component-modules') {
                    return `export const componentModules = import.meta.glob('/${componentsDir}/**/*.astro');`;
                  }
                }
              }
            ],
            server: {
              watch: {
                ignored: [
                  '**/astrolab/data/component-*.json',
                  '**/astrolab/data/state.json'
                ]
              }
            }
          }
        });
      },
      'astro:server:setup': ({ server }) => {
        const resolvedComponentsDir = path.resolve(
          server.config.root,
          componentsDir
        );

        const isComponentFile = (file: string) =>
          file.endsWith('.astro') &&
          (file === resolvedComponentsDir ||
            file.startsWith(resolvedComponentsDir + path.sep));

        const invalidateIfComponent = (file: string) => {
          if (isComponentFile(file)) {
            if (!origin) return;

            fetch(origin + '/_astrolab/api/component', {
              method: 'POST',
              body: JSON.stringify({
                component: path.basename(file, '.astro')
              })
            }).catch(() => {});
          }
        };

        // Refresh component data file when component is modified
        server.watcher.on('add', invalidateIfComponent);
        server.watcher.on('change', invalidateIfComponent);
        server.watcher.on('unlink', invalidateIfComponent);
      },
      'astro:server:start': ({ address }) => {
        origin = 'http://localhost:' + address.port;
      }
    }
  };
}

function normaliseResourcePath(p: string) {
  if (/^https?:\/\//.test(p)) return p; // leave absolute URLs

  p = p.replace(/^\.\//, '');

  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  return p;
}

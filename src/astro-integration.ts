import type { AstroIntegration } from 'astro';
import pathe from 'pathe';
import potionIcon from './icons/potion.svg?raw';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  existsSync,
  writeFileSync
} from 'fs';
import prettyConsoleLog from './utils/prettyConsoleLog';
import fg from 'fast-glob';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';

export interface AstrolabOptions {
  stylesheets?: string[];
  scripts?: string[];
  componentsDir?: string;
}

let origin: string | null = null;

export default function (options?: AstrolabOptions): AstroIntegration {
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
        addMiddleware,
        command,
        updateConfig
      }) => {
        // Currently only supports development mode
        if (command !== 'dev') return;

        // Page Routes
        injectRoute({
          pattern: '/_astrolab',
          entrypoint: 'astrolab-ui/src/pages/index.astro'
        });
        injectRoute({
          pattern: '/_astrolab/preview',
          entrypoint: 'astrolab-ui/src/pages/preview.astro'
        });

        // API Routes
        injectRoute({
          pattern: '/_astrolab/api/component',
          entrypoint: 'astrolab-ui/src/api/component.ts'
        });

        // Middleware
        addMiddleware({
          entrypoint: fileURLToPath(
            new URL('./middleware.ts', import.meta.url)
          ),
          order: 'pre'
        });

        // Dev Toolbar
        addDevToolbarApp({
          id: 'astrolab',
          name: 'Astrolab',
          icon: potionIcon,
          entrypoint: fileURLToPath(
            new URL('./toolbar-app.ts', import.meta.url)
          )
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
                name: 'astrolab-component-files-plugin',
                resolveId(id: string) {
                  if (id === 'virtual:astrolab-component-files') return id;
                },
                async load(id: string) {
                  if (id === 'virtual:astrolab-component-files') {
                    const files = await fg(
                      pathe.relative(process.cwd(), componentsDir) +
                        '/**/*.astro'
                    );

                    const existingIdByPath: Record<string, string> = {};
                    const dataDir = fileURLToPath(
                      new URL('../data', import.meta.url)
                    );

                    if (existsSync(dataDir)) {
                      const dataFiles = readdirSync(dataDir).filter(
                        (f) => f.startsWith('component-') && f.endsWith('.json')
                      );

                      for (const df of dataFiles) {
                        try {
                          const json = JSON.parse(
                            readFileSync(pathe.join(dataDir, df), 'utf-8')
                          );

                          if (json?.component?.path && json?.id) {
                            existingIdByPath[json.component.path] = json.id;
                          }
                        } catch {}
                      }
                    }

                    const components = files.map((file) => {
                      const abs = pathe.resolve(file);
                      const existingId = existingIdByPath[abs];
                      const id =
                        existingId ||
                        `component-${crypto.randomBytes(8).toString('hex')}`;

                      return {
                        id,
                        name: pathe.basename(file, '.astro'),
                        path: abs
                      };
                    });

                    return `
                      export const componentFiles = ${JSON.stringify(
                        components
                      )};
                    `;
                  }
                }
              },
              {
                name: 'astrolab-component-modules-plugin',
                resolveId(id: string) {
                  if (id === 'virtual:astrolab-component-modules') return id;
                },
                async load(id: string) {
                  if (id === 'virtual:astrolab-component-modules') {
                    const files = await fg(`${componentsDir}/**/*.astro`);

                    const entries = files
                      .map((file) => {
                        const name = pathe.basename(file, '.astro');
                        const importPath = file.startsWith('/')
                          ? file
                          : '/' + file;
                        return `\n  '${name}': async () => (await import('${importPath}')).default`;
                      })
                      .join(',');

                    return `export const componentModules = {${entries}\n};`;
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
        const __dirname = pathe.dirname(new URL(import.meta.url).pathname);
        mkdirSync(pathe.resolve(__dirname, '../data'), { recursive: true }); // Create data directory on first run

        const resolvedComponentsDir = pathe.resolve(
          server.config.root,
          componentsDir
        );

        const isComponentFile = (file: string) =>
          file.endsWith('.astro') &&
          (file === resolvedComponentsDir ||
            file.startsWith(resolvedComponentsDir + pathe.sep));

        function invalidateIfComponent(
          file: string,
          event: 'add' | 'change' | 'unlink'
        ) {
          if (!isComponentFile(file)) return;

          invalidateVirtualModules(
            [
              'virtual:astrolab-component-files',
              'virtual:astrolab-component-modules'
            ],
            server
          );

          if (event === 'unlink') {
            clearCurrentComponentState(); // If a component file was deleted, clear the current selection so stale state isn't referenced.
          }

          prettyConsoleLog(
            `Astrolab component ${event}: ${pathe.basename(file)}`
          );
        }

        // Refresh component data file when component is modified
        server.watcher.on('add', (f) => invalidateIfComponent(f, 'add'));
        server.watcher.on('change', (f) => invalidateIfComponent(f, 'change'));
        server.watcher.on('unlink', (f) => invalidateIfComponent(f, 'unlink'));
      },
      'astro:server:start': ({ address }) => {
        origin = 'http://localhost:' + address.port;

        prettyConsoleLog(`Astrolab available at ${origin}/_astrolab`);
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

function invalidateVirtualModules(ids: string[], server: ViteDevServer) {
  if (!server) return;

  for (const id of ids) {
    const mod = server.moduleGraph.getModuleById(id);
    if (mod) server.moduleGraph.invalidateModule(mod);
  }

  server.ws.send({ type: 'full-reload' });
}

function clearCurrentComponentState() {
  const stateFile = fileURLToPath(
    new URL('../data/state.json', import.meta.url)
  );

  if (existsSync(stateFile)) {
    writeFileSync(stateFile, JSON.stringify({ currentComponentId: null }));
  }
}

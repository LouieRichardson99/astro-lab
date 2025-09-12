import type { AstroIntegration } from 'astro';
import pathe from 'pathe';
import potionIcon from './icons/potion.svg?raw';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import prettyConsoleLog from './utils/prettyConsoleLog';
import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';
import astrolabScriptsPlugin from './plugins/vite/astrolab-scripts-plugin';
import astrolabStylesheetsPlugin from './plugins/vite/astrolab-stylesheets-plugin';
import astrolabComponentModulesPlugin from './plugins/vite/astrolab-component-modules';
import astrolabComponentFilesPlugin from './plugins/vite/astrolab-component-files-plugin';
import getComponentProperties from './lib/getComponentProperties';
import getComponentSlots from './lib/getComponentSlots';
import getComponentDefaults from './lib/getComponentDefaults';
import getExistingComponentId from './utils/getExistingComponentId';
import deleteCurrentComponentId from './utils/deleteCurrentComponentId';

export interface AstrolabOptions {
  stylesheets?: string[];
  scripts?: string[];
  componentsDir?: string;
  excludedComponents?: string[];
}

let origin: string | null = null;
const __dirname = pathe.dirname(new URL(import.meta.url).pathname);

export default function (options?: AstrolabOptions): AstroIntegration {
  const stylesheets = (options?.stylesheets || []).map(normaliseResourcePath);
  const scripts = (options?.scripts || []).map(normaliseResourcePath);
  const componentsDir = (options?.componentsDir || 'src/components')
    // Normalize componentsDir to a root-relative path without leading './'
    .replace(/^\.\//, '')
    .replace(/^\//, '');
  const excludedComponents = options?.excludedComponents || [];

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
          entrypoint: 'astrolab-ui/src/api/component/index.ts'
        });
        injectRoute({
          pattern: '/_astrolab/api/component/content',
          entrypoint: 'astrolab-ui/src/api/component/content.ts'
        });
        injectRoute({
          pattern: '/_astrolab/api/component/schema',
          entrypoint: 'astrolab-ui/src/api/component/schema.ts'
        });
        injectRoute({
          pattern: '/_astrolab/api/cache',
          entrypoint: 'astrolab-ui/src/api/cache.ts'
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
              astrolabComponentModulesPlugin(componentsDir, excludedComponents),
              astrolabComponentFilesPlugin(componentsDir, excludedComponents),
              astrolabStylesheetsPlugin(stylesheets),
              astrolabScriptsPlugin(scripts)
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
        mkdirSync(pathe.resolve(__dirname, '../data'), { recursive: true }); // Create data directory on first run

        const resolvedComponentsDir = pathe.resolve(
          server.config.root,
          componentsDir
        );

        const resolvedLabsDir = pathe.resolve(server.config.root, 'src/labs');

        const frontmatterHashByPath = new Map<string, string>();

        const isComponentFile = (file: string) =>
          file.endsWith('.astro') &&
          (file === resolvedComponentsDir ||
            file.startsWith(resolvedComponentsDir + pathe.sep));

        const isLabFile = (file: string) =>
          file.endsWith('.json') &&
          (file === resolvedLabsDir ||
            file.startsWith(resolvedLabsDir + pathe.sep));

        async function invalidateIfComponent(
          path: string,
          event: 'add' | 'change' | 'unlink'
        ) {
          if (!isComponentFile(path)) return;

          let shouldReload = false;
          try {
            if (event === 'add' || event === 'change') {
              const src = readFileSync(path, 'utf-8');
              const newHash = getFrontmatterHash(src);
              const prevHash = frontmatterHashByPath.get(path);
              const frontmatterChanged =
                prevHash === undefined || prevHash !== newHash;

              frontmatterHashByPath.set(path, newHash);

              if (frontmatterChanged) {
                shouldReload = true;

                // Compute latest schema and defaults from the Astro frontmatter
                const props = getComponentProperties(src);
                const slots = getComponentSlots(src);
                const defaults = getComponentDefaults(src);

                const existingId = getExistingComponentId(undefined, path);

                if (existingId) {
                  // Load, merge, and persist the updated schema/content
                  const dataDir = pathe.resolve(__dirname, '../data');
                  const dataPath = pathe.join(dataDir, `${existingId}.json`);

                  try {
                    const currentData = JSON.parse(
                      readFileSync(dataPath, 'utf-8')
                    );

                    const next = {
                      ...currentData,
                      schema: {
                        props,
                        slots
                      },
                      content: {
                        props: {
                          ...defaults,
                          ...(currentData?.content?.props || {})
                        },
                        slots: {
                          ...(currentData?.content?.slots || {})
                        }
                      }
                    };

                    writeFileSync(dataPath, JSON.stringify(next, null, 2));
                  } catch {}
                }
              }
            }

            if (event === 'unlink') {
              deleteCurrentComponentId(); // If a component file was deleted, clear current selection.
              frontmatterHashByPath.delete(path);
              shouldReload = true;
            }
          } catch (err) {
            prettyConsoleLog(
              `Astrolab failed to refresh schema for ${pathe.basename(
                path
              )}: ${(err as Error).message}`,
              'error'
            );
          }

          if (shouldReload) {
            invalidateVirtualModules(
              [
                'virtual:astrolab-component-files',
                'virtual:astrolab-component-modules'
              ],
              server
            );
          }

          prettyConsoleLog(
            `Astrolab component ${event}: ${pathe.basename(path)}`
          );
        }

        // Refresh component data file when component is modified
        server.watcher.on('add', (path) => invalidateIfComponent(path, 'add'));
        server.watcher.on('change', (path) => {
          invalidateIfComponent(path, 'change');

          if (isLabFile(path)) {
            updateComponentContent(path);
          }
        });
        server.watcher.on('unlink', (path) =>
          invalidateIfComponent(path, 'unlink')
        );
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

/**
 * Invalidate virtual modules in the Vite development server and trigger a full page reload.
 * @param ids Array of module IDs to invalidate
 * @param server Vite development server instance
 */
function invalidateVirtualModules(ids: string[], server: ViteDevServer) {
  if (!server) return;

  for (const id of ids) {
    const mod = server.moduleGraph.getModuleById(id);
    if (mod) server.moduleGraph.invalidateModule(mod);
  }

  server.ws.send({ type: 'full-reload' });
}

/**
 * Extract and hash the frontmatter section of an Astro component file. (Used to detect changes in frontmatter)
 * @param src Source content of an Astro component file
 */
function getFrontmatterHash(src: string) {
  const frontmatter = src.match(/^---([\s\S]*?)---/)?.[1] || '';
  return createHash('md5').update(frontmatter).digest('hex');
}

/**
 * Update the content of a component data file based on its corresponding lab JSON file.
 * @param path Path to the lab JSON file
 */
function updateComponentContent(path: string) {
  const dataDir = pathe.resolve(__dirname, '../data');

  const name = pathe.basename(path, '.json');
  const existingId = getExistingComponentId(name, undefined);

  const dataPath = pathe.join(dataDir, `${existingId}.json`);

  if (!existingId) return;

  try {
    const labContent = JSON.parse(readFileSync(path, 'utf-8'));
    const currentData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    const next = {
      ...currentData,
      content: {
        props: {
          ...currentData?.content?.props,
          ...labContent.props
        },
        slots: {
          ...currentData?.content?.slots,
          ...labContent.slots
        }
      }
    };

    writeFileSync(dataPath, JSON.stringify(next, null, 2));

    prettyConsoleLog(`Astrolab lab updated: ${name}`);
  } catch (err) {
    prettyConsoleLog(`Astrolab failed to update lab for ${name}`, 'error');
  }
}

import type { AstroIntegration } from 'astro';
import path from 'path';
import potionIcon from './icons/potion.svg?raw';

let origin: string | null = null;

export default function (): AstroIntegration {
  return {
    name: 'astrolab',
    hooks: {
      'astro:config:setup': ({ injectRoute, addDevToolbarApp, command }) => {
        // Currently only supports development mode
        if (command !== 'dev') return;

        // Page Routes
        injectRoute({
          pattern: '/_astrolab',
          entrypoint: 'astrolab/src/index.astro'
        });

        // API Routes
        injectRoute({
          pattern: '/_astrolab/api/component',
          entrypoint: 'astrolab/src/api/component.ts'
        });
        injectRoute({
          pattern: '/_astrolab/api/render-component',
          entrypoint: 'astrolab/src/api/render-component.ts'
        });

        // Dev Toolbar
        addDevToolbarApp({
          id: 'astrolab',
          name: 'Astrolab',
          icon: potionIcon,
          entrypoint: new URL('./toolbar-app.ts', import.meta.url)
        });
      },
      'astro:server:setup': ({ server }) => {
        const componentsDir = path.resolve(
          server.config.root,
          'src',
          'components'
        );

        const isComponentFile = (file: string) =>
          file.endsWith('.astro') &&
          (file === componentsDir || file.startsWith(componentsDir + path.sep));

        const invalidateIfComponent = (file: string) => {
          if (isComponentFile(file)) {
            if (!origin) return;

            // Refresh component file when component is modified
            fetch(origin + '/_astrolab/api/component', {
              method: 'POST',
              body: JSON.stringify({
                component: path.basename(file, '.astro')
              })
            }).catch(() => {});
          }
        };

        // Refresh component JSON file when component is modified
        server.watcher.on('add', invalidateIfComponent);
        server.watcher.on('change', invalidateIfComponent);
        server.watcher.on('unlink', invalidateIfComponent);
      },
      'astro:server:start': ({ address }) => {
        origin = 'http://localhost:' + address.port; // TODO: Update to use actual origin
      }
    }
  };
}

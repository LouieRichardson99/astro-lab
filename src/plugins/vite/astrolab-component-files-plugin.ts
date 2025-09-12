import getExistingComponentId from '../../utils/getExistingComponentId';
import { randomBytes } from 'crypto';
import fg from 'fast-glob';
import pathe from 'pathe';

export default function defineVitePlugin(
  componentsDir: string,
  exclude: string[]
) {
  return {
    name: 'astrolab-component-files-plugin',
    resolveId(id: string) {
      if (id === 'virtual:astrolab-component-files') return id;
    },
    async load(id: string) {
      if (id === 'virtual:astrolab-component-files') {
        const files = await fg(
          pathe.relative(process.cwd(), componentsDir) + '/**/*.astro'
        );

        const filteredFiles = files.filter((file) => {
          const name = pathe.basename(file, '.astro');
          return !exclude.includes(name);
        });

        const components = filteredFiles.map((file) => {
          const name = pathe.basename(file, '.astro');

          const abs = pathe.resolve(file);
          const existingId = getExistingComponentId(undefined, abs);
          const id =
            existingId || `component-${randomBytes(8).toString('hex')}`;

          return {
            id,
            name,
            path: abs
          };
        });

        return `export const componentFiles = ${JSON.stringify(components)};`;
      }
    }
  };
}

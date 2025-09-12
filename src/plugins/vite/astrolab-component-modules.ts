import fg from 'fast-glob';
import pathe from 'pathe';

export default function defineVitePlugin(
  componentsDir: string,
  exclude: string[]
) {
  return {
    name: 'astrolab-component-modules-plugin',
    resolveId(id: string) {
      if (id === 'virtual:astrolab-component-modules') return id;
    },
    async load(id: string) {
      if (id === 'virtual:astrolab-component-modules') {
        const files = await fg(`${componentsDir}/**/*.astro`);

        const filteredFiles = files.filter((file) => {
          const name = pathe.basename(file, '.astro');
          return !exclude.includes(name);
        });

        const entries = filteredFiles
          .map((file) => {
            const name = pathe.basename(file, '.astro');
            const importPath = file.startsWith('/') ? file : '/' + file;

            return `\n  '${name}': async () => (await import('${importPath}')).default`;
          })
          .join(',');

        return `export const componentModules = {${entries}\n};`;
      }
    }
  };
}

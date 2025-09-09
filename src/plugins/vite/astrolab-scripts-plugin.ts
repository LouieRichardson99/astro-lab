export default function defineVitePlugin(scripts: string[]) {
  return {
    name: 'astrolab-scripts-plugin',
    resolveId(id: string) {
      if (id === 'virtual:astrolab-scripts') return id;
    },
    load(id: string) {
      if (id === 'virtual:astrolab-scripts') {
        return `export const scripts = ${JSON.stringify(scripts)};`;
      }
    }
  };
}

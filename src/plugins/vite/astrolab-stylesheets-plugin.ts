export default function defineVitePlugin(stylesheets: string[]) {
  return {
    name: 'astrolab-stylesheets-plugin',
    resolveId(id: string) {
      if (id === 'virtual:astrolab-stylesheets') return id;
    },
    load(id: string) {
      if (id === 'virtual:astrolab-stylesheets') {
        return `export const stylesheets = ${JSON.stringify(stylesheets)};`;
      }
    }
  };
}

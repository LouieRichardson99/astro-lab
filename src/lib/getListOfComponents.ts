import type { AstroInstance } from 'astro';
import type { ComponentFileInfo } from '../types';

/**
 * Fetches a list of all components in the repository.
 * @returns A promise that resolves to an array of component file information (`ComponentFileInfo[]`)
 */
export default async function getListOfComponents(): Promise<
  ComponentFileInfo[]
> {
  const componentModules = import.meta.glob(
    '../../../src/components/**/*.astro'
  );

  const components = await Promise.all(
    Object.values(componentModules).map(async (module) => {
      return (await module()) as AstroInstance;
    })
  );

  const componentArr = components.map((component) => ({
    id: crypto.randomUUID(),
    name: component.default.name,
    path: component.file
  }));

  return componentArr;
}

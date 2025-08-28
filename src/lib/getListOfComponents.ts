import crypto from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { AstroInstance } from 'astro';
import type { ComponentFileInfo } from '../types';
import { componentModules } from 'virtual:astrolab-component-modules';

/**
 * Fetches a list of all components in the repository.
 * @returns A promise that resolves to an array of component file information (`ComponentFileInfo[]`)
 */
export default async function getListOfComponents(): Promise<
  ComponentFileInfo[]
> {
  const components = await Promise.all(
    Object.values(componentModules).map(
      async (module) => (await module()) as AstroInstance
    )
  );

  const dataDir = fileURLToPath(new URL('../../data', import.meta.url));
  let existingIdByPath: Record<string, string> = {};

  const files = readdirSync(dataDir).filter(
    (f) => f.startsWith('component-') && f.endsWith('.json')
  );

  for (const file of files) {
    const full = path.join(dataDir, file);
    const json = JSON.parse(readFileSync(full, 'utf-8'));

    if (json?.component?.path && json?.id) {
      existingIdByPath[json.component.path] = json.id;
    }
  }

  const componentArr: ComponentFileInfo[] = components.map((component) => {
    const compPath = component.file;
    const existingId = existingIdByPath[compPath];

    return {
      id: existingId || `component-${crypto.randomBytes(8).toString('hex')}`,
      name: component.default.name,
      path: compPath
    };
  });

  return componentArr;
}

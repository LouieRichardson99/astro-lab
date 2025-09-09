import { existsSync, readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import pathe from 'pathe';

/**
 * Retrieves the existing component ID by its name or path.
 * @param name The name of the component, optional.
 * @param path The file path of the component, optional.
 * @returns The component ID or `null` if not found.
 */
export default function getExistingComponentId(name?: string, path?: string) {
  const existingId: Record<string, string> = {};
  const dataDir = fileURLToPath(new URL('../../data', import.meta.url));

  if (existsSync(dataDir)) {
    const dataFiles = readdirSync(dataDir).filter(
      (f) => f.startsWith('component-') && f.endsWith('.json')
    );

    for (const df of dataFiles) {
      try {
        const json = JSON.parse(readFileSync(pathe.join(dataDir, df), 'utf-8'));

        if (json?.path && json?.id) {
          if (name) {
            existingId[json.name] = json.id;
          } else if (path) {
            existingId[json.path] = json.id;
          }
        }
      } catch {}
    }
  }

  if (name) return existingId[name] || null;
  if (path) return existingId[path] || null;

  return null;
}

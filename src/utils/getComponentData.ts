import prettyConsoleLog from './prettyConsoleLog';
import type { ComponentData } from '../types';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/**
 * Retrieves component data by ID.
 * @param id Component ID
 * @returns `ComponentData` object or `null` if not found
 */
export default function getComponentData(id: string): ComponentData | null {
  try {
    const componentDataPath = fileURLToPath(
      new URL(`../../data/${id}.json`, import.meta.url)
    );

    const data = JSON.parse(
      readFileSync(componentDataPath, 'utf-8')
    ) as ComponentData;

    return data;
  } catch (error) {
    prettyConsoleLog(
      `Error reading component data for component ID: ${id}`,
      'error'
    );
    return null;
  }
}

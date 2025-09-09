import { existsSync, readFileSync } from 'fs';
import type { AppState } from '../types';
import { fileURLToPath } from 'url';

/**
 * Retrieves the current component ID from the application state.
 * @returns Current component ID or `null` if not found
 */
export default function getCurrentComponentId(): string | null {
  const statePath = fileURLToPath(
    new URL('../../data/state.json', import.meta.url)
  );

  if (existsSync(statePath)) {
    const state = JSON.parse(readFileSync(statePath, 'utf-8')) as AppState;
    return state.currentComponentId;
  }

  return null;
}

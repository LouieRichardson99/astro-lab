import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { AppState } from '../types';
import { fileURLToPath } from 'url';

/**
 * Deletes the current component ID from the application state.
 * @returns `null`
 */
export default function deleteCurrentComponentId() {
  const statePath = fileURLToPath(
    new URL('../../data/state.json', import.meta.url)
  );

  if (existsSync(statePath)) {
    const state = JSON.parse(readFileSync(statePath, 'utf-8')) as AppState;
    state.currentComponentId = null;

    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  return null;
}

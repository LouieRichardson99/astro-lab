import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { AppState } from '../types';
import { fileURLToPath } from 'url';

/**
 * Updates the current component ID in the application state.
 * @param id The new component ID.
 */
export default function updateCurrentComponentId(id: string) {
  const statePath = fileURLToPath(
    new URL('../../data/state.json', import.meta.url)
  );

  if (existsSync(statePath)) {
    const state = JSON.parse(readFileSync(statePath, 'utf-8')) as AppState;
    state.currentComponentId = id;

    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } else {
    const state: AppState = {
      currentComponentId: id
    };

    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }
}

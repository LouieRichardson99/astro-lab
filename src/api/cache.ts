export const prerender = false;

import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, rmSync } from 'fs';
import prettyConsoleLog from '../utils/prettyConsoleLog';

/**
 * Perform a full reset of the cache.
 * @returns `null`
 */
export async function DELETE() {
  const dataDir = fileURLToPath(new URL('../../data', import.meta.url));

  if (existsSync(dataDir)) {
    rmSync(dataDir, { recursive: true });
    mkdirSync(dataDir);

    prettyConsoleLog('Cache cleared');
  } else {
    mkdirSync(dataDir);
  }

  return new Response(null, { status: 204 });
}

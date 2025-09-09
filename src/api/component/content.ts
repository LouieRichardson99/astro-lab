// _astrolab/api/component/content
export const prerender = false;

import getCurrentComponentId from '../../utils/getCurrentComponentId';
import getComponentData from '../../utils/getComponentData';
import { existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Get the current component's content.
 * @returns `200 OK` with content JSON, or `204 No Content` if no current component is set.
 */
export async function GET() {
  const currentComponentId = getCurrentComponentId();

  if (!currentComponentId) {
    return new Response(null, { status: 204 });
  }

  const componentContent = getComponentData(currentComponentId)?.content;

  return new Response(JSON.stringify(componentContent), { status: 200 });
}

/**
 * Update the current component's content.
 * @param `request` - The request object containing the updated content.
 * @returns `204 No Content` on success, `404 Not Found` if component data file doesn't exist.
 */
export async function PATCH({ request }: { request: Request }) {
  const { prop, slot, value, componentId } = await request.json();
  const data = getComponentData(componentId);

  if (!data) {
    return new Response(null, { status: 404 });
  }

  if (prop) {
    data.content.props[prop] = value;
  }

  if (slot) {
    data.content.slots[slot] = value;
  }

  const filePath = fileURLToPath(
    new URL(`../../../data/${componentId}.json`, import.meta.url)
  );

  if (!existsSync(filePath)) {
    return new Response(null, { status: 404 });
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2));

  return new Response(null, { status: 204 });
}

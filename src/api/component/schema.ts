// _astrolab/api/component/schema
export const prerender = false;

import getCurrentComponentId from '../../utils/getCurrentComponentId';
import getComponentData from '../../utils/getComponentData';

/**
 * Get the current component's schema.
 * @returns `200 OK` with schema JSON, or `204 No Content` if no current component is set.
 */
export async function GET() {
  const currentComponentId = getCurrentComponentId();

  if (!currentComponentId) {
    return new Response(null, { status: 204 });
  }

  const componentSchema = getComponentData(currentComponentId)?.schema;

  return new Response(JSON.stringify(componentSchema), { status: 200 });
}

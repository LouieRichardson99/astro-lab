// _astrolab/api/component
export const prerender = false;

import { componentFiles } from 'virtual:astrolab-component-files';
import getCurrentComponentId from '../../utils/getCurrentComponentId';
import getComponentData from '../../utils/getComponentData';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import updateCurrentComponentId from '../../utils/updateCurrentComponentId';
import getComponentLab from '../../lib/getComponentLab';
import getComponentProperties from '../../lib/getComponentProperties';
import getComponentSlots from '../../lib/getComponentSlots';
import getComponentDefaults from '../../lib/getComponentDefaults';
import type { ComponentData } from '../../types';

/**
 * Get the current component's data.
 * @returns `200 OK` with component JSON, or `204 No Content` if no current component is set.
 */
export async function GET() {
  const currentComponentId = getCurrentComponentId();

  if (!currentComponentId) {
    return new Response(null, { status: 204 });
  }

  const componentData = getComponentData(currentComponentId);

  return new Response(JSON.stringify(componentData), { status: 200 });
}

/**
 * Handle creating or switching to an existing component.
 * @param `request` - The request object containing the component name and ID.
 * @returns
 */
export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const component = componentFiles.find((comp) => comp.name === body.component);

  if (!component) {
    return new Response(null, { status: 404 });
  }

  const componentDataPath = fileURLToPath(
    new URL(`../../../data/${body.id}.json`, import.meta.url)
  );

  if (existsSync(componentDataPath)) {
    updateCurrentComponentId(body.id);
    return new Response(null, { status: 200 });
  }

  const componentSource = readFileSync(component.path, 'utf-8');
  const componentLab = getComponentLab(component.name);

  try {
    const componentData = {
      id: component.id,
      name: component.name,
      path: component.path,
      schema: {
        props: getComponentProperties(componentSource),
        slots: getComponentSlots(componentSource)
      },
      content: {
        props: {
          ...getComponentDefaults(componentSource),
          ...componentLab?.props
        },
        slots: { ...componentLab?.slots }
      }
    } as ComponentData;

    writeFileSync(
      fileURLToPath(
        new URL(`../../../data/${component.id}.json`, import.meta.url)
      ),
      JSON.stringify(componentData, null, 2)
    );

    updateCurrentComponentId(component.id);

    return new Response(null, {
      status: 201
    });
  } catch (err) {
    console.error('Error writing component file:', err);

    return new Response(null, {
      status: 500
    });
  }
}

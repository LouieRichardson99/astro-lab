export const prerender = false;

import getListOfComponents from '../lib/getListOfComponents';
import { readFileSync, rmSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import type { ComponentData } from '../types';
import getComponentProperties from '../lib/getComponentProperties';
import getComponentSlots from '../lib/getComponentSlots';
import getComponentDefaults from '../lib/getComponentDefaults';

const filePath = fileURLToPath(
  new URL('../../data/component.json', import.meta.url)
);

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(null, { status: 204 });
  }
}

/**
 * Creates component JSON file.
 * Also removes component data file if component does not exist.
 * @param `component`
 * @returns `null`
 */
export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const components = await getListOfComponents();
  const component = components.find((comp) => comp.name === body.component);

  if (!component) {
    rmSync(filePath);

    return new Response(null, {
      status: 200
    });
  }

  const componentContent = readFileSync(component?.path, 'utf-8');
  const componentProperties = getComponentProperties(componentContent);
  const componentSlots = getComponentSlots(componentContent);
  const componentDefaults = getComponentDefaults(componentContent);

  try {
    const componentData = {
      id: component.id,
      component: {
        name: component?.name,
        path: component?.path,
        props: componentProperties,
        slots: componentSlots,
        defaults: componentDefaults
      },
      props: componentDefaults,
      slots: {}
    } as ComponentData;

    writeFileSync(filePath, JSON.stringify(componentData, null, 2));
  } catch (err) {
    console.error('Error writing component file:', err);
  }

  return new Response(null, {
    status: 201
  });
}

/**
 * Updates component JSON file.
 * @param `prop` - property to update
 * @param `slot` - slot to update
 * @param `value` - value to set
 * @returns `null`
 */
export async function PUT({ request }: { request: Request }) {
  const { prop, slot, value } = await request.json();
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  if (prop) {
    data.props[prop] = value;
  }

  if (slot) {
    data.slots[slot] = value;
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2));

  return new Response(null, { status: 204 });
}

/**
 * Deletes component JSON file.
 * @returns `null`
 */
export async function DELETE() {
  rmSync(filePath);

  return new Response(null, {
    status: 204
  });
}

export const prerender = false;

import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { ComponentData } from '../types';
import getComponentProperties from '../lib/getComponentProperties';
import getComponentDefaults from '../lib/getComponentDefaults';
import getListOfComponents from '../lib/getListOfComponents';
import getComponentSlots from '../lib/getComponentSlots';

export async function GET() {
  try {
    const componentDataFilePath = fileURLToPath(
      new URL(`../../data/${getCurrentComponentId()}.json`, import.meta.url)
    );
    const data = JSON.parse(readFileSync(componentDataFilePath, 'utf-8'));

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(null, { status: 204 });
  }
}

/**
 * Creates component JSON file.
 * Checks to see if component data file already exists before creating new one.
 * @param `component`
 * @returns `null`
 */
export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const components = await getListOfComponents();
  const component = components.find((comp) => comp.name === body.component);

  if (!component) {
    return new Response(null, { status: 404 });
  }

  const existingComponentDataFilePath = fileURLToPath(
    new URL(`../../data/${body.id}.json`, import.meta.url)
  );

  if (existsSync(existingComponentDataFilePath)) {
    setCurrentComponentId(component.id);
    return new Response(null, { status: 200 });
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

    writeFileSync(
      fileURLToPath(
        new URL(`../../data/${component.id}.json`, import.meta.url)
      ),
      JSON.stringify(componentData, null, 2)
    );

    setCurrentComponentId(component.id);

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

/**
 * Updates component JSON file.
 * @param `prop` - property to update
 * @param `slot` - slot to update
 * @param `value` - value to set
 * @returns `null`
 */
export async function PUT({ request }: { request: Request }) {
  const { prop, slot, value, componentId } = await request.json();

  const filePath = fileURLToPath(
    new URL(`../../data/${componentId}.json`, import.meta.url)
  );

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

const statePath = fileURLToPath(
  new URL('../../data/state.json', import.meta.url)
);

function getCurrentComponentId() {
  return existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, 'utf-8')).currentComponent
    : null;
}

function setCurrentComponentId(id: string) {
  writeFileSync(statePath, JSON.stringify({ currentComponent: id }, null, 2));
}

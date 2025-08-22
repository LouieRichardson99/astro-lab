export const prerender = false;

import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import renderComponentToString from '../lib/renderComponentToString';
import type { ComponentData } from '../types';

const dataPath = fileURLToPath(
  new URL('../../data/component.json', import.meta.url)
);

export async function GET() {
  if (!existsSync(dataPath)) {
    return new Response(null, { status: 204 });
  }

  const { component, props, slots }: ComponentData = JSON.parse(
    readFileSync(dataPath, 'utf-8')!
  );

  const componentPath = fileURLToPath(new URL(component.path, import.meta.url));
  const componentImport = await import(/* @vite-ignore */ componentPath); // TODO: Fix Vite warning

  const renderedHTML = await renderComponentToString(componentImport.default, {
    props,
    slots
  });

  return new Response(renderedHTML, { status: 200 });
}

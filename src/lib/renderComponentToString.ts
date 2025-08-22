import {
  type ContainerRenderOptions,
  experimental_AstroContainer as AstroContainer
} from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

/**
 * Renders a component to a string using Astro Container API.
 * @param component The component to render.
 * @param options Render options.
 * @returns The rendered component as a string.
 */
export default async function renderComponentToString(
  component: AstroComponentFactory,
  options?: ContainerRenderOptions
) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

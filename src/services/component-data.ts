import type { ComponentData } from '../types';
import type { AstroGlobal } from 'astro';

export async function getComponentData(
  Astro?: AstroGlobal
): Promise<ComponentData | null> {
  const origin = Astro?.url.origin || window.location.origin;

  try {
    const res = await fetch(`${origin}/_astrolab/api/component`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateComponentData(
  componentId: string,
  type: 'prop' | 'slot',
  name: string,
  value: any,
  Astro?: AstroGlobal
) {
  const origin = Astro?.url.origin || window.location.origin;

  await fetch(`${origin}/_astrolab/api/component`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      componentId,
      [type]: name,
      value
    })
  });
}

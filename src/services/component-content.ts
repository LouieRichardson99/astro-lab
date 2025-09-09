import type { AstroGlobal } from 'astro';

export async function updateComponentContent(
  componentId: string,
  type: 'prop' | 'slot',
  name: string,
  value: any,
  Astro?: AstroGlobal
) {
  const origin = Astro?.url.origin || window.location.origin;

  await fetch(`${origin}/_astrolab/api/component/content`, {
    method: 'PATCH',
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

import type { AstroGlobal } from 'astro';

export async function deleteCache(Astro?: AstroGlobal) {
  const origin = Astro?.url.origin || window.location.origin;

  await fetch(`${origin}/_astrolab/api/cache`, {
    method: 'DELETE'
  });
}

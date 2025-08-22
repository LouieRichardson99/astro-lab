import { defineToolbarApp } from 'astro/toolbar';

export default defineToolbarApp({
  init(_, app) {
    app.onToggled(() => {
      window.location.href = '/_astrolab';
    });
  }
});

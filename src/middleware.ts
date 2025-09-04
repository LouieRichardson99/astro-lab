import { defineMiddleware } from 'astro:middleware';
import prettyConsoleLog from './utils/prettyConsoleLog';

/**
 * A middleware to catch and handle errors during component rendering.
 * If an error occurs, return a 500 response with a user-friendly message instead of crashing the server.
 */
export const onRequest = defineMiddleware(async (_, next) => {
  try {
    return await next();
  } catch (error) {
    prettyConsoleLog(
      `Error during component rendering: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );

    return new Response('There was an error rendering your component', {
      status: 500
    });
  }
});

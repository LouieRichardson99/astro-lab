import chalk from 'chalk';

/**
 * Logs a message to the console with a timestamp and a specific color based on the message type. (Made to match Astro's console style)
 * @param message The message to log.
 * @param type The type of message (info or error).
 */
export default function prettyConsoleLog(
  message: string,
  type: 'info' | 'error' = 'info'
) {
  const time = new Date().toLocaleTimeString([], { hour12: false });

  if (type === 'error') {
    console.log(chalk.dim(time), chalk.red('[astrolab]'), message);
  } else {
    console.log(chalk.dim(time), chalk.blue('[astrolab]'), message);
  }
}

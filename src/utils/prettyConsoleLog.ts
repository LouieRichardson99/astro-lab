import chalk from 'chalk';

export default function prettyConsoleLog(
  message: string,
  type: 'info' | 'error' = 'info',
) {
  const time = new Date().toLocaleTimeString([], { hour12: false });

  if (type === 'error') {
    console.log(chalk.dim(time), chalk.red('[astrolab]'), message);
  } else {
    console.log(chalk.dim(time), chalk.blue('[astrolab]'), message);
  }
}

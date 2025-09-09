import fg from 'fast-glob';
import pathe from 'pathe';
import fs from 'fs';
import prettyConsoleLog from '../utils/prettyConsoleLog';

export default function getComponentLab(componentName: string) {
  const labsDir = pathe.resolve(process.cwd(), 'src/labs');
  const files = fg.sync('**/*.json', { cwd: labsDir });

  const lab = files.find((file) => {
    return file === `${componentName}.json`;
  });

  if (lab) {
    const data = fs.readFileSync(pathe.resolve(labsDir, lab), 'utf-8');

    try {
      return JSON.parse(data);
    } catch (error) {
      prettyConsoleLog(
        `Error reading lab file for "${componentName}" component. Please ensure the JSON is valid.`,
        'error'
      );
      return null;
    }
  }

  return null;
}

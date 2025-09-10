import pathe from 'pathe';
import fs from 'fs';
import prettyConsoleLog from '../utils/prettyConsoleLog';

export default function getComponentLab(componentName: string) {
  const labsDir = pathe.resolve(process.cwd(), 'src/labs');
  const candidate = pathe.resolve(labsDir, `${componentName}.json`);

  if (fs.existsSync(candidate)) {
    const data = fs.readFileSync(candidate, 'utf-8');

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

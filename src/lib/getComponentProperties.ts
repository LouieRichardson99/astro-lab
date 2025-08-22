import { Project } from 'ts-morph';
import type { PropInfo } from '../types';
import resolveType from './resolveType';

/**
 * Extracts prop information from a component's markup.
 * @param componentMarkup The markup of the component.
 * @returns An array of prop information objects.
 */
export default function getComponentProperties(
  componentMarkup: string
): PropInfo[] {
  const astroFrontmatter =
    componentMarkup.match(/^---([\s\S]*?)---/)?.[1] || '';

  // Create a new TypeScript project as context for parsing
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json'
  });

  // Create a temporary source file to parse the Astro frontmatter
  const sourceFile = project.createSourceFile('.virtual.ts', astroFrontmatter, {
    overwrite: true
  });

  const propsInterface = sourceFile.getInterface('Props');

  if (!propsInterface) {
    return [];
  }

  const properties: PropInfo[] = [];

  propsInterface.getProperties().forEach((prop) => {
    const type = prop.getType();

    properties.push({
      name: prop.getName(),
      type: resolveType(type, project.getTypeChecker()),
      required: prop.getQuestionTokenNode() === undefined
    });
  });

  return properties;
}

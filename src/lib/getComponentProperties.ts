import { Project } from 'ts-morph';
import type { PropInfo } from '../types';
import resolveType from './resolveType';
import { getTsProject } from './tsProject';

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

  // Use a cached TypeScript project to avoid expensive re-initialization
  const project: Project = getTsProject();

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

import { Project } from 'ts-morph';

let project: Project | null = null;

/**
 * Returns a cached ts-morph Project instance. This avoids re-reading tsconfig
 * and re-initializing the TypeScript program for every parse, which is costly.
 */
export function getTsProject(): Project {
  if (!project) {
    project = new Project({
      tsConfigFilePath: 'tsconfig.json'
    });
  }

  return project!;
}

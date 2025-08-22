import { Project, Node } from 'ts-morph';
import JSON5 from 'json5';

/**
 * Extracts default values for props from a component's markup.
 * @param componentMarkup The markup of the component.
 * @returns An object mapping prop names to their default values.
 */
export default function getComponentDefaults(
  componentMarkup: string
): Record<string, any> {
  const defaults: Record<string, any> = {};
  const astroFrontmatter =
    componentMarkup.match(/^---([\s\S]*?)---/)?.[1] || '';

  const project = new Project({
    tsConfigFilePath: 'tsconfig.json'
  });

  const sourceFile = project.createSourceFile('.virtual.ts', astroFrontmatter, {
    overwrite: true
  });

  sourceFile.getVariableDeclarations().forEach((decl) => {
    const initializer = decl.getInitializer();

    if (initializer?.getText() === 'Astro.props') {
      const nameNode = decl.getNameNode();

      if (Node.isObjectBindingPattern(nameNode)) {
        nameNode.getElements().forEach((element) => {
          const propertyName = element.getPropertyNameNode();
          const name = propertyName
            ? propertyName.getText()
            : element.getName();

          const initializer = element.getInitializer();

          // TODO: Handle parsing of object signature index if number - currently errors

          defaults[name] = JSON5.parse(initializer?.getText() || 'null');
        });
      }
    }
  });

  return defaults;
}

import { Node, Type, type TypeChecker } from 'ts-morph';
import type { PropInfo, ResolvedType } from '../types';
import JSON5 from 'json5';
import symbolToProp from './symbolToProp';

/**
 * Resolves a TypeScript type to a more manageable format.
 * @param type The type to resolve.
 * @param typeChecker The TypeScript type checker.
 * @returns The resolved type information.
 */
export default function resolveType(
  type: Type,
  typeChecker: TypeChecker
): ResolvedType {
  if (
    type.isStringLiteral() ||
    type.isNumberLiteral() ||
    type.isBooleanLiteral()
  ) {
    return { kind: 'primitive', name: JSON5.parse(type.getText()) };
  }

  if (type.isString() || type.isNumber() || type.isBoolean()) {
    return { kind: 'primitive', name: type.getText() };
  }

  if (type.isUnion()) {
    const unionTypes = type
      .getUnionTypes()
      .filter((t) => !t.isUndefined())
      .map((t) => resolveType(t, typeChecker));

    // If type is a single element after removing 'undefined', return it directly
    if (unionTypes.length === 1) {
      const [firstElem] = unionTypes;

      switch (firstElem.kind) {
        case 'object':
          return {
            kind: 'object',
            properties: firstElem.properties
          };
        case 'primitive':
          return {
            kind: 'primitive',
            name: firstElem.name
          };
        case 'array':
          return {
            kind: 'array',
            elementType: firstElem.elementType
          };
        case 'tuple':
          return {
            kind: 'tuple',
            elements: firstElem.elements
          };
        default:
          return {
            kind: 'unknown'
          };
      }
    }

    return {
      kind: 'union',
      types: unionTypes
    };
  }

  if (type.isIntersection()) {
    const allProps: PropInfo[] = [];

    type.getIntersectionTypes().forEach((intersectionType) => {
      const resolved = resolveType(intersectionType, typeChecker);

      if (resolved.kind === 'object') {
        allProps.push(...resolved.properties);
      }
    });

    return { kind: 'object', properties: allProps };
  }

  if (type.isTuple()) {
    const elements = type.getTupleElements() ?? [];

    return {
      kind: 'tuple',
      elements: elements.map((t) => resolveType(t, typeChecker))
    };
  }

  if (type.isArray()) {
    const elementType = type.getArrayElementType();

    if (elementType) {
      return {
        kind: 'array',
        elementType: resolveType(elementType, typeChecker)
      };
    }
  }

  if (type.isObject()) {
    const symbol = type.getSymbol();

    if (symbol) {
      const declarations = symbol.getDeclarations();
      const firstDecl = declarations?.[0];

      if (firstDecl && Node.isTypeAliasDeclaration(firstDecl)) {
        const aliasedType = firstDecl.getTypeNode();

        if (aliasedType) {
          return resolveType(aliasedType.getType(), typeChecker);
        }
      }

      if (type.getProperties().length > 0) {
        const props = Array.from(type.getProperties()).map((symbol) =>
          symbolToProp(symbol, typeChecker)
        );

        return { kind: 'object', properties: props };
      }
    }
  }

  return { kind: 'unknown' };
}

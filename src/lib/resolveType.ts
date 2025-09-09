import { Type, type TypeChecker } from 'ts-morph';
import type { PropInfo, ResolvedType } from '../types';
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
    return { kind: 'primitive', name: JSON.parse(type.getText()) };
  }

  if (type.isString() || type.isNumber() || type.isBoolean()) {
    return { kind: 'primitive', name: type.getText() };
  }

  if (type.isUnion()) {
    const unionTypes = type
      .getUnionTypes()
      .filter((t) => !t.isUndefined())
      .map((t) => resolveType(t, typeChecker));

    const isBooleanUnion = unionTypes.every(
      (t) => t.kind === 'primitive' && typeof t.name === 'boolean'
    );

    if (isBooleanUnion) {
      return {
        kind: 'primitive',
        name: 'boolean'
      };
    }

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
      const properties = Array.from(type.getProperties())
        .filter((sym) => {
          // Filter out internal/branded symbol-keyed properties that TypeScript prints with synthetic names.
          const name = sym.getName();
          return !(name.startsWith('__@') && /@\d+$/.test(name));
        })
        .map((symbol) => symbolToProp(symbol, typeChecker));

      const indexSignatures: {
        keyType: 'string' | 'number';
        valueType: ResolvedType;
      }[] = [];

      const stringIndex = type.getStringIndexType();
      const numberIndex = type.getNumberIndexType();

      if (stringIndex) {
        indexSignatures.push({
          keyType: 'string',
          valueType: resolveType(stringIndex, typeChecker)
        });
      } else if (numberIndex) {
        indexSignatures.push({
          keyType: 'number',
          valueType: resolveType(numberIndex, typeChecker)
        });
      }

      if (properties.length > 0 || indexSignatures.length > 0) {
        return {
          kind: 'object',
          properties,
          ...(indexSignatures.length > 0 && { indexSignatures })
        };
      }
    }
  }

  return { kind: 'unknown' };
}

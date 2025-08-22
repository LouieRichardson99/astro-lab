import { Symbol, type TypeChecker } from 'ts-morph';
import resolveType from './resolveType';

/**
 * Converts a TypeScript symbol to a prop information object.
 * @param typeChecker The TypeScript type checker.
 * @returns A function that converts a symbol to prop information.
 */
export default function symbolToProp(symbol: Symbol, typeChecker: TypeChecker) {
  const decl = symbol.getDeclarations()[0];
  const t = typeChecker.getTypeOfSymbolAtLocation(symbol, decl);

  return {
    name: symbol.getName(),
    type: resolveType(t, typeChecker),
    required: !symbol.isOptional()
  };
}

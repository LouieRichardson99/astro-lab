import type { ResolvedType } from '../types';

/**
 * Checks if a type is a union of primitive types.
 * @param t The type to check.
 * @returns True if the type is a union of primitive types, false otherwise.
 */
export default function isPrimitiveUnion(
  t: ResolvedType
): t is { kind: 'union'; types: Array<{ kind: 'primitive'; name: string }> } {
  return (
    t.kind === 'union' && t.types.every((x: any) => x.kind === 'primitive')
  );
}

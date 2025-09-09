export interface PropInfo {
  name: string;
  type: ResolvedType;
  required: boolean;
}

export interface ComponentData {
  id: string;
  name: string;
  path: string;
  schema: {
    props: PropInfo[];
    slots: { name: string }[];
  };
  content: {
    props: Record<string, any>;
    slots: Record<string, any>;
  };
}

export interface ComponentFileInfo {
  id: string;
  name: string;
  path: string;
}

export type ResolvedType =
  | { kind: 'primitive'; name: string }
  | { kind: 'union'; types: ResolvedType[] }
  | { kind: 'array'; elementType: ResolvedType }
  | { kind: 'tuple'; elements: ResolvedType[] }
  | {
      kind: 'object';
      properties: PropInfo[];
      indexSignatures?: {
        keyType: 'string' | 'number';
        valueType: ResolvedType;
      }[];
    }
  | { kind: 'unknown' };

export interface AppState {
  currentComponentId: string | null;
}

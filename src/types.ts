export interface PropInfo {
  name: string;
  type: ResolvedType;
  required: boolean;
}

export interface ComponentData {
  id: string;
  component: {
    name: string;
    path: string;
    props: PropInfo[];
    slots: { name: string }[];
    defaults: Record<string, any>;
  };
  props: Record<string, any>;
  slots: Record<string, any>;
}

export interface ComponentFileInfo {
  id: string;
  name: string;
  path: string;
}

export type ResolvedType =
  | { kind: 'primitive'; name: string }
  | { kind: 'union'; types: ResolvedType[] }
  | { kind: 'object'; properties: PropInfo[] }
  | { kind: 'array'; elementType: ResolvedType }
  | { kind: 'tuple'; elements: ResolvedType[] }
  | { kind: 'unknown' };

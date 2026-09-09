export interface SolverTileCoord {
  row: number;
  col: number;
}

export interface SolverCombination {
  id: number;
  family: string;
  shape: string;
  required: SolverTileCoord[];
  blockers: SolverTileCoord[];
  isActive?: boolean;
}

export interface FamilySignature {
  [digit: number]: number;
}

export interface FamilyDef {
  name: string;
  digits: number[];
  signatures: FamilySignature[];
}

export interface DependencyCell {
  requiredIn: number[];
  blockedIn: number[];
}

export type SolverListType = 'clearable' | 'blocked';

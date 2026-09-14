export interface OrientationOffset {
  rot: number; // 0, 1, 2, 3 representing 90 deg clockwise rotations
  flip: boolean; // whether reflection across main diagonal (transpose) is applied
}

export const DEFAULT_ORIENTATION_OFFSET: OrientationOffset = {
  rot: 0,
  flip: false,
};

/**
 * Rotates a 2D matrix 90 degrees Clockwise.
 * An (R x C) matrix becomes (C x R).
 */
export function rotateCW<T>(matrix: T[][]): T[][] {
  const rows = matrix.length;
  if (rows === 0) return [];
  const cols = matrix[0]?.length ?? 0;
  if (cols === 0) return [];

  return Array.from({ length: cols }, (_, r) =>
    Array.from({ length: rows }, (_, c) => matrix[rows - 1 - c]![r]!)
  );
}

/**
 * Rotates a 2D matrix 90 degrees Counter-Clockwise.
 * An (R x C) matrix becomes (C x R).
 */
export function rotateCCW<T>(matrix: T[][]): T[][] {
  const rows = matrix.length;
  if (rows === 0) return [];
  const cols = matrix[0]?.length ?? 0;
  if (cols === 0) return [];

  return Array.from({ length: cols }, (_, r) =>
    Array.from({ length: rows }, (_, c) => matrix[c]![cols - 1 - r]!)
  );
}

/**
 * Flips a 2D matrix across the main diagonal (Locks Top-Left and Bottom-Right).
 * An (R x C) matrix becomes (C x R).
 */
export function transpose<T>(matrix: T[][]): T[][] {
  const rows = matrix.length;
  if (rows === 0) return [];
  const cols = matrix[0]?.length ?? 0;
  if (cols === 0) return [];

  return Array.from({ length: cols }, (_, r) =>
    Array.from({ length: rows }, (_, c) => matrix[c]![r]!)
  );
}

/**
 * Flips a 2D matrix across the anti-diagonal (Locks Top-Right and Bottom-Left).
 * An (R x C) matrix becomes (C x R).
 */
export function antiTranspose<T>(matrix: T[][]): T[][] {
  const rows = matrix.length;
  if (rows === 0) return [];
  const cols = matrix[0]?.length ?? 0;
  if (cols === 0) return [];

  return Array.from({ length: cols }, (_, r) =>
    Array.from({ length: rows }, (_, c) => matrix[rows - 1 - c]![cols - 1 - r]!)
  );
}

/**
 * Transitions orientation offset when applying a Clockwise rotation.
 * In D4: R * (R^rot * T^flip) = R^(rot+1) * T^flip.
 */
export function nextOrientationCW(prev: OrientationOffset): OrientationOffset {
  return {
    rot: (prev.rot + 1) % 4,
    flip: prev.flip,
  };
}

/**
 * Transitions orientation offset when applying a Counter-Clockwise rotation.
 * In D4: R^3 * (R^rot * T^flip) = R^(rot+3) * T^flip.
 */
export function nextOrientationCCW(prev: OrientationOffset): OrientationOffset {
  return {
    rot: (prev.rot + 3) % 4,
    flip: prev.flip,
  };
}

/**
 * Transitions orientation offset when applying Transpose.
 * In D4: T * (R^rot * T^flip) = R^(-rot) * T^(flip+1).
 */
export function nextOrientationTranspose(prev: OrientationOffset): OrientationOffset {
  return {
    rot: (4 - (prev.rot % 4)) % 4,
    flip: !prev.flip,
  };
}

/**
 * Transitions orientation offset when applying Anti-Transpose.
 * In D4: AntiTranspose = R^2 * T.
 * (R^2 * T) * (R^rot * T^flip) = R^(2 - rot) * T^(flip+1).
 */
export function nextOrientationAntiTranspose(prev: OrientationOffset): OrientationOffset {
  return {
    rot: (6 - (prev.rot % 4)) % 4,
    flip: !prev.flip,
  };
}

/**
 * Inverts the transformation described by orientationOffset to restore
 * the original unoriented matrix.
 */
export function invertTransform<T>(matrix: T[][], offset: OrientationOffset): T[][] {
  let m = matrix;
  const cwRotations = (4 - (offset.rot % 4)) % 4;
  for (let i = 0; i < cwRotations; i++) {
    m = rotateCW(m);
  }
  if (offset.flip) {
    m = transpose(m);
  }
  return m;
}

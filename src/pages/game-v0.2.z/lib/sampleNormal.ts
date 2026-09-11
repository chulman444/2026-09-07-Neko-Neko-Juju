/**
 * Samples a random number from a normal (Gaussian) distribution
 * with the given mean and standard deviation using the Box-Muller transform.
 */
export function sampleNormal(mean: number, stdDev: number): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

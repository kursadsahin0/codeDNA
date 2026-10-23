/** Transparent first-pass heuristic. Points are review signals, not failure probabilities. */
export const RISK_WEIGHTS = Object.freeze({
  affectedFiles: 28,
  directDependants: 22,
  cycle: 18,
  recentChurn: 17,
  missingTests: 15,
});

export const RISK_THRESHOLDS = Object.freeze({
  affectedFilesForMax: 20,
  directDependantsForMax: 8,
  recentChangesForMax: 5,
  maxDepth: 5,
});

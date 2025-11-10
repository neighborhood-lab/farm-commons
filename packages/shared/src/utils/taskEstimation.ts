// Farm Commons Task Duration Estimation Utilities
// Estimates task completion times based on historical data

/**
 * Historical time entry data for estimation
 */
export interface HistoricalTimeEntry {
  task_type: string;
  total_hours: number;
  field_size_acres?: number;
  worker_id: string;
}

/**
 * Worker efficiency data
 */
export interface WorkerEfficiency {
  worker_id: string;
  efficiency_rating: number; // 0.5 to 2.0, where 1.0 is average
}

/**
 * Task estimation result with confidence interval
 */
export interface TaskEstimation {
  estimated_hours: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  sample_size: number;
  standard_deviation: number;
}

/**
 * Task estimation options
 */
export interface EstimationOptions {
  field_size_acres?: number;
  worker_id?: string;
  confidence_level?: number; // Default 0.95 (95%)
}

/**
 * Calculate average duration by task type from historical data
 */
export function calculateAverageDuration(
  historicalData: HistoricalTimeEntry[],
  taskType: string
): number {
  const relevantEntries = historicalData.filter(
    (entry) => entry.task_type === taskType && entry.total_hours > 0
  );

  if (relevantEntries.length === 0) {
    return 0;
  }

  const sum = relevantEntries.reduce((acc, entry) => acc + entry.total_hours, 0);
  return sum / relevantEntries.length;
}

/**
 * Calculate standard deviation for a set of time entries
 */
export function calculateStandardDeviation(
  values: number[],
  mean: number
): number {
  if (values.length <= 1) {
    return 0;
  }

  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculate field size adjustment factor
 * Assumes linear relationship between field size and task duration
 */
export function calculateFieldSizeFactor(
  historicalData: HistoricalTimeEntry[],
  taskType: string,
  targetFieldSize: number
): number {
  const entriesWithFieldSize = historicalData.filter(
    (entry) =>
      entry.task_type === taskType &&
      entry.field_size_acres !== undefined &&
      entry.field_size_acres > 0 &&
      entry.total_hours > 0
  );

  if (entriesWithFieldSize.length === 0 || targetFieldSize <= 0) {
    return 1.0; // No adjustment if no field size data
  }

  // Calculate average hours per acre
  const hoursPerAcreValues = entriesWithFieldSize.map(
    (entry) => entry.total_hours / entry.field_size_acres!
  );

  const avgHoursPerAcre =
    hoursPerAcreValues.reduce((acc, val) => acc + val, 0) / hoursPerAcreValues.length;

  // Calculate average field size in historical data
  const avgFieldSize =
    entriesWithFieldSize.reduce((acc, entry) => acc + entry.field_size_acres!, 0) /
    entriesWithFieldSize.length;

  // Return the ratio of target field size to average field size
  // This adjusts the base estimate proportionally
  return targetFieldSize / avgFieldSize;
}

/**
 * Get worker efficiency rating
 */
export function getWorkerEfficiencyRating(
  workerEfficiencies: WorkerEfficiency[],
  workerId: string
): number {
  const workerData = workerEfficiencies.find((w) => w.worker_id === workerId);
  return workerData?.efficiency_rating ?? 1.0; // Default to average efficiency
}

/**
 * Calculate worker efficiency rating from historical data
 */
export function calculateWorkerEfficiency(
  historicalData: HistoricalTimeEntry[],
  workerId: string,
  taskType?: string
): number {
  // Filter entries for this worker
  const workerEntries = historicalData.filter(
    (entry) =>
      entry.worker_id === workerId &&
      entry.total_hours > 0 &&
      (!taskType || entry.task_type === taskType)
  );

  if (workerEntries.length === 0) {
    return 1.0; // Default to average if no data
  }

  // Calculate average for this worker
  const workerAvg =
    workerEntries.reduce((acc, entry) => acc + entry.total_hours, 0) / workerEntries.length;

  // Calculate overall average for the same tasks
  const taskTypes = new Set(workerEntries.map((e) => e.task_type));
  const relevantEntries = historicalData.filter(
    (entry) => taskTypes.has(entry.task_type) && entry.total_hours > 0
  );

  if (relevantEntries.length === 0) {
    return 1.0;
  }

  const overallAvg =
    relevantEntries.reduce((acc, entry) => acc + entry.total_hours, 0) /
    relevantEntries.length;

  // Efficiency rating is the inverse of the time ratio
  // If worker takes less time than average, efficiency > 1.0
  // If worker takes more time than average, efficiency < 1.0
  const efficiency = overallAvg / workerAvg;

  // Clamp efficiency rating between 0.5 and 2.0
  return Math.max(0.5, Math.min(2.0, efficiency));
}

/**
 * Calculate confidence interval using t-distribution approximation
 */
export function calculateConfidenceInterval(
  mean: number,
  standardDeviation: number,
  sampleSize: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  if (sampleSize <= 1 || standardDeviation === 0) {
    return { lower: mean, upper: mean };
  }

  // t-score approximations for common confidence levels
  // For large samples (n > 30), t-score approaches z-score
  const tScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const tScore = tScores[confidenceLevel] ?? 1.96;

  // For small samples, adjust t-score upward
  const adjustedTScore = sampleSize < 30 ? tScore * 1.2 : tScore;

  const marginOfError = adjustedTScore * (standardDeviation / Math.sqrt(sampleSize));

  return {
    lower: Math.max(0, mean - marginOfError),
    upper: mean + marginOfError,
  };
}

/**
 * Estimate task completion time based on historical data
 */
export function estimateTaskDuration(
  historicalData: HistoricalTimeEntry[],
  taskType: string,
  options: EstimationOptions = {},
  workerEfficiencies: WorkerEfficiency[] = []
): TaskEstimation {
  const { field_size_acres, worker_id, confidence_level = 0.95 } = options;

  // Step 1: Calculate base average duration for task type
  const baseAverage = calculateAverageDuration(historicalData, taskType);

  if (baseAverage === 0) {
    return {
      estimated_hours: 0,
      confidence_interval: { lower: 0, upper: 0 },
      sample_size: 0,
      standard_deviation: 0,
    };
  }

  // Step 2: Apply field size factor
  let fieldSizeFactor = 1.0;
  if (field_size_acres !== undefined && field_size_acres > 0) {
    fieldSizeFactor = calculateFieldSizeFactor(
      historicalData,
      taskType,
      field_size_acres
    );
  }

  // Step 3: Apply worker efficiency rating
  let efficiencyFactor = 1.0;
  if (worker_id) {
    efficiencyFactor = getWorkerEfficiencyRating(workerEfficiencies, worker_id);
  }

  // Step 4: Calculate final estimate
  const estimatedHours = baseAverage * fieldSizeFactor / efficiencyFactor;

  // Step 5: Calculate confidence interval
  const relevantEntries = historicalData.filter(
    (entry) => entry.task_type === taskType && entry.total_hours > 0
  );

  const values = relevantEntries.map((entry) => entry.total_hours);
  const standardDeviation = calculateStandardDeviation(values, baseAverage);

  // Adjust confidence interval based on field size and worker efficiency factors
  const adjustedMean = estimatedHours;
  const adjustedStdDev = standardDeviation * Math.abs(fieldSizeFactor / efficiencyFactor);

  const confidenceInterval = calculateConfidenceInterval(
    adjustedMean,
    adjustedStdDev,
    relevantEntries.length,
    confidence_level
  );

  return {
    estimated_hours: parseFloat(estimatedHours.toFixed(2)),
    confidence_interval: {
      lower: parseFloat(confidenceInterval.lower.toFixed(2)),
      upper: parseFloat(confidenceInterval.upper.toFixed(2)),
    },
    sample_size: relevantEntries.length,
    standard_deviation: parseFloat(adjustedStdDev.toFixed(2)),
  };
}

/**
 * Estimate multiple tasks and return total duration
 */
export function estimateMultipleTasksDuration(
  historicalData: HistoricalTimeEntry[],
  tasks: Array<{ taskType: string; options?: EstimationOptions }>,
  workerEfficiencies: WorkerEfficiency[] = []
): TaskEstimation {
  const estimations = tasks.map((task) =>
    estimateTaskDuration(
      historicalData,
      task.taskType,
      task.options,
      workerEfficiencies
    )
  );

  const totalHours = estimations.reduce(
    (acc, est) => acc + est.estimated_hours,
    0
  );

  // Sum variances for independent tasks
  const totalVariance = estimations.reduce(
    (acc, est) => acc + Math.pow(est.standard_deviation, 2),
    0
  );

  const totalStdDev = Math.sqrt(totalVariance);
  const totalSampleSize = estimations.reduce(
    (acc, est) => acc + est.sample_size,
    0
  );

  const avgConfidenceLevel = 0.95;
  const confidenceInterval = calculateConfidenceInterval(
    totalHours,
    totalStdDev,
    totalSampleSize,
    avgConfidenceLevel
  );

  return {
    estimated_hours: parseFloat(totalHours.toFixed(2)),
    confidence_interval: {
      lower: parseFloat(confidenceInterval.lower.toFixed(2)),
      upper: parseFloat(confidenceInterval.upper.toFixed(2)),
    },
    sample_size: totalSampleSize,
    standard_deviation: parseFloat(totalStdDev.toFixed(2)),
  };
}

/**
 * Get all available task types from historical data
 */
export function getAvailableTaskTypes(
  historicalData: HistoricalTimeEntry[]
): string[] {
  const taskTypes = new Set(historicalData.map((entry) => entry.task_type));
  return Array.from(taskTypes).sort();
}

/**
 * Get estimation quality indicator based on sample size
 */
export function getEstimationQuality(sampleSize: number): 'poor' | 'fair' | 'good' | 'excellent' {
  if (sampleSize < 3) return 'poor';
  if (sampleSize < 10) return 'fair';
  if (sampleSize < 30) return 'good';
  return 'excellent';
}

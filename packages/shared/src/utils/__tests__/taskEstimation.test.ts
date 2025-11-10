// Task Estimation Utilities Tests

import { describe, it, expect } from 'vitest';
import {
  calculateAverageDuration,
  calculateStandardDeviation,
  calculateFieldSizeFactor,
  getWorkerEfficiencyRating,
  calculateWorkerEfficiency,
  calculateConfidenceInterval,
  estimateTaskDuration,
  estimateMultipleTasksDuration,
  getAvailableTaskTypes,
  getEstimationQuality,
  type HistoricalTimeEntry,
  type WorkerEfficiency,
} from '../taskEstimation';

describe('Task Estimation Utilities', () => {
  // Sample historical data for testing
  const historicalData: HistoricalTimeEntry[] = [
    { task_type: 'planting', total_hours: 4.0, field_size_acres: 2.0, worker_id: 'worker1' },
    { task_type: 'planting', total_hours: 5.0, field_size_acres: 2.5, worker_id: 'worker2' },
    { task_type: 'planting', total_hours: 3.5, field_size_acres: 1.5, worker_id: 'worker1' },
    { task_type: 'planting', total_hours: 6.0, field_size_acres: 3.0, worker_id: 'worker3' },
    { task_type: 'harvesting', total_hours: 8.0, field_size_acres: 5.0, worker_id: 'worker1' },
    { task_type: 'harvesting', total_hours: 7.5, field_size_acres: 5.0, worker_id: 'worker2' },
    { task_type: 'weeding', total_hours: 2.0, worker_id: 'worker1' },
    { task_type: 'weeding', total_hours: 2.5, worker_id: 'worker2' },
    { task_type: 'weeding', total_hours: 3.0, worker_id: 'worker3' },
  ];

  const workerEfficiencies: WorkerEfficiency[] = [
    { worker_id: 'worker1', efficiency_rating: 1.2 },
    { worker_id: 'worker2', efficiency_rating: 1.0 },
    { worker_id: 'worker3', efficiency_rating: 0.8 },
  ];

  describe('calculateAverageDuration', () => {
    it('should calculate correct average for task type', () => {
      const avg = calculateAverageDuration(historicalData, 'planting');
      expect(avg).toBeCloseTo(4.625, 2);
    });

    it('should return 0 for non-existent task type', () => {
      const avg = calculateAverageDuration(historicalData, 'non-existent');
      expect(avg).toBe(0);
    });

    it('should ignore zero or negative hours', () => {
      const dataWithZeros: HistoricalTimeEntry[] = [
        { task_type: 'test', total_hours: 5.0, worker_id: 'w1' },
        { task_type: 'test', total_hours: 0, worker_id: 'w2' },
        { task_type: 'test', total_hours: 3.0, worker_id: 'w3' },
      ];
      const avg = calculateAverageDuration(dataWithZeros, 'test');
      expect(avg).toBeCloseTo(4.0, 2);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate correct standard deviation', () => {
      const values = [4.0, 5.0, 3.5, 6.0];
      const mean = 4.625;
      const stdDev = calculateStandardDeviation(values, mean);
      expect(stdDev).toBeGreaterThan(0);
      expect(stdDev).toBeCloseTo(1.11, 1);
    });

    it('should return 0 for single value', () => {
      const values = [5.0];
      const stdDev = calculateStandardDeviation(values, 5.0);
      expect(stdDev).toBe(0);
    });

    it('should return 0 for empty array', () => {
      const stdDev = calculateStandardDeviation([], 0);
      expect(stdDev).toBe(0);
    });
  });

  describe('calculateFieldSizeFactor', () => {
    it('should return 1.0 when no field size data available', () => {
      const factor = calculateFieldSizeFactor(historicalData, 'weeding', 5.0);
      expect(factor).toBe(1.0);
    });

    it('should calculate correct field size factor', () => {
      const factor = calculateFieldSizeFactor(historicalData, 'planting', 4.0);
      expect(factor).toBeGreaterThan(1.0);
    });

    it('should return 1.0 for zero or negative target field size', () => {
      const factor = calculateFieldSizeFactor(historicalData, 'planting', 0);
      expect(factor).toBe(1.0);
    });

    it('should scale linearly with field size', () => {
      const factor1 = calculateFieldSizeFactor(historicalData, 'planting', 2.0);
      const factor2 = calculateFieldSizeFactor(historicalData, 'planting', 4.0);
      expect(factor2).toBeCloseTo(factor1 * 2, 1);
    });
  });

  describe('getWorkerEfficiencyRating', () => {
    it('should return correct efficiency for known worker', () => {
      const rating = getWorkerEfficiencyRating(workerEfficiencies, 'worker1');
      expect(rating).toBe(1.2);
    });

    it('should return 1.0 for unknown worker', () => {
      const rating = getWorkerEfficiencyRating(workerEfficiencies, 'unknown');
      expect(rating).toBe(1.0);
    });
  });

  describe('calculateWorkerEfficiency', () => {
    it('should calculate efficiency rating for worker', () => {
      const rating = calculateWorkerEfficiency(historicalData, 'worker1', 'planting');
      expect(rating).toBeGreaterThan(0.5);
      expect(rating).toBeLessThanOrEqual(2.0);
    });

    it('should return 1.0 for worker with no data', () => {
      const rating = calculateWorkerEfficiency(historicalData, 'unknown-worker');
      expect(rating).toBe(1.0);
    });

    it('should clamp efficiency between 0.5 and 2.0', () => {
      // Worker who is extremely efficient (takes very little time)
      const extremeData: HistoricalTimeEntry[] = [
        { task_type: 'test', total_hours: 0.5, worker_id: 'fast-worker' },
        { task_type: 'test', total_hours: 10.0, worker_id: 'normal-worker' },
        { task_type: 'test', total_hours: 10.0, worker_id: 'normal-worker' },
      ];
      const rating = calculateWorkerEfficiency(extremeData, 'fast-worker', 'test');
      expect(rating).toBeLessThanOrEqual(2.0);
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('should calculate correct confidence interval', () => {
      const interval = calculateConfidenceInterval(5.0, 1.0, 30, 0.95);
      expect(interval.lower).toBeLessThan(5.0);
      expect(interval.upper).toBeGreaterThan(5.0);
      expect(interval.lower).toBeGreaterThanOrEqual(0);
    });

    it('should return mean for zero standard deviation', () => {
      const interval = calculateConfidenceInterval(5.0, 0, 30, 0.95);
      expect(interval.lower).toBe(5.0);
      expect(interval.upper).toBe(5.0);
    });

    it('should return mean for sample size of 1', () => {
      const interval = calculateConfidenceInterval(5.0, 1.0, 1, 0.95);
      expect(interval.lower).toBe(5.0);
      expect(interval.upper).toBe(5.0);
    });

    it('should not return negative lower bound', () => {
      const interval = calculateConfidenceInterval(1.0, 5.0, 10, 0.95);
      expect(interval.lower).toBeGreaterThanOrEqual(0);
    });
  });

  describe('estimateTaskDuration', () => {
    it('should estimate task duration without options', () => {
      const estimation = estimateTaskDuration(historicalData, 'planting');
      expect(estimation.estimated_hours).toBeGreaterThan(0);
      expect(estimation.sample_size).toBe(4);
      expect(estimation.confidence_interval.lower).toBeLessThan(
        estimation.estimated_hours
      );
      expect(estimation.confidence_interval.upper).toBeGreaterThan(
        estimation.estimated_hours
      );
    });

    it('should estimate task duration with field size', () => {
      const estimation = estimateTaskDuration(historicalData, 'planting', {
        field_size_acres: 4.0,
      });
      expect(estimation.estimated_hours).toBeGreaterThan(0);
    });

    it('should estimate task duration with worker efficiency', () => {
      const estimationEfficient = estimateTaskDuration(
        historicalData,
        'planting',
        { worker_id: 'worker1' },
        workerEfficiencies
      );
      const estimationBase = estimateTaskDuration(historicalData, 'planting');

      // More efficient worker should take less time
      expect(estimationEfficient.estimated_hours).toBeLessThan(
        estimationBase.estimated_hours
      );
    });

    it('should estimate task duration with all options', () => {
      const estimation = estimateTaskDuration(
        historicalData,
        'planting',
        {
          field_size_acres: 3.0,
          worker_id: 'worker1',
          confidence_level: 0.95,
        },
        workerEfficiencies
      );
      expect(estimation.estimated_hours).toBeGreaterThan(0);
      expect(estimation.sample_size).toBe(4);
    });

    it('should return zero estimation for unknown task type', () => {
      const estimation = estimateTaskDuration(historicalData, 'unknown-task');
      expect(estimation.estimated_hours).toBe(0);
      expect(estimation.sample_size).toBe(0);
    });
  });

  describe('estimateMultipleTasksDuration', () => {
    it('should estimate total duration for multiple tasks', () => {
      const tasks = [
        { taskType: 'planting', options: { field_size_acres: 2.0 } },
        { taskType: 'weeding' },
      ];
      const estimation = estimateMultipleTasksDuration(
        historicalData,
        tasks,
        workerEfficiencies
      );
      expect(estimation.estimated_hours).toBeGreaterThan(0);
      expect(estimation.sample_size).toBeGreaterThan(0);
    });

    it('should sum standard deviations correctly', () => {
      const tasks = [
        { taskType: 'planting' },
        { taskType: 'harvesting' },
      ];
      const estimation = estimateMultipleTasksDuration(historicalData, tasks);
      expect(estimation.standard_deviation).toBeGreaterThan(0);
    });
  });

  describe('getAvailableTaskTypes', () => {
    it('should return all unique task types', () => {
      const taskTypes = getAvailableTaskTypes(historicalData);
      expect(taskTypes).toContain('planting');
      expect(taskTypes).toContain('harvesting');
      expect(taskTypes).toContain('weeding');
      expect(taskTypes.length).toBe(3);
    });

    it('should return sorted task types', () => {
      const taskTypes = getAvailableTaskTypes(historicalData);
      const sorted = [...taskTypes].sort();
      expect(taskTypes).toEqual(sorted);
    });

    it('should return empty array for empty data', () => {
      const taskTypes = getAvailableTaskTypes([]);
      expect(taskTypes).toEqual([]);
    });
  });

  describe('getEstimationQuality', () => {
    it('should return poor for sample size < 3', () => {
      expect(getEstimationQuality(0)).toBe('poor');
      expect(getEstimationQuality(2)).toBe('poor');
    });

    it('should return fair for sample size 3-9', () => {
      expect(getEstimationQuality(3)).toBe('fair');
      expect(getEstimationQuality(9)).toBe('fair');
    });

    it('should return good for sample size 10-29', () => {
      expect(getEstimationQuality(10)).toBe('good');
      expect(getEstimationQuality(29)).toBe('good');
    });

    it('should return excellent for sample size >= 30', () => {
      expect(getEstimationQuality(30)).toBe('excellent');
      expect(getEstimationQuality(100)).toBe('excellent');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle empty historical data gracefully', () => {
      const estimation = estimateTaskDuration([], 'any-task');
      expect(estimation.estimated_hours).toBe(0);
    });

    it('should handle very small field sizes', () => {
      const estimation = estimateTaskDuration(historicalData, 'planting', {
        field_size_acres: 0.1,
      });
      expect(estimation.estimated_hours).toBeGreaterThan(0);
    });

    it('should handle very large field sizes', () => {
      const estimation = estimateTaskDuration(historicalData, 'planting', {
        field_size_acres: 100.0,
      });
      expect(estimation.estimated_hours).toBeGreaterThan(0);
    });

    it('should produce consistent results for same input', () => {
      const est1 = estimateTaskDuration(historicalData, 'planting', {
        field_size_acres: 2.0,
        worker_id: 'worker1',
      }, workerEfficiencies);
      const est2 = estimateTaskDuration(historicalData, 'planting', {
        field_size_acres: 2.0,
        worker_id: 'worker1',
      }, workerEfficiencies);
      expect(est1.estimated_hours).toBe(est2.estimated_hours);
    });
  });
});

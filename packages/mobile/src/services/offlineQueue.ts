// Offline Queue Service
// Stores API requests when offline and processes them when back online

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: unknown;
  timestamp: string;
  retries: number;
}

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  async add(request: Omit<QueuedRequest, 'id' | 'retries'>): Promise<void> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retries: 0,
    };

    this.queue.push(queuedRequest);
    await this.save();
    console.log('Request queued for offline processing:', queuedRequest.id);
  }

  async process(
    processFn: (request: QueuedRequest) => Promise<boolean>
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const processedIds: string[] = [];

      for (const request of this.queue) {
        try {
          const success = await processFn(request);

          if (success) {
            processedIds.push(request.id);
            console.log('Successfully processed queued request:', request.id);
          } else {
            request.retries++;
            if (request.retries >= MAX_RETRIES) {
              processedIds.push(request.id);
              console.error('Max retries reached for request:', request.id);
            }
          }
        } catch (error) {
          console.error('Error processing queued request:', request.id, error);
          request.retries++;
          if (request.retries >= MAX_RETRIES) {
            processedIds.push(request.id);
          }
        }
      }

      // Remove processed requests
      this.queue = this.queue.filter((req) => !processedIds.includes(req.id));
      await this.save();
    } finally {
      this.isProcessing = false;
    }
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.save();
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
}

export const offlineQueue = new OfflineQueue();

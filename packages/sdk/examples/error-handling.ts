/**
 * Error Handling Example
 * Demonstrates proper error handling with the Farm Commons SDK
 */

import { FarmCommonsSDK, type SDKError } from '../src/index.js';

async function main() {
  const sdk = new FarmCommonsSDK({
    baseUrl: process.env.FARM_COMMONS_API_URL || 'http://localhost:3000',
  });

  // Example 1: Invalid credentials
  console.log('=== Example 1: Invalid Credentials ===');
  try {
    await sdk.auth.login({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    });
  } catch (error) {
    if (error instanceof Error) {
      const sdkError = error as SDKError;
      console.error('Login failed:', sdkError.message);
      console.error('Status code:', sdkError.statusCode);
    }
  }

  // Example 2: Unauthorized access (no token)
  console.log('\n=== Example 2: Unauthorized Access ===');
  try {
    await sdk.workers.list();
  } catch (error) {
    if (error instanceof Error) {
      const sdkError = error as SDKError;
      console.error('Access denied:', sdkError.message);
      console.error('Status code:', sdkError.statusCode);
    }
  }

  // Example 3: Resource not found
  console.log('\n=== Example 3: Resource Not Found ===');
  try {
    // Login first
    await sdk.auth.login({
      email: 'manager@farmcommons.com',
      password: 'password123',
    });

    // Try to get non-existent worker
    await sdk.workers.get('00000000-0000-0000-0000-000000000000');
  } catch (error) {
    if (error instanceof Error) {
      const sdkError = error as SDKError;
      console.error('Worker not found:', sdkError.message);
      console.error('Status code:', sdkError.statusCode);
    }
  }

  // Example 4: Validation error
  console.log('\n=== Example 4: Validation Error ===');
  try {
    await sdk.workers.create({
      first_name: '', // Invalid: empty string
      last_name: 'Doe',
      phone: '123', // Invalid: too short
      hire_date: new Date(),
    });
  } catch (error) {
    if (error instanceof Error) {
      const sdkError = error as SDKError;
      console.error('Validation failed:', sdkError.message);
      console.error('Status code:', sdkError.statusCode);
      console.error('Details:', sdkError.response);
    }
  }

  // Example 5: Network timeout
  console.log('\n=== Example 5: Network Timeout ===');
  const slowSDK = new FarmCommonsSDK({
    baseUrl: 'http://localhost:3000',
    timeout: 1, // Very short timeout
  });

  try {
    await slowSDK.auth.login({
      email: 'manager@farmcommons.com',
      password: 'password123',
    });
  } catch (error) {
    if (error instanceof Error) {
      const sdkError = error as SDKError;
      console.error('Request timeout:', sdkError.message);
      console.error('Status code:', sdkError.statusCode);
    }
  }

  // Example 6: Proper error handling with retry logic
  console.log('\n=== Example 6: Retry Logic ===');
  async function fetchWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const sdkError = lastError as SDKError;

        // Only retry on network errors or 5xx server errors
        if (sdkError.statusCode && sdkError.statusCode >= 400 && sdkError.statusCode < 500) {
          // Client errors shouldn't be retried
          throw error;
        }

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError;
  }

  try {
    const workers = await fetchWithRetry(() => sdk.workers.list());
    console.log('Successfully fetched workers:', workers.total);
  } catch (error) {
    console.error('All retry attempts failed:', error);
  }

  // Example 7: Graceful degradation
  console.log('\n=== Example 7: Graceful Degradation ===');
  async function getWorkerSafely(workerId: string) {
    try {
      return await sdk.workers.get(workerId);
    } catch (error) {
      console.warn('Failed to fetch worker, returning default:', error);
      return {
        id: workerId,
        first_name: 'Unknown',
        last_name: 'Worker',
        status: 'inactive' as const,
        // ... other default values
      };
    }
  }

  const worker = await getWorkerSafely('invalid-id');
  console.log('Worker:', worker.first_name, worker.last_name);

  console.log('\n=== Error handling examples completed ===');
}

main();

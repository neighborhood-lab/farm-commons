/**
 * Basic Usage Example
 * Demonstrates how to use the Farm Commons SDK for common operations
 */

import { FarmCommonsSDK } from '../src/index.js';

async function main() {
  // Initialize SDK
  const sdk = new FarmCommonsSDK({
    baseUrl: process.env.FARM_COMMONS_API_URL || 'http://localhost:3000',
    timeout: 30000,
    onTokenRefresh: (token) => {
      console.log('Token refreshed:', token);
    },
  });

  try {
    // 1. Login
    console.log('=== Logging in ===');
    const loginResult = await sdk.auth.login({
      email: 'manager@farmcommons.com',
      password: 'password123',
    });
    console.log('Logged in as:', loginResult.user.email);
    console.log('Role:', loginResult.user.role);

    // 2. List workers
    console.log('\n=== Listing workers ===');
    const workersResponse = await sdk.workers.list({ page: 1, per_page: 10 });
    console.log(`Found ${workersResponse.total} workers (showing ${workersResponse.data.length})`);

    workersResponse.data.forEach(worker => {
      console.log(`- ${worker.first_name} ${worker.last_name} (${worker.status})`);
    });

    // 3. Create a new worker
    console.log('\n=== Creating a new worker ===');
    const newWorker = await sdk.workers.create({
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1-555-0123',
      email: 'john.doe@example.com',
      preferred_language: 'en',
      hire_date: new Date(),
      status: 'active',
      hourly_rate: 18.50,
      skills: ['harvesting', 'irrigation'],
      certifications: ['Pesticide Applicator License'],
    });
    console.log('Created worker:', newWorker.id);

    // 4. Get worker details
    console.log('\n=== Getting worker details ===');
    const worker = await sdk.workers.get(newWorker.id);
    console.log(`${worker.first_name} ${worker.last_name}`);
    console.log('Skills:', worker.skills.join(', '));
    console.log('Hourly rate: $', worker.hourly_rate);

    // 5. Create a schedule for the worker
    console.log('\n=== Creating a schedule ===');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedule = await sdk.schedules.create({
      worker_id: newWorker.id,
      scheduled_date: tomorrow,
      start_time: '08:00',
      end_time: '16:00',
      task_type: 'Harvesting',
      task_description: 'Harvest tomatoes in Field A',
    });
    console.log('Created schedule:', schedule.id);
    console.log('Scheduled for:', schedule.scheduled_date);

    // 6. List schedules for the week
    console.log('\n=== Listing schedules ===');
    const startOfWeek = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const schedules = await sdk.schedules.list({
      start_date: startOfWeek.toISOString(),
      end_date: endOfWeek.toISOString(),
    });
    console.log(`Found ${schedules.length} schedules this week`);

    // 7. Clock in the worker
    console.log('\n=== Clocking in worker ===');
    const timeEntry = await sdk.timeEntries.clockIn({
      worker_id: newWorker.id,
      task_type: 'Harvesting',
      schedule_id: schedule.id,
      notes: 'Starting morning shift',
    });
    console.log('Worker clocked in at:', timeEntry.clock_in);

    // 8. Simulate some work time (in real app, this would be much later)
    console.log('\n=== Simulating work time ===');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 9. Clock out the worker
    console.log('\n=== Clocking out worker ===');
    const completedEntry = await sdk.timeEntries.clockOut(timeEntry.id, {
      break_minutes: 30,
      notes: 'Completed harvesting section A',
    });
    console.log('Worker clocked out at:', completedEntry.clock_out);
    console.log('Total hours:', completedEntry.total_hours);

    // 10. Verify the time entry
    console.log('\n=== Verifying time entry ===');
    const verified = await sdk.timeEntries.verify(completedEntry.id);
    console.log('Time entry verified by:', verified.verified_by);

    // 11. Get worker's time entries
    console.log('\n=== Getting worker time entries ===');
    const workerEntries = await sdk.timeEntries.getByWorker(newWorker.id);
    console.log(`Worker has ${workerEntries.length} time entries`);

    workerEntries.forEach(entry => {
      console.log(`- ${entry.task_type}: ${entry.total_hours?.toFixed(2) || 'In progress'} hours`);
    });

    // 12. Update worker information
    console.log('\n=== Updating worker ===');
    const updated = await sdk.workers.update(newWorker.id, {
      hourly_rate: 19.00,
      skills: ['harvesting', 'irrigation', 'tractor operation'],
    });
    console.log('Updated hourly rate to: $', updated.hourly_rate);
    console.log('Updated skills:', updated.skills.join(', '));

    console.log('\n=== Example completed successfully ===');

  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

// Run the example
main();

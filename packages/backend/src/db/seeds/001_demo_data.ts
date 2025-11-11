import type { Knex } from 'knex';
/* eslint-disable sonarjs/cognitive-complexity */
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in reverse order of dependencies
  await knex('certifications').del();
  await knex('time_entries').del();
  await knex('schedules').del();
  await knex('fields').del();
  await knex('workers').del();
  await knex('users').del();
  await knex('farms').del();

  // Hash password for demo users (password: "demo123")
  const passwordHash = await bcrypt.hash('demo123', 10);

  // 1. Create demo farm
  const [farm] = await knex('farms')
    .insert({
      name: 'Green Valley Farm',
      location: '123 Farm Road, Salinas, CA 93901',
      size_acres: 250.5,
      organic_certified: true,
    })
    .returning('*');

  console.log('✓ Created demo farm:', farm.name);

  // 2. Create users (admin, manager, and some workers)
  const users = await knex('users')
    .insert([
      {
        email: 'admin@greenfarm.com',
        password_hash: passwordHash,
        role: 'admin',
        farm_id: farm.id,
      },
      {
        email: 'manager@greenfarm.com',
        password_hash: passwordHash,
        role: 'manager',
        farm_id: farm.id,
      },
      {
        email: 'jgarcia@greenfarm.com',
        password_hash: passwordHash,
        role: 'worker',
        farm_id: farm.id,
      },
      {
        email: 'mrodriguez@greenfarm.com',
        password_hash: passwordHash,
        role: 'worker',
        farm_id: farm.id,
      },
    ])
    .returning('*');

  console.log('✓ Created users:', users.length);

  // 3. Create fields
  const fields = await knex('fields')
    .insert([
      {
        farm_id: farm.id,
        name: 'North Field',
        size_acres: 45.5,
        location_gps: JSON.stringify({ lat: 36.6777, lng: -121.6555 }),
        current_crop: 'Lettuce',
        soil_type: 'Loamy',
        notes: 'Primary lettuce field, excellent drainage',
      },
      {
        farm_id: farm.id,
        name: 'South Field',
        size_acres: 38.2,
        location_gps: JSON.stringify({ lat: 36.6765, lng: -121.6548 }),
        current_crop: 'Strawberries',
        soil_type: 'Sandy loam',
        notes: 'Recently converted to strawberries',
      },
      {
        farm_id: farm.id,
        name: 'East Field',
        size_acres: 52,
        location_gps: JSON.stringify({ lat: 36.678, lng: -121.654 }),
        current_crop: 'Broccoli',
        soil_type: 'Clay loam',
        notes: 'Crop rotation schedule - broccoli this season',
      },
      {
        farm_id: farm.id,
        name: 'West Field',
        size_acres: 41.8,
        location_gps: JSON.stringify({ lat: 36.6772, lng: -121.6565 }),
        current_crop: 'Carrots',
        soil_type: 'Sandy',
        notes: 'Best for root vegetables',
      },
      {
        farm_id: farm.id,
        name: 'Greenhouse A',
        size_acres: 2.5,
        location_gps: JSON.stringify({ lat: 36.6775, lng: -121.6552 }),
        current_crop: 'Tomatoes',
        soil_type: 'Controlled',
        notes: 'Climate-controlled greenhouse',
      },
      {
        farm_id: farm.id,
        name: 'Orchard',
        size_acres: 70.5,
        location_gps: JSON.stringify({ lat: 36.6785, lng: -121.6535 }),
        current_crop: 'Apples',
        soil_type: 'Loamy',
        notes: 'Mixed apple varieties - Fuji, Gala, Honeycrisp',
      },
    ])
    .returning('*');

  console.log('✓ Created fields:', fields.length);

  // 4. Create workers (15-20 demo workers with various roles)
  const workers = await knex('workers')
    .insert([
      // Crew leaders / supervisors
      {
        farm_id: farm.id,
        user_id: users[2].id, // Linked to jgarcia@greenfarm.com
        first_name: 'Juan',
        last_name: 'García',
        email: 'jgarcia@greenfarm.com',
        phone: '831-555-0101',
        preferred_language: 'es',
        emergency_contact_name: 'María García',
        emergency_contact_phone: '831-555-0102',
        hire_date: '2020-03-15',
        status: 'active',
        hourly_rate: 22.5,
        certifications: ['Forklift Operator', 'First Aid'],
        skills: ['Equipment Operation', 'Team Lead', 'Irrigation'],
        notes: 'Crew leader for field operations',
      },
      {
        farm_id: farm.id,
        user_id: users[3].id, // Linked to mrodriguez@greenfarm.com
        first_name: 'María',
        last_name: 'Rodríguez',
        email: 'mrodriguez@greenfarm.com',
        phone: '831-555-0103',
        preferred_language: 'es',
        emergency_contact_name: 'Carlos Rodríguez',
        emergency_contact_phone: '831-555-0104',
        hire_date: '2019-05-20',
        status: 'active',
        hourly_rate: 23,
        certifications: ['Pesticide Application', 'Tractor Operation'],
        skills: ['Pesticide Application', 'Greenhouse Management', 'Quality Control'],
        notes: 'Greenhouse supervisor',
      },
      // Full-time workers
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Carlos',
        last_name: 'Hernández',
        email: 'chernandez@greenfarm.com',
        phone: '831-555-0105',
        preferred_language: 'es',
        emergency_contact_name: 'Ana Hernández',
        emergency_contact_phone: '831-555-0106',
        hire_date: '2021-01-10',
        status: 'active',
        hourly_rate: 18.5,
        certifications: [],
        skills: ['Harvesting', 'Planting', 'Weeding'],
        notes: 'Excellent harvester',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Ana',
        last_name: 'Martínez',
        email: 'amartinez@greenfarm.com',
        phone: '831-555-0107',
        preferred_language: 'es',
        emergency_contact_name: 'Luis Martínez',
        emergency_contact_phone: '831-555-0108',
        hire_date: '2021-02-15',
        status: 'active',
        hourly_rate: 18,
        certifications: [],
        skills: ['Harvesting', 'Sorting', 'Packing'],
        notes: 'Works primarily in strawberry fields',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Miguel',
        last_name: 'López',
        email: 'mlopez@greenfarm.com',
        phone: '831-555-0109',
        preferred_language: 'es',
        emergency_contact_name: 'Rosa López',
        emergency_contact_phone: '831-555-0110',
        hire_date: '2020-08-01',
        status: 'active',
        hourly_rate: 19.5,
        certifications: ['Tractor Operation'],
        skills: ['Tractor Operation', 'Plowing', 'Irrigation'],
        notes: 'Primary tractor operator',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Rosa',
        last_name: 'Flores',
        email: 'rflores@greenfarm.com',
        phone: '831-555-0111',
        preferred_language: 'es',
        emergency_contact_name: 'Pedro Flores',
        emergency_contact_phone: '831-555-0112',
        hire_date: '2021-03-20',
        status: 'active',
        hourly_rate: 18,
        certifications: [],
        skills: ['Greenhouse Work', 'Planting', 'Pruning'],
        notes: 'Greenhouse specialist',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Pedro',
        last_name: 'Sánchez',
        email: 'psanchez@greenfarm.com',
        phone: '831-555-0113',
        preferred_language: 'es',
        emergency_contact_name: 'Carmen Sánchez',
        emergency_contact_phone: '831-555-0114',
        hire_date: '2020-11-05',
        status: 'active',
        hourly_rate: 18.5,
        certifications: [],
        skills: ['Harvesting', 'Equipment Maintenance', 'Irrigation'],
        notes: 'Very reliable worker',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Carmen',
        last_name: 'Ramírez',
        email: 'cramirez@greenfarm.com',
        phone: '831-555-0115',
        preferred_language: 'es',
        emergency_contact_name: 'José Ramírez',
        emergency_contact_phone: '831-555-0116',
        hire_date: '2021-04-12',
        status: 'active',
        hourly_rate: 17.5,
        certifications: [],
        skills: ['Harvesting', 'Weeding', 'Planting'],
        notes: '',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'José',
        last_name: 'Torres',
        email: 'jtorres@greenfarm.com',
        phone: '831-555-0117',
        preferred_language: 'es',
        emergency_contact_name: 'Isabel Torres',
        emergency_contact_phone: '831-555-0118',
        hire_date: '2019-09-01',
        status: 'active',
        hourly_rate: 20,
        certifications: ['First Aid', 'Forklift Operator'],
        skills: ['Forklift Operation', 'Warehouse', 'Loading'],
        notes: 'Warehouse and logistics',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Isabel',
        last_name: 'Morales',
        email: 'imorales@greenfarm.com',
        phone: '831-555-0119',
        preferred_language: 'es',
        emergency_contact_name: 'Diego Morales',
        emergency_contact_phone: '831-555-0120',
        hire_date: '2020-06-18',
        status: 'active',
        hourly_rate: 18,
        certifications: [],
        skills: ['Harvesting', 'Sorting', 'Quality Control'],
        notes: 'Quality control specialist',
      },
      // Seasonal workers
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Diego',
        last_name: 'Ruiz',
        email: 'druiz@greenfarm.com',
        phone: '831-555-0121',
        preferred_language: 'es',
        emergency_contact_name: 'Laura Ruiz',
        emergency_contact_phone: '831-555-0122',
        hire_date: '2024-04-01',
        status: 'seasonal',
        hourly_rate: 17,
        certifications: [],
        skills: ['Harvesting', 'Pruning'],
        notes: 'Seasonal worker - harvest season',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Laura',
        last_name: 'Jiménez',
        email: 'ljimenez@greenfarm.com',
        phone: '831-555-0123',
        preferred_language: 'es',
        emergency_contact_name: 'Roberto Jiménez',
        emergency_contact_phone: '831-555-0124',
        hire_date: '2024-04-01',
        status: 'seasonal',
        hourly_rate: 17,
        certifications: [],
        skills: ['Harvesting', 'Packing'],
        notes: 'Seasonal worker - harvest season',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Roberto',
        last_name: 'Castro',
        email: 'rcastro@greenfarm.com',
        phone: '831-555-0125',
        preferred_language: 'es',
        emergency_contact_name: 'Elena Castro',
        emergency_contact_phone: '831-555-0126',
        hire_date: '2024-05-15',
        status: 'seasonal',
        hourly_rate: 17,
        certifications: [],
        skills: ['Harvesting', 'Weeding'],
        notes: 'Seasonal worker - harvest season',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Elena',
        last_name: 'Vargas',
        email: 'evargas@greenfarm.com',
        phone: '831-555-0127',
        preferred_language: 'es',
        emergency_contact_name: 'Miguel Vargas',
        emergency_contact_phone: '831-555-0128',
        hire_date: '2024-05-15',
        status: 'seasonal',
        hourly_rate: 17,
        certifications: [],
        skills: ['Harvesting'],
        notes: 'Seasonal worker - harvest season',
      },
      // Part-time worker
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Francisco',
        last_name: 'Reyes',
        email: 'freyes@greenfarm.com',
        phone: '831-555-0129',
        preferred_language: 'en',
        emergency_contact_name: 'Sarah Reyes',
        emergency_contact_phone: '831-555-0130',
        hire_date: '2023-02-10',
        status: 'active',
        hourly_rate: 18.5,
        certifications: [],
        skills: ['Equipment Maintenance', 'Repair', 'Welding'],
        notes: 'Part-time maintenance specialist',
      },
      // Piece rate workers
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Gabriela',
        last_name: 'Mendoza',
        email: 'gmendoza@greenfarm.com',
        phone: '831-555-0131',
        preferred_language: 'es',
        emergency_contact_name: 'Antonio Mendoza',
        emergency_contact_phone: '831-555-0132',
        hire_date: '2022-07-01',
        status: 'active',
        hourly_rate: null,
        piece_rate: 2.5,
        certifications: [],
        skills: ['Harvesting', 'Fast Picker'],
        notes: 'Piece rate - per box of strawberries',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Antonio',
        last_name: 'Ortiz',
        email: 'aortiz@greenfarm.com',
        phone: '831-555-0133',
        preferred_language: 'es',
        emergency_contact_name: 'Lucia Ortiz',
        emergency_contact_phone: '831-555-0134',
        hire_date: '2022-07-01',
        status: 'active',
        hourly_rate: null,
        piece_rate: 2.5,
        certifications: [],
        skills: ['Harvesting', 'Fast Picker'],
        notes: 'Piece rate - per box of strawberries',
      },
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'Lucia',
        last_name: 'Silva',
        email: 'lsilva@greenfarm.com',
        phone: '831-555-0135',
        preferred_language: 'es',
        emergency_contact_name: 'Fernando Silva',
        emergency_contact_phone: '831-555-0136',
        hire_date: '2023-03-10',
        status: 'active',
        hourly_rate: null,
        piece_rate: 2.5,
        certifications: [],
        skills: ['Harvesting'],
        notes: 'Piece rate - per box of strawberries',
      },
      // English-speaking worker
      {
        farm_id: farm.id,
        user_id: null,
        first_name: 'David',
        last_name: 'Johnson',
        email: 'djohnson@greenfarm.com',
        phone: '831-555-0137',
        preferred_language: 'en',
        emergency_contact_name: 'Emily Johnson',
        emergency_contact_phone: '831-555-0138',
        hire_date: '2021-08-15',
        status: 'active',
        hourly_rate: 21,
        certifications: ['CDL Class B', 'Pesticide Application'],
        skills: ['Truck Driving', 'Equipment Operation', 'Pesticide Application'],
        notes: 'Primary truck driver and pesticide applicator',
      },
    ])
    .returning('*');

  console.log('✓ Created workers:', workers.length);

  // 5. Create certifications
  const today = new Date();
  const certifications = await knex('certifications')
    .insert([
      // Juan García certifications
      {
        worker_id: workers[0].id,
        name: 'Forklift Operator Certification',
        issuing_organization: 'OSHA',
        issue_date: new Date('2023-01-15'),
        expiration_date: new Date('2026-01-15'),
        verified: true,
      },
      {
        worker_id: workers[0].id,
        name: 'First Aid and CPR',
        issuing_organization: 'American Red Cross',
        issue_date: new Date('2024-06-10'),
        expiration_date: new Date('2026-06-10'),
        verified: true,
      },
      // María Rodríguez certifications
      {
        worker_id: workers[1].id,
        name: 'Pesticide Applicator License',
        issuing_organization: 'California Department of Pesticide Regulation',
        issue_date: new Date('2022-03-20'),
        expiration_date: new Date('2025-03-20'),
        verified: true,
      },
      {
        worker_id: workers[1].id,
        name: 'Tractor Operation Safety',
        issuing_organization: 'Farm Safety Association',
        issue_date: new Date('2023-05-15'),
        expiration_date: new Date('2026-05-15'),
        verified: true,
      },
      // Miguel López certifications
      {
        worker_id: workers[4].id,
        name: 'Tractor Operation Safety',
        issuing_organization: 'Farm Safety Association',
        issue_date: new Date('2023-08-01'),
        expiration_date: new Date('2026-08-01'),
        verified: true,
      },
      // José Torres certifications
      {
        worker_id: workers[8].id,
        name: 'First Aid and CPR',
        issuing_organization: 'American Red Cross',
        issue_date: new Date('2023-09-01'),
        expiration_date: new Date('2025-09-01'),
        verified: true,
      },
      {
        worker_id: workers[8].id,
        name: 'Forklift Operator Certification',
        issuing_organization: 'OSHA',
        issue_date: new Date('2022-11-15'),
        expiration_date: new Date('2025-11-15'),
        verified: true,
      },
      // David Johnson certifications
      {
        worker_id: workers[18].id,
        name: 'Commercial Driver License Class B',
        issuing_organization: 'California DMV',
        issue_date: new Date('2021-08-20'),
        expiration_date: new Date('2026-08-20'),
        verified: true,
      },
      {
        worker_id: workers[18].id,
        name: 'Pesticide Applicator License',
        issuing_organization: 'California Department of Pesticide Regulation',
        issue_date: new Date('2022-09-10'),
        expiration_date: new Date('2025-09-10'),
        verified: true,
      },
      // Some certifications expiring soon for testing
      {
        worker_id: workers[2].id,
        name: 'Food Safety Certification',
        issuing_organization: 'USDA',
        issue_date: new Date('2023-12-01'),
        expiration_date: new Date(today.getFullYear(), today.getMonth() + 1, 15), // Expires in ~1 month
        verified: true,
      },
      {
        worker_id: workers[3].id,
        name: 'Organic Handling Certification',
        issuing_organization: 'CCOF',
        issue_date: new Date('2024-01-10'),
        expiration_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25), // Expires in 25 days
        verified: false,
      },
    ])
    .returning('*');

  console.log('✓ Created certifications:', certifications.length);

  // 6. Create schedules for 2 weeks (past week and next week)
  const schedules = [];
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7); // Start from 7 days ago

  // Helper function to format date
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Create schedules for 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const scheduleDate = new Date(startDate);
    scheduleDate.setDate(startDate.getDate() + dayOffset);

    // Skip Sundays
    if (scheduleDate.getDay() === 0) continue;

    const isPast = scheduleDate < today;
    const isToday = scheduleDate.toDateString() === today.toDateString();

    // Field assignments for different workers
    const dailySchedules = [
      // Crew leaders
      {
        worker: workers[0],
        field: fields[0],
        startTime: '06:00',
        endTime: '15:00',
        task: 'Supervise Field Operations',
        status: isPast ? 'completed' : isToday ? 'in_progress' : 'scheduled',
      },
      {
        worker: workers[1],
        field: fields[4],
        startTime: '07:00',
        endTime: '16:00',
        task: 'Greenhouse Management',
        status: isPast ? 'completed' : 'scheduled',
      },

      // Full-time workers
      {
        worker: workers[2],
        field: fields[0],
        startTime: '06:30',
        endTime: '15:30',
        task: 'Lettuce Harvesting',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[3],
        field: fields[1],
        startTime: '06:30',
        endTime: '15:30',
        task: 'Strawberry Harvesting',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[4],
        field: fields[2],
        startTime: '06:00',
        endTime: '15:00',
        task: 'Tractor Operations',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[5],
        field: fields[4],
        startTime: '07:00',
        endTime: '16:00',
        task: 'Greenhouse Planting',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[6],
        field: fields[0],
        startTime: '06:30',
        endTime: '15:30',
        task: 'Irrigation Setup',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[7],
        field: fields[3],
        startTime: '06:30',
        endTime: '15:30',
        task: 'Carrot Weeding',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[8],
        field: null,
        startTime: '07:00',
        endTime: '16:00',
        task: 'Warehouse Operations',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[9],
        field: fields[1],
        startTime: '06:30',
        endTime: '15:30',
        task: 'Quality Control - Strawberries',
        status: isPast ? 'completed' : 'scheduled',
      },

      // Seasonal workers
      {
        worker: workers[10],
        field: fields[1],
        startTime: '07:00',
        endTime: '15:00',
        task: 'Strawberry Harvesting',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[11],
        field: fields[1],
        startTime: '07:00',
        endTime: '15:00',
        task: 'Strawberry Packing',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[12],
        field: fields[2],
        startTime: '07:00',
        endTime: '15:00',
        task: 'Broccoli Harvesting',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[13],
        field: fields[3],
        startTime: '07:00',
        endTime: '15:00',
        task: 'Carrot Harvesting',
        status: isPast ? 'completed' : 'scheduled',
      },

      // Part-time maintenance
      {
        worker: workers[14],
        field: null,
        startTime: '08:00',
        endTime: '12:00',
        task: 'Equipment Maintenance',
        status: isPast ? 'completed' : 'scheduled',
      },

      // Piece rate workers
      {
        worker: workers[15],
        field: fields[1],
        startTime: '06:00',
        endTime: '14:00',
        task: 'Strawberry Harvesting (Piece Rate)',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[16],
        field: fields[1],
        startTime: '06:00',
        endTime: '14:00',
        task: 'Strawberry Harvesting (Piece Rate)',
        status: isPast ? 'completed' : 'scheduled',
      },
      {
        worker: workers[17],
        field: fields[1],
        startTime: '06:00',
        endTime: '14:00',
        task: 'Strawberry Harvesting (Piece Rate)',
        status: isPast ? 'completed' : 'scheduled',
      },

      // Truck driver
      {
        worker: workers[18],
        field: null,
        startTime: '05:00',
        endTime: '14:00',
        task: 'Delivery Routes',
        status: isPast ? 'completed' : 'scheduled',
      },
    ];

    for (const schedule of dailySchedules) {
      schedules.push({
        farm_id: farm.id,
        worker_id: schedule.worker.id,
        field_id: schedule.field?.id || null,
        scheduled_date: formatDate(scheduleDate),
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        task_type: schedule.task,
        task_description: null,
        status: schedule.status,
        notes: null,
      });
    }
  }

  await knex('schedules').insert(schedules);
  console.log('✓ Created schedules:', schedules.length);

  // 7. Create time entries for past schedules
  const pastSchedules = await knex('schedules')
    .where('farm_id', farm.id)
    .where('scheduled_date', '<', formatDate(today))
    .select('*');

  const timeEntries = [];
  for (const schedule of pastSchedules) {
    // Most workers clocked in/out properly
    const shouldCreateEntry = Math.random() > 0.1; // 90% have time entries

    if (shouldCreateEntry) {
      const scheduledDate = new Date(schedule.scheduled_date);
      const [startHour, startMin] = schedule.start_time.split(':').map(Number);
      const [endHour, endMin] = schedule.end_time.split(':').map(Number);

      // Add some variation to actual clock in/out times
      const clockInVariation = Math.floor(Math.random() * 15) - 5; // -5 to +10 minutes
      const clockOutVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10 minutes

      const clockIn = new Date(scheduledDate);
      clockIn.setHours(startHour, startMin + clockInVariation, 0, 0);

      const clockOut = new Date(scheduledDate);
      clockOut.setHours(endHour, endMin + clockOutVariation, 0, 0);

      // Calculate total hours
      const breakMinutes = Math.random() > 0.5 ? 30 : 60; // 30 or 60 min break
      const totalMs = clockOut.getTime() - clockIn.getTime();
      const totalHours = totalMs / (1000 * 60 * 60) - breakMinutes / 60;

      // Some entries are verified, some are not
      const isVerified = Math.random() > 0.3; // 70% verified

      timeEntries.push({
        farm_id: farm.id,
        worker_id: schedule.worker_id,
        schedule_id: schedule.id,
        clock_in: clockIn.toISOString(),
        clock_out: clockOut.toISOString(),
        break_minutes: breakMinutes,
        total_hours: totalHours.toFixed(2),
        task_type: schedule.task_type,
        field_id: schedule.field_id,
        notes: null,
        verified_by: isVerified ? users[1].id : null, // Verified by manager
        verified_at: isVerified ? new Date(clockOut.getTime() + 3_600_000).toISOString() : null, // Verified 1 hour after clock out
      });
    }
  }

  await knex('time_entries').insert(timeEntries);
  console.log('✓ Created time entries:', timeEntries.length);

  console.log('\n✅ Demo data seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Farm: ${farm.name}`);
  console.log(
    `   - Users: ${users.length} (Login: admin@greenfarm.com / manager@greenfarm.com / worker emails - Password: demo123)`
  );
  console.log(`   - Workers: ${workers.length}`);
  console.log(`   - Fields: ${fields.length}`);
  console.log(`   - Schedules: ${schedules.length}`);
  console.log(`   - Time Entries: ${timeEntries.length}`);
  console.log(`   - Certifications: ${certifications.length}`);
}

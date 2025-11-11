// Swagger/OpenAPI configuration for Farm Commons API

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.1',
    info: {
      title: 'Farm Commons API',
      version: '0.1.1',
      description: 'Shared farm management software, community owned. For the humans who feed us.',
      license: {
        name: 'AGPL-3.1',
        url: 'https://www.gnu.org/licenses/agpl-3.1.html',
      },
      contact: {
        name: 'Farm Commons Contributors',
        url: 'https://github.com/neighborhood-lab/farm-commons',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.farmcommons.org',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        // Error response
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'worker'],
              example: 'manager',
            },
            farm_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePassword123!',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'role', 'farm_id'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'newuser@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePassword123!',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'worker'],
              example: 'worker',
            },
            farm_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                access_token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                expires_in: {
                  type: 'number',
                  example: 604800,
                  description: 'Token expiration time in seconds (7 days)',
                },
              },
            },
          },
        },
        // Worker schemas
        Worker: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            farm_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
              nullable: true,
            },
            phone: {
              type: 'string',
              example: '+1-555-123-4567',
              nullable: true,
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1990-01-15',
              nullable: true,
            },
            hire_date: {
              type: 'string',
              format: 'date',
              example: '2024-01-01',
            },
            hourly_wage: {
              type: 'number',
              example: 18.50,
              nullable: true,
            },
            employment_status: {
              type: 'string',
              enum: ['active', 'inactive', 'seasonal'],
              example: 'active',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['tractor_operation', 'irrigation', 'harvesting'],
              nullable: true,
            },
            emergency_contact_name: {
              type: 'string',
              example: 'Jane Doe',
              nullable: true,
            },
            emergency_contact_phone: {
              type: 'string',
              example: '+1-555-987-6543',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.100Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.100Z',
            },
          },
        },
        CreateWorkerRequest: {
          type: 'object',
          required: ['first_name', 'last_name', 'hire_date'],
          properties: {
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              example: '+1-555-123-4567',
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1990-01-15',
            },
            hire_date: {
              type: 'string',
              format: 'date',
              example: '2024-01-01',
            },
            hourly_wage: {
              type: 'number',
              example: 18.50,
            },
            employment_status: {
              type: 'string',
              enum: ['active', 'inactive', 'seasonal'],
              example: 'active',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['tractor_operation', 'irrigation'],
            },
            emergency_contact_name: {
              type: 'string',
              example: 'Jane Doe',
            },
            emergency_contact_phone: {
              type: 'string',
              example: '+1-555-987-6543',
            },
          },
        },
        UpdateWorkerRequest: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              example: '+1-555-123-4567',
            },
            hourly_wage: {
              type: 'number',
              example: 19.10,
            },
            employment_status: {
              type: 'string',
              enum: ['active', 'inactive', 'seasonal'],
              example: 'active',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['tractor_operation', 'irrigation', 'harvesting'],
            },
            emergency_contact_name: {
              type: 'string',
              example: 'Jane Doe',
            },
            emergency_contact_phone: {
              type: 'string',
              example: '+1-555-987-6543',
            },
          },
        },
        PaginatedWorkersResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Worker',
                  },
                },
                total: {
                  type: 'number',
                  example: 50,
                },
                page: {
                  type: 'number',
                  example: 1,
                },
                per_page: {
                  type: 'number',
                  example: 20,
                },
                total_pages: {
                  type: 'number',
                  example: 3,
                },
              },
            },
          },
        },
        // Schedule schemas
        Schedule: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174003',
            },
            farm_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            worker_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            field_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174004',
              nullable: true,
            },
            scheduled_date: {
              type: 'string',
              format: 'date',
              example: '2024-11-15',
            },
            start_time: {
              type: 'string',
              format: 'time',
              example: '08:00:00',
            },
            end_time: {
              type: 'string',
              format: 'time',
              example: '17:00:00',
            },
            task_type: {
              type: 'string',
              example: 'Harvesting tomatoes',
            },
            notes: {
              type: 'string',
              example: 'Bring extra bins',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.100Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.100Z',
            },
            worker_first_name: {
              type: 'string',
              example: 'John',
            },
            worker_last_name: {
              type: 'string',
              example: 'Doe',
            },
            field_name: {
              type: 'string',
              example: 'North Field',
              nullable: true,
            },
          },
        },
        CreateScheduleRequest: {
          type: 'object',
          required: ['worker_id', 'scheduled_date', 'start_time', 'end_time', 'task_type'],
          properties: {
            worker_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            field_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174004',
            },
            scheduled_date: {
              type: 'string',
              format: 'date',
              example: '2024-11-15',
            },
            start_time: {
              type: 'string',
              format: 'time',
              example: '08:00:00',
            },
            end_time: {
              type: 'string',
              format: 'time',
              example: '17:00:00',
            },
            task_type: {
              type: 'string',
              example: 'Harvesting tomatoes',
            },
            notes: {
              type: 'string',
              example: 'Bring extra bins',
            },
          },
        },
        UpdateScheduleRequest: {
          type: 'object',
          properties: {
            worker_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            field_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174004',
            },
            scheduled_date: {
              type: 'string',
              format: 'date',
              example: '2024-11-15',
            },
            start_time: {
              type: 'string',
              format: 'time',
              example: '08:00:00',
            },
            end_time: {
              type: 'string',
              format: 'time',
              example: '17:00:00',
            },
            task_type: {
              type: 'string',
              example: 'Harvesting tomatoes',
            },
            notes: {
              type: 'string',
              example: 'Bring extra bins',
            },
          },
        },
        // Time Entry schemas
        TimeEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174005',
            },
            farm_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            worker_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            field_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174004',
              nullable: true,
            },
            clock_in: {
              type: 'string',
              format: 'date-time',
              example: '2024-11-10T08:00:00.100Z',
            },
            clock_out: {
              type: 'string',
              format: 'date-time',
              example: '2024-11-10T17:00:00.100Z',
              nullable: true,
            },
            break_minutes: {
              type: 'number',
              example: 30,
            },
            total_hours: {
              type: 'number',
              example: 8.5,
              nullable: true,
            },
            task_type: {
              type: 'string',
              example: 'Harvesting',
            },
            notes: {
              type: 'string',
              example: 'Completed north section',
              nullable: true,
            },
            verified_by: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              nullable: true,
            },
            verified_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-11-10T18:00:00.100Z',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-11-10T08:00:00.100Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-11-10T17:00:00.100Z',
            },
            worker_first_name: {
              type: 'string',
              example: 'John',
            },
            worker_last_name: {
              type: 'string',
              example: 'Doe',
            },
            field_name: {
              type: 'string',
              example: 'North Field',
              nullable: true,
            },
          },
        },
        ClockInRequest: {
          type: 'object',
          required: ['worker_id', 'task_type'],
          properties: {
            worker_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            field_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174004',
            },
            task_type: {
              type: 'string',
              example: 'Harvesting',
            },
            notes: {
              type: 'string',
              example: 'Starting north section',
            },
          },
        },
        ClockOutRequest: {
          type: 'object',
          properties: {
            break_minutes: {
              type: 'number',
              example: 30,
            },
            notes: {
              type: 'string',
              example: 'Completed north section',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Workers',
        description: 'Worker management endpoints',
      },
      {
        name: 'Schedules',
        description: 'Schedule management endpoints',
      },
      {
        name: 'Time Entries',
        description: 'Time tracking endpoints',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticate a user and receive a JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Successful login',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse',
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'User registration',
          description: 'Create a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterRequest',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User successfully registered',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse',
                  },
                },
              },
            },
            400: {
              description: 'Validation error or email already registered',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          description: 'Get the authenticated user\'s profile information',
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: 'User profile retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'User profile endpoint - requires authentication',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized - missing or invalid token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/workers': {
        get: {
          tags: ['Workers'],
          summary: 'List workers',
          description: 'Get a paginated list of workers for the authenticated user\'s farm',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1,
              },
            },
            {
              name: 'per_page',
              in: 'query',
              description: 'Number of items per page',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
              },
            },
          ],
          responses: {
            200: {
              description: 'Workers list retrieved',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PaginatedWorkersResponse',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Workers'],
          summary: 'Create worker',
          description: 'Create a new worker (requires admin or manager role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateWorkerRequest',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Worker created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/Worker',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/workers/{id}': {
        get: {
          tags: ['Workers'],
          summary: 'Get worker by ID',
          description: 'Get a single worker by ID',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Worker ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Worker retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/Worker',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Worker not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['Workers'],
          summary: 'Update worker',
          description: 'Update a worker (requires admin or manager role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Worker ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateWorkerRequest',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Worker updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/Worker',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Worker not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Workers'],
          summary: 'Delete worker',
          description: 'Delete a worker (requires admin role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Worker ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Worker deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'Worker deleted successfully',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Worker not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/schedules': {
        get: {
          tags: ['Schedules'],
          summary: 'List schedules',
          description: 'Get schedules for the authenticated user\'s farm with optional date range filter',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'start_date',
              in: 'query',
              description: 'Filter by start date (ISO 8601 format)',
              schema: {
                type: 'string',
                format: 'date',
                example: '2024-11-01',
              },
            },
            {
              name: 'end_date',
              in: 'query',
              description: 'Filter by end date (ISO 8601 format)',
              schema: {
                type: 'string',
                format: 'date',
                example: '2024-11-30',
              },
            },
          ],
          responses: {
            200: {
              description: 'Schedules retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Schedule',
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Schedules'],
          summary: 'Create schedule',
          description: 'Create a new schedule (requires admin or manager role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateScheduleRequest',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Schedule created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/Schedule',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/schedules/worker/{workerId}': {
        get: {
          tags: ['Schedules'],
          summary: 'Get worker schedules',
          description: 'Get all schedules for a specific worker',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'workerId',
              in: 'path',
              required: true,
              description: 'Worker ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Worker schedules retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Schedule',
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/schedules/{id}': {
        put: {
          tags: ['Schedules'],
          summary: 'Update schedule',
          description: 'Update a schedule (requires admin or manager role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Schedule ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateScheduleRequest',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Schedule updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/Schedule',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Schedule not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Schedules'],
          summary: 'Delete schedule',
          description: 'Delete a schedule (requires admin or manager role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Schedule ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Schedule deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'Schedule deleted successfully',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Schedule not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/time-entries': {
        get: {
          tags: ['Time Entries'],
          summary: 'List time entries',
          description: 'Get time entries for the authenticated user\'s farm with optional date range filter',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'start_date',
              in: 'query',
              description: 'Filter by start date (ISO 8601 format)',
              schema: {
                type: 'string',
                format: 'date',
                example: '2024-11-01',
              },
            },
            {
              name: 'end_date',
              in: 'query',
              description: 'Filter by end date (ISO 8601 format)',
              schema: {
                type: 'string',
                format: 'date',
                example: '2024-11-30',
              },
            },
          ],
          responses: {
            200: {
              description: 'Time entries retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/TimeEntry',
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/time-entries/worker/{workerId}': {
        get: {
          tags: ['Time Entries'],
          summary: 'Get worker time entries',
          description: 'Get all time entries for a specific worker',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'workerId',
              in: 'path',
              required: true,
              description: 'Worker ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Worker time entries retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/TimeEntry',
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/time-entries/clock-in': {
        post: {
          tags: ['Time Entries'],
          summary: 'Clock in',
          description: 'Clock in a worker to start tracking time',
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ClockInRequest',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Clocked in successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/TimeEntry',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error or worker already has an open time entry',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/time-entries/{id}/clock-out': {
        post: {
          tags: ['Time Entries'],
          summary: 'Clock out',
          description: 'Clock out a worker to stop tracking time',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Time entry ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ClockOutRequest',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Clocked out successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/TimeEntry',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error or time entry already clocked out',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Time entry not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/time-entries/{id}/verify': {
        post: {
          tags: ['Time Entries'],
          summary: 'Verify time entry',
          description: 'Verify a time entry (requires admin or manager role)',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Time entry ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Time entry verified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/TimeEntry',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Time entry not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We're using the definition object instead of JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

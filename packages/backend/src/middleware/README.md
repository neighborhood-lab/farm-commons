# Validation Middleware

Centralized request validation middleware using Zod schemas with built-in sanitization.

## Features

- **Generic Zod Schema Validation**: Validate request body, query, or params
- **XSS Protection**: Automatic HTML sanitization using DOMPurify
- **User-Friendly Error Messages**: Formatted validation errors
- **Type Safety**: Full TypeScript support
- **Flexible Configuration**: Customize sanitization and error handling

## Basic Usage

```typescript
import { validateBody, validateQuery, validateParams } from './middleware/validation';
import { createWorkerSchema } from '@farm-commons/shared';

// Validate request body
app.post('/api/workers',
  validateBody(createWorkerSchema),
  async (req, res) => {
    // req.body is now validated and sanitized
    const worker = await createWorker(req.body);
    res.json({ success: true, data: worker });
  }
);

// Validate query parameters
app.get('/api/workers',
  validateQuery(paginationSchema),
  async (req, res) => {
    const { page, per_page } = req.query;
    // ...
  }
);

// Validate URL parameters
app.get('/api/workers/:id',
  validateParams(uuidParamSchema),
  async (req, res) => {
    const { id } = req.params; // Validated UUID
    // ...
  }
);
```

## Advanced Usage

### Validate Multiple Targets

```typescript
import { validateMultiple } from './middleware/validation';

app.put('/api/workers/:id',
  validateMultiple({
    params: z.object({ id: z.string().uuid() }),
    body: updateWorkerSchema
  }),
  async (req, res) => {
    // Both params and body are validated
  }
);
```

### Custom Validation Options

```typescript
import { validate } from './middleware/validation';

app.post('/api/comments',
  validate(commentSchema, 'body', {
    sanitize: false,        // Disable HTML sanitization
    stripUnknown: true,     // Remove unknown properties
    errorPrefix: 'Comment validation failed'
  }),
  handler
);
```

### Using Common Schemas

```typescript
import { commonSchemas } from './middleware/validation';

const querySchema = z.object({
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  created_at: commonSchemas.dateString,
  active: commonSchemas.boolean,
});
```

## Error Response Format

When validation fails, the middleware returns a 400 response with this format:

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Validation failed for: email, age",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    },
    {
      "field": "age",
      "message": "Expected number, received string"
    }
  ]
}
```

## XSS Protection

The middleware automatically sanitizes all string inputs by default:

```typescript
// Input
{
  name: "<script>alert('xss')</script>John",
  bio: "Hello <img src=x onerror=alert('xss')>"
}

// After sanitization
{
  name: "John",
  bio: "Hello "
}
```

All HTML tags are stripped while preserving the text content.

## Testing

Comprehensive unit tests are provided in `__tests__/validation.test.ts`:

```bash
npm test -- validation.test.ts
```

Test coverage includes:
- Valid and invalid inputs
- XSS attack prevention
- Nested object validation
- Array validation
- Edge cases (null, undefined, unicode, etc.)
- Error formatting
- Multiple target validation

## Best Practices

1. **Always validate user input**: Use validation middleware on all routes that accept user data
2. **Use shared schemas**: Define schemas in `@farm-commons/shared/validators.ts` for reuse
3. **Enable sanitization**: Keep the default sanitization enabled unless you have a specific reason to disable it
4. **Provide clear error messages**: Use descriptive Zod error messages for better UX
5. **Test edge cases**: Write tests for your validation schemas

## Common Schemas Reference

The middleware provides these common schemas for quick reuse:

- `commonSchemas.uuid` - UUID validation
- `commonSchemas.email` - Email validation
- `commonSchemas.phone` - Phone number (10-20 digits)
- `commonSchemas.positiveInt` - Positive integer
- `commonSchemas.positiveNumber` - Positive number (int or float)
- `commonSchemas.dateString` - Date string that transforms to Date object
- `commonSchemas.boolean` - Boolean or string "true"/"false"

## Example: Complete Route

```typescript
import express from 'express';
import { validateBody, validateParams, uuidParamSchema } from './middleware/validation';
import { createWorkerSchema, updateWorkerSchema } from '@farm-commons/shared';

const router = express.Router();

// Create worker
router.post('/',
  validateBody(createWorkerSchema),
  async (req, res, next) => {
    try {
      const worker = await db('workers').insert(req.body).returning('*');
      res.json({ success: true, data: worker[0] });
    } catch (error) {
      next(error);
    }
  }
);

// Update worker
router.put('/:id',
  validateParams(uuidParamSchema),
  validateBody(updateWorkerSchema),
  async (req, res, next) => {
    try {
      const worker = await db('workers')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json({ success: true, data: worker[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

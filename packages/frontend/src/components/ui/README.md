# UI Design System

Reusable UI component library for Farm Commons frontend application.

## Components

### Button

Button component with multiple variants and sizes.

**Variants:**
- `primary` - Main actions (earth brown)
- `secondary` - Secondary actions (sage green)
- `danger` - Destructive actions (red)
- `outline` - Outlined button
- `ghost` - Ghost/transparent button
- `link` - Link-styled button

**Sizes:**
- `sm` - Small button
- `md` - Medium button (default)
- `lg` - Large button
- `icon` - Icon-only button

**Props:**
- `isLoading` - Shows loading spinner

**Example:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" isLoading>
  Deleting...
</Button>
```

### Input, Textarea, Select

Form input components with validation states.

**Features:**
- Label support
- Required field indicator
- Error state with message
- Helper text
- Accessible (ARIA attributes)

**Example:**
```tsx
import { Input, Textarea, Select } from '@/components/ui';

<Input
  label="Email"
  type="email"
  required
  error={errors.email}
  helperText="We'll never share your email"
/>

<Textarea
  label="Description"
  rows={4}
  error={errors.description}
/>

<Select
  label="Role"
  options={[
    { value: 'worker', label: 'Worker' },
    { value: 'manager', label: 'Manager' },
  ]}
  placeholder="Select a role"
/>
```

### Modal

Modal/Dialog component with animation.

**Features:**
- Framer Motion animations
- Escape key to close
- Click outside to close
- Customizable size
- Optional header and close button

**Example:**
```tsx
import { Modal, ModalFooter, Button } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

### Toast

Toast notification system with context provider.

**Features:**
- Success, error, warning, info types
- Auto-dismiss with configurable duration
- Manual dismiss
- Animated entrance/exit
- Stack multiple toasts

**Example:**
```tsx
// In your app root
import { ToastProvider } from '@/components/ui';

<ToastProvider defaultDuration={5000}>
  <App />
</ToastProvider>

// In any component
import { useToast } from '@/components/ui';

const { success, error, warning, info } = useToast();

success('Success!', 'Your changes have been saved.');
error('Error', 'Something went wrong.');
warning('Warning', 'Please review your inputs.');
info('Info', 'New update available.');
```

### Spinner & LoadingOverlay

Loading indicators.

**Example:**
```tsx
import { Spinner, LoadingOverlay } from '@/components/ui';

<Spinner size="md" color="primary" />

<LoadingOverlay message="Loading data..." />
```

### Skeleton

Skeleton loading placeholders.

**Components:**
- `Skeleton` - Basic skeleton
- `SkeletonText` - Multi-line text skeleton
- `SkeletonCard` - Card skeleton with optional image/avatar
- `SkeletonTable` - Table skeleton

**Example:**
```tsx
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from '@/components/ui';

<Skeleton variant="rectangular" height="200px" />
<SkeletonText lines={3} />
<SkeletonCard hasImage hasAvatar />
<SkeletonTable rows={5} columns={4} />
```

## Theme

The design system uses the following color palette defined in `tailwind.config.js`:

- **Earth tones** - Primary brand colors (brown)
- **Sage tones** - Secondary brand colors (green)

## Accessibility

All components follow accessibility best practices:
- Proper ARIA attributes
- Keyboard navigation support
- Focus indicators
- Screen reader support
- Semantic HTML

## Testing

Components should be tested with:
- Vitest for unit tests
- Testing Library for component tests
- Storybook for visual testing (future)

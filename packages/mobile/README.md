# Farm Commons Mobile App

React Native mobile application for Farm Commons time tracking.

## Features

### Clock In/Out Screen

The `ClockInScreen` component provides a mobile interface for workers to clock in and out with the following features:

- **Large Clock In/Out Buttons**: Easy-to-use interface optimized for mobile
- **GPS Location Capture**: Automatically captures worker location during clock in/out
- **Offline Queue Support**: Requests are queued when offline and synced when connection is restored
- **Photo Verification**: Optional photo capture for verification purposes
- **Real-time Elapsed Time**: Shows running timer for active time entries
- **Break Time Tracking**: Allows workers to record break minutes

## Installation

```bash
# Install dependencies
pnpm install

# Start Expo development server
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

## Usage

### ClockInScreen Component

```tsx
import { ClockInScreen } from '@farm-commons/mobile/src/screens';

function App() {
  return (
    <ClockInScreen
      workerId="worker-uuid"
      onClockInSuccess={(entry) => console.log('Clocked in:', entry)}
      onClockOutSuccess={(entry) => console.log('Clocked out:', entry)}
    />
  );
}
```

### Props

- `workerId` (optional): The worker ID to pre-select
- `onClockInSuccess` (optional): Callback when clock in succeeds
- `onClockOutSuccess` (optional): Callback when clock out succeeds

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Architecture

### API Client (`src/lib/api.ts`)

The API client provides typed methods for interacting with the Farm Commons backend:

- Clock in/out operations
- Worker and field data fetching
- Authentication
- Automatic offline request queuing

### Offline Queue (`src/services/offlineQueue.ts`)

Manages offline request queuing:

- Stores requests when network is unavailable
- Automatically retries when connection is restored
- Configurable retry logic with max attempts
- Persistent storage using AsyncStorage

### Permissions

The app requests the following permissions:

- **Location**: For GPS tracking during clock in/out (recommended but optional)
- **Camera**: For optional photo verification

## Environment Variables

Create a `.env` file in the mobile package directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## Dependencies

Key dependencies:

- **Expo**: React Native framework
- **expo-location**: GPS location services
- **expo-image-picker**: Photo capture
- **react-native-paper**: Material Design UI components
- **date-fns**: Date formatting and manipulation
- **@react-native-async-storage/async-storage**: Local storage

## Development

### File Structure

```
src/
├── screens/          # Screen components
│   └── ClockInScreen.tsx
├── lib/             # Core libraries
│   └── api.ts       # API client
├── services/        # Business logic services
│   └── offlineQueue.ts
├── types/           # TypeScript type definitions
│   └── index.ts
└── __tests__/       # Test files
    └── ClockInScreen.test.tsx
```

## Task Implementation

This implements **Task 0077** from TASKS.md:

- ✅ Large clock in/out buttons
- ✅ GPS location capture
- ✅ Offline queue support
- ✅ Photo capture option (verification)
- ✅ Mobile screen tests

## License

Private - Farm Commons

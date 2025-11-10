# Farm Commons Mobile App

React Native mobile application for Farm Commons worker schedule management.

## Features

### ✅ Task 0087: Mobile Schedule View (Implemented)

- **Today's Schedule View**: Highlights today's assigned schedules with quick actions
- **Week View**: Navigate through weeks with swipe-enabled navigation
- **Accept/Decline Schedule**: Workers can accept or decline assigned schedules
- **Real-time Updates**: Automatic refresh and real-time schedule updates
- **Push Notifications**: Schedule change notifications with Expo Push Notifications

## Architecture

### Directory Structure

```
src/
├── screens/          # Screen components
│   └── ScheduleScreen.tsx
├── components/       # Reusable UI components
│   ├── ScheduleCard.tsx
│   └── WeekNavigator.tsx
├── hooks/           # Custom React hooks
│   └── useSchedules.ts
├── lib/             # Libraries and services
│   ├── api.ts       # API client
│   └── notifications.ts
├── types/           # TypeScript type definitions
└── __tests__/       # Test files
    ├── ScheduleScreen.test.tsx
    ├── ScheduleCard.test.tsx
    └── useSchedules.test.ts
```

### Key Components

#### ScheduleScreen
Main screen component with:
- Segmented control for switching between Today/Week views
- Pull-to-refresh functionality
- Accept/decline schedule actions
- Snackbar notifications for user feedback

#### ScheduleCard
Reusable card component displaying:
- Task type and description
- Schedule time range
- Status chip with color coding
- Action buttons (Accept/Decline)
- Notes and additional information

#### WeekNavigator
Week navigation component with:
- Previous/Next week navigation
- Current week display
- Week range formatting

### State Management

- **React Query**: Server state management with automatic caching and refetching
- **Local State**: Component-level state with React hooks

### API Integration

The mobile app communicates with the Farm Commons backend API using:
- RESTful endpoints
- JWT authentication with token persistence
- Offline-ready architecture (foundation for future offline support)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator
- Physical device for push notifications testing

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
cd packages/mobile
pnpm start
```

### Running on Devices

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web (for development)
pnpm web
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Configuration

### Environment Variables

Create a `.env` file in the mobile package root:

```env
EXPO_PUBLIC_API_URL=http://your-api-url/api
```

### Push Notifications

Push notifications require an Expo project ID. Configure in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## API Endpoints Used

- `GET /api/schedules` - Fetch schedules with date filters
- `GET /api/schedules/:id` - Get single schedule
- `PUT /api/schedules/:id` - Update schedule status

## Future Enhancements

- Offline mode with WatermelonDB
- GPS-based clock in/out
- Photo verification for time entries
- Multi-language support
- Dark mode theme

## Related Tasks

- Task 0021: Setup Mobile Package Structure ✅
- Task 0022: Implement Offline Storage Schema (Pending)
- Task 0023: Create Mobile API Client ✅
- Task 0077: Create Mobile Clock-In Screen (Pending)
- Task 0087: Build Mobile Schedule View ✅ (This implementation)
- Task 0107: Create Mobile Push Notifications (Partial - foundation implemented)

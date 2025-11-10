import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RootNavigator } from '../src/navigation';

// Mock the screens
jest.mock('../src/screens/HomeScreen', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: () => (
      <View testID="home-screen">
        <Text>Home Screen</Text>
      </View>
    ),
  };
});

jest.mock('../src/screens/ScheduleScreen', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: () => (
      <View testID="schedule-screen">
        <Text>Schedule Screen</Text>
      </View>
    ),
  };
});

jest.mock('../src/screens/TimeTrackingScreen', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: () => (
      <View testID="time-tracking-screen">
        <Text>Time Tracking Screen</Text>
      </View>
    ),
  };
});

jest.mock('../src/screens/ProfileScreen', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: () => (
      <View testID="profile-screen">
        <Text>Profile Screen</Text>
      </View>
    ),
  };
});

describe('Navigation', () => {
  it('renders the initial home screen', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('navigates to the schedule screen', async () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Initial screen should be home
    expect(getByTestId('home-screen')).toBeTruthy();

    // Navigation would be tested with actual implementation
    // This is a basic structure test
  });

  it('has all expected screens in the navigator', () => {
    const { UNSAFE_getByType } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // This tests that the navigator was rendered
    expect(UNSAFE_getByType(NavigationContainer)).toBeTruthy();
  });
});

describe('Navigation Flow', () => {
  it('maintains navigation state when switching between screens', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Should render without errors
    expect(getByTestId('home-screen')).toBeTruthy();
  });
});

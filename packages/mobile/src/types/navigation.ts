import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Schedule: undefined;
  TimeTracking: undefined;
  Profile: undefined;
  Login: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type ScheduleScreenRouteProp = RouteProp<RootStackParamList, 'Schedule'>;
export type TimeTrackingScreenRouteProp = RouteProp<RootStackParamList, 'TimeTracking'>;
export type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

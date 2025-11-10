// Clock In/Out Screen
// Mobile worker time tracking with GPS, photos, and offline support

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Image,
  Text,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  TextInput,
  Chip,
  Surface,
} from 'react-native-paper';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { offlineQueue } from '../services/offlineQueue';
import type { ClockStatus, LocationCoords } from '../types';
import type { TimeEntry, Worker, Field } from '@farm-commons/shared';

interface ClockInScreenProps {
  workerId?: string;
  onClockInSuccess?: (entry: TimeEntry) => void;
  onClockOutSuccess?: (entry: TimeEntry) => void;
}

export default function ClockInScreen({
  workerId: initialWorkerId,
  onClockInSuccess,
  onClockOutSuccess,
}: ClockInScreenProps) {
  const [status, setStatus] = useState<ClockStatus>('loading');
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [workerId, setWorkerId] = useState(initialWorkerId || '');
  const [taskType, setTaskType] = useState('');
  const [fieldId, setFieldId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [locationPermission, setLocationPermission] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
    loadWorkers();
    loadFields();
    initOfflineQueue();
  }, []);

  // Check active time entry when worker is selected
  useEffect(() => {
    if (workerId) {
      checkActiveEntry();
    }
  }, [workerId]);

  // Update elapsed time every second
  useEffect(() => {
    if (activeEntry) {
      const interval = setInterval(() => {
        updateElapsedTime();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeEntry]);

  const requestPermissions = async () => {
    try {
      // Request location permission
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus === 'granted');

      // Request camera permission
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted');

      if (locationStatus !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location access is recommended for accurate time tracking.'
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const initOfflineQueue = async () => {
    await offlineQueue.init();
    const pendingCount = offlineQueue.getPendingCount();
    if (pendingCount > 0) {
      Alert.alert(
        'Offline Requests',
        `You have ${pendingCount} pending requests that will be synced when online.`
      );
    }
  };

  const loadWorkers = async () => {
    try {
      const response = await api.getWorkers();
      if (response.success && response.data) {
        setWorkers(response.data);
      }
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  };

  const loadFields = async () => {
    try {
      const response = await api.getFields();
      if (response.success && response.data) {
        setFields(response.data);
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
    }
  };

  const checkActiveEntry = async () => {
    try {
      setStatus('loading');
      const response = await api.getActiveTimeEntry(workerId);
      if (response.success && response.data) {
        setActiveEntry(response.data);
        setStatus('clocked_in');
      } else {
        setActiveEntry(null);
        setStatus('clocked_out');
      }
    } catch (error) {
      console.error('Failed to check active entry:', error);
      setStatus('error');
    }
  };

  const updateElapsedTime = () => {
    if (!activeEntry) return;

    const clockInTime = new Date(activeEntry.clock_in);
    const now = new Date();
    const diff = now.getTime() - clockInTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setElapsedTime(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  };

  const captureLocation = async (): Promise<LocationCoords | null> => {
    if (!locationPermission) {
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to take photos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleClockIn = async () => {
    if (!workerId || !taskType) {
      Alert.alert('Missing Information', 'Please select worker and enter task type');
      return;
    }

    try {
      setLoading(true);

      // Capture location
      const currentLocation = await captureLocation();
      setLocation(currentLocation);

      // Clock in
      const response = await api.clockIn({
        worker_id: workerId,
        task_type: taskType,
        field_id: fieldId || undefined,
        notes: notes || undefined,
        location: currentLocation || undefined,
        photo_uri: photoUri || undefined,
      });

      if (response.success && response.data) {
        setActiveEntry(response.data);
        setStatus('clocked_in');
        Alert.alert('Success', 'Clocked in successfully!');
        onClockInSuccess?.(response.data);

        // Reset form
        setTaskType('');
        setFieldId('');
        setNotes('');
        setPhotoUri(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clock in';
      Alert.alert('Clock In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) {
      return;
    }

    try {
      setLoading(true);

      // Capture location
      const currentLocation = await captureLocation();
      setLocation(currentLocation);

      const response = await api.clockOut(activeEntry.id, {
        break_minutes: Number.parseInt(breakMinutes, 10) || 0,
        notes: notes || undefined,
        location: currentLocation || undefined,
        photo_uri: photoUri || undefined,
      });

      if (response.success && response.data) {
        Alert.alert('Success', 'Clocked out successfully!');
        onClockOutSuccess?.(response.data);

        // Reset state
        setActiveEntry(null);
        setStatus('clocked_out');
        setBreakMinutes('0');
        setNotes('');
        setPhotoUri(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clock out';
      Alert.alert('Clock Out Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderClockInForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Clock In</Title>

        <TextInput
          label="Task Type"
          value={taskType}
          onChangeText={setTaskType}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Harvesting, Planting, Weeding"
        />

        <TextInput
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={takePhoto}
            icon="camera"
            style={styles.halfButton}
            disabled={!cameraPermission}
          >
            {photoUri ? 'Retake' : 'Photo'}
          </Button>

          {location && (
            <Chip icon="map-marker" style={styles.chip}>
              Location captured
            </Chip>
          )}
        </View>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        )}

        <Button
          mode="contained"
          onPress={handleClockIn}
          loading={loading}
          disabled={loading || !workerId || !taskType}
          style={styles.clockButton}
          contentStyle={styles.clockButtonContent}
        >
          CLOCK IN
        </Button>
      </Card.Content>
    </Card>
  );

  const renderActiveEntry = () => {
    if (!activeEntry) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Currently Clocked In</Title>

          <Surface style={styles.timerSurface}>
            <Paragraph style={styles.timerLabel}>Elapsed Time</Paragraph>
            <Title style={styles.timerText}>{elapsedTime}</Title>
          </Surface>

          <View style={styles.entryInfo}>
            <Paragraph>
              <Text style={styles.label}>Task:</Text> {activeEntry.task_type}
            </Paragraph>
            <Paragraph>
              <Text style={styles.label}>Started:</Text>{' '}
              {format(new Date(activeEntry.clock_in), 'h:mm a')}
            </Paragraph>
          </View>

          <TextInput
            label="Break Time (minutes)"
            value={breakMinutes}
            onChangeText={setBreakMinutes}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={takePhoto}
              icon="camera"
              style={styles.halfButton}
              disabled={!cameraPermission}
            >
              {photoUri ? 'Retake' : 'Photo'}
            </Button>
          </View>

          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          )}

          <Button
            mode="contained"
            onPress={handleClockOut}
            loading={loading}
            disabled={loading}
            style={[styles.clockButton, styles.clockOutButton]}
            contentStyle={styles.clockButtonContent}
          >
            CLOCK OUT
          </Button>
        </Card.Content>
      </Card>
    );
  };

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Paragraph>Loading...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {status === 'clocked_in' ? renderActiveEntry() : renderClockInForm()}

        {offlineQueue.getPendingCount() > 0 && (
          <Card style={styles.offlineCard}>
            <Card.Content>
              <Paragraph style={styles.offlineText}>
                {offlineQueue.getPendingCount()} pending requests will sync when
                online
              </Paragraph>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  clockButton: {
    marginTop: 16,
  },
  clockButtonContent: {
    paddingVertical: 12,
  },
  clockOutButton: {
    backgroundColor: '#d32f2f',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  halfButton: {
    flex: 1,
    marginRight: 8,
  },
  chip: {
    marginLeft: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  timerSurface: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1976d2',
    fontVariant: ['tabular-nums'],
  },
  entryInfo: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
  },
  offlineCard: {
    backgroundColor: '#fff3cd',
  },
  offlineText: {
    color: '#856404',
    textAlign: 'center',
  },
});

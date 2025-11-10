/**
 * ScheduleScreen Component
 * Main schedule view with today's highlight and week navigation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Appbar, Text, Divider, SegmentedButtons, FAB, Snackbar } from 'react-native-paper';
import { format, isToday, parseISO } from 'date-fns';
import { Schedule } from '@farm-commons/shared';

import {
  useTodaySchedules,
  useWeekSchedules,
  useAcceptSchedule,
  useDeclineSchedule,
} from '../hooks/useSchedules';
import { ScheduleCard } from '../components/ScheduleCard';
import { WeekNavigator } from '../components/WeekNavigator';

export function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [weekOffset, setWeekOffset] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch schedules based on view mode
  const todayQuery = useTodaySchedules();
  const weekQuery = useWeekSchedules(weekOffset);

  // Mutations
  const acceptMutation = useAcceptSchedule();
  const declineMutation = useDeclineSchedule();

  const isLoading =
    (viewMode === 'today' ? todayQuery.isLoading : weekQuery.isLoading) ||
    acceptMutation.isPending ||
    declineMutation.isPending;

  const schedules = viewMode === 'today' ? todayQuery.data : weekQuery.data;

  const handleRefresh = useCallback(() => {
    if (viewMode === 'today') {
      todayQuery.refetch();
    } else {
      weekQuery.refetch();
    }
  }, [viewMode, todayQuery, weekQuery]);

  const handleAccept = useCallback(
    async (scheduleId: string) => {
      try {
        await acceptMutation.mutateAsync(scheduleId);
        setSnackbarMessage('Schedule accepted!');
        setSnackbarVisible(true);
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to accept schedule'
        );
      }
    },
    [acceptMutation]
  );

  const handleDecline = useCallback(
    (scheduleId: string) => {
      Alert.alert(
        'Decline Schedule',
        'Are you sure you want to decline this schedule?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: async () => {
              try {
                await declineMutation.mutateAsync(scheduleId);
                setSnackbarMessage('Schedule declined');
                setSnackbarVisible(true);
              } catch (error) {
                Alert.alert(
                  'Error',
                  error instanceof Error ? error.message : 'Failed to decline schedule'
                );
              }
            },
          },
        ]
      );
    },
    [declineMutation]
  );

  const handleWeekChange = useCallback((offset: number) => {
    setWeekOffset(offset);
  }, []);

  // Group schedules by date for week view
  const groupedSchedules = React.useMemo(() => {
    if (!schedules || viewMode !== 'week') return {};

    return schedules.reduce((acc, schedule) => {
      const date = format(parseISO(schedule.scheduled_date.toString()), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(schedule);
      return acc;
    }, {} as Record<string, Schedule[]>);
  }, [schedules, viewMode]);

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <ScheduleCard schedule={item} onAccept={handleAccept} onDecline={handleDecline} />
  );

  const renderTodayView = () => {
    if (todayQuery.isLoading) {
      return (
        <View style={styles.centerContainer}>
          <Text>Loading schedules...</Text>
        </View>
      );
    }

    if (todayQuery.error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Error loading schedules: {todayQuery.error.message}
          </Text>
        </View>
      );
    }

    if (!schedules || schedules.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No schedules for today</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      />
    );
  };

  const renderWeekView = () => {
    if (weekQuery.isLoading) {
      return (
        <View style={styles.centerContainer}>
          <Text>Loading schedules...</Text>
        </View>
      );
    }

    if (weekQuery.error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Error loading schedules: {weekQuery.error.message}
          </Text>
        </View>
      );
    }

    const dateKeys = Object.keys(groupedSchedules).sort();

    if (dateKeys.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No schedules this week</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.weekContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {dateKeys.map((date) => {
          const dateObj = parseISO(date);
          const schedulesForDate = groupedSchedules[date];

          return (
            <View key={date} style={styles.daySection}>
              <View style={styles.daySectionHeader}>
                <Text
                  variant="titleMedium"
                  style={[styles.dateText, isToday(dateObj) && styles.todayText]}
                >
                  {format(dateObj, 'EEEE, MMMM d')}
                  {isToday(dateObj) && ' (Today)'}
                </Text>
              </View>
              {schedulesForDate.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Schedule" />
        <Appbar.Action icon="bell-outline" onPress={() => {}} />
      </Appbar.Header>

      <View style={styles.controls}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'today' | 'week')}
          buttons={[
            { value: 'today', label: 'Today', icon: 'calendar-today' },
            { value: 'week', label: 'Week', icon: 'calendar-week' },
          ]}
        />
      </View>

      {viewMode === 'week' && (
        <>
          <WeekNavigator weekOffset={weekOffset} onWeekChange={handleWeekChange} />
          <Divider />
        </>
      )}

      <View style={styles.content}>
        {viewMode === 'today' ? renderTodayView() : renderWeekView()}
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  weekContainer: {
    flex: 1,
  },
  daySection: {
    marginVertical: 8,
  },
  daySectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontWeight: 'bold',
  },
  todayText: {
    color: '#1976d2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
});

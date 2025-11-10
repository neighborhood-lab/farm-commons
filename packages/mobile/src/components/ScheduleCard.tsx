/**
 * ScheduleCard Component
 * Displays a single schedule item with action buttons
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, useTheme } from 'react-native-paper';
import { Schedule } from '@farm-commons/shared';
import { format } from 'date-fns';

interface ScheduleCardProps {
  schedule: Schedule;
  onAccept?: (scheduleId: string) => void;
  onDecline?: (scheduleId: string) => void;
  showActions?: boolean;
}

export function ScheduleCard({
  schedule,
  onAccept,
  onDecline,
  showActions = true,
}: ScheduleCardProps) {
  const theme = useTheme();

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'in_progress':
        return theme.colors.tertiary;
      case 'completed':
        return theme.colors.secondary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const formatTime = (time: string) => {
    // Assuming time is in HH:mm format
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return format(date, 'h:mm a');
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.taskType}>
            {schedule.task_type}
          </Text>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(schedule.status) }]}
            textStyle={{ color: '#fff' }}
          >
            {schedule.status}
          </Chip>
        </View>

        <View style={styles.timeContainer}>
          <Text variant="bodyLarge" style={styles.time}>
            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
          </Text>
        </View>

        {schedule.task_description && (
          <Text variant="bodyMedium" style={styles.description}>
            {schedule.task_description}
          </Text>
        )}

        {schedule.notes && (
          <Text variant="bodySmall" style={styles.notes}>
            Note: {schedule.notes}
          </Text>
        )}
      </Card.Content>

      {showActions && schedule.status === 'scheduled' && (
        <Card.Actions>
          <Button
            mode="outlined"
            onPress={() => onDecline?.(schedule.id)}
            style={styles.actionButton}
          >
            Decline
          </Button>
          <Button
            mode="contained"
            onPress={() => onAccept?.(schedule.id)}
            style={styles.actionButton}
          >
            Accept
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskType: {
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    height: 28,
  },
  timeContainer: {
    marginVertical: 4,
  },
  time: {
    fontWeight: '600',
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#888',
  },
  actionButton: {
    marginLeft: 8,
  },
});

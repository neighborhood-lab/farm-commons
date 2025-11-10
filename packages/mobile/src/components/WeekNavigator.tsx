/**
 * WeekNavigator Component
 * Navigation controls for switching between weeks
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

interface WeekNavigatorProps {
  weekOffset: number;
  onWeekChange: (offset: number) => void;
}

export function WeekNavigator({ weekOffset, onWeekChange }: WeekNavigatorProps) {
  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 0,
  });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });

  const weekLabel =
    weekOffset === 0
      ? 'This Week'
      : `${format(currentWeekStart, 'MMM d')} - ${format(currentWeekEnd, 'MMM d')}`;

  return (
    <View style={styles.container}>
      <IconButton
        icon="chevron-left"
        size={24}
        onPress={() => onWeekChange(weekOffset - 1)}
      />
      <Text variant="titleMedium" style={styles.weekLabel}>
        {weekLabel}
      </Text>
      <IconButton
        icon="chevron-right"
        size={24}
        onPress={() => onWeekChange(weekOffset + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

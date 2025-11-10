import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Chip, Text } from 'react-native-paper';

export default function ScheduleScreen() {
  // This will later fetch from WatermelonDB or API
  const schedules = [
    {
      id: '1',
      date: '2025-11-10',
      time: '08:00 - 16:00',
      task: 'Planting',
      field: 'North Field',
      status: 'upcoming',
    },
    {
      id: '2',
      date: '2025-11-11',
      time: '09:00 - 15:00',
      task: 'Irrigation',
      field: 'South Field',
      status: 'upcoming',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Upcoming Schedule</Text>

        {schedules.map((schedule) => (
          <Card key={schedule.id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>{schedule.task}</Title>
                <Chip mode="outlined">{schedule.status}</Chip>
              </View>
              <Paragraph>Field: {schedule.field}</Paragraph>
              <Paragraph>Date: {schedule.date}</Paragraph>
              <Paragraph>Time: {schedule.time}</Paragraph>
            </Card.Content>
          </Card>
        ))}
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
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});

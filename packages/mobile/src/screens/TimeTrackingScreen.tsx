import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';

export default function TimeTrackingScreen() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  const handleClockIn = () => {
    setIsClockedIn(true);
    setClockInTime(new Date());
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setClockInTime(null);
    // TODO: Save time entry to database
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Time Clock</Title>
            {isClockedIn && clockInTime ? (
              <>
                <Paragraph>Clocked in at: {clockInTime.toLocaleTimeString()}</Paragraph>
                <Button
                  mode="contained"
                  onPress={handleClockOut}
                  style={styles.button}
                  buttonColor="#ef4444"
                >
                  Clock Out
                </Button>
              </>
            ) : (
              <>
                <Paragraph>Ready to start work?</Paragraph>
                <Button
                  mode="contained"
                  onPress={handleClockIn}
                  style={styles.button}
                  buttonColor="#22c55e"
                >
                  Clock In
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Today's Hours</Title>
            <Text style={styles.hours}>0.0 hours</Text>
            <Paragraph>No time entries for today</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Recent Time Entries</Title>
            <Paragraph>Your recent work hours will appear here.</Paragraph>
          </Card.Content>
        </Card>
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
  card: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  hours: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
});

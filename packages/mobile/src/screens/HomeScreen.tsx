import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { RootNavigationProp } from '../types/navigation';

export default function HomeScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome to Farm Commons</Title>
            <Paragraph>
              Manage your farm work, track time, and stay connected with your team.
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate('Schedule')}>
          <Card.Content>
            <Title>My Schedule</Title>
            <Paragraph>View your upcoming work assignments and tasks.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('Schedule')}>
              View Schedule
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate('TimeTracking')}>
          <Card.Content>
            <Title>Time Tracking</Title>
            <Paragraph>Clock in/out and track your work hours.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('TimeTracking')}>
              Track Time
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate('Profile')}>
          <Card.Content>
            <Title>Profile</Title>
            <Paragraph>View your profile, certifications, and settings.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('Profile')}>
              View Profile
            </Button>
          </Card.Actions>
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
});

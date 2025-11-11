import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, List, Divider } from 'react-native-paper';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Worker Information</Title>
            <Paragraph>Name: Demo Worker</Paragraph>
            <Paragraph>Role: Field Worker</Paragraph>
            <Paragraph>Employee ID: FW-001</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Certifications</Title>
            <List.Item
              title="Pesticide Applicator"
              description="Expires: 2026-06-15"
              left={(props) => <List.Icon {...props} icon="certificate" />}
            />
            <Divider />
            <List.Item
              title="Forklift Operator"
              description="Expires: 2025-12-20"
              left={(props) => <List.Icon {...props} icon="certificate" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Contact Information</Title>
            <Paragraph>Phone: (555) 123-4567</Paragraph>
            <Paragraph>Email: demo@example.com</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Settings</Title>
            <List.Item
              title="Notifications"
              description="Manage notification preferences"
              left={(props) => <List.Icon {...props} icon="bell" />}
            />
            <Divider />
            <List.Item
              title="Language"
              description="English"
              left={(props) => <List.Icon {...props} icon="translate" />}
            />
            <Divider />
            <List.Item
              title="Offline Mode"
              description="Sync when online"
              left={(props) => <List.Icon {...props} icon="cloud-sync" />}
            />
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
});

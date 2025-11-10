/**
 * Notifications Service
 * Handles push notifications and schedule change alerts
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'schedule_change' | 'schedule_reminder' | 'schedule_cancelled';
  scheduleId?: string;
  message?: string;
}

class NotificationsService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null, // null means show immediately
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Show schedule change notification
   */
  async notifyScheduleChange(
    scheduleId: string,
    taskType: string,
    changeType: 'updated' | 'cancelled'
  ): Promise<string> {
    const title =
      changeType === 'cancelled' ? 'Schedule Cancelled' : 'Schedule Updated';
    const body =
      changeType === 'cancelled'
        ? `Your ${taskType} schedule has been cancelled`
        : `Your ${taskType} schedule has been updated`;

    return this.scheduleNotification(title, body, {
      type: 'schedule_change',
      scheduleId,
    });
  }

  /**
   * Show schedule reminder notification
   */
  async notifyScheduleReminder(
    scheduleId: string,
    taskType: string,
    startTime: string
  ): Promise<string> {
    return this.scheduleNotification(
      'Upcoming Schedule',
      `Don't forget: ${taskType} at ${startTime}`,
      {
        type: 'schedule_reminder',
        scheduleId,
      }
    );
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
export default notificationsService;

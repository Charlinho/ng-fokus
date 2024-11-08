import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  requestPermission(): Promise<NotificationPermission> {
    if (!this.notificationSupported) {
      return Promise.reject('Notifications not supported');
    }
    return window.Notification.requestPermission();
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (!this.notificationSupported) {
      console.warn('Notifications not supported');
      return;
    }

    if (window.Notification.permission === 'granted') {
      new window.Notification(title, options);
    } else {
      console.warn('Notification permission not granted');
    }
  }

  isNotificationSupported(): boolean {
    return this.notificationSupported;
  }

  getCurrentPermission(): NotificationPermission | null {
    if (!this.notificationSupported) {
      return null;
    }
    return window.Notification.permission;
  }

  private get notificationSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'Notification' in window;
  }
}

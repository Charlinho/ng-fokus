import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationMessage } from './notification-message';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  readonly VAPID_PUBLIC_KEY = 'BNZzDOwgQwNDbaoXbWqRAkB894ugc3xR1C3UXnPyewsPWSEdAbJ1THPy7hzOea_3pJsflLF_Nm4yMj4PbG44UsU';
  private baseUrl = 'http://localhost:3000';

  constructor(
    private swPush: SwPush,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.subscribeToNotifications();
  }

  subscribeToNotifications() {
    if (!this.swPush.isEnabled) return;

    this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY
    })
    .then(subscription => {
      this.sendSubscriptionToServer(subscription)
        .subscribe();
    })
    .catch(error => console.error('Erro ao se inscrever:', error));
  }


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

  private sendSubscriptionToServer(subscription: PushSubscription): Observable<NotificationMessage> {
    return this.http.post<NotificationMessage>(
      `${this.baseUrl}/subscribe`,
      subscription
    );
  }
}

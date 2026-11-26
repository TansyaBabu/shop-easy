import { Injectable, signal } from '@angular/core';

export interface Notification {
  kind: 'success' | 'error';
  text: string;
}

/** One global message at a time, shown by the app shell. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly message = signal<Notification | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  success(text: string): void {
    this.show({ kind: 'success', text });
  }

  error(text: string): void {
    this.show({ kind: 'error', text });
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.message.set(null);
  }

  private show(message: Notification): void {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(null), 4000);
  }
}

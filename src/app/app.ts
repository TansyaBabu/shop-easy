import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';
import { NotificationService } from './core/services/notification.service';
import { ProductService } from './core/services/product.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  readonly notify = inject(NotificationService);
  private readonly products = inject(ProductService);

  constructor() {
    // After a page reload we still have the token but not the user's name.
    // A 401 here is handled by the error interceptor (token cleared, back to login).
    if (this.auth.token()) {
      this.auth.loadMe().subscribe({ error: () => undefined });
    }
  }

  /** Demo button: GET /http/500 so you can show the global error message. */
  triggerServerError(): void {
    this.products.triggerServerError().subscribe({ error: () => undefined });
  }
}

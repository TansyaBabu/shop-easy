import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * 401        -> clear the session and go to login
 * 0 or 5xx   -> global "Server problem" message
 * Every error is re-thrown so the component can still show its own state
 * (400 on login, 404 on detail, ...).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.clearSession();
        void router.navigateByUrl('/login');
      } else if (error.status === 0 || error.status >= 500) {
        notify.error('Server problem, try again');
      }
      return throwError(() => error);
    }),
  );
};

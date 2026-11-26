import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

/** Adds `Authorization: Bearer <token>` to every request when we have a token. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token) {
    return next(req);
  }
  // Requests are immutable, so clone with the extra header.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

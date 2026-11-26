import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';

import { API_URL } from '../config';
import { LoginRequest, LoginResponse, User } from '../models/auth.model';

const TOKEN_KEY = 'shopeasy.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** The access token (null = logged out). Kept in localStorage so a reload keeps the session. */
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  /** The logged-in user, filled from GET /auth/me. */
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.token() !== null);

  /** POST /auth/login, store the token, then load the user with GET /auth/me. */
  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, credentials).pipe(
      tap((res) => this.setToken(res.accessToken)),
      switchMap(() => this.loadMe()),
    );
  }

  /** GET /auth/me — the auth interceptor adds the Bearer header. */
  loadMe(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/me`).pipe(tap((user) => this.user.set(user)));
  }

  logout(): void {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  /** Forget the token and user (used by logout and by the 401 handler). */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }
}

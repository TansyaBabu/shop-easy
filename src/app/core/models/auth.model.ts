/** Body of POST /auth/login */
export interface LoginRequest {
  username: string;
  password: string;
}

/** The user fields we use (GET /auth/me returns these and more). */
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

/** Response of POST /auth/login: user info plus tokens. */
export interface LoginResponse extends User {
  accessToken: string;
  refreshToken: string;
}

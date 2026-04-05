export interface AuthUserContract {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface AuthResponseContract {
  accessToken: string;
  expiresIn: string;
  user: AuthUserContract;
}

export interface LoginContract {
  email: string;
  password: string;
}

export interface RegisterContract extends LoginContract {
  name: string;
  phone?: string;
}

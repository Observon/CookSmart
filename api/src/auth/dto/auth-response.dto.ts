export class AuthUserDto {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export class AuthResponseDto {
  accessToken: string;
  expiresIn: string;
  user: AuthUserDto;
}

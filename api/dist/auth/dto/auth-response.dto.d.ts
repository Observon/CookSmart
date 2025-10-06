export declare class AuthUserDto {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
}
export declare class AuthResponseDto {
    accessToken: string;
    expiresIn: string;
    user: AuthUserDto;
}

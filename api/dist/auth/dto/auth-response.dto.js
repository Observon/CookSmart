"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResponseDto = exports.AuthUserDto = void 0;
class AuthUserDto {
    id;
    name;
    email;
    phone;
}
exports.AuthUserDto = AuthUserDto;
class AuthResponseDto {
    accessToken;
    expiresIn;
    user;
}
exports.AuthResponseDto = AuthResponseDto;
//# sourceMappingURL=auth-response.dto.js.map
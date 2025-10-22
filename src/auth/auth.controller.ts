import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from './schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------------- SIGNUP ----------------
  @Post('signup')
  async signup(
    @Body() body: { nom: string; prenom: string; email: string; password: string; role: UserRole },
  ) {
    const user = await this.authService.signup(body);
    return { message: 'Utilisateur créé avec succès', userId: user._id, role: user.role };
  }

  // ---------------- LOGIN ----------------
  @HttpCode(200)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  // ---------------- REFRESH TOKEN ----------------
  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  // ---------------- FORGOT PASSWORD ----------------
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  // ---------------- RESET PASSWORD ----------------
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
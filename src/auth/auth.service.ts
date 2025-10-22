import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';

import { User, UserDocument, UserRole } from './schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { ResetToken, ResetTokenDocument } from './schemas/reset-token.schema';
import { MailService } from 'services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(ResetToken.name) private readonly resetTokenModel: Model<ResetTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ---------------- SIGNUP ----------------
  async signup(data: { nom: string; prenom: string; email: string; password: string; role: UserRole }) {
    const { email, password, nom, prenom, role } = data;

    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Role invalide');
    }

    const existing = await this.userModel.findOne({ email });
    if (existing) throw new BadRequestException('Email déjà utilisé');

    const hashed = await bcrypt.hash(password, 10);
    return this.userModel.create({ nom, prenom, email, password: hashed, role });
  }

  // ---------------- LOGIN ----------------
  async login(credentials: { email: string; password: string }) {
    const user = await this.userModel.findOne({ email: credentials.email });
    if (!user) throw new UnauthorizedException('Email ou mot de passe invalide');

    const valid = await bcrypt.compare(credentials.password, user.password);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe invalide');

    const tokens = await this.generateTokens(user._id.toString());
    return { userId: user._id, role: user.role, ...tokens };
  }

  // ---------------- TOKENS ----------------
  private async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 3);

    await this.refreshTokenModel.updateOne(
      { userId },
      { token: refreshToken, expiryDate: expiry },
      { upsert: true },
    );

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    const tokenDoc = await this.refreshTokenModel.findOne({ token: refreshToken, expiryDate: { $gte: new Date() } });
    if (!tokenDoc) throw new UnauthorizedException('Refresh token invalide');

    return this.generateTokens(tokenDoc.userId.toString());
  }

  // ---------------- FORGOT / RESET PASSWORD ----------------
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation' };

    const resetToken = nanoid(64);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.resetTokenModel.create({ token: resetToken, userId: user._id, expiryDate: expiry });
    this.mailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenDoc = await this.resetTokenModel.findOne({ token, expiryDate: { $gte: new Date() } });
    if (!tokenDoc) throw new UnauthorizedException('Lien invalide');

    const user = await this.userModel.findById(tokenDoc.userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await this.resetTokenModel.deleteOne({ _id: tokenDoc._id });
  }

  // ---------------- PERMISSIONS ----------------
  async getUserPermissions(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    switch (user.role) {
      case UserRole.RESTAURANT:
        return [
          {
            resource: 'items',
            actions: ['create', 'read', 'update', 'delete', 'manage'],
          },
          {
            resource: 'restaurants',
            actions: ['read', 'update'], // Can read and update their own restaurant
          },
        ];
      case UserRole.CLIENT:
        return [
          { resource: 'items', actions: ['read'] }, // Can view all items
          { resource: 'orders', actions: ['create', 'read', 'buy'] }, // Can buy items
        ];
      case UserRole.CHARITY:
        return [
          { resource: 'items', actions: ['read'] }, // Can view all items
          { resource: 'orders', actions: ['create', 'read', 'buy', 'claim'] }, // Can buy or claim free items
        ];
      default:
        return [];
    }
  }
}

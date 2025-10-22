import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class SignupDto {
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsNotEmpty({ message: 'Le prénom est requis' })
  prenom: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @MinLength(6, { message: 'Le mot de passe doit comporter au moins 6 caractères' })
  password: string;

  @IsEnum(UserRole, { message: 'Le rôle doit être restaurant, client ou charity' })
  role: UserRole;
}

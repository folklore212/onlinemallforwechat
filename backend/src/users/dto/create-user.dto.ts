import { IsString, IsEmail, IsPhoneNumber, IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../entities/user.entity';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('CN')
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('CN')
  contactPhone?: string;

  @IsOptional()
  @IsString()
  openid?: string;

  @IsOptional()
  @IsString()
  unionid?: string;
}
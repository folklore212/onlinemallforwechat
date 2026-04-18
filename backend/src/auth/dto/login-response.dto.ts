import { UserType } from '../../users/entities/user.entity';

export class LoginResponseDto {
  accessToken: string;
  user: {
    id: number;
    username?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
    userType: UserType;
    companyName?: string;
    companyAddress?: string;
    contactPerson?: string;
    contactPhone?: string;
  };
}
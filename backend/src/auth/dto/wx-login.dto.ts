import { IsString } from 'class-validator';

export class WxLoginDto {
  @IsString()
  code: string;
}
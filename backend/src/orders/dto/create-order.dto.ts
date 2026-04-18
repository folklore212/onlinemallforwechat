import { IsString, IsOptional, IsPhoneNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  quantity: number;

  @IsOptional()
  @IsString()
  selectedSize?: string;

  @IsOptional()
  @IsString()
  selectedColor?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('CN')
  contactPhone?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[]; // 如果不传，则从购物车创建
}
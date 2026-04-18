import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class CreateShoppingCartItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  selectedSize?: string;

  @IsOptional()
  @IsString()
  selectedColor?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
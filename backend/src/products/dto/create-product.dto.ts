import { IsString, IsNumber, IsInt, IsOptional, IsArray, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxOrderQuantity?: number;

  @IsOptional()
  @Type(() => Object)
  sizeChart?: any;

  @IsOptional()
  @IsArray()
  colorOptions?: string[];

  @IsOptional()
  @IsUrl()
  mainImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageGallery?: string[];
}
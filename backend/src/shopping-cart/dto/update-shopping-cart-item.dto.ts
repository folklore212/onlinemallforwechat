import { PartialType } from '@nestjs/swagger';
import { CreateShoppingCartItemDto } from './create-shopping-cart-item.dto';

export class UpdateShoppingCartItemDto extends PartialType(CreateShoppingCartItemDto) {}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_name', length: 200 })
  productName: string;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitPrice: number;

  @Column({ name: 'quantity' })
  quantity: number;

  @Column({ name: 'selected_size', length: 50, nullable: true })
  selectedSize: string;

  @Column({ name: 'selected_color', length: 50, nullable: true })
  selectedColor: string;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
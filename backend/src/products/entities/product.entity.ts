import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.id)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'sku', length: 50, unique: true, nullable: true })
  sku: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'min_order_quantity', default: 1 })
  minOrderQuantity: number;

  @Column({ name: 'max_order_quantity', nullable: true })
  maxOrderQuantity: number;

  @Column({ name: 'size_chart', type: 'json', nullable: true })
  sizeChart: any; // JSON格式的尺码表

  @Column({ name: 'color_options', type: 'json', nullable: true })
  colorOptions: any; // JSON格式的颜色选项

  @Column({ name: 'main_image_url', length: 500, nullable: true })
  mainImageUrl: string;

  @Column({ name: 'image_gallery', type: 'json', nullable: true })
  imageGallery: string[]; // 商品图集URL数组

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdById: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
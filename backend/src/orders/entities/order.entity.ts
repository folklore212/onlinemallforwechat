import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending', // 待确认（等待服装厂确认）
  CONFIRMED = 'confirmed', // 已确认（服装厂已确认）
  PROCESSING = 'processing', // 处理中
  SHIPPED = 'shipped', // 已发货
  DELIVERED = 'delivered', // 已送达
  CANCELLED = 'cancelled', // 已取消
}

export enum PaymentStatus {
  NOT_REQUIRED = 'not_required', // 无需支付（政企客户）
  PENDING = 'pending', // 待支付
  PAID = 'paid', // 已支付
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', length: 50, unique: true })
  @Index('idx_order_no')
  orderNo: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'company_name', length: 200, nullable: true })
  companyName: string;

  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ name: 'delivery_address', length: 500, nullable: true })
  deliveryAddress: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount: number;

  @Column({
    name: 'order_status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index('idx_order_status')
  orderStatus: OrderStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.NOT_REQUIRED,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  @Column({ name: 'confirmed_by', nullable: true })
  confirmedById: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'confirmed_by' })
  confirmedBy: User;

  @Column({ name: 'confirmed_at', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'shipped_at', nullable: true })
  shippedAt: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
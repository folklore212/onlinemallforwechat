import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserType {
  GOV_ENTERPRISE = 'gov_enterprise',
  CLOTHING_FACTORY = 'clothing_factory',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'openid', length: 128, unique: true, nullable: true })
  @Index('idx_openid')
  openid: string;

  @Column({ name: 'unionid', length: 128, nullable: true })
  unionid: string;

  @Column({ name: 'username', length: 50, nullable: true })
  username: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'email', length: 100, nullable: true })
  email: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @Column({
    name: 'user_type',
    type: 'enum',
    enum: UserType,
    default: UserType.GOV_ENTERPRISE,
  })
  @Index('idx_user_type')
  userType: UserType;

  @Column({ name: 'company_name', length: 200, nullable: true })
  companyName: string;

  @Column({ name: 'company_address', length: 500, nullable: true })
  companyAddress: string;

  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
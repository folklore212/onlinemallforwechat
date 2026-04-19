import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('upload_records')
export class UploadRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index('IDX_upload_records_original_name')
  originalName: string;

  @Column({ length: 255, unique: true })
  @Index('IDX_upload_records_file_name')
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 100 })
  @Index('IDX_upload_records_file_type')
  fileType: string; // image, video, document, etc.

  @Column('bigint')
  fileSize: number;

  @Column({ length: 100, nullable: true })
  @Index('IDX_upload_records_category')
  category: string; // product, user, banner, etc.

  @Column({ length: 100 })
  mimeType: string;

  @Column({ length: 50, nullable: true })
  encoding: string;

  @Column('simple-json', { nullable: true })
  processedInfo: {
    width?: number;
    height?: number;
    format?: string;
    thumbnails?: Array<{
      size: string; // 'large', 'medium', 'small', 'thumb'
      width: number;
      height: number;
      path: string;
      sizeInBytes: number;
    }>;
    dominantColor?: string;
    blurHash?: string;
  };

  @Column({ nullable: true })
  uploadedBy: number; // 用户ID，如果用户上传

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  uploadTime: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  // 虚拟字段
  fileUrl?: string;
  thumbnailUrls?: {
    large?: string;
    medium?: string;
    small?: string;
    thumb?: string;
  };
}
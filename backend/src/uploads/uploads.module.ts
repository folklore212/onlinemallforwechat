import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ImageProcessorService } from './image-processor.service';
import { UploadRecord } from './entities/upload-record.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UploadRecord]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get('UPLOAD_PATH') || './uploads',
          filename: (req, file, callback) => {
            // 生成唯一文件名
            const uniqueName = uuidv4();
            const ext = extname(file.originalname);
            const filename = `${uniqueName}${ext}`;
            callback(null, filename);
          },
        }),
        limits: {
          fileSize: parseFileSize(configService.get('MAX_FILE_SIZE') || '10mb'),
        },
        fileFilter: (req, file, callback) => {
          const allowedTypes = (configService.get('ALLOWED_FILE_TYPES') || 'image/jpeg,image/png,image/gif').split(',');
          if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error(`文件类型 ${file.mimetype} 不被允许`), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService, ImageProcessorService],
  exports: [UploadsService],
})
export class UploadsModule {}

// 辅助函数：解析文件大小字符串（如 '10mb'）
function parseFileSize(size: string): number {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    tb: 1024 * 1024 * 1024 * 1024,
  };

  const match = size.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (!match) {
    return 10 * 1024 * 1024; // 默认10MB
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (units[unit]) {
    return value * units[unit];
  }

  return 10 * 1024 * 1024; // 默认10MB
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join, extname, basename } from 'path';
import { promises as fs } from 'fs';
import { UploadRecord } from './entities/upload-record.entity';
import { ImageProcessorService } from './image-processor.service';

@Injectable()
export class UploadsService {
  private readonly uploadPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly imageProcessor: ImageProcessorService,
    @InjectRepository(UploadRecord)
    private readonly uploadRecordRepository: Repository<UploadRecord>,
  ) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
  }

  /**
   * 处理上传的单个文件
   */
  async processUploadedFile(file: Express.Multer.File, category?: string) {
    const filePath = file.path;
    const fileName = basename(filePath);
    const fileType = file.mimetype;

    // 如果是图片，处理图片
    let processedInfo = null;
    if (fileType.startsWith('image/')) {
      processedInfo = await this.imageProcessor.processImage(filePath);
    }

    // 保存上传记录到数据库
    const uploadRecord = this.uploadRecordRepository.create({
      originalName: file.originalname,
      fileName,
      filePath,
      fileType,
      fileSize: file.size,
      category: category || this.detectCategory(fileType),
      mimeType: file.mimetype,
      encoding: file.encoding,
      processedInfo,
      uploadTime: new Date(),
    });

    await this.uploadRecordRepository.save(uploadRecord);

    // 构建访问URL
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${fileName}`;

    return {
      success: true,
      message: '文件上传成功',
      data: {
        id: uploadRecord.id,
        originalName: uploadRecord.originalName,
        fileName: uploadRecord.fileName,
        fileSize: uploadRecord.fileSize,
        fileType: uploadRecord.fileType,
        category: uploadRecord.category,
        mimeType: uploadRecord.mimeType,
        fileUrl,
        processedInfo,
        uploadTime: uploadRecord.uploadTime,
      },
    };
  }

  /**
   * 处理多个文件上传
   */
  async processMultipleFiles(files: Express.Multer.File[], category?: string) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.processUploadedFile(file, category);
        results.push(result.data);
      } catch (error) {
        results.push({
          originalName: file.originalname,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: '批量上传完成',
      data: results,
      total: files.length,
      successCount: results.filter(r => r.success !== false).length,
      failedCount: results.filter(r => r.success === false).length,
    };
  }

  /**
   * 处理管理员上传
   */
  async processAdminUpload(file: Express.Multer.File) {
    // 管理员上传可以有更大的文件大小和更多文件类型
    const result = await this.processUploadedFile(file, 'admin');

    // 记录管理员操作日志（这里可以扩展）
    return {
      ...result,
      adminOnly: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filename: string) {
    const uploadRecord = await this.uploadRecordRepository.findOne({
      where: { fileName: filename },
    });

    if (!uploadRecord) {
      // 检查文件是否实际存在（可能是旧文件没有记录）
      const filePath = join(this.uploadPath, filename);
      try {
        await fs.access(filePath);

        // 文件存在但没有记录，创建一条记录
        const stat = await fs.stat(filePath);
        return {
          fileName: filename,
          filePath,
          fileSize: stat.size,
          exists: true,
          hasRecord: false,
          lastModified: stat.mtime,
        };
      } catch {
        throw new NotFoundException(`文件 ${filename} 不存在`);
      }
    }

    // 检查文件是否实际存在
    const fileExists = await this.fileExists(uploadRecord.filePath);

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${uploadRecord.fileName}`;

    return {
      ...uploadRecord,
      fileExists,
      fileUrl,
    };
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string) {
    const uploadRecord = await this.uploadRecordRepository.findOne({
      where: { fileName: filename },
    });

    if (!uploadRecord) {
      throw new NotFoundException(`文件记录 ${filename} 不存在`);
    }

    try {
      // 删除物理文件
      await fs.unlink(uploadRecord.filePath);

      // 删除处理后的图片（如果有）
      if (uploadRecord.processedInfo?.thumbnails) {
        for (const thumbnail of uploadRecord.processedInfo.thumbnails) {
          try {
            await fs.unlink(thumbnail.path);
          } catch {
            // 忽略删除缩略图失败的情况
          }
        }
      }

      // 删除数据库记录
      await this.uploadRecordRepository.delete(uploadRecord.id);

      return {
        success: true,
        message: '文件删除成功',
        data: {
          fileName: uploadRecord.fileName,
          originalName: uploadRecord.originalName,
          deletedAt: new Date(),
        },
      };
    } catch (error) {
      throw new BadRequestException(`删除文件失败: ${error.message}`);
    }
  }

  /**
   * 列出文件
   */
  async listFiles(category?: string) {
    const where = category ? { category } : {};
    const uploadRecords = await this.uploadRecordRepository.find({
      where,
      order: { uploadTime: 'DESC' },
      take: 100, // 限制返回数量
    });

    // 检查每个文件是否存在
    const filesWithStatus = await Promise.all(
      uploadRecords.map(async record => {
        const fileExists = await this.fileExists(record.filePath);
        const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/uploads/${record.fileName}`;

        return {
          ...record,
          fileExists,
          fileUrl,
        };
      }),
    );

    return {
      success: true,
      data: filesWithStatus,
      total: filesWithStatus.length,
      category,
    };
  }

  /**
   * 根据文件类型检测分类
   */
  private detectCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType.includes('pdf')) {
      return 'document';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'document';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'spreadsheet';
    } else {
      return 'other';
    }
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件统计信息
   */
  async getStats() {
    const totalFiles = await this.uploadRecordRepository.count();
    const totalSize = await this.uploadRecordRepository
      .createQueryBuilder('upload')
      .select('SUM(upload.fileSize)', 'totalSize')
      .getRawOne();

    const byCategory = await this.uploadRecordRepository
      .createQueryBuilder('upload')
      .select('upload.category, COUNT(*) as count, SUM(fileSize) as size')
      .groupBy('upload.category')
      .getRawMany();

    const byType = await this.uploadRecordRepository
      .createQueryBuilder('upload')
      .select('upload.fileType, COUNT(*) as count')
      .groupBy('upload.fileType')
      .getRawMany();

    return {
      totalFiles,
      totalSize: parseInt(totalSize.totalSize) || 0,
      byCategory,
      byType,
    };
  }
}
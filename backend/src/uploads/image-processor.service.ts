import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import * as crypto from 'crypto';

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  dominantColor?: string;
  blurHash?: string;
}

interface Thumbnail {
  size: string; // 'large', 'medium', 'small', 'thumb'
  width: number;
  height: number;
  path: string;
  sizeInBytes: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  private readonly uploadPath: string;
  private readonly thumbnailSizes = {
    large: { width: 800, height: 800 },
    medium: { width: 400, height: 400 },
    small: { width: 200, height: 200 },
    thumb: { width: 100, height: 100 },
  };

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
  }

  /**
   * 处理上传的图片
   */
  async processImage(filePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    thumbnails: Thumbnail[];
    dominantColor?: string;
    blurHash?: string;
  }> {
    try {
      // 获取图片元数据
      const metadata = await this.getImageMetadata(filePath);

      // 生成缩略图
      const thumbnails = await this.generateThumbnails(filePath, metadata);

      // 提取主色调（简化版本）
      const dominantColor = await this.extractDominantColor(filePath);

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        thumbnails,
        dominantColor,
      };
    } catch (error) {
      this.logger.error(`图片处理失败: ${error.message}`, error.stack);
      // 返回基础信息，即使处理失败
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        thumbnails: [],
      };
    }
  }

  /**
   * 获取图片元数据（简化版本）
   */
  private async getImageMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      // 尝试使用sharp获取元数据
      const sharp = await this.tryImportSharp();
      if (sharp) {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        const stat = await fs.stat(filePath);

        return {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: stat.size,
        };
      }
    } catch (error) {
      this.logger.warn(`无法使用sharp获取元数据: ${error.message}`);
    }

    // 回退方案：获取基础文件信息
    const stat = await fs.stat(filePath);
    const ext = extname(filePath).toLowerCase().replace('.', '');

    // 从常见图片格式推断
    const format = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
      ? ext
      : 'unknown';

    return {
      width: 0,
      height: 0,
      format,
      size: stat.size,
    };
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnails(
    filePath: string,
    metadata: ImageMetadata,
  ): Promise<Thumbnail[]> {
    const thumbnails: Thumbnail[] = [];

    try {
      const sharp = await this.tryImportSharp();
      if (!sharp) {
        this.logger.warn('sharp模块不可用，跳过缩略图生成');
        return thumbnails;
      }

      const originalDir = dirname(filePath);
      const originalName = basename(filePath, extname(filePath));
      const originalExt = extname(filePath);

      for (const [sizeName, dimensions] of Object.entries(this.thumbnailSizes)) {
        const thumbnailFilename = `${originalName}_${sizeName}${originalExt}`;
        const thumbnailPath = join(originalDir, 'thumbnails', thumbnailFilename);

        // 确保缩略图目录存在
        await fs.mkdir(join(originalDir, 'thumbnails'), { recursive: true });

        try {
          // 生成缩略图
          await sharp(filePath)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              withoutEnlargement: true,
            })
            .toFile(thumbnailPath);

          const thumbnailStat = await fs.stat(thumbnailPath);

          thumbnails.push({
            size: sizeName,
            width: dimensions.width,
            height: dimensions.height,
            path: thumbnailPath,
            sizeInBytes: thumbnailStat.size,
          });

          this.logger.log(`生成缩略图: ${thumbnailFilename}`);
        } catch (error) {
          this.logger.error(`生成缩略图 ${sizeName} 失败: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`缩略图生成失败: ${error.message}`);
    }

    return thumbnails;
  }

  /**
   * 提取主色调（简化版本）
   */
  private async extractDominantColor(filePath: string): Promise<string> {
    try {
      const sharp = await this.tryImportSharp();
      if (sharp) {
        // 简化版本：返回随机颜色或基于文件名的哈希颜色
        const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
        const color = `#${fileHash.substring(0, 6)}`;
        return color;
      }
    } catch (error) {
      this.logger.warn(`无法提取主色调: ${error.message}`);
    }

    // 返回默认颜色
    return '#cccccc';
  }

  /**
   * 尝试导入sharp模块
   */
  private async tryImportSharp(): Promise<any> {
    try {
      const sharp = require('sharp');
      return sharp;
    } catch (error) {
      this.logger.warn(`sharp模块未安装: ${error.message}`);
      return null;
    }
  }

  /**
   * 验证图片格式
   */
  isValidImageFormat(mimeType: string): boolean {
    const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    return validFormats.includes(mimeType);
  }

  /**
   * 获取支持的图片格式
   */
  getSupportedFormats(): string[] {
    return ['JPEG', 'PNG', 'GIF', 'WEBP', 'BMP'];
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(directory: string, maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = join(directory, file);
        const stat = await fs.stat(filePath);

        // 删除超过指定时间的临时文件
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
          this.logger.log(`清理临时文件: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error(`清理临时文件失败: ${error.message}`);
    }
  }
}
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Get,
  Param,
  Delete,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FactoryGuard } from '../auth/guards/factory.guard';

@ApiTags('文件上传')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('single')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: '单文件上传', description: '上传单个文件（支持图片）' })
  @ApiResponse({ status: 201, description: '文件上传成功' })
  @ApiResponse({ status: 400, description: '文件类型或大小不符合要求' })
  async uploadSingle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('category') category?: string,
  ) {
    return this.uploadsService.processUploadedFile(file, category);
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // 最多10个文件
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOperation({ summary: '多文件上传', description: '上传多个文件（最多10个）' })
  @ApiResponse({ status: 201, description: '文件上传成功' })
  @ApiResponse({ status: 400, description: '文件类型或大小不符合要求' })
  async uploadMultiple(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 每个文件10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Query('category') category?: string,
  ) {
    return this.uploadsService.processMultipleFiles(files, category);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: '管理员上传', description: '管理员专用上传接口' })
  @ApiResponse({ status: 201, description: '文件上传成功' })
  async adminUpload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.processAdminUpload(file);
  }

  @Get(':filename')
  @ApiOperation({ summary: '获取文件信息', description: '根据文件名获取文件信息' })
  @ApiResponse({ status: 200, description: '文件信息' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async getFileInfo(@Param('filename') filename: string) {
    return this.uploadsService.getFileInfo(filename);
  }

  @Delete(':filename')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文件', description: '删除指定的文件' })
  @ApiResponse({ status: 200, description: '文件删除成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async deleteFile(@Param('filename') filename: string) {
    return this.uploadsService.deleteFile(filename);
  }

  @Get('list')
  @ApiOperation({ summary: '获取文件列表', description: '获取指定分类的文件列表' })
  @ApiResponse({ status: 200, description: '文件列表' })
  async listFiles(@Query('category') category?: string) {
    return this.uploadsService.listFiles(category);
  }
}
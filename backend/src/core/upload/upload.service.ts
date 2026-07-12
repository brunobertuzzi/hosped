import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client | null = null;
  private readonly bucketName = process.env.AWS_S3_BUCKET || '';
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    try {
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        this.s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });
        this.logger.log('Integração com AWS S3 (Cloud Storage) habilitada.');
      } else {
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
          this.uploadDir = path.join('/tmp', 'uploads');
        }
        if (!fs.existsSync(this.uploadDir)) {
          fs.mkdirSync(this.uploadDir, { recursive: true });
        }
        this.logger.warn('Chaves AWS não encontradas. Utilizando fallback de storage local.');
      }
    } catch (error) {
      this.logger.warn('Não foi possível iniciar o S3 ou criar diretório local.');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;

    if (this.s3Client && this.bucketName) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read', // Dependendo da configuração do bucket
        });
        await this.s3Client.send(command);
        this.logger.log(`[AWS S3] Upload concluído: ${filename}`);
        
        // Retorna a URL pública do S3
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${this.bucketName}.s3.${region}.amazonaws.com/${filename}`;
      } catch (err: any) {
        this.logger.error(`[AWS S3] Falha no upload: ${err.message}`);
        throw new InternalServerErrorException('Falha no upload para nuvem');
      }
    }

    // Fallback local se não tem S3 configurado
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Arquivo salvo localmente (Fallback S3): ${filename}`);

    return `/uploads/${filename}`;
  }
}

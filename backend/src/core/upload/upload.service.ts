import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    try {
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        this.uploadDir = path.join('/tmp', 'uploads');
      }
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    } catch (error) {
      this.logger.warn('Não foi possível criar o diretório de uploads (Serverless environment).');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Arquivo salvo localmente: ${filename} (Mock S3)`);

    // Retorna a URL pública que será servida estaticamente pelo NestJS
    return `/uploads/${filename}`;
  }
}

import { join, resolve } from 'node:path';
import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Public } from '../../common/public.decorator.js';
import type { AppConfig } from '../../config/config.js';

/**
 * Any GET no API route matches gets the SPA's index.html. Registered last (AppModule), so every
 * API route wins over it.
 */
@Controller()
export class SpaController {
  private readonly indexFile: string;

  constructor(config: ConfigService<AppConfig, true>) {
    this.indexFile = join(resolve(config.get('CLIENT_DIST', { infer: true })), 'index.html');
  }

  @Public()
  @Get('{*path}')
  index(@Res() res: Response): void {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(this.indexFile, (error) => {
      if (error && !res.headersSent) {
        res
          .status(404)
          .type('application/problem+json')
          .setHeader('Cache-Control', 'no-store')
          .send(JSON.stringify({ type: 'not_found', title: 'Not found', status: 404 }));
      }
    });
  }
}

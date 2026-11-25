import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HelloResponse } from '../../../shared/hello.js';
import { Public } from '../../common/public.decorator.js';
import { ProblemException } from '../../common/problem.exception.js';
import type { AppConfig } from '../../config/config.js';
import { HelloService } from './hello.service.js';

/** Temporary: the hello-world reads a fixed demo tenant. The Tenant slice removes it. */
@Controller('hello')
export class HelloController {
  constructor(
    private readonly hello: HelloService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Get()
  async get(): Promise<HelloResponse> {
    const message = await this.hello.greeting(this.config.get('DEMO_TENANT_ID', { infer: true }));
    if (message === undefined) {
      throw new ProblemException(404, 'not_found', 'No greeting for the demo tenant');
    }
    return { message };
  }
}

import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import type { AppConfig } from '../config/config.js';
import { greetings } from '../db/generated/schema.js';
import { TenantDb } from '../db/tenant-db.js';

/**
 * Test-only routes that carry patient-like data through success, validation and database-error
 * paths. Registered only by tests (never by AppModule), so it never ships.
 */
export const patientSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1),
  email: z.email(),
});

@Controller('test')
export class CanaryController {
  constructor(
    @Inject(TenantDb) private readonly tenantDb: TenantDb,
    @Inject(ConfigService) private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private get tenant(): string {
    return this.config.get('DEMO_TENANT_ID', { infer: true });
  }

  @Post('patients')
  accept(@Body(new ZodValidationPipe(patientSchema)) body: z.infer<typeof patientSchema>) {
    return { accepted: body.name.length > 0 };
  }

  /** Unique violation: the same primary key twice, with patient data in the row. */
  @Post('duplicate')
  async duplicate(@Body() body: { name: string }) {
    const id = uuidv7();
    await this.tenantDb.withTenant(this.tenant, async (tx) => {
      await tx.insert(greetings).values({ id, tenantId: this.tenant, message: body.name });
      await tx.insert(greetings).values({ id, tenantId: this.tenant, message: body.name });
    });
  }

  /** Check violation: a message over 200 characters, carrying patient data. */
  @Post('too-long')
  async tooLong(@Body() body: { name: string }) {
    await this.tenantDb.withTenant(this.tenant, async (tx) => {
      await tx
        .insert(greetings)
        .values({ id: uuidv7(), tenantId: this.tenant, message: body.name.repeat(50) });
    });
  }

  /** An unexpected error whose message carries patient data. */
  @Post('boom')
  boom(@Body() body: { name: string }): never {
    throw new Error(`unexpected failure for ${body.name}`);
  }
}

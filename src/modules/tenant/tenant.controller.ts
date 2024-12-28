import { Controller, Get, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get(':id')
  async getTenancyContracts(@Param('id') tenantId: string) {
    return await this.tenantService.getTenantDetails(tenantId);
  }
}

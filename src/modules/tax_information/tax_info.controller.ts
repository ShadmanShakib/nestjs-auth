import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TaxInformationService } from './tax_info.service';
import { TaxInformationInterface } from 'src/model/tax_information.model';

@Controller('tax-info')
export class TaxInformationController {
  constructor(private taxInfoService: TaxInformationService) {}

  @Post()
  async createTaxInfo(@Body() payload: TaxInformationInterface) {
    return await this.taxInfoService.createTaxInfo(payload);
  }

  @Get()
  async getTaxInfo(@Query('id') id: string, @Query('user_id') user_id: string) {
    return await this.taxInfoService.getTaxInfo(user_id, id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesInterface } from 'src/model/companies.model';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async createCompanies(
    @Body() payload: CompaniesInterface,
    @Query('user_id') user_id: string,
  ) {
    return await this.companiesService.createCompanies(payload, user_id);
  }

  @Put()
  async updateCompanies(@Body() payload: Partial<CompaniesInterface>) {
    return await this.companiesService.updateCompanies(payload);
  }

  @Get()
  async getCompanies(@Query('id') id: string) {
    return await this.companiesService.getCompanies(id);
  }

  @Get('/properties-info/:companyId')
  async getCompaniesPropertyInfo(@Param('companyId') companyId: string) {
    return await this.companiesService.getCompaniesPropertyInfo(companyId);
  }

  @Delete(':id')
  async deleteCompanies(@Param('id') id: string) {
    return await this.companiesService.deleteCompanies(id);
  }
}

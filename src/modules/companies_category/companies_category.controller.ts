import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  InternalServerErrorException,
} from '@nestjs/common';
import { CompaniesCategoryService } from './companies_category.service';
import { CompaniesCategoryInterface } from 'src/model/companies_category.model';

@Controller('companies-categories')
export class CompaniesCategoryController {
  constructor(
    private readonly companiesCategoryService: CompaniesCategoryService,
  ) {}

  @Post()
  async createCategory(
    @Body() createCompaniesCategoryDto: CompaniesCategoryInterface,
  ) {
    try {
      return await this.companiesCategoryService.createCategory(
        createCompaniesCategoryDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create category',
        error.message,
      );
    }
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    try {
      return await this.companiesCategoryService.getCategoryById(id);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get category',
        error.message,
      );
    }
  }

  @Get()
  async getAllCategories() {
    try {
      return await this.companiesCategoryService.getAllCategories();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get categories',
        error.message,
      );
    }
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCompaniesCategoryDto: CompaniesCategoryInterface,
  ) {
    try {
      return await this.companiesCategoryService.updateCategory(
        id,
        updateCompaniesCategoryDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update category',
        error.message,
      );
    }
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    try {
      return await this.companiesCategoryService.deleteCategory(id);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete category',
        error.message,
      );
    }
  }
}

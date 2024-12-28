import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompaniesCategoryDocument,
  CompaniesCategoryInterface,
  CompaniesCategoryModel,
} from 'src/model/companies_category.model';

@Injectable()
export class CompaniesCategoryService {
  constructor(
    @InjectModel(CompaniesCategoryModel.name)
    private companiesCategoryModel: Model<CompaniesCategoryDocument>,
  ) {}

  async createCategory(data: CompaniesCategoryInterface) {
    try {
      const category = new this.companiesCategoryModel(data);
      return await category.save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create category',
        error.message,
      );
    }
  }

  async updateCategory(
    categoryId: string,
    data: Partial<CompaniesCategoryInterface>,
  ) {
    try {
      const category = await this.companiesCategoryModel.findById(categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      Object.assign(category, data);
      return await category.save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update category',
        error.message,
      );
    }
  }

  async getCategoryById(categoryId: string) {
    try {
      const category = await this.companiesCategoryModel.findById(categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return category;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get category',
        error.message,
      );
    }
  }

  async getAllCategories() {
    try {
      return await this.companiesCategoryModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get categories',
        error.message,
      );
    }
  }

  async deleteCategory(categoryId: string): Promise<CompaniesCategoryDocument> {
    try {
      const category =
        await this.companiesCategoryModel.findByIdAndDelete(categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return category;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete category',
        error.message,
      );
    }
  }
}

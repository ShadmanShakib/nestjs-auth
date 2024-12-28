import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesCategoryService } from './companies_category.service';
import {
  CompaniesCategoryModel,
  CompaniesCategorySchema,
} from 'src/model/companies_category.model';
import { CompaniesCategoryController } from './companies_category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompaniesCategoryModel.name, schema: CompaniesCategorySchema },
    ]),
  ],
  providers: [CompaniesCategoryService],
  controllers: [CompaniesCategoryController],
})
export class CompaniesCategoryModule {}

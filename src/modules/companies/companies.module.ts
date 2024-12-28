import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesModel, CompaniesSchema } from 'src/model/companies.model';
import { AddressModel, AddressSchema } from 'src/model/address.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: CompaniesModel.name, schema: CompaniesSchema },
      { name: AddressModel.name, schema: AddressSchema },
    ]),
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}

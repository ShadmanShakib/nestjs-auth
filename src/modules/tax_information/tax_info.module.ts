import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TaxInfoSchema,
  TaxInformationModel,
} from 'src/model/tax_information.model';
import { TaxInformationService } from './tax_info.service';
import { TaxInformationController } from './tax_info.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxInformationModel.name, schema: TaxInfoSchema },
    ]),
    AuthModule,
  ],
  providers: [TaxInformationService],
  controllers: [TaxInformationController],
  exports: [TaxInformationService],
})
export class TaxInformationModule {}

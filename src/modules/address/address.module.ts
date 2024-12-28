import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressModel, AddressSchema } from 'src/model/address.model';
import { AddressService } from './address.service';
import { UsersAddressController } from './address.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AddressModel.name, schema: AddressSchema },
    ]),
  ],
  providers: [AddressService],
  controllers: [UsersAddressController],
  exports: [AddressService],
})
export class UsersAddressModule {}

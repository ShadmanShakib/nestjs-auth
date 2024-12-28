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
import { AddressService } from './address.service';
import { AddressInterface } from 'src/model/address.model';

@Controller('address')
export class UsersAddressController {
  constructor(private addressService: AddressService) {}

  @Post()
  async createUsersAddress(@Body() payload: AddressInterface) {
    return await this.addressService.createAddress(payload, null, true);
  }

  @Put()
  async editUsersAddress(@Body() payload: Partial<AddressInterface>) {
    return await this.addressService.updateAddress(payload);
  }

  @Get()
  async getUsersAddress(@Query('id') id: string) {
    return await this.addressService.getAddress(id);
  }

  @Delete(':id')
  async deleteAddress(@Param('id') id: string) {
    return await this.addressService.deleteAddress(id);
  }
}

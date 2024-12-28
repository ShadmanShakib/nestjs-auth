import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddressInterface,
  AddressDocument,
  AddressModel,
} from 'src/model/address.model';
import { CustomHttpException } from 'src/utils/custom_error_class';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(AddressModel.name)
    private addressModel: Model<AddressDocument>,
  ) {}

  public async createAddress(
    data: AddressInterface,
    session = null,
    isExternal = false,
  ) {
    try {
      const newAddress = await this.addressModel.create([data], {
        session: session,
      });

      if (!newAddress[0])
        throw CustomHttpException.internalServerError(
          'Failed to create the user',
        );

      return isExternal ? newAddress : newAddress[0]._id;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Create Address failed: ${errorMsg}`,
      );
    }
  }

  public async getAddress(id?: string) {
    /**
        @TODO -> add logic to filter by other variables other than Id
         */
    try {
      if (id) {
        const address = await this.addressModel.findById(id);
        if (!address) {
          throw CustomHttpException.notFound('Address not found');
        }
        return address;
      }
      const addresses = await this.addressModel.find({});
      return addresses;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Failed to get address: ${errorMsg}`,
      );
    }
  }

  public async updateAddress(updateData: Partial<AddressInterface>) {
    try {
      const updateObject = Object.entries(updateData).reduce(
        (acc, [key, value]) => {
          const operation = Array.isArray(value) ? '$push' : '$set';
          acc[operation] = acc[operation] || {};
          acc[operation][key] = Array.isArray(value) ? { $each: value } : value;
          return acc;
        },
        {},
      );

      const updatedAddressData = await this.addressModel.findByIdAndUpdate(
        new Types.ObjectId(updateData._id),
        updateObject,
        {
          new: true,
        },
      );
      if (!updatedAddressData) {
        throw CustomHttpException.notFound('Address not found');
      }
      return { data: updatedAddressData };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Update address failed: ${errorMsg}`,
      );
    }
  }

  public async deleteAddress(id: string): Promise<{ message: string }> {
    try {
      const result = await this.addressModel.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        throw CustomHttpException.notFound(`Address with ID ${id} not found.`);
      }

      return { message: 'Address successfully deleted.' };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw CustomHttpException.internalServerError(
        `Failed to delete address: ${error.message || 'An unexpected error occurred'}`,
      );
    }
  }
}

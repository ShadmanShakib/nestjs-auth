import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UsersProfileDocument,
  UsersProfileInterface,
  UsersProfileModel,
} from 'src/model/users_profile.model';
import { CustomHttpException } from 'src/utils/custom_error_class';
import { CustomLoggerService } from '../logger/logger.service';
import { AddressService } from '../address/address.service';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class UsersProfileService {
  constructor(
    @InjectModel(UsersProfileModel.name)
    private usersProfileModel: Model<UsersProfileDocument>,
    private readonly addressService: AddressService,
    private readonly logger: CustomLoggerService,
    @Inject('AI_ASSISTANT_SERVICE')
    private readonly aiAssistantClient: ClientKafka,
  ) {}

  // public async getContractorsProfile(slugs: string[], additionalFilters: any = {}) {
  //     try {
  //         this.logger.logActivity('getContractorsProfile', "", "", {slugs, additionalFilters});

  //         const contractorsProfiles = await this.usersProfileModel.find({

  //             skills: {$in: slugs}
  //         },);

  //         return contractorsProfiles;
  //     } catch (error) {
  //         if (error instanceof CustomHttpException) {
  //             throw error;
  //         }

  //         const errorMsg = error.message ?? 'An unexpected error occurred';
  //         throw CustomHttpException.internalServerError(`Get Contractors profile failed: ${errorMsg}`);
  //     }
  // }

  public async getUserByAssistantPhoneNo(assistantPhoneNo: string) {
    try {
      const userProfileData = await this.usersProfileModel.findOne({
        assistantPhoneNo,
      });
      if (!userProfileData)
        throw CustomHttpException.notFound('User Profile not found');

      return userProfileData;
    } catch (error) {
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Get user profile failed: ${errorMsg}`,
      );
    }
  }

  public async getUserByAssistantEmail(assistantEmail: string) {
    try {
      const userProfileData = await this.usersProfileModel.findOne({
        assistantEmail,
      });
      if (!userProfileData)
        throw CustomHttpException.notFound('User Profile not found');

      return userProfileData;
    } catch (error) {
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Get user profile failed: ${errorMsg}`,
      );
    }
  }

  public async createUsersProfile(
    data: UsersProfileInterface,
    user_id: string,
  ) {
    try {
      data.userId = user_id;
      const usersProfile = await this.usersProfileModel.create(data);

      if (!usersProfile) {
        throw CustomHttpException.internalServerError(
          'Failed to create the user profile',
        );
      }
      // this.aiAssistantClient.emit('create-assistant', { user_id });
      return usersProfile;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Create user profile failed: ${errorMsg}`,
      );
    }
  }

  public async getUsersProfile(userId: string, id?: string) {
    /**
        @TODO -> add logic to filter by other variables other than Id,
         */
    try {
      if (id) {
        const userProfile = await this.usersProfileModel.findOne({
          userId: id,
        });
        if (!userProfile) {
          throw CustomHttpException.notFound('User Profile not found');
        }
        return userProfile;
      }
      const currentUsersProfile = await this.usersProfileModel.findOne({
        userId,
      });
      return currentUsersProfile;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Failed to get users profile: ${errorMsg}`,
      );
    }
  }

  public async deleteUsersProfile(id: string) {
    try {
      const result = await this.usersProfileModel.deleteOne({ userId: id });

      if (result.deletedCount === 0) {
        throw CustomHttpException.notFound(
          `Users Profile with ID ${id} not found.`,
        );
      }

      return { message: 'Users Profile successfully deleted.' };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw CustomHttpException.internalServerError(
        `Failed to delete address: ${error.message || 'An unexpected error occurred'}`,
      );
    }
  }

  public async updateUsersProfile(
    updateData: Partial<UsersProfileInterface>,
    queryData: any = {},
    session = null,
  ) {
    this.logger.logActivity(
      'updateUsersProfile',
      queryData.user_id,
      queryData.user_role,
      updateData,
    );
    try {
      const { _id, ...updateFields } = updateData;
      console.log(_id);
      if (updateData.address) {
        updateFields.addressId = (await this.addressService.createAddress(
          updateData.address,
          session,
        )) as string;
        updateFields.formattedAddress = updateData.address.mainStreet;
      }

      const updateObject = Object.entries(updateFields).reduce(
        (acc, [key, value]) => {
          // const operation = Array.isArray(value) ? '$push' : '$set';
          const operation = '$set';
          acc[operation] = acc[operation] || {};
          // acc[operation][key] = Array.isArray(value) ? { $each: value } : value;
          acc[operation][key] = value;
          return acc;
        },
        {},
      );

      const updateOptions = {
        new: true,
        session: session,
      };

      const updatedUserProfileData =
        await this.usersProfileModel.findOneAndUpdate(
          { userId: queryData.user_id },
          updateObject,
          updateOptions,
        );
      if (!updatedUserProfileData) {
        this.logger.error('User Profile not found');
        throw CustomHttpException.notFound('User Profile not found');
      }
      return { data: updatedUserProfileData };
    } catch (error) {
      this.logger.error(
        `Failed to update user profile: ${error.message || 'An unexpected error occurred'}`,
      );
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Update User Profile failed: ${errorMsg}`,
      );
    }
  }
}

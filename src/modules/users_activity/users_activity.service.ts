import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { CustomHttpException } from 'src/utils/custom_error_class';
import { CustomLoggerService } from '../logger/logger.service';
import {
  UsersActivityDocument,
  UsersActivityInterface,
  UsersActivityModel,
} from 'src/model/users_activity.model';

@Injectable()
export class UsersActivityService {
  constructor(
    @InjectModel(UsersActivityModel.name)
    private usersActivityModel: Model<UsersActivityDocument>,
    private readonly logger: CustomLoggerService,
  ) {}

  public async getUsersActivity(queryData: Partial<UsersActivityInterface>) {
    try {
      // Build a filter object based on provided fields
      const filter: FilterQuery<UsersActivityInterface> = {};

      if (queryData.id) {
        filter._id = new Types.ObjectId(queryData.id);
      }

      if (queryData.userId) {
        filter.userId = queryData.userId;
      }

      if (queryData.companyId) {
        filter.companyId = queryData.companyId;
      }

      if (queryData.activityType) {
        filter.activityType = queryData.activityType;
      }

      const results = await this.usersActivityModel.aggregate([
        { $match: filter },
      ]);

      // if (results.length === 0) {
      //   throw CustomHttpException.notFound('Users Activity not found!');
      // }

      return results;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Get users activity failed: ${errorMsg}`,
      );
    }
  }

  public async createUserActivity(activityData: UsersActivityInterface) {
    try {
      
      const newActivity = new this.usersActivityModel(activityData);

      const result = await newActivity.save();
      
      this.logger.log('New user activity created successfully', result);
      return result;
    } catch (error) {
      const errorMsg = error.message ?? 'An unexpected error occurred';
      this.logger.error(`Create user activity failed: ${errorMsg}`, error);
      throw CustomHttpException.internalServerError(
        `Create user activity failed: ${errorMsg}`,
      );
    }
  }
}

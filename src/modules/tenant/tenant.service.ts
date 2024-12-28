import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersDocument, UsersModel } from 'src/model/users.model';
import { CustomHttpException } from 'src/utils/custom_error_class';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(UsersModel.name)
    private usersModel: Model<UsersDocument>,
    private readonly logger: CustomLoggerService,
  ) {}

  public async getTenantDetails(tenantId: string) {
    try {
      if (!tenantId) {
        throw CustomHttpException.badRequest('tenant data needs a id');
      }

      const aggregationPipeline = [
        {
          $match: {
            _id: new Types.ObjectId(tenantId),
            userType: 'TENANT', // Ensure userType is 'TENANT'
          },
        },
        {
          $project: {
            password: 0, // Exclude the password field from the results
          },
        },
        {
          $lookup: {
            from: 'tenancy_contracts',
            let: { userId: { $toString: '$_id' } }, // Use _id from the user as userId in tenancy_contracts
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] }, // Match userId in tenancy_contracts
                      { $eq: ['$status', 'active'] }, // Filter only active contracts
                    ],
                  },
                },
              },
            ],
            as: 'tenancyContracts', // Store the matched contracts in tenancyContracts field
          },
        },
        {
          $unwind: {
            path: '$tenancyContracts',
            preserveNullAndEmptyArrays: true, // Allow for users without contracts
          },
        },
        {
          $lookup: {
            from: 'properties',
            let: {
              propertyId: { $toObjectId: '$tenancyContracts.propertyId' }, // Convert propertyId to ObjectId
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$propertyId'], // Match _id in properties with converted propertyId
                  },
                },
              },
            ],
            as: 'propertyDetails',
          },
        },
        {
          $unwind: {
            path: '$propertyDetails',
            preserveNullAndEmptyArrays: true, // Allow for contracts without properties
          },
        },
        {
          $lookup: {
            from: 'jobs',
            let: { propertyId: { $toString: '$propertyDetails._id' } }, // Convert _id to string
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$propertyId', '$$propertyId'], // Match propertyId in jobs with converted propertyId
                  },
                },
              },
            ],
            as: 'propertyDetails.jobs',
          },
        },
      ];

      // Execute the aggregation on the UsersModel
      const results = await this.usersModel
        .aggregate(aggregationPipeline)
        .exec();

      if (!results || results.length === 0) {
        throw CustomHttpException.notFound('Tenant details not found');
      }

      return results[0];
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Get tenant details failed: ${errorMsg}`,
      );
    }
  }
}

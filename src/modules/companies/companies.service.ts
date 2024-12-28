import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CompaniesDocument,
  CompaniesInterface,
  CompaniesModel,
} from 'src/model/companies.model';
import { CustomHttpException } from 'src/utils/custom_error_class';
import * as mongoose from 'mongoose';
import { AddressModel, AddressDocument } from 'src/model/address.model';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(CompaniesModel.name)
    private companiesModel: Model<CompaniesDocument>,
    @InjectModel(AddressModel.name)
    private addressModel: Model<AddressDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private authService: AuthService,
  ) {}

  public async createCompanies(data: CompaniesInterface, userId: string) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      data.ownerId = userId;
      const newCompany = await this.companiesModel.create([data], {
        session: session,
      });
      if (data.address) {
        data.address.refId = newCompany[0]._id.toString();
        const newAddress = await this.addressModel.create([data.address], {
          session: session,
        });
        await this.companiesModel.findByIdAndUpdate(
          newCompany[0]._id,
          {
            addressId: newAddress[0]._id,
          },
          { session: session, new: true },
        );
      }

      await session.commitTransaction();
      return newCompany;
    } catch (error) {
      await session.abortTransaction();
      throw CustomHttpException.internalServerError(
        `Create Company failed: ${error.message || 'An unexpected error occurred'}`,
      );
    } finally {
      session.endSession();
    }
  }

  // public async getUserMeCompany(phoneNumber: string) {
  //   try {
  //     const companyInfo = await this.companiesModel.findOne({ phoneNumber });
  //     if (!companyInfo) {
  //       throw new Error('Company not found');
  //     }

  //     const query = {
  //       user_id: companyInfo.ownerId,
  //     };
  //     return await this.authService.getUserMe(query);
  //   } catch (error) {
  //     console.error('Error fetching company or user info:', error);
  //     throw new Error('Unable to fetch user info');
  //   }
  // }

  public async getCompanies(id?: string) {
    /**
        @TODO -> add logic to filter by other variables other than Id
         */
    try {
      let aggregationPipeline = [];
      if (id) {
        aggregationPipeline.push({
          $match: { _id: new Types.ObjectId(id) },
        });
      }

      aggregationPipeline = aggregationPipeline.concat([
        {
          $lookup: {
            from: 'address',
            let: { addressId: '$addressId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$addressId' }],
                  },
                },
              },
            ],
            as: 'address',
          },
        },
        { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: 'users',
            let: { ownerId: '$ownerId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$ownerId' }],
                  },
                },
              },
            ],
            as: 'ownerInfo',
          },
        },
        { $unwind: { path: '$ownerInfo', preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: 'user_profiles',
            let: { userId: '$ownerId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$userId', '$$userId'],
                  },
                },
              },
            ],
            as: 'userProfile',
          },
        },
        { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
      ]);
      const result = await this.companiesModel
        .aggregate(aggregationPipeline)
        .exec();
      return result;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Failed to get Companies: ${errorMsg}`,
      );
    }
  }

  public async updateCompanies(updateData: Partial<CompaniesInterface>) {
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

      const updatedCompaniesData = await this.companiesModel.findByIdAndUpdate(
        new Types.ObjectId(updateData._id),
        updateObject,
        {
          new: true,
        },
      );
      if (!updatedCompaniesData) {
        throw CustomHttpException.notFound('Company not found');
      }
      return { data: updatedCompaniesData };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Update companies failed: ${errorMsg}`,
      );
    }
  }

  public async deleteCompanies(id: string) {
    const deleteData: Partial<CompaniesInterface> = {
      deleted_at: new Date(),
      _id: id,
    };

    await this.updateCompanies(deleteData);
    return { message: 'Company Deleted Successfully' };
  }

  public async getCompaniesPropertyInfo(companyId: string) {
    try {
      const aggregationPipeline = [
        // Match the specific company by its _id
        {
          $match: { _id: new Types.ObjectId(companyId) },
        },
        // Lookup properties associated with the company
        {
          $lookup: {
            from: 'properties',
            let: { companyId: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$companyId', '$$companyId'] } } },
              // Lookup tenancy contracts associated with each property
              {
                $lookup: {
                  from: 'tenancy_contracts',
                  let: { propertyId: { $toString: '$_id' } },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$propertyId', '$$propertyId'] },
                      },
                    },
                    // Lookup user details associated with each tenancy contract
                    {
                      $lookup: {
                        from: 'users',
                        let: { userId: '$userId' },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ['$_id', { $toObjectId: '$$userId' }],
                              },
                            },
                          },
                          {
                            $project: {
                              username: 1,
                              profileId: 1,
                              userType: 1,
                              addressId: 1,
                              email: 1,
                              firstName: 1,
                              lastName: 1,
                              phone: 1,
                              imageUrl: 1,
                              status: 1,
                              companyId: 1,
                            },
                          },
                        ],
                        as: 'userDetails',
                      },
                    },
                    {
                      $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                  ],
                  as: 'tenancy_contracts',
                },
              },
            ],
            as: 'properties',
          },
        },
      ];

      // Execute the aggregation pipeline
      const result = await this.companiesModel
        .aggregate(aggregationPipeline)
        .exec();
      return result;
    } catch (err) {
      console.error(err);
      throw new Error('Error fetching company property info');
    }
  }
}

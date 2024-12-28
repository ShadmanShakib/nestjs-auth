import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { USERTYPES } from 'src/utils/user_types';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import OpenAI from 'openai';
import {
  UserStatus,
  UserType,
  UsersDocument,
  UsersInterface,
  UsersModel,
} from 'src/model/users.model';
import { Model, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import { UserRoles, validateEmail } from 'src/utils/constants';
import { CustomHttpException } from 'src/utils/custom_error_class';
import { UsersProfileService } from '../users_profile/users_profile.service';
import { UsersProfileInterface } from 'src/model/users_profile.model';
import { CustomLoggerService } from '../logger/logger.service';
import {
  EmailPayloadInterface,
  EmailProviderService,
} from './email_provider.service';
import { AddressService } from '../address/address.service';
import { generateHTML, generatePlainText } from 'src/utils/emailTemplates';
import axios from 'axios';
import { TwilioProviderService } from './twilio_provider.service';
import {
  CompaniesDocument,
  CompaniesInterface,
  CompaniesModel,
} from 'src/model/companies.model';
import { getUserById } from 'src/utils/getCurrentUser';

interface JwtPayload {
  name: string;
  sub: number;
  email?: string;
  type?: string;
}

@Injectable()
export class AuthService {
  private readonly openai: OpenAI;
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(UsersModel.name) private usersModel: Model<UsersDocument>,
    private readonly userProfileService: UsersProfileService,
    public logger: CustomLoggerService,
    private readonly emailProviderService: EmailProviderService,
    private readonly addressService: AddressService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly twilioService: TwilioProviderService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    @InjectModel(CompaniesModel.name)
    private companiesModel: Model<CompaniesDocument>,
  ) {
    this.openai = new OpenAI();
  }

  private async hashPassword(password: string): Promise<string> {
    const hashedPassword: string = await bcrypt.hash(password, 10);
    return hashedPassword;
  }

  private async comparePassword(enteredPassword: string, dbPassword: string) {
    const match: boolean = await bcrypt.compare(enteredPassword, dbPassword);
    return match;
  }

  private async generateToken(payload: JwtPayload, role_id: number) {
    const jwtSignOptions = {
      secret:
        role_id === USERTYPES.HOMEOWNER
          ? process.env.HOMEOWNER_KEY
          : role_id === USERTYPES.PROPERTY_MANAGER
            ? process.env.PROPERTY_MANAGER_KEY
            : role_id === USERTYPES.CONTRACTOR
              ? process.env.CONTRACTOR_KEY
              : role_id === USERTYPES.TENANT
                ? process.env.TENANT_KEY
                : role_id === USERTYPES.STAFF_TECHNICIAN
                  ? process.env.STAFF_TECHNICIANS_KEY
                  : role_id === USERTYPES.SOLE_TRADER
                    ? process.env.SOLE_TRADER_KEY
                    : role_id === USERTYPES.AI_ASSISTANT
                      ? process.env.AI_ASSISTANT_KEY
                      : role_id === USERTYPES.SUPPLIERS
                        ? process.env.SUPPLIERS_KEY
                        : role_id === USERTYPES.ADMIN
                          ? process.env.ADMIN_KEY
                          : role_id === 500
                            ? process.env.CREATE_USER_KEY
                            : role_id === 10000
                              ? process.env.FORGOT_PASSWORD_KEY // forgot password == 10000
                              : 'secret',

      // expiresIn: process.env.TOKEN_EXPIRATION
    };
    const token = await this.jwtService.signAsync(payload, jwtSignOptions);
    return token;
  }

  public async setPassword(
    data: { new_password: string },
    queryData: any = {},
  ) {
    try {
      this.logger.logActivity(
        'setPassword',
        queryData.user_id,
        queryData.user_role,
        {},
      );

      const user = await this.usersModel.findById(queryData.user_id);

      if (!user) {
        this.logger.error('User not found!');
        throw CustomHttpException.notFound('Oops! User not found!');
      }

      const pass = await this.hashPassword(data.new_password);
      await this.updateUser(queryData, {
        password: pass,
        _id: queryData.user_id,
      });

      return { message: 'Successfully set password', status_code: 200 };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Set password failed: ${errorMsg}`,
      );
    }
  }

  public async resetPassword(
    data: { old_password: string; new_password: string },
    queryData: any = {},
  ) {
    try {
      this.logger.logActivity(
        'resetPassword',
        queryData.user_id,
        queryData.user_role,
        {},
      );

      const user = await this.usersModel.findById(queryData.user_id);

      if (!user) {
        this.logger.error('User not found!');
        throw CustomHttpException.notFound('Oops! User not found!');
      }

      const isPasswordMatch = await this.comparePassword(
        data.old_password,
        user.password,
      );

      if (!isPasswordMatch) {
        this.logger.error('The entered password is wrong');
        throw CustomHttpException.forbidden(
          'Oops! The entered password is wrong',
        );
      }

      const pass = await this.hashPassword(data.new_password);
      await this.updateUser(queryData, { password: pass });

      return { message: 'Successfully reset password', status_code: 200 };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Reset password failed: ${errorMsg}`,
      );
    }
  }

  public async forgotPassword(email: string) {
    try {
      this.logger.logActivity('forgotPassword', '', '', { email });

      const user = await this.getUserByEmail(email);

      if (!user || user.status !== UserStatus.ACTIVE) {
        this.logger.error(
          'We could not find a user registered or active with that email',
        );
        throw CustomHttpException.notFound(
          'Oops! We could not find a user registered or active with that email',
        );
      }

      /**
               @TODO -> Send OTP to the email or the registered phone number 
              
            **/
      const payload: JwtPayload = { name: user._id.toString(), sub: 10000 };
      const token = await this.generateToken(payload, 10000);

      return {
        message: `An OTP was sent to ${email} or ${user.phone} successfully`,
        statusCode: HttpStatus.ACCEPTED,
        token,
      };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Forgot password process failed: ${errorMsg}`,
      );
    }
  }

  public async createNewPassword(newPassword: string, queryData: any = {}) {
    this.logger.logActivity(
      'createNewPassword',
      queryData.user_id,
      queryData.user_role,
      {},
    );

    const pass = await this.hashPassword(newPassword);

    const payload: Partial<UsersInterface> = {
      password: pass,
    };
    await this.updateUser(queryData, payload);

    return { message: 'Password successfully changed', status_code: 200 };
  }

  public async updateUser(
    query: any = {},
    updateData: Partial<UsersInterface>,
    session = null,
  ) {
    try {
      this.logger.logActivity('updateUser', query.user_id, query.user_role, {});

      const updateObject = Object.entries(updateData).reduce(
        (acc, [key, value]) => {
          // If the key is 'skills' and it's an array, use $set to replace the array
          if (
            key === 'skills' ||
            (key === 'specializations' && Array.isArray(value))
          ) {
            acc['$set'] = acc['$set'] || {};
            acc['$set'][key] = value;
          } else {
            // For other fields, push arrays and set non-arrays
            const operation = Array.isArray(value) ? '$push' : '$set';
            acc[operation] = acc[operation] || {};
            acc[operation][key] = Array.isArray(value)
              ? { $each: value }
              : value;
          }
          return acc;
        },
        {},
      );

      const updateOptions = {
        new: true,
        select: '-password',
        session: session,
      };

      const userId = updateData._id || query.user_id;
      if (!userId) {
        this.logger.error('User Id required to update record');
        throw CustomHttpException.notFound('User Id required to update record');
      }

      const updatedUserData = await this.usersModel.findByIdAndUpdate(
        new Types.ObjectId(userId),
        updateObject,
        updateOptions,
      );

      if (!updatedUserData) {
        this.logger.error('User not found');
        throw CustomHttpException.notFound('User not found');
      }

      return { data: updatedUserData };
    } catch (error) {
      this.logger.error(
        `Failed to update user: ${error.message || 'An unexpected error occurred'}`,
      );
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Update User failed: ${errorMsg}`,
      );
    }
  }

  public async createUser(user: Partial<UsersInterface>, queryData: any = {}) {
    try {
      this.logger.logActivity(
        'createUser',
        queryData.user_id,
        queryData.user_role,
        { userEmail: user.email },
      );

      const userData = await this.usersModel.findById(queryData.user_id);

      user.status = UserStatus.INVITED;
      user.companyId = userData.companyId;
      user.createdBy = queryData.user_id;

      const randPass = Math.random().toString(36).slice(-6);
      user.password = await this.hashPassword(randPass);

      // Create the user
      const newUser = await this.usersModel.create(user);
      if (!newUser) {
        throw CustomHttpException.internalServerError(
          'Failed to create the user',
        );
      }

      // Generate a token for the new user
      const payload: JwtPayload = { name: newUser._id.toString(), sub: 500 };
      const token = await this.generateToken(payload, 500);

      // Return the signup link with the generated token
      return {
        signup_link: `http://localhost/api/v1/?token=${token}`,
        status_code: HttpStatus.CREATED,
      };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Create user failed: ${errorMsg}`,
      );
    }
  }

  public async signUp(user: UsersInterface) {
    try {
      this.logger.logActivity('signUp', '', user.userType, {
        userEmail: user.email,
      });

      if (user.password !== undefined)
        user.password = await this.hashPassword(user.password);
      const newUser = await this.usersModel.create(user);

      if (!newUser) {
        throw CustomHttpException.internalServerError(
          'User registration failed',
        );
      }

      const userObject = newUser.toObject();
      if (user.password !== undefined) delete userObject.password;

      const payload: JwtPayload = {
        name: newUser._id.toString(),
        sub: UserRoles[newUser.userType],
      };
      const token = await this.generateToken(
        payload,
        UserRoles[newUser.userType],
      );

      return { data: userObject, token };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `SignUp failed: ${errorMsg}`,
      );
    }
  }

  // public async getUserMe(query: any = {}) {
  //   this.logger.log(`Getting Individual User Info: ${JSON.stringify(query)}`);
  //   try {
  //     const userMeData = await this.usersModel.findById(
  //       query.user_id,
  //       '-password',
  //     );

  //     if (!userMeData) {
  //       throw CustomHttpException.notFound('User not found');
  //     }
  //     return userMeData;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get user me data: ${error.message || 'An unexpected error occurred'}`,
  //     );
  //     if (error instanceof CustomHttpException) {
  //       throw error;
  //     }
  //     throw CustomHttpException.internalServerError(
  //       `Failed to get user me data: ${error.message || 'An unexpected error occurred'}`,
  //     );
  //   }
  // }

  public async getUserMe(query: any = {}) {
    this.logger.log(`Getting Individual User Info: ${JSON.stringify(query)}`);
    try {
      const aggregationPipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(query.user_id) } },
        {
          $lookup: {
            from: 'user_profiles',
            let: { userId_str: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$userId', '$$userId_str'],
                  },
                },
              },
            ],
            as: 'userProfile',
          },
        },
        { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
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
            as: 'addressInfo',
          },
        },
        { $unwind: { path: '$addressInfo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'user_roles',
            let: { userId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$userId', '$$userId'],
                  },
                },
              },
            ],
            as: 'userRoles',
          },
        },
        { $unwind: { path: '$userRoles', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'roles',
            let: { roleId: '$userRoles.roleId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$roleId' }],
                  },
                },
              },
              {
                $lookup: {
                  from: 'user_permissions',
                  let: { permissionIds: '$permissionIds' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ['$_id', '$$permissionIds'],
                        },
                      },
                    },
                  ],
                  as: 'permissions',
                },
              },
            ],
            as: 'roles',
          },
        },
        {
          $unwind: { path: '$roles', preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: '$_id',
            userData: { $first: '$$ROOT' },
            permissions: { $push: '$roles.permissions' },
          },
        },
        {
          $addFields: {
            permissions: {
              $reduce: {
                input: '$permissions',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] },
              },
            },
          },
        },
        {
          $facet: {
            userData: [{ $replaceRoot: { newRoot: '$userData' } }],
            companyData: [
              {
                $lookup: {
                  from: 'companies',
                  let: { companyId: '$userData.companyId' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$_id', { $toObjectId: '$$companyId' }],
                        },
                      },
                    },
                  ],
                  as: 'companyInfo',
                },
              },
              {
                $unwind: {
                  path: '$companyInfo',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
          },
        },
        {
          $project: {
            userData: { $arrayElemAt: ['$userData', 0] },
            companyInfo: { $arrayElemAt: ['$companyData.companyInfo', 0] },
            permissions: 1,
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$userData',
                { companyInfo: '$companyInfo', permissions: '$permissions' },
              ],
            },
          },
        },
      ];

      const result = await this.usersModel
        .aggregate(aggregationPipeline)
        .exec();

      if (!result || result.length === 0) {
        throw new CustomHttpException('User not found', 404);
      }
      result[0]['password'] = null;
      return result[0];
    } catch (error) {
      this.logger.error(
        `Failed to get user me data: ${error.message || 'An unexpected error occurred'}`,
      );
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException(
        `Failed to get user me data: ${error.message || 'An unexpected error occurred'}`,
        500,
      );
    }
  }

  public async getUsers(query: any = {}) {
    try {
      const { user_id, ...queryUpdated } = query;

      const user = await getUserById(user_id, this.usersModel, {
        excludeFields: ['password'],
      });
      if (query.id) {
        return await this.findUserById(query.id);
      }
      const payloadObject: any = {};
      if (user.companyId) {
        payloadObject.companyId = user.companyId;
      }
      if (queryUpdated.userType) {
        payloadObject.userType = queryUpdated.userType;
      }

      return await this.findUsersByCompanyId(
        user.companyId,
        user_id,
        queryUpdated,
      );
      // const users = await this.usersModel.find(payloadObject, '-password');
      // return { data: users };
    } catch (error) {
      this.handleError(error);
    }
  }

  private async findUserById(id: string) {
    const user = await this.usersModel.findById(id, '-password');
    if (!user) {
      throw CustomHttpException.notFound('User not found');
    }
    return { data: user };
  }

  private async findUsersByTenant(companyId: string) {
    const users = await this.usersModel.find(
      { userType: UserType.TENANT, companyId },
      '-password',
    );
    if (users.length === 0) {
      throw CustomHttpException.notFound('No tenant found for this company');
    }
    return { data: users };
  }

  private async findUsersByCompanyId(
    companyId: string,
    userId: string,
    query: any = {},
  ) {
    try {
      const {
        skip = 0,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = -1,
        userType,
      } = query;

      const matchStage: any = {
        $match: {
          companyId,
          _id: { $ne: new Types.ObjectId(userId) },
        },
      };

      if (userType) {
        matchStage.$match.userType = userType;
      }

      if (search) {
        matchStage.$match.$or = [
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      const pipeline = [matchStage];

      const sortStage = { $sort: { [sortBy]: sortOrder === -1 ? -1 : 1 } };
      pipeline.push(sortStage);

      pipeline.push({ $skip: parseInt(skip) });
      pipeline.push({ $limit: parseInt(limit) });

      // Lookup for address
      pipeline.push({
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
      });

      pipeline.push({
        $lookup: {
          from: 'companies', // Target the companies collection
          let: { companyId: '$companyId' }, // Pass companyId to the lookup
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$companyId' }], // Match companyId
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                // Add fields you want from the companies collection
              },
            },
          ],
          as: 'companyInfo', // Alias for the company details
        },
      });

      // Lookup for tenancy contracts and properties
      pipeline.push({
        $lookup: {
          from: 'tenancy_contracts',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    // { $eq: ['$status', 'active'] }, // Only active tenancy contracts
                  ],
                },
              },
            },
            {
              $sort: { startDate: -1 }, // Sort by startDate descending to get the latest
            },
            {
              $group: {
                _id: '$userId', // Group by userId
                latestContract: { $first: '$$ROOT' }, // Take the first (latest) document
              },
            },
            {
              $replaceRoot: { newRoot: '$latestContract' }, // Replace root with latest contract
            },
            {
              $lookup: {
                from: 'properties',
                let: { propertyId: '$propertyId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $toObjectId: '$$propertyId' }],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'address', // Collection containing address information
                      let: { addressId: '$addressId' }, // Pass the addressId from the property document
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: ['$_id', { $toObjectId: '$$addressId' }],
                            },
                          },
                        },
                      ],
                      as: 'address', // Alias for the nested address data
                    },
                  },
                  {
                    $unwind: {
                      path: '$address',
                      preserveNullAndEmptyArrays: true, // Retain properties without an address
                    },
                  },
                ],
                as: 'property',
              },
            },
            {
              $unwind: { path: '$property', preserveNullAndEmptyArrays: true },
            },
            {
              $lookup: {
                from: 'buildings',
                let: { buildingId: '$property.buildingId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $toObjectId: '$$buildingId' }],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'users', // Collection containing owner information
                      let: { ownerId: '$ownerId' }, // Pass the ownerId from the building document
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: ['$_id', { $toObjectId: '$$ownerId' }], // Match _id in users with ownerId
                            },
                          },
                        },
                        {
                          $project: {
                            password: 0, // Exclude the `password` field
                            stripeConnectVerif: 0, // Exclude other sensitive fields
                            firebaseUid: 0,
                            __v: 0,
                          },
                        },
                      ],
                      as: 'owner', // Alias for the nested owner data
                    },
                  },
                  {
                    $unwind: {
                      path: '$owner',
                      preserveNullAndEmptyArrays: true, // Retain buildings without an owner
                    },
                  },
                ],
                as: 'building',
              },
            },
            {
              $unwind: { path: '$building', preserveNullAndEmptyArrays: true },
            },
          ],
          as: 'tenancyContract',
        },
      });

      // Lookup for user roles
      pipeline.push({
        $lookup: {
          from: 'user_roles',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
              },
            },
            {
              $lookup: {
                from: 'roles',
                let: { roleId: '$roleId' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$_id', { $toObjectId: '$$roleId' }] },
                    },
                  },
                  {
                    $lookup: {
                      from: 'user_permissions',
                      let: { permissionIds: '$permissionIds' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $in: ['$_id', '$$permissionIds'],
                            },
                          },
                        },
                      ],
                      as: 'permissions',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      permissions: {
                        $map: {
                          input: '$permissions',
                          as: 'permission',
                          in: '$$permission.name',
                        },
                      },
                    },
                  },
                ],
                as: 'roleInfo',
              },
            },
          ],
          as: 'userRoles',
        },
      });

      pipeline.push(
        {
          // Lookup to count the number of properties related to the user
          $lookup: {
            from: 'user_properties', // Collection name
            let: { userId: { $toString: '$_id' } }, // Convert `_id` to string for comparison
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] }, // Match userId in user_properties
                },
              },
              {
                $count: 'propertyCount', // Count the number of matched properties
              },
            ],
            as: 'propertyCount',
          },
        },
        // {

        //   // Project to flatten the count value
        //   $project: {
        //     propertyCount: {
        //       $ifNull: [{ $arrayElemAt: ['$propertyCount.propertyCount', 0] }, 0],
        //     },
        //     // Dynamically include everything else
        //     _id: 1,
        //     firstName: 1,
        //     lastName: 1,
        //     email: 1,
        //     phone: 1,
        //     address: 1,
        //     tenancyContract: 1,
        //     userRoles: 1,
        //     createdAt: 1,
        //     updatedAt: 1,

        //   },
        // }
      );

      pipeline.push(
        {
          $lookup: {
            from: 'jobs', // Collection name for jobs
            let: { userId: { $toString: '$_id' } }, // Convert user _id to string
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$assignedTo', '$$userId'] }, // Match assignedTo with the userId
                      { $eq: ['$status', 'ACTIVE'] }, // Filter jobs with ACTIVE status
                    ],
                  },
                },
              },
              { $count: 'activeJobCount' }, // Count matching documents
            ],
            as: 'activeJobs', // Alias to hold the results
          },
        },
        {
          // Flatten the active job count
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            address: 1,
            tenancyContract: 1,
            userRoles: 1,
            skills: 1,
            specializations: 1,
            companyInfo: 1,
            updatedAt: 1,
            awayCompanyName: 1,
            awayCompanyUrl: 1,
            propertyCount: {
              $ifNull: [
                { $arrayElemAt: ['$propertyCount.propertyCount', 0] },
                0,
              ],
            },
            activeJobCount: {
              $ifNull: [{ $arrayElemAt: ['$activeJobs.activeJobCount', 0] }, 0],
            },
          },
        },
      );

      // Count total documents for pagination
      const totalDocsPipeline = [matchStage, { $count: 'totalDocs' }];

      const [users, totalDocsResult] = await Promise.all([
        this.usersModel.aggregate(pipeline).exec(),
        this.usersModel.aggregate(totalDocsPipeline).exec(),
      ]);

      const totalDocs =
        totalDocsResult.length > 0 ? totalDocsResult[0].totalDocs : 0;
      const currentPage = Math.floor(parseInt(skip) / parseInt(limit)) + 1;
      const totalPages = Math.ceil(totalDocs / parseInt(limit));

      return {
        pagination: {
          totalDocs,
          currentPage,
          limit: parseInt(limit),
          skip: parseInt(skip),
          totalPages,
        },
        data: users,
      };
    } catch (error) {
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Failed to get users by company ID: ${errorMsg}`,
      );
    }
  }

  private handleError(error: any) {
    this.logger.error(
      `Failed to get users: ${error.message || 'An unexpected error occurred'}`,
    );
    if (error instanceof CustomHttpException) {
      throw error;
    }
    throw CustomHttpException.internalServerError(
      `Failed to get users: ${error.message || 'An unexpected error occurred'}`,
    );
  }

  public async login(data: UsersInterface) {
    try {
      this.logger.log(`login user:`, '', '', { userEmail: data.email });

      const payload: JwtPayload = {
        name: data._id.toString(),
        sub: UserRoles[data.userType],
      };
      const token = await this.generateToken(payload, UserRoles[data.userType]);
      data.password = undefined;
      return {
        data,
        token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to login: ${error.message || 'An unexpected error occurred'}`,
      );
      throw CustomHttpException.internalServerError(
        `Login failed: ${error.message}`,
      );
    }
  }

  public async inviteUser(data: UsersInterface) {
    try {
      // Check if the user already exists
      const existingUser = await this.usersModel.findOne({ email: data.email });

      if (existingUser) {
        throw CustomHttpException.notFound('User already exists.');
      }

      // Create a new user
      data.phone = data.phone || data.phoneNumber;

      // Ensure that phone starts with a `+`
      if (data.phone && !data.phone.startsWith('+')) {
        data.phone = `+${data.phone}`;
      }

      const newUser = await this.usersModel.create(data);
      if (!newUser) {
        throw CustomHttpException.internalServerError(
          'User invitation failed.',
        );
      }

      // Prepare the JWT payload
      const payload: JwtPayload = {
        name: newUser._id.toString(),
        sub: UserRoles[newUser.userType],
        email: newUser.email,
        type: 'Invite',
      };

      // Generate the token
      const token = await this.generateToken(payload, UserRoles[data.userType]);

      // Omit the password from the response
      newUser.password = undefined;

      // Send invitation email
      await this.sendMail({
        to: newUser.email,
        subject: 'Invitation to lightwork!',
        html: generateHTML(
          `${process.env.FRONTEND_URL}/set-password/?token=${token}`,
        ),
        text: generatePlainText(
          `${process.env.FRONTEND_URL}/set-password/?token=${token}`,
        ),
        from: 'team@lightwork.blue',
      });

      if (data.isContractorCompanyManaged) {
        // Create User Profile
        const userProfileData =
          await this.userProfileService.createUsersProfile(
            {
              idVerification: false,
              firstName: data.firstName,
              lastName: data.lastName,
              addressId: data.addressId,
              companyId: data.companyId,
              mileRadiusPref: 0,
              bio: '',
              areasCovered: [],
            },
            newUser._id.toString(),
          );
        console.log(userProfileData);

        await this.provisonAndUpdateUserAssistantPhoneNo(
          newUser._id.toString(),
        );
      }

      return {
        newUser,
        token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to invite user: ${error.message || 'An unexpected error occurred.'}`,
      );
      throw CustomHttpException.internalServerError(
        `Invitation failed: ${error.message}`,
      );
    }
  }

  public async loginWithProvider(data: Partial<UsersInterface>) {
    try {
      const payload: JwtPayload = {
        name: data._id.toString(),
        sub: UserRoles[data.userType],
      };
      const token = await this.generateToken(payload, UserRoles[data.userType]);
      data.password = undefined;
      return {
        data,
        token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to login: ${error.message || 'An unexpected error occurred'}`,
      );
      throw CustomHttpException.internalServerError(
        `Login failed: ${error.message}`,
      );
    }
  }

  public async getUserByEmail(email: string): Promise<UsersInterface | null> {
    const user = await this.usersModel.findOne({ email }).lean();
    return user
      ? ({ ...user, _id: user._id.toString() } as UsersInterface)
      : null;
  }

  public async validateProviderUser(email: string, firebaseUid: string) {
    let user: UsersInterface = undefined;

    user = await this.getUserByEmail(email);

    if (!user) return null;

    if (user.firebaseUid === undefined && user.firebaseUid !== '') return null;

    if (user.firebaseUid !== firebaseUid) return null;

    return user;
  }

  public async validateUser(email: string, pass: string) {
    // find if user exist with this email
    let user: UsersInterface = undefined;

    user = await this.getUserByEmail(email);

    if (!user) {
      return null;
    }

    if (user.password === undefined) return null;

    // find if user password match
    const match: boolean = await this.comparePassword(pass, user.password);
    if (!match) {
      return null;
    }
    return user;
  }

  async getUsersBySpecialization(
    specialization: string,
    companyId: string,
    userType: string,
  ): Promise<UsersInterface[]> {
    const users = await this.usersModel
      .find({
        specializations: specialization,
        userType,
        companyId,
      })
      .select('-password')
      .lean()
      .exec();

    return users.map((user) => ({
      ...user,
      _id: user._id.toString(),
    })) as UsersInterface[];
  }

  public async createUsersProfile(
    data: UsersProfileInterface,
    user_id: string,
  ) {
    return await this.userProfileService.createUsersProfile(data, user_id);
  }

  public async editUsersProfile(
    data: Partial<UsersProfileInterface>,
    queryData: any = {},
  ) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      if (data.firstName || data.lastName || data.imageUrl) {
        const { firstName, lastName, imageUrl } = data;

        const userData: Partial<UsersInterface> = {
          firstName: firstName,
          lastName: lastName,
          imageUrl: imageUrl,
        };
        await this.updateUser(queryData, userData, session);
      }
      const updatedData = await this.userProfileService.updateUsersProfile(
        data,
        queryData,
        session,
      );
      if (updatedData.data.addressId)
        await this.updateUser(
          queryData,
          {
            addressId: updatedData.data.addressId,
          },
          session,
        );

      if (data.companyName) {
        const userInfo = await this.getUserMe({
          user_id: queryData.user_id,
        });
        await this.updateCompanies({
          name: data.companyName,
          _id: userInfo['companyInfo']['_id'],
        });
      }
      await session.commitTransaction();

      return updatedData;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof CustomHttpException) {
        throw error;
      }
    } finally {
      session.endSession();
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

  public async updatePaymentVerification(id: string) {
    try {
      await this.usersModel.findOneAndUpdate(
        {
          stripeConnectId: id,
        },
        {
          stripeConnectVerif: true,
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to update stripe connect verification: ${err.message || 'An unexpected error occurred'}`,
      );
    }
  }

  public async getUsersProfile(user_id: string, id?: string) {
    return await this.userProfileService.getUsersProfile(user_id, id);
  }

  public async getUserMeAIAssistant(
    queryData: any = {},
    assistantPhoneNo: string,
  ) {
    this.logger.log(
      `Making Request on Behalf of User with AssistantPhoneNo: ${assistantPhoneNo}, AI Agent Info: ${JSON.stringify(queryData)}`,
    );

    let userProfileData: any;

    if (validateEmail(assistantPhoneNo)) {
      userProfileData =
        await this.userProfileService.getUserByAssistantEmail(assistantPhoneNo);
    } else {
      userProfileData =
        await this.userProfileService.getUserByAssistantPhoneNo(
          assistantPhoneNo,
        );
    }

    const query = {
      user_id: userProfileData['userId'],
    };
    return await this.getUserMe(query);
  }

  public async deleteUsersProfile(id: string) {
    return await this.userProfileService.deleteUsersProfile(id);
  }

  public async getContractorsProfile(queryData: any = {}) {
    try {
      const slugs = queryData.skills; // Assuming slugs are passed as an array of skills
      this.logger.logActivity('getContractorsProfile', '', '', { queryData });

      const aggregationPipeline = [
        // Filter users by userType "CONTRACTOR"
        { $match: { userType: 'CONTRACTOR' } },

        // Join with 'usersProfile' collection and convert _id to string for matching
        {
          $lookup: {
            from: 'usersProfile', // The collection to join
            let: { userId_str: { $toString: '$_id' } }, // Convert _id to string and store in variable
            pipeline: [
              {
                $match: {
                  $expr: {
                    // Use the converted string _id for comparison
                    $eq: ['$userId', '$$userId_str'],
                  },
                },
              },
              {
                // Further filter by matching any of the skills with the provided slugs
                $match: {
                  skills: { $in: slugs },
                },
              },
            ],
            as: 'userProfile',
          },
        },

        // Optional: Unwind the userProfile to work with individual documents
        { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },

        // Filter out documents where userProfile does not exist or is empty after the lookup and unwind
        { $match: { userProfile: { $exists: true } } },
      ];

      // Execute the aggregation pipeline
      const contractorsProfiles = await this.usersModel
        .aggregate(aggregationPipeline)
        .exec();

      if (!contractorsProfiles || contractorsProfiles.length === 0) {
        this.logger.error('Contractors Profile not found');
        throw CustomHttpException.notFound('Contractors Profile not found');
      }
      return contractorsProfiles;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }

      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Get Contractors profile failed: ${errorMsg}`,
      );
    }
  }

  public async sendMail(data: EmailPayloadInterface) {
    return this.emailProviderService.sendEmail(data, this.logger);
  }

  public async createAddress() {}

  public async addUserProfileFromScrapedData(url: string) {
    /**
     @TODO -> Make a transaction
     */
    return await this.scrapeWebsiteAndCreateProfile(url);
  }

  private async scrapeWebsiteAndCreateProfile(websiteUrl: string) {
    const websiteScrapedData = await this.scrapeData(websiteUrl);

    const userProfileData =
      await this.generateUserProfileFromJson(websiteScrapedData);
    return userProfileData;
  }

  private async scrapeData(url: string) {
    try {
      const response = await axios.get(url, {
        headers: {
          'X-With-Generated-Alt': 'true',
          Accept: 'application/json',
        },
      });

      const jsonString = JSON.stringify(response.data);
      const compactJsonString = jsonString.replace(/\s+/g, '');
      const truncatedJsonData = compactJsonString.slice(0, 40000);

      return truncatedJsonData;
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return null;
    }
  }

  private async generateUserProfileFromJson(data: any = {}) {
    // Construct the prompt
    const prompt = `
    
  You are an advanced language model with the capability to interpret and process complex JSON data extracted from websites of service providers such as plumbers, electricians, and other craftsmen. Your primary objective is to efficiently and accurately extract pertinent information to populate a comprehensive user profile for a UsersProfileInterface.
  
  JSON Data: ${JSON.stringify(data)}
  
  Interfaces:
  interface AddressInterface {
    mainStreet: string; // The full address of the business or company.
    country: string; // country of residence
    city: string; // The city where the business is located.
    postalCode: string; // The postal code for the business address.
}

interface UsersProfileInterface {
    address: AddressInterface; // User's address as defined by the AddressInterface.
    companyImageUrl: string; // URL to the company or business's profile image.
    companyName: string; // The name of the business or company.
    bio: string: // A specialized bio reflecting their specialization, relevance, and work ethics, derived from the scraped web content.
    skills: string[] // An array of skills possessed by the user, such as water heating, drainage, etc., essentially serving as tags for their job.
    qualificationName: string // Indicates their profession, e.g., 'Plumber', 'Electrician'.
    phoneNumber: string // The business or contractor's phone number.
    hourlyRate: string; // Hourly rate, if applicable.
    contractPreference: string; // Preferred type of contract, either hourly or fixed, if applicable.
    areasCovered: string[]; // Areas or places where the services are provided.
}
  
Task Instructions:
  
  1. Apply meticulous logical reasoning** and a clear chain of thought to navigate through the potentially unstructured JSON data. This involves deducing where specific pieces of information, such as phone numbers and company details, are likely to be found (e.g., around the About page).

  2. Return only the JSON data that fills the UsersProfileInterface based on the content available. Do not include any summaries, descriptions, or additional content outside of the requested JSON structure.

  3. Consider logical defaults (N/A) where data is missing.


  Additional Guidelines:

- Given the unstructured nature of website content, you may need to infer certain details or make educated guesses based on available information.
- Ensure your outputs are reproducible by clearly documenting your reasoning process for each piece of extracted information.
- Focus on accuracy and efficiency in parsing and extracting the required information to create a comprehensive user profile.
- Please only return the JSON Data -- Don't add any other content like summary or description, I just want only the json data returned

Your expertise in interpreting complex data structures and applying logical reasoning to extract relevant information will be crucial in successfully completing this task.

Expected output Json Format:
{
"address": {
  "mainStreet": "",
  "country": "",
  "city": "",
  "postalCode": ""
},
"companyImageUrl": "",
"companyName": "T",
"bio": "",
"skills": [
 
],
"qualificationName": "<qualificationName>",
"phoneNumber": "<phonenumber>",
"hourlyRate": "<hourlyRate>",
"contractPreference": "<contractPreference>",
"areasCovered": []
}
  }
  `;

    try {
      // Sending the prompt to the OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
      });

      // Extract and format the response
      let response = completion.choices[0].message.content
        .trim()
        .replace(/\n+/g, ' ');

      // Extract and format the response

      // Remove ```json and ``` if they appear
      if (response.startsWith('```json')) {
        response = response.slice(7).trim();
      }
      if (response.endsWith('```')) {
        response = response.slice(0, -3).trim();
      }
      return JSON.parse(response);
      // Parse the string response into a JSON object
    } catch (error) {
      // Log the error and rethrow if needed
      console.error(`Error in creating prompt: ${error.message}`);
      throw error;
    }
  }

  public async moveToDLQ(user_id: string, error: any) {
    // Implement logic to move the message to a dead-letter queue
    this.authClient.emit('dead-letter-queue', {
      user_id,
      error: error.message,
    });
  }

  public async provisonAndUpdateUserAssistantPhoneNo(user_id: string) {
    const phoneNumberData = await this.twilioService.buyPhoneNumber();
    const aiAssistantPhoneNumber = phoneNumberData['phoneNumber'];
    await this.userProfileService.updateUsersProfile(
      {
        assistantPhoneNo: aiAssistantPhoneNumber,
      },
      {
        user_id,
      },
    );

    const userInfo = await this.getUsers({
      id: user_id,
    });

    const userEmail = userInfo['data']['email'];
    let userPhoneNumber = userInfo['data']['phone'];
    const firstName = userInfo['data']['firstName'];

    const mesageHtml = `
        <html>
        <body>
          <p>Hello ${firstName},</p>
          
          <p>Thank you for completing the onboarding process! You are now set to enjoy the amazing opportunities LightWork brings.</p>
          
          <p><strong>Meet your new AI Assistant</strong>, designed to answer calls on behalf of you from your respective clients. Your AI Assistant's number is <strong>${aiAssistantPhoneNumber}</strong>.</p>
          
          <p><strong>To get started</strong>, just forward all calls from your business line to the given number and voila, you are ready to go!</p>
          
          <p>We're excited to have you with us!</p>
          
          <p>Best regards,<br>
          The LightWork Team</p>
        </body>
        </html>
    `.trim();

    const messageText = `
        Hello ${firstName},
        
        Thank you for completing the onboarding process! You are now set to enjoy the amazing opportunities LightWork brings.
        
        Meet your new AI Assistant, designed to answer calls on behalf of you from your respective clients. Your AI Assistant's number is ${aiAssistantPhoneNumber}.
        
        To get started, just forward all calls from your business line to the given number and voila, you are ready to go!

        We're excited to have you with us!

        Best regards,
        The LightWork Team
    `.trim();

    const emailSubject =
      '🎉 Welcome to LightWork! Meet Your New AI Assistant 🎉';

    // Check if the number starts with +, if not, add +
    if (!userPhoneNumber.startsWith('+')) {
      userPhoneNumber = '+' + userPhoneNumber;
    }

    const isUKNumber = this.isValidUKNumber(userPhoneNumber);

    await this.sendMail({
      to: userEmail,
      subject: emailSubject,
      text: messageText,
      html: mesageHtml,
      from: '',
    });

    // Send SMS if the phone number is a valid UK number
    if (isUKNumber) {
      await this.twilioService.sendSms(userPhoneNumber, messageText);
    }
  }

  private isValidUKNumber(number: string) {
    const ukNumberPattern = /^\+44\d{10}$/;
    return ukNumberPattern.test(number);
  }
}

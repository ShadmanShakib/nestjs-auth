import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Document, Model, Types } from 'mongoose';
import { RolesDocument, RolesModel, RoleType } from 'src/model/roles.model';
import {
  UserPermissionsDocument,
  UserPermissionsInterface,
  UserPermissionsModel,
} from 'src/model/permissions.model';
import {
  UserRolesModel,
  UserRolesInterface,
  UsersRolesDocument,
} from 'src/model/user_roles.model';
import { permissions } from 'src/utils/role-permissions';
import { roles } from 'src/utils/roles';
import { UsersInterface } from 'src/model/users.model';

@Injectable()
export class UsersRolesPermissionsService {
  constructor(
    @InjectModel(UserPermissionsModel.name)
    private userPermissionModel: Model<UserPermissionsDocument>,
    @InjectModel(UserRolesModel.name)
    private userRolesModel: Model<UsersRolesDocument>,
    @InjectModel(RolesModel.name)
    private RolesModel: Model<RolesDocument>,
  ) { }

  public async createRole(data: UserRolesInterface) {
    try {
      const userRole = await this.userRolesModel.create(data);
      return userRole;
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  // public async getUsersRoleData (roleId?: number | undefined){

  //     let userRoleData: (Document<unknown, {}, UsersRolesDocument> & UserRoleModel & Document<any, any, any> & { _id: Types.ObjectId; }) | (Document<unknown, {}, UsersRolesDocument> & UserRoleModel & Document<any, any, any> & { _id: Types.ObjectId; })[]
  //     try {
  //         if (roleId !== undefined) {
  //             userRoleData = await this.userRoleModel.findOne({
  //                 roleId: roleId
  //             })
  //         }
  //         else {
  //             userRoleData = await this.userRoleModel.find();
  //         }

  //         return userRoleData;
  //     }

  //     catch (error) {
  //         throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
  //     }
  // }

  public async getRoleData(roleId?: string | undefined, roleType?: RoleType) {
    let matchStage: any = {
      isDefault: true, // Always filter for default records
    };

    // Check if roleId is provided
    if (roleId !== undefined) {
      matchStage._id = new mongoose.Types.ObjectId(roleId); // Add roleId condition to match stage
    }

    // Check if roleType is provided
    if (roleType !== undefined) {
      matchStage.roleType = roleType; // Add roleType condition to match stage
    }

    // Aggregation pipeline
    const aggregationPipeline = [
      {
        $match: matchStage, // Apply the match stage
      },
      {
        $lookup: {
          from: 'user_permissions',
          let: { permissionIds: '$permissionIds' }, // Define the local variable for use in the pipeline
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    '$_id',
                    {
                      $map: {
                        input: '$$permissionIds',
                        as: 'permId',
                        in: { $toObjectId: '$$permId' }, // Convert permissionIds to ObjectId
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: 'permissions', // The resulting array of joined documents
        },
      },
      {
        $project: {
          permissionIds: 0, // Exclude `permissionIds` from the response
        },
      },
    ];

    try {
      return await this.RolesModel.aggregate(aggregationPipeline);
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  public async deleteUsersRole(roleId: number) {
    try {
      const status = await this.RolesModel.deleteOne({
        roleId: roleId,
      });

      if (status) return { message: 'Deleted Successfully' };
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  public async updateRole(roleId: string, updateData: Partial<RolesModel>): Promise<RolesModel> {
    // Find the role by `roleId` (which is not the MongoDB _id)
    const role = await this.RolesModel.findOne({ _id: new mongoose.Types.ObjectId(roleId) });

    if (!role) {
      throw new NotFoundException(`Role with roleId ${roleId} not found`);
    }

    // Update the fields with the provided data
    if (updateData.name) {
      role.name = updateData.name;
    }

    if (updateData.permissionIds && updateData.permissionIds.length) {
      role.permissionIds = updateData.permissionIds.map(id => new Types.ObjectId(id)); // Ensure ObjectId type
    }

    if (updateData.roleType) {
      role.roleType = updateData.roleType;
    }

    if (updateData.module) {
      role.module = updateData.module;
    }

    if (updateData.propertyId) {
      role.propertyId = updateData.propertyId;
    }

    if (typeof updateData.isDefault !== 'undefined') {
      role.isDefault = updateData.isDefault;
    }

    if (updateData.deleted_at) {
      role.deleted_at = updateData.deleted_at;
    }

    // Save the updated role
    return await role.save();
  }

  //************************ User Roles ************************ */
  public async assignRole(data: UserRolesInterface) {
    try {
      const userRole = await this.userRolesModel.create(data);
      return userRole;
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  // Get User Role Assignment
  public async getRoleAssignment(userId: string, roleId?: string) {
    const matchStage: any = { userId: userId };

    if (roleId) {
      matchStage.roleId = roleId; // Optional roleId filter
    }

    const aggregationPipeline = [
      {
        $match: matchStage, // Apply user and optional role filters
      },
      {
        $lookup: {
          from: "roles",
          let: { roleId: { $toObjectId: "$roleId" } }, // Convert `roleId` to ObjectId
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$roleId"],
                },
              },
            },
          ],
          as: "roleData",
        },
      },
      {
        $unwind: {
          path: "$roleData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "properties",
          let: { propertyId: { $toObjectId: "$propertyId" } }, // Convert `propertyId` to ObjectId
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$propertyId"],
                },
              },
            },
          ],
          as: "propertyData",
        },
      },
      {
        $unwind: {
          path: "$propertyData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          roleId: 1,
          userId: 1,
          propertyId: 1,
          deleted_at: 1,
          roleData: 1,
          propertyData: 1,
        },
      },
    ];

    try {
      return await this.userRolesModel.aggregate(aggregationPipeline);
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  // Update User Role Assignment
  public async updateRoleAssignment(
    assignmentId: string,
    updateData: Partial<UserRolesInterface>,
  ): Promise<UsersRolesDocument> {
    const userRole = await this.userRolesModel.findOne({
      _id: new Types.ObjectId(assignmentId),
    });

    if (!userRole) {
      throw new NotFoundException(`User role assignment with ID ${assignmentId} not found`);
    }

    if (updateData.roleId) {
      userRole.roleId = updateData.roleId;
    }

    if (updateData.userId) {
      userRole.userId = updateData.userId;
    }

    if (updateData.propertyId) {
      userRole.propertyId = updateData.propertyId
    }

    if (updateData.deleted_at) {
      userRole.deleted_at = updateData.deleted_at;
    }

    return await userRole.save();
  }

  // Delete User Role Assignment
  public async deleteRoleAssignment(assignmentId: string) {
    try {
      const result = await this.userRolesModel.deleteOne({
        _id: new Types.ObjectId(assignmentId),
      });

      if (result.deletedCount === 0) {
        throw new NotFoundException(`User role assignment with ID ${assignmentId} not found`);
      }

      return { message: 'User role assignment deleted successfully' };
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }


  public async createUserPermissions(data: UserPermissionsInterface) {
    try {
      const userPermission = await this.userPermissionModel.create(data);
      return userPermission;
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  public async getUsersPermissionData(permissionId?: string | undefined) {
    let userPermissionData:
      | (Document<unknown, Record<string, never>, UserPermissionsDocument> &
        UserPermissionsModel &
        Document<any, any, any> & { _id: Types.ObjectId })
      | (Document<unknown, Record<string, never>, UserPermissionsDocument> &
        UserPermissionsModel &
        Document<any, any, any> & { _id: Types.ObjectId })[];

    try {
      if (permissionId !== undefined) {
        userPermissionData =
          await this.userPermissionModel.findById(permissionId);
      } else {
        userPermissionData = await this.userPermissionModel.find();
      }

      return userPermissionData;
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  public async deleteUsersPermission(permissionId: string) {
    try {
      const data =
        await this.userPermissionModel.findByIdAndDelete(permissionId);

      if (data.$isDeleted) return { message: 'Deleted Successfully' };
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  public async updateUsersPermissionData(
    data: Partial<UserPermissionsInterface>,
  ) {
    try {
      const updatedUserPermissionData =
        await this.userPermissionModel.findOneAndUpdate(
          {
            _id: data._id,
          },
          {
            $set: {
              name: data.name,
              description: data.description,
              operation: data.operation,
            },
          },
          { new: true },
        );

      return updatedUserPermissionData;
    } catch (error) {
      throw new HttpException(error.toString(), HttpStatus.NOT_IMPLEMENTED);
    }
  }

  public async insertPermissionsAndRoles(): Promise<void> {
    // Insert permissions
    for (let permission of permissions) {
      const existingPermission = await this.userPermissionModel.findOne({ operation: permission.operation });

      if (!existingPermission) {
        const newPermission = new this.userPermissionModel(permission);
        await newPermission.save();
        console.log(`Inserted permission: ${permission.name}`);
      } else {
        console.log(`Permission already exists: ${permission.name}`);
      }
    }

    // Insert roles
    for (let role of roles) {
      const existingRole = await this.RolesModel.findOne({ name: role.name });

      if (!existingRole) {
        const newRole = new this.RolesModel(role);
        await newRole.save();
        console.log(`Inserted role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }

    // Assign permissionIds to roles
    for (let role of roles) {
      console.log(role, "------- in role -----")
      const permissionDocs = await this.userPermissionModel.find({
        operation: { $in: permissions.map((p) => p.operation) },
      });

      const permissionIds = permissionDocs.map((p) => p._id);

      await this.RolesModel.findOneAndUpdate(
        { name: role.name },
        { $set: { permissionIds } },
      );

      console.log(`Updated role: ${role.name} with permissions`);
    }
  }
}

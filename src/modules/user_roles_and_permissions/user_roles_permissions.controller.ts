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
import { UsersRolesPermissionsService } from './user_roles_permissions.service';
import { UserRolesInterface } from 'src/model/user_roles.model';
import { UserPermissionsInterface } from 'src/model/permissions.model';
import { RoleType } from 'src/model/roles.model';

@Controller()
export class UsersRolesPermissionsController {
  constructor(
    private readonly usersRolesPermService: UsersRolesPermissionsService,
  ) { }

  @Post('roles')
  async createRole(@Body() payload: UserRolesInterface) {
    return await this.usersRolesPermService.createRole(payload);
  }

  @Get('roles')
  async getRole(
    @Query('role_id') roleId: string, // Get `role_id` from query parameters
    @Query('role_type') roleType?: RoleType,
  ) {
    console.log(roleId, roleType)
    // Pass both `_id` and `roleType` to the service method
    return await this.usersRolesPermService.getRoleData(roleId, roleType);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,// Get `role_id` from query parameters
    @Body() body: any
  ) {
    // Call the service to update the role data
    return await this.usersRolesPermService.updateRole(id, body);
  }

  @Delete('/roles/:id')
  async deleteUserRole(@Param('id') roleId: string) {
    return await this.usersRolesPermService.deleteUsersRole(parseInt(roleId));
  }

  @Post('/user-roles/assign')
  async assignRole(@Body() payload: UserRolesInterface) {
    return await this.usersRolesPermService.assignRole(payload);
  }

  // Get User Role Assignment
  @Get('user-roles/Assignments')
  async getUserRoleAssignment(
    @Query('userId') userId: string,
    @Query('roleId') roleId?: string,
  ) {
    console.log(userId, roleId)
    return await this.usersRolesPermService.getRoleAssignment(userId, roleId);
  }

  // Update User Role Assignment
  @Put('user-roles/assign/:assignmentId')
  async updateUserRoleAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() body: Partial<UserRolesInterface>,
  ) {
    return await this.usersRolesPermService.updateRoleAssignment(assignmentId, body);
  }

  // Delete User Role Assignment
  @Delete('/user-roles/assign/:assignmentId')
  async deleteUserRoleAssignment(@Param('assignmentId') assignmentId: string) {
    return await this.usersRolesPermService.deleteRoleAssignment(assignmentId);
  }

  @Post('permissions')
  async createUserPermission(@Body() payload: UserPermissionsInterface) {
    return await this.usersRolesPermService.createUserPermissions(payload);
  }

  @Put('permissions')
  async updateUserPermission(
    @Body() payload: Partial<UserPermissionsInterface>,
  ) {
    return await this.usersRolesPermService.updateUsersPermissionData(payload);
  }

  @Get('permissions')
  async getUserPermission(@Query('permission_id') permission_id?: string) {
    const validPermissionId = permission_id === '' ? undefined : permission_id;
    return await this.usersRolesPermService.getUsersPermissionData(
      validPermissionId,
    );
  }

  @Delete('/permissions/:id')
  async deleteUserPermission(@Param('permission_id') permission_id: string) {
    return await this.usersRolesPermService.deleteUsersPermission(
      permission_id,
    );
  }

  @Post('seed')
  async seedRolesAndPermissions() {
    // Call the service function to insert roles and permissions
    return await this.usersRolesPermService.insertPermissionsAndRoles();

  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserPermissionsModel,
  UserPermissionsSchema,
} from 'src/model/permissions.model';
import { UserRolesModel, userRolesSchema } from 'src/model/user_roles.model';
import { UsersRolesPermissionsService } from './user_roles_permissions.service';
import { UsersRolesPermissionsController } from './user_roles_permissions.controller';
import { RolesModel, RolesSchema } from 'src/model/roles.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPermissionsModel.name, schema: UserPermissionsSchema },
      { name: UserRolesModel.name, schema: userRolesSchema },
      { name: RolesModel.name, schema: RolesSchema },
    ]),
  ],
  providers: [UsersRolesPermissionsService],
  controllers: [UsersRolesPermissionsController],
  exports: [UsersRolesPermissionsService],
})
export class UsersRolesPermissionsModule { }

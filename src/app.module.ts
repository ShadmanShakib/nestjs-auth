import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersProfileModule } from './modules/users_profile/users_profile.module';
import { TaxInformationModule } from './modules/tax_information/tax_info.module';
import { UsersAddressModule } from './modules/address/address.module';
import { UsersRolesPermissionsModule } from './modules/user_roles_and_permissions/user_roles_permissions.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersPromptModule } from './modules/users_prompt/users_prompt.module';
import { CategoryPromptModule } from './modules/category_prompts/category_prompts.module';
import { CompaniesCategoryModule } from './modules/companies_category/companies_category.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UsersActivityModule } from './modules/users_activity/users_activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    AuthModule,
    UsersProfileModule,
    TaxInformationModule,
    UsersAddressModule,
    CompaniesModule,
    UsersRolesPermissionsModule,
    UsersPromptModule,
    CategoryPromptModule,
    CompaniesCategoryModule,
    TenantModule,
    UsersActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

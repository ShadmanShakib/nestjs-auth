import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Put,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { DoesUserExist } from 'src/core/guards/doesUserExist.guard';
import { EventPattern } from '@nestjs/microservices';
import { UserType, UsersInterface } from 'src/model/users.model';
import { UsersProfileInterface } from 'src/model/users_profile.model';
import { ValidateProviderUser } from 'src/core/guards/validateProviderUser.guard';
import { EmailPayloadInterface } from './email_provider.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(DoesUserExist)
  @Post('signup')
  async signUp(@Body() payload: UsersInterface) {
    return await this.authService.signUp(payload);
  }

  @UseGuards(DoesUserExist)
  @Post('create-user')
  async createUser(
    @Body() payload: Partial<UsersInterface>,
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.createUser(payload, searchQuery);
  }

  @Get('users')
  async getUsers(@Query() query: Record<string, any>) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    return await this.authService.getUsers(searchQuery);
  }

  @Get('/all/specialization')
  async getUsersBySpecialization(
    @Query('specialization') specialization: string,
    @Query('companyId') companyId: string,
    @Query('userType') userType: string,
  ): Promise<UsersInterface[]> {
    if (!specialization || !companyId || !userType) {
      throw new Error('Specialization query parameter is required.');
    }
    return await this.authService.getUsersBySpecialization(
      specialization,
      companyId,
      userType,
    );
  }

  @Get('companies')
  async getCompanyUsers(@Query() query: Record<string, any>) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.getUsers(searchQuery);
  }

  @Get('tenants')
  async getTenantUsers(
    @Query() query: Record<string, any>,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const queryData: any = {
      userType: UserType.TENANT,
      user_id: query.user_id,
      skip: skip !== undefined ? Number(skip) : 0,
      limit: limit !== undefined ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder !== undefined && sortOrder === 'asc' ? -1 : 1,
    };
    if (search) {
      queryData.search = search || undefined;
    }

    // Add any additional query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (
        !['limit', 'skip', 'search', 'sortBy', 'sortOrder'].includes(key) &&
        value !== undefined &&
        value !== ''
      ) {
        queryData[key] = value;
      }
    });

    return await this.authService.getUsers(queryData);
  }

  @Get('me')
  async getUserMe(@Query() query: Record<string, any>) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    return await this.authService.getUserMe(searchQuery);
  }

  @Get('/ai/me/:assistantPhoneNo')
  async getUserMeAIAssistant(
    @Query() query: Record<string, any>,
    @Param('assistantPhoneNo') assistantPhoneNo: string,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    return await this.authService.getUserMeAIAssistant(
      searchQuery,
      assistantPhoneNo,
    );
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: { user: UsersInterface }) {
    return await this.authService.login(req.user);
  }

  @Post('invite')
  async inviteUser(@Body() payload: UsersInterface) {
    return await this.authService.inviteUser(payload);
  }

  @Put('set-password')
  async setPassword(
    @Body() data: { new_password: string },
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.setPassword(data, searchQuery);
  }

  @UseGuards(ValidateProviderUser)
  @Post('login-provider')
  async loginWithProvider(@Req() request: any) {
    const user = request.user;

    return await this.authService.loginWithProvider(user);
  }

  @Put('edit')
  async editUsers(
    @Body() payload: Partial<UsersInterface>,
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    payload._id = query.user_id;
    return await this.authService.updateUser(searchQuery, payload);
  }

  @Put('user')
  async userUpdate(
    @Body() payload: Partial<UsersInterface>,
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    payload._id = query.user_id;
    return await this.authService.updateUser(searchQuery, payload);
  }

  @Put('reset-password')
  async resetPassword(
    @Body() data: { old_password: string; new_password: string },
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.resetPassword(data, searchQuery);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return await this.authService.forgotPassword(email);
  }

  @Post('create-new-password')
  async createNewPassword(
    @Body('newPassword') newPassword: string,
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.createNewPassword(newPassword, searchQuery);
  }

  @Post('users-profile')
  async createUsersProfile(
    @Body() payload: UsersProfileInterface,
    @Query('user_id') user_id: string,
  ) {
    return await this.authService.createUsersProfile(payload, user_id);
  }

  @Put('users-profile')
  async editUsersProfile(
    @Body() payload: Partial<UsersProfileInterface>,
    @Query() query: Record<string, any>,
  ) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.editUsersProfile(payload, searchQuery);
  }

  @Get('users-profile')
  async getUsersProfile(
    @Query('id') id: string,
    @Query('user_id') user_id: string,
  ) {
    return await this.authService.getUsersProfile(user_id, id);
  }

  @Get('contractor-profile')
  async getContractorProfile(@Query() query: Record<string, any>) {
    const searchQuery = Object.entries(query).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    return await this.authService.getContractorsProfile(searchQuery);
  }

  @Delete('users-profile')
  async deleteUsersProfile(@Query('user_id') user_id: string) {
    return await this.authService.deleteUsersProfile(user_id);
  }

  @Get('/scrape-data')
  async scrapeWebsiteAndCreateProfile(
    @Query('website_url') websiteUrl: string,
  ) {
    return await this.authService.addUserProfileFromScrapedData(websiteUrl);
  }

  @EventPattern('buy-and-provision-number-update-assistant-phonenumber')
  async handleProvisioningPhoneNumber(data: { user_id: string }) {
    try {
      await this.authService.provisonAndUpdateUserAssistantPhoneNo(
        data.user_id,
      );
    } catch (error) {
      console.log(
        `Failed to process event for user_id: ${data.user_id}`,
        error.stack,
      );
      await this.authService.moveToDLQ(data.user_id, error);
    }
  }

  @EventPattern('dead-letter-queue')
  async handleDLQEvent(data: { user_id: string; error: string }) {
    console.log(
      `Handling DLQ event for user_id: ${data.user_id}. Error: ${data.error}`,
    );
    // Implement logic to handle DLQ messages, such as notifying an admin or logging to a monitoring system
  }

  @EventPattern('auth-update-stripe-payment-id')
  async updatePaymentId(data: any) {
    const query = { user_id: data.userId, user_role: '-' };
    const payload = { stripeConnectId: data.id };

    /**
    @TODO :-> add fallback incase update user fails...
     */

    await this.authService.updateUser(query, payload);
  }

  @EventPattern('auth-update-stripe-customer-id')
  async updateCustomerId(data: any) {
    const query = { user_id: data.userId, user_role: '-' };
    const payload = { stripeCustomerId: data.id };

    /**
    @TODO :-> add fallback incase update user fails...
     */

    await this.authService.updateUser(query, payload);
  }

  @EventPattern('auth-update-stripe-connect-verification')
  async updatePaymentVerification(data: any) {
    /**
    @TODO :-> add fallback incase update user fails...
     */

    await this.authService.updatePaymentVerification(data.id);
  }

  @EventPattern('update-assistant-info')
  async updateAssistant(data: any) {
    const query = { user_id: data.user_id, user_role: '-' };
    const payload = { ...data };
    delete payload.user_id;
    await this.authService.editUsersProfile(payload, query);
  }

  @EventPattern('email-client-provider')
  async sendMail(data: EmailPayloadInterface) {
    return this.authService.sendMail(data);
  }
}

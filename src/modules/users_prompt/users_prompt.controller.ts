import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UserPromptMessageInterface } from 'src/model/user_prompt_message.model';
import { UsersPromptService } from './users_prompt.service';
import { UserPromptInterface } from 'src/model/user_prompt.model';
import { AuthService } from '../auth/auth.service';
import { markdownToTxt } from 'markdown-to-txt';
import { EventPattern } from '@nestjs/microservices';
import { CategoryPromptService } from '../category_prompts/category_prompts.service';

@Controller('user-prompt')
export class UsersPromptController {
  constructor(
    private readonly usersPromptService: UsersPromptService,
    private authService: AuthService,
    private readonly categoryPromptService: CategoryPromptService,
  ) {}

  // Create a new prompt
  @Post()
  async createPrompt(
    @Body() userPromptMessageInterface: UserPromptMessageInterface,
  ) {
    const { userId } = userPromptMessageInterface;

    const userInfo = await this.authService.getUserMe({ user_id: userId });
    const companyInfo = userInfo.companyInfo;

    if (!companyInfo || !companyInfo.categoryId) {
      throw new Error('Company info or category ID not found.');
    }

    const categoryInfo =
      await this.categoryPromptService.getCategoryPromptByCategoryId(
        companyInfo.categoryId,
      );

    if (
      !categoryInfo ||
      !categoryInfo.messageDetails ||
      !categoryInfo.messageDetails.message
    ) {
      throw new Error('Category prompt not found.');
    }

    const categoryPromptUrl = categoryInfo.messageDetails.message;
    const categoryPrompt =
      await this.usersPromptService.loadMarkdownFromUrl(categoryPromptUrl);

    const userPrompt = `
      ${userInfo.firstName} is a(an) ${userInfo.userProfile.qualificationName} ${userInfo.userType.toLowerCase()} with specialization in: ${userInfo.userProfile.skills.join(', ')}. 
      His location is at ${userInfo.addressInfo.mainStreet}.

      Here is ${userInfo.firstName}'s bio:
      ${userInfo.userProfile.bio}

      Using the template below, create a personalized/customized prompt for an assistant to take care of calls from potential clients.

      ---
      ${categoryPrompt}
    `;

    const promptTemplate = await this.usersPromptService.loadMarkdownFromUrl(
      'https://lightwork-be.s3.eu-west-2.amazonaws.com/create_user_prompt.md',
    );
    const generatedResponse = await this.usersPromptService.designPrompt(
      promptTemplate,
      userPrompt,
    );
    const markdown = markdownToTxt(generatedResponse);

    const fileBuffer = Buffer.from(markdown);
    this.usersPromptService.sendFileForUpload(fileBuffer, userId);
    return { message: 'User Prompt created Successfully', status: 201 };
  }

  // Get all prompts for a user
  @Get('all/:userId')
  async getAllPromptsForUser(@Param('userId') userId: string) {
    return await this.usersPromptService.getAllPromptsForUser(userId);
  }

  // Delete all prompts for a user
  @Delete('all/:userId')
  async deleteAllPromptsForUser(@Param('userId') userId: string) {
    return await this.usersPromptService.deleteAllPromptsForUser(userId);
  }

  // Get all UserPrompts
  @Get('all')
  async getAllUserPrompts() {
    return await this.usersPromptService.getAllUserPrompts();
  }

  // Get a specific UserPrompt by userId
  @Get('user/:userId')
  async getUserPromptById(@Param('userId') userId: string) {
    return await this.usersPromptService.getUserPromptById(userId);
  }

  // Update a specific UserPrompt by userId
  @Put('user/:userId')
  async updateUserPrompt(
    @Param('userId') userId: string,
    @Body() userPromptInterface: UserPromptInterface,
  ) {
    const { messageId } = userPromptInterface;
    return await this.usersPromptService.updateUserPrompt(userId, messageId);
  }

  // Delete a specific UserPrompt by userId
  @Delete('user/me/:userId')
  async deleteUserPrompt(@Param('userId') userId: string) {
    return await this.usersPromptService.deleteUserPrompt(userId);
  }

  // Get a specific prompt by ID
  @Get('/prompt/:promptId')
  async getPromptById(@Param('promptId') promptId: string) {
    return await this.usersPromptService.getPromptById(promptId);
  }

  // Update a specific prompt by ID
  @Put(':promptId')
  async updatePrompt(
    @Param('promptId') promptId: string,
    @Body() userPromptMessageInterface: UserPromptMessageInterface,
  ) {
    const { message } = userPromptMessageInterface;
    return await this.usersPromptService.updatePrompt(promptId, message);
  }

  // Delete a specific prompt by ID
  @Delete(':promptId')
  async deletePrompt(@Param('promptId') promptId: string) {
    return await this.usersPromptService.deletePrompt(promptId);
  }

  @EventPattern('markdown-prompt-user-file-upload')
  async uploadMarkdownPromptUserFile(data: { url: string; userId: string }) {
    await this.usersPromptService.createPrompt(data.userId, data.url);
    console.log('Saved User Prompt Data Succesfully');
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CategoryPromptService } from './category_prompts.service';
import { CategoryPromptMessageInterface } from 'src/model/category_prompt_message.model';
import { CategoryPromptInterface } from 'src/model/category_prompt.model';
import { EventPattern } from '@nestjs/microservices';

@Controller('category-prompt')
export class CategoryPromptController {
  constructor(private readonly categoryPromptService: CategoryPromptService) {}

  // Create a new category prompt
  @Post()
  async createCategoryPrompt(
    @Body() categoryPromptMessageInterface: CategoryPromptMessageInterface,
  ) {
    const { categoryId, message } = categoryPromptMessageInterface;

    const fileBuffer =
      this.categoryPromptService.convertTextToMarkdownBuffer(message);

    this.categoryPromptService.sendFileForUpload(fileBuffer, categoryId);
    // return this.categoryPromptService.createCategoryPrompt(categoryId, message);
  }

  // Get all category prompts for a category
  @Get('all/:categoryId')
  async getAllCategoryPromptsForCategory(
    @Param('categoryId') categoryId: string,
  ) {
    return await this.categoryPromptService.getAllCategoryPromptsForCategory(
      categoryId,
    );
  }

  // Delete all category prompts for a category
  @Delete('all/:categoryId')
  async deleteAllCategoryPromptsForCategory(
    @Param('categoryId') categoryId: string,
  ) {
    return await this.categoryPromptService.deleteAllCategoryPromptsForCategory(
      categoryId,
    );
  }

  // Get all CategoryPrompts
  @Get('/prompt/all')
  async getAllCategoryPrompts() {
    return await this.categoryPromptService.getAllCategoryPrompts();
  }

  // Get a specific CategoryPrompt by categoryId
  @Get('category/:categoryId')
  async getCategoryPromptByCategoryId(@Param('categoryId') categoryId: string) {
    return await this.categoryPromptService.getCategoryPromptByCategoryId(
      categoryId,
    );
  }

  // Update a specific CategoryPrompt by categoryId
  @Put('category/:categoryId')
  async updateCategoryPromptByCategoryId(
    @Param('categoryId') categoryId: string,
    @Body() categoryPromptInterface: CategoryPromptInterface,
  ) {
    const { messageId } = categoryPromptInterface;
    return await this.categoryPromptService.updateCategoryPromptByCategoryId(
      categoryId,
      messageId,
    );
  }

  // Delete a specific CategoryPrompt by categoryId
  @Delete('category/:categoryId')
  async deleteCategoryPromptByCategoryId(
    @Param('categoryId') categoryId: string,
  ) {
    return await this.categoryPromptService.deleteCategoryPromptByCategoryId(
      categoryId,
    );
  }

  // Get a specific category prompt by ID
  @Get(':promptId')
  async getCategoryPromptById(@Param('promptId') promptId: string) {
    return await this.categoryPromptService.getCategoryPromptById(promptId);
  }

  // Update a specific category prompt by ID
  @Put(':promptId')
  async updateCategoryPrompt(
    @Param('promptId') promptId: string,
    @Body() categoryPromptMessageInterface: CategoryPromptMessageInterface,
  ) {
    const { message } = categoryPromptMessageInterface;
    return await this.categoryPromptService.updateCategoryPrompt(
      promptId,
      message,
    );
  }

  // Delete a specific category prompt by ID
  @Delete(':promptId')
  async deleteCategoryPrompt(@Param('promptId') promptId: string) {
    return await this.categoryPromptService.deleteCategoryPrompt(promptId);
  }

  @EventPattern('markdown-prompt-category-file-upload')
  async uploadMarkdownPromptCategoryFile(data: {
    url: string;
    categoryId: string;
  }) {
    await this.categoryPromptService.createCategoryPrompt(
      data.categoryId,
      data.url,
    );
  }
}

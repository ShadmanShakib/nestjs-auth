import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/utils/custom_error_class';
import {
  CategoryPromptDocument,
  CategoryPromptModel,
} from 'src/model/category_prompt.model';
import {
  CategoryPromptMessageDocument,
  CategoryPromptMessageModel,
} from 'src/model/category_prompt_message.model';
import { markdownToTxt } from 'markdown-to-txt';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class CategoryPromptService {
  constructor(
    @InjectModel(CategoryPromptModel.name)
    private categoryPromptModel: Model<CategoryPromptDocument>,
    @InjectModel(CategoryPromptMessageModel.name)
    private categoryPromptMessageModel: Model<CategoryPromptMessageDocument>,
    @Inject('FILE_MANAGER_SERVICE')
    private readonly fileManagerClient: ClientKafka,
  ) {}

  private async findCategoryPromptByCategoryId(
    categoryId: string,
  ): Promise<CategoryPromptDocument | null> {
    return this.categoryPromptModel.findOne({ categoryId }).exec();
  }

  private async updateOrCreateCategoryPrompt(
    categoryId: string,
    messageId: string,
  ) {
    const existingCategoryPrompt =
      await this.findCategoryPromptByCategoryId(categoryId);

    if (existingCategoryPrompt) {
      existingCategoryPrompt.messageId = messageId;
      return existingCategoryPrompt.save();
    } else {
      const newCategoryPrompt = new this.categoryPromptModel({
        categoryId,
        messageId,
      });
      return newCategoryPrompt.save();
    }
  }

  // Create a new category prompt
  public async createCategoryPrompt(categoryId: string, message: string) {
    try {
      // Create a new category prompt message
      const newPromptMessage = new this.categoryPromptMessageModel({
        message,
        categoryId,
      });
      const savedPromptMessage = await newPromptMessage.save();
      const messageId = savedPromptMessage._id;

      // Update or create the CategoryPrompt with the new messageId
      await this.updateOrCreateCategoryPrompt(categoryId, messageId.toString());

      return savedPromptMessage;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to create category prompt',
      );
    }
  }

  // Get all category prompts for a category
  public async getAllCategoryPromptsForCategory(categoryId: string) {
    try {
      // Find all prompts for the category
      const categoryPrompts = await this.categoryPromptMessageModel
        .find({ categoryId })
        .exec();
      return categoryPrompts;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to get category prompts',
      );
    }
  }

  // Get a specific category prompt by ID
  public async getCategoryPromptById(promptId: string) {
    try {
      const prompt = await this.categoryPromptMessageModel
        .findById(promptId)
        .exec();
      if (!prompt) {
        throw CustomHttpException.notFound('Category prompt not found');
      }
      return prompt;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to get category prompt',
      );
    }
  }

  // Update a specific category prompt by ID
  public async updateCategoryPrompt(promptId: string, message: string) {
    try {
      const prompt = await this.categoryPromptMessageModel
        .findById(promptId)
        .exec();
      if (!prompt) {
        throw CustomHttpException.notFound('Category prompt not found');
      }
      prompt.message = message;
      const updatedPrompt = await prompt.save();
      return updatedPrompt;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to update category prompt',
      );
    }
  }

  // Delete a specific category prompt by ID
  public async deleteCategoryPrompt(promptId: string) {
    try {
      const prompt = await this.categoryPromptMessageModel
        .findById(promptId)
        .exec();
      if (!prompt) {
        throw CustomHttpException.notFound('Category prompt not found');
      }
      await this.categoryPromptMessageModel.deleteOne({ _id: promptId }).exec();
      return { message: 'Category prompt deleted successfully' };
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to delete category prompt',
      );
    }
  }

  // Delete all category prompts for a category
  public async deleteAllCategoryPromptsForCategory(categoryId: string) {
    try {
      await this.categoryPromptMessageModel.deleteMany({ categoryId }).exec();
      return { message: 'All category prompts deleted successfully' };
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to delete all category prompts for category',
      );
    }
  }

  // Get all CategoryPrompts
  public async getAllCategoryPrompts() {
    try {
      const categoryPrompts = await this.categoryPromptModel.find().exec();
      return categoryPrompts;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to get category prompts',
      );
    }
  }

  public async getCategoryPromptByCategoryId(categoryId: string) {
    try {
      const categoryPrompt = await this.categoryPromptModel
        .aggregate([
          { $match: { categoryId: categoryId } },
          {
            $lookup: {
              from: 'category_prompt_messages',
              let: { messageId: { $toObjectId: '$messageId' } }, // Convert messageId to ObjectId
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$messageId'] } } },
              ],
              as: 'messageDetails',
            },
          },
          { $unwind: '$messageDetails' },
          {
            $project: {
              _id: 1,
              categoryId: 1,
              messageId: 1,
              createdAt: 1,
              updatedAt: 1,
              messageDetails: 1,
            },
          },
        ])
        .exec();

      if (!categoryPrompt || categoryPrompt.length === 0) {
        throw CustomHttpException.notFound('CategoryPrompt not found');
      }

      return categoryPrompt[0];
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to get category prompt',
      );
    }
  }

  // Update a specific CategoryPrompt by categoryId
  public async updateCategoryPromptByCategoryId(
    categoryId: string,
    messageId: string,
  ) {
    try {
      const categoryPrompt = await this.categoryPromptModel
        .findOne({ categoryId })
        .exec();
      if (!categoryPrompt) {
        throw CustomHttpException.notFound('CategoryPrompt not found');
      }
      categoryPrompt.messageId = messageId;
      const updatedCategoryPrompt = await categoryPrompt.save();
      return updatedCategoryPrompt;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to update category prompt',
      );
    }
  }

  // Delete a specific CategoryPrompt by categoryId
  public async deleteCategoryPromptByCategoryId(categoryId: string) {
    try {
      const categoryPrompt = await this.categoryPromptModel
        .findOne({ categoryId })
        .exec();
      if (!categoryPrompt) {
        throw CustomHttpException.notFound('CategoryPrompt not found');
      }
      await this.categoryPromptModel.deleteOne({ categoryId }).exec();
      return { message: 'CategoryPrompt deleted successfully' };
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to delete category prompt',
      );
    }
  }

  public convertTextToMarkdownBuffer(text: string) {
    const markdown = markdownToTxt(text);
    return Buffer.from(markdown);
  }

  public async sendFileForUpload(fileBuffer: Buffer, categoryId: string) {
    this.fileManagerClient.emit('markdown-file-category-upload', {
      fileBuffer,
      categoryId,
    });
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/utils/custom_error_class';
import {
  UserPromptDocument,
  UserPromptModel,
} from 'src/model/user_prompt.model';
import {
  UserPromptMessageDocument,
  UserPromptMessageModel,
} from 'src/model/user_prompt_message.model';
import OpenAI from 'openai';
import axios from 'axios';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class UsersPromptService {
  private readonly openai: OpenAI;
  constructor(
    @InjectModel(UserPromptModel.name)
    private userPromptModel: Model<UserPromptDocument>,
    @InjectModel(UserPromptMessageModel.name)
    private userPromptMessageModel: Model<UserPromptMessageDocument>,
    @Inject('FILE_MANAGER_SERVICE')
    private readonly fileManagerClient: ClientKafka,
  ) {
    this.openai = new OpenAI();
  }

  public async loadMarkdownFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      throw new Error(`Failed to load markdown file from URL: ${err.message}`);
    }
  }

  public async designPrompt(
    promptTemplate: string,
    userPrompt: string,
  ): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: promptTemplate },
        { role: 'user', content: userPrompt },
      ],
    });

    const response = completion.choices[0].message.content
      .trim()
      .replace(/\n+/g, ' ');

    return response;
  }

  private async findUserPromptByUserId(
    userId: string,
  ): Promise<UserPromptDocument | null> {
    return this.userPromptModel.findOne({ userId }).exec();
  }

  private async updateOrCreateUserPrompt(userId: string, messageId: string) {
    const existingUserPrompt = await this.findUserPromptByUserId(userId);

    if (existingUserPrompt) {
      existingUserPrompt.messageId = messageId;
      return existingUserPrompt.save();
    } else {
      const newUserPrompt = new this.userPromptModel({ userId, messageId });
      return newUserPrompt.save();
    }
  }

  // Create a new prompt
  public async createPrompt(userId: string, message: string) {
    try {
      // Create a new prompt message
      const newPromptMessage = new this.userPromptMessageModel({
        message,
        userId,
      });
      const savedPromptMessage = await newPromptMessage.save();
      const messageId = savedPromptMessage._id;

      // Update or create the UserPrompt with the new messageId
      await this.updateOrCreateUserPrompt(userId, messageId.toString());

      return savedPromptMessage;
    } catch (error) {
      throw CustomHttpException.internalServerError('Failed to create prompt');
    }
  }

  // Get all prompts for a user
  public async getAllPromptsForUser(userId: string) {
    try {
      // Find all prompts for the user
      const userPrompts = await this.userPromptMessageModel
        .find({ userId })
        .exec();
      return userPrompts;
    } catch (error) {
      throw CustomHttpException.internalServerError('Failed to get prompts');
    }
  }

  // Get a specific prompt by ID
  public async getPromptById(promptId: string) {
    try {
      const prompt = await this.userPromptMessageModel
        .findById(promptId)
        .exec();
      if (!prompt) {
        throw CustomHttpException.notFound('Prompt not found');
      }
      return prompt;
    } catch (error) {
      throw CustomHttpException.internalServerError('Failed to get prompt');
    }
  }

  // Update a specific prompt by ID
  public async updatePrompt(promptId: string, message: string) {
    try {
      const prompt = await this.userPromptMessageModel
        .findById(promptId)
        .exec();
      if (!prompt) {
        throw CustomHttpException.notFound('Prompt not found');
      }
      prompt.message = message;
      const updatedPrompt = await prompt.save();
      return updatedPrompt;
    } catch (error) {
      throw CustomHttpException.internalServerError('Failed to update prompt');
    }
  }

  // Delete a specific prompt by ID
  public async deletePrompt(promptId: string) {
    try {
      const prompt = await this.userPromptMessageModel
        .findById(promptId)
        .exec();
      if (!prompt) {
        throw CustomHttpException.notFound('Prompt not found');
      }
      await this.userPromptMessageModel.deleteOne({ _id: promptId }).exec();
      return { message: 'Prompt deleted successfully' };
    } catch (error) {
      throw CustomHttpException.internalServerError('Failed to delete prompt');
    }
  }

  // Delete all prompts for a user
  public async deleteAllPromptsForUser(userId: string) {
    try {
      await this.userPromptMessageModel.deleteMany({ userId }).exec();
      return { message: 'All prompts deleted successfully' };
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to delete all prompts for user',
      );
    }
  }

  // Get all UserPrompts
  public async getAllUserPrompts() {
    try {
      const userPrompts = await this.userPromptModel.find().exec();
      return userPrompts;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to get user prompts',
      );
    }
  }

  public async getUserPromptById(userId: string) {
    try {
      const userPrompt = await this.userPromptModel
        .aggregate([
          { $match: { userId: userId } },
          {
            $lookup: {
              from: 'user_prompt_messages',
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
              userId: 1,
              messageId: 1,
              createdAt: 1,
              updatedAt: 1,
              messageDetails: 1,
            },
          },
        ])
        .exec();

      if (!userPrompt || userPrompt.length === 0) {
        throw CustomHttpException.notFound('CategoryPrompt not found');
      }

      return userPrompt[0];
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to get user prompt',
      );
    }
  }

  // Update a specific UserPrompt by userId
  public async updateUserPrompt(userId: string, messageId: string) {
    try {
      const userPrompt = await this.userPromptModel.findOne({ userId }).exec();
      if (!userPrompt) {
        throw CustomHttpException.notFound('UserPrompt not found');
      }
      userPrompt.messageId = messageId;
      const updatedUserPrompt = await userPrompt.save();
      return updatedUserPrompt;
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to update user prompt',
      );
    }
  }

  // Delete a specific UserPrompt by userId
  public async deleteUserPrompt(userId: string) {
    try {
      const userPrompt = await this.userPromptModel.findOne({ userId }).exec();
      if (!userPrompt) {
        throw CustomHttpException.notFound('UserPrompt not found');
      }
      await this.userPromptModel.deleteOne({ userId }).exec();
      return { message: 'UserPrompt deleted successfully' };
    } catch (error) {
      throw CustomHttpException.internalServerError(
        'Failed to delete user prompt',
      );
    }
  }

  public async sendFileForUpload(fileBuffer: Buffer, userId: string) {
    this.fileManagerClient.emit('markdown-file-user-upload', {
      fileBuffer,
      userId,
    });
  }
}

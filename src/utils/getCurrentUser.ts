import { Model, Types, PipelineStage } from 'mongoose';

interface GetUserByIdOptions {
  excludeFields?: string[]; // Fields to exclude, e.g., ['password']
}

export async function getUserById(
  userId: string,
  model: Model<any>,
  options: GetUserByIdOptions = {},
): Promise<any> {
  const { excludeFields = [] } = options;

  try {
    const aggregationPipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(userId),
        },
      },
      {
        $project: excludeFields.reduce(
          (acc, field) => {
            acc[field] = 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    ];

    const result = await model.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw new Error(`Failed to get user by ID: ${error.message}`);
  }
}

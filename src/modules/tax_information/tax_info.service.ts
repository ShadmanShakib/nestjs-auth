import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TaxInfoDocument,
  TaxInformationInterface,
  TaxInformationModel,
} from 'src/model/tax_information.model';
import { CustomHttpException } from 'src/utils/custom_error_class';

@Injectable()
export class TaxInformationService {
  constructor(
    @InjectModel(TaxInformationModel.name)
    private taxInfoModel: Model<TaxInfoDocument>,
  ) {}

  public async createTaxInfo(data: TaxInformationInterface) {
    try {
      const newTaxInfo = await this.taxInfoModel.create(data);

      if (!newTaxInfo)
        throw CustomHttpException.internalServerError(
          'Failed to create the the tax info',
        );

      return newTaxInfo;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Create Tax Info failed: ${errorMsg}`,
      );
    }
  }

  public async getTaxInfo(userId: string, id?: string) {
    /**
        @TODO -> add logic to filter by other variables other than Id,
         */
    try {
      if (id) {
        const taxInfo = await this.taxInfoModel.findOne({
          userId: id,
        });
        if (!taxInfo) {
          throw CustomHttpException.notFound('Tax Info not found');
        }
        return taxInfo;
      }
      const currentUsersTaxInfo = await this.taxInfoModel.findOne({
        userId,
      });
      return currentUsersTaxInfo;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      const errorMsg = error.message ?? 'An unexpected error occurred';
      throw CustomHttpException.internalServerError(
        `Failed to get Tax Info: ${errorMsg}`,
      );
    }
  }
}

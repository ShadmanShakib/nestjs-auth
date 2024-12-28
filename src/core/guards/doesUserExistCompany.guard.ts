// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { UserCompaniesService } from 'src/modules/user_companies/user_companies.service';
// import { UserCompaniesInterface } from 'src/model/user_companies.model';
// import { CustomHttpException } from 'src/utils/custom_error_class';

// @Injectable()
// export class DoesUserExistCompanies implements CanActivate {
//   constructor(private userCompaniesService: UserCompaniesService) {}

//   async canActivate(context: ExecutionContext) {
//     const request = context.switchToHttp().getRequest();
//     const data = request.body;
//     data.userId = request.query.user_id;
//     return this.validateRequest(data);
//   }

//   async validateRequest(data: UserCompaniesInterface) {
//     const isValid =
//       await this.userCompaniesService.validateUserCompanyAssociation(
//         data.userId,
//         data.companyId,
//       );

//     if (isValid) return true;

//     throw CustomHttpException.badRequest(
//       'User is already associated with the given company.',
//     );
//   }
// }

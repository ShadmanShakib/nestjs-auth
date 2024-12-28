import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserStatus } from 'src/model/users.model';
import { AuthService } from 'src/modules/auth/auth.service';
import { CustomHttpException } from 'src/utils/custom_error_class';

@Injectable()
export class ValidateProviderUser implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(request: {
    body: { email: string; firebaseUid: string };
    user?: any;
  }) {
    const user = await this.authService.validateProviderUser(
      request.body.email,
      request.body.firebaseUid,
    );

    if (!user) {
      throw CustomHttpException.forbidden('Invalid login detail');
    }

    if (
      user.status === UserStatus.INVITED ||
      user.status === UserStatus.VERIFICATION_PENDING ||
      user.status === UserStatus.INACTIVE
    ) {
      throw CustomHttpException.forbidden(
        'You need to use the signup link to complete authorization of your account. Account has not been verified yet.',
      );
    }

    // Attach user data to the request object
    request.user = user;
    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from 'src/modules/auth/auth.service';
import { CustomHttpException } from 'src/utils/custom_error_class';

@Injectable()
export class DoesUserExist implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(request: { body: { email: any } }) {
    const userExist = await this.authService.getUserByEmail(request.body.email);

    if (userExist) {
      throw CustomHttpException.forbidden('This email already exist');
    }
    return true;
  }
}

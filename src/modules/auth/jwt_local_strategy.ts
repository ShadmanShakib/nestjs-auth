import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { UserStatus } from 'src/model/users.model';
import { CustomHttpException } from 'src/utils/custom_error_class';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', password: 'password' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw CustomHttpException.forbidden('Invalid user credentials');
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

    return user;
  }
}

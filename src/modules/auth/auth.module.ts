import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModel, UsersSchema } from 'src/model/users.model';
import { LocalStrategy } from './jwt_local_strategy';
import { UsersProfileModule } from '../users_profile/users_profile.module';
import { LoggerModule } from '../logger/logger.module';
import { EmailProviderService } from './email_provider.service';
import { UsersAddressModule } from '../address/address.module';
import { TwilioProviderService } from './twilio_provider.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CompaniesModel, CompaniesSchema } from 'src/model/companies.model';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    LoggerModule,
    MongooseModule.forFeature([
      { name: UsersModel.name, schema: UsersSchema },
      { name: CompaniesModel.name, schema: CompaniesSchema },
    ]),
    UsersProfileModule,
    UsersAddressModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth',
            brokers: [process.env.BROKER_INTERNAL_URI],
          },
          consumer: {
            groupId: 'auth-consumer-9405',
          },
        },
      },
    ]),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    EmailProviderService,
    TwilioProviderService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

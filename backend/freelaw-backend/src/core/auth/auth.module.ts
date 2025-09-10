import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// TODO: Implementar estratégias de autenticação
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'fallback-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  // providers: [AuthService, JwtStrategy],
  // controllers: [AuthController],
  // exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}


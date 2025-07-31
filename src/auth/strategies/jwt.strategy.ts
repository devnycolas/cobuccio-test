import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'secretKey',
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);

      if (!user.isActive || user.isBlocked) {
        throw new UnauthorizedException('Usuário inativo ou bloqueado');
      }

      return { id: user.id, email: user.email, name: user.name };
    } catch (error) {
      // Re-throw UnauthorizedException with specific messages
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For any other error (e.g., user not found, database errors)
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}

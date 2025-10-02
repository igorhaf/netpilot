import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { LoginDto, RegisterDto } from '../../dtos/auth.dto';
import { LogsService } from '../logs/logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role: role || 'admin',
    });

    await this.userRepository.save(user);

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const log = await this.logsService.createLog(
      LogType.SYSTEM,
      'Login',
      `Tentativa de login: ${email}`,
    );

    try {
      const user = await this.userRepository.findOne({
        where: { email, isActive: true },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          `Login falhou para ${email}`,
        );
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      const token = this.jwtService.sign(payload);

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Login realizado com sucesso: ${email}`,
        JSON.stringify({ userId: user.id, role: user.role }),
      );

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao fazer login',
        error.stack,
      );
      throw error;
    }
  }

  async validateUser(userId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }
}
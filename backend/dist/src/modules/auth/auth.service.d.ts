import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';
import { LoginDto, RegisterDto } from '../../dtos/auth.dto';
import { LogsService } from '../logs/logs.service';
export declare class AuthService {
    private userRepository;
    private jwtService;
    private logsService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, logsService: LogsService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: string;
        };
    }>;
    validateUser(userId: string): Promise<User>;
}

import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService as AppConfigService } from '../../services/config.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: AppConfigService);
    validate(payload: any): Promise<import("../../entities/user.entity").User>;
}
export {};

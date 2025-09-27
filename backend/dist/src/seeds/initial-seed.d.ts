import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Domain } from '../entities/domain.entity';
import { ProxyRule } from '../entities/proxy-rule.entity';
import { Redirect } from '../entities/redirect.entity';
import { SslCertificate } from '../entities/ssl-certificate.entity';
import { Log } from '../entities/log.entity';
export declare class InitialSeedService {
    private userRepository;
    private projectRepository;
    private domainRepository;
    private proxyRuleRepository;
    private redirectRepository;
    private sslCertificateRepository;
    private logRepository;
    constructor(userRepository: Repository<User>, projectRepository: Repository<Project>, domainRepository: Repository<Domain>, proxyRuleRepository: Repository<ProxyRule>, redirectRepository: Repository<Redirect>, sslCertificateRepository: Repository<SslCertificate>, logRepository: Repository<Log>);
    seed(): Promise<void>;
}

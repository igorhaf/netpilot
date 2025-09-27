import { ProxyRule } from './proxy-rule.entity';
import { SslCertificate } from './ssl-certificate.entity';
import { Project } from './project.entity';
export declare class Domain {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    isLocked: boolean;
    autoTls: boolean;
    forceHttps: boolean;
    blockExternalAccess: boolean;
    enableWwwRedirect: boolean;
    bindIp: string;
    project: Project;
    projectId: string;
    proxyRules: ProxyRule[];
    sslCertificates: SslCertificate[];
    createdAt: Date;
    updatedAt: Date;
}

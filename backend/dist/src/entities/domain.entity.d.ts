import { ProxyRule } from './proxy-rule.entity';
import { SslCertificate } from './ssl-certificate.entity';
export declare class Domain {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    autoTls: boolean;
    forceHttps: boolean;
    blockExternalAccess: boolean;
    enableWwwRedirect: boolean;
    bindIp: string;
    proxyRules: ProxyRule[];
    sslCertificates: SslCertificate[];
    createdAt: Date;
    updatedAt: Date;
}

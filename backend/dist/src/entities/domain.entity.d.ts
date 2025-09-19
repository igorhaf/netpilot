import { ProxyRule } from './proxy-rule.entity';
import { Redirect } from './redirect.entity';
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
    redirects: Redirect[];
    sslCertificates: SslCertificate[];
    createdAt: Date;
    updatedAt: Date;
}

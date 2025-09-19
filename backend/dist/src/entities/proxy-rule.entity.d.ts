import { Domain } from './domain.entity';
export declare class ProxyRule {
    id: string;
    sourcePath: string;
    targetUrl: string;
    priority: number;
    isActive: boolean;
    maintainQueryStrings: boolean;
    description: string;
    domain: Domain;
    domainId: string;
    createdAt: Date;
    updatedAt: Date;
}

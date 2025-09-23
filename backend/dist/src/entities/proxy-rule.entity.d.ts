import { Domain } from './domain.entity';
export declare class ProxyRule {
    id: string;
    sourcePath: string;
    sourcePort: number;
    targetUrl: string;
    priority: number;
    isActive: boolean;
    isLocked: boolean;
    maintainQueryStrings: boolean;
    description: string;
    domain: Domain;
    domainId: string;
    createdAt: Date;
    updatedAt: Date;
}

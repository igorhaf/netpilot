import { Domain } from './domain.entity';
export declare enum RedirectType {
    PERMANENT = "301",
    TEMPORARY = "302"
}
export declare class Redirect {
    id: string;
    sourcePattern: string;
    targetUrl: string;
    type: RedirectType;
    isActive: boolean;
    priority: number;
    description: string;
    domain: Domain;
    domainId: string;
    createdAt: Date;
    updatedAt: Date;
}

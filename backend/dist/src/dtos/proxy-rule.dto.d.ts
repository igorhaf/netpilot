export declare class CreateProxyRuleDto {
    sourcePath: string;
    sourcePort?: number;
    targetUrl: string;
    priority: number;
    isActive?: boolean;
    isLocked?: boolean;
    maintainQueryStrings?: boolean;
    description?: string;
    domainId: string;
}
export declare class UpdateProxyRuleDto extends CreateProxyRuleDto {
}

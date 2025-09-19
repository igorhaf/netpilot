export declare class CreateProxyRuleDto {
    sourcePath: string;
    targetUrl: string;
    priority: number;
    isActive?: boolean;
    maintainQueryStrings?: boolean;
    description?: string;
    domainId: string;
}
export declare class UpdateProxyRuleDto extends CreateProxyRuleDto {
}

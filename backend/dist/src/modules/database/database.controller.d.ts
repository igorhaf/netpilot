import { DatabaseService } from './database.service';
export declare class DatabaseController {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getDatabaseInfo(dbType?: 'postgres' | 'mysql'): Promise<{
        version: any;
        size: any;
        connectionCount: number;
        uptime: string;
        tables: any[];
    }>;
    getTables(dbType?: 'postgres' | 'mysql'): Promise<any[]>;
    getTableData(table: string, dbType?: 'postgres' | 'mysql', page?: string, limit?: string): Promise<{
        table: string;
        schema: any;
        columns: any;
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTableStructure(table: string, dbType?: 'postgres' | 'mysql'): Promise<{
        table: string;
        schema: any;
        columns: any;
        indexes: any;
        constraints: any;
    }>;
    executeQuery(body: {
        query: string;
        dbType?: 'postgres' | 'mysql';
        params?: any[];
        allowDestructive?: boolean;
    }): Promise<{
        success: boolean;
        data: any;
        rowCount: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data: any;
        rowCount: number;
    }>;
    insertRow(body: {
        table: string;
        dbType?: 'postgres' | 'mysql';
        data: Record<string, any>;
    }): Promise<{
        success: boolean;
        message: string;
        insertId: any;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: any;
        insertId?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        insertId?: undefined;
        data?: undefined;
    }>;
    updateRow(body: {
        table: string;
        dbType?: 'postgres' | 'mysql';
        data: Record<string, any>;
        where: Record<string, any>;
    }): Promise<{
        success: boolean;
        message: string;
        affectedRows: any;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: any;
        affectedRows?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        affectedRows?: undefined;
        data?: undefined;
    }>;
    deleteRow(body: {
        table: string;
        dbType?: 'postgres' | 'mysql';
        where: Record<string, any>;
    }): Promise<{
        success: boolean;
        message: string;
        affectedRows: any;
        rowCount?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        rowCount: any;
        affectedRows?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        affectedRows?: undefined;
        rowCount?: undefined;
    }>;
    exportData(table: string, dbType?: 'postgres' | 'mysql', format?: 'csv' | 'json' | 'sql'): Promise<{
        success: boolean;
        format: string;
        data: any;
        filename: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        format?: undefined;
        data?: undefined;
        filename?: undefined;
    }>;
}

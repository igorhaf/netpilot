import { DataSource } from 'typeorm';
export declare class DatabaseService {
    private postgresDataSource;
    private mysqlDataSource;
    constructor(postgresDataSource: DataSource, mysqlDataSource: DataSource);
    private getDataSource;
    getDatabaseInfo(dbType?: 'postgres' | 'mysql'): Promise<{
        version: any;
        size: any;
        connectionCount: number;
        uptime: string;
        tables: any[];
    }>;
    getTables(dbType?: 'postgres' | 'mysql'): Promise<any[]>;
    getTableData(tableName: string, dbType?: 'postgres' | 'mysql', page?: number, limit?: number): Promise<{
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
    getTableStructure(tableName: string, dbType?: 'postgres' | 'mysql'): Promise<{
        table: string;
        schema: any;
        columns: any;
        indexes: any;
        constraints: any;
    }>;
    executeQuery(query: string, dbType?: 'postgres' | 'mysql', params?: any[], allowDestructive?: boolean): Promise<{
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
    insertRow(tableName: string, dbType: 'postgres' | 'mysql', data: Record<string, any>): Promise<{
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
    updateRow(tableName: string, dbType: 'postgres' | 'mysql', data: Record<string, any>, where: Record<string, any>): Promise<{
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
    deleteRow(tableName: string, dbType: 'postgres' | 'mysql', where: Record<string, any>): Promise<{
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
    exportData(tableName: string, dbType?: 'postgres' | 'mysql', format?: 'csv' | 'json' | 'sql'): Promise<{
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

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let DatabaseService = class DatabaseService {
    constructor(postgresDataSource, mysqlDataSource) {
        this.postgresDataSource = postgresDataSource;
        this.mysqlDataSource = mysqlDataSource;
    }
    getDataSource(dbType) {
        return dbType === 'mysql' ? this.mysqlDataSource : this.postgresDataSource;
    }
    async getDatabaseInfo(dbType = 'postgres') {
        const dataSource = this.getDataSource(dbType);
        if (dbType === 'mysql') {
            const [versionResult] = await dataSource.query('SELECT VERSION() as version');
            const [sizeResult] = await dataSource.query(`SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
         FROM information_schema.tables
         WHERE table_schema = DATABASE()`);
            const [connectionResult] = await dataSource.query(`SELECT COUNT(*) as count FROM information_schema.processlist WHERE db = DATABASE()`);
            const [uptimeResult] = await dataSource.query(`SHOW GLOBAL STATUS LIKE 'Uptime'`);
            const uptimeSeconds = parseInt(uptimeResult.Value);
            const days = Math.floor(uptimeSeconds / 86400);
            const hours = Math.floor((uptimeSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const tables = await this.getTables(dbType);
            return {
                version: versionResult.version.split('-')[0],
                size: `${sizeResult.size_mb} MB`,
                connectionCount: parseInt(connectionResult.count),
                uptime: `${days}d ${hours}h ${minutes}m`,
                tables,
            };
        }
        else {
            const [versionResult] = await dataSource.query('SELECT version()');
            const [sizeResult] = await dataSource.query(`SELECT pg_size_pretty(pg_database_size($1)) as size`, [dataSource.options.database]);
            const [connectionResult] = await dataSource.query(`SELECT count(*) as count FROM pg_stat_activity WHERE datname = $1`, [dataSource.options.database]);
            const [uptimeResult] = await dataSource.query(`SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime`);
            const uptimeSeconds = parseFloat(uptimeResult.uptime);
            const days = Math.floor(uptimeSeconds / 86400);
            const hours = Math.floor((uptimeSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const tables = await this.getTables(dbType);
            return {
                version: versionResult.version.split(' ')[1],
                size: sizeResult.size,
                connectionCount: parseInt(connectionResult.count),
                uptime: `${days}d ${hours}h ${minutes}m`,
                tables,
            };
        }
    }
    async getTables(dbType = 'postgres') {
        const dataSource = this.getDataSource(dbType);
        if (dbType === 'mysql') {
            const result = await dataSource.query(`
        SELECT
          table_name as name,
          ROUND((data_length + index_length) / 1024, 2) as size_kb
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY table_name
      `);
            const tablesWithCounts = await Promise.all(result.map(async (table) => {
                const [countResult] = await dataSource.query(`SELECT COUNT(*) as count FROM \`${table.name}\``);
                return {
                    name: table.name,
                    schema: 'default',
                    rows: parseInt(countResult.count),
                    size: `${table.size_kb} KB`,
                };
            }));
            return tablesWithCounts;
        }
        else {
            const result = await dataSource.query(`
        SELECT
          schemaname,
          tablename as name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY tablename
      `);
            const tablesWithCounts = await Promise.all(result.map(async (table) => {
                const [countResult] = await dataSource.query(`SELECT count(*) as count FROM ${table.schemaname}.${table.name}`);
                return {
                    name: table.name,
                    schema: table.schemaname,
                    rows: parseInt(countResult.count),
                    size: table.size,
                };
            }));
            return tablesWithCounts;
        }
    }
    async getTableData(tableName, dbType = 'postgres', page = 1, limit = 50) {
        const dataSource = this.getDataSource(dbType);
        const tables = await this.getTables(dbType);
        const tableExists = tables.find((t) => t.name === tableName);
        if (!tableExists) {
            throw new Error('Table not found');
        }
        const offset = (page - 1) * limit;
        if (dbType === 'mysql') {
            const columnsRaw = await dataSource.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);
            const columns = columnsRaw.map((col) => ({
                column_name: col.COLUMN_NAME || col.column_name,
                data_type: col.DATA_TYPE || col.data_type,
                is_nullable: col.IS_NULLABLE || col.is_nullable,
                column_default: col.COLUMN_DEFAULT !== undefined ? col.COLUMN_DEFAULT : col.column_default,
            }));
            const data = await dataSource.query(`SELECT * FROM \`${tableName}\` LIMIT ${limit} OFFSET ${offset}`);
            const [countResult] = await dataSource.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            return {
                table: tableName,
                schema: 'default',
                columns,
                data,
                pagination: {
                    page,
                    limit,
                    total: parseInt(countResult.count),
                    totalPages: Math.ceil(parseInt(countResult.count) / limit),
                },
            };
        }
        else {
            const schema = tableExists.schema;
            const columns = await dataSource.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, tableName]);
            const data = await dataSource.query(`SELECT * FROM ${schema}.${tableName} LIMIT ${limit} OFFSET ${offset}`);
            const [countResult] = await dataSource.query(`SELECT count(*) as count FROM ${schema}.${tableName}`);
            return {
                table: tableName,
                schema,
                columns,
                data,
                pagination: {
                    page,
                    limit,
                    total: parseInt(countResult.count),
                    totalPages: Math.ceil(parseInt(countResult.count) / limit),
                },
            };
        }
    }
    async getTableStructure(tableName, dbType = 'postgres') {
        const dataSource = this.getDataSource(dbType);
        const tables = await this.getTables(dbType);
        const tableExists = tables.find((t) => t.name === tableName);
        if (!tableExists) {
            throw new Error('Table not found');
        }
        if (dbType === 'mysql') {
            const columnsRaw = await dataSource.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);
            const columns = columnsRaw.map((col) => ({
                column_name: col.COLUMN_NAME || col.column_name,
                data_type: col.DATA_TYPE || col.data_type,
                character_maximum_length: col.CHARACTER_MAXIMUM_LENGTH !== undefined ? col.CHARACTER_MAXIMUM_LENGTH : col.character_maximum_length,
                is_nullable: col.IS_NULLABLE || col.is_nullable,
                column_default: col.COLUMN_DEFAULT !== undefined ? col.COLUMN_DEFAULT : col.column_default,
            }));
            const indexes = await dataSource.query(`
        SHOW INDEX FROM \`${tableName}\`
      `);
            const constraintsRaw = await dataSource.query(`
        SELECT
          constraint_name,
          constraint_type
        FROM information_schema.table_constraints
        WHERE table_schema = DATABASE() AND table_name = ?
      `, [tableName]);
            const constraints = constraintsRaw.map((c) => ({
                constraint_name: c.CONSTRAINT_NAME || c.constraint_name,
                constraint_type: c.CONSTRAINT_TYPE || c.constraint_type,
            }));
            return {
                table: tableName,
                schema: 'default',
                columns,
                indexes,
                constraints,
            };
        }
        else {
            const schema = tableExists.schema;
            const columns = await dataSource.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, tableName]);
            const indexes = await dataSource.query(`
        SELECT
          i.relname as index_name,
          a.attname as column_name,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
          AND t.relname = $1
        ORDER BY i.relname, a.attnum
      `, [tableName]);
            const constraints = await dataSource.query(`
        SELECT
          conname as constraint_name,
          contype as constraint_type
        FROM pg_constraint
        WHERE conrelid = $1::regclass
      `, [`${schema}.${tableName}`]);
            return {
                table: tableName,
                schema,
                columns,
                indexes,
                constraints,
            };
        }
    }
    async executeQuery(query, dbType = 'postgres', params = [], allowDestructive = false) {
        try {
            const dataSource = this.getDataSource(dbType);
            if (!allowDestructive) {
                const dangerousKeywords = ['DROP', 'TRUNCATE', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
                const upperQuery = query.trim().toUpperCase();
                for (const keyword of dangerousKeywords) {
                    if (upperQuery.startsWith(keyword)) {
                        throw new Error(`Queries do tipo ${keyword} não são permitidas por segurança. Use allowDestructive: true se necessário.`);
                    }
                }
            }
            const result = await dataSource.query(query, params);
            return {
                success: true,
                data: result,
                rowCount: Array.isArray(result) ? result.length : 0,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                rowCount: 0,
            };
        }
    }
    async insertRow(tableName, dbType = 'postgres', data) {
        try {
            const dataSource = this.getDataSource(dbType);
            const tables = await this.getTables(dbType);
            const tableExists = tables.find((t) => t.name === tableName);
            if (!tableExists) {
                throw new Error('Table not found');
            }
            const columns = Object.keys(data);
            const values = Object.values(data);
            if (dbType === 'mysql') {
                const placeholders = columns.map(() => '?').join(', ');
                const query = `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
                const result = await dataSource.query(query, values);
                return {
                    success: true,
                    message: 'Registro inserido com sucesso',
                    insertId: result.insertId,
                };
            }
            else {
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO ${tableExists.schema}.${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
                const result = await dataSource.query(query, values);
                return {
                    success: true,
                    message: 'Registro inserido com sucesso',
                    data: result[0],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async updateRow(tableName, dbType = 'postgres', data, where) {
        try {
            const dataSource = this.getDataSource(dbType);
            const tables = await this.getTables(dbType);
            const tableExists = tables.find((t) => t.name === tableName);
            if (!tableExists) {
                throw new Error('Table not found');
            }
            const setColumns = Object.keys(data);
            const setValues = Object.values(data);
            const whereColumns = Object.keys(where);
            const whereValues = Object.values(where);
            if (dbType === 'mysql') {
                const setClause = setColumns.map(col => `\`${col}\` = ?`).join(', ');
                const whereClause = whereColumns.map(col => `\`${col}\` = ?`).join(' AND ');
                const query = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${whereClause}`;
                const result = await dataSource.query(query, [...setValues, ...whereValues]);
                return {
                    success: true,
                    message: 'Registro atualizado com sucesso',
                    affectedRows: result.affectedRows,
                };
            }
            else {
                let paramIndex = 1;
                const setClause = setColumns.map(col => `${col} = $${paramIndex++}`).join(', ');
                const whereClause = whereColumns.map(col => `${col} = $${paramIndex++}`).join(' AND ');
                const query = `UPDATE ${tableExists.schema}.${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
                const result = await dataSource.query(query, [...setValues, ...whereValues]);
                return {
                    success: true,
                    message: 'Registro atualizado com sucesso',
                    data: result[0],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async deleteRow(tableName, dbType = 'postgres', where) {
        try {
            const dataSource = this.getDataSource(dbType);
            const tables = await this.getTables(dbType);
            const tableExists = tables.find((t) => t.name === tableName);
            if (!tableExists) {
                throw new Error('Table not found');
            }
            const whereColumns = Object.keys(where);
            const whereValues = Object.values(where);
            if (dbType === 'mysql') {
                const whereClause = whereColumns.map(col => `\`${col}\` = ?`).join(' AND ');
                const query = `DELETE FROM \`${tableName}\` WHERE ${whereClause}`;
                const result = await dataSource.query(query, whereValues);
                return {
                    success: true,
                    message: 'Registro excluído com sucesso',
                    affectedRows: result.affectedRows,
                };
            }
            else {
                let paramIndex = 1;
                const whereClause = whereColumns.map(col => `${col} = $${paramIndex++}`).join(' AND ');
                const query = `DELETE FROM ${tableExists.schema}.${tableName} WHERE ${whereClause}`;
                const result = await dataSource.query(query, whereValues);
                return {
                    success: true,
                    message: 'Registro excluído com sucesso',
                    rowCount: result[1],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async exportData(tableName, dbType = 'postgres', format = 'json') {
        try {
            const dataSource = this.getDataSource(dbType);
            const tables = await this.getTables(dbType);
            const tableExists = tables.find((t) => t.name === tableName);
            if (!tableExists) {
                throw new Error('Table not found');
            }
            const data = await dataSource.query(`SELECT * FROM ${dbType === 'mysql' ? `\`${tableName}\`` : `${tableExists.schema}.${tableName}`}`);
            if (format === 'json') {
                return {
                    success: true,
                    format: 'json',
                    data: data,
                    filename: `${tableName}_${new Date().toISOString().split('T')[0]}.json`,
                };
            }
            else if (format === 'csv') {
                if (data.length === 0) {
                    return {
                        success: true,
                        format: 'csv',
                        data: '',
                        filename: `${tableName}_${new Date().toISOString().split('T')[0]}.csv`,
                    };
                }
                const headers = Object.keys(data[0]);
                const csvRows = [headers.join(',')];
                for (const row of data) {
                    const values = headers.map(header => {
                        const value = row[header];
                        if (value === null)
                            return '';
                        if (typeof value === 'string' && value.includes(','))
                            return `"${value}"`;
                        return value;
                    });
                    csvRows.push(values.join(','));
                }
                return {
                    success: true,
                    format: 'csv',
                    data: csvRows.join('\n'),
                    filename: `${tableName}_${new Date().toISOString().split('T')[0]}.csv`,
                };
            }
            else if (format === 'sql') {
                const inserts = data.map(row => {
                    const columns = Object.keys(row);
                    const values = Object.values(row).map(v => {
                        if (v === null)
                            return 'NULL';
                        if (typeof v === 'string')
                            return `'${v.replace(/'/g, "''")}'`;
                        if (v instanceof Date)
                            return `'${v.toISOString()}'`;
                        return v;
                    });
                    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
                });
                return {
                    success: true,
                    format: 'sql',
                    data: inserts.join('\n'),
                    filename: `${tableName}_${new Date().toISOString().split('T')[0]}.sql`,
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectDataSource)('mysql')),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.DataSource])
], DatabaseService);
//# sourceMappingURL=database.service.js.map
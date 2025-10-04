import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { DatabaseService } from './database.service';

@ApiTags('Database')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get database information and statistics' })
  async getDatabaseInfo(
    @Query('dbType') dbType: 'postgres' | 'mysql' = 'postgres',
  ) {
    return this.databaseService.getDatabaseInfo(dbType);
  }

  @Get('tables')
  @ApiOperation({ summary: 'List all database tables' })
  async getTables(
    @Query('dbType') dbType: 'postgres' | 'mysql' = 'postgres',
  ) {
    return this.databaseService.getTables(dbType);
  }

  @Get('table-data')
  @ApiOperation({ summary: 'Get data from a specific table' })
  async getTableData(
    @Query('table') table: string,
    @Query('dbType') dbType: 'postgres' | 'mysql' = 'postgres',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.databaseService.getTableData(
      table,
      dbType,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('table-structure')
  @ApiOperation({ summary: 'Get structure of a specific table' })
  async getTableStructure(
    @Query('table') table: string,
    @Query('dbType') dbType: 'postgres' | 'mysql' = 'postgres',
  ) {
    return this.databaseService.getTableStructure(table, dbType);
  }

  @Post('query')
  @ApiOperation({ summary: 'Execute a SQL query' })
  async executeQuery(
    @Body() body: { query: string; dbType?: 'postgres' | 'mysql'; params?: any[]; allowDestructive?: boolean },
  ) {
    return this.databaseService.executeQuery(
      body.query,
      body.dbType || 'postgres',
      body.params || [],
      body.allowDestructive || false,
    );
  }

  @Post('insert-row')
  @ApiOperation({ summary: 'Insert a new row into a table' })
  async insertRow(
    @Body() body: { table: string; dbType?: 'postgres' | 'mysql'; data: Record<string, any> },
  ) {
    return this.databaseService.insertRow(
      body.table,
      body.dbType || 'postgres',
      body.data,
    );
  }

  @Post('update-row')
  @ApiOperation({ summary: 'Update a row in a table' })
  async updateRow(
    @Body() body: {
      table: string;
      dbType?: 'postgres' | 'mysql';
      data: Record<string, any>;
      where: Record<string, any>
    },
  ) {
    return this.databaseService.updateRow(
      body.table,
      body.dbType || 'postgres',
      body.data,
      body.where,
    );
  }

  @Post('delete-row')
  @ApiOperation({ summary: 'Delete a row from a table' })
  async deleteRow(
    @Body() body: { table: string; dbType?: 'postgres' | 'mysql'; where: Record<string, any> },
  ) {
    return this.databaseService.deleteRow(
      body.table,
      body.dbType || 'postgres',
      body.where,
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Export table data' })
  async exportData(
    @Query('table') table: string,
    @Query('dbType') dbType: 'postgres' | 'mysql' = 'postgres',
    @Query('format') format: 'csv' | 'json' | 'sql' = 'json',
  ) {
    return this.databaseService.exportData(table, dbType, format);
  }
}

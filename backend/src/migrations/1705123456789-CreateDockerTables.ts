import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDockerTables1705123456789 implements MigrationInterface {
    name = 'CreateDockerTables1705123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Docker Jobs Table
        await queryRunner.createTable(
            new Table({
                name: 'docker_jobs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['backup', 'restore', 'pull', 'prune', 'exec'],
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'running', 'completed', 'failed'],
                        default: "'pending'",
                    },
                    {
                        name: 'resource_type',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'resource_id',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'parameters',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'progress',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'result',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'error',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'completed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            })
        );

        // Docker Backups Table
        await queryRunner.createTable(
            new Table({
                name: 'docker_backups',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'volume_name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'file_path',
                        type: 'varchar',
                        length: '500',
                    },
                    {
                        name: 'file_hash',
                        type: 'varchar',
                        length: '64',
                    },
                    {
                        name: 'file_size',
                        type: 'bigint',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'tags',
                        type: 'text',
                        isArray: true,
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'restored_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'restored_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['created_by'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['restored_by'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                ],
            })
        );

        // Docker Events Table
        await queryRunner.createTable(
            new Table({
                name: 'docker_events',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'resource_type',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'resource_id',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'resource_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'details',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'result',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'error_message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                    },
                    {
                        name: 'ip_address',
                        type: 'inet',
                        isNullable: true,
                    },
                    {
                        name: 'user_agent',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'timestamp',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            })
        );

        // Docker Quotas Table
        await queryRunner.createTable(
            new Table({
                name: 'docker_quotas',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isUnique: true,
                    },
                    {
                        name: 'max_containers',
                        type: 'integer',
                        default: 10,
                    },
                    {
                        name: 'max_volumes',
                        type: 'integer',
                        default: 5,
                    },
                    {
                        name: 'max_networks',
                        type: 'integer',
                        default: 3,
                    },
                    {
                        name: 'max_volume_size',
                        type: 'bigint',
                        default: 5368709120, // 5GB
                    },
                    {
                        name: 'max_actions_per_minute',
                        type: 'integer',
                        default: 10,
                    },
                    {
                        name: 'max_exec_timeout',
                        type: 'integer',
                        default: 1800, // 30 minutes
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            })
        );

        // Create indexes for better performance
        await queryRunner.createIndex(
            'docker_jobs',
            new TableIndex({
                name: 'IDX_docker_jobs_status_type',
                columnNames: ['status', 'type']
            })
        );

        await queryRunner.createIndex(
            'docker_jobs',
            new TableIndex({
                name: 'IDX_docker_jobs_user_created',
                columnNames: ['user_id', 'created_at']
            })
        );

        await queryRunner.createIndex(
            'docker_backups',
            new TableIndex({
                name: 'IDX_docker_backups_volume_created',
                columnNames: ['volume_name', 'created_at']
            })
        );

        await queryRunner.createIndex(
            'docker_events',
            new TableIndex({
                name: 'IDX_docker_events_resource_created',
                columnNames: ['resource_type', 'created_at']
            })
        );

        await queryRunner.createIndex(
            'docker_events',
            new TableIndex({
                name: 'IDX_docker_events_user_created',
                columnNames: ['user_id', 'created_at']
            })
        );

        await queryRunner.createIndex(
            'docker_events',
            new TableIndex({
                name: 'IDX_docker_events_timestamp',
                columnNames: ['timestamp']
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex('docker_events', 'IDX_docker_events_timestamp');
        await queryRunner.dropIndex('docker_events', 'IDX_docker_events_user_created');
        await queryRunner.dropIndex('docker_events', 'IDX_docker_events_resource_created');
        await queryRunner.dropIndex('docker_backups', 'IDX_docker_backups_volume_created');
        await queryRunner.dropIndex('docker_jobs', 'IDX_docker_jobs_user_created');
        await queryRunner.dropIndex('docker_jobs', 'IDX_docker_jobs_status_type');

        // Drop tables
        await queryRunner.dropTable('docker_quotas');
        await queryRunner.dropTable('docker_events');
        await queryRunner.dropTable('docker_backups');
        await queryRunner.dropTable('docker_jobs');
    }
}
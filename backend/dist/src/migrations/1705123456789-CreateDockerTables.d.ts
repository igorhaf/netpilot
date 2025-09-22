import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateDockerTables1705123456789 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

import { MigrationInterface, QueryRunner } from "typeorm";
export declare class RemoveIsActiveFromPresets1759854400073 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

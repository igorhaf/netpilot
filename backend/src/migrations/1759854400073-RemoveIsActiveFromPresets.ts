import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIsActiveFromPresets1759854400073 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "presets" DROP COLUMN "isActive"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "presets" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

}

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProxyRuleLockField1727057200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'proxy_rules',
      new TableColumn({
        name: 'isLocked',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('proxy_rules', 'isLocked');
  }
}
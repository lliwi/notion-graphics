import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStackedBarTypes1741920000000 implements MigrationInterface {
  name = 'AddStackedBarTypes1741920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "chart_type_enum" ADD VALUE IF NOT EXISTS 'bar_stacked'`);
    await queryRunner.query(`ALTER TYPE "chart_type_enum" ADD VALUE IF NOT EXISTS 'bar_horizontal_stacked'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no soporta eliminar valores de un enum directamente.
  }
}

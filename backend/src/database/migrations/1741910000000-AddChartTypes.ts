import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChartTypes1741910000000 implements MigrationInterface {
  name = 'AddChartTypes1741910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "chart_type_enum" ADD VALUE IF NOT EXISTS 'area'`);
    await queryRunner.query(`ALTER TYPE "chart_type_enum" ADD VALUE IF NOT EXISTS 'bar_horizontal'`);
    await queryRunner.query(`ALTER TYPE "chart_type_enum" ADD VALUE IF NOT EXISTS 'radar'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no soporta eliminar valores de un enum directamente.
    // Para revertir habría que recrear el tipo sin los nuevos valores.
  }
}

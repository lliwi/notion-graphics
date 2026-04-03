import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRadarAreaChartType1775196554161 implements MigrationInterface {
    name = 'AddRadarAreaChartType1775196554161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."chart_type_enum" ADD VALUE IF NOT EXISTS 'radar_area'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing values from enums.
        // To roll back, recreate the enum without 'radar_area'.
    }
}

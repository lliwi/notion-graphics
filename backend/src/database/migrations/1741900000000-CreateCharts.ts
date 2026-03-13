import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharts1741900000000 implements MigrationInterface {
  name = 'CreateCharts1741900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "chart_type_enum" AS ENUM (
        'bar', 'line', 'pie', 'donut', 'table', 'kpi'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "charts" (
        "id"          UUID              NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     UUID              NOT NULL,
        "name"        VARCHAR(255)      NOT NULL,
        "type"        "chart_type_enum" NOT NULL,
        "config_json" JSONB             NOT NULL,
        "embed_token" UUID              UNIQUE,
        "published"   BOOLEAN           NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_charts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_charts_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_charts_user_id_created_at"
        ON "charts" ("user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_charts_embed_token"
        ON "charts" ("embed_token")
        WHERE "embed_token" IS NOT NULL AND "published" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "charts"`);
    await queryRunner.query(`DROP TYPE "chart_type_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotionIntegrations1741824060000
  implements MigrationInterface
{
  name = 'CreateNotionIntegrations1741824060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notion_integrations" (
        "id"             UUID  NOT NULL DEFAULT gen_random_uuid(),
        "user_id"        UUID  NOT NULL,
        "access_token"   TEXT  NOT NULL,
        "workspace_id"   VARCHAR(255),
        "workspace_name" VARCHAR(255),
        "bot_id"         VARCHAR(255),
        "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notion_integrations_id"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notion_integrations_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_notion_integrations_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notion_integrations"`);
  }
}

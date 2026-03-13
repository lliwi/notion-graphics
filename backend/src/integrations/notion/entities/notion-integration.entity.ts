import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

@Entity('notion_integrations')
export class NotionIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @OneToOne(() => User, (user) => user.notionIntegration, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // TODO: encrypt at rest before production
  @Column({ type: 'text' })
  access_token: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workspace_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workspace_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bot_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

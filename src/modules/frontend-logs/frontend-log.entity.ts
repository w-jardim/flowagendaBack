import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('frontend_logs')
export class FrontendLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: 'error' })
  level: string;

  @Column({ type: 'varchar', length: 1024 })
  message: string;

  @Column({ type: 'text', nullable: true })
  stack?: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  url?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

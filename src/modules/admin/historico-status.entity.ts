import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('historico_status_profissional')
export class HistoricoStatusProfissional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  profissional_id: string;

  @Column({ type: 'varchar', length: 20 })
  status_anterior: string;

  @Column({ type: 'varchar', length: 20 })
  status_novo: string;

  @CreateDateColumn({ type: 'timestamp' })
  data_alteracao: Date;
}

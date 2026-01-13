import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profissional } from './profissional.entity';

/**
 * Entity que armazena configurações da agenda do profissional
 */
@Entity('configuracoes_agenda')
export class ConfiguracaoAgenda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  profissional_id: string;

  @Column({ type: 'int', default: 2 })
  antecedencia_cancelamento_horas: number;

  @Column({ type: 'time', nullable: true })
  horario_inicio: string;

  @Column({ type: 'time', nullable: true })
  horario_fim: string;

  @Column({ type: 'jsonb', nullable: true })
  dias_ativos: string[];

  @ManyToOne(() => Profissional, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profissional_id' })
  profissional: Profissional;
}
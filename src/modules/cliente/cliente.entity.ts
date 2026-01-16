import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Agendamento } from '../agendamento/agendamento.entity';
import { Profissional } from '../profissional/profissional.entity';

/**
 * Entity que representa um cliente final
 * Cliente não possui autenticação
 */
@Entity('clientes')
@Index(['profissional_id', 'whatsapp'], { unique: true })
@Index(['profissional_id', 'cpf'], { unique: true, where: 'cpf IS NOT NULL' })
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  profissional_id: string;

  @ManyToOne(() => Profissional, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profissional_id' })
  profissional: Profissional;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 20 })
  whatsapp: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cpf?: string;

  @Column({ type: 'text', nullable: true })
  endereco?: string;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;

  @OneToMany(() => Agendamento, (agendamento: Agendamento) => agendamento.cliente)
  agendamentos: Agendamento[];
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Profissional } from '../profissional/profissional.entity';
import { Cliente } from '../cliente/cliente.entity';
import { Servico } from '../servico/servico.entity';

@Entity('agendamentos')
@Index(['profissional_id', 'data_inicio'])
export class Agendamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  profissional_id: string;

  @Column({ type: 'uuid' })
  cliente_id: string;

  @Column({ type: 'uuid', nullable: true })
  servico_id: string;

  @Column({ type: 'timestamptz' }) // Com fuso horário para evitar erros
  data_inicio: Date;

  @Column({ type: 'timestamptz' })
  data_fim: Date;

  @Column({ type: 'varchar', length: 50, default: 'confirmado' })
  status: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  valor: number;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  atualizado_em: Date;

  @ManyToOne(() => Profissional, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profissional_id' })
  profissional: Profissional;

  @ManyToOne(() => Cliente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Servico, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'servico_id' })
  servico: Servico;
}
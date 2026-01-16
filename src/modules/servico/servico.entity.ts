import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Profissional } from '../profissional/profissional.entity';
import { Agendamento } from '../agendamento/agendamento.entity';

/**
 * Entity que representa um serviço oferecido por um profissional
 */
@Entity('servicos')
export class Servico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  profissional_id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'int' })
  duracao_minutos: number;

  @Column({ type: 'int', default: 0 })
  intervalo_minutos: number;

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
  preco: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;

  @ManyToOne(() => Profissional, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profissional_id' })
  profissional: Profissional;

  // Ainda vamos criar Agendamento, então deixe comentado por enquanto
  @OneToMany(() => Agendamento,(agendamento: Agendamento) => agendamento.servico,)
  agendamentos: Agendamento[];
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Servico } from '../servico/servico.entity';
import { Agendamento } from '../agendamento/agendamento.entity';

@Entity('profissionais')
export class Profissional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  senha_hash: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsapp: string;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  atualizado_em: Date;

  // Relacionamentos
  @OneToMany(() => Servico, (servico) => servico.profissional)
  servicos: Servico[];

  @OneToMany(() => Agendamento, (agendamento) => agendamento.profissional)
  agendamentos: Agendamento[];
}
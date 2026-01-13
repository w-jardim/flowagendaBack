import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Agendamento } from '../agendamento/agendamento.entity';

/**
 * Entity que representa um cliente final
 * Cliente não possui autenticação
 */
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  whatsapp: string;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;

  @OneToMany( () => Agendamento,(agendamento: Agendamento) => agendamento.cliente,)
 agendamentos: Agendamento[];

}
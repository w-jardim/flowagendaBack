import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('profissionais')
@Unique(['email'])
export class Profissional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nome: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'senha_hash', length: 255, select: false })
  senhaHash: string;

  @Column({ length: 50, nullable: true })
  tipo?: string;

  @Column({ length: 20, nullable: true })
  whatsapp?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PROFISSIONAL',
  })
  role: 'ADMIN' | 'PROFISSIONAL';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'BLOCKED';

  @CreateDateColumn({ type: 'timestamp', default: () => 'now()' })
  criado_em: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'now()' })
  atualizado_em: Date;
}
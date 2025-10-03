import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'turnos' })
export class Turno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: ['C', 'V'], default: 'C' })
  tipo!: 'C' | 'V';

  @Column({ type: 'varchar', length: 32, unique: false })
  codigo!: string;

  @Column({ type: 'enum', enum: ['WAITING', 'CALLING', 'SERVED', 'CANCELLED', 'DONE'], default: 'WAITING' })
  status!: 'WAITING' | 'CALLING' | 'SERVED' | 'CANCELLED' | 'DONE';

  @Column({ type: 'int', nullable: true })
  ventanilla!: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  creado_el!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  actualizado_el!: Date;

  @Column({ type: 'datetime', nullable: true })
  llamado_el!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  atendido_el!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  cancelado_el!: Date | null;

  @Column({ type: 'int', nullable: true })
  actualizado_por_usuario!: number | null;
}

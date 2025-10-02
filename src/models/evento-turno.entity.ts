import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// Define aquí el tipo de estado para usarlo en eventos.
// (No lo importamos de Turno para no romper nada.)
export type TurnoStatus = 'WAITING' | 'CALLING' | 'SERVED' | 'CANCELLED' | 'CREATED';

@Entity({ name: 'eventos_turno' })
export class EventoTurno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'id_ticket', type: 'int', unsigned: true })
  id_ticket!: number;

  // En tu diagrama están como delEstado / aEstado
  @Column({
    name: 'delEstado',
    type: 'enum',
    enum: ['WAITING', 'CALLING', 'SERVED', 'CANCELLED', 'CREATED'],
    nullable: true,
  })
  delEstado!: TurnoStatus | null;

  @Column({
    name: 'aEstado',
    type: 'enum',
    enum: ['WAITING', 'CALLING', 'SERVED', 'CANCELLED', 'CREATED'],
    nullable: true,
  })
  aEstado!: TurnoStatus | null;

  @Column({ name: 'notas', type: 'varchar', length: 255, nullable: true })
  notas!: string | null;

  @Column({ name: 'por_id_usuario', type: 'int', unsigned: true, nullable: true })
  por_id_usuario!: number | null;

  @Column({ name: 'creado_el', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  creado_el!: Date;
}

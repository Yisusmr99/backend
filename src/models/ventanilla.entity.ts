
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'ventanillas' })
export class Ventanilla {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ type: 'varchar', length: 100 })
  etiqueta!: string;

  @Column({ type: 'tinyint', default: 1 })
  activo!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  creado_el!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  actualizado_el!: Date;
}

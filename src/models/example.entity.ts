import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Example {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name: string = '';
}

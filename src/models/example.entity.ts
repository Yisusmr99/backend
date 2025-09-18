import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Example {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name: string = '';
}

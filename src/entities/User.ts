import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RefreshToken } from './RefreshToken';

@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number; // entero autoincremental

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: ['Admin', 'Cajero', 'Cliente'], default: 'Cliente' })
  role!: 'Admin' | 'Cajero' | 'Cliente';

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens!: RefreshToken[];
}

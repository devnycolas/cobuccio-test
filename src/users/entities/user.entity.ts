import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único do usuário' })
  id: string;

  @Column({ length: 100 })
  @ApiProperty({ description: 'Nome completo do usuário' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: true })
  @ApiProperty({ description: 'Status de ativação do usuário' })
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'Indica se o usuário está bloqueado' })
  isBlocked: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'Data de criação do usuário' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Data de última atualização do usuário' })
  updatedAt: Date;

  @OneToOne(() => Wallet, (wallet) => wallet.user, { cascade: true })
  wallet: Wallet;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

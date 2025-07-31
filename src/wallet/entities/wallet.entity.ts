import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único da carteira' })
  id: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  @ApiProperty({ description: 'Saldo atual da carteira' })
  balance: number;

  @Column({ default: false })
  @ApiProperty({ description: 'Indica se a carteira possui inconsistências' })
  hasInconsistency: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'Data de criação da carteira' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Data de última atualização da carteira' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.sourceWallet)
  outgoingTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.destinationWallet)
  incomingTransactions: Transaction[];
}

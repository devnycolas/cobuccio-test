import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Wallet } from '../../wallet/entities/wallet.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  REVERSAL = 'reversal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único da transação' })
  id: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  @ApiProperty({
    description: 'Tipo de transação',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  @ApiProperty({ description: 'Valor da transação' })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @ApiProperty({
    description: 'Status da transação',
    enum: TransactionStatus,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Descrição da transação' })
  description: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.outgoingTransactions)
  @JoinColumn({ name: 'source_wallet_id' })
  sourceWallet: Wallet;

  @Column({ name: 'source_wallet_id', nullable: true })
  sourceWalletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.incomingTransactions)
  @JoinColumn({ name: 'destination_wallet_id' })
  destinationWallet: Wallet;

  @Column({ name: 'destination_wallet_id', nullable: true })
  destinationWalletId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'ID da transação original (em caso de estorno)' })
  originalTransactionId: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Data de criação da transação' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Data de última atualização da transação' })
  updatedAt: Date;
}

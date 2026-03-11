import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  AccountRepositoryPort,
  PaginationParams,
  PaginatedResult,
} from '../../domain/ports/account.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';

@Injectable()
export class PrismaAccountRepository implements AccountRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async save(account: Account): Promise<void> {
    const data = AccountMapper.toPersistence(account);
    const events = account.getEvents();

    await this.prisma.$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });

      for (const event of events) {
        this.eventEmitter.emit(event.constructor.name, event);
      }
    });

    account.clearEvents();
  }

  async findById(id: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { id } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { email } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByCpf(cpf: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { cpf } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByAuth0Sub(auth0Sub: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { auth0Sub } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Account>> {
    const [rows, total] = await Promise.all([
      this.prisma.account.findMany({
        skip: params.offset,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count(),
    ]);

    return {
      data: rows.map((row) => AccountMapper.toDomain(row)),
      total,
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.account.count({ where: { id } });
    return count > 0;
  }
}

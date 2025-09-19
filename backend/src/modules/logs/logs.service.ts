import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log, LogType, LogStatus } from '../../entities/log.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async findAll(type?: LogType, status?: LogStatus): Promise<Log[]> {
    const query = this.logRepository.createQueryBuilder('log');

    if (type) {
      query.where('log.type = :type', { type });
    }

    if (status) {
      query.andWhere('log.status = :status', { status });
    }

    return query.orderBy('log.createdAt', 'DESC').getMany();
  }

  async getStats() {
    const [total, success, failed, running] = await Promise.all([
      this.logRepository.count(),
      this.logRepository.count({ where: { status: LogStatus.SUCCESS } }),
      this.logRepository.count({ where: { status: LogStatus.FAILED } }),
      this.logRepository.count({ where: { status: LogStatus.RUNNING } }),
    ]);

    return {
      total,
      success,
      failed,
      running,
    };
  }

  async createLog(
    type: LogType,
    action: string,
    message?: string,
    details?: string,
  ): Promise<Log> {
    const log = this.logRepository.create({
      type,
      action,
      message,
      details,
      status: LogStatus.PENDING,
      startedAt: new Date(),
    });

    return await this.logRepository.save(log);
  }

  async updateLogStatus(
    id: string,
    status: LogStatus,
    message?: string,
    details?: string,
  ): Promise<void> {
    const log = await this.logRepository.findOne({ where: { id } });
    if (log) {
      log.status = status;
      if (message) log.message = message;
      if (details) log.details = details;

      if (status === LogStatus.SUCCESS || status === LogStatus.FAILED) {
        log.completedAt = new Date();
        if (log.startedAt) {
          log.duration = log.completedAt.getTime() - log.startedAt.getTime();
        }
      }

      await this.logRepository.save(log);
    }
  }

  async clearLogs(): Promise<{ success: boolean; message: string }> {
    try {
      await this.logRepository.clear();
      return {
        success: true,
        message: 'Logs limpos com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao limpar logs: ${error.message}`,
      };
    }
  }

  async getRecentLogs(limit: number = 10): Promise<Log[]> {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async exportLogs(type?: LogType, status?: LogStatus): Promise<string> {
    const logs = await this.findAll(type, status);

    // CSV header
    const header = [
      'ID',
      'Tipo',
      'Status',
      'Ação',
      'Mensagem',
      'Detalhes',
      'Duração (ms)',
      'Iniciado em',
      'Concluído em',
      'Criado em',
    ].join(',');

    // CSV rows
    const rows = logs.map(log => [
      `"${log.id}"`,
      `"${log.type}"`,
      `"${log.status}"`,
      `"${log.action?.replace(/"/g, '""') || ''}"`,
      `"${log.message?.replace(/"/g, '""') || ''}"`,
      `"${log.details?.replace(/"/g, '""') || ''}"`,
      log.duration || '',
      log.startedAt ? `"${log.startedAt.toISOString()}"` : '',
      log.completedAt ? `"${log.completedAt.toISOString()}"` : '',
      `"${log.createdAt.toISOString()}"`,
    ].join(','));

    return [header, ...rows].join('\n');
  }
}
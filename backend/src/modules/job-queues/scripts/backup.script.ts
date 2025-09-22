import { ScriptExecutionContext, JobExecutionResult } from '../types/job-queue.types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Script de Backup Automático
 * Realiza backup completo do sistema:
 * - Backup do banco PostgreSQL
 * - Backup de configurações (Nginx, Traefik)
 * - Backup de certificados SSL
 * - Rotação de backups antigos
 * - Notificações de status
 */

interface BackupResult {
  database: {
    success: boolean;
    file?: string;
    size?: number;
    error?: string;
  };
  configs: {
    success: boolean;
    files?: string[];
    error?: string;
  };
  ssl: {
    success: boolean;
    files?: string[];
    error?: string;
  };
  cleanup: {
    success: boolean;
    removed?: number;
    error?: string;
  };
  totalSize: number;
  duration: number;
}

export default async function(context: ScriptExecutionContext): Promise<JobExecutionResult> {
  const startTime = Date.now();
  let output = '';

  try {
    output += '🔄 Iniciando backup automático do sistema...\n\n';

    // Configurações do backup
    const backupDir = context.environmentVars?.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const retentionDays = parseInt(context.environmentVars?.RETENTION_DAYS || '7');
    const compress = context.environmentVars?.COMPRESS !== 'false';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);

    // Garantir que diretório de backup existe
    await fs.mkdir(backupPath, { recursive: true });
    output += `📁 Diretório de backup: ${backupPath}\n\n`;

    const result: BackupResult = {
      database: { success: false },
      configs: { success: false },
      ssl: { success: false },
      cleanup: { success: false },
      totalSize: 0,
      duration: 0,
    };

    // 1. Backup do banco PostgreSQL
    output += '1️⃣ Realizando backup do banco PostgreSQL...\n';
    try {
      const dbBackup = await backupDatabase(backupPath, context.environmentVars);
      result.database = dbBackup;

      if (dbBackup.success) {
        output += `✅ Backup do banco concluído: ${dbBackup.file} (${formatBytes(dbBackup.size || 0)})\n`;
      } else {
        output += `❌ Falha no backup do banco: ${dbBackup.error}\n`;
      }
    } catch (error) {
      result.database = { success: false, error: error.message };
      output += `❌ Erro no backup do banco: ${error.message}\n`;
    }
    output += '\n';

    // 2. Backup das configurações
    output += '2️⃣ Realizando backup das configurações...\n';
    try {
      const configBackup = await backupConfigurations(backupPath);
      result.configs = configBackup;

      if (configBackup.success) {
        output += `✅ Backup de configurações concluído: ${configBackup.files?.length} arquivos\n`;
      } else {
        output += `❌ Falha no backup de configurações: ${configBackup.error}\n`;
      }
    } catch (error) {
      result.configs = { success: false, error: error.message };
      output += `❌ Erro no backup de configurações: ${error.message}\n`;
    }
    output += '\n';

    // 3. Backup dos certificados SSL
    output += '3️⃣ Realizando backup dos certificados SSL...\n';
    try {
      const sslBackup = await backupSSLCertificates(backupPath);
      result.ssl = sslBackup;

      if (sslBackup.success) {
        output += `✅ Backup de certificados SSL concluído: ${sslBackup.files?.length} arquivos\n`;
      } else {
        output += `❌ Falha no backup de SSL: ${sslBackup.error}\n`;
      }
    } catch (error) {
      result.ssl = { success: false, error: error.message };
      output += `❌ Erro no backup de SSL: ${error.message}\n`;
    }
    output += '\n';

    // 4. Compactar backup se solicitado
    if (compress) {
      output += '📦 Compactando backup...\n';
      try {
        await compressBackup(backupPath);
        output += '✅ Backup compactado com sucesso\n\n';
      } catch (error) {
        output += `⚠️ Falha na compactação: ${error.message}\n\n`;
      }
    }

    // 5. Calcular tamanho total
    try {
      result.totalSize = await calculateDirectorySize(backupPath);
      output += `📊 Tamanho total do backup: ${formatBytes(result.totalSize)}\n\n`;
    } catch (error) {
      output += `⚠️ Não foi possível calcular tamanho do backup\n\n`;
    }

    // 6. Limpeza de backups antigos
    output += '4️⃣ Removendo backups antigos...\n';
    try {
      const cleanup = await cleanupOldBackups(backupDir, retentionDays);
      result.cleanup = cleanup;

      if (cleanup.success) {
        output += `✅ Limpeza concluída: ${cleanup.removed} backups removidos\n`;
      } else {
        output += `❌ Falha na limpeza: ${cleanup.error}\n`;
      }
    } catch (error) {
      result.cleanup = { success: false, error: error.message };
      output += `❌ Erro na limpeza: ${error.message}\n`;
    }
    output += '\n';

    // 7. Resumo final
    result.duration = Date.now() - startTime;
    output += generateBackupSummary(result);

    const success = result.database.success || result.configs.success || result.ssl.success;

    return {
      success,
      output,
      executionTimeMs: result.duration,
      metadata: result,
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro geral no backup: ${error.message}`,
      output: output + `\n❌ Erro crítico: ${error.message}`,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

async function backupDatabase(backupPath: string, envVars: Record<string, string> = {}): Promise<BackupResult['database']> {
  return new Promise((resolve) => {
    const dbHost = envVars.DB_HOST || 'localhost';
    const dbPort = envVars.DB_PORT || '5432';
    const dbName = envVars.DB_NAME || 'netpilot';
    const dbUser = envVars.DB_USER || 'postgres';
    const dbPassword = envVars.DB_PASSWORD || '';

    const backupFile = path.join(backupPath, `database-${Date.now()}.sql`);

    const pgDump = spawn('pg_dump', [
      `-h${dbHost}`,
      `-p${dbPort}`,
      `-U${dbUser}`,
      `-d${dbName}`,
      '--no-password',
      '--verbose',
      '--format=custom',
      '--compress=9',
      `--file=${backupFile}`
    ], {
      env: {
        ...process.env,
        PGPASSWORD: dbPassword,
      }
    });

    let error = '';

    pgDump.stderr.on('data', (data) => {
      error += data.toString();
    });

    pgDump.on('close', async (code) => {
      if (code === 0) {
        try {
          const stats = await fs.stat(backupFile);
          resolve({
            success: true,
            file: backupFile,
            size: stats.size,
          });
        } catch (err) {
          resolve({
            success: false,
            error: `Backup criado mas erro ao verificar arquivo: ${err.message}`,
          });
        }
      } else {
        resolve({
          success: false,
          error: `pg_dump falhou com código ${code}: ${error}`,
        });
      }
    });

    pgDump.on('error', (err) => {
      resolve({
        success: false,
        error: `Erro ao executar pg_dump: ${err.message}`,
      });
    });
  });
}

async function backupConfigurations(backupPath: string): Promise<BackupResult['configs']> {
  try {
    const configPaths = [
      'configs/nginx',
      'configs/traefik',
      'configs/ssl',
      '.env',
      'docker-compose.yml',
      'docker-compose.override.yml',
    ];

    const configBackupPath = path.join(backupPath, 'configurations');
    await fs.mkdir(configBackupPath, { recursive: true });

    const backedUpFiles: string[] = [];

    for (const configPath of configPaths) {
      try {
        const sourcePath = path.resolve(configPath);
        const targetPath = path.join(configBackupPath, path.basename(configPath));

        // Verificar se arquivo/diretório existe
        try {
          await fs.access(sourcePath);
        } catch {
          continue; // Pular se não existir
        }

        const stats = await fs.stat(sourcePath);

        if (stats.isDirectory()) {
          await copyDirectory(sourcePath, targetPath);
        } else {
          await fs.copyFile(sourcePath, targetPath);
        }

        backedUpFiles.push(targetPath);
      } catch (error) {
        // Continuar mesmo se um arquivo específico falhar
        console.warn(`Falha ao copiar ${configPath}: ${error.message}`);
      }
    }

    return {
      success: backedUpFiles.length > 0,
      files: backedUpFiles,
      error: backedUpFiles.length === 0 ? 'Nenhum arquivo de configuração encontrado' : undefined,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function backupSSLCertificates(backupPath: string): Promise<BackupResult['ssl']> {
  try {
    const sslPaths = [
      'data/ssl',
      'data/letsencrypt',
      'configs/ssl',
    ];

    const sslBackupPath = path.join(backupPath, 'ssl-certificates');
    await fs.mkdir(sslBackupPath, { recursive: true });

    const backedUpFiles: string[] = [];

    for (const sslPath of sslPaths) {
      try {
        const sourcePath = path.resolve(sslPath);

        // Verificar se diretório existe
        try {
          await fs.access(sourcePath);
        } catch {
          continue; // Pular se não existir
        }

        const targetPath = path.join(sslBackupPath, path.basename(sslPath));
        await copyDirectory(sourcePath, targetPath);
        backedUpFiles.push(targetPath);

      } catch (error) {
        // Continuar mesmo se um diretório específico falhar
        console.warn(`Falha ao copiar ${sslPath}: ${error.message}`);
      }
    }

    return {
      success: backedUpFiles.length > 0,
      files: backedUpFiles,
      error: backedUpFiles.length === 0 ? 'Nenhum certificado SSL encontrado' : undefined,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function copyDirectory(source: string, target: string): Promise<void> {
  await fs.mkdir(target, { recursive: true });

  const items = await fs.readdir(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    const stats = await fs.stat(sourcePath);

    if (stats.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function compressBackup(backupPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tarFile = `${backupPath}.tar.gz`;
    const tar = spawn('tar', [
      '-czf',
      tarFile,
      '-C',
      path.dirname(backupPath),
      path.basename(backupPath)
    ]);

    tar.on('close', (code) => {
      if (code === 0) {
        // Remover diretório original após compactação bem-sucedida
        fs.rm(backupPath, { recursive: true, force: true })
          .then(() => resolve())
          .catch(reject);
      } else {
        reject(new Error(`Falha na compactação com código ${code}`));
      }
    });

    tar.on('error', reject);
  });
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        totalSize += await calculateDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Se houver erro ao acessar um item, continuar com o resto
  }

  return totalSize;
}

async function cleanupOldBackups(backupDir: string, retentionDays: number): Promise<BackupResult['cleanup']> {
  try {
    const items = await fs.readdir(backupDir);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    let removedCount = 0;

    for (const item of items) {
      const itemPath = path.join(backupDir, item);

      try {
        const stats = await fs.stat(itemPath);

        if (stats.mtime < cutoffDate) {
          if (stats.isDirectory()) {
            await fs.rm(itemPath, { recursive: true, force: true });
          } else {
            await fs.unlink(itemPath);
          }
          removedCount++;
        }
      } catch (error) {
        // Continuar mesmo se não conseguir remover um item específico
        console.warn(`Falha ao remover ${itemPath}: ${error.message}`);
      }
    }

    return {
      success: true,
      removed: removedCount,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateBackupSummary(result: BackupResult): string {
  let summary = '📋 RESUMO DO BACKUP:\n\n';

  // Status geral
  const totalSuccess = [result.database.success, result.configs.success, result.ssl.success].filter(Boolean).length;
  const totalTasks = 3;

  summary += `🎯 Status Geral: ${totalSuccess}/${totalTasks} tarefas concluídas com sucesso\n`;
  summary += `⏱️ Tempo Total: ${Math.round(result.duration / 1000)}s\n`;
  summary += `💾 Tamanho Total: ${formatBytes(result.totalSize)}\n\n`;

  // Detalhes por componente
  summary += '📊 Detalhes por Componente:\n\n';

  summary += `🗄️ Banco de Dados: ${result.database.success ? '✅' : '❌'}\n`;
  if (result.database.success && result.database.size) {
    summary += `   Arquivo: ${path.basename(result.database.file || '')}\n`;
    summary += `   Tamanho: ${formatBytes(result.database.size)}\n`;
  }
  if (!result.database.success && result.database.error) {
    summary += `   Erro: ${result.database.error}\n`;
  }
  summary += '\n';

  summary += `⚙️ Configurações: ${result.configs.success ? '✅' : '❌'}\n`;
  if (result.configs.success && result.configs.files) {
    summary += `   Arquivos: ${result.configs.files.length}\n`;
  }
  if (!result.configs.success && result.configs.error) {
    summary += `   Erro: ${result.configs.error}\n`;
  }
  summary += '\n';

  summary += `🔒 Certificados SSL: ${result.ssl.success ? '✅' : '❌'}\n`;
  if (result.ssl.success && result.ssl.files) {
    summary += `   Diretórios: ${result.ssl.files.length}\n`;
  }
  if (!result.ssl.success && result.ssl.error) {
    summary += `   Erro: ${result.ssl.error}\n`;
  }
  summary += '\n';

  summary += `🧹 Limpeza: ${result.cleanup.success ? '✅' : '❌'}\n`;
  if (result.cleanup.success) {
    summary += `   Backups removidos: ${result.cleanup.removed}\n`;
  }
  if (!result.cleanup.success && result.cleanup.error) {
    summary += `   Erro: ${result.cleanup.error}\n`;
  }

  summary += '\n✅ Backup automático concluído!\n';

  return summary;
}
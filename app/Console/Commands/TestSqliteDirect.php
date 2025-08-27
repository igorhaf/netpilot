<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestSqliteDirect extends Command
{
    protected $signature = 'sqlite:test-delete';
    protected $description = 'Test SQLite delete directly';

    public function handle()
    {
        $this->info("🔍 Testando exclusão diretamente no SQLite");
        
        try {
            // Verificar se conseguimos conectar
            $this->info("📡 Testando conexão com SQLite...");
            $pdo = DB::connection()->getPdo();
            $this->info("✅ Conexão SQLite OK");
            
            // Verificar tabelas
            $this->info("📋 Verificando tabelas...");
            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
            $this->line("Tabelas: " . implode(', ', $tables));
            
            // Verificar estrutura da tabela proxy_rules
            $this->info("🔍 Verificando estrutura de proxy_rules...");
            $columns = $pdo->query("PRAGMA table_info(proxy_rules)")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($columns as $col) {
                $this->line("  - {$col['name']}: {$col['type']} " . ($col['notnull'] ? 'NOT NULL' : 'NULLABLE'));
            }
            
            // Verificar foreign keys
            $this->info("🔗 Verificando foreign keys...");
            $foreignKeys = $pdo->query("PRAGMA foreign_key_list(proxy_rules)")->fetchAll(PDO::FETCH_ASSOC);
            if (empty($foreignKeys)) {
                $this->warn("⚠️ Nenhuma foreign key encontrada");
            } else {
                foreach ($foreignKeys as $fk) {
                    $this->line("  - FK {$fk['id']}: {$fk['from']} -> {$fk['table']}.{$fk['to']}");
                    $this->line("    onDelete: {$fk['on_delete']}, onUpdate: {$fk['on_update']}");
                }
            }
            
            // Verificar triggers
            $this->info("⚡ Verificando triggers...");
            $triggers = $pdo->query("SELECT name, sql FROM sqlite_master WHERE type='trigger'")->fetchAll(PDO::FETCH_ASSOC);
            if (empty($triggers)) {
                $this->info("✅ Nenhum trigger encontrado");
            } else {
                foreach ($triggers as $trigger) {
                    $this->line("  - Trigger: {$trigger['name']}");
                    $this->line("    SQL: {$trigger['sql']}");
                }
            }
            
            // Verificar dados atuais
            $this->info("📊 Verificando dados atuais...");
            $count = $pdo->query("SELECT COUNT(*) FROM proxy_rules")->fetchColumn();
            $this->line("Total proxies: {$count}");
            
            if ($count > 0) {
                $first = $pdo->query("SELECT * FROM proxy_rules LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                $this->line("Primeiro proxy: ID {$first['id']}, Host: {$first['source_host']}");
                
                // Tentar exclusão direta
                $this->info("🗑️ Tentando exclusão direta via SQL...");
                $stmt = $pdo->prepare("DELETE FROM proxy_rules WHERE id = ?");
                $result = $stmt->execute([$first['id']]);
                $this->line("DELETE executado: " . ($result ? 'SUCESSO' : 'FALHA'));
                
                // Verificar se foi deletado
                $stillExists = $pdo->query("SELECT COUNT(*) FROM proxy_rules WHERE id = {$first['id']}")->fetchColumn();
                $this->line("Ainda existe: " . ($stillExists > 0 ? 'SIM' : 'NÃO'));
                
                // Verificar total
                $newCount = $pdo->query("SELECT COUNT(*) FROM proxy_rules")->fetchColumn();
                $this->line("Total depois: {$newCount}");
                
                if ($stillExists == 0) {
                    $this->info("🎉 Exclusão funcionou!");
                    
                    // Recriar para não perder dados
                    $this->info("🔄 Recriando proxy...");
                    $stmt = $pdo->prepare("INSERT INTO proxy_rules (domain_id, source_host, source_port, target_host, target_port, protocol, priority, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))");
                    $stmt->execute([
                        $first['domain_id'],
                        $first['source_host'],
                        $first['source_port'],
                        $first['target_host'],
                        $first['target_port'],
                        $first['protocol'],
                        $first['priority'],
                        $first['is_active']
                    ]);
                    $this->info("✅ Proxy recriado");
                } else {
                    $this->error("❌ Exclusão falhou mesmo via SQL direto!");
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Erro: " . $e->getMessage());
            $this->error("Arquivo: " . $e->getFile() . " linha " . $e->getLine());
        }
        
        return 0;
    }
}

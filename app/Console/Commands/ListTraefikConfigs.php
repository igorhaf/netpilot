<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ListTraefikConfigs extends Command
{
    protected $signature = 'traefik:list-configs';
    protected $description = 'Lista os arquivos de configuração do Traefik';

    public function handle()
    {
        $this->info('📁 Listando arquivos de configuração do Traefik...');
        
        try {
            // Verificar se o diretório existe
            if (!Storage::exists('traefik')) {
                $this->warn('⚠️  Diretório traefik não encontrado.');
                return 0;
            }
            
            // Listar arquivos
            $files = Storage::files('traefik');
            
            if (empty($files)) {
                $this->info('📂 Diretório traefik está vazio.');
                return 0;
            }
            
            $this->info('📂 Arquivos encontrados:');
            $this->line('');
            
            foreach ($files as $file) {
                $size = Storage::size($file);
                $modified = Storage::lastModified($file);
                $path = Storage::path($file);
                
                $this->line("📄 {$file}");
                $this->line("   📏 Tamanho: {$size} bytes");
                $this->line("   🕒 Modificado: " . date('Y-m-d H:i:s', $modified));
                $this->line("   📍 Caminho: {$path}");
                $this->line('');
            }
            
            // Mostrar conteúdo do arquivo principal se existir
            if (Storage::exists('traefik/netpilot-proxy.yml')) {
                $this->info('📋 Conteúdo do arquivo netpilot-proxy.yml:');
                $this->line('─' . str_repeat('─', 50));
                $content = Storage::get('traefik/netpilot-proxy.yml');
                $this->line($content);
                $this->line('─' . str_repeat('─', 50));
            }
            
        } catch (\Exception $e) {
            $this->error('💥 Erro ao listar configurações: ' . $e->getMessage());
        }
        
        return 0;
    }
}

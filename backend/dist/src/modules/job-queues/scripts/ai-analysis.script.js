"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAnalysisScript = void 0;
exports.default = default_1;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const log_entity_1 = require("../../../entities/log.entity");
const fs = require("fs/promises");
const path = require("path");
let AIAnalysisScript = class AIAnalysisScript {
    constructor(logRepository) {
        this.logRepository = logRepository;
    }
    async execute(context) {
        const startTime = Date.now();
        let output = '';
        try {
            output += 'Iniciando análise por IA dos logs do sistema...\n';
            const hoursBack = parseInt(context.environmentVars?.HOURS_BACK || '24');
            const minOccurrences = parseInt(context.environmentVars?.MIN_OCCURRENCES || '3');
            const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
            const logs = await this.logRepository.find({
                where: {
                    createdAt: {
                        $gte: since,
                    },
                },
                order: { createdAt: 'DESC' },
                take: 10000,
            });
            output += `Analisando ${logs.length} logs das últimas ${hoursBack} horas...\n`;
            const analysis = await this.performAIAnalysis(logs, minOccurrences);
            const report = this.generateReport(analysis);
            output += report;
            const reportPath = await this.saveDetailedReport(analysis);
            output += `\nRelatório detalhado salvo em: ${reportPath}\n`;
            return {
                success: true,
                output,
                executionTimeMs: Date.now() - startTime,
                metadata: {
                    analysis,
                    reportPath,
                    logsAnalyzed: logs.length,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Erro na análise por IA: ${error.message}`,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    async performAIAnalysis(logs, minOccurrences) {
        const findings = [];
        findings.push(...this.analyzeSecurityThreats(logs, minOccurrences));
        findings.push(...this.analyzePerformanceIssues(logs, minOccurrences));
        findings.push(...this.analyzeErrors(logs, minOccurrences));
        findings.push(...this.analyzeOptimizations(logs, minOccurrences));
        const summary = {
            totalLogs: logs.length,
            criticalIssues: findings.filter(f => f.severity === 'critical').length,
            warnings: findings.filter(f => f.severity === 'high' || f.severity === 'medium').length,
            suggestions: findings.filter(f => f.type === 'optimization').length,
        };
        const recommendations = this.generateRecommendations(findings);
        return { summary, findings, recommendations };
    }
    analyzeSecurityThreats(logs, minOccurrences) {
        const findings = [];
        const loginFailures = logs.filter(log => log.message.includes('login failed') ||
            log.message.includes('authentication failed'));
        if (loginFailures.length >= minOccurrences) {
            findings.push({
                type: 'security',
                severity: 'high',
                title: 'Possível Ataque de Força Bruta',
                description: `Detectadas ${loginFailures.length} tentativas de login falhadas`,
                count: loginFailures.length,
                examples: loginFailures.slice(0, 3).map(log => log.message),
                recommendation: 'Implementar rate limiting e bloqueio temporário de IPs suspeitos',
            });
        }
        const portScans = logs.filter(log => log.message.includes('connection refused') ||
            log.message.includes('port scan'));
        if (portScans.length >= minOccurrences) {
            findings.push({
                type: 'security',
                severity: 'medium',
                title: 'Possível Varredura de Portas',
                description: `Detectadas ${portScans.length} tentativas de conexão em portas fechadas`,
                count: portScans.length,
                examples: portScans.slice(0, 3).map(log => log.message),
                recommendation: 'Configurar firewall para bloquear varreduras e monitorar IPs suspeitos',
            });
        }
        const sqlInjections = logs.filter(log => log.message.toLowerCase().includes('select') &&
            log.message.toLowerCase().includes('union') ||
            log.message.includes('\'') && log.message.includes('--'));
        if (sqlInjections.length >= minOccurrences) {
            findings.push({
                type: 'security',
                severity: 'critical',
                title: 'Tentativas de Injeção SQL',
                description: `Detectadas ${sqlInjections.length} possíveis tentativas de injeção SQL`,
                count: sqlInjections.length,
                examples: sqlInjections.slice(0, 3).map(log => log.message),
                recommendation: 'Revisar validação de entrada e usar prepared statements',
            });
        }
        return findings;
    }
    analyzePerformanceIssues(logs, minOccurrences) {
        const findings = [];
        const slowRequests = logs.filter(log => log.message.includes('slow query') ||
            (log.responseTime && log.responseTime > 5000));
        if (slowRequests.length >= minOccurrences) {
            findings.push({
                type: 'performance',
                severity: 'medium',
                title: 'Requisições Lentas Detectadas',
                description: `${slowRequests.length} requisições com tempo de resposta elevado`,
                count: slowRequests.length,
                examples: slowRequests.slice(0, 3).map(log => log.message),
                recommendation: 'Otimizar queries do banco de dados e adicionar cache',
            });
        }
        const highResourceUsage = logs.filter(log => log.message.includes('high cpu') ||
            log.message.includes('memory usage') ||
            log.message.includes('out of memory'));
        if (highResourceUsage.length >= minOccurrences) {
            findings.push({
                type: 'performance',
                severity: 'high',
                title: 'Alto Uso de Recursos',
                description: `${highResourceUsage.length} alertas de alto uso de CPU/Memória`,
                count: highResourceUsage.length,
                examples: highResourceUsage.slice(0, 3).map(log => log.message),
                recommendation: 'Investigar processos que consomem mais recursos e otimizar',
            });
        }
        return findings;
    }
    analyzeErrors(logs, minOccurrences) {
        const findings = [];
        const errorGroups = new Map();
        logs.filter(log => log.level === 'error').forEach(log => {
            const errorType = this.extractErrorType(log.message);
            if (!errorGroups.has(errorType)) {
                errorGroups.set(errorType, []);
            }
            errorGroups.get(errorType).push(log);
        });
        errorGroups.forEach((errorLogs, errorType) => {
            if (errorLogs.length >= minOccurrences) {
                const severity = errorLogs.length > 10 ? 'high' : 'medium';
                findings.push({
                    type: 'error',
                    severity,
                    title: `Erro Recorrente: ${errorType}`,
                    description: `${errorLogs.length} ocorrências do mesmo tipo de erro`,
                    count: errorLogs.length,
                    examples: errorLogs.slice(0, 3).map(log => log.message),
                    recommendation: 'Investigar causa raiz e implementar correção',
                });
            }
        });
        return findings;
    }
    analyzeOptimizations(logs, minOccurrences) {
        const findings = [];
        const cacheableRequests = logs.filter(log => log.method === 'GET' &&
            log.path &&
            !log.path.includes('/api/') &&
            log.responseTime > 1000);
        if (cacheableRequests.length >= minOccurrences) {
            findings.push({
                type: 'optimization',
                severity: 'low',
                title: 'Oportunidade de Cache',
                description: `${cacheableRequests.length} requisições GET lentas que poderiam ser cacheadas`,
                count: cacheableRequests.length,
                examples: cacheableRequests.slice(0, 3).map(log => `${log.method} ${log.path}`),
                recommendation: 'Implementar cache para requisições GET frequentes',
            });
        }
        const allEndpoints = new Set(logs.map(log => log.path).filter(Boolean));
        const lowUsageEndpoints = Array.from(allEndpoints).filter(endpoint => {
            const usage = logs.filter(log => log.path === endpoint).length;
            return usage < minOccurrences;
        });
        if (lowUsageEndpoints.length > 0) {
            findings.push({
                type: 'optimization',
                severity: 'low',
                title: 'Endpoints com Baixo Uso',
                description: `${lowUsageEndpoints.length} endpoints com menos de ${minOccurrences} acessos`,
                count: lowUsageEndpoints.length,
                examples: lowUsageEndpoints.slice(0, 3),
                recommendation: 'Considerar remover ou otimizar endpoints pouco utilizados',
            });
        }
        return findings;
    }
    extractErrorType(message) {
        if (message.includes('Database'))
            return 'Database Error';
        if (message.includes('Network'))
            return 'Network Error';
        if (message.includes('Permission'))
            return 'Permission Error';
        if (message.includes('Timeout'))
            return 'Timeout Error';
        if (message.includes('Memory'))
            return 'Memory Error';
        if (message.includes('File'))
            return 'File System Error';
        const exceptionMatch = message.match(/(\w+Exception|\w+Error):/);
        if (exceptionMatch) {
            return exceptionMatch[1];
        }
        return 'Generic Error';
    }
    generateRecommendations(findings) {
        const recommendations = new Set();
        findings.forEach(finding => {
            recommendations.add(finding.recommendation);
        });
        const securityFindings = findings.filter(f => f.type === 'security');
        const performanceFindings = findings.filter(f => f.type === 'performance');
        const errorFindings = findings.filter(f => f.type === 'error');
        if (securityFindings.length > 0) {
            recommendations.add('Implementar monitoramento de segurança 24/7');
            recommendations.add('Configurar alertas automáticos para atividades suspeitas');
        }
        if (performanceFindings.length > 0) {
            recommendations.add('Implementar monitoring de performance em tempo real');
            recommendations.add('Configurar auto-scaling baseado em métricas');
        }
        if (errorFindings.length > 0) {
            recommendations.add('Implementar logging estruturado para melhor análise');
            recommendations.add('Configurar alertas automáticos para erros críticos');
        }
        return Array.from(recommendations);
    }
    generateReport(analysis) {
        let report = '\n=== RELATÓRIO DE ANÁLISE POR IA ===\n\n';
        report += `📊 RESUMO:\n`;
        report += `- Total de logs analisados: ${analysis.summary.totalLogs}\n`;
        report += `- Problemas críticos: ${analysis.summary.criticalIssues}\n`;
        report += `- Avisos: ${analysis.summary.warnings}\n`;
        report += `- Sugestões de otimização: ${analysis.summary.suggestions}\n\n`;
        if (analysis.findings.length > 0) {
            report += `🔍 ACHADOS PRINCIPAIS:\n\n`;
            const sortedFindings = analysis.findings.sort((a, b) => {
                const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });
            sortedFindings.forEach((finding, index) => {
                const icon = {
                    'security': '🔒',
                    'performance': '⚡',
                    'error': '❌',
                    'optimization': '🚀'
                }[finding.type];
                const severityIcon = {
                    'critical': '🚨',
                    'high': '⚠️',
                    'medium': '⚡',
                    'low': '💡'
                }[finding.severity];
                report += `${index + 1}. ${icon} ${finding.title} ${severityIcon}\n`;
                report += `   ${finding.description}\n`;
                report += `   Recomendação: ${finding.recommendation}\n\n`;
            });
        }
        if (analysis.recommendations.length > 0) {
            report += `💡 RECOMENDAÇÕES GERAIS:\n\n`;
            analysis.recommendations.forEach((rec, index) => {
                report += `${index + 1}. ${rec}\n`;
            });
            report += '\n';
        }
        report += `✅ Análise concluída em ${new Date().toISOString()}\n`;
        return report;
    }
    async saveDetailedReport(analysis) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(process.cwd(), 'storage', 'reports', `ai-analysis-${timestamp}.json`);
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));
        return reportPath;
    }
};
exports.AIAnalysisScript = AIAnalysisScript;
exports.AIAnalysisScript = AIAnalysisScript = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AIAnalysisScript);
async function default_1(context) {
    if (!context.execution) {
        return {
            success: false,
            error: 'Contexto de execução não disponível',
            executionTimeMs: 0,
        };
    }
    const mockLogs = [
        { message: 'login failed for user admin', level: 'error', createdAt: new Date() },
        { message: 'slow query detected: SELECT * FROM large_table', level: 'warn', createdAt: new Date() },
        { message: 'connection refused on port 22', level: 'info', createdAt: new Date() },
    ];
    const mockAnalysis = {
        summary: {
            totalLogs: mockLogs.length,
            criticalIssues: 0,
            warnings: 1,
            suggestions: 1,
        },
        findings: [
            {
                type: 'performance',
                severity: 'medium',
                title: 'Query Lenta Detectada',
                description: 'Query SELECT demorou mais que o esperado',
                count: 1,
                examples: ['slow query detected'],
                recommendation: 'Otimizar índices da tabela large_table',
            }
        ],
        recommendations: [
            'Implementar monitoring de performance em tempo real',
            'Configurar alertas para queries lentas',
        ],
    };
    const output = `
=== ANÁLISE POR IA (MODO DEMONSTRAÇÃO) ===

📊 RESUMO:
- Total de logs analisados: ${mockAnalysis.summary.totalLogs}
- Problemas críticos: ${mockAnalysis.summary.criticalIssues}
- Avisos: ${mockAnalysis.summary.warnings}
- Sugestões de otimização: ${mockAnalysis.summary.suggestions}

🔍 ACHADOS PRINCIPAIS:
1. ⚡ Query Lenta Detectada ⚡
   Query SELECT demorou mais que o esperado
   Recomendação: Otimizar índices da tabela large_table

💡 RECOMENDAÇÕES GERAIS:
1. Implementar monitoring de performance em tempo real
2. Configurar alertas para queries lentas

✅ Análise concluída (modo demonstração)
  `;
    return {
        success: true,
        output,
        executionTimeMs: 1500,
        metadata: mockAnalysis,
    };
}
//# sourceMappingURL=ai-analysis.script.js.map
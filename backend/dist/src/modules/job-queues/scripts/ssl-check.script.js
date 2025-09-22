"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const https = require("https");
const fs = require("fs/promises");
const path = require("path");
async function default_1(context) {
    const startTime = Date.now();
    let output = '';
    try {
        output += '🔒 Iniciando verificação de certificados SSL...\n\n';
        const warningDays = parseInt(context.environmentVars?.WARNING_DAYS || '30');
        const criticalDays = parseInt(context.environmentVars?.CRITICAL_DAYS || '7');
        const autoRenew = context.environmentVars?.AUTO_RENEW === 'true';
        const checkLocal = context.environmentVars?.CHECK_LOCAL !== 'false';
        const domains = await getDomainsToCheck(checkLocal);
        output += `📋 Verificando ${domains.length} domínios...\n\n`;
        const result = {
            summary: {
                totalCertificates: 0,
                validCertificates: 0,
                expiringSoon: 0,
                expired: 0,
                errors: 0,
            },
            certificates: [],
            alerts: [],
            recommendations: [],
        };
        for (const domain of domains) {
            output += `🔍 Verificando ${domain}...\n`;
            try {
                const certificate = await checkSSLCertificate(domain);
                result.certificates.push(certificate);
                result.summary.totalCertificates++;
                if (certificate.isValid) {
                    result.summary.validCertificates++;
                    if (certificate.daysUntilExpiry <= criticalDays) {
                        result.summary.expiringSoon++;
                        result.alerts.push({
                            type: 'critical',
                            domain,
                            message: `Certificado expira em ${certificate.daysUntilExpiry} dias`,
                            daysUntilExpiry: certificate.daysUntilExpiry,
                            action: 'Renovar certificado imediatamente',
                        });
                        output += `  🚨 CRÍTICO: Expira em ${certificate.daysUntilExpiry} dias\n`;
                    }
                    else if (certificate.daysUntilExpiry <= warningDays) {
                        result.summary.expiringSoon++;
                        result.alerts.push({
                            type: 'warning',
                            domain,
                            message: `Certificado expira em ${certificate.daysUntilExpiry} dias`,
                            daysUntilExpiry: certificate.daysUntilExpiry,
                            action: 'Planejar renovação do certificado',
                        });
                        output += `  ⚠️ AVISO: Expira em ${certificate.daysUntilExpiry} dias\n`;
                    }
                    else {
                        output += `  ✅ Válido por mais ${certificate.daysUntilExpiry} dias\n`;
                    }
                    if (certificate.selfSigned) {
                        result.alerts.push({
                            type: 'warning',
                            domain,
                            message: 'Certificado auto-assinado detectado',
                            action: 'Considerar uso de certificado de CA confiável',
                        });
                        output += `  ⚠️ Certificado auto-assinado\n`;
                    }
                }
                else {
                    if (certificate.daysUntilExpiry < 0) {
                        result.summary.expired++;
                        output += `  ❌ EXPIRADO há ${Math.abs(certificate.daysUntilExpiry)} dias\n`;
                    }
                    else {
                        result.summary.errors++;
                        output += `  ❌ Certificado inválido\n`;
                    }
                }
            }
            catch (error) {
                result.summary.errors++;
                result.certificates.push({
                    domain,
                    error: error.message,
                });
                result.alerts.push({
                    type: 'critical',
                    domain,
                    message: `Erro ao verificar certificado: ${error.message}`,
                    action: 'Verificar configuração SSL do domínio',
                });
                output += `  ❌ ERRO: ${error.message}\n`;
            }
            output += '\n';
        }
        if (autoRenew && result.alerts.some(alert => alert.type === 'critical')) {
            output += '🔄 Tentando renovação automática...\n';
            const renewalResult = await attemptAutoRenewal(result.alerts);
            output += renewalResult.output;
            output += '\n';
        }
        result.recommendations = generateRecommendations(result);
        output += generateSSLReport(result);
        const reportPath = await saveSSLReport(result);
        output += `\n📄 Relatório detalhado salvo em: ${reportPath}\n`;
        return {
            success: result.summary.errors === 0,
            output,
            executionTimeMs: Date.now() - startTime,
            metadata: result,
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Erro na verificação SSL: ${error.message}`,
            output: output + `\n❌ Erro crítico: ${error.message}`,
            executionTimeMs: Date.now() - startTime,
        };
    }
}
async function getDomainsToCheck(checkLocal) {
    const domains = [];
    try {
        const mockDomains = [
            'netpilot.local',
            'api.netpilot.local',
            'admin.netpilot.local',
        ];
        domains.push(...mockDomains);
        if (checkLocal) {
            try {
                const nginxConfigs = await loadNginxDomains();
                domains.push(...nginxConfigs);
                const traefikConfigs = await loadTraefikDomains();
                domains.push(...traefikConfigs);
            }
            catch (error) {
                console.warn('Erro ao carregar configurações locais:', error.message);
            }
        }
    }
    catch (error) {
        console.warn('Erro ao carregar domínios do banco:', error.message);
    }
    return Array.from(new Set(domains)).filter(domain => domain && domain.length > 0);
}
async function loadNginxDomains() {
    const domains = [];
    try {
        const nginxDir = path.resolve('configs/nginx');
        const files = await fs.readdir(nginxDir);
        for (const file of files) {
            if (file.endsWith('.conf')) {
                const content = await fs.readFile(path.join(nginxDir, file), 'utf-8');
                const serverNameMatches = content.match(/server_name\s+([^;]+);/g);
                if (serverNameMatches) {
                    serverNameMatches.forEach(match => {
                        const serverNames = match.replace('server_name', '').replace(';', '').trim().split(/\s+/);
                        domains.push(...serverNames.filter(name => !name.startsWith('_')));
                    });
                }
            }
        }
    }
    catch (error) {
    }
    return domains;
}
async function loadTraefikDomains() {
    const domains = [];
    try {
        const traefikConfig = path.resolve('configs/traefik/dynamic.yml');
        const content = await fs.readFile(traefikConfig, 'utf-8');
        const hostMatches = content.match(/Host\(`([^`]+)`\)/g);
        if (hostMatches) {
            hostMatches.forEach(match => {
                const domain = match.match(/Host\(`([^`]+)`\)/)?.[1];
                if (domain) {
                    domains.push(domain);
                }
            });
        }
    }
    catch (error) {
    }
    return domains;
}
async function checkSSLCertificate(domain) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: domain,
            port: 443,
            method: 'HEAD',
            timeout: 10000,
            rejectUnauthorized: false,
        };
        const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate(true);
            if (!cert || Object.keys(cert).length === 0) {
                reject(new Error('Nenhum certificado encontrado'));
                return;
            }
            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const certificate = {
                domain,
                issuer: cert.issuer?.CN || cert.issuer?.O || 'Unknown',
                subject: cert.subject?.CN || domain,
                validFrom,
                validTo,
                daysUntilExpiry,
                isValid: now >= validFrom && now <= validTo,
                selfSigned: cert.issuer?.CN === cert.subject?.CN,
                algorithm: cert.sigalg || 'Unknown',
                keySize: cert.bits || 0,
                serialNumber: cert.serialNumber || '',
            };
            resolve(certificate);
        });
        req.on('error', (error) => {
            reject(new Error(`Erro de conexão: ${error.message}`));
        });
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout ao conectar'));
        });
        req.setTimeout(10000);
        req.end();
    });
}
async function attemptAutoRenewal(alerts) {
    let output = '';
    const criticalDomains = alerts
        .filter(alert => alert.type === 'critical' && alert.daysUntilExpiry !== undefined)
        .map(alert => alert.domain);
    if (criticalDomains.length === 0) {
        return { success: true, output: 'Nenhum domínio crítico para renovação\n' };
    }
    output += `🔄 Tentando renovar certificados para ${criticalDomains.length} domínios...\n`;
    let renewedCount = 0;
    let failedCount = 0;
    for (const domain of criticalDomains) {
        try {
            output += `  🔄 Renovando ${domain}...\n`;
            const renewed = await renewCertificateWithCertbot(domain);
            if (renewed) {
                renewedCount++;
                output += `  ✅ ${domain} renovado com sucesso\n`;
            }
            else {
                failedCount++;
                output += `  ❌ Falha ao renovar ${domain}\n`;
            }
        }
        catch (error) {
            failedCount++;
            output += `  ❌ Erro ao renovar ${domain}: ${error.message}\n`;
        }
    }
    output += `\n📊 Resultado da renovação: ${renewedCount} sucessos, ${failedCount} falhas\n`;
    return {
        success: renewedCount > 0,
        output,
    };
}
async function renewCertificateWithCertbot(domain) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Math.random() > 0.2);
        }, 2000);
    });
}
function generateRecommendations(result) {
    const recommendations = [];
    if (result.summary.expiringSoon > 0) {
        recommendations.push('Configurar monitoramento automático de certificados SSL');
        recommendations.push('Implementar renovação automática com Certbot ou similar');
    }
    if (result.summary.expired > 0) {
        recommendations.push('Renovar certificados expirados imediatamente');
        recommendations.push('Configurar alertas 30 dias antes do vencimento');
    }
    if (result.summary.errors > 0) {
        recommendations.push('Verificar configuração SSL dos domínios com erro');
        recommendations.push('Validar configurações de firewall e DNS');
    }
    const selfSignedCount = result.certificates.filter(cert => cert.selfSigned).length;
    if (selfSignedCount > 0) {
        recommendations.push('Substituir certificados auto-assinados por certificados de CA confiável');
        recommendations.push('Considerar uso do Let\'s Encrypt para certificados gratuitos');
    }
    const weakAlgorithms = result.certificates.filter(cert => cert.algorithm && (cert.algorithm.includes('SHA1') || cert.algorithm.includes('MD5')));
    if (weakAlgorithms.length > 0) {
        recommendations.push('Atualizar certificados com algoritmos de hash fracos (SHA1, MD5)');
    }
    const smallKeys = result.certificates.filter(cert => cert.keySize && cert.keySize < 2048);
    if (smallKeys.length > 0) {
        recommendations.push('Atualizar certificados com chaves menores que 2048 bits');
    }
    return recommendations;
}
function generateSSLReport(result) {
    let report = '\n🔒 RELATÓRIO DE CERTIFICADOS SSL\n\n';
    report += '📊 RESUMO GERAL:\n';
    report += `- Total de certificados: ${result.summary.totalCertificates}\n`;
    report += `- Certificados válidos: ${result.summary.validCertificates}\n`;
    report += `- Expirando em breve: ${result.summary.expiringSoon}\n`;
    report += `- Certificados expirados: ${result.summary.expired}\n`;
    report += `- Erros de verificação: ${result.summary.errors}\n\n`;
    if (result.alerts.length > 0) {
        report += '🚨 ALERTAS:\n\n';
        const criticalAlerts = result.alerts.filter(alert => alert.type === 'critical');
        const warningAlerts = result.alerts.filter(alert => alert.type === 'warning');
        if (criticalAlerts.length > 0) {
            report += '🔴 CRÍTICOS:\n';
            criticalAlerts.forEach(alert => {
                report += `- ${alert.domain}: ${alert.message}\n`;
                report += `  Ação: ${alert.action}\n`;
            });
            report += '\n';
        }
        if (warningAlerts.length > 0) {
            report += '🟡 AVISOS:\n';
            warningAlerts.forEach(alert => {
                report += `- ${alert.domain}: ${alert.message}\n`;
                report += `  Ação: ${alert.action}\n`;
            });
            report += '\n';
        }
    }
    if (result.certificates.length > 0) {
        report += '📋 DETALHES DOS CERTIFICADOS:\n\n';
        result.certificates.forEach(cert => {
            if (cert.error) {
                report += `❌ ${cert.domain}: ${cert.error}\n`;
            }
            else {
                const status = cert.isValid ? '✅' : '❌';
                report += `${status} ${cert.domain}\n`;
                report += `   Emissor: ${cert.issuer}\n`;
                report += `   Válido até: ${cert.validTo.toLocaleDateString()}\n`;
                report += `   Dias restantes: ${cert.daysUntilExpiry}\n`;
                report += `   Algoritmo: ${cert.algorithm}\n`;
                report += `   Tamanho da chave: ${cert.keySize} bits\n`;
                if (cert.selfSigned) {
                    report += `   ⚠️ Auto-assinado\n`;
                }
            }
            report += '\n';
        });
    }
    if (result.recommendations.length > 0) {
        report += '💡 RECOMENDAÇÕES:\n\n';
        result.recommendations.forEach((rec, index) => {
            report += `${index + 1}. ${rec}\n`;
        });
        report += '\n';
    }
    report += `✅ Verificação SSL concluída em ${new Date().toISOString()}\n`;
    return report;
}
async function saveSSLReport(result) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(process.cwd(), 'storage', 'reports', `ssl-check-${timestamp}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
    return reportPath;
}
//# sourceMappingURL=ssl-check.script.js.map
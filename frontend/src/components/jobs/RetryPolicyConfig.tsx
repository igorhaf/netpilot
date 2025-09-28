'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Clock, RotateCcw, Settings, TrendingUp } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

export interface RetryPolicy {
  enabled: boolean
  maxRetries: number
  backoffStrategy: 'exponential' | 'linear' | 'fixed'
  baseDelaySeconds: number
  maxDelaySeconds: number
  retryOnExitCodes: number[]
  retryOnTimeout: boolean
  jitterEnabled: boolean
}

interface RetryPolicyConfigProps {
  policy: RetryPolicy
  onChange: (policy: RetryPolicy) => void
  onSave?: () => void
  className?: string
}

const DEFAULT_POLICY: RetryPolicy = {
  enabled: true,
  maxRetries: 3,
  backoffStrategy: 'exponential',
  baseDelaySeconds: 1,
  maxDelaySeconds: 300,
  retryOnExitCodes: [1, 2, 126, 127],
  retryOnTimeout: true,
  jitterEnabled: true
}

export function RetryPolicyConfig({
  policy = DEFAULT_POLICY,
  onChange,
  onSave,
  className
}: RetryPolicyConfigProps) {
  const [localPolicy, setLocalPolicy] = useState<RetryPolicy>(policy)
  const [exitCodeInput, setExitCodeInput] = useState('')

  useEffect(() => {
    setLocalPolicy(policy)
  }, [policy])

  const updatePolicy = (updates: Partial<RetryPolicy>) => {
    const newPolicy = { ...localPolicy, ...updates }
    setLocalPolicy(newPolicy)
    onChange(newPolicy)
  }

  const addExitCode = () => {
    const code = parseInt(exitCodeInput.trim())
    if (!isNaN(code) && code >= 0 && code <= 255) {
      if (!localPolicy.retryOnExitCodes.includes(code)) {
        updatePolicy({
          retryOnExitCodes: [...localPolicy.retryOnExitCodes, code].sort((a, b) => a - b)
        })
        setExitCodeInput('')
      } else {
        toast({
          title: "Código já adicionado",
          description: "Este código de saída já está na lista",
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Código inválido",
        description: "Digite um código de saída válido (0-255)",
        variant: "destructive"
      })
    }
  }

  const removeExitCode = (code: number) => {
    updatePolicy({
      retryOnExitCodes: localPolicy.retryOnExitCodes.filter(c => c !== code)
    })
  }

  const calculateDelay = (attempt: number): number => {
    let delay: number

    switch (localPolicy.backoffStrategy) {
      case 'exponential':
        delay = localPolicy.baseDelaySeconds * Math.pow(2, attempt - 1)
        break
      case 'linear':
        delay = localPolicy.baseDelaySeconds * attempt
        break
      case 'fixed':
        delay = localPolicy.baseDelaySeconds
        break
      default:
        delay = localPolicy.baseDelaySeconds
    }

    // Aplicar jitter se habilitado
    if (localPolicy.jitterEnabled) {
      const jitter = Math.random() * 0.1 * delay // 10% de variação
      delay += jitter
    }

    return Math.min(delay, localPolicy.maxDelaySeconds)
  }

  const getStrategyDescription = () => {
    switch (localPolicy.backoffStrategy) {
      case 'exponential':
        return 'Dobra o tempo a cada tentativa (1s, 2s, 4s, 8s...)'
      case 'linear':
        return 'Aumenta linearmente (1s, 2s, 3s, 4s...)'
      case 'fixed':
        return 'Tempo fixo entre tentativas'
      default:
        return ''
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Política de Retry
        </CardTitle>
        <CardDescription>
          Configure como os jobs falhos devem ser reexecutados automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ativação do retry */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="font-medium">Retry Automático</Label>
            <p className="text-sm text-muted-foreground">
              Ativar reexecução automática para jobs falhos
            </p>
          </div>
          <Switch
            checked={localPolicy.enabled}
            onCheckedChange={(enabled) => updatePolicy({ enabled })}
          />
        </div>

        {localPolicy.enabled && (
          <>
            <Separator />

            {/* Configurações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="1"
                  max="10"
                  value={localPolicy.maxRetries}
                  onChange={(e) => updatePolicy({ maxRetries: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseDelay">Delay Base (segundos)</Label>
                <Input
                  id="baseDelay"
                  type="number"
                  min="1"
                  max="3600"
                  value={localPolicy.baseDelaySeconds}
                  onChange={(e) => updatePolicy({ baseDelaySeconds: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Estratégia de backoff */}
            <div className="space-y-2">
              <Label>Estratégia de Backoff</Label>
              <Select
                value={localPolicy.backoffStrategy}
                onValueChange={(value: any) => updatePolicy({ backoffStrategy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exponential">Exponencial</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {getStrategyDescription()}
              </p>
            </div>

            {/* Delay máximo */}
            <div className="space-y-2">
              <Label htmlFor="maxDelay">Delay Máximo (segundos)</Label>
              <Input
                id="maxDelay"
                type="number"
                min={localPolicy.baseDelaySeconds}
                max="3600"
                value={localPolicy.maxDelaySeconds}
                onChange={(e) => updatePolicy({ maxDelaySeconds: parseInt(e.target.value) || 300 })}
              />
              <p className="text-sm text-muted-foreground">
                Tempo máximo de espera entre tentativas
              </p>
            </div>

            {/* Jitter */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Jitter</Label>
                <p className="text-sm text-muted-foreground">
                  Adiciona variação aleatória para evitar sobrecarga
                </p>
              </div>
              <Switch
                checked={localPolicy.jitterEnabled}
                onCheckedChange={(jitterEnabled) => updatePolicy({ jitterEnabled })}
              />
            </div>

            {/* Retry em timeout */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Retry em Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Tentar novamente quando job exceder tempo limite
                </p>
              </div>
              <Switch
                checked={localPolicy.retryOnTimeout}
                onCheckedChange={(retryOnTimeout) => updatePolicy({ retryOnTimeout })}
              />
            </div>

            <Separator />

            {/* Códigos de saída para retry */}
            <div className="space-y-3">
              <Label>Códigos de Saída para Retry</Label>
              <p className="text-sm text-muted-foreground">
                Jobs que terminarem com estes códigos serão reexecutados
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Código (0-255)"
                  value={exitCodeInput}
                  onChange={(e) => setExitCodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExitCode()}
                  className="flex-1"
                />
                <Button onClick={addExitCode} variant="outline">
                  Adicionar
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {localPolicy.retryOnExitCodes.map((code) => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeExitCode(code)}
                  >
                    {code} ×
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Simulação de delays */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Simulação de Delays
              </Label>
              <div className="grid grid-cols-5 gap-2 text-sm">
                {Array.from({ length: Math.min(localPolicy.maxRetries, 5) }, (_, i) => {
                  const attempt = i + 1
                  const delay = calculateDelay(attempt)
                  return (
                    <div key={attempt} className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Tent. {attempt}</div>
                      <div className="text-muted-foreground">
                        {delay < 60 ? `${delay.toFixed(1)}s` : `${(delay / 60).toFixed(1)}m`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {onSave && (
              <>
                <Separator />
                <Button onClick={onSave} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
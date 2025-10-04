'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Server, HardDrive, Table, Activity, Play, AlertCircle, CheckCircle, Download, Plus } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { RowActionsMenu } from '@/components/database/RowActionsMenu'
import api from '@/lib/api'

interface DatabaseInfo {
  version: string
  size: string
  connectionCount: number
  uptime: string
  tables: {
    name: string
    rows: number
    size: string
  }[]
}

interface TableData {
  table: string
  schema: string
  columns: {
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }[]
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface QueryResult {
  success: boolean
  data: any[] | null
  error?: string
  rowCount: number
}

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dbType, setDbType] = useState<'postgres' | 'mysql'>('postgres')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [allowDestructive, setAllowDestructive] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [insertModalOpen, setInsertModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Record<string, any>>({})
  const queryClient = useQueryClient()

  const handleExport = async (format: 'csv' | 'json' | 'sql') => {
    if (!selectedTable) return
    try {
      const response = await api.get(`/database/export?table=${selectedTable}&dbType=${dbType}&format=${format}`)
      const blob = new Blob([format === 'json' ? JSON.stringify(response.data.data, null, 2) : response.data.data], {
        type: format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'text/plain'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.data.filename
      a.click()
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }

  const { data: dbInfo, isLoading } = useQuery<DatabaseInfo>({
    queryKey: ['database-info', dbType],
    queryFn: () => api.get(`/database/info?dbType=${dbType}`).then(res => res.data),
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: tableData, isLoading: tableDataLoading } = useQuery<TableData>({
    queryKey: ['table-data', selectedTable, dbType],
    queryFn: () => api.get(`/database/table-data?table=${selectedTable}&dbType=${dbType}`).then(res => res.data),
    enabled: !!selectedTable,
    staleTime: 0,
    refetchOnMount: true,
  })

  const executeQueryMutation = useMutation({
    mutationFn: (query: string) => api.post('/database/query', { query, dbType, allowDestructive }).then(res => res.data),
    onSuccess: (data) => {
      setQueryResult(data)
    },
    onError: (error: any) => {
      setQueryResult({
        success: false,
        error: error.response?.data?.message || error.message,
        data: null,
        rowCount: 0,
      })
    },
  })

  const deleteRowMutation = useMutation({
    mutationFn: (where: Record<string, any>) =>
      api.post('/database/delete-row', { table: selectedTable, dbType, where }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-data', selectedTable, dbType] })
      queryClient.invalidateQueries({ queryKey: ['database-info', dbType] })
      setDeleteModalOpen(false)
      setSelectedRow(null)
    },
  })

  const updateRowMutation = useMutation({
    mutationFn: ({ data, where }: { data: Record<string, any>, where: Record<string, any> }) =>
      api.post('/database/update-row', { table: selectedTable, dbType, data, where }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-data', selectedTable, dbType] })
      setEditModalOpen(false)
      setSelectedRow(null)
      setEditFormData({})
    },
  })

  const insertRowMutation = useMutation({
    mutationFn: (data: Record<string, any>) =>
      api.post('/database/insert-row', { table: selectedTable, dbType, data }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-data', selectedTable, dbType] })
      queryClient.invalidateQueries({ queryKey: ['database-info', dbType] })
      setInsertModalOpen(false)
      setEditFormData({})
    },
  })

  const handleEdit = (row: any) => {
    setSelectedRow(row)
    setEditFormData({ ...row })
    setEditModalOpen(true)
  }

  const handleDelete = (row: any) => {
    setSelectedRow(row)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (!selectedRow || !tableData) return

    // Find primary key or use first column as identifier
    const primaryKey = tableData.columns.find(col => col.column_name === 'id') || tableData.columns[0]
    const where = { [primaryKey.column_name]: selectedRow[primaryKey.column_name] }

    deleteRowMutation.mutate(where)
  }

  const handleUpdateRow = () => {
    if (!selectedRow || !tableData) return

    // Find primary key or use first column as identifier
    const primaryKey = tableData.columns.find(col => col.column_name === 'id') || tableData.columns[0]
    const where = { [primaryKey.column_name]: selectedRow[primaryKey.column_name] }

    // Remove primary key from data to update
    const data = { ...editFormData }
    delete data[primaryKey.column_name]

    updateRowMutation.mutate({ data, where })
  }

  const handleInsertRow = () => {
    insertRowMutation.mutate(editFormData)
  }

  const openInsertModal = () => {
    if (!tableData) return

    // Initialize form with empty values for each column
    const initialData: Record<string, any> = {}
    tableData.columns.forEach(col => {
      if (col.column_default === null || !col.column_default?.includes('nextval')) {
        initialData[col.column_name] = ''
      }
    })
    setEditFormData(initialData)
    setInsertModalOpen(true)
  }

  // Reset selected table when switching databases
  const handleDbTypeChange = (newDbType: 'postgres' | 'mysql') => {
    setDbType(newDbType)
    setSelectedTable(null)
    setQueryResult(null)
    // Force refetch when switching databases
    queryClient.invalidateQueries({ queryKey: ['database-info'] })
    queryClient.invalidateQueries({ queryKey: ['table-data'] })
  }

  const breadcrumbs = [
    { label: 'Infra', href: '/dashboard', icon: Server },
    { label: 'Banco de Dados', current: true, icon: Database }
  ]

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Administração do Banco de Dados
            </h1>
            <p className="text-muted-foreground mt-1">
              {dbType === 'postgres' ? 'PostgreSQL' : 'MySQL'}
            </p>
          </div>

          {/* Database Type Selector */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <button
              onClick={() => handleDbTypeChange('postgres')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dbType === 'postgres'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              PostgreSQL
            </button>
            <button
              onClick={() => handleDbTypeChange('mysql')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dbType === 'mysql'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              MySQL
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tables">Tabelas</TabsTrigger>
            <TabsTrigger value="console">Console SQL</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Database Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Versão</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dbInfo?.version || 'PostgreSQL 14'}</div>
                  <p className="text-xs text-muted-foreground">
                    Sistema de banco de dados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tamanho</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dbInfo?.size || '128 MB'}</div>
                  <p className="text-xs text-muted-foreground">
                    Espaço utilizado no disco
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conexões</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dbInfo?.connectionCount ?? 5}</div>
                  <p className="text-xs text-muted-foreground">
                    Conexões ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dbInfo?.uptime || '2d 5h'}</div>
                  <p className="text-xs text-muted-foreground">
                    Tempo de operação
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tables List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Tabelas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(dbInfo?.tables || []).map((table) => (
                    <div
                      key={table.name}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Table className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{table.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {table.rows.toLocaleString()} registros
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{table.size}</Badge>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Online
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Informações de Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Host</span>
                    <span className="text-sm text-muted-foreground">localhost (127.0.0.1)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Porta</span>
                    <span className="text-sm text-muted-foreground">5432</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Banco de Dados</span>
                    <span className="text-sm text-muted-foreground">netpilot</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="default" className="bg-green-600">Conectado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Tables List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">Selecionar Tabela</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(dbInfo?.tables || []).map((table) => (
                      <button
                        key={table.name}
                        onClick={() => setSelectedTable(table.name)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedTable === table.name
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{table.name}</p>
                            <p className="text-xs opacity-70">
                              {table.rows.toLocaleString()} registros
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Table Data */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {selectedTable ? `Dados da tabela: ${selectedTable}` : 'Selecione uma tabela'}
                    </CardTitle>
                    {selectedTable && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={openInsertModal}>
                          <Plus className="h-4 w-4 mr-1" /> Novo
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                          <Download className="h-4 w-4 mr-1" /> CSV
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('json')}>
                          <Download className="h-4 w-4 mr-1" /> JSON
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('sql')}>
                          <Download className="h-4 w-4 mr-1" /> SQL
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedTable ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Table className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Selecione uma tabela para visualizar os dados</p>
                    </div>
                  ) : tableDataLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Carregando...
                    </div>
                  ) : tableData ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {tableData.columns.map((col) => (
                                <th key={col.column_name} className="text-left p-2 font-medium">
                                  {col.column_name}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({col.data_type})
                                  </span>
                                </th>
                              ))}
                              <th className="text-left p-2 font-medium w-16">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.data.map((row, idx) => (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                {tableData.columns.map((col) => (
                                  <td key={col.column_name} className="p-2">
                                    {row[col.column_name] === null ? (
                                      <span className="text-muted-foreground italic">NULL</span>
                                    ) : typeof row[col.column_name] === 'object' ? (
                                      <code className="text-xs">{JSON.stringify(row[col.column_name])}</code>
                                    ) : (
                                      String(row[col.column_name])
                                    )}
                                  </td>
                                ))}
                                <td className="p-2">
                                  <RowActionsMenu
                                    onEdit={() => handleEdit(row)}
                                    onDelete={() => handleDelete(row)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Mostrando {tableData.data.length} de {tableData.pagination.total} registros
                        </span>
                        <span>
                          Página {tableData.pagination.page} de {tableData.pagination.totalPages}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Console SQL Tab */}
          <TabsContent value="console" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Console SQL
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Execute queries SQL customizadas. Marque a opção abaixo para permitir operações de modificação.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Query SQL</label>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full h-32 p-3 rounded-lg border bg-background font-mono text-sm"
                    placeholder="SELECT * FROM users LIMIT 10;"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <input
                    type="checkbox"
                    id="allowDestructive"
                    checked={allowDestructive}
                    onChange={(e) => setAllowDestructive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="allowDestructive" className="text-sm cursor-pointer">
                    Permitir queries destrutivas (INSERT, UPDATE, DELETE, DROP, etc.)
                  </label>
                </div>

                <Button
                  onClick={() => executeQueryMutation.mutate(sqlQuery)}
                  disabled={executeQueryMutation.isPending || !sqlQuery.trim()}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {executeQueryMutation.isPending ? 'Executando...' : 'Executar Query'}
                </Button>

                {queryResult && (
                  <div className="space-y-3">
                    {queryResult.success ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Query executada com sucesso - {queryResult.rowCount} registros retornados
                        </div>
                        {queryResult.data && queryResult.data.length > 0 && (
                          <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  {Object.keys(queryResult.data[0]).map((key) => (
                                    <th key={key} className="text-left p-2 font-medium">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.data.map((row, idx) => (
                                  <tr key={idx} className="border-b hover:bg-muted/50">
                                    {Object.entries(row).map(([key, value]) => (
                                      <td key={key} className="p-2">
                                        {value === null ? (
                                          <span className="text-muted-foreground italic">NULL</span>
                                        ) : typeof value === 'object' ? (
                                          <code className="text-xs">{JSON.stringify(value)}</code>
                                        ) : (
                                          String(value)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-red-600 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Erro ao executar query</p>
                          <p className="text-xs mt-1">{queryResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Queries de Exemplo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Listar usuários', query: 'SELECT * FROM users LIMIT 10;' },
                    { label: 'Contar domínios', query: 'SELECT COUNT(*) as total FROM domains;' },
                    { label: 'Logs recentes', query: 'SELECT * FROM logs ORDER BY "createdAt" DESC LIMIT 20;' },
                    { label: 'Certificados SSL ativos', query: 'SELECT * FROM ssl_certificates WHERE "isActive" = true;' },
                  ].map((example) => (
                    <button
                      key={example.label}
                      onClick={() => setSqlQuery(example.query)}
                      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <p className="font-medium text-sm">{example.label}</p>
                      <code className="text-xs text-muted-foreground">{example.query}</code>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedRow(null)
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        subtitle="Você está prestes a excluir um registro do banco de dados"
        itemName={selectedRow && tableData ? `Registro da tabela ${selectedTable}` : 'Registro'}
        consequences={[
          'O registro será permanentemente removido do banco de dados',
          'Esta ação não pode ser desfeita',
          'Outros registros relacionados podem ser afetados'
        ]}
        confirmText="Excluir"
        isLoading={deleteRowMutation.isPending}
      />

      {/* Edit Modal */}
      {editModalOpen && tableData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Editar Registro</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {tableData.columns.map((col) => (
                  <div key={col.column_name}>
                    <label className="block text-sm font-medium mb-1">
                      {col.column_name}
                      <span className="text-xs text-muted-foreground ml-2">({col.data_type})</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData[col.column_name] ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, [col.column_name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      disabled={col.column_name === 'id' || col.column_default?.includes('nextval')}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false)
                  setSelectedRow(null)
                  setEditFormData({})
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateRow}
                disabled={updateRowMutation.isPending}
              >
                {updateRowMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Insert Modal */}
      {insertModalOpen && tableData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Inserir Novo Registro</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {tableData.columns
                  .filter(col => !col.column_default?.includes('nextval'))
                  .map((col) => (
                    <div key={col.column_name}>
                      <label className="block text-sm font-medium mb-1">
                        {col.column_name}
                        <span className="text-xs text-muted-foreground ml-2">({col.data_type})</span>
                        {col.is_nullable === 'NO' && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={editFormData[col.column_name] ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, [col.column_name]: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder={col.is_nullable === 'YES' ? 'NULL' : 'Obrigatório'}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setInsertModalOpen(false)
                  setEditFormData({})
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInsertRow}
                disabled={insertRowMutation.isPending}
              >
                {insertRowMutation.isPending ? 'Inserindo...' : 'Inserir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

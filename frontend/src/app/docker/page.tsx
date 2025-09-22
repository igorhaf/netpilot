'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Container,
  Network,
  HardDrive,
  Image as ImageIcon,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import Link from 'next/link';

// Mock da API por enquanto
const mockDashboardData = {
  containers: {
    total: 8,
    running: 5,
    stopped: 3
  },
  volumes: {
    total: 6,
    used_space: '2.4 GB'
  },
  networks: {
    total: 4,
    custom: 2
  },
  images: {
    total: 12,
    total_size: '4.8 GB'
  },
  active_jobs: [
    {
      id: 'job-1',
      type: 'backup',
      resource_id: 'web-data',
      message: 'Comprimindo dados...',
      progress: 65
    }
  ]
};

export default function DockerDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['docker', 'summary'],
    queryFn: () => Promise.resolve(mockDashboardData),
    refetchInterval: 30000 // Refresh a cada 30s
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração Docker</h1>
          <p className="text-muted-foreground">
            Gerencie containers, volumes, redes e imagens Docker
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/docker/containers/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Container
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containers</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.containers?.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{summary?.containers?.running || 0} rodando</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>{summary?.containers?.stopped || 0} parados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volumes</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.volumes?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.volumes?.used_space || '0 B'} em uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redes</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.networks?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.networks?.custom || 0} personalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imagens</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.images?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.images?.total_size || '0 B'} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Ativos */}
      {summary?.active_jobs && summary.active_jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Jobs Ativos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.active_jobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{job.type} - {job.resource_id}</p>
                      <p className="text-sm text-muted-foreground">{job.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{job.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/docker/containers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <Container className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Containers</h3>
                <p className="text-sm text-muted-foreground">Gerenciar containers</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docker/volumes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <HardDrive className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Volumes</h3>
                <p className="text-sm text-muted-foreground">Gerenciar volumes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docker/networks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <Network className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Redes</h3>
                <p className="text-sm text-muted-foreground">Gerenciar redes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docker/images">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <ImageIcon className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="font-semibold">Imagens</h3>
                <p className="text-sm text-muted-foreground">Gerenciar imagens</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
    </MainLayout>
  );
}
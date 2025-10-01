'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Layers, Code, Database, Cloud, Globe, Settings } from 'lucide-react'

export interface TechStack {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  categories: {
    [key: string]: {
      name: string
      technologies: string[]
    }
  }
}

const predefinedStacks: TechStack[] = [
  {
    id: 'full-stack-web',
    name: 'Full Stack Web',
    description: 'Stack completa para aplicações web modernas',
    icon: <Globe className="h-5 w-5" />,
    categories: {
      frontend: {
        name: 'Frontend',
        technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Shadcn/ui']
      },
      backend: {
        name: 'Backend',
        technologies: ['Node.js', 'NestJS', 'Express', 'TypeScript']
      },
      database: {
        name: 'Banco de Dados',
        technologies: ['PostgreSQL', 'Redis', 'TypeORM', 'Prisma']
      },
      tools: {
        name: 'Ferramentas',
        technologies: ['Docker', 'Git', 'Nginx', 'PM2']
      }
    }
  },
  {
    id: 'react-spa',
    name: 'React SPA',
    description: 'Single Page Application com React',
    icon: <Code className="h-5 w-5" />,
    categories: {
      frontend: {
        name: 'Frontend',
        technologies: ['React', 'TypeScript', 'Vite', 'React Router', 'Tailwind CSS']
      },
      state: {
        name: 'Gerenciamento de Estado',
        technologies: ['Zustand', 'React Query', 'Context API']
      },
      tools: {
        name: 'Ferramentas',
        technologies: ['ESLint', 'Prettier', 'Jest', 'Testing Library']
      }
    }
  },
  {
    id: 'api-rest',
    name: 'API REST',
    description: 'API RESTful robusta e escalável',
    icon: <Database className="h-5 w-5" />,
    categories: {
      backend: {
        name: 'Backend',
        technologies: ['Node.js', 'NestJS', 'TypeScript', 'Express']
      },
      database: {
        name: 'Banco de Dados',
        technologies: ['PostgreSQL', 'MongoDB', 'Redis', 'TypeORM']
      },
      auth: {
        name: 'Autenticação',
        technologies: ['JWT', 'Passport', 'bcrypt', 'OAuth2']
      },
      tools: {
        name: 'Ferramentas',
        technologies: ['Swagger', 'Jest', 'Helmet', 'CORS']
      }
    }
  },
  {
    id: 'microservices',
    name: 'Microserviços',
    description: 'Arquitetura de microserviços com containers',
    icon: <Cloud className="h-5 w-5" />,
    categories: {
      services: {
        name: 'Serviços',
        technologies: ['Node.js', 'NestJS', 'TypeScript', 'GraphQL']
      },
      containers: {
        name: 'Containers',
        technologies: ['Docker', 'Docker Compose', 'Kubernetes', 'Helm']
      },
      messaging: {
        name: 'Mensageria',
        technologies: ['Redis', 'RabbitMQ', 'Apache Kafka', 'Bull Queue']
      },
      monitoring: {
        name: 'Monitoramento',
        technologies: ['Prometheus', 'Grafana', 'Winston', 'Health Checks']
      }
    }
  },
  {
    id: 'static-site',
    name: 'Site Estático',
    description: 'Site estático com geração automática',
    icon: <Layers className="h-5 w-5" />,
    categories: {
      generator: {
        name: 'Gerador',
        technologies: ['Next.js', 'Gatsby', 'Hugo', 'Jekyll']
      },
      styling: {
        name: 'Estilização',
        technologies: ['Tailwind CSS', 'SCSS', 'CSS Modules', 'Styled Components']
      },
      cms: {
        name: 'CMS',
        technologies: ['Strapi', 'Contentful', 'Sanity', 'Ghost']
      },
      deployment: {
        name: 'Deploy',
        technologies: ['Vercel', 'Netlify', 'GitHub Pages', 'AWS S3']
      }
    }
  }
]

interface StackSelectorProps {
  selectedTechnologies: string[]
  onTechnologiesChange: (technologies: string[]) => void
}

export function StackSelector({ selectedTechnologies, onTechnologiesChange }: StackSelectorProps) {
  const [selectedStack, setSelectedStack] = useState<string | null>(null)

  const handleStackSelect = (stackId: string) => {
    if (selectedStack === stackId) {
      setSelectedStack(null)
      return
    }

    setSelectedStack(stackId)
    const stack = predefinedStacks.find(s => s.id === stackId)
    if (stack) {
      // Auto-select all technologies from the stack
      const allTechnologies = Object.values(stack.categories)
        .flatMap(category => category.technologies)

      const uniqueTechnologies = Array.from(new Set([...selectedTechnologies, ...allTechnologies]))
      onTechnologiesChange(uniqueTechnologies)
    }
  }

  const handleTechnologyToggle = (technology: string) => {
    if (selectedTechnologies.includes(technology)) {
      onTechnologiesChange(selectedTechnologies.filter(t => t !== technology))
    } else {
      onTechnologiesChange([...selectedTechnologies, technology])
    }
  }

  const selectedStackData = selectedStack ? predefinedStacks.find(s => s.id === selectedStack) : null

  return (
    <div className="space-y-6">
      {/* Stack Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Selecionar Stack de Tecnologias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedStacks.map((stack) => (
              <Button
                key={stack.id}
                variant={selectedStack === stack.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => handleStackSelect(stack.id)}
              >
                <div className="flex items-center space-x-2">
                  {stack.icon}
                  <span className="font-medium">{stack.name}</span>
                </div>
                <p className="text-xs text-left text-muted-foreground">
                  {stack.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology Selection */}
      {selectedStackData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {selectedStackData.icon}
              <span>Tecnologias - {selectedStackData.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(selectedStackData.categories).map(([categoryKey, category]) => (
              <div key={categoryKey} className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  {category.name}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {category.technologies.map((technology) => (
                    <div key={technology} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tech-${categoryKey}-${technology}`}
                        checked={selectedTechnologies.includes(technology)}
                        onCheckedChange={() => handleTechnologyToggle(technology)}
                      />
                      <Label
                        htmlFor={`tech-${categoryKey}-${technology}`}
                        className="text-sm cursor-pointer"
                      >
                        {technology}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Technologies Summary */}
      {selectedTechnologies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tecnologias Selecionadas ({selectedTechnologies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedTechnologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleTechnologyToggle(tech)}
                    className="ml-1 hover:bg-red-200 rounded"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
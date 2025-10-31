// render/src/types/jobs.ts
// Tipos e interfaces para diferentes tipos de jobs

export type JobType = 
  | 'price-sync'
  | 'backup'
  | 'email-send'
  | 'data-export'
  | 'cleanup'
  | 'report-generation'

export interface BaseJobData {
  type: JobType
  userId?: string
  metadata?: Record<string, unknown>
}

// Job de sincronização de preços
export interface PriceSyncJobData extends BaseJobData {
  type: 'price-sync'
  marketId?: string
  forceUpdate?: boolean
}

// Job de backup
export interface BackupJobData extends BaseJobData {
	type: 'backup'
	backupType: 'full' | 'incremental'
	tables?: string[]
	compress?: boolean
	encrypt?: boolean
	description?: string
}

// Job de envio de email
export interface EmailSendJobData extends BaseJobData {
  type: 'email-send'
  to: string | string[]
  subject: string
  template: string
  data: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high'
}

// Job de exportação de dados
export interface DataExportJobData extends BaseJobData {
  type: 'data-export'
  format: 'csv' | 'xlsx' | 'json'
  tables: string[]
  filters?: Record<string, unknown>
  dateRange?: {
    start: Date
    end: Date
  }
}

// Job de limpeza
export interface CleanupJobData extends BaseJobData {
  type: 'cleanup'
  cleanupType: 'logs' | 'temp-files' | 'old-data' | 'cache'
  olderThan?: Date
  maxAge?: number // em dias
}

// Job de geração de relatórios
export interface ReportGenerationJobData extends BaseJobData {
  type: 'report-generation'
  reportType: 'monthly' | 'yearly' | 'custom'
  period: {
    start: Date
    end: Date
  }
  format: 'pdf' | 'xlsx' | 'csv'
  includeCharts?: boolean
}

// Union type para todos os tipos de job
export type JobData = 
  | PriceSyncJobData
  | BackupJobData
  | EmailSendJobData
  | DataExportJobData
  | CleanupJobData
  | ReportGenerationJobData

// Interface para resultado de job
export interface JobResult {
  success: boolean
  message: string
  data?: unknown
  errors?: string[]
  metadata?: Record<string, unknown>
}

// Interface para progresso de job
export interface JobProgress {
  percentage: number
  stage: string
  message: string
  data?: unknown
  // 🚀 NOVO: Informações detalhadas sobre as etapas
  currentPhase?: 'collecting' | 'importing' | 'backing_up' | 'cleanup' | 'completed'
  parallelWorkers?: number
  stagingStats?: {
    totalRecords: number
    uniqueProducts: number
    uniqueMarkets: number
    avgPrice: number
  }
  importProgress?: {
    imported: number
    skipped: number
    errors: number
    workersActive: number
  }
  backupProgress?: {
    status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'skipped'
    originalSize?: number
    compressedSize?: number
    compressionRatio?: number
    url?: string
  }
  persistentStaging?: {
    enabled: boolean
    retentionDays?: number
    willDeleteAt?: string
  }
}

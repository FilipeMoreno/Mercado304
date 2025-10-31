import {
  RDSClient,
  CreateDBSnapshotCommand,
  DescribeDBSnapshotsCommand,
  DeleteDBSnapshotCommand,
  type DBSnapshot,
} from "@aws-sdk/client-rds"

export interface RDSBackupConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
  dbInstanceIdentifier: string
  snapshotPrefix?: string
  retentionDays?: number
}

export interface BackupInfo {
  snapshotIdentifier: string
  dbInstanceIdentifier: string
  createdAt: Date
  status: string
  allocatedStorage: number
  engine: string
  engineVersion: string
  progress?: string
}

export class RDSBackupManager {
  private client: RDSClient
  private config: RDSBackupConfig

  constructor(config: RDSBackupConfig) {
    this.config = {
      snapshotPrefix: "mercado304-sync",
      retentionDays: 7,
      ...config,
    }

    this.client = new RDSClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    })
  }

  /**
   * Cria um snapshot manual do RDS
   */
  async createSnapshot(tags?: Record<string, string>): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const snapshotIdentifier = `${this.config.snapshotPrefix}-${timestamp}`

    console.log(`[RDS Backup] Criando snapshot: ${snapshotIdentifier}`)

    const tagList = tags
      ? Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
      : []

    // Adicionar tags padrão
    tagList.push(
      { Key: "Project", Value: "Mercado304" },
      { Key: "Type", Value: "PriceSync" },
      { Key: "CreatedAt", Value: new Date().toISOString() }
    )

    const command = new CreateDBSnapshotCommand({
      DBSnapshotIdentifier: snapshotIdentifier,
      DBInstanceIdentifier: this.config.dbInstanceIdentifier,
      Tags: tagList,
    })

    const response = await this.client.send(command)

    if (!response.DBSnapshot) {
      throw new Error("Falha ao criar snapshot: resposta vazia")
    }

    console.log(
      `[RDS Backup] Snapshot criado com sucesso: ${snapshotIdentifier} (${response.DBSnapshot.Status})`
    )

    return this.mapSnapshot(response.DBSnapshot)
  }

  /**
   * Lista snapshots criados
   */
  async listSnapshots(limit?: number): Promise<BackupInfo[]> {
    console.log(`[RDS Backup] Listando snapshots...`)

    const command = new DescribeDBSnapshotsCommand({
      DBInstanceIdentifier: this.config.dbInstanceIdentifier,
      SnapshotType: "manual",
      MaxRecords: limit,
    })

    const response = await this.client.send(command)

    const snapshots =
      response.DBSnapshots?.filter((snap) =>
        snap.DBSnapshotIdentifier?.startsWith(this.config.snapshotPrefix || "")
      ) || []

    console.log(`[RDS Backup] Encontrados ${snapshots.length} snapshots`)

    return snapshots.map((snap) => this.mapSnapshot(snap))
  }

  /**
   * Deleta snapshots antigos baseado no período de retenção
   */
  async cleanupOldSnapshots(): Promise<number> {
    console.log(
      `[RDS Backup] Limpando snapshots com mais de ${this.config.retentionDays} dias...`
    )

    const snapshots = await this.listSnapshots()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - (this.config.retentionDays || 7))

    const snapshotsToDelete = snapshots.filter(
      (snap) => snap.createdAt < cutoffDate && snap.status === "available"
    )

    console.log(`[RDS Backup] ${snapshotsToDelete.length} snapshots para deletar`)

    let deletedCount = 0

    for (const snapshot of snapshotsToDelete) {
      try {
        await this.deleteSnapshot(snapshot.snapshotIdentifier)
        deletedCount++
      } catch (error) {
        console.error(
          `[RDS Backup] Erro ao deletar snapshot ${snapshot.snapshotIdentifier}:`,
          error
        )
      }
    }

    console.log(`[RDS Backup] ${deletedCount} snapshots deletados`)

    return deletedCount
  }

  /**
   * Deleta um snapshot específico
   */
  async deleteSnapshot(snapshotIdentifier: string): Promise<void> {
    console.log(`[RDS Backup] Deletando snapshot: ${snapshotIdentifier}`)

    const command = new DeleteDBSnapshotCommand({
      DBSnapshotIdentifier: snapshotIdentifier,
    })

    await this.client.send(command)

    console.log(`[RDS Backup] Snapshot deletado: ${snapshotIdentifier}`)
  }

  /**
   * Obtém informações de um snapshot específico
   */
  async getSnapshot(snapshotIdentifier: string): Promise<BackupInfo | null> {
    console.log(`[RDS Backup] Buscando snapshot: ${snapshotIdentifier}`)

    const command = new DescribeDBSnapshotsCommand({
      DBSnapshotIdentifier: snapshotIdentifier,
    })

    try {
      const response = await this.client.send(command)

      if (!response.DBSnapshots || response.DBSnapshots.length === 0) {
        return null
      }

      return this.mapSnapshot(response.DBSnapshots[0])
    } catch (error) {
      console.error(`[RDS Backup] Erro ao buscar snapshot:`, error)
      return null
    }
  }

  /**
   * Aguarda até que um snapshot esteja disponível
   */
  async waitForSnapshotAvailable(
    snapshotIdentifier: string,
    maxWaitTimeMs: number = 600000, // 10 minutos
    pollIntervalMs: number = 5000 // 5 segundos
  ): Promise<BackupInfo> {
    console.log(
      `[RDS Backup] Aguardando snapshot ficar disponível: ${snapshotIdentifier}`
    )

    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTimeMs) {
      const snapshot = await this.getSnapshot(snapshotIdentifier)

      if (!snapshot) {
        throw new Error(`Snapshot não encontrado: ${snapshotIdentifier}`)
      }

      console.log(
        `[RDS Backup] Status: ${snapshot.status} - Progresso: ${snapshot.progress || "N/A"}`
      )

      if (snapshot.status === "available") {
        console.log(
          `[RDS Backup] Snapshot disponível: ${snapshotIdentifier} (${Math.round((Date.now() - startTime) / 1000)}s)`
        )
        return snapshot
      }

      if (snapshot.status === "failed" || snapshot.status === "deleted") {
        throw new Error(
          `Snapshot falhou ou foi deletado: ${snapshotIdentifier} (status: ${snapshot.status})`
        )
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    throw new Error(
      `Timeout aguardando snapshot: ${snapshotIdentifier} (${maxWaitTimeMs}ms)`
    )
  }

  /**
   * Mapeia um DBSnapshot para BackupInfo
   */
  private mapSnapshot(snapshot: DBSnapshot): BackupInfo {
    return {
      snapshotIdentifier: snapshot.DBSnapshotIdentifier || "",
      dbInstanceIdentifier: snapshot.DBInstanceIdentifier || "",
      createdAt: snapshot.SnapshotCreateTime || new Date(),
      status: snapshot.Status || "unknown",
      allocatedStorage: snapshot.AllocatedStorage || 0,
      engine: snapshot.Engine || "",
      engineVersion: snapshot.EngineVersion || "",
      progress: snapshot.PercentProgress?.toString(),
    }
  }

  /**
   * Obtém estatísticas dos backups
   */
  async getBackupStats(): Promise<{
    totalSnapshots: number
    totalSizeGB: number
    oldestSnapshot: Date | null
    newestSnapshot: Date | null
    availableSnapshots: number
    creatingSnapshots: number
  }> {
    const snapshots = await this.listSnapshots()

    const stats = {
      totalSnapshots: snapshots.length,
      totalSizeGB: snapshots.reduce((sum, snap) => sum + snap.allocatedStorage, 0),
      oldestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].createdAt : null,
      newestSnapshot: snapshots.length > 0 ? snapshots[0].createdAt : null,
      availableSnapshots: snapshots.filter((s) => s.status === "available").length,
      creatingSnapshots: snapshots.filter((s) => s.status === "creating").length,
    }

    return stats
  }
}

/**
 * Factory function para criar RDSBackupManager com configuração do ambiente
 */
export function createRDSBackupManager(): RDSBackupManager | null {
  const config = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    dbInstanceIdentifier: process.env.RDS_DB_INSTANCE_ID,
    snapshotPrefix: process.env.RDS_SNAPSHOT_PREFIX || "mercado304-sync",
    retentionDays: parseInt(process.env.RDS_BACKUP_RETENTION_DAYS || "7"),
  }

  // Validar configuração
  if (
    !config.region ||
    !config.accessKeyId ||
    !config.secretAccessKey ||
    !config.dbInstanceIdentifier
  ) {
    console.warn(
      "[RDS Backup] Configuração incompleta. Backups RDS desabilitados."
    )
    console.warn(
      "  Variáveis necessárias: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, RDS_DB_INSTANCE_ID"
    )
    return null
  }

  return new RDSBackupManager(config as RDSBackupConfig)
}


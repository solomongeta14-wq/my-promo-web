import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../config/prisma'
import { config } from '../config'

const execAsync = promisify(exec)

export async function createBackup(): Promise<{ filename: string; size: number }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `boutique-backup-${timestamp}.sql`
  const filepath = path.join(config.backup.dir, filename)

  // Ensure backup directory exists
  await fs.mkdir(config.backup.dir, { recursive: true })

  // Extract database connection details from DATABASE_URL
  const dbUrl = config.database.url
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format')
  }

  const [, user, password, host, port, database] = match

  // Create backup using pg_dump
  const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --no-owner --no-privileges > "${filepath}"`

  try {
    await execAsync(command, { env: { ...process.env, PGPASSWORD: password } })
    
    const stats = await fs.stat(filepath)
    
    // Record backup in database
    await prisma.backup.create({
      data: {
        filename,
        size: stats.size,
        status: 'COMPLETED',
      },
    })

    return { filename, size: stats.size }
  } catch (error) {
    // Record failed backup
    await prisma.backup.create({
      data: {
        filename,
        size: 0,
        status: 'FAILED',
      },
    })
    throw error
  }
}

export async function listBackups() {
  return prisma.backup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function deleteBackup(id: string) {
  const backup = await prisma.backup.findUnique({ where: { id } })
  if (!backup) throw new Error('Backup not found')

  const filepath = path.join(config.backup.dir, backup.filename)
  
  try {
    await fs.unlink(filepath)
  } catch {
    // File might not exist, continue to delete record
  }

  return prisma.backup.delete({ where: { id } })
}

export async function getBackupStats() {
  const [total, completed, failed, totalSize] = await Promise.all([
    prisma.backup.count(),
    prisma.backup.count({ where: { status: 'COMPLETED' } }),
    prisma.backup.count({ where: { status: 'FAILED' } }),
    prisma.backup.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { size: true },
    }),
  ])

  return {
    total,
    completed,
    failed,
    totalSize: totalSize._sum.size || 0,
  }
}
/**
 * File Cleanup Job Processor
 * Handles cleanup of old temporary files and expired generations
 */

import { createClient } from '@supabase/supabase-js'
import logger from '../utils/logger.js'

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Delete old files from storage bucket
 */
async function deleteOldFiles(bucket, olderThanDays) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  try {
    // List all files in bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      })

    if (listError) throw listError

    // Filter old files
    const oldFiles = files.filter(file => {
      const createdAt = new Date(file.created_at)
      return createdAt < cutoffDate
    })

    if (oldFiles.length === 0) {
      logger.info('No old files to delete', { bucket, olderThanDays })
      return { deleted: 0, bucket }
    }

    // Delete files
    const filePaths = oldFiles.map(file => file.name)
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filePaths)

    if (deleteError) throw deleteError

    logger.info('Old files deleted', {
      bucket,
      filesDeleted: oldFiles.length,
      olderThanDays,
    })

    return {
      deleted: oldFiles.length,
      bucket,
      files: oldFiles.map(f => f.name),
    }
  } catch (error) {
    logger.error('Error deleting old files', {
      bucket,
      error: error.message,
    })
    throw error
  }
}

/**
 * Delete failed generations older than specified days
 */
async function deleteFailedGenerations(olderThanDays) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  try {
    // Find old failed generations
    const { data: failedGenerations, error: selectError } = await supabase
      .from('generations')
      .select('id, user_id')
      .eq('status', 'failed')
      .lt('created_at', cutoffDate.toISOString())

    if (selectError) throw selectError

    if (!failedGenerations || failedGenerations.length === 0) {
      logger.info('No failed generations to delete')
      return { deleted: 0 }
    }

    // Delete from database (cascade will handle images)
    const { error: deleteError } = await supabase
      .from('generations')
      .delete()
      .in('id', failedGenerations.map(g => g.id))

    if (deleteError) throw deleteError

    logger.info('Failed generations deleted', {
      count: failedGenerations.length,
      olderThanDays,
    })

    return {
      deleted: failedGenerations.length,
      generations: failedGenerations.map(g => g.id),
    }
  } catch (error) {
    logger.error('Error deleting failed generations', {
      error: error.message,
    })
    throw error
  }
}

/**
 * Main cleanup processor
 */
export async function processCleanup(job) {
  const { type, olderThanDays = 30 } = job.data

  logger.info('Starting cleanup job', {
    jobId: job.id,
    type,
    olderThanDays,
  })

  try {
    let result

    switch (type) {
      case 'temp-files':
        result = await deleteOldFiles('temp-uploads', 1) // Delete after 1 day
        break

      case 'failed-generations':
        result = await deleteFailedGenerations(olderThanDays)
        break

      case 'all':
        const tempResult = await deleteOldFiles('temp-uploads', 1)
        const failedResult = await deleteFailedGenerations(olderThanDays)
        result = {
          tempFiles: tempResult,
          failedGenerations: failedResult,
        }
        break

      default:
        throw new Error(`Unknown cleanup type: ${type}`)
    }

    logger.info('Cleanup job completed', {
      jobId: job.id,
      type,
      result,
    })

    return {
      success: true,
      type,
      result,
    }
  } catch (error) {
    logger.error('Cleanup job failed', {
      jobId: job.id,
      type,
      error: error.message,
    })
    throw error
  }
}

export default processCleanup
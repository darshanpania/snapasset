/**
 * Creative Adaptation domain models.
 * These represent the durable project-oriented workflow for upload-first adaptation.
 */

const PROJECT_STATUSES = ['draft', 'processing', 'review', 'completed', 'archived']
const OUTPUT_STATUSES = ['pending', 'generating', 'generated', 'approved', 'rejected', 'failed']
const ATTEMPT_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled']

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export class AdaptationProject {
  constructor(data) {
    this.id = data.id || null
    this.owner_id = data.owner_id
    this.name = data.name
    this.status = data.status || 'draft'
    this.preservation_intent = data.preservation_intent || []
    this.settings = data.settings || {}
    this.created_at = data.created_at || new Date().toISOString()
    this.updated_at = data.updated_at || new Date().toISOString()
    this.archived_at = data.archived_at || null
  }

  validate() {
    const errors = []

    if (!this.owner_id) errors.push('Project owner is required')
    if (!hasText(this.name)) errors.push('Project name is required')
    if (this.name && this.name.length > 120) errors.push('Project name must be 120 characters or less')
    if (!PROJECT_STATUSES.includes(this.status)) errors.push('Invalid project status')
    if (!Array.isArray(this.preservation_intent)) errors.push('Preservation intent must be an array')
    if (typeof this.settings !== 'object' || Array.isArray(this.settings) || this.settings === null) {
      errors.push('Project settings must be an object')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      id: this.id,
      owner_id: this.owner_id,
      name: this.name,
      status: this.status,
      preservation_intent: this.preservation_intent,
      settings: this.settings,
      created_at: this.created_at,
      updated_at: this.updated_at,
      archived_at: this.archived_at,
    }
  }
}

export class SourceAsset {
  constructor(data) {
    this.id = data.id || null
    this.project_id = data.project_id
    this.storage_path = data.storage_path
    this.original_filename = data.original_filename
    this.mime_type = data.mime_type
    this.file_size = data.file_size ?? null
    this.width = data.width ?? null
    this.height = data.height ?? null
    this.metadata = data.metadata || {}
    this.created_at = data.created_at || new Date().toISOString()
  }

  validate() {
    const errors = []

    if (!this.project_id) errors.push('Source asset project_id is required')
    if (!hasText(this.storage_path)) errors.push('Source asset storage_path is required')
    if (!hasText(this.original_filename)) errors.push('Source asset original_filename is required')
    if (!hasText(this.mime_type)) errors.push('Source asset mime_type is required')
    if (this.width !== null && (!Number.isInteger(this.width) || this.width <= 0)) errors.push('Source asset width must be a positive integer')
    if (this.height !== null && (!Number.isInteger(this.height) || this.height <= 0)) errors.push('Source asset height must be a positive integer')
    if (this.file_size !== null && (!Number.isInteger(this.file_size) || this.file_size < 0)) errors.push('Source asset file_size must be a non-negative integer')
    if (typeof this.metadata !== 'object' || Array.isArray(this.metadata) || this.metadata === null) errors.push('Source asset metadata must be an object')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      storage_path: this.storage_path,
      original_filename: this.original_filename,
      mime_type: this.mime_type,
      file_size: this.file_size,
      width: this.width,
      height: this.height,
      metadata: this.metadata,
      created_at: this.created_at,
    }
  }
}

export class RequestedOutput {
  constructor(data) {
    this.id = data.id || null
    this.project_id = data.project_id
    this.preset_id = data.preset_id || null
    this.label = data.label
    this.aspect_ratio = data.aspect_ratio
    this.target_width = data.target_width ?? null
    this.target_height = data.target_height ?? null
    this.status = data.status || 'pending'
    this.review_notes = data.review_notes || ''
    this.approved_attempt_id = data.approved_attempt_id || null
    this.sort_order = data.sort_order ?? 0
    this.created_at = data.created_at || new Date().toISOString()
    this.updated_at = data.updated_at || new Date().toISOString()
  }

  validate() {
    const errors = []

    if (!this.project_id) errors.push('Requested output project_id is required')
    if (!hasText(this.label)) errors.push('Requested output label is required')
    if (!hasText(this.aspect_ratio)) errors.push('Requested output aspect_ratio is required')
    if (!OUTPUT_STATUSES.includes(this.status)) errors.push('Invalid requested output status')
    if (this.target_width !== null && (!Number.isInteger(this.target_width) || this.target_width <= 0)) errors.push('Requested output target_width must be a positive integer')
    if (this.target_height !== null && (!Number.isInteger(this.target_height) || this.target_height <= 0)) errors.push('Requested output target_height must be a positive integer')
    if (!Number.isInteger(this.sort_order) || this.sort_order < 0) errors.push('Requested output sort_order must be a non-negative integer')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      preset_id: this.preset_id,
      label: this.label,
      aspect_ratio: this.aspect_ratio,
      target_width: this.target_width,
      target_height: this.target_height,
      status: this.status,
      review_notes: this.review_notes,
      approved_attempt_id: this.approved_attempt_id,
      sort_order: this.sort_order,
      created_at: this.created_at,
      updated_at: this.updated_at,
    }
  }
}

export class OutputAttempt {
  constructor(data) {
    this.id = data.id || null
    this.output_id = data.output_id
    this.attempt_number = data.attempt_number
    this.status = data.status || 'queued'
    this.provider = data.provider || null
    this.model = data.model || null
    this.instructions = data.instructions || ''
    this.storage_path = data.storage_path || null
    this.mime_type = data.mime_type || null
    this.width = data.width ?? null
    this.height = data.height ?? null
    this.error_message = data.error_message || null
    this.diagnostics = data.diagnostics || {}
    this.created_at = data.created_at || new Date().toISOString()
    this.completed_at = data.completed_at || null
  }

  validate() {
    const errors = []

    if (!this.output_id) errors.push('Output attempt output_id is required')
    if (!Number.isInteger(this.attempt_number) || this.attempt_number <= 0) errors.push('Output attempt attempt_number must be a positive integer')
    if (!ATTEMPT_STATUSES.includes(this.status)) errors.push('Invalid output attempt status')
    if (this.width !== null && (!Number.isInteger(this.width) || this.width <= 0)) errors.push('Output attempt width must be a positive integer')
    if (this.height !== null && (!Number.isInteger(this.height) || this.height <= 0)) errors.push('Output attempt height must be a positive integer')
    if (typeof this.diagnostics !== 'object' || Array.isArray(this.diagnostics) || this.diagnostics === null) errors.push('Output attempt diagnostics must be an object')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      id: this.id,
      output_id: this.output_id,
      attempt_number: this.attempt_number,
      status: this.status,
      provider: this.provider,
      model: this.model,
      instructions: this.instructions,
      storage_path: this.storage_path,
      mime_type: this.mime_type,
      width: this.width,
      height: this.height,
      error_message: this.error_message,
      diagnostics: this.diagnostics,
      created_at: this.created_at,
      completed_at: this.completed_at,
    }
  }
}

export const AdaptationProjectStatuses = PROJECT_STATUSES
export const RequestedOutputStatuses = OUTPUT_STATUSES
export const OutputAttemptStatuses = ATTEMPT_STATUSES

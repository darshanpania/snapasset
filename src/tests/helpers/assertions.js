import { expect } from 'vitest'

// Custom assertion helpers for common test patterns

export function expectElementToBeVisible(element) {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export function expectElementToBeDisabled(element) {
  expect(element).toBeDisabled()
  expect(element).toHaveAttribute('disabled')
}

export function expectFormValidation(container, errorMessage) {
  const errorElement = container.querySelector('.error-message, .alert-error')
  expect(errorElement).toBeInTheDocument()
  if (errorMessage) {
    expect(errorElement).toHaveTextContent(errorMessage)
  }
}

export function expectLoadingState(container) {
  const spinner = container.querySelector('.spinner, .spinner-large')
  expect(spinner).toBeInTheDocument()
}

export function expectButtonState(button, { disabled = false, loading = false }) {
  if (disabled) {
    expect(button).toBeDisabled()
  } else {
    expect(button).not.toBeDisabled()
  }
  
  if (loading) {
    expect(button).toHaveTextContent(/loading|generating|saving/i)
  }
}
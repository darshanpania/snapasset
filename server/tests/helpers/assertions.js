import { expect } from '@jest/globals'

// Custom assertion helpers for backend tests

export function expectSuccessResponse(response) {
  expect(response.body).toHaveProperty('success', true)
  expect(response.status).toBe(200)
}

export function expectErrorResponse(response, statusCode, errorMessage) {
  expect(response.body).toHaveProperty('success', false)
  expect(response.body).toHaveProperty('error')
  expect(response.status).toBe(statusCode)
  
  if (errorMessage) {
    expect(response.body.error).toContain(errorMessage)
  }
}

export function expectValidationError(response, message) {
  expectErrorResponse(response, 400, message)
}

export function expectImageData(imageObject) {
  expect(imageObject).toHaveProperty('preset')
  expect(imageObject).toHaveProperty('url')
  expect(imageObject).toHaveProperty('size')
  expect(imageObject).toHaveProperty('timestamp')
  
  expect(imageObject.preset).toHaveProperty('id')
  expect(imageObject.preset).toHaveProperty('name')
  expect(imageObject.preset).toHaveProperty('width')
  expect(imageObject.preset).toHaveProperty('height')
  
  expect(imageObject.url).toMatch(/^data:image\/png;base64,/)
}

export function expectArrayOfImages(images, count) {
  expect(Array.isArray(images)).toBe(true)
  if (count !== undefined) {
    expect(images).toHaveLength(count)
  }
  
  images.forEach(image => {
    expectImageData(image)
  })
}
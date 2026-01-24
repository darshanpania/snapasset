const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function generateImages({ prompt, presets }) {
  try {
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        presets
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw new Error(error.message || 'Failed to generate images. Please check your connection and try again.')
  }
}

export async function uploadImage(file) {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_URL}/api/images/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Upload Error:', error)
    throw new Error(error.message || 'Failed to upload image. Please try again.')
  }
}
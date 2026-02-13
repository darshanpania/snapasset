import { describe, it, expect, vi } from 'vitest'
import { supabase } from './supabase'

describe('Supabase Client', () => {
  it('exports supabase client', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('has auth methods', () => {
    expect(supabase.auth.signUp).toBeDefined()
    expect(supabase.auth.signInWithPassword).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
  })

  it('has database methods', () => {
    expect(supabase.from).toBeDefined()
  })

  it('has storage methods', () => {
    expect(supabase.storage).toBeDefined()
  })
})
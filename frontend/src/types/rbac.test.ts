import { describe, expect, it } from 'vitest'
import {
  ALL_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLES,
  hasAnyPermission,
  hasPermission,
  roleHas,
} from './rbac'
import type { Role } from './rbac'

describe('RBAC vocabulary and matrix', () => {
  it('exposes exactly three roles with labels and descriptions', () => {
    expect(ROLES).toEqual(['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'])
    for (const role of ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy()
      expect(ROLE_DESCRIPTIONS[role]).toBeTruthy()
    }
  })

  it('grants SUPER_ADMIN every declared permission', () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(roleHas('SUPER_ADMIN', permission)).toBe(true)
    }
  })

  it('keeps compensation and destructive employee actions away from HR_ADMIN', () => {
    expect(roleHas('HR_ADMIN', 'payroll.manage')).toBe(false)
    expect(roleHas('HR_ADMIN', 'payroll.view')).toBe(false)
    expect(roleHas('HR_ADMIN', 'employees.delete')).toBe(false)
    // But HR keeps everyday people operations:
    for (const permission of ['employees.view', 'employees.create', 'attendance.write', 'leave.approve', 'reports.export'] as const) {
      expect(roleHas('HR_ADMIN', permission)).toBe(true)
    }
  })

  it('limits EMPLOYEE to self-service + read-only modules', () => {
    expect(roleHas('EMPLOYEE', 'self.request.leave')).toBe(true)
    expect(roleHas('EMPLOYEE', 'self.request.correction')).toBe(true)
    expect(roleHas('EMPLOYEE', 'dashboard.admin.view')).toBe(false)
    expect(roleHas('EMPLOYEE', 'payroll.view')).toBe(false)
    expect(roleHas('EMPLOYEE', 'leave.approve')).toBe(false)
    expect(roleHas('EMPLOYEE', 'attendance.write')).toBe(false)
    expect(roleHas('EMPLOYEE', 'settings.users')).toBe(false)
  })

  it('covers the same permission vocabulary for every role', () => {
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(ALL_PERMISSIONS).toContain(permission)
      }
    }
  })

  it('evaluates role-aware scopes from a session', () => {
    const hr = { role: 'HR_ADMIN' as Role }
    expect(hasPermission(hr, 'employees.create')).toBe(true)
    expect(hasPermission(hr, 'payroll.manage')).toBe(false)
    expect(hasAnyPermission(hr, ['payroll.manage', 'employees.view'])).toBe(true)
    expect(hasPermission(null, 'employees.view')).toBe(false)
    expect(hasAnyPermission(undefined, ['payroll.manage'])).toBe(false)
  })
})

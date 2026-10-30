import { describe, expect, it } from 'vitest'
import { db } from './demo/store'
import { settingsService } from './settings'
import { employeeService } from './employees'
import { getProjectScope, taskService } from './tasks'
import { leaveService } from './leave'
import { attendanceService } from './attendance'
import { payrollService } from './payroll'
import { resolveActiveSession } from '@/app/auth-context'
import type { SessionUser } from '@/types/domain'

const superAdminSession: SessionUser = {
  userId: 'USR-001',
  employeeId: 'EMP-001',
  name: 'Aarav Karki',
  email: 'aarav.karki@zeroinfinity.tech',
  role: 'SUPER_ADMIN',
  department: 'Engineering',
  jobTitle: 'VP of Engineering',
}

const hrAdminSession: SessionUser = {
  userId: 'USR-002',
  employeeId: 'EMP-002',
  name: 'Sita Sharma',
  email: 'sita.sharma@zeroinfinity.tech',
  role: 'HR_ADMIN',
  department: 'Human Resources',
  jobTitle: 'HR Lead',
}

const dharmLeadSession: SessionUser = {
  userId: 'USR-004',
  employeeId: 'EMP-004',
  name: 'Dharm Dev',
  email: 'dharm.dev@zeroinfinity.tech',
  role: 'EMPLOYEE',
  department: 'Engineering',
  jobTitle: 'Product Engineer',
}

const anjaliMemberSession: SessionUser = {
  userId: 'USR-008',
  employeeId: 'EMP-008',
  name: 'Anjali Shrestha',
  email: 'anjali.shrestha@zeroinfinity.tech',
  role: 'EMPLOYEE',
  department: 'Engineering',
  jobTitle: 'QA Engineer',
}

describe('RBAC, Project/Team Hierarchy, Delegated Tasks & Lifecycle Governance', () => {
  it('prevents HR Admin from promoting themselves or anyone else to Super Admin or changing system roles', async () => {
    await expect(
      settingsService.assignEmployeeRole({
        employeeId: 'EMP-002',
        role: 'SUPER_ADMIN',
        reason: 'Attempted self-promotion',
        actor: hrAdminSession.name,
        actorRole: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Only (a )?Super Admin/i)

    await expect(
      settingsService.updateUser('USR-002', {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        reason: 'Attempted role escalation',
        actor: hrAdminSession.name,
        actorRole: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Only (a )?Super Admin/i)

    await expect(
      settingsService.inviteUser({
        name: 'Rogue HR',
        email: 'rogue@zeroinfinity.tech',
        employeeId: null,
        role: 'HR_ADMIN',
        actor: hrAdminSession.name,
        actorRole: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Only (a )?Super Admin/i)
  })

  it('prevents demoting or disabling the last active Super Admin', async () => {
    // Demote the second Super Admin (EMP-003) first as Super Admin
    await settingsService.assignEmployeeRole({
      employeeId: 'EMP-003',
      role: 'EMPLOYEE',
      reason: 'Consolidating Super Admin seat',
      actor: superAdminSession.name,
      actorRole: 'SUPER_ADMIN',
    })

    // Now EMP-001 is the last active Super Admin — demotion or termination must be rejected
    await expect(
      settingsService.assignEmployeeRole({
        employeeId: 'EMP-001',
        role: 'HR_ADMIN',
        reason: 'Accidental self-demotion',
        actor: superAdminSession.name,
        actorRole: 'SUPER_ADMIN',
      }),
    ).rejects.toThrow(/last active Super Admin/i)

    await expect(
      employeeService.terminate('EMP-001', {
        reason: 'Accidental termination of last Super Admin',
        actor: superAdminSession.name,
        actorRole: 'SUPER_ADMIN',
      }),
    ).rejects.toThrow(/last active Super Admin/i)

    // Restore EMP-003 back to SUPER_ADMIN
    await settingsService.assignEmployeeRole({
      employeeId: 'EMP-003',
      role: 'SUPER_ADMIN',
      reason: 'Restore backup Super Admin',
      actor: superAdminSession.name,
      actorRole: 'SUPER_ADMIN',
    })
  })

  it('separates System Roles from Project Lead and Team Lead positions', () => {
    // Dharm Dev has EMPLOYEE system role, is Team Lead on PRJ-01 (TM-01), and Main Project Lead on PRJ-02
    expect(settingsService.getEmployeeRole('EMP-004')).toBe('EMPLOYEE')
    const prj1 = db.projects.find((p) => p.id === 'PRJ-01')!
    const prj2 = db.projects.find((p) => p.id === 'PRJ-02')!
    const prj3 = db.projects.find((p) => p.id === 'PRJ-03')!

    const scope1 = getProjectScope(prj1, dharmLeadSession)
    expect(scope1.position).toBe('TEAM_LEAD')
    expect(scope1.canCreateTasks).toBe(true)
    expect(scope1.assignableEmployeeIds).toEqual(expect.arrayContaining(['EMP-004', 'EMP-008']))
    expect(scope1.assignableEmployeeIds).not.toContain('EMP-003')
    expect(scope1.assignableEmployeeIds).not.toContain('EMP-006')

    const scope2 = getProjectScope(prj2, dharmLeadSession)
    expect(scope2.position).toBe('PROJECT_LEAD')
    expect(scope2.canCreateTasks).toBe(true)

    const scope3 = getProjectScope(prj3, dharmLeadSession)
    expect(scope3.canView).toBe(false)
  })

  it('enforces scoped task delegation for Project Leads, Team Leads, and ordinary Employees', async () => {
    // Team Lead Dharm Dev on PRJ-01 (TM-01) can assign to TM-01 member EMP-008
    const createdByTeamLead = await taskService.create(
      {
        title: 'Write integration test for attendance sync',
        description: 'Verify shift cutoff edge cases',
        projectId: 'PRJ-01',
        teamId: 'TM-01',
        assigneeId: 'EMP-008',
        dueDate: db.today,
        priority: 'Medium',
      },
      dharmLeadSession,
    )
    expect(createdByTeamLead.assigneeId).toBe('EMP-008')

    // Team Lead Dharm Dev on PRJ-01 (TM-01) CANNOT assign to EMP-006 (who is in TM-02, not TM-01)
    await expect(
      taskService.create(
        {
          title: 'Cross-team unauthorized assignment',
          description: 'Should fail',
          projectId: 'PRJ-01',
          assigneeId: 'EMP-006',
          dueDate: db.today,
          priority: 'Low',
        },
        dharmLeadSession,
      ),
    ).rejects.toThrow(/Team Leads can only assign tasks to members of their own team/i)

    // Main Project Lead Dharm Dev on PRJ-02 CAN assign to any member/lead in PRJ-02 (e.g., EMP-007 in TM-04)
    const createdByProjectLead = await taskService.create(
      {
        title: 'Validate settlement export CSV headers',
        description: 'Project-wide task from Main Project Lead',
        projectId: 'PRJ-02',
        assigneeId: 'EMP-007',
        dueDate: db.today,
        priority: 'High',
      },
      dharmLeadSession,
    )
    expect(createdByProjectLead.assigneeId).toBe('EMP-007')

    // Ordinary Employee Anjali (EMP-008) CANNOT create or assign tasks
    await expect(
      taskService.create(
        {
          title: 'Employee trying to assign task',
          description: 'Should fail',
          projectId: 'PRJ-01',
          assigneeId: 'EMP-004',
          dueDate: db.today,
          priority: 'Low',
        },
        anjaliMemberSession,
      ),
    ).rejects.toThrow(/Unauthorized/i)
  })

  it('restricts task and project visibility for ordinary Employees', async () => {
    // Anjali (EMP-008) is not on PRJ-03 and cannot view PRJ-03 or TSK-106
    await expect(taskService.getProject('PRJ-03', anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)
    await expect(taskService.get('TSK-106', anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)

    // Anjali can view and update status on her own task TSK-105
    const ownTask = await taskService.get('TSK-105', anjaliMemberSession)
    expect(ownTask.assigneeId).toBe('EMP-008')
    const updated = await taskService.update('TSK-105', { status: 'IN_PROGRESS' }, anjaliMemberSession)
    expect(updated.status).toBe('IN_PROGRESS')

    // Anjali cannot reassign her own task to someone else
    await expect(
      taskService.update('TSK-105', { assigneeId: 'EMP-004' }, anjaliMemberSession),
    ).rejects.toThrow(/Unauthorized/i)
  })

  it('enforces HR Admin vs Super Admin boundaries on Terminate/Sack, Deactivate, and Archive', async () => {
    // HR Admin cannot terminate another HR Admin or Super Admin
    await expect(
      employeeService.terminate('EMP-001', {
        reason: 'HR trying to sack Super Admin',
        actor: hrAdminSession.name,
        actorRole: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Unauthorized/i)

    // HR Admin cannot archive/delete an account (Super Admin only)
    await expect(
      employeeService.deletePermanently('EMP-006', 'HR trying to archive', {
        name: hrAdminSession.name,
        role: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Only a Super Admin/i)

    // HR Admin CAN terminate an ordinary employee (EMP-006)
    const terminated = await employeeService.terminate('EMP-006', {
      reason: 'Probation concluded',
      terminationDate: '2026-10-28',
      actor: hrAdminSession.name,
      actorRole: 'HR_ADMIN',
    })
    expect(terminated.status).toBe('TERMINATED')
    expect(terminated.terminatedAt).toBe('2026-10-28')
    expect(settingsService.isAccountActive('EMP-006').active).toBe(false)

    // Terminated employee session is immediately invalidated
    const minaSession: SessionUser = {
      userId: 'USR-006',
      employeeId: 'EMP-006',
      name: 'Mina Tamang',
      email: 'mina.tamang@zeroinfinity.tech',
      role: 'EMPLOYEE',
      department: 'Marketing & IT',
      jobTitle: 'Growth Specialist',
    }
    expect(resolveActiveSession(minaSession)).toBeNull()

    // Historical leave requests for EMP-006 are still preserved in db
    expect(db.leaveRequests.some((r) => r.employeeId === 'EMP-006')).toBe(true)

    // Reactivate EMP-006 for clean state
    await employeeService.reactivate('EMP-006', 'Reinstated after review', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })
    expect(settingsService.isAccountActive('EMP-006').active).toBe(true)
  })

  it('enforces personal data ownership and directory privacy for Employees', async () => {
    // Employee viewing another employee in directory gets redacted personal fields
    const colleagueProfile = await employeeService.get('EMP-001', anjaliMemberSession)
    expect(colleagueProfile.personalEmail).toBe('Protected (HR only)')
    expect(colleagueProfile.phone).toBe('Protected (HR only)')
    expect(colleagueProfile.address).toBe('Protected (HR only)')

    // Employee viewing their own profile sees full fields
    const ownProfile = await employeeService.get('EMP-008', anjaliMemberSession)
    expect(ownProfile.personalEmail).toBe('anjali.s@gmail.com')

    // Employee cannot query another employee's leave balances, attendance summary, or payslips
    await expect(leaveService.balances('EMP-001', 2026, anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)
    await expect(attendanceService.summaryForMonth('EMP-001', '2026-10', anjaliMemberSession)).rejects.toThrow(
      /Unauthorized/i,
    )
    await expect(payrollService.latestForEmployee('EMP-001', anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)

    // Employee with no payslip gets null, never another employee's payslip
    const anjaliPayslip = await payrollService.latestForEmployee('EMP-008', anjaliMemberSession)
    expect(anjaliPayslip).toBeNull()
  })

  it('restricts company payroll runs and transitions strictly to Super Admin (blocking HR Admin and Employee)', async () => {
    await expect(payrollService.runs('', 1, 10, hrAdminSession)).rejects.toThrow(/Unauthorized/i)
    await expect(payrollService.run('RUN-2026-10', hrAdminSession)).rejects.toThrow(/Unauthorized/i)
    await expect(payrollService.runPayslips('RUN-2026-10', {}, hrAdminSession)).rejects.toThrow(/Unauthorized/i)
    await expect(payrollService.transition('RUN-2026-10', 'approve', 'HR attempt', hrAdminSession)).rejects.toThrow(
      /Unauthorized/i,
    )
    await expect(payrollService.payslips({ employeeId: 'EMP-001' }, hrAdminSession)).rejects.toThrow(/Unauthorized/i)

    // Super Admin can access payroll runs
    const superRuns = await payrollService.runs('', 1, 10, superAdminSession)
    expect(superRuns.items.length).toBeGreaterThan(0)
  })

  it('fails closed when service methods are called without an authenticated session or actor role', async () => {
    await expect(
      settingsService.assignEmployeeRole({
        employeeId: 'EMP-004',
        role: 'SUPER_ADMIN',
        reason: 'Missing actorRole',
      }),
    ).rejects.toThrow(/Only Super Admin/i)

    await expect(
      employeeService.terminate('EMP-006', {
        reason: 'Missing actorRole',
      }),
    ).rejects.toThrow(/Unauthorized/i)

    // Unauthenticated get redacts PII by default
    const unauthEmployee = await employeeService.get('EMP-001', null)
    expect(unauthEmployee.personalEmail).toBe('Protected (HR only)')

    const unauthTasks = await taskService.list({}, null)
    expect(unauthTasks).toHaveLength(0)
  })

  it('enforces RBAC and lifecycle state guards on employeeService.changeStatus', async () => {
    // Ordinary employee cannot change status
    await expect(
      employeeService.changeStatus('EMP-008', 'ACTIVE', 'Self promotion from probation', {
        name: anjaliMemberSession.name,
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(/Unauthorized/i)

    // HR Admin cannot change status of a Super Admin or HR Admin
    await expect(
      employeeService.changeStatus('EMP-001', 'PROBATION', 'HR modifying Super Admin status', {
        name: hrAdminSession.name,
        role: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Unauthorized/i)

    // Terminate EMP-006, then verify changeStatus cannot bypass formal reactivation
    await employeeService.terminate('EMP-006', {
      reason: 'Contract ended',
      actor: hrAdminSession.name,
      actorRole: 'HR_ADMIN',
    })
    await expect(
      employeeService.changeStatus('EMP-006', 'ACTIVE', 'Bypass reactivation via changeStatus', {
        name: hrAdminSession.name,
        role: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Cannot change status of a terminated/i)

    // Restore EMP-006 via formal reactivation
    await employeeService.reactivate('EMP-006', 'Formal reinstatement', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })
  })

  it('enforces document visibility so HR & Super Admin documents are hidden and blocked for Employees', async () => {
    const { documentService } = await import('./documents')

    const employeeDocs = await documentService.list({}, anjaliMemberSession)
    expect(employeeDocs.items.some((d) => d.id === 'DOC-04')).toBe(false)
    await expect(documentService.get('DOC-04', anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)

    const hrDocs = await documentService.list({}, hrAdminSession)
    expect(hrDocs.items.some((d) => d.id === 'DOC-04')).toBe(true)
    const doc4 = await documentService.get('DOC-04', hrAdminSession)
    expect(doc4.id).toBe('DOC-04')
  })

  it('scopes global search (searchEverything) to the viewer permissions and assigned projects/tasks', async () => {
    // PRJ-03 ("Brand & Talent Portal Revamp") and TSK-106 are not accessible to Anjali (EMP-008)
    const anjaliProjectSearch = await settingsService.searchEverything('Brand & Talent Portal', anjaliMemberSession)
    expect(anjaliProjectSearch).toHaveLength(0)

    // Super Admin can find PRJ-03 in global search
    const adminProjectSearch = await settingsService.searchEverything('Brand & Talent Portal', superAdminSession)
    expect(adminProjectSearch.some((r) => r.label.includes('Brand & Talent Portal Revamp'))).toBe(true)
  })

  it('enforces settingsService permissions for updateCompanyProfile, users, and audit (including unauthenticated fail-closed)', async () => {
    const { setActiveSession } = await import('./demo/store')
    setActiveSession(null)

    // Unauthenticated calls fail closed
    expect(() => settingsService.updateCompanyProfile({ shortName: 'Unauthorized' }, { viewer: null })).toThrow(
      /Unauthorized/i,
    )
    await expect(settingsService.users('', 1, 10, null)).rejects.toThrow(/Unauthorized/i)
    await expect(settingsService.audit({}, null)).rejects.toThrow(/Unauthorized/i)

    // Employee lacks settings.company, settings.users, and settings.audit
    expect(() =>
      settingsService.updateCompanyProfile({ shortName: 'EmployeeHack' }, { viewer: anjaliMemberSession }),
    ).toThrow(/Unauthorized/i)
    await expect(settingsService.users('', 1, 10, anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)
    await expect(settingsService.audit({}, anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)

    // HR Admin has settings.company, settings.users, and settings.audit
    const hrUsers = await settingsService.users('', 1, 10, hrAdminSession)
    expect(hrUsers.items.length).toBeGreaterThan(0)
    const updatedCompany = settingsService.updateCompanyProfile(
      { shortName: 'ZeroInfinity' },
      { viewer: hrAdminSession },
    )
    expect(updatedCompany.shortName).toBe('ZeroInfinity')
    const hrAudit = await settingsService.audit({ page: 1, pageSize: 5 }, hrAdminSession)
    expect(hrAudit.items.length).toBeGreaterThan(0)

    // Super Admin also has settings.audit
    const superAudit = await settingsService.audit({ page: 1, pageSize: 5 }, superAdminSession)
    expect(superAudit.items.length).toBeGreaterThan(0)
  })

  it('enforces recruitmentService view and manage permissions and fails closed when unauthenticated', async () => {
    const { recruitmentService } = await import('./recruitment')
    const { setActiveSession } = await import('./demo/store')
    setActiveSession(null)

    // Unauthenticated calls fail closed
    await expect(recruitmentService.jobs('', '', null)).rejects.toThrow(/Unauthorized/i)
    await expect(recruitmentService.candidates('', '', null)).rejects.toThrow(/Unauthorized/i)
    await expect(recruitmentService.interviews(null)).rejects.toThrow(/Unauthorized/i)
    await expect(recruitmentService.moveCandidateStage('CND-01', 'SCREENING', null)).rejects.toThrow(/Unauthorized/i)

    // Employee lacks recruitment.view and recruitment.manage
    await expect(recruitmentService.jobs('', '', anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)
    await expect(recruitmentService.candidates('', '', anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)
    await expect(recruitmentService.interviews(anjaliMemberSession)).rejects.toThrow(/Unauthorized/i)
    await expect(
      recruitmentService.moveCandidateStage('CND-01', 'SCREENING', anjaliMemberSession),
    ).rejects.toThrow(/Unauthorized/i)

    // HR Admin and Super Admin have recruitment.view and recruitment.manage
    const hrJobs = await recruitmentService.jobs('', '', hrAdminSession)
    expect(hrJobs.length).toBeGreaterThan(0)
    const hrCandidates = await recruitmentService.candidates('', '', hrAdminSession)
    expect(hrCandidates.length).toBeGreaterThan(0)
    const hrInterviews = await recruitmentService.interviews(hrAdminSession)
    expect(hrInterviews.length).toBeGreaterThan(0)

    const targetCandidate = hrCandidates[0]!
    const originalStage = targetCandidate.stage
    const moved = await recruitmentService.moveCandidateStage(targetCandidate.id, 'TECHNICAL', hrAdminSession)
    expect(moved.stage).toBe('TECHNICAL')
    await recruitmentService.moveCandidateStage(targetCandidate.id, originalStage, superAdminSession)
  })

  it('requires reports.view for reportService.attendanceByDepartment', async () => {
    const { reportService } = await import('./documents')
    const { setActiveSession } = await import('./demo/store')
    setActiveSession(null)

    await expect(reportService.attendanceByDepartment('2026-10-01', db.today, null)).rejects.toThrow(/Unauthorized/i)
    await expect(
      reportService.attendanceByDepartment('2026-10-01', db.today, anjaliMemberSession),
    ).rejects.toThrow(/Unauthorized/i)

    const hrReport = await reportService.attendanceByDepartment('2026-10-01', db.today, hrAdminSession)
    expect(hrReport.rows.length).toBeGreaterThan(0)
  })

  it('restricts reactivation of ARCHIVED employees exclusively to SUPER_ADMIN', async () => {
    // Archive EMP-006 as Super Admin
    const archived = await employeeService.deletePermanently('EMP-006', 'Archiving record for compliance test', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })
    expect(archived.status).toBe('ARCHIVED')

    // HR Admin attempting to reactivate an ARCHIVED employee must fail with an authorization error
    await expect(
      employeeService.reactivate('EMP-006', 'HR trying to unarchive', {
        name: hrAdminSession.name,
        role: 'HR_ADMIN',
      }),
    ).rejects.toThrow(/Only a Super Admin can reactivate an archived employee/i)

    // Super Admin can reactivate an ARCHIVED employee
    const reactivated = await employeeService.reactivate('EMP-006', 'Super Admin restoring archived record', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })
    expect(reactivated.status).toBe('ACTIVE')
    expect(reactivated.archivedAt).toBeUndefined()
  })

  it('validates cached active sessions against live account status and refreshes outdated roles in getActiveSession', async () => {
    const { getActiveSession, setActiveSession } = await import('./demo/store')

    const minaSession: SessionUser = {
      userId: 'USR-006',
      employeeId: 'EMP-006',
      name: 'Mina Tamang',
      email: 'mina.tamang@zeroinfinity.tech',
      role: 'EMPLOYEE',
      department: 'Marketing & IT',
      jobTitle: 'Growth Specialist',
    }

    // 1. Valid active session is returned
    setActiveSession(minaSession)
    expect(getActiveSession()?.employeeId).toBe('EMP-006')

    // 2. Deactivating EMP-006 immediately invalidates the cached session
    await employeeService.deactivate('EMP-006', 'Temporary suspension', {
      name: hrAdminSession.name,
      role: 'HR_ADMIN',
    })
    expect(getActiveSession()).toBeNull()

    // Restore EMP-006
    await employeeService.reactivate('EMP-006', 'Restored after suspension', {
      name: hrAdminSession.name,
      role: 'HR_ADMIN',
    })

    // 3. Terminating EMP-006 immediately invalidates the cached session
    setActiveSession(minaSession)
    await employeeService.terminate('EMP-006', {
      reason: 'Contract ended',
      actor: hrAdminSession.name,
      actorRole: 'HR_ADMIN',
    })
    expect(getActiveSession()).toBeNull()

    // Restore EMP-006
    await employeeService.reactivate('EMP-006', 'Restored after termination', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })

    // 4. Archiving EMP-006 immediately invalidates the cached session
    setActiveSession(minaSession)
    await employeeService.deletePermanently('EMP-006', 'Archived for test', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })
    expect(getActiveSession()).toBeNull()

    // Restore EMP-006
    await employeeService.reactivate('EMP-006', 'Restored after archive', {
      name: superAdminSession.name,
      role: 'SUPER_ADMIN',
    })

    // 5. Disabling user record directly immediately invalidates the cached session
    setActiveSession(minaSession)
    await settingsService.updateUser('USR-006', {
      role: 'EMPLOYEE',
      status: 'DISABLED',
      reason: 'Disabled user login',
      actor: superAdminSession.name,
      actorRole: 'SUPER_ADMIN',
    })
    expect(getActiveSession()).toBeNull()

    // Re-enable USR-006
    await settingsService.updateUser('USR-006', {
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      reason: 'Re-enabled user login',
      actor: superAdminSession.name,
      actorRole: 'SUPER_ADMIN',
    })

    // 6. Cached session with an outdated role is refreshed to the stored user role
    setActiveSession({
      ...minaSession,
      role: 'SUPER_ADMIN', // Forged/stale cached role while stored USR-006 role is EMPLOYEE
    })
    const validated = getActiveSession()
    expect(validated).not.toBeNull()
    expect(validated?.role).toBe('EMPLOYEE')

    setActiveSession(null)
  })

  it('cleans up active session on AuthProvider unmount and preserves login, logout, and demo role switching', async () => {
    const { createElement, useState } = await import('react')
    const { render, act } = await import('@testing-library/react')
    const { AuthProvider, useAuth } = await import('@/app/auth-context')
    const { DEMO_SESSIONS, getActiveSession, setActiveSession } = await import('./demo/store')

    let capturedAuth: ReturnType<typeof useAuth> | null = null
    function Probe() {
      capturedAuth = useAuth()
      return null
    }
    function Harness() {
      const [session, setSession] = useState<SessionUser | null>(superAdminSession)
      return createElement(AuthProvider, {
        session,
        setSession,
        demoSessions: DEMO_SESSIONS,
        children: createElement(Probe),
      })
    }

    const { unmount } = render(createElement(Harness))
    expect(capturedAuth).not.toBeNull()
    expect(getActiveSession()?.role).toBe('SUPER_ADMIN')

    // Switch demo role to HR_ADMIN
    act(() => {
      capturedAuth!.switchRoleDemo('HR_ADMIN')
    })
    expect(capturedAuth!.session?.role).toBe('HR_ADMIN')
    expect(getActiveSession()?.role).toBe('HR_ADMIN')

    // Sign out clears session
    act(() => {
      capturedAuth!.signOut()
    })
    expect(capturedAuth!.session).toBeNull()
    expect(getActiveSession()).toBeNull()

    // Sign in (setSession) as Employee
    act(() => {
      capturedAuth!.setSession(anjaliMemberSession)
    })
    expect(capturedAuth!.session?.employeeId).toBe('EMP-008')
    expect(getActiveSession()?.employeeId).toBe('EMP-008')

    // Unmounting AuthProvider cleans up the active session owned by that provider
    unmount()
    expect(getActiveSession()).toBeNull()

    setActiveSession(null)
  })
})



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
})

import type { OrgUser, AuditLogEntry, SessionUser } from '../../types/domain'

export const ORG_USERS: OrgUser[] = [
  { id: 'U-001', name: 'Admin', email: 'admin@zeroinfinity.tech', employeeId: null, role: 'SUPER_ADMIN', status: 'ACTIVE', lastActiveAt: '2026-10-28T17:42:00+05:45' },
  { id: 'U-002', name: 'Priya Rana', email: 'priya.rana@zeroinfinity.tech', employeeId: 'EMP-008', role: 'HR_ADMIN', status: 'ACTIVE', lastActiveAt: '2026-10-28T16:20:00+05:45' },
  { id: 'U-003', name: 'Mina Thapa', email: 'mina.thapa@zeroinfinity.tech', employeeId: 'EMP-003', role: 'HR_ADMIN', status: 'ACTIVE', lastActiveAt: '2026-10-28T15:05:00+05:45' },
  { id: 'U-004', name: 'Dharm Dev', email: 'dharm.dev@zeroinfinity.tech', employeeId: 'EMP-004', role: 'EMPLOYEE', status: 'ACTIVE', lastActiveAt: '2026-10-28T17:10:00+05:45' },
  { id: 'U-005', name: 'Kabir Joshi', email: 'kabir.joshi@zeroinfinity.tech', employeeId: 'EMP-009', role: 'EMPLOYEE', status: 'INVITED', lastActiveAt: '2026-10-14T11:00:00+05:45' },
  { id: 'U-006', name: 'Anusha Basnet', email: 'anusha.b@zeroinfinity.tech', employeeId: 'EMP-010', role: 'EMPLOYEE', status: 'DISABLED', lastActiveAt: '2026-09-30T18:00:00+05:45' },
]

export const AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'AUD-0041', actor: 'Admin', actorId: 'U-001', action: 'attendance.corrected', module: 'Attendance', target: 'EMP-001 · 26 Oct 2026', at: '2026-10-28T17:20:00+05:45', detail: 'Check-in corrected from 09:40 AM to 09:28 AM. Reason: kiosk sync delay verified.' },
  { id: 'AUD-0040', actor: 'Priya Rana', actorId: 'U-002', action: 'employee.status_changed', module: 'Employees', target: 'EMP-009 · Kabir Joshi', at: '2026-10-27T11:05:00+05:45', detail: 'Status set to Probation with reason "New joiner under review period".' },
  { id: 'AUD-0039', actor: 'Mina Thapa', actorId: 'U-003', action: 'leave.approved', module: 'Leave', target: 'LRV-2406 · Aarav Karki', at: '2026-10-27T10:04:00+05:45', detail: 'Annual leave for 23 Oct 2026 approved.' },
  { id: 'AUD-0038', actor: 'Admin', actorId: 'U-001', action: 'employee.updated', module: 'Employees', target: 'EMP-001 · Aarav Karki', at: '2026-10-26T10:42:00+05:45', detail: 'Contact and emergency details updated.' },
  { id: 'AUD-0037', actor: 'Admin', actorId: 'U-001', action: 'role.updated', module: 'Settings', target: 'U-005 · Kabir Joshi', at: '2026-10-26T09:15:00+05:45', detail: 'Invitation re-sent for EMPLOYEE role.' },
  { id: 'AUD-0036', actor: 'Priya Rana', actorId: 'U-002', action: 'employee.deactivated', module: 'Employees', target: 'EMP-010 · Anusha Basnet', at: '2026-09-30T18:05:00+05:45', detail: 'Workspace access disabled; records retained.' },
  { id: 'AUD-0035', actor: 'Sita Khatri', actorId: 'EMP-002', action: 'payroll.reviewed', module: 'Payroll', target: 'PRN-2026-09', at: '2026-09-30T16:40:00+05:45', detail: 'September payroll reviewed before approval.' },
]

export const DEMO_SESSIONS: SessionUser[] = [
  { id: 'U-001', name: 'Admin', employeeId: null, role: 'SUPER_ADMIN', email: 'admin@zeroinfinity.tech', title: 'Super admin', department: 'Administration' },
  { id: 'U-002', name: 'Priya Rana', employeeId: 'EMP-008', role: 'HR_ADMIN', email: 'priya.rana@zeroinfinity.tech', title: 'People Partner', department: 'Human Resources' },
  { id: 'U-004', name: 'Dharm Dev', employeeId: 'EMP-004', role: 'EMPLOYEE', email: 'dharm.dev@zeroinfinity.tech', title: 'Marketing Specialist', department: 'Marketing & IT' },
]

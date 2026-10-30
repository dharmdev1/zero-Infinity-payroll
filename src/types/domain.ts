import type { Role } from './rbac'

export type AvatarTone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray'

export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'INACTIVE' | 'TERMINATED' | 'ARCHIVED'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  name: string
  workEmail: string
  personalEmail: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  nationality: string
  address: string
  department: string
  jobTitle: string
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern'
  joiningDate: string
  reportingManager: string
  workLocation: string
  status: EmploymentStatus
  avatarTone?: AvatarTone
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  terminatedAt?: string
  terminationReason?: string
  deactivationReason?: string
  archivedAt?: string
  archiveReason?: string
}

export interface EmployeeDocument {
  id: string
  employeeId: string
  name: string
  category: string
  sizeKb: number
  uploadedAt: string
  verification: 'Verified' | 'Pending'
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'WEEKEND'
  | 'UPCOMING'
  | 'NO_RECORD'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  date: string
  checkIn: string | null
  checkOut: string | null
  workMinutes: number | null
  status: AttendanceStatus
  source: 'Kiosk' | 'Manual' | 'Remote' | 'System'
  version: number
  shiftLabel?: string
}

export interface AttendanceMonthSummary {
  employeeId: string
  month: string
  presentDays: number
  lateArrivals: number
  absentDays: number
  leaveDays: number
  averageWorkMinutes: number | null
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LeaveType = 'Annual' | 'Sick' | 'Casual'

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  department?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  submittedAt: string
  decidedBy?: string
  decidedAt?: string
  decisionNote?: string
}

export interface LeaveBalance {
  employeeId: string
  year: number
  leaveType: LeaveType
  totalDays: number
  usedDays: number
}

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
export type TaskPriority = 'High' | 'Medium' | 'Low'

export type ProjectPosition = 'PROJECT_LEAD' | 'TEAM_LEAD' | 'PROJECT_MEMBER'

export interface ProjectTeam {
  id: string
  projectId: string
  name: string
  leadId: string
  leadName: string
  memberIds: string[]
}

export interface WorkTask {
  id: string
  title: string
  description: string
  assigneeId: string
  assigneeName: string
  projectId?: string
  projectName?: string
  teamId?: string
  teamName?: string
  createdByEmployeeId?: string
  dueDate: string
  createdAt: string
  priority: TaskPriority
  status: TaskStatus
}

export type ProjectStatus = 'ON_TRACK' | 'AT_RISK' | 'COMPLETED'

export interface Project {
  id: string
  code: string
  name: string
  client: string
  leadId: string
  leadName: string
  status: ProjectStatus
  startedAt: string
  summary: string
  taskCount: number
  memberIds?: string[]
  teams?: ProjectTeam[]
}

export interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  employmentType: string
  openings: number
  applicantsCount: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  postedAt: string
}

export type CandidateStage = 'APPLIED' | 'SCREENING' | 'TECHNICAL' | 'HR_ROUND' | 'OFFER' | 'HIRED' | 'REJECTED'

export interface Candidate {
  id: string
  name: string
  email: string
  jobId: string
  jobTitle: string
  experience: string
  appliedAt: string
  stage: CandidateStage
}

export interface Interview {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  stage: string
  dateTime: string
  mode: 'ON_SITE' | 'REMOTE' | 'PHONE'
  interviewers: string[]
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  feedback?: string
}

export type PayrollRunStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PAID'

export interface PayrollRun {
  id: string
  period: string
  employeesCount: number
  totalGrossPaisa: number
  totalDeductionsPaisa: number
  totalNetPaisa: number
  status: PayrollRunStatus
  createdBy: string
  approvedBy?: string
  paidAt?: string
  notes?: string
}

export interface Payslip {
  id: string
  runId: string
  period: string
  employeeId: string
  employeeName: string
  department: string
  grossPaisa: number
  deductionsPaisa: number
  netPaisa: number
  status: 'DRAFT' | 'APPROVED' | 'PAID'
}

export interface CompanyDocument {
  id: string
  name: string
  category: 'Policy' | 'Template' | 'Compliance' | 'Handbook'
  summary: string
  owner: string
  uploadedBy: string
  sizeKb: number
  updatedAt: string
  visibility: string
}

export interface OrgUser {
  id: string
  name: string
  email: string
  employeeId: string | null
  role: Role
  status: 'ACTIVE' | 'INVITED' | 'DISABLED'
  lastActiveAt: string
}

export interface AuditLogEntry {
  id: string
  action: string
  module: 'Attendance' | 'Employees' | 'Leave' | 'Payroll' | 'Settings' | 'Projects' | 'Tasks'
  actor: string
  target: string
  detail: string
  at: string
  previousValue?: string
  newValue?: string
  reason?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  postedAt: string
  author: string
}

export interface DemoSession {
  userId: string
  employeeId: string
  name: string
  email: string
  role: Role
  department: string
  jobTitle: string
}

export type SessionUser = DemoSession

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

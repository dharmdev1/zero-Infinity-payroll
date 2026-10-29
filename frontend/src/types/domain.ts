import type { Role } from './rbac'

export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'INACTIVE'
export type Department =
  | 'Engineering'
  | 'Finance'
  | 'Human Resources'
  | 'Marketing & IT'
  | 'Design'
  | 'Operations'

export interface Employee {
  id: string
  name: string
  firstName: string
  lastName: string
  workEmail: string
  personalEmail: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  nationality: string
  address: string
  department: Department
  jobTitle: string
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern'
  joiningDate: string
  reportingManager: string
  workLocation: string
  status: EmploymentStatus
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  avatarTone: AvatarTone
}

export type AvatarTone = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'rose'

export interface EmployeeDocument {
  id: string
  employeeId: string
  name: string
  category: 'CV' | 'Identity' | 'Agreement' | 'Certificate' | 'Other'
  sizeKb: number
  uploadedAt: string
  verification: 'Verified' | 'Uploaded' | 'Rejected'
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'UPCOMING' | 'NO_RECORD'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: Department
  date: string
  checkIn: string | null
  checkOut: string | null
  workMinutes: number | null
  status: AttendanceStatus
  location: string | null
  source: 'kiosk' | 'remote' | 'manual-entry' | 'manual-correction'
  version: number
}

export interface AttendanceCorrectionDraft {
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  reason: string
}

export interface AttendanceSummary {
  presentDays: number
  absentDays: number
  leaveDays: number
  lateArrivals: number
  averageWorkMinutes: number | null
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  submittedAt: string
  decidedBy: string | null
  decidedAt: string | null
}

export interface LeaveBalanceCard {
  leaveType: LeaveType
  year: number
  usedDays: number
  totalDays: number
}

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export interface WorkTask {
  id: string
  title: string
  description: string
  projectId: string | null
  projectName: string | null
  assigneeId: string
  assigneeName: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
}

export interface Project {
  id: string
  name: string
  code: string
  client: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'
  leadId: string
  leadName: string
  summary: string
  startedAt: string
  taskCount: number
}

export interface JobPosting {
  id: string
  title: string
  department: Department
  location: string
  employmentType: string
  status: 'OPEN' | 'DRAFT' | 'CLOSED'
  openings: number
  applicants: number
  postedAt: string
  summary: string
}

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  jobTitle: string
  jobId: string
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED'
  appliedAt: string
  experience: string
  rating: number
  notes: string
}

export interface Interview {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  dateTime: string
  mode: 'ON_SITE' | 'REMOTE' | 'PHONE'
  interviewers: string[]
  stage: 'Technical' | 'HR' | 'Final' | 'Screening'
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  feedback: string | null
}

/** Monetary values are carried as paisa integers to stay decimal-safe. */
export type PaisaAmount = number

export type PayslipStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID'

export interface Payslip {
  id: string
  employeeId: string
  employeeName: string
  department: Department
  runId: string
  period: string
  status: PayslipStatus
  grossPaisa: PaisaAmount
  deductionsPaisa: PaisaAmount
  taxesPaisa: PaisaAmount
  netPaisa: PaisaAmount
}

export type PayrollRunStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PAID'

export interface PayrollRun {
  id: string
  period: string
  status: PayrollRunStatus
  employeesCount: number
  totalGrossPaisa: PaisaAmount
  totalDeductionsPaisa: PaisaAmount
  totalNetPaisa: PaisaAmount
  createdAt: string
  createdBy: string
  approvedBy: string | null
  notes: string
}

export interface CompanyDocument {
  id: string
  name: string
  category: 'Policy' | 'Template' | 'Report' | 'Shared' | 'Employee'
  owner: string
  sizeKb: number
  updatedAt: string
  visibility: 'All employees' | 'HR only' | 'Restricted'
  summary: string
  uploadedBy: string
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
  actor: string
  actorId: string
  action: string
  module: string
  target: string
  at: string
  detail: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  author: string
  postedAt: string
}

export interface SessionUser {
  id: string
  name: string
  employeeId: string | null
  role: Role
  email: string
  title: string
  department: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type SortDir = 'asc' | 'desc'

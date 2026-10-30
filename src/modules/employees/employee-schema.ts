import { z } from 'zod'

import { RELATIONSHIPS } from './constants'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')

export const employeeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  workEmail: z.string().trim().email('Enter a valid work email address'),
  personalEmail: z.string().trim().email('Enter a valid email').or(z.literal('')),
  phone: z.string().trim().min(6, 'Enter a valid phone number'),
  dateOfBirth: isoDate,
  gender: z.enum(['Male', 'Female', 'Other']),
  nationality: z.string().min(1),
  address: z.string().trim().min(1, 'Residential address is required'),
  department: z.string().min(1, 'Department is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']),
  joiningDate: isoDate,
  reportingManager: z.string().min(1, 'Reporting manager is required'),
  workLocation: z.string().min(1, 'Work location is required'),
  emergencyContactName: z.string().trim().min(1, 'Contact name is required'),
  emergencyContactRelationship: z.enum(RELATIONSHIPS as unknown as [string, ...string[]]),
  emergencyContactPhone: z.string().trim().min(6, 'Enter a valid phone number'),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>
export const RELATIONSHIP_OPTIONS = RELATIONSHIPS

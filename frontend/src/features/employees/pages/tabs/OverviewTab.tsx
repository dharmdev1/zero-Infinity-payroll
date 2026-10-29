import { InfoNote, Card, SectionTitle } from '@/components/ui/base'
import { DataField, FieldGrid } from '@/components/data-display/fields'
import type { Employee } from '@/types/domain'

function fullDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OverviewTab({ employee, restricted }: { employee: Employee; restricted: boolean }) {
  const personal: Array<{ label: string; value: string }> = [
    { label: 'Full name', value: employee.name },
    { label: 'Date of birth', value: restricted ? 'Restricted to HR' : fullDate(employee.dateOfBirth) },
    { label: 'Gender', value: restricted ? 'Restricted to HR' : employee.gender },
    { label: 'Work email', value: employee.workEmail },
    { label: 'Phone number', value: employee.phone },
    { label: 'Residential address', value: restricted ? 'Restricted to HR' : employee.address },
  ]
  const employment: Array<{ label: string; value: string }> = [
    { label: 'Department', value: employee.department },
    { label: 'Job title', value: employee.jobTitle },
    { label: 'Employment type', value: employee.employmentType },
    { label: 'Joining date', value: fullDate(employee.joiningDate) },
    { label: 'Reporting manager', value: employee.reportingManager },
    { label: 'Work location', value: employee.workLocation },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-6">
          <SectionTitle title="Personal & contact details" description={restricted ? 'Directory contact view — full details are HR-only.' : 'Employee information visible to authorized HR staff.'} />
          <FieldGrid fields={personal} />
        </Card>
        <Card className="p-6">
          <SectionTitle title="Employment information" />
          <FieldGrid fields={employment} />
        </Card>
        <InfoNote tone="blue">
          {restricted
            ? 'Directory viewers see contact details only. Personal and employment records are HR-restricted.'
            : 'Compensation details are restricted to Payroll. They are not displayed or editable in Employee Management.'}
        </InfoNote>
      </div>

      <div className="space-y-4">
        <DocumentCard employee={employee} />
        <EmergencyCard employee={employee} restricted={restricted} />
      </div>
    </div>
  )
}

function DocumentCard({ employee }: { employee: Employee }) {
  const files = [
    { name: `${employee.name.replace(/\s+/g, '_')}_CV.pdf`, sizeKb: 486 },
    { name: 'Employment_agreement.pdf', sizeKb: 1200 },
    { name: 'Identity_document.pdf', sizeKb: 842 },
  ]
  return (
    <Card className="p-6">
      <SectionTitle title="Documents" description={`${files.length} files · Secure employee records`} />
      <ul className="mt-3 space-y-3">
        {files.map((f) => (
          <li key={f.name} className="flex items-center justify-between gap-2 border-b border-line pb-3 last:border-b-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{f.name}</p>
              <p className="text-xs text-muted">{f.sizeKb} KB</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-2.5 py-1 text-xs font-medium text-success">● Verified</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function EmergencyCard({ employee, restricted }: { employee: Employee; restricted: boolean }) {
  return (
    <Card className="p-6">
      <SectionTitle title="Emergency contact" description="Accessible to authorized HR staff" />
      {!restricted ? (
        <div className="mt-3 space-y-3">
          <DataField label="Contact name & relationship" value={`${employee.emergencyContactName} · ${employee.emergencyContactRelationship}`} />
          <DataField label="Phone number" value={employee.emergencyContactPhone} />
        </div>
      ) : (
        <InfoNote tone="orange">Contact details are HR-restricted.</InfoNote>
      )}
    </Card>
  )
}

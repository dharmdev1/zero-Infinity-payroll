import { Card, InfoNote, SectionTitle } from '@/components/ui/base'
import { HairlineList } from '@/components/data-display/fields'
import type { Employee } from '@/types/domain'

export function OverviewTab({ employee, restricted }: { employee: Employee; restricted?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-6">
        <SectionTitle title="Personal & contact" />
        <div className="mt-4">
          <HairlineList
            rows={[
              { label: 'Full name', value: employee.name },
              { label: 'Work email', value: employee.workEmail },
              { label: 'Phone', value: employee.phone },
              ...(restricted
                ? []
                : [
                    { label: 'Personal email', value: employee.personalEmail },
                    { label: 'Date of birth', value: employee.dateOfBirth },
                    { label: 'Gender', value: employee.gender },
                    { label: 'Nationality', value: employee.nationality },
                    { label: 'Address', value: employee.address },
                  ]),
            ]}
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle title="Employment details" />
        <div className="mt-4">
          <HairlineList
            rows={[
              { label: 'Employee ID', value: employee.id },
              { label: 'Department', value: employee.department },
              { label: 'Job title', value: employee.jobTitle },
              { label: 'Employment type', value: employee.employmentType },
              { label: 'Joining date', value: employee.joiningDate },
              { label: 'Reporting manager', value: employee.reportingManager },
              { label: 'Work location', value: employee.workLocation },
            ]}
          />
        </div>
      </Card>

      {!restricted ? (
        <Card className="p-6 lg:col-span-2">
          <SectionTitle title="Emergency contact" description="Accessible to authorized HR staff." />
          <div className="mt-4">
            <HairlineList
              rows={[
                { label: 'Contact name', value: employee.emergencyContactName },
                { label: 'Relationship', value: employee.emergencyContactRelationship },
                { label: 'Phone', value: employee.emergencyContactPhone },
              ]}
            />
          </div>
        </Card>
      ) : null}

      <div className="lg:col-span-2">
        <InfoNote tone="blue">
          Compensation data is excluded from employee profiles and remains restricted to the Payroll module.
        </InfoNote>
      </div>
    </div>
  )
}

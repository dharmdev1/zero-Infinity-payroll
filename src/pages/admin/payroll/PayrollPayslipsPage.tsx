import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/ui/base'
import { FilterSelect } from '@/components/ui/overlay'
import { Pagination } from '@/components/data-display/table'
import { payrollService } from '@/services/payroll'
import { useAuth } from '@/app/auth-context'
import { useHeader, PageHeaderBar } from '@/components/layout/page-header'
import { PayslipTable } from '@/modules/payroll/PayslipTable'

export function PayrollPayslipsPage() {
  useHeader('Payslips', [{ label: 'Workspace' }, { label: 'Payroll', to: '/payroll' }, { label: 'Payslips' }])
  const { session } = useAuth()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const slips = useQuery({
    queryKey: ['payroll', 'payslips', { status, page, role: session?.role }],
    placeholderData: keepPreviousData,
    queryFn: () => payrollService.payslips({ ...(status ? { status } : {}), page, pageSize: 15 }, session),
  })

  return (
    <div className="space-y-4">
      <PageHeaderBar title="Payslips" description="Payslips by period and employee. Download links are generated server-side.">
        <FilterSelect
          className="w-44"
          label="Status filter"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'PAID', label: 'Paid' },
          ]}
        />
      </PageHeaderBar>

      <PayslipTable
        rows={slips.data?.items ?? []}
        loading={slips.isLoading}
        withEmployeeLinks={false}
        withDownload
        emptyState={<EmptyState title="No payslips match" />}
        footer={<Pagination page={page} pageSize={15} total={slips.data?.total ?? 0} onPage={setPage} countsLabel="payslips" />}
      />
    </div>
  )
}

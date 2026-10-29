import type { AvatarTone, Department, Employee } from '../../types/domain'

export const DEMO_TODAY = '2026-10-28'

export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(...parts: Array<string | number>): number {
  let h = 2166136261
  for (const p of parts) {
    const s = String(p)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
  }
  return h >>> 0
}

const TONES: AvatarTone[] = ['blue', 'green', 'orange', 'purple', 'teal', 'rose']

export function toneForId(id: string): AvatarTone {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return TONES[h % TONES.length]
}

const GENERATED_NAMES: Array<[string, string]> = [
  ['Binita', 'Chaudhary'], ['Sujan', 'Magar'], ['Laxmi', 'Bhandari'], ['Prakash', 'Adhikari'],
  ['Sabina', 'Karki'], ['Bikash', 'Thapa'], ['Rekha', 'Dahal'], ['Nabin', 'Gurung'],
  ['Anjali', 'Rana'], ['Deepak', 'Shrestha'], ['Krishna', 'Bahadur'], ['Susmita', 'Rai'],
  ['Rajat', 'Nepal'], ['Pooja', 'Silwal'], ['Arun', 'Khatiwada'], ['Samir', 'Tamang'],
  ['Kelly', 'Rijal'], ['Mohan', 'Pandey'], ['Shristi', 'Lama'], ['Dinesh', 'Sapkota'],
  ['Rita', 'Aryal'], ['Ashish', 'Kumar'], ['Bhawana', 'Thakuri'], ['Ganesh', 'Poudel'],
  ['Lakpa', 'Sherpa'], ['Manish', 'Bhujel'], ['Niraj', 'Shah'], ['Samiksha', 'Timilsina'],
  ['Tulsi', 'Baral'], ['Umesh', 'Chalise'], ['Bimala', 'Neupane'], ['Chandra', 'Bahadur'],
  ['Dipesh', 'Ghimire'], ['Esha', 'Upreti'], ['Fulmati', 'Yadav'], ['Gaurav', 'Regmi'],
  ['Hari', 'Prasad'], ['Madhav', 'Dulal'],
]

const DEPARTMENTS: Department[] = ['Engineering', 'Finance', 'Human Resources', 'Marketing & IT', 'Design', 'Operations']

const TITLES: Record<Department, string[]> = {
  Engineering: ['Backend Engineer', 'Frontend Engineer', 'DevOps Engineer', 'Data Analyst'],
  Finance: ['Accounts Officer', 'Finance Associate', 'Treasury Analyst'],
  'Human Resources': ['HR Officer', 'Recruiter', 'HR Generalist'],
  'Marketing & IT':['Content Strategist', 'IT Support Specialist', 'Growth Marketer'],
  Design: ['Visual Designer', 'Motion Designer', 'Product Illustrator'],
  Operations: ['Operations Executive', 'Logistics Coordinator', 'Facilities Officer'],
}

const LOCATIONS = ['Kathmandu · Hybrid', 'Kathmandu · On-site', 'Lalitpur · On-site', 'Remote · Nepal']

const JOIN_DATES = [
  '02 Feb 2025', '14 Nov 2023', '19 Jun 2025', '07 Mar 2023', '21 Sep 2024', '25 Apr 2025',
  '01 Nov 2023', '11 Aug 2025', '17 Jan 2024', '20 May 2025', '09 Aug 2024', '28 Feb 2025',
  '13 Oct 2023', '02 Dec 2024', '22 Jul 2025', '05 Jun 2024', '30 Mar 2023', '18 Jan 2025',
  '08 Sep 2024', '27 Nov 2023', '16 Jun 2025', '23 Apr 2024', '12 Oct 2023', '14 Feb 2025',
  '26 Aug 2024', '19 May 2025', '07 Dec 2023', '11 Mar 2024', '25 Oct 2024', '03 Jan 2025',
  '29 Jul 2024', '18 Apr 2025', '10 Sep 2023', '06 Nov 2024', '24 Feb 2025', '15 Jun 2023',
  '09 Mar 2025', '21 Aug 2023',
]

function demoJob(deptIdx: number, i: number): string {
  const dept = DEPARTMENTS[deptIdx % DEPARTMENTS.length]
  const list = TITLES[dept]
  return list[i % list.length]
}

function yearFromDmy(dmy: string): string {
  const [d, m, y] = dmy.split(' ')
  return `${y}-${{ Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }[m]}-${d?.padStart(2, '0')}`
}

const HANDMADE: Employee[] = [
  ['EMP-001', 'Aarav', 'Karki', 'Engineering', 'Software Engineer', 'aarav.karki@zeroinfinity.tech', '12 Jan 2024', 'ACTIVE', 'Lazimpat, Kathmandu, Nepal', 'Rohan Shrestha', 'blue'],
  ['EMP-002', 'Sita', 'Khatri', 'Finance', 'Finance Analyst', 'sita.khatri@zeroinfinity.tech', '05 Feb 2024', 'ACTIVE', 'Baneshwor, Kathmandu, Nepal', 'Sagar Rana', 'green'],
  ['EMP-003', 'Mina', 'Thapa', 'Human Resources', 'HR Executive', 'mina.thapa@zeroinfinity.tech', '18 Mar 2024', 'ACTIVE', 'Jhamsikhel, Lalitpur, Nepal', 'Priya Rana', 'orange'],
  ['EMP-004', 'Dharm', 'Dev', 'Marketing & IT', 'Marketing Specialist', 'dharm.dev@zeroinfinity.tech', '08 Apr 2024', 'ACTIVE', 'Chakupat, Lalitpur, Nepal', 'Priya Rana', 'purple'],
  ['EMP-005', 'Nisha', 'Gurung', 'Design', 'UI/UX Designer', 'nisha.gurung@zeroinfinity.tech', '15 Jul 2024', 'ACTIVE', 'Baluwatar, Kathmandu, Nepal', 'Rohan Shrestha', 'teal'],
  ['EMP-006', 'Rohan', 'Shrestha', 'Engineering', 'Engineering Lead', 'rohan.s@zeroinfinity.tech', '02 Jan 2023', 'ACTIVE', 'Durbarmarg, Kathmandu, Nepal', 'Admin', 'rose'],
  ['EMP-007', 'Anil', 'Poudel', 'Operations', 'Operations Associate', 'anil.poudel@zeroinfinity.tech', '07 Oct 2026', 'PROBATION', 'Sanepa, Lalitpur, Nepal', 'Sagar Rana', 'blue'],
  ['EMP-008', 'Priya', 'Rana', 'Human Resources', 'People Partner', 'priya.rana@zeroinfinity.tech', '19 Aug 2024', 'ACTIVE', 'Pulchowk, Lalitpur, Nepal', 'Admin', 'green'],
  ['EMP-009', 'Kabir', 'Joshi', 'Engineering', 'QA Engineer', 'kabir.joshi@zeroinfinity.tech', '12 Oct 2026', 'PROBATION', 'Thapathali, Kathmandu, Nepal', 'Rohan Shrestha', 'orange'],
  ['EMP-010', 'Anusha', 'Basnet', 'Design', 'Graphic Designer', 'anusha.b@zeroinfinity.tech', '11 Nov 2023', 'INACTIVE', 'Tripureshwor, Kathmandu, Nepal', 'Rohan Shrestha', 'purple'],
].map(([id, firstName, lastName, dept, jobTitle, email, joining, status, address, manager, tone]) => {
  const phone = `+977 980 100 ${(Number(id.split('-')[1]) + 2000).toString().padStart(4, '0')}`
  return {
    id: id as string,
    name: `${firstName} ${lastName}`,
    firstName: firstName as string,
    lastName: lastName as string,
    workEmail: email as string,
    personalEmail: `${(firstName as string).toLowerCase()}.${(lastName as string).toLowerCase()}@example.com`,
    phone,
    dateOfBirth: '18 May 1997',
    gender: (Number(id?.split('-')[1]) % 2 === 0 ? 'Female' : 'Male') as Employee['gender'],
    nationality: 'Nepali',
    address: address as string,
    department: dept as Department,
    jobTitle: jobTitle as string,
    employmentType: 'Full-time',
    joiningDate: yearFromDmy(joining as string),
    reportingManager: manager as string,
    workLocation: 'Kathmandu · Hybrid',
    status: status as Employee['status'],
    emergencyContactName: 'Household member',
    emergencyContactRelationship: 'Sibling',
    emergencyContactPhone: phone,
    avatarTone: tone as AvatarTone,
  } satisfies Employee
})

export function buildEmployees(): Employee[] {
  const generated: Employee[] = GENERATED_NAMES.map(([first, last], i) => {    const num = 11 + i
    const id = `EMP-${String(num).padStart(3, '0')}`
    const deptIdx = (i * 5 + 3) % 6
    const dept = DEPARTMENTS[deptIdx]
    // 12 Dec 2023 (11 i=0) ... deterministic membership: 27 more +1 inactive, 1 probation
    const status = i === 36 ? 'INACTIVE' : i === 21 ? 'PROBATION' : 'ACTIVE'
    return {
      id,
      name: `${first} ${last}`,
      firstName: first,
      lastName: last,
      workEmail: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@zeroinfinity.tech`,
      personalEmail: `${first.toLowerCase()}${num}@example.com`,
      phone: `+977 980 100 ${(num + 2000).toString().padStart(4, '0')}`,
      dateOfBirth: '14 Mar 1996',
      gender: i % 2 === 0 ? 'Female' : 'Male',
      nationality: 'Nepali',
      address: 'Kathmandu, Nepal',
      department: dept,
      jobTitle: demoJob(deptIdx, num),
      employmentType: 'Full-time',
      joiningDate: yearFromDmy(JOIN_DATES[i]),
      reportingManager: i < 12 ? 'Rohan Shrestha' : 'Priya Rana',
      workLocation: LOCATIONS[i % LOCATIONS.length],
      status: status as Employee['status'],
      emergencyContactName: 'Family member',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: `+977 984 100 ${(num + 2000).toString().padStart(4, '0')}`,
      avatarTone: toneForId(id),
    } satisfies Employee
  })
  return [...HANDMADE, ...generated]
}

/** Demo snapshot roster — development-only, never a source of truth. */
export const EMPLOYEES: Employee[] = buildEmployees()

export const DEMO_HEADCOUNT = EMPLOYEES.length

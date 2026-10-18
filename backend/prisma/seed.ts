import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DEVELOPMENT ONLY. Change these passwords (or delete these accounts) before going live.
const password = process.env.SEED_PASSWORD ?? 'Uhwf@2026!'

async function main() {
  const passwordHash = await bcrypt.hash(password, 12)

  // ---- Departments ----
  const departmentNames = [
    'Wildlife Management',
    'Land Use Planning',
    'Community Development',
    'Finance and Administration',
    'ICT',
  ]
  for (const name of departmentNames) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } })
  }
  const dept = async (name: string) =>
    prisma.department.findUniqueOrThrow({ where: { name } })

  // ---- Staff accounts (one per role). Existing accounts are left unchanged. ----
  await prisma.user.upsert({
    where: { email: 'admin@uhwf.or.tz' },
    update: {},
    create: { fullName: 'System Admin', email: 'admin@uhwf.or.tz', passwordHash, role: 'admin' },
  })

  await prisma.user.upsert({
    where: { email: 'ict@uhwf.or.tz' },
    update: {},
    create: { fullName: 'ICT Officer', email: 'ict@uhwf.or.tz', passwordHash, role: 'ict' },
  })

  await prisma.user.upsert({
    where: { email: 'lecturer@uhwf.or.tz' },
    update: {},
    create: {
      fullName: 'Juma Kimaro',
      email: 'lecturer@uhwf.or.tz',
      passwordHash,
      role: 'lecturer',
      lecturerProfile: {
        create: {
          staffId: 'LEC-0001',
          qualification: 'Masters',
          departmentId: (await dept('Wildlife Management')).id,
        },
      },
    },
  })

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@uhwf.or.tz' } })
  await prisma.user.upsert({
    where: { email: 'employee@uhwf.or.tz' },
    update: {},
    create: {
      fullName: 'Grace Lyimo',
      email: 'employee@uhwf.or.tz',
      passwordHash,
      role: 'employee',
      employeeProfile: {
        create: {
          staffId: 'EMP-0001',
          position: 'Accountant',
          departmentId: (await dept('Finance and Administration')).id,
          supervisorId: admin.id,
        },
      },
    },
  })

  // ---- Courses (the first three are taught by the demo lecturer) ----
  const lecturer = await prisma.lecturerProfile.findUniqueOrThrow({ where: { staffId: 'LEC-0001' } })
  const courses = [
    { code: 'WLM101', title: 'Wildlife management basics', credits: 3, dept: 'Wildlife Management', lec: true },
    { code: 'LUP102', title: 'Land use planning', credits: 3, dept: 'Land Use Planning', lec: true },
    { code: 'HWC103', title: 'Human-wildlife conflict', credits: 3, dept: 'Wildlife Management', lec: true },
    { code: 'CEN104', title: 'Community engagement', credits: 2, dept: 'Community Development', lec: false },
    { code: 'GIS105', title: 'GIS and mapping', credits: 3, dept: 'Land Use Planning', lec: false },
    { code: 'RES106', title: 'Research methods', credits: 2, dept: 'Wildlife Management', lec: false },
  ]
  for (const c of courses) {
    await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        title: c.title,
        credits: c.credits,
        departmentId: (await dept(c.dept)).id,
        lecturerId: c.lec ? lecturer.id : null,
      },
    })
  }

  // ---- Settings (admission window and fee). Change these to open or close admission. ----
  const settings: Record<string, string> = {
    'admission.intake': '2026/2027',
    'admission.opensOn': '2026-09-01',
    'admission.closesOn': '2026-11-30',
    'admission.fee': '50000',
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } })
  }

  // ---- A demo applicant, so the student dashboard can be tried straight away ----
  await prisma.user.upsert({
    where: { email: 'student@uhwf.or.tz' },
    update: {},
    create: {
      fullName: 'Neema Mollel',
      email: 'student@uhwf.or.tz',
      phone: '+255700000000',
      passwordHash,
      role: 'student',
      application: { create: { intake: settings['admission.intake'] } },
    },
  })

  console.log('Seed complete. Demo accounts (password from SEED_PASSWORD or the default in seed.ts):')
  console.log('  admin@uhwf.or.tz, ict@uhwf.or.tz, lecturer@uhwf.or.tz, employee@uhwf.or.tz, student@uhwf.or.tz')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

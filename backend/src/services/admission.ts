// import { prisma } from '../prisma'

// export type AdmissionStatus = 'open' | 'upcoming' | 'closed'

// export type AdmissionInfo = {
//   intake: string
//   opensOn: string
//   closesOn: string
//   fee: number
//   status: AdmissionStatus
// }

// // Admission dates are calendar days in Tanzania time (UTC+3).
// const TZ = '+03:00'

// export async function getAdmission(): Promise<AdmissionInfo> {
//   const rows = await prisma.setting.findMany({
//     where: { key: { startsWith: 'admission.' } },
//   })
//   const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

//   const intake = map['admission.intake'] ?? ''
//   const opensOn = map['admission.opensOn'] ?? ''
//   const closesOn = map['admission.closesOn'] ?? ''
//   const fee = Number(map['admission.fee'] ?? 0)

//   let status: AdmissionStatus = 'closed'
//   if (opensOn && closesOn) {
//     const now = new Date()
//     const opens = new Date(`${opensOn}T00:00:00${TZ}`)
//     const closes = new Date(`${closesOn}T23:59:59${TZ}`)
//     if (now < opens) status = 'upcoming'
//     else if (now <= closes) status = 'open'
//   }

//   return { intake, opensOn, closesOn, fee, status }
// }
import { prisma } from '../prisma'

export type AdmissionStatus = 'open' | 'upcoming' | 'closed'

export type AdmissionInfo = {
  intake: string
  opensOn: string
  closesOn: string
  fee: number
  maxCourses: number
  // the administrator's master switch: false closes admission at once, whatever the dates say
  enabled: boolean
  status: AdmissionStatus
}

// Admission dates are calendar days in Tanzania time (UTC+3).
const TZ = '+03:00'
const DEFAULT_MAX_COURSES = 3

export async function getAdmission(): Promise<AdmissionInfo> {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: 'admission.' } },
  })
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  const intake = map['admission.intake'] ?? ''
  const opensOn = map['admission.opensOn'] ?? ''
  const closesOn = map['admission.closesOn'] ?? ''
  const fee = Number(map['admission.fee'] ?? 0)
  const enabled = map['admission.enabled'] !== 'false' // not set = on
  const maxRaw = Number.parseInt(map['admission.maxCourses'] ?? '', 10)
  const maxCourses = Number.isInteger(maxRaw) && maxRaw >= 1 && maxRaw <= 10 ? maxRaw : DEFAULT_MAX_COURSES

  let status: AdmissionStatus = 'closed'
  if (enabled && opensOn && closesOn) {
    const now = new Date()
    const opens = new Date(`${opensOn}T00:00:00${TZ}`)
    const closes = new Date(`${closesOn}T23:59:59${TZ}`)
    if (now < opens) status = 'upcoming'
    else if (now <= closes) status = 'open'
  }

  return { intake, opensOn, closesOn, fee, maxCourses, enabled, status }
}

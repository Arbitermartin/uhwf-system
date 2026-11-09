import { api } from './api'

export const memberInterests = [
  { key: 'events', label: 'Events and workshops' },
  { key: 'volunteering', label: 'Volunteering' },
  { key: 'donating', label: 'Donating' },
  { key: 'research', label: 'Research and reports' },
  { key: 'community', label: 'Community programmes' },
] as const

export type InterestKey = (typeof memberInterests)[number]['key']

export const interestLabel = (key: string) => memberInterests.find((i) => i.key === key)?.label ?? key

export type RegisterMemberInput = {
  fullName: string
  email: string
  phone: string
  gender: '' | 'female' | 'male'
  region: string
  interests: InterestKey[]
  newsletter: boolean
  password: string
  agree: boolean
  website: string // the hidden field for bots, always empty for real visitors
}

export type RegisterMemberReply = { message: string; memberNumber: string | null; welcomeEmail: boolean }

export type MyMembership = {
  name: string
  memberNumber: string
  region: string | null
  interests: string[]
  newsletter: boolean
  joinedAt: string
  validUntil: string
  status: 'active' | 'expired'
  daysLeft: number
}

export const registerMember = async (data: RegisterMemberInput) =>
  (await api.post<RegisterMemberReply>('/members/register', data)).data

export const getMyMembership = async () => (await api.get<{ member: MyMembership }>('/members/me')).data.member

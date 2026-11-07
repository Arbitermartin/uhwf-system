import { api } from './api'

export type InnovationInput = {
    fullName: string
    email: string
    phone: string
    region: string
    category: string
    title: string
    description: string
    stage: string
    beneficiaries: string
    link: string
    consent: boolean
    website: string
}

export const submitInnovation = async (data: InnovationInput) =>
    (await api.post<{ id: number; message: string }>('/public/innovations', data)).data
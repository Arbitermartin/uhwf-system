import { api } from './api'

export type AdminPartner = {
    id: number
    name: string
    description: string
    website: string
    active: boolean
    sortOrder: number
    logoUrl: string | null
}

export type PublicPartner = {
    id: number
    name: string
    description: string
    website: string | null
    logoUrl: string | null
}

export type PartnerInput = {
    name: string
    description: string
    website: string
    active: boolean
    logo: File | null
    removeLogo: boolean
}

const toForm = (d: PartnerInput) => {
    const f = new FormData()
    f.append('name', d.name)
    f.append('description', d.description)
    f.append('website', d.website)
    f.append('active', String(d.active))
    f.append('removeLogo', String(d.removeLogo))
    if (d.logo) f.append('logo', d.logo)
    return f
}

export const listAdminPartners = async () => (await api.get<{ partners: AdminPartner[] }>('/admin/partners')).data.partners

export const createPartner = async (d: PartnerInput) =>
    (await api.post<{ partner: AdminPartner }>('/admin/partners', toForm(d))).data.partner

export const updatePartner = async (id: number, d: PartnerInput) =>
    (await api.post<{ partner: AdminPartner }>(`/admin/partners/${id}`, toForm(d))).data.partner

export const deletePartner = async (id: number) => {
    await api.post(`/admin/partners/${id}/delete`)
}

export const movePartner = async (id: number, direction: 'up' | 'down') => {
    await api.post(`/admin/partners/${id}/move`, { direction })
}

export const listPublicPartners = async () => (await api.get<{ partners: PublicPartner[] }>('/public/partners')).data.partners
import type { Workspace } from '@/types'
import { storage } from './storage'

const KEY = 'workspace.current'

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-zenia',
    name: 'Zenia Wellness',
    nameTh: 'ซีเนีย เวลเนส',
    industry: 'อาหารเสริม / ผลิตภัณฑ์สุขภาพ',
    description: 'ผงผัก, น้ำมันกระเทียม, B9, โปรเตเลเซ — ขายผ่าน Facebook / Line / TikTok',
    color: 'from-brand-400 to-coral-500',
    icon: '🌿',
    members: 12,
    dataSource: 'Shopify + Cloudbeds CRM',
    lastUpdated: '2026-05-17T08:00:00+07:00',
  },
  {
    id: 'ws-aurora',
    name: 'Aurora Beauty Co.',
    nameTh: 'ออโรร่า บิวตี้',
    industry: 'เครื่องสำอาง / สกินแคร์',
    description: 'แบรนด์สกินแคร์เกาหลี-ไทย ขายผ่าน Shopee / Lazada / TikTok Shop',
    color: 'from-coral-400 to-pink-500',
    icon: '💄',
    members: 8,
    dataSource: 'WooCommerce + LINE OA',
    lastUpdated: '2026-05-17T11:30:00+07:00',
  },
  {
    id: 'ws-petto',
    name: 'Petto Pet Store',
    nameTh: 'เพ็ตโตะ',
    industry: 'อาหารและของเล่นสัตว์เลี้ยง',
    description: 'อาหารแมว/หมา premium, ของเล่น, ขายผ่าน CRM + หน้าร้าน 4 สาขา',
    color: 'from-amber-400 to-brand-500',
    icon: '🐾',
    members: 5,
    dataSource: 'Internal POS + Facebook Ads',
    lastUpdated: '2026-05-16T22:00:00+07:00',
  },
]

export const workspaces = {
  list: () => WORKSPACES,
  current(): Workspace | null {
    const id = storage.get<string | null>(KEY, null)
    if (!id) return null
    return WORKSPACES.find((w) => w.id === id) ?? null
  },
  setCurrent(id: string) {
    storage.set(KEY, id)
    window.dispatchEvent(new Event('eiz-workspace-changed'))
  },
  clear() {
    storage.remove(KEY)
    window.dispatchEvent(new Event('eiz-workspace-changed'))
  },
}

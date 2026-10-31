import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function Settings() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const res = await adminApi.getSettings()
      setSettings(res.data || {})
    } catch { toast.error('Failed to load settings') }
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await adminApi.updateSettings(settings)
      toast.success('Settings saved')
    } catch { toast.error('Failed to save') }
    finally { setLoading(false) }
  }

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      <Card>
        <div className="space-y-4">
          <Input label="Shop Name" value={settings.shopName || ''} onChange={e => update('shopName', e.target.value)} />
          <Input label="Shop Email" value={settings.shopEmail || ''} onChange={e => update('shopEmail', e.target.value)} />
          <Input label="Shop Phone" value={settings.shopPhone || ''} onChange={e => update('shopPhone', e.target.value)} />
          <Input label="Shop Address" value={settings.shopAddress || ''} onChange={e => update('shopAddress', e.target.value)} />
          <Input label="Currency" value={settings.currency || ''} onChange={e => update('currency', e.target.value)} />
          <Button onClick={handleSave} loading={loading}>Save Settings</Button>
        </div>
      </Card>
    </div>
  )
}

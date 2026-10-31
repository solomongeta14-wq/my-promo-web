import { useState } from 'react'
import { shopApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await shopApi.submitContact(form)
      setDone(true)
    } catch {
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Contact Us</h1>
      {done ? (
        <Card className="text-center py-12">
          <p className="text-neutral-600">Thank you! Your message has been sent.</p>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
            <Textarea label="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
            <Button type="submit" loading={loading}>Send Message</Button>
          </form>
        </Card>
      )}
    </div>
  )
}

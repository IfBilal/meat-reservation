'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MEAT_TYPES } from '@/lib/constants'
import { MeatCounter } from './MeatCounter'
import { OrderSuccessMessage } from './OrderSuccessMessage'

type FormState = {
  customer_name: string
  customer_phone: string
  customer_email: string
  pickup_date: string
  tire_lbs: number
  kitfo_lbs: number
  tibs_lbs: number
  godin_lbs: number
  gubet_lbs: number
  kidney_lbs: number
  notes: string
}

const INITIAL: FormState = {
  customer_name: '', customer_phone: '', customer_email: '',
  pickup_date: '', tire_lbs: 0, kitfo_lbs: 0, tibs_lbs: 0,
  godin_lbs: 0, gubet_lbs: 0, kidney_lbs: 0, notes: '',
}

const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent transition-shadow'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

export function OrderForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const supabase = createClient()
  const totalLbs = MEAT_TYPES.reduce((sum, mt) => sum + form[mt.key], 0)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.customer_name.trim()) return setError('Please enter your name.')
    if (!form.customer_phone.trim()) return setError('Please enter your phone number.')
    if (!form.customer_email.trim()) return setError('Please enter your email address.')
    if (!form.pickup_date) return setError('Please select a pickup date.')
    if (totalLbs === 0) return setError('Please select at least one meat type.')

    setLoading(true)

    const { error: insertError } = await supabase.from('orders').insert([{
      customer_name:  form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim(),
      pickup_date:    form.pickup_date,
      tire_lbs:       form.tire_lbs,
      kitfo_lbs:      form.kitfo_lbs,
      tibs_lbs:       form.tibs_lbs,
      godin_lbs:      form.godin_lbs,
      gubet_lbs:      form.gubet_lbs,
      kidney_lbs:     form.kidney_lbs,
      notes:          form.notes.trim() || null,
      status:         'pending',
    }])

    setLoading(false)

    if (insertError) {
      setError('Something went wrong submitting your order. Please try again.')
      return
    }

    setSubmittedEmail(form.customer_email)
    setSuccess(true)
  }

  if (success) {
    return <OrderSuccessMessage email={submittedEmail} onReset={() => { setForm(INITIAL); setSuccess(false) }} />
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Reserve Your Meat</h2>
        <p className="text-gray-500 text-sm">We&apos;ll confirm your order by phone. Pick up at Ahadu Market.</p>
      </div>

      {/* Personal Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter your full name"
              value={form.customer_name}
              onChange={e => setField('customer_name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              className={inputClass}
              placeholder="e.g. 513-000-0000"
              value={form.customer_phone}
              onChange={e => setField('customer_phone', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={inputClass}
              placeholder="your@email.com"
              value={form.customer_email}
              onChange={e => setField('customer_email', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Pickup Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={inputClass}
              min={new Date().toISOString().split('T')[0]}
              value={form.pickup_date}
              onChange={e => setField('pickup_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Meat Selection */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8B0000] inline-block"></span>
          Select Your Meats (in pounds)
        </h3>
        <div className="bg-gray-50 rounded-xl px-4 border border-gray-100">
          {MEAT_TYPES.map(mt => (
            <MeatCounter
              key={mt.key}
              label={mt.label}
              description={mt.description}
              value={form[mt.key]}
              onChange={val => setField(mt.key, val)}
            />
          ))}
        </div>
        {totalLbs > 0 && (
          <p className="text-sm text-gray-500 mt-2 text-right">
            Total: <span className="font-semibold text-gray-700">{totalLbs} lbs</span>
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Special Requests <span className="text-gray-400 font-normal">(Optional)</span></label>
        <textarea
          className={inputClass}
          rows={3}
          placeholder="e.g. Please call me when ready"
          value={form.notes}
          onChange={e => setField('notes', e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] disabled:bg-gray-400 text-white text-base font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Submitting...
          </>
        ) : 'Submit Order'}
      </button>

      <p className="text-center text-xs text-gray-400">Your order is saved securely.</p>
    </form>
  )
}

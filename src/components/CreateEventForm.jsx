import { useState } from 'react'
import { toast } from 'sonner'
import DatePicker from 'react-datepicker'
import { createEvent } from '../services/events'

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm'

export default function CreateEventForm({ clubId, onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState(null)
  const [endsAt, setEndsAt] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const now = new Date()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (!startsAt) {
      toast.error('Start date and time are required.')
      return
    }
    if (startsAt.getTime() <= Date.now()) {
      toast.error('Start time must be in the future.')
      return
    }
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      toast.error('End time must be after start time.')
      return
    }

    setSubmitting(true)
    try {
      const input = {
        clubId,
        title: title.trim(),
        startsAt,
        description: description.trim(),
        location: location.trim(),
      }
      if (endsAt) input.endsAt = endsAt
      await createEvent(input)
      toast.success('Event created!')
      onCreated?.()
    } catch (err) {
      console.error(
        '[create-event] failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't create event.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3"
    >
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Title <span className="text-orange-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="e.g. Weekly meeting"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Starts <span className="text-orange-500">*</span>
        </label>
        <DatePicker
          selected={startsAt}
          onChange={setStartsAt}
          showTimeInput
          timeInputLabel="Time:"
          dateFormat="MMM d, yyyy h:mm aa"
          minDate={now}
          placeholderText="Pick date and time"
          className={INPUT_CLASS}
          popperPlacement="bottom-start"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Ends{' '}
          <span className="text-gray-500 dark:text-gray-400 font-normal">
            (optional)
          </span>
        </label>
        <DatePicker
          selected={endsAt}
          onChange={setEndsAt}
          showTimeInput
          timeInputLabel="Time:"
          dateFormat="MMM d, yyyy h:mm aa"
          minDate={startsAt ?? now}
          placeholderText="Pick date and time"
          className={INPUT_CLASS}
          popperPlacement="bottom-start"
          isClearable
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Room 302"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="What's the event about?"
          className={`${INPUT_CLASS} resize-y`}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {submitting ? 'Creating...' : 'Create event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { MapPin, Plus, Star, Edit, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

import { destinationApi } from '../../api/destinations'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import { apiErrorMessage } from '../../api/axiosClient'

const CATEGORY_TYPES = [
  'DOMESTIC',
  'INTERNATIONAL',
  'BEACH',
  'MOUNTAINS',
  'ADVENTURE',
  'CULTURAL',
  'FAMILY',
]

const EMPTY_DESTINATION_FORM = {
  name: '',
  country: '',
  region: '',
  description: '',
  travel_information: '',
  best_time_to_visit: '',
  latitude: '',
  longitude: '',
  cover_image_url: '',
  category_id: '',
  is_popular: false,
  is_active: true,
}

const EMPTY_CATEGORY_FORM = {
  name: '',
  type: 'DOMESTIC',
  description: '',
}

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([])
  const [categories, setCategories] = useState([])

  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const [selectedDestination, setSelectedDestination] = useState(null)

  const load = async () => {
    try {
      setLoading(true)

      const [destinationResponse, categoryResponse] = await Promise.all([
        destinationApi.list({ page_size: 50 }),
        destinationApi.categories(),
      ])

      setDestinations(destinationResponse?.items || [])
      setCategories(categoryResponse || [])
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleTogglePopular = async (destination) => {
    try {
      await destinationApi.update(destination.id, {
        is_popular: !destination.is_popular,
      })

      toast.success(
        destination.is_popular
          ? 'Removed from popular destinations'
          : 'Added to popular destinations'
      )

      await load()
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    }
  }

  const handleToggleActive = async (destination) => {
    try {
      await destinationApi.update(destination.id, {
        is_active: !destination.is_active,
      })

      toast.success(
        destination.is_active
          ? 'Destination deactivated'
          : 'Destination activated'
      )

      await load()
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    }
  }

  const handleEdit = (destination) => {
    setSelectedDestination(destination)
    setEditOpen(true)
  }

  if (loading) {
    return <Loader full />
  }

  return (
    <div>
      <PageHeader
        title="Destinations"
        subtitle="Manage destinations and categories shown across the platform."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryOpen(true)}
              className="btn-outline"
            >
              <Plus size={16} />
              Category
            </button>

            <button
              onClick={() => setCreateOpen(true)}
              className="btn-gold"
            >
              <Plus size={16} />
              Destination
            </button>
          </div>
        }
      />

      {destinations.length === 0 ? (
        <div className="card p-10 text-center">
          <MapPin
            size={40}
            className="mx-auto mb-3 text-ink/30"
          />

          <h3 className="font-semibold text-charcoal">
            No destinations found
          </h3>

          <p className="text-sm text-slate mt-1">
            Create your first destination to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onEdit={handleEdit}
              onTogglePopular={handleTogglePopular}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* CREATE DESTINATION */}
      <CreateDestinationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
        categories={categories}
      />

      {/* EDIT DESTINATION */}
      <EditDestinationModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setSelectedDestination(null)
        }}
        onUpdated={load}
        destination={selectedDestination}
        categories={categories}
      />

      {/* CREATE CATEGORY */}
      <CreateCategoryModal
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onCreated={load}
      />
    </div>
  )
}

/* =========================================================
   DESTINATION CARD
========================================================= */

function DestinationCard({
  destination,
  onEdit,
  onTogglePopular,
  onToggleActive,
}) {
  return (
    <div className="card overflow-hidden">
      {/* IMAGE */}
      <div className="relative h-52 bg-slate-100">
        {destination.cover_image_url ? (
          <img
            src={destination.cover_image_url}
            alt={destination.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'

              const fallback =
                e.currentTarget.parentElement?.querySelector(
                  '[data-image-fallback]'
                )

              if (fallback) {
                fallback.classList.remove('hidden')
              }
            }}
          />
        ) : null}

        {/* IMAGE FALLBACK */}
        <div
          data-image-fallback
          className={`absolute inset-0 flex flex-col items-center justify-center text-slate ${destination.cover_image_url ? 'hidden' : ''
            }`}
        >
          <ImageIcon size={32} className="mb-2 text-ink/20" />

          <span className="text-sm">
            No image
          </span>
        </div>

        {/* POPULAR BADGE */}
        {destination.is_popular && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-semibold text-gold shadow-sm">
            Popular
          </div>
        )}

        {/* EDIT BUTTON */}
        <button
          type="button"
          onClick={() => onEdit(destination)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm hover:bg-white transition"
          title="Edit destination"
        >
          <Edit size={16} className="text-charcoal" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-charcoal truncate">
              {destination.name}
            </h3>

            <p className="text-xs text-slate mt-1">
              {destination.country}

              {destination.region
                ? ` · ${destination.region}`
                : ''}

              {destination.category
                ? ` · ${destination.category.name}`
                : ''}
            </p>
          </div>

          {/* POPULAR BUTTON */}
          <button
            type="button"
            onClick={() => onTogglePopular(destination)}
            className="shrink-0"
            title={
              destination.is_popular
                ? 'Remove from popular'
                : 'Mark as popular'
            }
          >
            <Star
              size={20}
              className={
                destination.is_popular
                  ? 'fill-gold text-gold'
                  : 'text-ink/20 hover:text-gold'
              }
            />
          </button>
        </div>

        {/* DESCRIPTION */}
        {destination.description && (
          <p className="text-sm text-slate mt-3 line-clamp-2">
            {destination.description}
          </p>
        )}

        {/* STATUS + ACTIONS */}
        <div className="flex items-center justify-between gap-2 mt-4">
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${destination.is_active
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
              }`}
          >
            {destination.is_active
              ? 'Active'
              : 'Inactive'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(destination)}
              className="btn-outline text-xs px-3 py-1.5"
            >
              <Edit size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onToggleActive(destination)}
              className="text-xs px-3 py-1.5 rounded-lg border border-ink/10 hover:bg-ink/5"
            >
              {destination.is_active
                ? 'Deactivate'
                : 'Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   CREATE DESTINATION MODAL
========================================================= */

function CreateDestinationModal({
  open,
  onClose,
  onCreated,
  categories,
}) {
  const [form, setForm] = useState(
    EMPTY_DESTINATION_FORM
  )

  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({
      ...EMPTY_DESTINATION_FORM,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      const payload = {
        name: form.name.trim(),

        country: form.country.trim(),

        region:
          form.region.trim() || undefined,

        description:
          form.description.trim() || undefined,

        travel_information:
          form.travel_information.trim() || undefined,

        best_time_to_visit:
          form.best_time_to_visit.trim() || undefined,

        latitude:
          form.latitude !== ''
            ? Number(form.latitude)
            : undefined,

        longitude:
          form.longitude !== ''
            ? Number(form.longitude)
            : undefined,

        cover_image_url:
          form.cover_image_url.trim() || undefined,

        category_id:
          form.category_id !== ''
            ? Number(form.category_id)
            : undefined,

        is_popular: form.is_popular,
      }

      await destinationApi.create(payload)

      toast.success('Destination created successfully')

      resetForm()

      onClose()

      await onCreated()
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add destination"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* NAME */}
        <div>
          <label className="field-label">
            Name
          </label>

          <input
            required
            className="input"
            placeholder="Kodaikanal"
            value={form.name}
            onChange={(e) =>
              updateField('name', e.target.value)
            }
          />
        </div>

        {/* COUNTRY + REGION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Country
            </label>

            <input
              required
              className="input"
              placeholder="India"
              value={form.country}
              onChange={(e) =>
                updateField(
                  'country',
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Region
            </label>

            <input
              className="input"
              placeholder="Tamil Nadu"
              value={form.region}
              onChange={(e) =>
                updateField(
                  'region',
                  e.target.value
                )
              }
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="field-label">
            Category
          </label>

          <select
            className="select"
            value={form.category_id}
            onChange={(e) =>
              updateField(
                'category_id',
                e.target.value
              )
            }
          >
            <option value="">
              None
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            rows={3}
            className="textarea"
            placeholder="Describe this destination..."
            value={form.description}
            onChange={(e) =>
              updateField(
                'description',
                e.target.value
              )
            }
          />
        </div>

        {/* TRAVEL INFORMATION */}
        <div>
          <label className="field-label">
            Travel Information
          </label>

          <textarea
            rows={3}
            className="textarea"
            placeholder="Travel information, transportation, entry requirements..."
            value={form.travel_information}
            onChange={(e) =>
              updateField(
                'travel_information',
                e.target.value
              )
            }
          />
        </div>

        {/* BEST TIME */}
        <div>
          <label className="field-label">
            Best Time to Visit
          </label>

          <input
            className="input"
            placeholder="October - March"
            value={form.best_time_to_visit}
            onChange={(e) =>
              updateField(
                'best_time_to_visit',
                e.target.value
              )
            }
          />
        </div>

        {/* LATITUDE + LONGITUDE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Latitude
            </label>

            <input
              type="number"
              step="any"
              className="input"
              placeholder="10.2381"
              value={form.latitude}
              onChange={(e) =>
                updateField(
                  'latitude',
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Longitude
            </label>

            <input
              type="number"
              step="any"
              className="input"
              placeholder="77.4892"
              value={form.longitude}
              onChange={(e) =>
                updateField(
                  'longitude',
                  e.target.value
                )
              }
            />
          </div>
        </div>

        {/* COVER IMAGE URL */}
        <div>
          <label className="field-label">
            Cover Image URL
          </label>

          <input
            type="url"
            className="input"
            placeholder="https://example.com/kodaikanal.jpg"
            value={form.cover_image_url}
            onChange={(e) =>
              updateField(
                'cover_image_url',
                e.target.value
              )
            }
          />

          <p className="text-xs text-slate mt-1">
            Enter a direct image URL. No image
            upload is required.
          </p>

          {/* IMAGE PREVIEW */}
          {form.cover_image_url && (
            <div className="mt-3 rounded-lg overflow-hidden border border-ink/10">
              <img
                src={form.cover_image_url}
                alt="Destination preview"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display =
                    'none'

                  const message =
                    e.currentTarget.parentElement?.querySelector(
                      '[data-preview-error]'
                    )

                  if (message) {
                    message.classList.remove(
                      'hidden'
                    )
                  }
                }}
              />

              <div
                data-preview-error
                className="hidden p-4 text-center text-sm text-red-500"
              >
                Unable to load this image URL.
                Please check that it is a direct
                image URL.
              </div>
            </div>
          )}
        </div>

        {/* POPULAR */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_popular}
            onChange={(e) =>
              updateField(
                'is_popular',
                e.target.checked
              )
            }
          />

          <span className="text-sm">
            Mark as popular destination
          </span>
        </label>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading
            ? 'Creating…'
            : 'Create destination'}
        </button>
      </form>
    </Modal>
  )
}

/* =========================================================
   EDIT DESTINATION MODAL
========================================================= */

function EditDestinationModal({
  open,
  onClose,
  onUpdated,
  destination,
  categories,
}) {
  const [form, setForm] = useState(
    EMPTY_DESTINATION_FORM
  )

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!destination) {
      setForm({
        ...EMPTY_DESTINATION_FORM,
      })

      return
    }

    setForm({
      name: destination.name || '',
      country: destination.country || '',
      region: destination.region || '',
      description: destination.description || '',
      travel_information:
        destination.travel_information || '',
      best_time_to_visit:
        destination.best_time_to_visit || '',
      latitude:
        destination.latitude ?? '',
      longitude:
        destination.longitude ?? '',
      cover_image_url:
        destination.cover_image_url || '',
      category_id:
        destination.category?.id ??
        destination.category_id ??
        '',
      is_popular:
        destination.is_popular ?? false,
      is_active:
        destination.is_active ?? true,
    })
  }, [destination])

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!destination) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: form.name.trim(),

        country: form.country.trim(),

        region:
          form.region.trim() || undefined,

        description:
          form.description.trim() || undefined,

        travel_information:
          form.travel_information.trim() || undefined,

        best_time_to_visit:
          form.best_time_to_visit.trim() || undefined,

        latitude:
          form.latitude !== ''
            ? Number(form.latitude)
            : undefined,

        longitude:
          form.longitude !== ''
            ? Number(form.longitude)
            : undefined,

        cover_image_url:
          form.cover_image_url.trim() || undefined,

        category_id:
          form.category_id !== ''
            ? Number(form.category_id)
            : undefined,

        is_popular: form.is_popular,

        is_active: form.is_active,
      }

      await destinationApi.update(
        destination.id,
        payload
      )

      toast.success(
        'Destination updated successfully'
      )

      onClose()

      await onUpdated()
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit destination"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* NAME */}
        <div>
          <label className="field-label">
            Name
          </label>

          <input
            required
            className="input"
            value={form.name}
            onChange={(e) =>
              updateField(
                'name',
                e.target.value
              )
            }
          />
        </div>

        {/* COUNTRY + REGION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Country
            </label>

            <input
              required
              className="input"
              value={form.country}
              onChange={(e) =>
                updateField(
                  'country',
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Region
            </label>

            <input
              className="input"
              value={form.region}
              onChange={(e) =>
                updateField(
                  'region',
                  e.target.value
                )
              }
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="field-label">
            Category
          </label>

          <select
            className="select"
            value={form.category_id}
            onChange={(e) =>
              updateField(
                'category_id',
                e.target.value
              )
            }
          >
            <option value="">
              None
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            rows={3}
            className="textarea"
            value={form.description}
            onChange={(e) =>
              updateField(
                'description',
                e.target.value
              )
            }
          />
        </div>

        {/* TRAVEL INFORMATION */}
        <div>
          <label className="field-label">
            Travel Information
          </label>

          <textarea
            rows={3}
            className="textarea"
            value={form.travel_information}
            onChange={(e) =>
              updateField(
                'travel_information',
                e.target.value
              )
            }
          />
        </div>

        {/* BEST TIME */}
        <div>
          <label className="field-label">
            Best Time to Visit
          </label>

          <input
            className="input"
            value={form.best_time_to_visit}
            onChange={(e) =>
              updateField(
                'best_time_to_visit',
                e.target.value
              )
            }
          />
        </div>

        {/* LATITUDE + LONGITUDE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Latitude
            </label>

            <input
              type="number"
              step="any"
              className="input"
              value={form.latitude}
              onChange={(e) =>
                updateField(
                  'latitude',
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Longitude
            </label>

            <input
              type="number"
              step="any"
              className="input"
              value={form.longitude}
              onChange={(e) =>
                updateField(
                  'longitude',
                  e.target.value
                )
              }
            />
          </div>
        </div>

        {/* COVER IMAGE URL */}
        <div>
          <label className="field-label">
            Cover Image URL
          </label>

          <input
            type="url"
            className="input"
            placeholder="https://example.com/kodaikanal.jpg"
            value={form.cover_image_url}
            onChange={(e) =>
              updateField(
                'cover_image_url',
                e.target.value
              )
            }
          />

          <p className="text-xs text-slate mt-1">
            Change the image by replacing the
            URL.
          </p>

          {/* IMAGE PREVIEW */}
          {form.cover_image_url && (
            <div className="mt-3 rounded-lg overflow-hidden border border-ink/10">
              <img
                src={form.cover_image_url}
                alt={form.name || 'Destination'}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display =
                    'none'

                  const message =
                    e.currentTarget.parentElement?.querySelector(
                      '[data-preview-error]'
                    )

                  if (message) {
                    message.classList.remove(
                      'hidden'
                    )
                  }
                }}
              />

              <div
                data-preview-error
                className="hidden p-4 text-center text-sm text-red-500"
              >
                Unable to load this image URL.
              </div>
            </div>
          )}
        </div>

        {/* POPULAR */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_popular}
            onChange={(e) =>
              updateField(
                'is_popular',
                e.target.checked
              )
            }
          />

          <span className="text-sm">
            Popular destination
          </span>
        </label>

        {/* ACTIVE */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              updateField(
                'is_active',
                e.target.checked
              )
            }
          />

          <span className="text-sm">
            Active destination
          </span>
        </label>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading
            ? 'Updating…'
            : 'Update destination'}
        </button>
      </form>
    </Modal>
  )
}

/* =========================================================
   CREATE CATEGORY MODAL
========================================================= */

function CreateCategoryModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(
    EMPTY_CATEGORY_FORM
  )

  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description:
          form.description.trim() || undefined,
      }

      await destinationApi.createCategory(
        payload
      )

      toast.success('Category created successfully')

      setForm({
        ...EMPTY_CATEGORY_FORM,
      })

      onClose()

      await onCreated()
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add category"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* NAME */}
        <div>
          <label className="field-label">
            Name
          </label>

          <input
            required
            className="input"
            placeholder="Beach Destinations"
            value={form.name}
            onChange={(e) =>
              updateField(
                'name',
                e.target.value
              )
            }
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="field-label">
            Type
          </label>

          <select
            className="select"
            value={form.type}
            onChange={(e) =>
              updateField(
                'type',
                e.target.value
              )
            }
          >
            {CATEGORY_TYPES.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            rows={3}
            className="textarea"
            placeholder="Category description..."
            value={form.description}
            onChange={(e) =>
              updateField(
                'description',
                e.target.value
              )
            }
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading
            ? 'Creating…'
            : 'Create category'}
        </button>
      </form>
    </Modal>
  )
}
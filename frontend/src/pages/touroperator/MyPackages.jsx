import { useEffect, useState } from 'react'
import {
  MapPinned,
  Plus,
  Calendar,
  Eye,
  EyeOff,
  ImagePlus,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { tourApi, operatorApi } from '../../api/tours'
import { destinationApi } from '../../api/destinations'

import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'

import { formatCurrency, formatDate } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'


export default function MyPackages() {
  const [operator, setOperator] = useState(null)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [scheduleFor, setScheduleFor] = useState(null)

  const load = () => {
    setLoading(true)

    operatorApi.me()
      .then((op) => {
        setOperator(op)
        return tourApi.mine()
      })
      .then((pkgs) => {
        setPackages(pkgs || [])
      })
      .catch(() => {
        setOperator(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const handlePublishToggle = async (pkg) => {
    try {
      await tourApi.publish(pkg.id, !pkg.is_published)

      toast.success(
        pkg.is_published
          ? 'Package unpublished'
          : 'Package published'
      )

      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (loading) {
    return <Loader full />
  }

  if (!operator) {
    return <OperatorRegisterCard onRegistered={load} />
  }

  return (
    <div>
      <PageHeader
        title="My Packages"
        subtitle={`${operator.company_name} — manage your tour packages and schedules.`}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-gold"
          >
            <Plus size={16} />
            New package
          </button>
        }
      />

      {packages.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No packages yet"
          description="Create your first tour package to start selling."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((p) => (
            <div
              key={p.id}
              className="card overflow-hidden"
            >
              <div className="h-40 bg-sand flex items-center justify-center overflow-hidden">
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPinned
                    className="text-ink/15"
                    size={32}
                  />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-charcoal">
                    {p.title}
                  </p>

                  <span
                    className={
                      p.is_published
                        ? 'badge-success'
                        : 'badge-neutral'
                    }
                  >
                    {p.is_published
                      ? 'Published'
                      : 'Draft'}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate mt-2 line-clamp-2">
                    {p.description}
                  </p>
                )}

                <p className="text-xs text-slate mt-2">
                  {p.duration_days}d / {p.duration_nights}n
                  {' · '}
                  {formatCurrency(p.price_per_person)}
                </p>

                {p.activity_type && (
                  <p className="text-xs text-slate mt-1">
                    {p.activity_type}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setScheduleFor(p)}
                    className="btn-outline btn-sm flex-1"
                  >
                    <Calendar size={13} />
                    Schedules
                  </button>

                  <button
                    onClick={() => handlePublishToggle(p)}
                    className="btn-outline btn-sm"
                    title={
                      p.is_published
                        ? 'Unpublish'
                        : 'Publish'
                    }
                  >
                    {p.is_published ? (
                      <EyeOff size={13} />
                    ) : (
                      <Eye size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePackageModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      <ScheduleModal
        pkg={scheduleFor}
        onClose={() => setScheduleFor(null)}
      />
    </div>
  )
}


/* =========================================================
   OPERATOR REGISTRATION
========================================================= */

function OperatorRegisterCard({ onRegistered }) {
  const [form, setForm] = useState({
    company_name: '',
    company_description: '',
    license_number: '',
    website: '',
    years_in_business: '',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await operatorApi.register({
        company_name: form.company_name,
        company_description:
          form.company_description || null,
        license_number:
          form.license_number || null,
        website: form.website || null,
        years_in_business:
          form.years_in_business
            ? Number(form.years_in_business)
            : null,
      })

      toast.success(
        'Operator profile created — pending admin verification'
      )

      onRegistered()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto card p-8 text-center mt-10">
      <MapPinned
        className="mx-auto text-ink/30 mb-4"
        size={32}
      />

      <h2 className="font-display text-xl text-ink mb-2">
        Set up your operator profile
      </h2>

      <p className="text-sm text-slate mb-6">
        Complete this once to start creating tour packages.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-left"
      >
        <div>
          <label className="field-label">
            Company name
          </label>

          <input
            required
            className="input"
            value={form.company_name}
            onChange={(e) =>
              setForm({
                ...form,
                company_name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Company description
          </label>

          <textarea
            rows={3}
            className="textarea"
            value={form.company_description}
            onChange={(e) =>
              setForm({
                ...form,
                company_description:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            License number
          </label>

          <input
            className="input"
            value={form.license_number}
            onChange={(e) =>
              setForm({
                ...form,
                license_number:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Website
          </label>

          <input
            type="url"
            className="input"
            placeholder="https://example.com"
            value={form.website}
            onChange={(e) =>
              setForm({
                ...form,
                website: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Years in business
          </label>

          <input
            type="number"
            min="0"
            className="input"
            value={form.years_in_business}
            onChange={(e) =>
              setForm({
                ...form,
                years_in_business:
                  e.target.value,
              })
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading
            ? 'Setting up…'
            : 'Create operator profile'}
        </button>
      </form>
    </div>
  )
}


/* =========================================================
   CREATE PACKAGE MODAL
========================================================= */

function CreatePackageModal({
  open,
  onClose,
  onCreated,
}) {
  const [destinations, setDestinations] = useState([])

  const [form, setForm] = useState({
    destination_id: '',
    title: '',
    description: '',
    included_services: '',
    excluded_services: '',
    duration_days: 3,
    duration_nights: 2,
    price_per_person: '',
    max_group_size: 20,
    activity_type: '',
  })

  const [imageFiles, setImageFiles] = useState([])

  const [loadingDestinations, setLoadingDestinations] =
    useState(false)

  const [loading, setLoading] = useState(false)


  /*
   * Load destinations when modal opens
   */
  useEffect(() => {
    if (!open) return

    setLoadingDestinations(true)

    destinationApi
      .list()
      .then((result) => {
        /*
         * Support both:
         * [ ... ]
         * { items: [...] }
         */
        const items = Array.isArray(result)
          ? result
          : result?.items || []

        setDestinations(items)
      })
      .catch(() => {
        setDestinations([])
      })
      .finally(() => {
        setLoadingDestinations(false)
      })
  }, [open])


  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }


  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])

    setImageFiles(files)
  }


  const removeImage = (index) => {
    setImageFiles((previous) =>
      previous.filter((_, i) => i !== index)
    )
  }


  const resetForm = () => {
    setForm({
      destination_id: '',
      title: '',
      description: '',
      included_services: '',
      excluded_services: '',
      duration_days: 3,
      duration_nights: 2,
      price_per_person: '',
      max_group_size: 20,
      activity_type: '',
    })

    setImageFiles([])
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.price_per_person) {
      toast.error('Please enter the price per person')
      return
    }

    if (Number(form.duration_days) < 1) {
      toast.error('Duration must be at least 1 day')
      return
    }

    if (Number(form.duration_nights) < 0) {
      toast.error('Duration nights cannot be negative')
      return
    }

    if (Number(form.max_group_size) < 1) {
      toast.error('Maximum group size must be at least 1')
      return
    }

    setLoading(true)

    try {
      /*
       * Convert comma/new-line separated services
       * into arrays expected by Pydantic.
       *
       * Example:
       *
       * Airport pickup
       * Hotel
       * Breakfast
       *
       * becomes:
       *
       * ["Airport pickup", "Hotel", "Breakfast"]
       */
      const includedServices =
        form.included_services
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)

      const excludedServices =
        form.excluded_services
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)


      /*
       * Create package
       */
      const createdPackage =
        await tourApi.create({
          destination_id:
            form.destination_id
              ? Number(form.destination_id)
              : null,

          title: form.title.trim(),

          description:
            form.description.trim() || null,

          included_services:
            includedServices.length
              ? includedServices
              : null,

          excluded_services:
            excludedServices.length
              ? excludedServices
              : null,

          duration_days:
            Number(form.duration_days),

          duration_nights:
            Number(form.duration_nights),

          price_per_person:
            Number(form.price_per_person),

          max_group_size:
            Number(form.max_group_size),

          activity_type:
            form.activity_type.trim() || null,
        })


      /*
       * Upload selected images after the package
       * has been created because the backend image
       * endpoint requires package_id.
       */
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          await tourApi.uploadImage(
            createdPackage.id,
            file
          )
        }
      }


      toast.success(
        imageFiles.length > 0
          ? 'Package created with images'
          : 'Package created'
      )

      resetForm()
      onCreated()
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }


  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) {
          resetForm()
          onClose()
        }
      }}
      title="Create tour package"
      maxWidth="max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* DESTINATION */}

        <div>
          <label className="field-label">
            Destination
          </label>

          <select
            className="input"
            value={form.destination_id}
            onChange={(e) =>
              handleChange(
                'destination_id',
                e.target.value
              )
            }
            disabled={loadingDestinations}
          >
            <option value="">
              {loadingDestinations
                ? 'Loading destinations...'
                : 'Select destination'}
            </option>

            {destinations.map((destination) => (
              <option
                key={destination.id}
                value={destination.id}
              >
                {destination.name}
                {destination.country
                  ? ` — ${destination.country}`
                  : ''}
              </option>
            ))}
          </select>

          <p className="text-xs text-slate mt-1">
            Choose where this tour package takes travelers.
          </p>
        </div>


        {/* TITLE */}

        <div>
          <label className="field-label">
            Package title
          </label>

          <input
            required
            className="input"
            placeholder="e.g. 5-Day Tamil Nadu Heritage Tour"
            value={form.title}
            onChange={(e) =>
              handleChange(
                'title',
                e.target.value
              )
            }
          />
        </div>


        {/* DESCRIPTION */}

        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            rows={4}
            className="textarea"
            placeholder="Describe the tour experience, places covered, activities and highlights..."
            value={form.description}
            onChange={(e) =>
              handleChange(
                'description',
                e.target.value
              )
            }
          />
        </div>


        {/* DURATION */}

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="field-label">
              Duration (days)
            </label>

            <input
              required
              min="1"
              type="number"
              className="input"
              value={form.duration_days}
              onChange={(e) =>
                handleChange(
                  'duration_days',
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Duration (nights)
            </label>

            <input
              required
              min="0"
              type="number"
              className="input"
              value={form.duration_nights}
              onChange={(e) =>
                handleChange(
                  'duration_nights',
                  e.target.value
                )
              }
            />
          </div>

        </div>


        {/* PRICE + GROUP SIZE */}

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="field-label">
              Price per person ($)
            </label>

            <input
              required
              min="0"
              step="0.01"
              type="number"
              className="input"
              placeholder="e.g. 499"
              value={form.price_per_person}
              onChange={(e) =>
                handleChange(
                  'price_per_person',
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="field-label">
              Maximum group size
            </label>

            <input
              required
              min="1"
              type="number"
              className="input"
              value={form.max_group_size}
              onChange={(e) =>
                handleChange(
                  'max_group_size',
                  e.target.value
                )
              }
            />
          </div>

        </div>


        {/* ACTIVITY */}

        <div>
          <label className="field-label">
            Activity type
          </label>

          <input
            className="input"
            placeholder="e.g. Adventure, Cultural, Family, Religious"
            value={form.activity_type}
            onChange={(e) =>
              handleChange(
                'activity_type',
                e.target.value
              )
            }
          />
        </div>


        {/* INCLUDED SERVICES */}

        <div>
          <label className="field-label">
            Included services
          </label>

          <textarea
            rows={4}
            className="textarea"
            placeholder={
              'Enter one service per line:\nHotel accommodation\nBreakfast\nAirport pickup\nLocal guide'
            }
            value={form.included_services}
            onChange={(e) =>
              handleChange(
                'included_services',
                e.target.value
              )
            }
          />

          <p className="text-xs text-slate mt-1">
            Enter one service per line.
          </p>
        </div>


        {/* EXCLUDED SERVICES */}

        <div>
          <label className="field-label">
            Excluded services
          </label>

          <textarea
            rows={4}
            className="textarea"
            placeholder={
              'Enter one service per line:\nFlight tickets\nPersonal expenses\nTravel insurance'
            }
            value={form.excluded_services}
            onChange={(e) =>
              handleChange(
                'excluded_services',
                e.target.value
              )
            }
          />

          <p className="text-xs text-slate mt-1">
            Enter one service per line.
          </p>
        </div>


        {/* IMAGES */}

        <div>
          <label className="field-label">
            Package images
          </label>

          <label className="border-2 border-dashed border-ink/15 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition">
            <ImagePlus
              size={28}
              className="text-slate mb-2"
            />

            <span className="text-sm font-medium text-charcoal">
              Click to select images
            </span>

            <span className="text-xs text-slate mt-1">
              You can select multiple images
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </label>


          {imageFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {imageFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative rounded-xl overflow-hidden border border-ink/10 aspect-video"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(index)
                    }
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                  >
                    <X size={14} />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* SUBMIT */}

        <div className="flex gap-3 pt-2">

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              resetForm()
              onClose()
            }}
            className="btn-outline flex-1"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading
              ? 'Creating package…'
              : 'Create package'}
          </button>

        </div>

      </form>
    </Modal>
  )
}


/* =========================================================
   SCHEDULE MODAL
========================================================= */

function ScheduleModal({
  pkg,
  onClose,
}) {
  const [schedules, setSchedules] = useState([])

  const [form, setForm] = useState({
    departure_date: '',
    return_date: '',
    departure_location: '',
    total_seats: 20,
  })


  useEffect(() => {
    if (!pkg) return

    tourApi
      .schedules(pkg.id, false)
      .then(setSchedules)
      .catch(() => setSchedules([]))
  }, [pkg])


  const handleAdd = async (e) => {
    e.preventDefault()

    try {
      await tourApi.createSchedule({
        package_id: pkg.id,
        departure_date: form.departure_date,
        return_date: form.return_date,
        departure_location:
          form.departure_location,
        total_seats: Number(form.total_seats),
      })

      toast.success('Schedule added')

      const schedules =
        await tourApi.schedules(
          pkg.id,
          false
        )

      setSchedules(schedules)

      setForm({
        departure_date: '',
        return_date: '',
        departure_location: '',
        total_seats: 20,
      })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }


  return (
    <Modal
      open={!!pkg}
      onClose={onClose}
      title={
        pkg
          ? `Schedules — ${pkg.title}`
          : ''
      }
      maxWidth="max-w-xl"
    >

      <form
        onSubmit={handleAdd}
        className="border border-ink/10 rounded-xl p-4 mb-4 space-y-3"
      >

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="field-label">
              Departure date
            </label>

            <input
              required
              type="date"
              className="input"
              value={form.departure_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  departure_date:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="field-label">
              Return date
            </label>

            <input
              required
              type="date"
              className="input"
              value={form.return_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  return_date:
                    e.target.value,
                })
              }
            />
          </div>

        </div>


        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="field-label">
              Departure location
            </label>

            <input
              required
              placeholder="e.g. Trichy"
              className="input"
              value={form.departure_location}
              onChange={(e) =>
                setForm({
                  ...form,
                  departure_location:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="field-label">
              Total seats
            </label>

            <input
              required
              min="1"
              type="number"
              className="input"
              value={form.total_seats}
              onChange={(e) =>
                setForm({
                  ...form,
                  total_seats:
                    e.target.value,
                })
              }
            />
          </div>

        </div>


        <button
          type="submit"
          className="btn-primary btn-sm"
        >
          Add schedule
        </button>

      </form>


      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">

        {schedules.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border border-ink/8 rounded-xl px-4 py-2.5"
          >
            <p className="text-sm text-charcoal">
              {formatDate(s.departure_date)}
              {' → '}
              {formatDate(s.return_date)}
            </p>

            <p className="text-xs text-slate">
              {s.seats_available}/{s.total_seats}{' '}
              seats
            </p>
          </div>
        ))}

        {schedules.length === 0 && (
          <p className="text-sm text-slate text-center py-4">
            No schedules yet.
          </p>
        )}

      </div>

    </Modal>
  )
}
import { useEffect, useState } from 'react'
import {
  Hotel,
  Plus,
  BedDouble,
  MapPin,
  Pencil,
  Image as ImageIcon,
  Upload,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { hotelApi } from '../../api/hotels'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function MyHotels() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editHotel, setEditHotel] = useState(null)
  const [manageHotel, setManageHotel] = useState(null)

  const load = async () => {
    setLoading(true)

    try {
      const res = await hotelApi.list({
        mine_only: true,
        page_size: 50,
      })

      setHotels(res.items || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load hotels'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <PageHeader
        title="My Hotels"
        subtitle="Manage your listed properties, rooms, images, and availability."
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-gold"
          >
            <Plus size={16} />
            Register hotel
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : hotels.length === 0 ? (
        <EmptyState
          icon={Hotel}
          title="No hotels yet"
          description="Register your first property to start accepting bookings."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotels.map((h) => (
            <div key={h.id} className="card overflow-hidden">

              {/* HOTEL IMAGE */}
              <div className="h-40 bg-sand flex items-center justify-center overflow-hidden">
                {h.cover_image_url ? (
                  <img
                    src={h.cover_image_url}
                    alt={h.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-ink/20">
                    <Hotel size={32} />
                    <span className="text-xs mt-1">
                      No image
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">

                {/* TITLE + STATUS */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-charcoal">
                    {h.name}
                  </p>

                  <StatusBadge status={h.verification_status} />
                </div>

                {/* LOCATION */}
                <p className="text-xs text-slate flex items-center gap-1 mt-1">
                  <MapPin size={11} />
                  {h.city}, {h.country}
                </p>

                {/* STAR RATING */}
                <div className="flex items-center gap-1 mt-2 text-xs text-slate">
                  {'★'.repeat(Number(h.star_rating || 0))}
                  <span className="text-slate/60">
                    ({h.star_rating}/5)
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-2 gap-2 mt-4">

                  <button
                    onClick={() => setEditHotel(h)}
                    className="btn-outline btn-sm"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>

                  <button
                    onClick={() => setManageHotel(h)}
                    className="btn-outline btn-sm"
                  >
                    <BedDouble size={13} />
                    Rooms
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER */}
      <RegisterHotelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      {/* EDIT */}
      <EditHotelModal
        hotel={editHotel}
        onClose={() => setEditHotel(null)}
        onUpdated={load}
      />

      {/* ROOMS */}
      <ManageRoomsModal
        hotel={manageHotel}
        onClose={() => setManageHotel(null)}
      />
    </div>
  )
}


/* =========================================================
   REGISTER HOTEL
========================================================= */

function RegisterHotelModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    star_rating: 3,
    description: '',
    check_in_time: '14:00',
    check_out_time: '11:00',
  })

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      city: '',
      country: '',
      star_rating: 3,
      description: '',
      check_in_time: '14:00',
      check_out_time: '11:00',
    })

    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Hotel name is required')
      return
    }

    setLoading(true)

    try {
      // 1. Create hotel
      const hotel = await hotelApi.register({
        name: form.name,
        address: form.address,
        city: form.city,
        country: form.country,
        star_rating: Number(form.star_rating),
        description: form.description || null,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
      })

      // 2. Upload image after hotel exists
      if (imageFile && hotel?.id) {
        await hotelApi.uploadImage(hotel.id, imageFile)
      }

      toast.success(
        imageFile
          ? 'Hotel registered with image'
          : 'Hotel registered — pending admin verification'
      )

      resetForm()
      onCreated()
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not register hotel'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register a new hotel"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <div>
          <label className="field-label">
            Hotel name
          </label>

          <input
            required
            className="input"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Address
          </label>

          <input
            required
            className="input"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="field-label">
              City
            </label>

            <input
              required
              className="input"
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="field-label">
              Country
            </label>

            <input
              required
              className="input"
              value={form.country}
              onChange={(e) =>
                setForm({
                  ...form,
                  country: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="field-label">
              Star rating
            </label>

            <select
              className="select"
              value={form.star_rating}
              onChange={(e) =>
                setForm({
                  ...form,
                  star_rating: e.target.value,
                })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} star
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">
              Check-in
            </label>

            <input
              type="time"
              className="input"
              value={form.check_in_time}
              onChange={(e) =>
                setForm({
                  ...form,
                  check_in_time: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div>
          <label className="field-label">
            Check-out
          </label>

          <input
            type="time"
            className="input"
            value={form.check_out_time}
            onChange={(e) =>
              setForm({
                ...form,
                check_out_time: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            rows={3}
            className="textarea"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        {/* IMAGE UPLOAD */}
        <div>
          <label className="field-label">
            Hotel image
          </label>

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-xl mb-3"
            />
          )}

          <label className="btn-outline btn-sm cursor-pointer inline-flex">
            <ImageIcon size={14} />
            {imageFile ? 'Change image' : 'Choose image'}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          {imageFile && (
            <p className="text-xs text-slate mt-2">
              {imageFile.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Registering…' : 'Register hotel'}
        </button>

      </form>
    </Modal>
  )
}


/* =========================================================
   EDIT HOTEL
========================================================= */

function EditHotelModal({ hotel, onClose, onUpdated }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (!hotel) {
      setForm(null)
      setImageFile(null)
      setImagePreview(null)
      return
    }

    setForm({
      name: hotel.name || '',
      description: hotel.description || '',
      address: hotel.address || '',
      city: hotel.city || '',
      country: hotel.country || '',
      star_rating: hotel.star_rating || 3,
      check_in_time: hotel.check_in_time || '14:00',
      check_out_time: hotel.check_out_time || '11:00',
    })

    setImageFile(null)
    setImagePreview(hotel.cover_image_url || null)
  }, [hotel])

  if (!hotel || !form) return null

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Update hotel information
      await hotelApi.update(hotel.id, {
        name: form.name,
        description: form.description || null,
        address: form.address,
        city: form.city,
        country: form.country,
        star_rating: Number(form.star_rating),
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
      })

      // 2. Upload new image if selected
      if (imageFile) {
        await hotelApi.uploadImage(hotel.id, imageFile)
      }

      toast.success(
        imageFile
          ? 'Hotel updated and image uploaded'
          : 'Hotel updated successfully'
      )

      onUpdated()
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update hotel'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={!!hotel}
      onClose={onClose}
      title={`Edit hotel — ${hotel.name}`}
      maxWidth="max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <div>
          <label className="field-label">
            Hotel name
          </label>

          <input
            required
            className="input"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Address
          </label>

          <input
            required
            className="input"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="field-label">
              City
            </label>

            <input
              required
              className="input"
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="field-label">
              Country
            </label>

            <input
              required
              className="input"
              value={form.country}
              onChange={(e) =>
                setForm({
                  ...form,
                  country: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="field-label">
              Star rating
            </label>

            <select
              className="select"
              value={form.star_rating}
              onChange={(e) =>
                setForm({
                  ...form,
                  star_rating: e.target.value,
                })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} star
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">
              Check-in
            </label>

            <input
              type="time"
              className="input"
              value={form.check_in_time}
              onChange={(e) =>
                setForm({
                  ...form,
                  check_in_time: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div>
          <label className="field-label">
            Check-out
          </label>

          <input
            type="time"
            className="input"
            value={form.check_out_time}
            onChange={(e) =>
              setForm({
                ...form,
                check_out_time: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            rows={4}
            className="textarea"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        {/* CURRENT / NEW IMAGE */}
        <div>
          <label className="field-label">
            Hotel image
          </label>

          {imagePreview ? (
            <div className="relative mb-3">
              <img
                src={imagePreview}
                alt={hotel.name}
                className="w-full h-48 object-cover rounded-xl"
              />

              {imageFile && (
                <span className="absolute top-2 left-2 badge-success">
                  New image
                </span>
              )}
            </div>
          ) : (
            <div className="h-40 rounded-xl bg-sand flex flex-col items-center justify-center text-slate mb-3">
              <Hotel size={32} />
              <p className="text-xs mt-2">
                No image uploaded
              </p>
            </div>
          )}

          <label className="btn-outline btn-sm cursor-pointer inline-flex">
            <Upload size={14} />
            {imageFile ? 'Choose another image' : 'Upload new image'}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          {imageFile && (
            <p className="text-xs text-slate mt-2">
              Selected: {imageFile.name}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline flex-1"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>

      </form>
    </Modal>
  )
}


/* =========================================================
   MANAGE ROOMS
========================================================= */

function ManageRoomsModal({ hotel, onClose }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const [roomForm, setRoomForm] = useState({
    room_number: '',
    name: '',
    price_per_night: '',
    capacity_adults: 2,
    capacity_children: 0,
    total_units: 1,
  })

  useEffect(() => {
    if (hotel) {
      setLoading(true)

      hotelApi.rooms(hotel.id)
        .then((r) => setRooms(r || []))
        .catch((err) => {
          toast.error(apiErrorMessage(err, 'Could not load rooms'))
        })
        .finally(() => setLoading(false))
    }
  }, [hotel])

  const handleAddRoom = async (e) => {
    e.preventDefault()

    try {
      await hotelApi.createRoom({
        hotel_id: hotel.id,
        ...roomForm,
        price_per_night: Number(roomForm.price_per_night),
        capacity_adults: Number(roomForm.capacity_adults),
        capacity_children: Number(roomForm.capacity_children),
        total_units: Number(roomForm.total_units),
      })

      toast.success('Room added')

      setAddOpen(false)

      setRoomForm({
        room_number: '',
        name: '',
        price_per_night: '',
        capacity_adults: 2,
        capacity_children: 0,
        total_units: 1,
      })

      const r = await hotelApi.rooms(hotel.id)
      setRooms(r || [])
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <Modal
      open={!!hotel}
      onClose={onClose}
      title={hotel ? `Rooms — ${hotel.name}` : ''}
      maxWidth="max-w-2xl"
    >

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="btn-outline btn-sm"
        >
          <Plus size={14} />
          Add room
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={handleAddRoom}
          className="border border-ink/10 rounded-xl p-4 mb-4 space-y-3"
        >

          <div className="grid grid-cols-2 gap-3">

            <input
              required
              placeholder="Room number"
              className="input"
              value={roomForm.room_number}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  room_number: e.target.value,
                })
              }
            />

            <input
              required
              placeholder="Room name (e.g. Deluxe Suite)"
              className="input"
              value={roomForm.name}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  name: e.target.value,
                })
              }
            />

          </div>

          <div className="grid grid-cols-4 gap-3">

            <input
              required
              type="number"
              placeholder="Price/night"
              className="input"
              value={roomForm.price_per_night}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  price_per_night: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Adults"
              className="input"
              value={roomForm.capacity_adults}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  capacity_adults: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Children"
              className="input"
              value={roomForm.capacity_children}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  capacity_children: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Units"
              className="input"
              value={roomForm.total_units}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  total_units: e.target.value,
                })
              }
            />

          </div>

          <button
            type="submit"
            className="btn-primary btn-sm"
          >
            Save room
          </button>

        </form>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">

          {rooms.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between border border-ink/8 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-charcoal">
                  {r.name}{' '}
                  <span className="text-xs text-slate">
                    #{r.room_number}
                  </span>
                </p>

                <p className="text-xs text-slate">
                  {r.capacity_adults + r.capacity_children} guests ·{' '}
                  {r.total_units} unit(s)
                </p>
              </div>

              <p className="font-mono text-sm font-semibold text-ink">
                {formatCurrency(r.price_per_night)}
              </p>
            </div>
          ))}

          {rooms.length === 0 && (
            <p className="text-sm text-slate text-center py-6">
              No rooms added yet.
            </p>
          )}

        </div>
      )}

    </Modal>
  )
}
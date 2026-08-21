function EditDestinationModal({
  destination,
  onClose,
  onUpdated,
  categories,
}) {
  const [form, setForm] = useState({
    name: '',
    country: '',
    region: '',
    description: '',
    travel_information: '',
    best_time_to_visit: '',
    latitude: '',
    longitude: '',
    category_id: '',
    is_popular: false,
    is_active: true,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!destination) return

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim(),
        region: form.region.trim() || undefined,
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

      toast.success('Destination updated successfully')

      onUpdated()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (!destination) return null

  return (
    <Modal
      open={!!destination}
      onClose={onClose}
      title={`Edit ${destination.name}`}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-h-[75vh] overflow-y-auto pr-1"
      >
        <div>
          <label className="field-label">
            Name
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
                setForm({
                  ...form,
                  country: e.target.value,
                })
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
                setForm({
                  ...form,
                  region: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="field-label">
            Category
          </label>

          <select
            className="select"
            value={form.category_id}
            onChange={(e) =>
              setForm({
                ...form,
                category_id: e.target.value,
              })
            }
          >
            <option value="">
              None
            </option>

            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>
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

        <div>
          <label className="field-label">
            Travel Information
          </label>

          <textarea
            rows={4}
            className="textarea"
            value={form.travel_information}
            onChange={(e) =>
              setForm({
                ...form,
                travel_information: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Best Time to Visit
          </label>

          <input
            className="input"
            value={form.best_time_to_visit}
            onChange={(e) =>
              setForm({
                ...form,
                best_time_to_visit: e.target.value,
              })
            }
          />
        </div>

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
                setForm({
                  ...form,
                  latitude: e.target.value,
                })
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
                setForm({
                  ...form,
                  longitude: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_popular: e.target.checked,
                })
              }
            />

            <span className="text-sm">
              Popular destination
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active: e.target.checked,
                })
              }
            />

            <span className="text-sm">
              Active destination
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading
            ? 'Saving…'
            : 'Save changes'}
        </button>
      </form>
    </Modal>
  )
}
import { useEffect, useState } from 'react'
import {
  LifeBuoy,
  CheckCircle2,
  Clock3,
  User,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import { supportApi } from '../../api/communication'
import { apiErrorMessage } from '../../api/axiosClient'

export default function AdminSupport() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const loadTickets = async () => {
    try {
      setLoading(true)

      const response = await supportApi.allTickets({
        page: 1,
        page_size: 100,
      })

      setTickets(
        Array.isArray(response)
          ? response
          : response?.items || []
      )
    } catch (err) {
      console.error(err)
      toast.error(
        apiErrorMessage(err, 'Could not load support tickets')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const acknowledgeTicket = async (ticket) => {
    try {
      setUpdatingId(ticket.id)

      await supportApi.updateTicket(ticket.id, {
        status: 'IN_PROGRESS',
      })

      toast.success('Ticket acknowledged')

      await loadTickets()
    } catch (err) {
      console.error(err)
      toast.error(
        apiErrorMessage(err, 'Could not acknowledge ticket')
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const resolveTicket = async (ticket) => {
    try {
      setUpdatingId(ticket.id)

      await supportApi.updateTicket(ticket.id, {
        status: 'RESOLVED',
      })

      toast.success('Ticket marked as resolved')

      await loadTickets()
    } catch (err) {
      console.error(err)
      toast.error(
        apiErrorMessage(err, 'Could not update ticket')
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const openCount = tickets.filter(
    (ticket) => ticket.status === 'OPEN'
  ).length

  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === 'IN_PROGRESS'
  ).length

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === 'RESOLVED'
  ).length

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        subtitle="Review, acknowledge, and resolve customer and partner support requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gold/10">
              <LifeBuoy size={20} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate">
                Open
              </p>

              <p className="text-2xl font-semibold text-ink">
                {openCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50">
              <Clock3 size={20} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate">
                In progress
              </p>

              <p className="text-2xl font-semibold text-ink">
                {inProgressCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate">
                Resolved
              </p>

              <p className="text-2xl font-semibold text-ink">
                {resolvedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={loadTickets}
          disabled={loading}
          className="btn-outline btn-sm"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets"
          description="There are currently no support requests."
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isUpdating = updatingId === ticket.id

            return (
              <div
                key={ticket.id}
                className="ticket p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-ink">
                      {ticket.ticket_reference ||
                        ticket.ticket_number ||
                        `TICKET-${ticket.id}`}
                    </p>

                    <h3 className="font-semibold text-lg text-ink mt-1">
                      {ticket.subject ||
                        ticket.title ||
                        'Support request'}
                    </h3>

                    <p className="text-sm text-slate mt-2">
                      {ticket.description ||
                        ticket.message ||
                        'No description provided.'}
                    </p>
                  </div>

                  <StatusBadge status={ticket.status} />
                </div>

                <div className="border-t border-ink/5 mt-4 pt-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-slate">
                    <User size={14} />

                    <span>
                      {ticket.user?.first_name
                        ? `${ticket.user.first_name} ${ticket.user.last_name || ''
                        }`
                        : ticket.user_name ||
                        ticket.customer_name ||
                        `User #${ticket.user_id || ticket.customer_id || ''}`}
                    </span>

                    {ticket.category && (
                      <>
                        <span>·</span>
                        <span>{ticket.category}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ticket.status === 'OPEN' && (
                      <button
                        disabled={isUpdating}
                        onClick={() =>
                          acknowledgeTicket(ticket)
                        }
                        className="btn-gold btn-sm"
                      >
                        <Clock3 size={14} />

                        {isUpdating
                          ? 'Updating...'
                          : 'Acknowledge'}
                      </button>
                    )}

                    {ticket.status === 'IN_PROGRESS' && (
                      <button
                        disabled={isUpdating}
                        onClick={() =>
                          resolveTicket(ticket)
                        }
                        className="btn-primary btn-sm"
                      >
                        <CheckCircle2 size={14} />

                        {isUpdating
                          ? 'Updating...'
                          : 'Mark resolved'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
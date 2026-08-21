import { useEffect, useState } from 'react'
import { LifeBuoy, Plus, Send, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { supportApi } from '../../api/communication'
import { useAuth } from '../../context/AuthContext'

import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'

import { timeAgo } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

const CATEGORIES = [
  'BOOKING',
  'PAYMENT',
  'REFUND',
  'TECHNICAL',
  'OTHER',
]

const ADMIN_STATUS_FILTERS = [
  { value: '', label: 'All tickets' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

export default function Support() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [activeTicket, setActiveTicket] = useState(null)

  const [reply, setReply] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  // ---------------------------------------------------------
  // Load tickets depending on role
  // ---------------------------------------------------------

  const load = async () => {
    setLoading(true)

    try {
      if (isAdmin) {
        const response = await supportApi.allTickets({
          page: 1,
          page_size: 100,
          ...(statusFilter ? { status_filter: statusFilter } : {}),
        })

        setTickets(response.items || [])
      } else {
        const response = await supportApi.myTickets()
        setTickets(response || [])
      }
    } catch (err) {
      toast.error(
        apiErrorMessage(
          err,
          isAdmin
            ? 'Could not load support tickets'
            : 'Could not load your support tickets'
        )
      )

      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [isAdmin, statusFilter])

  // ---------------------------------------------------------
  // Open ticket details
  // ---------------------------------------------------------

  const openTicket = async (id) => {
    try {
      const ticket = await supportApi.get(id)
      setActiveTicket(ticket)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open support ticket'))
    }
  }

  // ---------------------------------------------------------
  // Reply
  // ---------------------------------------------------------

  const handleReply = async (e) => {
    e.preventDefault()

    if (!activeTicket || !reply.trim()) {
      return
    }

    setReplyLoading(true)

    try {
      await supportApi.reply(activeTicket.id, {
        content: reply.trim(),
      })

      toast.success(
        isAdmin
          ? 'Response sent to the user'
          : 'Reply added to your ticket'
      )

      setReply('')

      // Reload complete ticket so new reply/status is visible
      await openTicket(activeTicket.id)

      // Refresh ticket list
      await load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not send reply'))
    } finally {
      setReplyLoading(false)
    }
  }

  // ---------------------------------------------------------
  // Admin status update
  // ---------------------------------------------------------

  const updateStatus = async (status) => {
    if (!activeTicket || !isAdmin) {
      return
    }

    setStatusLoading(true)

    try {
      await supportApi.update(activeTicket.id, {
        status,
      })

      toast.success(`Ticket marked as ${formatStatus(status)}`)

      await openTicket(activeTicket.id)
      await load()
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not update ticket status')
      )
    } finally {
      setStatusLoading(false)
    }
  }

  // ---------------------------------------------------------
  // CUSTOMER / NORMAL USER SCREEN
  // ---------------------------------------------------------

  if (!isAdmin) {
    return (
      <CustomerSupport
        tickets={tickets}
        loading={loading}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        activeTicket={activeTicket}
        setActiveTicket={setActiveTicket}
        openTicket={openTicket}
        reply={reply}
        setReply={setReply}
        replyLoading={replyLoading}
        handleReply={handleReply}
        load={load}
      />
    )
  }

  // ---------------------------------------------------------
  // ADMIN SUPPORT SCREEN
  // ---------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Support Management"
        subtitle="Review and resolve support tickets raised by users."
      />

      {/* Admin filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {ADMIN_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={
              statusFilter === filter.value
                ? 'btn-primary btn-sm'
                : 'btn-outline btn-sm'
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets"
          description={
            statusFilter
              ? `There are no ${formatStatus(statusFilter).toLowerCase()} tickets.`
              : 'There are currently no support tickets from users.'
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => openTicket(ticket.id)}
              className="card p-5 w-full text-left hover:shadow-lifted transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate">
                    {ticket.ticket_number}
                  </p>

                  <p className="font-semibold text-sm text-charcoal mt-1">
                    {ticket.subject}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    {ticket.category} · {timeAgo(ticket.created_at)}
                  </p>

                  <p className="text-xs text-slate mt-2">
                    Customer #{ticket.customer_id}
                  </p>
                </div>

                <StatusBadge status={ticket.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Admin ticket details */}
      <Modal
        open={!!activeTicket}
        onClose={() => {
          setActiveTicket(null)
          setReply('')
        }}
        title={activeTicket?.subject || 'Support ticket'}
        maxWidth="max-w-2xl"
      >
        {activeTicket && (
          <AdminTicketDetails
            ticket={activeTicket}
            reply={reply}
            setReply={setReply}
            replyLoading={replyLoading}
            statusLoading={statusLoading}
            handleReply={handleReply}
            updateStatus={updateStatus}
          />
        )}
      </Modal>
    </div>
  )
}

// ============================================================================
// CUSTOMER / NORMAL USER SUPPORT
// ============================================================================

function CustomerSupport({
  tickets,
  loading,
  createOpen,
  setCreateOpen,
  activeTicket,
  setActiveTicket,
  openTicket,
  reply,
  setReply,
  replyLoading,
  handleReply,
  load,
}) {
  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Get help with bookings, payments, or anything else."
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-gold"
          >
            <Plus size={16} />
            New ticket
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets"
          description="Need help? Open a new ticket and we'll get back to you."
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => openTicket(ticket.id)}
              className="card p-4 w-full text-left flex items-center justify-between gap-4 hover:shadow-lifted transition-shadow"
            >
              <div>
                <p className="font-mono text-xs text-slate">
                  {ticket.ticket_number}
                </p>

                <p className="font-semibold text-sm text-charcoal mt-0.5">
                  {ticket.subject}
                </p>

                <p className="text-xs text-slate mt-1">
                  {ticket.category} · {timeAgo(ticket.created_at)}
                </p>
              </div>

              <StatusBadge status={ticket.status} />
            </button>
          ))}
        </div>
      )}

      {/* New ticket */}
      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      {/* Customer ticket details */}
      <Modal
        open={!!activeTicket}
        onClose={() => {
          setActiveTicket(null)
          setReply('')
        }}
        title={activeTicket?.subject || ''}
        maxWidth="max-w-xl"
      >
        {activeTicket && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={activeTicket.status} />
              <span className="badge-neutral">
                {activeTicket.category}
              </span>
            </div>

            <p className="text-sm text-charcoal/80 mb-5">
              {activeTicket.description}
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin mb-4">
              {activeTicket.replies?.map((r) => (
                <div
                  key={r.id}
                  className="bg-sand rounded-xl p-3"
                >
                  <p className="text-sm text-charcoal">
                    {r.content}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    {timeAgo(r.created_at)}
                  </p>
                </div>
              ))}
            </div>

            {activeTicket.status !== 'CLOSED' && (
              <form
                onSubmit={handleReply}
                className="flex gap-2"
              >
                <input
                  className="input flex-1"
                  placeholder="Add a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={replyLoading}
                  className="btn-gold shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============================================================================
// ADMIN TICKET DETAILS
// ============================================================================

function AdminTicketDetails({
  ticket,
  reply,
  setReply,
  replyLoading,
  statusLoading,
  handleReply,
  updateStatus,
}) {
  const isClosed = ticket.status === 'CLOSED'

  return (
    <div>
      {/* Ticket information */}
      <div className="bg-sand rounded-xl p-4 mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <StatusBadge status={ticket.status} />

          <span className="badge-neutral">
            {ticket.category}
          </span>

          {ticket.priority && (
            <span className="badge-neutral">
              Priority: {ticket.priority}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate">Ticket</p>
            <p className="font-mono font-semibold text-charcoal">
              {ticket.ticket_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate">Customer</p>
            <p className="font-semibold text-charcoal">
              Customer #{ticket.customer_id}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate">Created</p>
            <p className="text-charcoal">
              {timeAgo(ticket.created_at)}
            </p>
          </div>

          {ticket.resolved_at && (
            <div>
              <p className="text-xs text-slate">Resolved</p>
              <p className="text-charcoal">
                {timeAgo(ticket.resolved_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User issue */}
      <div className="mb-5">
        <p className="field-label">Customer issue</p>

        <div className="bg-white border border-ink/10 rounded-xl p-4">
          <p className="text-sm text-charcoal whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      </div>

      {/* Conversation */}
      <div className="mb-5">
        <p className="field-label">Conversation</p>

        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
          {ticket.replies?.length ? (
            ticket.replies.map((message) => (
              <div
                key={message.id}
                className="bg-sand rounded-xl p-3"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-xs font-semibold text-charcoal">
                    {message.sender_id === ticket.customer_id
                      ? 'Customer'
                      : 'Admin'}
                  </p>

                  <p className="text-xs text-slate">
                    {timeAgo(message.created_at)}
                  </p>
                </div>

                <p className="text-sm text-charcoal whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-sand rounded-xl p-4">
              <p className="text-sm text-slate">
                No replies yet. Acknowledge the ticket by sending a response.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin actions */}
      <div className="border-t border-ink/10 pt-4">
        <p className="field-label mb-2">Ticket actions</p>

        <div className="flex flex-wrap gap-2">
          {ticket.status === 'OPEN' && (
            <button
              type="button"
              disabled={statusLoading}
              onClick={() => updateStatus('IN_PROGRESS')}
              className="btn-primary btn-sm"
            >
              <Clock3 size={14} />
              Acknowledge
            </button>
          )}

          {['OPEN', 'IN_PROGRESS'].includes(ticket.status) && (
            <button
              type="button"
              disabled={statusLoading}
              onClick={() => updateStatus('RESOLVED')}
              className="btn-gold btn-sm"
            >
              <CheckCircle2 size={14} />
              Resolve
            </button>
          )}

          {ticket.status === 'RESOLVED' && (
            <button
              type="button"
              disabled={statusLoading}
              onClick={() => updateStatus('CLOSED')}
              className="btn-outline btn-sm"
            >
              <XCircle size={14} />
              Close ticket
            </button>
          )}
        </div>
      </div>

      {/* Admin reply */}
      {!isClosed && (
        <form
          onSubmit={handleReply}
          className="flex gap-2 mt-4"
        >
          <input
            className="input flex-1"
            placeholder="Reply to customer…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />

          <button
            type="submit"
            disabled={replyLoading || !reply.trim()}
            className="btn-gold shrink-0"
          >
            <Send size={16} />
            <span className="hidden sm:inline">
              {replyLoading ? 'Sending…' : 'Reply'}
            </span>
          </button>
        </form>
      )}
    </div>
  )
}

// ============================================================================
// CREATE TICKET MODAL
// ============================================================================

function CreateTicketModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState({
    category: 'BOOKING',
    subject: '',
    description: '',
    priority: 'MEDIUM',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      await supportApi.createTicket(form)

      toast.success('Support ticket created')

      onCreated()
      onClose()

      setForm({
        category: 'BOOKING',
        subject: '',
        description: '',
        priority: 'MEDIUM',
      })
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not create support ticket')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New support ticket"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="field-label">
            Category
          </label>

          <select
            className="select"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          >
            {CATEGORIES.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">
            Subject
          </label>

          <input
            required
            className="input"
            value={form.subject}
            onChange={(e) =>
              setForm({
                ...form,
                subject: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="field-label">
            Description
          </label>

          <textarea
            required
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Submitting…' : 'Submit ticket'}
        </button>
      </form>
    </Modal>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatStatus(status) {
  if (!status) return ''

  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
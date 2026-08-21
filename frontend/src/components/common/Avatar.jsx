export default function Avatar({ name = '', src, size = 36 }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-ink/10"
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-ink-gradient text-white flex items-center justify-center font-semibold shrink-0"
    >
      <span style={{ fontSize: size * 0.38 }}>{initials || '?'}</span>
    </div>
  )
}

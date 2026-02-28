export default function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)

  const intervals = [
    { label: 'ano', seconds: 31536000 },
    { label: 'mês', seconds: 2592000 },
    { label: 'dia', seconds: 86400 },
    { label: 'hora', seconds: 3600 },
    { label: 'minuto', seconds: 60 }
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `há ${count} ${interval.label}${count > 1 ? 's' : ''}`
    }
  }

  return 'agora mesmo'
}

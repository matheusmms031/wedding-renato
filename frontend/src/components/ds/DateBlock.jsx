export function DateBlock({
  month = 'DEZEMBRO',
  day = '20',
  weekday = 'DOMINGO',
  time = 'ÀS 11H',
  year = '2026',
}) {
  return (
    <div className="ds-date">
      {month && <span className="ds-date__month">{month}</span>}
      <div className="ds-date__row">
        <span className="ds-date__rule">{weekday}</span>
        <span className="ds-date__day">{day}</span>
        <span className="ds-date__rule">{time}</span>
      </div>
      {year && <span className="ds-date__year">{year}</span>}
    </div>
  )
}

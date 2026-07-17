import React, { useEffect, useMemo, useState } from 'react';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700'
};

function getDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function CalendarView({ appointments = [], onCreateAppointment, loading = false }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const normalizedAppointments = useMemo(
    () => (Array.isArray(appointments) ? appointments.filter((item) => item?.scheduledAt) : []),
    [appointments]
  );

  const appointmentsByDay = useMemo(() => {
    return normalizedAppointments.reduce((accumulator, appointment) => {
      const key = getDateKey(appointment.scheduledAt);
      if (!key) return accumulator;
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(appointment);
      accumulator[key].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      return accumulator;
    }, {});
  }, [normalizedAppointments]);

  const monthDays = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    const firstWeekday = start.getDay();

    for (let index = 0; index < firstWeekday; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }

    return days;
  }, [currentMonth]);

  const selectedKey = getDateKey(selectedDate);
  const selectedAppointments = appointmentsByDay[selectedKey] || [];

  useEffect(() => {
    if (!selectedKey || !selectedKey.startsWith(getDateKey(currentMonth).slice(0, 7))) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    }
  }, [currentMonth, selectedKey]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Appointment Calendar</p>
          <h3 className="text-xl font-bold text-slate-900">
            {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={onCreateAppointment}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Schedule Appointment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          Loading appointments...
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_320px]">
          <div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="min-h-[96px] rounded-2xl border border-transparent bg-transparent" />;
                }

                const key = getDateKey(day);
                const dayAppointments = appointmentsByDay[key] || [];
                const isSelected = key === selectedKey;
                const isToday = key === getDateKey(new Date());

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[96px] rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50/70 hover:border-emerald-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {day.getDate()}
                      </span>
                      {dayAppointments.length ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {dayAppointments.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {dayAppointments.slice(0, 3).map((appointment, dotIndex) => (
                        <span
                          key={`${appointment.id || appointment._id || appointment.title}-${dotIndex}`}
                          className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                        />
                      ))}
                      {dayAppointments.length > 3 ? (
                        <span className="text-[11px] font-medium text-slate-400">+{dayAppointments.length - 3}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="border-b border-slate-200 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Day</p>
              <h4 className="mt-1 text-lg font-bold text-slate-900">
                {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>
            </div>

            {selectedAppointments.length ? (
              <div className="mt-4 space-y-3">
                {selectedAppointments.map((appointment) => {
                  const statusKey = String(appointment.status || 'scheduled').toLowerCase();
                  return (
                    <article
                      key={appointment.id || appointment._id || `${appointment.title}-${appointment.scheduledAt}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatTime(appointment.scheduledAt)}</p>
                          <h5 className="mt-1 text-sm font-semibold text-slate-900">{appointment.title || appointment.type || 'Appointment'}</h5>
                          {appointment.type ? <p className="mt-1 text-xs text-slate-500">{appointment.type}</p> : null}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[statusKey] || 'bg-slate-100 text-slate-700'}`}>
                          {statusKey.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">No appointments scheduled for this day.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

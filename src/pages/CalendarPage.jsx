import { useState } from "react";
import { useApp } from "../context/AppProvider";
import { PageHeader, PriorityBadge, StatusBadge } from "../components/SharedComponents";
import { normalizeDisciplineId, PRIORITY_COLORS } from "../constants";

export default function CalendarPage() {
  const { tasks, disciplines } = useApp();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getTasksForDay = (day) => tasks.filter((t) => {
    const d = new Date(t.dataEntrega + "T00:00");
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });

  const getDisciplineName = (id) => disciplines.find((d) => normalizeDisciplineId(d.id) === normalizeDisciplineId(id))?.nome || "—";

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div>
      <PageHeader title="Calendário" subtitle="Visualize suas tarefas por data." />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">◀</button>
          <h2 className="font-semibold text-gray-800 text-lg">{monthNames[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">▶</button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const dots = dayTasks.slice(0, 3);
            return (
              <div key={i} onClick={() => day && setSelectedDay(day === selectedDay ? null : day)} className={`min-h-[52px] p-1 rounded-xl flex flex-col items-center transition-colors cursor-pointer ${!day ? "" : isToday(day) ? "bg-indigo-100 ring-2 ring-indigo-400" : day === selectedDay ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                {day && (
                  <>
                    <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${isToday(day) ? "bg-indigo-600 text-white" : "text-gray-700"}`}>{day}</span>
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dots.map((t, ti) => (
                        <div key={ti} className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[t.prioridade]?.dot || "#6366f1" }} />
                      ))}
                      {dayTasks.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          {Object.entries(PRIORITY_COLORS).map(([label, c]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />
              <span className="text-xs text-gray-500 capitalize">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">H</span>
            </div>
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Tarefas em {String(selectedDay).padStart(2, "0")}/{String(month + 1).padStart(2, "0")}/{year}</h3>
          {selectedTasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhuma tarefa neste dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedTasks.map((t) => {
                const c = PRIORITY_COLORS[t.prioridade] || PRIORITY_COLORS.baixa;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${t.status === "concluída" ? "line-through text-gray-400" : "text-gray-800"}`}>{t.titulo}</p>
                      <p className="text-xs text-gray-400">{getDisciplineName(t.disciplinaId)}</p>
                    </div>
                    <div className="flex gap-2">
                      <PriorityBadge prioridade={t.prioridade} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

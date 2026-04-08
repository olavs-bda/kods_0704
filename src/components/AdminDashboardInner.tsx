// src/components/AdminDashboardInner.tsx
// Dashboard tables powered by Convex queries — rendered inside ConvexClientProvider
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props {
  password: string;
  onLogout: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("lv-LV", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardInner({ password, onLogout }: Props) {
  const sessions = useQuery(api.dashboard.getActiveSessionCounts, { password });
  const taskStats = useQuery(api.dashboard.getTaskCompletionStats, {
    password,
  });
  const recent = useQuery(api.dashboard.getRecentSubmissions, { password });

  // If any query errors due to bad password, show error
  const isLoading =
    sessions === undefined || taskStats === undefined || recent === undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface font-headline">
          Administratora panelis
        </h1>
        <button
          onClick={onLogout}
          className="rounded-xl border border-outline-variant px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Iziet
        </button>
      </div>

      {isLoading ?
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      : <>
          {/* Active Sessions */}
          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-3 font-headline">
              Aktīvās sesijas
            </h2>
            <div className="overflow-x-auto rounded-xl border border-outline-variant">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Organizācija
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Kods</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Aktīvās
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Kopā</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {sessions.map((s) => (
                    <tr
                      key={s.orgCode}
                      className="hover:bg-surface-container/50"
                    >
                      <td className="px-4 py-3">{s.orgName}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {s.orgCode}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {s.activeSessions}
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface-variant">
                        {s.totalSessions}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-on-surface-variant"
                      >
                        Nav organizāciju.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Task Completion Stats */}
          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-3 font-headline">
              Uzdevumu statistika
            </h2>
            <div className="overflow-x-auto rounded-xl border border-outline-variant">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Uzdevums
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Līmenis
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Iesniegumi
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Vid. vērtējums
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {taskStats.map((t) => (
                    <tr
                      key={t.taskSlug}
                      className="hover:bg-surface-container/50"
                    >
                      <td className="px-4 py-3">{t.taskTitle}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {t.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {t.submissionCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.avgScore !== null ?
                          <span className="font-semibold">{t.avgScore}/10</span>
                        : <span className="text-on-surface-variant">—</span>}
                      </td>
                    </tr>
                  ))}
                  {taskStats.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-on-surface-variant"
                      >
                        Nav uzdevumu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Submissions */}
          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-3 font-headline">
              Pēdējie iesniegumi
            </h2>
            <div className="overflow-x-auto rounded-xl border border-outline-variant">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Laiks</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Dalībnieks
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Uzdevums
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Līm.</th>
                    <th className="px-4 py-3 text-right font-medium">Vērt.</th>
                    <th className="px-4 py-3 text-left font-medium">Uzvedne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {recent.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-surface-container/50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-on-surface-variant">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.participantCode}
                      </td>
                      <td className="px-4 py-3">{r.taskTitle}</td>
                      <td className="px-4 py-3 text-center">{r.taskLevel}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {r.score !== null ? r.score : "—"}
                      </td>
                      <td
                        className="px-4 py-3 max-w-xs truncate text-on-surface-variant"
                        title={r.prompt}
                      >
                        {r.prompt}
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-on-surface-variant"
                      >
                        Nav iesniegumu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      }
    </div>
  );
}

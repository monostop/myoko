import { useState } from 'react'
import type { ResortState, ManualResortData } from '@/types'
import { getWeatherIcon } from '@/lib/weather-api'
import { Button } from '@/components/ui/button'
import { ManualInputDialog } from './ManualInputDialog'

interface ResortTableProps {
  resorts: ResortState[]
  isLoading: boolean
  onUpdateManualData: (resortId: string, data: Partial<ManualResortData>) => void
  onRefreshWeather: () => void
}

function formatTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function ResortTable({
  resorts,
  isLoading,
  onUpdateManualData,
  onRefreshWeather,
}: ResortTableProps) {
  const [editingResort, setEditingResort] = useState<ResortState | null>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Tomorrow's Conditions
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshWeather}
          disabled={isLoading}
          className="text-xs uppercase tracking-wider"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading
            </span>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-3 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Map
              </th>
              <th className="px-5 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Resort
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Drive
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Altitude
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Slopes
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Terrain
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Lifts
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Lift Status
              </th>
              <th className="px-4 py-4 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Forecast
              </th>
              <th className="px-4 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Notes
              </th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {resorts.map((resort, index) => (
              <tr
                key={resort.config.id}
                className="group border-b border-border/30 last:border-0 transition-colors hover:bg-accent/30"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Trail Map Thumbnail */}
                <td className="px-3 py-4 text-center">
                  {resort.config.trailMapImage ? (
                    <button
                      onClick={() => setLightboxImage({
                        src: `${import.meta.env.BASE_URL}maps/${resort.config.trailMapImage}`,
                        title: resort.config.name
                      })}
                      className="block w-12 h-12 rounded-md overflow-hidden border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}maps/${resort.config.trailMapImage}`}
                        alt={`${resort.config.name} trail map`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center">
                      <span className="text-muted-foreground/50 text-[10px]">—</span>
                    </div>
                  )}
                </td>

                {/* Resort Name */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <a
                      href={resort.config.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {resort.config.name}
                    </a>
                    <span className="text-xs text-muted-foreground/70">
                      {resort.config.nameJp}
                    </span>
                  </div>
                </td>

                {/* Drive Time */}
                <td className="px-4 py-4 text-center">
                  <span className="tabular-nums text-sm">
                    {resort.config.driveMinutes}
                    <span className="text-muted-foreground ml-0.5">m</span>
                  </span>
                </td>

                {/* Altitude */}
                <td className="px-4 py-4 text-center">
                  <span className="tabular-nums text-sm">
                    {resort.config.baseElevation}
                    <span className="text-muted-foreground mx-0.5">→</span>
                    {resort.config.summitElevation}
                    <span className="text-muted-foreground ml-0.5">m</span>
                  </span>
                </td>

                {/* Slopes */}
                <td className="px-4 py-4 text-center">
                  <span className="tabular-nums text-sm">
                    {resort.manual.slopesOpen !== null ? (
                      <>
                        {resort.manual.slopesOpen}
                        <span className="text-muted-foreground">/</span>
                      </>
                    ) : null}
                    {resort.config.slopesTotal}
                  </span>
                </td>

                {/* Terrain */}
                <td className="px-4 py-4 text-center">
                  <span className="tabular-nums text-xs">
                    <span className="text-green-600 dark:text-green-400">{resort.config.terrain.beginner}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-600 dark:text-red-400">{resort.config.terrain.intermediate}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground">{resort.config.terrain.advanced}</span>
                  </span>
                </td>

                {/* Lifts */}
                <td className="px-4 py-4 text-center">
                  <span className="tabular-nums text-sm">
                    {resort.manual.liftsOpen !== null ? (
                      <>
                        {resort.manual.liftsOpen}
                        <span className="text-muted-foreground">/</span>
                      </>
                    ) : null}
                    {resort.config.liftsTotal}
                  </span>
                </td>

                {/* Lift Status Link */}
                <td className="px-4 py-4 text-center">
                  {resort.config.liftStatusUrl ? (
                    <a
                      href={resort.config.liftStatusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      title="View lift status"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Weather Forecast */}
                <td className="px-4 py-4 text-center">
                  {resort.weather ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getWeatherIcon(resort.weather.weatherCode)}</span>
                        <span className="tabular-nums text-sm font-medium">
                          {resort.weather.snowfall24h > 0 && (
                            <span className="text-sky-600 dark:text-sky-400">
                              {Math.round(resort.weather.snowfall24h)}cm
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {Math.round(resort.weather.temperatureMin)}° / {Math.round(resort.weather.temperatureMax)}°
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Notes */}
                <td className="px-4 py-4 text-left">
                  {resort.config.notes ? (
                    <span className="text-xs text-muted-foreground/70 italic">
                      {resort.config.notes}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Edit */}
                <td className="px-4 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingResort(resort)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Last Updated */}
      {resorts.some(r => r.manual.updatedAt) && (
        <p className="text-[10px] text-muted-foreground/60 text-right">
          Last updated:{' '}
          {formatTime(
            resorts
              .map(r => r.manual.updatedAt)
              .filter(Boolean)
              .sort()
              .reverse()[0] ?? ''
          )}
        </p>
      )}

      {/* Edit Dialog */}
      {editingResort && (
        <ManualInputDialog
          resort={editingResort}
          open={!!editingResort}
          onOpenChange={(open) => !open && setEditingResort(null)}
          onSave={(data) => {
            onUpdateManualData(editingResort.config.id, data)
            setEditingResort(null)
          }}
        />
      )}

      {/* Trail Map Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-[95vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-3xl font-light"
            >
              ×
            </button>
            <img
              src={lightboxImage.src}
              alt={`${lightboxImage.title} trail map`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="text-center mt-3 text-white/80 text-lg">
              {lightboxImage.title} — Trail Map
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

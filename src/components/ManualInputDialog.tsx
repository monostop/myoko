import { useState } from 'react'
import type { ResortState, ConfigOverride } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ManualInputDialogProps {
  resort: ResortState
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ConfigOverride) => void
}

export function ManualInputDialog({
  resort,
  open,
  onOpenChange,
  onSave,
}: ManualInputDialogProps) {
  const [beginner, setBeginner] = useState(
    resort.config.terrain.beginner.toString()
  )
  const [intermediate, setIntermediate] = useState(
    resort.config.terrain.intermediate.toString()
  )
  const [advanced, setAdvanced] = useState(
    resort.config.terrain.advanced.toString()
  )
  const [driveMinutes, setDriveMinutes] = useState(
    resort.config.driveMinutes.toString()
  )
  const [notes, setNotes] = useState(resort.config.notes ?? '')

  const handleSave = () => {
    onSave({
      terrain: {
        beginner: parseInt(beginner, 10) || 0,
        intermediate: parseInt(intermediate, 10) || 0,
        advanced: parseInt(advanced, 10) || 0,
      },
      driveMinutes: parseInt(driveMinutes, 10) || 0,
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-3">
            <span>{resort.config.name}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {resort.config.nameJp}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Terrain / Slopes */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Slopes by Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-wide text-muted-foreground/70 block mb-1">
                  Beginner
                </label>
                <Input
                  type="number"
                  min={0}
                  value={beginner}
                  onChange={(e) => setBeginner(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wide text-muted-foreground/70 block mb-1">
                  Intermediate
                </label>
                <Input
                  type="number"
                  min={0}
                  value={intermediate}
                  onChange={(e) => setIntermediate(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wide text-muted-foreground/70 block mb-1">
                  Advanced
                </label>
                <Input
                  type="number"
                  min={0}
                  value={advanced}
                  onChange={(e) => setAdvanced(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Drive Time */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Drive Time (minutes)
            </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 15"
              value={driveMinutes}
              onChange={(e) => setDriveMinutes(e.target.value)}
              className="h-11 tabular-nums"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Notes
              <span className="text-muted-foreground/60 ml-1">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="Any additional info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

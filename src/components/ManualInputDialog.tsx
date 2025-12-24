import { useState } from 'react'
import type { ResortState, ManualResortData, ResortStatus } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ManualInputDialogProps {
  resort: ResortState
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<ManualResortData>) => void
}

const STATUS_OPTIONS: { value: ResortStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'UNKNOWN', label: 'Unknown' },
]

export function ManualInputDialog({
  resort,
  open,
  onOpenChange,
  onSave,
}: ManualInputDialogProps) {
  const [status, setStatus] = useState<ResortStatus>(resort.manual.status)
  const [baseDepth, setBaseDepth] = useState(
    resort.manual.baseDepthCm?.toString() ?? ''
  )
  const [liftsOpen, setLiftsOpen] = useState(
    resort.manual.liftsOpen?.toString() ?? ''
  )
  const [slopesOpen, setSlopesOpen] = useState(
    resort.manual.slopesOpen?.toString() ?? ''
  )
  const [notes, setNotes] = useState(resort.manual.notes)

  const handleSave = () => {
    onSave({
      status,
      baseDepthCm: baseDepth ? parseInt(baseDepth, 10) : null,
      liftsOpen: liftsOpen ? parseInt(liftsOpen, 10) : null,
      slopesOpen: slopesOpen ? parseInt(slopesOpen, 10) : null,
      notes,
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
          {/* Status */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Status
            </label>
            <Select value={status} onValueChange={(v) => setStatus(v as ResortStatus)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Base Depth */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Base Depth (cm)
            </label>
            <Input
              type="number"
              placeholder="e.g. 120"
              value={baseDepth}
              onChange={(e) => setBaseDepth(e.target.value)}
              className="h-11 tabular-nums"
            />
          </div>

          {/* Lifts Open */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Lifts Open
              <span className="text-muted-foreground/60 ml-1">
                (of {resort.config.liftsTotal})
              </span>
            </label>
            <Input
              type="number"
              placeholder={`0–${resort.config.liftsTotal}`}
              min={0}
              max={resort.config.liftsTotal}
              value={liftsOpen}
              onChange={(e) => setLiftsOpen(e.target.value)}
              className="h-11 tabular-nums"
            />
          </div>

          {/* Slopes Open */}
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Slopes Open
              <span className="text-muted-foreground/60 ml-1">
                (of {resort.config.slopesTotal})
              </span>
            </label>
            <Input
              type="number"
              placeholder={`0–${resort.config.slopesTotal}`}
              min={0}
              max={resort.config.slopesTotal}
              value={slopesOpen}
              onChange={(e) => setSlopesOpen(e.target.value)}
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

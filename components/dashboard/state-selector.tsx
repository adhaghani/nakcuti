"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MALAYSIAN_STATES, STATE_LABELS, type MalaysianStateCode } from "@/lib/domain/states"

interface StateSelectorProps {
  value?: MalaysianStateCode
  onChange: (value: MalaysianStateCode) => void
}

export function StateSelector({ value, onChange }: StateSelectorProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as MalaysianStateCode)}>
      <SelectTrigger className="w-full sm:w-72">
        <SelectValue placeholder="Select state" />
      </SelectTrigger>
      <SelectContent>
        {MALAYSIAN_STATES.map((state) => (
          <SelectItem key={state} value={state}>
            {STATE_LABELS[state]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

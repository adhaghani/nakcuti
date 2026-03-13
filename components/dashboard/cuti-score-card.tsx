import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CutiScoreCardProps {
  score: number
  leaveBudget: number
}

export function CutiScoreCard({ score, leaveBudget }: CutiScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuti Score</CardTitle>
        <CardDescription>Efficiency score based on leave-to-break ratio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-semibold tracking-tight">{score.toFixed(1)}</div>
        <Badge variant="secondary">Annual leave budget: {leaveBudget} days</Badge>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function TravelSyncPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Travel Sync</CardTitle>
        <CardDescription>Upcoming feature linked to your long-weekend opportunities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Placeholder recommendations:</p>
        <p>- Penang 3D2N (Budget Tier: RM400-RM700)</p>
        <p>- Kuala Terengganu 3D2N (Budget Tier: RM350-RM650)</p>
        <p>- Kota Kinabalu 4D3N (Budget Tier: RM900-RM1500)</p>
      </CardContent>
    </Card>
  )
}

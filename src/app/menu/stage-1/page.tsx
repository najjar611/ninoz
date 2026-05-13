// ════════════════════════════════════════════════════════════
// STAGE 1 PLAN LIST PAGE
// To change title/description: edit props below
// To edit plans: edit meals-data.ts
// ════════════════════════════════════════════════════════════
import PlanListTemplate from '../PlanListTemplate'
import { stage1Plans } from '../meals-data'

export const metadata = { title: 'Baby Blends Plans | Ninoz' }

export default function Stage1Page() {
  return (
    <PlanListTemplate
      stage="Stage 1"
      ageRange="3–6 months"
      title="Baby Blends"
      description="Choose a plan below. Each plan has a unique weekly meal schedule prepared fresh daily."
      accentColor="#E8834A"
      plans={stage1Plans}
      stageSlug="stage-1"
    />
  )
}

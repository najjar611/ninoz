// ════════════════════════════════════════════════════════════
// STAGE 3 PLAN LIST PAGE
// To change title/description: edit props below
// To edit plans: edit meals-data.ts
// ════════════════════════════════════════════════════════════
import PlanListTemplate from '../PlanListTemplate'
import { stage3Plans } from '../meals-data'

export const metadata = { title: 'Big Baby Meals Plans | Ninoz' }

export default function Stage3Page() {
  return (
    <PlanListTemplate
      stage="Stage 3"
      ageRange="1–3 years"
      title="Big Baby Meals"
      description="Choose a plan below. Each plan has a unique weekly meal schedule prepared fresh daily."
      accentColor="#7B5EA7"
      plans={stage3Plans}
      stageSlug="stage-3"
    />
  )
}

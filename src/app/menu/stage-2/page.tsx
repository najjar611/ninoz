// ════════════════════════════════════════════════════════════
// STAGE 2 PLAN LIST PAGE
// To change title/description: edit props below
// To edit plans: edit meals-data.ts
// ════════════════════════════════════════════════════════════
import PlanListTemplate from '../PlanListTemplate'
import { stage2Plans } from '../meals-data'

export const metadata = { title: 'Textured Meals Plans | Ninoz' }

export default function Stage2Page() {
  return (
    <PlanListTemplate
      stage="Stage 2"
      ageRange="6–12 months"
      title="Textured Meals"
      description="Choose a plan below. Each plan has a unique weekly meal schedule prepared fresh daily."
      accentColor="#4A7C59"
      plans={stage2Plans}
      stageSlug="stage-2"
    />
  )
}

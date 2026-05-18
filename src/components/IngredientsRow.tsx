'use client'

// ══════════════════════════════════════════════════════════
// IngredientsRow.tsx — v5
// Displayed inside the "Why Ninoz" section on the homepage
// Shows 4 ingredient photos with name + description
// Fetched from Supabase ingredients table
// Editable from admin portal: /admin/ingredients
// ══════════════════════════════════════════════════════════

type Ingredient = {
  id: string
  name: string
  description: string
  image_url: string | null
  position: number
  is_active: boolean
}

type Props = {
  ingredients: Ingredient[]
}

// Fallback emojis for ingredients without images
const FALLBACK_EMOJIS = ['🥕', '🍠', '🥦', '🍳', '🌽', '🥑', '🫐', '🍇']

export default function IngredientsRow({ ingredients }: Props) {
  const active = ingredients
    .filter(i => i.is_active)
    .sort((a, b) => a.position - b.position)
    .slice(0, 4)

  if (active.length === 0) return null

  return (
    <>
      <style>{`
        .ing-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 0 0 12px;
        }

        @media (max-width: 900px) {
          .ing-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .ing-row { grid-template-columns: repeat(2, 1fr); gap: 14px; }
        }

        .ing-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(200,75,15,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(200,75,15,0.1);
        }

        .ing-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .ing-img-placeholder {
          width: 100%;
          height: 160px;
          background: linear-gradient(135deg, #FDF0E8, #FAF5EE);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
        }

        .ing-body {
          padding: 16px 18px 18px;
        }

        .ing-name {
          font-family: 'Nunito', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #2C1A0E;
          margin-bottom: 6px;
        }

        .ing-desc {
          font-size: 12px;
          color: #7A7068;
          line-height: 1.6;
        }

        .ing-badge {
          display: inline-block;
          background: #FDF0E8;
          color: #C84B0F;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 50px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
      `}</style>

      <div className="ing-row">
        {active.map((ing, idx) => (
          <div key={ing.id} className="ing-card">
            {ing.image_url ? (
              <img src={ing.image_url} alt={ing.name} className="ing-img" />
            ) : (
              <div className="ing-img-placeholder">
                {FALLBACK_EMOJIS[idx % FALLBACK_EMOJIS.length]}
              </div>
            )}
            <div className="ing-body">
              <div className="ing-badge">100% Organic</div>
              <div className="ing-name">{ing.name}</div>
              <div className="ing-desc">{ing.description}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

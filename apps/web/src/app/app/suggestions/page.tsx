import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuggestionCard } from "@/components/SuggestionCard";

export default async function SuggestionsPage() {
  const user = await requireUser();
  const suggestions = await prisma.aIRecommendation.findMany({
    where: { userId: user.id, status: { in: ["PENDING", "SNOOZED"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="serif text-4xl">✨ Suggestions de l’IA</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Matching collectif, événements publics, agent, vidéo : dans le menu.
      </p>
      <div className="mt-8 grid gap-4">
        {suggestions.length === 0 ? (
          <p className="text-[var(--muted)]">Rien en attente.</p>
        ) : (
          suggestions.map((item) => (
            <SuggestionCard
              key={item.id}
              suggestion={{
                id: item.id,
                type: item.type,
                payload: JSON.parse(item.payload) as Record<string, unknown>,
                confidence: item.confidence,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

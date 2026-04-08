// src/components/FeedbackDisplay.tsx
// Structured feedback display: strengths, weaknesses, improved prompt, explanation, next step
interface Feedback {
  strengths_lv: string;
  weaknesses_lv: string;
  improvedPrompt_lv: string;
  explanation_lv: string;
  nextStep_lv: string;
}

export default function FeedbackDisplay({ feedback }: { feedback: Feedback }) {
  return (
    <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-5">
      <h3 className="text-base font-semibold text-green-800">
        AI atgriezeniskā saite
      </h3>

      <FeedbackSection
        icon="✓"
        title="Stiprās puses"
        content={feedback.strengths_lv}
        color="green"
      />

      <FeedbackSection
        icon="△"
        title="Uzlabojumi"
        content={feedback.weaknesses_lv}
        color="amber"
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Uzlabots prompts
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-blue-900 italic">
          "{feedback.improvedPrompt_lv}"
        </p>
      </div>

      <FeedbackSection
        icon="💡"
        title="Paskaidrojums"
        content={feedback.explanation_lv}
        color="gray"
      />

      <FeedbackSection
        icon="→"
        title="Nākamais solis"
        content={feedback.nextStep_lv}
        color="purple"
      />
    </div>
  );
}

function FeedbackSection({
  icon,
  title,
  content,
  color,
}: {
  icon: string;
  title: string;
  content: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-700",
    amber: "text-amber-700",
    gray: "text-gray-700",
    purple: "text-purple-700",
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon} {title}
      </p>
      <p className={`mt-1 text-sm ${colorMap[color] ?? "text-gray-700"}`}>
        {content}
      </p>
    </div>
  );
}

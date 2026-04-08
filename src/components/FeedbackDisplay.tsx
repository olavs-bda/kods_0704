// src/components/FeedbackDisplay.tsx
// Structured feedback display: strengths, weaknesses, improved prompt, explanation, next step
import { MIN_PASSING_SCORE } from "../../convex/constants";

interface Feedback {
  strengths_lv: string;
  weaknesses_lv: string;
  improvedPrompt_lv: string;
  explanation_lv: string;
  nextStep_lv: string;
  score?: number;
}

function scoreColors(score: number) {
  if (score >= 8)
    return {
      bg: "bg-secondary-container",
      text: "text-on-secondary-container",
      ring: "ring-secondary/30",
      label: "Izcili!",
    };
  if (score >= MIN_PASSING_SCORE)
    return {
      bg: "bg-primary-container",
      text: "text-on-primary-container",
      ring: "ring-primary/30",
      label: "Labi",
    };
  return {
    bg: "bg-tertiary-container",
    text: "text-on-tertiary-container",
    ring: "ring-tertiary/30",
    label: "Jāuzlabo",
  };
}

export default function FeedbackDisplay({ feedback }: { feedback: Feedback }) {
  const hasScore = feedback.score != null;
  const colors = hasScore ? scoreColors(feedback.score!) : null;

  return (
    <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 sm:p-5 shadow-[0_12px_32px_rgba(43,52,55,0.04)]">
      {/* Score hero section */}
      {hasScore && colors && (
        <div
          className={`flex flex-col items-center gap-1 rounded-xl ${colors.bg} ring-1 ${colors.ring} py-4 mb-2`}
        >
          <span className={`text-4xl font-extrabold ${colors.text}`}>
            {feedback.score}/10
          </span>
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${colors.text}/80`}
          >
            {colors.label}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined text-primary text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <h3 className="text-base font-bold text-on-surface">
          AI atgriezeniskā saite
        </h3>
      </div>

      <FeedbackSection
        icon="verified"
        title="Stiprās puses"
        content={feedback.strengths_lv}
        iconColor="text-secondary"
        bgColor="bg-secondary-container/30"
      />

      <FeedbackSection
        icon="tips_and_updates"
        title="Uzlabojumi"
        content={feedback.weaknesses_lv}
        iconColor="text-tertiary"
        bgColor="bg-tertiary-container/20"
      />

      <div className="rounded-xl bg-primary-container/20 p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-primary text-sm">
            edit_note
          </span>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Uzlabota uzvedne
          </p>
        </div>
        <p className="text-sm text-on-surface italic leading-relaxed">
          "{feedback.improvedPrompt_lv}"
        </p>
      </div>

      <FeedbackSection
        icon="lightbulb"
        title="Paskaidrojums"
        content={feedback.explanation_lv}
        iconColor="text-outline"
        bgColor="bg-surface-container"
      />

      <FeedbackSection
        icon="arrow_forward"
        title="Nākamais solis"
        content={feedback.nextStep_lv}
        iconColor="text-primary"
        bgColor="bg-surface-container"
      />
    </div>
  );
}

function FeedbackSection({
  icon,
  title,
  content,
  iconColor,
  bgColor,
}: {
  icon: string;
  title: string;
  content: string;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-xl ${bgColor} p-4`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`material-symbols-outlined text-sm ${iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {title}
        </p>
      </div>
      <p className="text-sm text-on-surface leading-relaxed">{content}</p>
    </div>
  );
}

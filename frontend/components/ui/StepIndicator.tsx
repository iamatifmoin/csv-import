interface Step {
  id: number;
  label: string;
}

const STEPS: Step[] = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Processing' },
  { id: 4, label: 'Results' },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                  ${isDone ? 'bg-emerald-500 text-zinc-950' : ''}
                  ${isActive ? 'bg-zinc-100 text-zinc-950' : ''}
                  ${!isDone && !isActive ? 'bg-zinc-800 text-zinc-500' : ''}
                `}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`text-xs font-medium ${isActive ? 'text-zinc-100' : isDone ? 'text-emerald-400' : 'text-zinc-600'}`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-16 h-px mx-1 mb-4 transition-colors ${isDone ? 'bg-emerald-500' : 'bg-zinc-800'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

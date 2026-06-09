import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  label: string;
  description?: string;
  icon?: React.ElementType;
}

interface StepperProps {
  steps: StepItem[];
  currentIndex: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export default function Stepper({
  steps,
  currentIndex,
  orientation = 'horizontal',
  className,
}: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-1', className)}>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300',
                    isCompleted &&
                      'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_16px_rgba(0,180,42,0.4)]',
                    isCurrent &&
                      'bg-primary-500/20 border-primary-500 text-primary-400 shadow-[0_0_20px_rgba(22,93,255,0.5)] animate-pulse-glow',
                    isPending && 'bg-slate-900 border-slate-700 text-slate-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    StepIcon ? (
                      <StepIcon className="w-5 h-5" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )
                  ) : StepIcon ? (
                    <StepIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[48px] my-1 transition-all duration-500 relative overflow-hidden',
                      isCompleted ? 'bg-emerald-500/60' : 'bg-slate-800'
                    )}
                  >
                    {isCompleted && (
                      <div
                        className="absolute inset-0 bg-gradient-to-b from-emerald-400/80 to-emerald-500/80"
                        style={{
                          boxShadow: '0 0 12px rgba(0,180,42,0.5)',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 pb-6">
                <div
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    isCompleted && 'text-emerald-400',
                    isCurrent && 'text-primary-300',
                    isPending && 'text-slate-500'
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div
                    className={cn(
                      'text-xs mt-1 transition-colors',
                      isCurrent ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('w-full flex items-start justify-between', className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isPending = idx > currentIndex;
        const StepIcon = step.icon;
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className={cn('flex flex-col items-center', isLast ? '' : 'flex-1')}>
            <div className="flex items-center w-full">
              <div
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300',
                  isCompleted &&
                    'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_16px_rgba(0,180,42,0.4)]',
                  isCurrent &&
                    'bg-primary-500/20 border-primary-500 text-primary-400 shadow-[0_0_20px_rgba(22,93,255,0.5)] animate-pulse-glow',
                  isPending && 'bg-slate-900 border-slate-700 text-slate-500'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  StepIcon ? (
                    <StepIcon className="w-5 h-5" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )
                ) : StepIcon ? (
                  <StepIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{idx + 1}</span>
                )}
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 relative overflow-hidden bg-slate-800 rounded-full">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 transition-all duration-700 ease-out',
                      isCompleted
                        ? 'w-full bg-emerald-500/70'
                        : isCurrent
                          ? 'w-1/2 bg-gradient-to-r from-primary-500/80 to-primary-400/50'
                          : 'w-0'
                    )}
                    style={{
                      boxShadow: isCompleted
                        ? '0 0 12px rgba(0,180,42,0.5)'
                        : isCurrent
                          ? '0 0 12px rgba(22,93,255,0.5)'
                          : 'none',
                    }}
                  />
                </div>
              )}
            </div>
            <div
              className={cn(
                'mt-3 text-center transition-colors px-2',
                isCompleted && 'text-emerald-400',
                isCurrent && 'text-primary-300',
                isPending && 'text-slate-500'
              )}
            >
              <div className="text-sm font-semibold whitespace-nowrap">{step.label}</div>
              {step.description && (
                <div
                  className={cn(
                    'text-xs mt-1 transition-colors',
                    isCurrent ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

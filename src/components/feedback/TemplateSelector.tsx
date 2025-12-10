'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackTemplate, feedbackTemplates } from '@/lib/feedback-templates';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TemplateSelectorProps {
  selectedTemplate: FeedbackTemplate | null;
  onSelect: (template: FeedbackTemplate) => void;
  className?: string;
}

export function TemplateSelector({
  selectedTemplate,
  onSelect,
  className,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleSelect = (template: FeedbackTemplate) => {
    onSelect(template);
    setIsOpen(false);
  };

  const dropdownVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
      };

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl',
          'bg-white/5 border border-white/10',
          'hover:bg-white/10 hover:border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          'transition-all text-left'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedTemplate ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                'bg-gradient-to-br',
                selectedTemplate.color
              )}
            >
              <selectedTemplate.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{selectedTemplate.name}</p>
              <p className="text-xs text-white/50">{selectedTemplate.description}</p>
            </div>
          </div>
        ) : (
          <span className="text-white/50 text-sm">Selecionar tipo de feedback...</span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/50 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dropdownVariants}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
              className={cn(
                'absolute top-full left-0 right-0 mt-2 z-20',
                'bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl',
                'max-h-80 overflow-y-auto'
              )}
              role="listbox"
            >
              {feedbackTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3',
                      'hover:bg-white/5 transition-colors',
                      'first:rounded-t-xl last:rounded-b-xl',
                      isSelected && 'bg-purple-500/10'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0',
                        'bg-gradient-to-br',
                        template.color
                      )}
                    >
                      <template.icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white">{template.name}</p>
                      <p className="text-xs text-white/50">{template.description}</p>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

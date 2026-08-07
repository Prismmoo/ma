import React from 'react';
import { motion } from 'motion/react';
import { PenLine, Check } from 'lucide-react';

interface PersonalizeButtonProps {
  onClick: () => void;
  /** true عندما يوجد تخصيص محفوظ لهذه اللوحة */
  active: boolean;
  /** ملخص قصير مثل "Signature + Text" — من personalizationSummary() */
  summary?: string;
}

/**
 * زر التخصيص العائم على زاوية إطار اللوحة.
 *
 * قرارات مقصودة:
 * 1) الحاوي الأب هو إطار اللوحة نفسه (يحمل relative أصلًا في الملف القائم)
 *    ⇒ "الزاوية" تصبح زاوية اللوحة فعلًا مهما كانت نسبتها. إصلاح البلاغ 1.
 * 2) يتوسّع أفقيًا ليكشف نصّه عند hover / focus-visible. مغلقًا لا يحجب العمل،
 *    ومفتوحًا يشرح نفسه. أفضل من tooltip لأنه يعمل باللمس أيضًا.
 * 3) عند active=true يبقى مفتوحًا دائمًا ليُطمئن الزبون أن توقيعه محفوظ.
 * 4) نبضة واحدة لا تتكرر (لا حلقة لا نهائية مزعجة تستهلك البطارية).
 */
export const PersonalizeButton: React.FC<PersonalizeButtonProps> = ({
  onClick,
  active,
  summary,
}) => {
  const label = active ? summary || 'Personalized' : 'Personalize';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={active ? `Edit personalization: ${label}` : 'Personalize this artwork'}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.22, type: 'spring', stiffness: 380, damping: 26 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={[
        'group absolute bottom-4 right-4 z-20 cursor-pointer',
        'flex items-center h-9 rounded-full px-2.5 overflow-hidden',
        'border backdrop-blur-md shadow-lg',
        'transition-[background-color,border-color,box-shadow] duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-forest-black',
        active
          ? 'bg-[var(--pz-accent)] border-[var(--pz-accent)] text-white focus-visible:ring-[var(--pz-accent)]'
          : 'bg-forest-black/95 border-forest-gold/45 text-forest-gold hover:border-forest-gold hover:bg-forest-black focus-visible:ring-forest-gold',
      ].join(' ')}
    >
      <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
        {active ? <Check size={15} strokeWidth={2.6} /> : <PenLine size={15} strokeWidth={2.2} />}

        {/* هالة تلمع مرة واحدة عند أول ظهور فقط، وفقط ما دام لا يوجد تخصيص */}
        {!active && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-forest-gold/40"
            initial={{ scale: 1, opacity: 0.65 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.15, delay: 0.55, ease: 'easeOut' }}
          />
        )}
      </span>

      {/*
        حيلة grid-template-columns 0fr ↔ 1fr هي الطريقة الوحيدة في CSS لتحريك "عرض تلقائي"
        بسلاسة. استعمال max-width يعطي توقيتًا متقطّعًا، واستعمال width:auto لا يتحرّك إطلاقًا.
      */}
      <span
        className={[
          'grid transition-[grid-template-columns] duration-300 ease-out',
          active
            ? 'grid-cols-[1fr]'
            : 'grid-cols-[0fr] group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]',
        ].join(' ')}
      >
        <span className="overflow-hidden">
          <span className="block whitespace-nowrap pl-2 pr-1 text-[10px] font-bold tracking-[0.14em] uppercase font-mono">
            {label}
          </span>
        </span>
      </span>
    </motion.button>
  );
};

export default PersonalizeButton;

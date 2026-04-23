import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Euro, Loader2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useMobileBooking } from '../context/MobileBookingContext';
import { detectUserCurrency } from '../../../services/pricingService';

interface StickyCTAProps {
  onSubmit: () => void;
}

export const StickyCTA: React.FC<StickyCTAProps> = ({ onSubmit }) => {
  const intl = useIntl();
  const {
    currentStep,
    totalSteps,
    goNextStep,
    goBackStep,
    isCurrentStepValid,
    isSubmitting,
    displayEUR,
    triggerHaptic,
  } = useMobileBooking();

  const isLastStep = currentStep === totalSteps;
  const currencySymbol = detectUserCurrency() === 'eur' ? '€' : '$';

  // iOS Safari keeps `position: fixed; bottom: 0` anchored to the layout
  // viewport (below the keyboard) on older versions. Track the keyboard
  // offset via visualViewport and translate the CTA so it stays visible
  // above the keyboard on every step.
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const offset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setKeyboardOffset(offset);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  const handleNext = () => {
    if (!isCurrentStepValid || isSubmitting) return;

    if (isLastStep) {
      triggerHaptic('medium');
      onSubmit();
    } else {
      goNextStep();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goBackStep();
    }
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
        transition: 'transform 150ms ease-out',
      }}
    >
      <div className="p-3 flex gap-2">
        {/* Back button */}
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={intl.formatMessage({ id: 'common.back', defaultMessage: 'Retour' })}
            className="px-4 py-3 rounded-2xl border border-gray-300 text-gray-700 font-medium flex items-center justify-center touch-manipulation active:bg-gray-100"
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
        )}

        {/* Next/Submit button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid || isSubmitting}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 touch-manipulation ${
            isCurrentStepValid && !isSubmitting
              ? 'bg-orange-500 active:bg-orange-600 shadow-lg shadow-orange-500/30'
              : 'bg-gray-300'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{intl.formatMessage({ id: 'bookingRequest.processing' })}</span>
            </>
          ) : isLastStep ? (
            <>
              <Euro size={18} />
              <span>{intl.formatMessage({ id: 'bookingRequest.continuePay' })}</span>
              <span className="font-bold">{displayEUR.toFixed(2)}{currencySymbol}</span>
            </>
          ) : (
            <>
              <span>{intl.formatMessage({ id: 'common.next', defaultMessage: 'Suivant' })}</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StickyCTA;

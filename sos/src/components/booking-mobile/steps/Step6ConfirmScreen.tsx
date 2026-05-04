import React from 'react';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useMobileBooking } from '../context/MobileBookingContext';

export const Step6ConfirmScreen: React.FC = () => {
  const intl = useIntl();
  const { form, provider, isLawyer, displayEUR, displayDuration } = useMobileBooking();
  const { control, watch, formState: { errors } } = form;

  const providerTypeLabel = isLawyer
    ? intl.formatMessage({ id: 'providerType.lawyer', defaultMessage: 'Avocat' })
    : intl.formatMessage({ id: 'providerType.expat', defaultMessage: 'Expatrié' });

  return (
    <div className="px-4 pt-4 pb-32">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {intl.formatMessage({
          id: 'bookingRequest.mobile.step6.title',
          defaultMessage: 'Confirmez votre demande',
        })}
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        {intl.formatMessage({
          id: 'bookingRequest.mobile.step6.subtitle',
          defaultMessage: 'Vérifiez vos informations',
        })}
      </p>

      {/* Provider + Price */}
      <div className="bg-red-50 rounded-xl p-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {provider?.avatar ? (
            <img
              src={provider.avatar}
              alt={provider.name || ''}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-600 font-bold flex-shrink-0">
              {provider?.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{provider?.name}</p>
            <p className="text-xs text-gray-500">{providerTypeLabel} • {displayDuration} min</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-xl font-bold text-red-600">{displayEUR.toFixed(2)}€</p>
        </div>
      </div>

      {/* Terms checkbox */}
      <div className={`p-3 rounded-xl border-2 mb-3 ${watch('acceptTerms') ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="acceptTerms"
            rules={{
              validate: (v) => v ? true : intl.formatMessage({ id: 'bookingRequest.validators.accept' }),
            }}
            render={({ field }) => (
              <input
                id="acceptTerms"
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-5 w-5 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            )}
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            {intl.formatMessage({ id: 'bookingRequest.fields.accept' })}
            <Link target="_blank" to="/cgu-clients" className="text-red-600 underline font-medium">
              {intl.formatMessage({ id: 'bookingRequest.cgu' })}
            </Link>
            {intl.formatMessage({ id: 'bookingRequest.fields.andConfirm' })}
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-2 text-sm text-red-600">{String(errors.acceptTerms.message)}</p>
        )}
      </div>

      {/* Compact payment reassurance */}
      <div className="flex items-start gap-2 text-xs text-gray-500 px-1">
        <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        <p>{intl.formatMessage({ id: 'bookingRequest.paymentReassurance' })}</p>
      </div>
    </div>
  );
};

export default Step6ConfirmScreen;

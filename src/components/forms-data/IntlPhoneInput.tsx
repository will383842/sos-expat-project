import React, { useCallback, useMemo } from "react";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "@/styles/intl-phone-input.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface IntlPhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
}

const normalizeCountry = (country?: string): string => {
  if (!country) return "fr";
  return country.toLowerCase();
};

const IntlPhoneInput: React.FC<IntlPhoneInputProps> = ({
  value,
  onChange,
  defaultCountry = "fr",
  placeholder,
  className = "",
  disabled = false,
  name,
}) => {
  const formattedValue = useMemo(
    () => (value ? value.replace(/^\+/, "") : ""),
    [value]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        return;
      }

      if (event.key === "Backspace") {
        const currentValue = value || "";
        const digitsOnly = currentValue.replace(/[^\d]/g, "");
        if (!digitsOnly) {
          event.preventDefault();
          onChange("");
          return;
        }

        const parsed = parsePhoneNumberFromString(currentValue);
        const codeLength = parsed?.countryCallingCode?.length ?? 0;
        if (codeLength && digitsOnly.length <= codeLength) {
          event.preventDefault();
          onChange("");
        }
      }
    },
    [onChange, value]
  );

  const handleChange = (inputValue: string, _country: CountryData) => {
    onChange(inputValue ? `+${inputValue}` : "");
  };

  return (
    <div className={`intl-phone-input ${className}`}>
      <PhoneInput
        country={normalizeCountry(defaultCountry)}
        value={formattedValue}
        onChange={handleChange}
        enableSearch
        disableSearchIcon
        countryCodeEditable={false}
        specialLabel=""
        placeholder={placeholder}
        disabled={disabled}
        inputProps={{
          name,
          autoComplete: "tel",
          onKeyDown: handleKeyDown,
        }}
        containerClass="intl-phone-input__container"
        inputClass="intl-phone-input__field"
        buttonClass="intl-phone-input__flag-btn"
        dropdownClass="intl-phone-input__dropdown"
      />
    </div>
  );
};

export default IntlPhoneInput;


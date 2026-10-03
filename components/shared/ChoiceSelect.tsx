import type { ChoiceOption } from "@/lib/coaching-form-options";
import { EMPTY_CHOICE_LABEL } from "@/lib/coaching-form-options";

type ChoiceSelectProps = {
  label: string;
  name: string;
  options: readonly ChoiceOption[];
  defaultValue?: string | null;
  emptyLabel?: string;
  labelClassName: string;
  selectClassName: string;
};

// Liste déroulante à choix fermé. La valeur vide = « Je ne sais pas encore »
// (jamais une valeur inventée). Une valeur déjà enregistrée mais absente de la
// liste (ancienne saisie libre) reste affichée et sélectionnée : elle n'est pas
// perdue à l'enregistrement.
export function ChoiceSelect({
  label,
  name,
  options,
  defaultValue,
  emptyLabel = EMPTY_CHOICE_LABEL,
  labelClassName,
  selectClassName,
}: ChoiceSelectProps) {
  const current = defaultValue ?? "";
  const isLegacyValue = current !== "" && !options.some((option) => option.value === current);
  return (
    <label className={labelClassName}>
      <span>{label}</span>
      <select name={name} defaultValue={current} className={selectClassName}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {isLegacyValue ? <option value={current}>{current}</option> : null}
      </select>
    </label>
  );
}

"use client";
import { useRef, useState } from "react";
import { saveSettings } from "@/app/actions/settings";
import {
  label,
  settingsFor,
  type SettingsGroup,
  type SettingSection,
  type SettingValue,
} from "@/lib/settings";
import { AutoSaveWrapper } from "./auto-save-wrapper";
export function SettingsEditor({
  group,
  initial,
  sections,
}: {
  group: SettingsGroup;
  initial: unknown;
  sections: SettingSection[];
}) {
  const [values, setValues] = useState(() => settingsFor(group, initial));
  const current = useRef(values);
  const [validation, setValidation] = useState("");
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const change = (
    key: string,
    value: SettingValue,
    save: (fn: () => Promise<unknown>) => Promise<void>,
  ) => {
    current.current = { ...current.current, [key]: value };
    setValues(current.current);
    setValidation("");
    void save(async () => {
      const latest = current.current[key];
      const result = await saveSettings(group, { [key]: latest });
      if (result.success)
        window.dispatchEvent(
          new CustomEvent("weave:settings", {
            detail: { group, patch: { [key]: latest } },
          }),
        );
      return result;
    });
  };
  return (
    <AutoSaveWrapper>
      {({ handleSave }) => (
        <div className="space-y-8">
          {validation && (
            <p role="alert" className="text-sm text-error">
              {validation}
            </p>
          )}
          {sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h3 className="text-lg font-bold text-heading">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-muted">{section.description}</p>
              )}
              <div className="divide-y divide-border rounded-xl border border-border bg-background">
                {section.fields.map((field) => {
                  const id = `${group}-${field.key}`;
                  return (
                    <div
                      key={field.key}
                      className={
                        field.type === "toggle"
                          ? "flex items-center justify-between gap-4 p-4"
                          : "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      }
                    >
                      <div>
                        <label
                          htmlFor={id}
                          className="text-sm font-semibold text-heading"
                        >
                          {field.label}
                        </label>
                        {field.description && (
                          <p
                            id={`${id}-help`}
                            className="mt-1 max-w-lg text-xs text-muted"
                          >
                            {field.description}
                          </p>
                        )}
                      </div>
                      {field.type === "toggle" ? (
                        <input
                          id={id}
                          type="checkbox"
                          role="switch"
                          aria-describedby={
                            field.description ? `${id}-help` : undefined
                          }
                          checked={values[field.key] === true}
                          onChange={(event) =>
                            change(field.key, event.target.checked, handleSave)
                          }
                          className="h-5 w-5 shrink-0 accent-primary"
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={id}
                          value={String(values[field.key])}
                          onChange={(event) =>
                            change(field.key, event.target.value, handleSave)
                          }
                          className="min-w-44 rounded-lg border border-border bg-surface p-2 text-sm text-heading"
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {label(option)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          type="number"
                          min={field.min}
                          max={field.max}
                          value={
                            numbers[field.key] ?? String(values[field.key])
                          }
                          onChange={(event) => {
                            setNumbers((previous) => ({
                              ...previous,
                              [field.key]: event.target.value,
                            }));
                          }}
                          onBlur={(event) => {
                            if (
                              !event.target.value ||
                              !event.target.validity.valid
                            ) {
                              setValidation(
                                `${field.label} must be between ${field.min} and ${field.max}.`,
                              );
                              return;
                            }
                            change(
                              field.key,
                              Number(event.target.value),
                              handleSave,
                            );
                          }}
                          className="w-24 rounded-lg border border-border bg-surface p-2 text-heading"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AutoSaveWrapper>
  );
}

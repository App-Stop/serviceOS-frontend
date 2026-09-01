import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import {
  ErrorBanner,
  MutedPillButton,
  Select,
  WizardFooter,
} from '../../components/onboarding/WizardControls';
import { getErrorMessage } from '../../api/client';
import { DURATION_OPTIONS } from '../../api/format';
import { listServiceTypesApi, syncServiceTypesApi } from '../../api/serviceTypes';

const DURATIONS = DURATION_OPTIONS.map((option) => option.label);
const emptyRow = { id: null, name: '', duration: '' };

export const StepServices = ({ onBack, onNext }) => {
  const [rows, setRows] = useState([emptyRow]);
  // What the server held when the step opened, so the save can tell created
  // from edited from deleted.
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listServiceTypesApi()
      .then((services) => {
        setOriginal(services);
        setRows(services.length ? services : [emptyRow]);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load your services.')))
      .finally(() => setLoading(false));
  }, []);

  const patchService = (index, patch) =>
    setRows((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addService = () => setRows((prev) => [...prev, { ...emptyRow }]);

  const removeService = (index) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const canContinue = rows.some((s) => s.name.trim() && s.duration);

  // There is no bulk endpoint, so the whole step is committed as a fan-out of
  // per-row calls when Continue is pressed.
  const handleNext = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await syncServiceTypesApi(rows, original);
      setOriginal(saved);
      setRows(saved.length ? saved : [emptyRow]);
      onNext();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your services.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      step={4}
      title="Configure services"
      subtitle="These are the types of work your team handles."
    >
      <div className="onb-body-center">
        <ErrorBanner>{error}</ErrorBanner>

        {loading ? (
          <p className="onb-loading">Loading your services…</p>
        ) : (
          <>
            {rows.map((service, index) => (
              <div key={service.id ?? `new-${index}`} className="onb-service-row">
                <div className="input-group">
                  {index === 0 && <span className="field-label">Service Name*</span>}
                  <input
                    className="field-input"
                    placeholder="e.g. Deep Clean"
                    value={service.name}
                    onChange={(e) => patchService(index, { name: e.target.value })}
                  />
                </div>

                <div className="input-group onb-service-time">
                  {index === 0 && <span className="field-label">Est. Time*</span>}
                  <Select
                    placeholder="Time"
                    options={DURATIONS}
                    value={service.duration}
                    onChange={(e) => patchService(index, { duration: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  aria-label={`Remove service ${index + 1}`}
                  onClick={() => removeService(index)}
                  className={`onb-remove-btn ${index === 0 ? 'invisible' : ''}`}
                  disabled={index === 0}
                >
                  <X className="size-[22px]" strokeWidth={2} />
                </button>
              </div>
            ))}

            <MutedPillButton icon={Plus} onClick={addService}>
              Add Service
            </MutedPillButton>
          </>
        )}
      </div>

      <WizardFooter
        onBack={onBack}
        onNext={handleNext}
        canContinue={canContinue}
        busy={saving}
      />
    </OnboardingShell>
  );
};

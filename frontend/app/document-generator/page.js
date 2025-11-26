'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_PATH = '/api';

const fieldBaseClass =
  'mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

const Badge = ({ label, variant = 'neutral' }) => {
  const styles = {
    neutral: 'bg-zinc-100 text-zinc-700',
    warning: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
};

const FieldInput = ({ field, value, onChange }) => {
  const commonProps = {
    id: field.name,
    name: field.name,
    value: value ?? '',
    required: field.required,
    placeholder: field.placeholder || '',
    onChange: (event) => onChange(field.name, event.target.value),
  };

  if (field.type === 'textarea') {
    return <textarea rows={4} className={`${fieldBaseClass} resize-none`} {...commonProps} />;
  }

  if (field.type === 'select' && Array.isArray(field.options)) {
    return (
      <select className={fieldBaseClass} {...commonProps}>
        <option value="">Select an option</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  const inputType = ['date', 'number', 'email', 'tel'].includes(field.type)
    ? field.type
    : 'text';

  return <input type={inputType} className={fieldBaseClass} {...commonProps} />;
};

const TemplateCard = ({ template, isActive, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(template)}
    className={`w-full rounded-2xl border p-4 text-left transition hover:border-blue-400 hover:shadow ${
      isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-zinc-200 bg-white'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-blue-600">{template.category?.toUpperCase()}</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-900">{template.name}</h3>
      </div>
      <Badge label={`v${template.version}`} />
    </div>
    <p className="mt-2 text-sm text-zinc-600">{template.description}</p>
    <p className="mt-3 text-xs text-zinc-500">{template.fields.length} required inputs</p>
  </button>
);

const TemplateSkeleton = () => (
  <div className="w-full animate-pulse rounded-2xl border border-zinc-200 bg-white p-4">
    <div className="h-4 w-24 rounded bg-zinc-200" />
    <div className="mt-3 h-6 w-3/4 rounded bg-zinc-200" />
    <div className="mt-4 h-16 rounded bg-zinc-100" />
  </div>
);

const formatDate = (value) => new Date(value).toLocaleString();

const getStoredUserId = () => {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem('legaledge_user_id');
  if (existing) return existing;
  const fallback = self.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  window.localStorage.setItem('legaledge_user_id', fallback);
  return fallback;
};

export default function DocumentGeneratorPage() {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [userId, setUserId] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setUserId(getStoredUserId());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchTemplates() {
      setTemplatesLoading(true);
      try {
        const response = await fetch(`${API_BASE_PATH}/templates`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Unable to load templates. Please check the API.');
        }
        const data = await response.json();
        setTemplates(data);
        setSelectedTemplate((current) => current || data[0] || null);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message);
        }
      } finally {
        setTemplatesLoading(false);
      }
    }
    fetchTemplates();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      setFormValues({});
      return;
    }
    const initialValues = selectedTemplate.fields.reduce((acc, field) => {
      acc[field.name] = field.default ?? '';
      return acc;
    }, {});
    setFormValues(initialValues);
    setGeneratedDoc(null);
  }, [selectedTemplate]);

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    if (!selectedTemplate) return;
    const defaults = selectedTemplate.fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {});
    setFormValues(defaults);
    setGeneratedDoc(null);
    setToast('Form cleared');
    setTimeout(() => setToast(''), 2500);
  };

  const handleGenerate = async (event) => {
    event?.preventDefault();
    if (!selectedTemplate || !userId) return;
    setIsGenerating(true);
    setError('');
    setGeneratedDoc(null);
    try {
      const payload = {
        template_id: selectedTemplate.id,
        user_id: userId,
        inputs: formValues,
        output_format: 'text',
      };
      const response = await fetch(`${API_BASE_PATH}/generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Document generation failed.');
      }
      const data = await response.json();
      setGeneratedDoc(data);
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedDoc) return;
    try {
      await navigator.clipboard.writeText(generatedDoc.generated_text);
      setToast('Copied to clipboard');
      setTimeout(() => setToast(''), 2000);
    } catch (clipboardError) {
      setError('Unable to copy text.');
    }
  };

  const downloadDocument = (extension = 'txt') => {
    if (!generatedDoc) return;
    const filenameBase = `${generatedDoc.template_name.replace(/\s+/g, '_').toLowerCase()}_${
      generatedDoc.document_id
    }`;
    const blob = new Blob([generatedDoc.generated_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filenameBase}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const piiFieldsCount = useMemo(() => {
    if (!selectedTemplate) return 0;
    return selectedTemplate.fields.filter((field) => field.is_pii).length;
  }, [selectedTemplate]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-600">Legal Edge</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
                Legal Document Generator
              </h1>
              <p className="mt-3 text-sm text-zinc-600">
                Select a template, fill the required facts, and generate polished drafts with
                built-in PII safeguards. Your inputs never leave your browser unredacted.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Proxying via Next.js <span className="font-mono">/api</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {toast && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-zinc-900">Templates</h2>
              <p className="mt-1 text-sm text-zinc-500">Pick a document to start drafting.</p>
            </div>
            <div className="space-y-3">
              {templatesLoading && (
                <>
                  <TemplateSkeleton />
                  <TemplateSkeleton />
                </>
              )}
              {!templatesLoading && templates.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No templates available. Run the backend seeding script to add starter templates.
                </div>
              )}
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={selectedTemplate?.id === template.id}
                  onSelect={setSelectedTemplate}
                />
              ))}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <p className="text-sm text-zinc-500">Active template</p>
                  <h2 className="text-2xl font-semibold text-zinc-900">{selectedTemplate?.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{selectedTemplate?.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-500">
                    <Badge label={`${selectedTemplate?.fields.length || 0} fields`} />
                    <Badge label={`${piiFieldsCount} PII fields`} variant="warning" />
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600">
                  <p>Version {selectedTemplate?.version}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">Template ID:</p>
                  <p className="font-mono text-xs text-zinc-500">{selectedTemplate?.id}</p>
                </div>
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleGenerate}>
                <div className="grid gap-4 md:grid-cols-2">
                  {(selectedTemplate?.fields || []).map((field) => (
                    <div key={field.name} className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor={field.name} className="text-sm font-medium text-zinc-900">
                          {field.label}
                          {field.required && <span className="text-rose-600"> *</span>}
                        </label>
                        {field.is_pii && <Badge label="PII" variant="warning" />}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{field.description || 'Provide the required information.'}</p>
                      <FieldInput field={field} value={formValues[field.name]} onChange={handleFieldChange} />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={!selectedTemplate || isGenerating || !userId}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Document'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300"
                  >
                    Reset Form
                  </button>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Draft stored locally with ID
                    <span className="font-mono text-[11px]">{userId}</span>
                  </div>
                </div>
              </form>
            </section>

            {generatedDoc && (
              <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-emerald-600">Draft ready</p>
                    <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                      {generatedDoc.template_name}
                    </h2>
                    <p className="text-sm text-zinc-500">Version {generatedDoc.template_version}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="rounded-2xl border border-emerald-200 px-5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Copy Text
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadDocument('txt')}
                      className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500"
                    >
                      Download TXT
                    </button>
                  </div>
                </div>

                <pre className="mt-4 max-h-[360px] overflow-y-auto rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-100">
                  {generatedDoc.generated_text}
                </pre>

                <dl className="mt-4 grid gap-4 text-sm text-zinc-600 md:grid-cols-3">
                  <div>
                    <dt className="font-medium text-zinc-900">Document ID</dt>
                    <dd className="font-mono text-xs text-zinc-500">{generatedDoc.document_id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900">Generated</dt>
                    <dd>{formatDate(generatedDoc.generated_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900">Placeholder count</dt>
                    <dd>{generatedDoc.metadata?.placeholder_keys?.length || 0}</dd>
                  </div>
                </dl>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

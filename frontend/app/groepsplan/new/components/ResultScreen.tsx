"use client";
import React from "react";
import { useTranslations } from "next-intl";

interface ResultScreenProps {
  title: string;
  period?: string;
  content?: string;
  docId?: string | null;
  onEdit?: (id: string | null) => void;
  onDownload?: () => void;
  onClose?: () => void;
}

export default function ResultScreen({ title, period, content, docId, onEdit, onDownload, onClose }: ResultScreenProps) {
  const t = useTranslations('groepsplan.result');
  const [announce, setAnnounce] = React.useState(t('title'));
  React.useEffect(() => { const t = setTimeout(() => setAnnounce(""), 1500); return () => clearTimeout(t); }, []);

  return (
    <div className="result-enter-active fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-lg border-t border-border p-6">
      <div role="status" aria-live="polite" className="sr-only">{announce}</div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl">{t('title')}</h2>
        {onClose ? (
          <button className="text-sm text-blue-600 hover:underline" onClick={onClose} aria-label="Sluiten">{t('firstTime.dismiss')}</button>
        ) : null}
      </div>

      <div className="mt-2 text-muted text-sm">{period || ""}</div>
      <div className="mt-1 text-lg font-semibold">{title}</div>

      <div className="mt-4 rounded-md border border-border p-3 bg-gray-50" style={{ maxHeight: 240, overflowY: 'auto' }}>
        <div className="text-sm text-muted">{t('preview')}</div>
        <div className="mt-2 text-sm" style={{ whiteSpace: 'pre-wrap' }}>{(content || '').slice(0, 800) || ''}</div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button className="px-4 py-2 rounded-md border" onClick={() => onEdit && onEdit(docId || null)} disabled={!docId}>{t('edit')}</button>
        <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={onDownload}>{t('download')}</button>
        <a href="/dashboard" className="ml-auto text-blue-600 hover:underline">{t('back')}</a>
      </div>
    </div>
  );
}



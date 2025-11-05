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
  downloadPriceEUR?: number;
}

export default function ResultScreen({ title, period, content, docId, onEdit, onDownload, onClose, downloadPriceEUR }: ResultScreenProps) {
  const t = useTranslations('groepsplan.result');
  const [announce, setAnnounce] = React.useState(t('title'));
  React.useEffect(() => { const tmr = setTimeout(() => setAnnounce(""), 1200); return () => clearTimeout(tmr); }, []);

  return (
    <div className="theme-warmbath wb-complete-bg fixed inset-0 z-50 overflow-auto">
      <div role="status" aria-live="polite" className="sr-only">{announce}</div>
      <div className="wb-complete mx-auto max-w-[428px]">
        <div className="text-center mb-8">
          <h1>Je groepsplan is klaar</h1>
          <p className="wb-subtle" style={{ color: 'var(--wb-chalkboard-green)' }}>{t('timeSaved') || 'Dat scheelt je zeker 2 uur werk'}</p>
        </div>

        <div className="mb-8">
          <div className="wb-preview-paper paper-texture">
            <div className="wb-preview-header">
              <h3 className="wb-title" style={{ fontSize: 18 }}>{title}</h3>
              <p className="wb-subtle" style={{ fontSize: 14 }}>{period || ''}</p>
            </div>
            <div>
              <div className="wb-preview-line" />
              <div className="wb-preview-line" />
              <div className="wb-preview-line short" />
              <div className="wb-preview-line" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 mb-8">
          <button className="wb-btn wb-btn-primary" onClick={onDownload}>
            {downloadPriceEUR ? `${t('download')} (€${downloadPriceEUR.toFixed(2)})` : t('download')}
          </button>
          <button className="wb-btn wb-btn-secondary" onClick={() => onEdit && onEdit(docId || null)} disabled={!docId}>{t('edit')}</button>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-sm wb-subtle mb-2">Wat nu?</p>
          <div className="grid gap-2">
            <button className="text-left py-2" onClick={() => location.href = '/opp/new'}><span>→</span> Maak een OPP</button>
            <a className="text-left py-2" href="/dashboard"><span>→</span> Terug naar dashboard</a>
          </div>
        </div>
        {onClose ? (
          <div className="mt-6 text-center">
            <button className="text-sm text-blue-600 hover:underline" onClick={onClose} aria-label="Sluiten">{t('firstTime.dismiss')}</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

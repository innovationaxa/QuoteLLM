import { ChatMessage, QuickReplyOption, QuoteResult, QuickEstimateData, NeedsTunerData } from '../types';
import type { NeedsMatrixData, ProfileRecapData } from '../types';
import { ReimbursementSimulator, ReimbursementSimulatorData } from './ReimbursementSimulator';
import { ConsentCard }          from './ConsentCard';
import { QuickReply }           from './QuickReply';
import { CalculatingCard }      from './CalculatingCard';
import { FormulaComparison }    from './FormulaComparison';
import { QuickEstimateCard }    from './QuickEstimateCard';
import { DocumentUploadCard }   from './DocumentUploadCard';
import { NeedsTuner }           from './NeedsTuner';
import { NeedsMatrix }          from './NeedsMatrix';
import { ProfileRecap }         from './ProfileRecap';
import { CTACard }              from './CTACard';
import { DALogo }               from './DALogo';

// Minimal markdown: **bold** and \n line breaks
function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    const nodes = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{p}</strong> : p,
    );
    return <span key={i}>{nodes}{i < arr.length - 1 && <br />}</span>;
  });
}

interface Props {
  message:               ChatMessage;
  onAcceptConsent:       (id: string) => void;
  onDeclineConsent:      (id: string) => void;
  onSelectOption:        (msgId: string, questionId: string, value: string, label: string) => void;
  onDocUpload:           (msgId: string, file: File) => void;
  onDocEnterManually:    (msgId: string) => void;
  onDocSkip:             (msgId: string) => void;
  onNeedsTuner:          (msgId: string, needs: NeedsTunerData) => void;
  onNeedsMatrix:         (msgId: string, sel: { hospitalization_need: string; optics_need: string; dental_need: string }) => void;
  onProfileRecap:        (msgId: string) => void;
  onContinueToBuy:       (id: string) => void;
  onRequestCallback:     (id: string) => void;
}

export function MessageBubble({
  message,
  onAcceptConsent, onDeclineConsent, onSelectOption,
  onDocUpload, onDocEnterManually, onDocSkip,
  onNeedsTuner, onNeedsMatrix, onProfileRecap,
  onContinueToBuy, onRequestCallback,
}: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end py-2 animate-fade-up">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-elevated text-gray-900 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.widget === 'section-divider') {
    return (
      <div className="flex items-center gap-3 py-4 animate-fade-up">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted font-medium px-2">
          {(message.widgetData as { label: string })?.label ?? 'Suite'}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 py-3 animate-fade-up">
      <div className="shrink-0 mt-0.5">
        <DALogo size={32} />
      </div>

      <div className="flex-1 min-w-0">
        {message.content && (
          <p className="text-[15px] text-gray-900 leading-relaxed">
            {renderText(message.content)}
          </p>
        )}

        {!message.consumed && message.widget === 'consent-card' && (
          <ConsentCard
            onAccept={()  => onAcceptConsent(message.id)}
            onDecline={() => onDeclineConsent(message.id)}
          />
        )}

        {!message.consumed && message.widget === 'quick-reply' && message.questionId && (
          <QuickReply
            options={message.widgetData as QuickReplyOption[]}
            onSelect={(v, l) => onSelectOption(message.id, message.questionId!, v, l)}
          />
        )}

        {message.widget === 'calculating' && <CalculatingCard />}

        {message.widget === 'quick-estimate' && (
          <QuickEstimateCard data={message.widgetData as QuickEstimateData} />
        )}

        {!message.consumed && message.widget === 'document-upload' && (
          <DocumentUploadCard
            onUpload={(file)    => onDocUpload(message.id, file)}
            onEnterManually={() => onDocEnterManually(message.id)}
            onSkip={()          => onDocSkip(message.id)}
          />
        )}

        {message.widget === 'formula-comparison' && (
          <FormulaComparison data={message.widgetData as QuoteResult} />
        )}

        {!message.consumed && message.widget === 'needs-tuner' && (
          <NeedsTuner
            data={message.widgetData as NeedsTunerData}
            onApply={(needs) => onNeedsTuner(message.id, needs)}
          />
        )}

        {!message.consumed && message.widget === 'needs-matrix' && (
          <NeedsMatrix
            data={(message.widgetData as NeedsMatrixData) ?? {}}
            onSubmit={(sel) => onNeedsMatrix(message.id, sel)}
          />
        )}

        {!message.consumed && message.widget === 'profile-recap' && (
          <ProfileRecap
            data={message.widgetData as ProfileRecapData}
            onConfirm={() => onProfileRecap(message.id)}
          />
        )}

        {!message.consumed && message.widget === 'cta-card' && (
          <CTACard
            onContinue={() => onContinueToBuy(message.id)}
            onCallback={() => onRequestCallback(message.id)}
          />
        )}

        {message.widget === 'reimbursement-simulator' && (
          <ReimbursementSimulator {...(message.widgetData as ReimbursementSimulatorData)} />
        )}
      </div>
    </div>
  );
}

import { ChatMessage, QuickReplyOption, RecapData, QuoteResult } from '../types';
import { ConsentCard }        from './ConsentCard';
import { QuickReply }         from './QuickReply';
import { CalculatingCard }    from './CalculatingCard';
import { RecapCard }          from './RecapCard';
import { FormulaComparison }  from './FormulaComparison';
import { ContactCTA }         from './ContactCTA';

// Minimal markdown: **bold** and \n line breaks
function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    const nodes = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{p}</strong> : p,
    );
    return <span key={i}>{nodes}{i < arr.length - 1 && <br />}</span>;
  });
}

interface Props {
  message:           ChatMessage;
  questionId?:       string;
  onAcceptConsent:   (id: string) => void;
  onDeclineConsent:  (id: string) => void;
  onSelectOption:    (msgId: string, questionId: string, value: string, label: string) => void;
  onConfirmRecap:    (id: string) => void;
  onRequestContact:  (id: string) => void;
  onDismissContact:  (id: string) => void;
}

export function MessageBubble({
  message, questionId,
  onAcceptConsent, onDeclineConsent, onSelectOption,
  onConfirmRecap, onRequestContact, onDismissContact,
}: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end py-2 animate-fade-up">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-elevated text-white text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Section divider — rendered as a standalone separator, not a full bubble
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
      <div className="shrink-0 w-8 h-8 rounded-full bg-da-blue flex items-center justify-center text-xs text-white font-bold mt-0.5">
        DA
      </div>

      <div className="flex-1 min-w-0">
        {message.content && (
          <p className="text-[15px] text-white leading-relaxed">
            {renderText(message.content)}
          </p>
        )}

        {!message.consumed && message.widget === 'consent-card' && (
          <ConsentCard
            onAccept={()  => onAcceptConsent(message.id)}
            onDecline={() => onDeclineConsent(message.id)}
          />
        )}

        {!message.consumed && message.widget === 'quick-reply' && questionId && (
          <QuickReply
            options={message.widgetData as QuickReplyOption[]}
            onSelect={(v, l) => onSelectOption(message.id, questionId, v, l)}
          />
        )}

        {message.widget === 'calculating' && <CalculatingCard />}

        {!message.consumed && message.widget === 'recap-confirm' && (
          <RecapCard
            data={message.widgetData as RecapData}
            onConfirm={() => onConfirmRecap(message.id)}
          />
        )}

        {message.widget === 'formula-comparison' && (
          <FormulaComparison data={message.widgetData as QuoteResult} />
        )}

        {!message.consumed && message.widget === 'contact-cta' && (
          <ContactCTA
            onAccept={()  => onRequestContact(message.id)}
            onDecline={() => onDismissContact(message.id)}
          />
        )}
      </div>
    </div>
  );
}

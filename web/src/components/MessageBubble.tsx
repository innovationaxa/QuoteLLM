import { ChatMessage, QuickReplyOption, QuoteData } from '../types';
import { ConsentCard }    from './ConsentCard';
import { QuickReply }     from './QuickReply';
import { CalculatingCard }from './CalculatingCard';
import { QuoteCard }      from './QuoteCard';
import { ContactCTA }     from './ContactCTA';

// Minimal markdown: bold (**text**) and line breaks
function renderText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    const nodes = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{p}</strong> : p,
    );
    return (
      <span key={i}>
        {nodes}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

interface Props {
  message: ChatMessage;
  onAcceptConsent:  (id: string) => void;
  onDeclineConsent: (id: string) => void;
  onSelectOption:   (msgId: string, questionId: string, value: string, label: string) => void;
  onRequestContact: (id: string) => void;
  onDismissContact: (id: string) => void;
  questionId?:      string;
}

export function MessageBubble({
  message,
  onAcceptConsent,
  onDeclineConsent,
  onSelectOption,
  onRequestContact,
  onDismissContact,
  questionId,
}: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end py-2 animate-fade-up">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-elevated text-white text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex items-start gap-4 py-3 animate-fade-up">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-da-blue flex items-center justify-center text-xs text-white font-bold mt-0.5">
        DA
      </div>

      <div className="flex-1 min-w-0">
        {/* Text */}
        {message.content && (
          <p className="text-[15px] text-white leading-relaxed">
            {renderText(message.content)}
          </p>
        )}

        {/* Widgets – only render while not consumed */}
        {!message.consumed && message.widget === 'consent-card' && (
          <ConsentCard
            onAccept={()  => onAcceptConsent(message.id)}
            onDecline={() => onDeclineConsent(message.id)}
          />
        )}

        {!message.consumed && message.widget === 'quick-reply' && questionId && (
          <QuickReply
            options={message.widgetData as QuickReplyOption[]}
            onSelect={(value, label) => onSelectOption(message.id, questionId, value, label)}
          />
        )}

        {message.widget === 'calculating' && (
          <CalculatingCard />
        )}

        {message.widget === 'quote-card' && (
          <QuoteCard data={message.widgetData as QuoteData} />
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

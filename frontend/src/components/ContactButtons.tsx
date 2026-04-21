import { Mail, Phone, MessageCircle } from "lucide-react";

interface Props {
  email?: string | null;
  phone?: string | null;
  className?: string;
}

export default function ContactButtons({ email, phone, className = "" }: Props) {
  if (!email && !phone) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {email && (
        <a
          href={`mailto:${email}`}
          title={`Email ${email}`}
          onClick={e => e.stopPropagation()}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Mail size={13} />
        </a>
      )}
      {phone && (
        <>
          <a
            href={`tel:${phone}`}
            title={`Call ${phone}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          >
            <Phone size={13} />
          </a>
          <a
            href={`sms:${phone}`}
            title={`Text ${phone}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          >
            <MessageCircle size={13} />
          </a>
        </>
      )}
    </div>
  );
}

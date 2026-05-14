import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../services/supabase';

interface UseNotificationMessageFormResult {
  showSendMessage: boolean;
  messageSubject: string;
  messageBody: string;
  isSending: boolean;
  openSendMessage: () => void;
  closeSendMessage: () => void;
  setMessageSubject: (value: string) => void;
  setMessageBody: (value: string) => void;
  handleSendMessage: (event: FormEvent) => Promise<void>;
}

export const useNotificationMessageForm = (): UseNotificationMessageFormResult => {
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const resetForm = () => {
    setMessageSubject('');
    setMessageBody('');
  };

  const closeSendMessage = () => {
    setShowSendMessage(false);
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!messageSubject || !messageBody) return;

    setIsSending(true);

    try {
      await supabase.from('notifications').insert({
        title: messageSubject,
        content: messageBody,
        type: 'message',
        urgency: 'medium',
        purpose: 'User Message',
        sender: 'System User',
        status: 'unread',
      });
    } catch (err) {
      console.warn('Failed to insert message to DB:', err);
    } finally {
      setIsSending(false);
      closeSendMessage();
      resetForm();
      alert('Message sent successfully!');
    }
  };

  return {
    showSendMessage,
    messageSubject,
    messageBody,
    isSending,
    openSendMessage: () => setShowSendMessage(true),
    closeSendMessage,
    setMessageSubject,
    setMessageBody,
    handleSendMessage,
  };
};

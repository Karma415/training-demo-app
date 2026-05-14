import React from 'react';

interface BugReportButtonProps {
  adminEmail?: string;
}

const BugReportButton: React.FC<BugReportButtonProps> = ({ adminEmail = 'admin@sfhousinghub.com' }) => {
  const handleReportBug = () => {
    const subject = encodeURIComponent('Bug Report / Tester Feedback');
    const body = encodeURIComponent(
      `Bug Report / Feedback\n\n` +
      `Steps to recreate the issue:\n` +
      `1. \n\n` +
      `Expected Behavior:\n\n\n` +
      `Actual Behavior:\n\n\n` +
      `*** PLEASE ATTACH ANY RELEVANT SCREENSHOTS TO THIS EMAIL BEFORE SENDING ***\n`
    );

    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <button
      onClick={handleReportBug}
      className="fixed bottom-6 right-6 z-50 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-105 group flex items-center space-x-2"
      aria-label="Report a Bug"
      title="Report a bug or give feedback"
    >
      <i className="fa-solid fa-bug text-xl"></i>
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-sm">
        Report Bug
      </span>
    </button>
  );
};

export default BugReportButton;

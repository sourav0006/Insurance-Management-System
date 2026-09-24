import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} InsurManage. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

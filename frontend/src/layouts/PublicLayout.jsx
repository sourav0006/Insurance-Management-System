import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';

export const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;

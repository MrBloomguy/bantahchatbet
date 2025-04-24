import React from 'react';

interface AdminPageLayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * A consistent layout component for admin pages with responsive design
 */
const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  title,
  children,
  actions,
  icon
}) => {
  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          {icon && <span className="text-[#CCFF00]">{icon}</span>}
          {title}
        </h1>

        {actions && (
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
};

export default AdminPageLayout;

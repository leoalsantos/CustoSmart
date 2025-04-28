import React, { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  subtitle, 
  icon,
  actions
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex gap-2 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
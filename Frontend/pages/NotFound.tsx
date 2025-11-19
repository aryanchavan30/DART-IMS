
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="text-center p-10">
        <h1 className="text-6xl font-bold text-primary-red">404</h1>
        <h2 className="text-2xl font-semibold text-primary-navy mt-4">Page Not Found</h2>
        <p className="text-slate-500 mt-2">Sorry, the page you are looking for does not exist.</p>
        <div className="mt-6">
          <ReactRouterDOM.Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </ReactRouterDOM.Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
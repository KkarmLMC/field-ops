import { useState } from 'react';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import FormRunner from './pages/FormRunner.jsx';
import Reports from './pages/Reports.jsx';
import Technicians from './pages/Technicians.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeForm, setActiveForm] = useState(null);

  const navigate = (to, params = {}) => {
    setPage(to);
    if (params.job !== undefined) setSelectedJob(params.job);
    if (params.form !== undefined) setActiveForm(params.form);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard navigate={navigate} />;
      case 'jobs':
        return <Jobs navigate={navigate} />;
      case 'job-detail':
        return <JobDetail job={selectedJob} navigate={navigate} />;
      case 'form-runner':
        return <FormRunner job={selectedJob} formId={activeForm} navigate={navigate} />;
      case 'reports':
        return <Reports navigate={navigate} />;
      case 'technicians':
        return <Technicians navigate={navigate} />;
      default:
        return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <Layout page={page} navigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

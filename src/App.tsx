import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Overview from '@/pages/Overview';
import Channel from '@/pages/Channel';
import Processing from '@/pages/Processing';
import FollowUp from '@/pages/FollowUp';
import Standards from '@/pages/Standards';
import Rectification from '@/pages/Rectification';
import Analysis from '@/pages/Analysis';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/channel" element={<Channel />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/follow-up" element={<FollowUp />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/rectification" element={<Rectification />} />
          <Route path="/analysis" element={<Analysis />} />
        </Route>
      </Routes>
    </Router>
  );
}

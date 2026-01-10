// Imports cleaned up
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/public/Home'; // Added Home import
import { Layout } from './components/layout/Layout'; // Added Layout import
import { News } from './pages/public/News';
import { NewsDetail } from './pages/public/NewsDetail';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Events } from './pages/public/Events';
import { EventDetail } from './pages/public/EventDetail';
import { Gallery } from './pages/public/Gallery';
import { Profile } from './pages/public/Profile';
import { Learning } from './pages/public/Learning';
// import { Dashboard } from './pages/admin/Dashboard'; // This import will be removed or replaced

// Admin Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { MemberLayout } from './components/layout/MemberLayout';
import { DashboardOverview } from './pages/admin/Overview';
import { AdminSettings } from './pages/admin/Settings';
import { AdminPremium } from './pages/admin/Premium';
import { AdminLetters } from './pages/admin/letters/LetterList';
import { CreateLetter } from './pages/admin/letters/CreateLetter';
import { AdminMaterials } from './pages/admin/learning/MaterialList';
import { CreateMaterial } from './pages/admin/learning/CreateMaterial';
import { AdminQuestions } from './pages/admin/questions/QuestionList';
import { QuestionBankPage } from './pages/public/QuestionBank';
import { PromptLibrary } from './pages/public/Prompts';
import { References } from './pages/public/References';
import { MemberDashboard } from './pages/member/Dashboard';
import { AdminNews } from './pages/admin/news/AdminNews';
import { CreateNews } from './pages/admin/news/CreateNews';
import { AdminEvents } from './pages/admin/events/AdminEvents';
import { CreateEvent } from './pages/admin/events/CreateEvent';
import { AdminMembers } from './pages/admin/Placeholders';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes - Wrapped in Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/news" element={<Layout><News /></Layout>} />
        <Route path="/news/:id" element={<Layout><NewsDetail /></Layout>} />
        <Route path="/events" element={<Layout><Events /></Layout>} />
        <Route path="/events/:id" element={<Layout><EventDetail /></Layout>} />
        <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/learning" element={<Layout><Learning /></Layout>} />
        {/* Auth Routes - Wrapped in Layout */}
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />

        {/* Member Routes - Wrapped in MemberLayout */}
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<MemberDashboard />} />
          <Route path="profile" element={<MemberDashboard />} />
          <Route path="questions" element={<QuestionBankPage />} />
          <Route path="prompts" element={<PromptLibrary />} />
          <Route path="references" element={<References />} />
        </Route>

        {/* Admin Routes - Nested Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="learning" element={<AdminMaterials />} />
          <Route path="learning/create" element={<CreateMaterial />} />
          <Route path="questions" element={<AdminQuestions />} />

          <Route path="news" element={<AdminNews />} />
          <Route path="news/create" element={<CreateNews />} />

          <Route path="events" element={<AdminEvents />} />
          <Route path="events/create" element={<CreateEvent />} />

          <Route path="letters" element={<AdminLetters />} />
          <Route path="letters/create" element={<CreateLetter />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="premium" element={<AdminPremium />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

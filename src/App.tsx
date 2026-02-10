import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from './pages/public/Home';
import { Layout } from './components/layout/Layout';
import { News } from './pages/public/News';
import { NewsDetail } from './pages/public/NewsDetail';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { Events } from './pages/public/Events';
import { EventDetail } from './pages/public/EventDetail';
import { Gallery } from './pages/public/Gallery';
import { Profile } from './pages/public/Profile';
import { Learning } from './pages/public/Learning';

// Admin Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { MemberLayout } from './components/layout/MemberLayout';
import { DashboardOverview } from './pages/admin/Overview';
import { AdminSettings } from './pages/admin/Settings';
import { AdminWebSettings } from './pages/admin/WebSettings';
import { AdminPremium } from './pages/admin/Premium';
import { AdminLetters } from './pages/admin/letters/LetterList';
import { CreateLetter } from './pages/admin/letters/CreateLetter';
import { AdminMaterials } from './pages/admin/learning/MaterialList';
import { CreateMaterial } from './pages/admin/learning/CreateMaterial';
import { AdminQuestions } from './pages/admin/questions/QuestionList';
import { QuestionBuilder } from './pages/admin/questions/QuestionBuilder';
import { QuestionBankPage } from './pages/public/QuestionBank';
import { PromptLibrary } from './pages/public/Prompts';
import { References } from './pages/public/References';
import { MemberDashboard } from './pages/member/Dashboard';
import { UpgradePremium } from './pages/member/UpgradePremium';
import { AdminNews } from './pages/admin/news/AdminNews';
import { CreateNews } from './pages/admin/news/CreateNews';
import { AdminEvents } from './pages/admin/events/AdminEvents';
import { CreateEvent } from './pages/admin/events/CreateEvent';
import { AdminMembers } from './pages/admin/Members';
import { AdminGames } from './pages/admin/games/AdminGames';
import { CreateGame } from './pages/admin/games/CreateGame';
import { AdminPrompts } from './pages/admin/prompts/AdminPrompts';
import { CreatePrompt } from './pages/admin/prompts/CreatePrompt';
import { AdminReferences } from './pages/admin/references/AdminReferences';
// Imports
import { VerificationList } from './pages/admin/contributors/VerificationList';
import { CreateReference } from './pages/admin/references/CreateReference';
import { AdminGallery } from './pages/admin/AdminGallery';
import { AdminMessages } from './pages/admin/AdminMessages';

// Routes
<Route path="contributors" element={<VerificationList />} />

// Member Feature Pages
import { CPTP } from './pages/member/CPTP';
import { MemberEvents } from './pages/member/Events';
import { EditProfile } from './pages/member/EditProfile';
import { Games } from './pages/member/Games';
import { Modules } from './pages/member/Modules';
import { ContributorRegistration } from './pages/member/ContributorRegistration';
import { PremiumGuard } from './components/auth/PremiumGuard';

import { settingsService } from './services/settingsService';

function App() {
  useEffect(() => {
    // Load dynamic site settings (Favicon & Title)
    settingsService.getSettings().then(settings => {
      const url = settings.logo_url || settings.app_logo;
      if (url) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = url;
      }
      if (settings.site_title) {
        document.title = settings.site_title;
      }
    }).catch(err => console.error("Failed to load site settings", err));
  }, []);

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
        <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />

        {/* Member Routes - Wrapped in MemberLayout */}
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<MemberDashboard />} />
          <Route path="profile" element={<EditProfile />} />
          <Route path="upgrade" element={<UpgradePremium />} />
          <Route path="cptp" element={<CPTP />} />
          <Route path="events" element={<MemberEvents />} />
          <Route path="contributor" element={<ContributorRegistration />} />
          {/* Contributor: Create & Edit Question */}
          <Route path="questions/create" element={<QuestionBuilder basePath="/member/contributor" />} />
          <Route path="questions/edit/:id" element={<QuestionBuilder basePath="/member/contributor" />} />

          {/* Protected Premium Routes */}
          <Route path="questions" element={
            <PremiumGuard>
              <QuestionBankPage />
            </PremiumGuard>
          } />
          <Route path="games" element={
            <PremiumGuard>
              <Games />
            </PremiumGuard>
          } />
          <Route path="modules" element={
            <PremiumGuard>
              <Modules />
            </PremiumGuard>
          } />
          <Route path="prompts" element={
            <PremiumGuard>
              <PromptLibrary />
            </PremiumGuard>
          } />
          <Route path="references" element={
            <PremiumGuard>
              <References />
            </PremiumGuard>
          } />
        </Route>

        {/* Admin Routes - Nested Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="learning" element={<AdminMaterials />} />
          <Route path="learning/create" element={<CreateMaterial />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="questions/create" element={<QuestionBuilder />} />
          <Route path="questions/edit/:id" element={<QuestionBuilder />} />

          <Route path="news" element={<AdminNews />} />
          <Route path="news/create" element={<CreateNews />} />

          <Route path="events" element={<AdminEvents />} />
          <Route path="events/create" element={<CreateEvent />} />

          <Route path="letters" element={<AdminLetters />} />
          <Route path="letters/create" element={<CreateLetter />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="web-settings" element={<AdminWebSettings />} />
          <Route path="web-settings" element={<AdminWebSettings />} />
          <Route path="premium" element={<AdminPremium />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="games/create" element={<CreateGame />} />
          <Route path="prompts" element={<AdminPrompts />} />
          <Route path="prompts/create" element={<CreatePrompt />} />
          <Route path="references" element={<AdminReferences />} />
          <Route path="references/create" element={<CreateReference />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="contributors" element={<VerificationList />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

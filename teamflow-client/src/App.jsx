import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import KanbanBoardPage from './pages/KanbanBoardPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<KanbanBoardPage />} />
          <Route path="/projects/:projectId/board" element={<KanbanBoardPage />} />
          <Route path="/projects/:projectId/tasks" element={<KanbanBoardPage />} />
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

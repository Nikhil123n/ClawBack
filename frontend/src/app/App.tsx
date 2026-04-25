import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CasesPage from "../features/cases/CasesPage";
import CaseDetail from "../features/cases/CaseDetail";
import NewCaseForm from "../features/cases/NewCaseForm";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<CasesPage />} />
        <Route path="/cases/new"     element={<NewCaseForm />} />
        <Route path="/cases/:id"     element={<CaseDetail />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

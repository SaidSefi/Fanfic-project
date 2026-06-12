import { Routes, Route } from "react-router-dom";
import NavbarLayout from "./components/custom/NavbarLayout";
import RequireAuth from "./lib/auth/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Search from "./pages/Search";
import MediaDetail from "./pages/MediaDetail";
import Profile from "./pages/Profile";
import EditList from "./pages/EditList";
import ViewList from "./pages/ViewList";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      {/* Auth routes: render outside NavbarLayout (no navbar/footer) */}
      <Route path="/auth">
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Main routes with NavbarLayout */}
      <Route path="/" element={<NavbarLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="media/:mediaId" element={<MediaDetail />} />
        <Route path="profile/:username" element={<Profile />} />

        {/* Protected routes (require authentication)  */}
        <Route
          path="lists/:listId"
          element={<ViewList />}
        />
        <Route
          path="lists/:listId/edit"
          element={
            <RequireAuth>
              <EditList />
            </RequireAuth>
          }
        />
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
                <p className="text-muted-foreground">Dashboard coming soon.</p>
              </div>
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;

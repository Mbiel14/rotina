import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signin from "./pages/signin";
import Signup from "./pages/signup";
import Home from "./pages/home";
import Profile from "./user/profile";
import Project from "./pages/project";
import TaskDetail from "./pages/task_detail";
import CreateTask from "./user/component_foda";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects/:projectId" element={<Project />} />
        <Route
          path="/projects/:projectId/tasks/create"
          element={<CreateTask />}
        />
        <Route
          path="/projects/:projectId/tasks/:taskId"
          element={<TaskDetail />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
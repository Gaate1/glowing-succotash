import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import PlanEditor from "./components/PlanEditor";
import ProjectList from "./components/ProjectList";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/editor/:projectId" element={<PlanEditor />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
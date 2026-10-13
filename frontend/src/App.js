import React from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import CreateRoom from "./pages/CreateRoom";
import { Toaster } from 'react-hot-toast';




function App(){
  return(
    <>
      <div>
      <Toaster  position='top-center'></Toaster>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login/>}/>
          <Route path="/home" element={<Home/>}/>
          
          <Route path="/createroom" element={<CreateRoom />} />
          <Route path="/editor/:roomId" element={<Editor />} />
          <Route path="/editor/" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </>
    
  );
}

export default App;
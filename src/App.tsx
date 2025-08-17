import React from 'react';
import logo from './logo.svg';
import './App.css';
import IncidentFlow from './AiFlowDiagram';
import { Grid } from '@mui/material';

function App() {
  return (
    <Grid container className="App" size={12}>
      <Grid size={2}><IncidentFlow/></Grid>
      <Grid size={3}><IncidentFlow/></Grid>
      <Grid size={3}><IncidentFlow/></Grid>
      <Grid size={3}><IncidentFlow/></Grid>
  
    </Grid>
  );
}

export default App;

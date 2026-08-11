import React from 'react'
import Map from './components/Map'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GENTING GIS Analytics Dashboard</h1>
        <p>Stunting Hotspot Analysis</p>
      </header>
      <main style={{ padding: '20px' }}>
        <Map />
      </main>
    </div>
  )
}

export default App

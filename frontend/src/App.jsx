import React from 'react'
import MapPage from './components/MapPage'
import AdminPage from './components/AdminPage'

function App() {
    // Basic routing based on path
    const path = window.location.pathname;

    return (
        <>
            {path === '/admin' ? <AdminPage /> : <MapPage />}
        </>
    )
}

export default App

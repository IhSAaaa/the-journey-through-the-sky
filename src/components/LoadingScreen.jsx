import React from 'react'

const LoadingScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: '300',
        color: 'white',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        marginBottom: '20px',
        animation: 'fadeInOut 2s ease-in-out infinite'
      }}>
        The Journey Through the Sky
      </div>
      
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(255,255,255,0.3)',
        borderTop: '3px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen
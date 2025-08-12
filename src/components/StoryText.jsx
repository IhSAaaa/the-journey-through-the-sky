import React from 'react'

const StoryText = () => {
  const storyTexts = [
    {
      title: "The Valley",
      description: "A peaceful journey begins in the emerald valley below...",
      position: "0vh"
    },
    {
      title: "Over the Mountains",
      description: "Rising above the snow-capped peaks, touching the clouds...",
      position: "100vh"
    },
    {
      title: "Into the Clouds",
      description: "Piercing through the heavenly mist, bathed in golden light...",
      position: "200vh"
    },
    {
      title: "The Horizon",
      description: "Where the endless ocean meets the infinite sky...",
      position: "300vh"
    }
  ]

  return (
    <>
      {storyTexts.map((story, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: story.position,
            left: '50px',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            zIndex: 100,
            transition: 'all 1s ease-in-out'
          }}
        >
          <h1 style={{
            fontSize: '48px',
            fontWeight: '300',
            marginBottom: '10px',
            letterSpacing: '2px'
          }}>
            {story.title}
          </h1>
          <p style={{
            fontSize: '18px',
            fontWeight: '300',
            opacity: 0.9,
            maxWidth: '400px',
            lineHeight: '1.6'
          }}>
            {story.description}
          </p>
        </div>
      ))}
      
      {/* End of Journey text */}
      <div
        style={{
          position: 'absolute',
          top: '380vh',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: 'white',
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          zIndex: 100
        }}
      >
        <h2 style={{
          fontSize: '36px',
          fontWeight: '300',
          letterSpacing: '3px',
          opacity: 0.8
        }}>
          End of Journey
        </h2>
        <p style={{
          fontSize: '16px',
          marginTop: '10px',
          opacity: 0.6
        }}>
          Thank you for flying with us through the sky
        </p>
      </div>
    </>
  )
}

export default StoryText
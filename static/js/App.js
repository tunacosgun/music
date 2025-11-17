import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const App = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [audioContext, setAudioContext] = useState(null);
  const [pianoStyle, setPianoStyle] = useState('grand'); // 'grand' or 'synth'

  // Piano keys configuration - Two full octaves (C4 to C6)
  const keys = [
    // Octave 4 (C4-B4) - Main octave
    { note: 'C4', key: 'q', type: 'white', frequency: 261.63 },
    { note: 'C#4', key: 'w', type: 'black', frequency: 277.18 },
    { note: 'D4', key: 'e', type: 'white', frequency: 293.66 },
    { note: 'D#4', key: 'r', type: 'black', frequency: 311.13 },
    { note: 'E4', key: 't', type: 'white', frequency: 329.63 },
    { note: 'F4', key: 'y', type: 'white', frequency: 349.23 },
    { note: 'F#4', key: 'u', type: 'black', frequency: 369.99 },
    { note: 'G4', key: 'i', type: 'white', frequency: 392.00 },
    { note: 'G#4', key: 'o', type: 'black', frequency: 415.30 },
    { note: 'A4', key: 'p', type: 'white', frequency: 440.00 },
    { note: 'A#4', key: 'a', type: 'black', frequency: 466.16 },
    { note: 'B4', key: 's', type: 'white', frequency: 493.88 },
    
    // Octave 5 (C5-B5)
    { note: 'C5', key: 'd', type: 'white', frequency: 523.25 },
    { note: 'C#5', key: 'f', type: 'black', frequency: 554.37 },
    { note: 'D5', key: 'g', type: 'white', frequency: 587.33 },
    { note: 'D#5', key: 'h', type: 'black', frequency: 622.25 },
    { note: 'E5', key: 'j', type: 'white', frequency: 659.25 },
    { note: 'F5', key: 'k', type: 'white', frequency: 698.46 },
    { note: 'F#5', key: 'l', type: 'black', frequency: 739.99 },
    { note: 'G5', key: 'z', type: 'white', frequency: 783.99 },
    { note: 'G#5', key: 'x', type: 'black', frequency: 830.61 },
    { note: 'A5', key: 'c', type: 'white', frequency: 880.00 },
    { note: 'A#5', key: 'v', type: 'black', frequency: 932.33 },
    { note: 'B5', key: 'b', type: 'white', frequency: 987.77 },
    
    // Octave 6 (C6 only - highest note)
    { note: 'C6', key: 'n', type: 'white', frequency: 1046.50 },
  ];

  // Initialize Audio Context
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [audioContext]);

  // Play sound using Web Audio API with different sounds for each style
  const playNote = useCallback((frequency) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Different waveforms for different piano styles
    if (pianoStyle === 'synth') {
      oscillator.type = 'sawtooth'; // Electronic synth sound
    } else {
      oscillator.type = 'triangle'; // More piano-like sound
    }

    // Create ADSR envelope - different for each style
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    
    if (pianoStyle === 'synth') {
      // Synth ADSR - sharper attack, longer sustain
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.005); // Quick attack
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);  // Quick decay
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.5);   // Longer sustain
      gainNode.gain.linearRampToValueAtTime(0, now + 1.5);     // Longer release
    } else {
      // Grand piano ADSR - softer, more natural
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);  // Attack
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);   // Decay
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.3);   // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + 1.0);     // Release
    }

    oscillator.start(now);
    oscillator.stop(now + (pianoStyle === 'synth' ? 1.5 : 1.0));
  }, [audioContext, pianoStyle]);

  // Handle key press
  const handleKeyPress = useCallback((keyData) => {
    console.log('Key pressed:', keyData.note); // Debug log
    setPressedKeys(prev => new Set([...prev, keyData.note]));
    playNote(keyData.frequency);
    
    // Remove key from pressed state after animation
    setTimeout(() => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyData.note);
        return newSet;
      });
    }, 150);
  }, [playNote]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event) => {
      let key = event.key.toLowerCase();
      
      const keyData = keys.find(k => k.key === key);
      
      if (keyData && !pressedKeys.has(keyData.note)) {
        event.preventDefault();
        handleKeyPress(keyData);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, pressedKeys, handleKeyPress]);

  // Get white keys
  const whiteKeys = keys.filter(key => key.type === 'white');
  
  // Get black keys with their positions relative to white keys - Fixed positioning
  const blackKeys = keys.filter(key => key.type === 'black').map((key) => {
    // Map each black key to its correct white key position
    const getBlackKeyPosition = (note) => {
      const noteMap = {
        'C#4': 0,  // Between C4(0) and D4(1) -> position 0
        'D#4': 1,  // Between D4(1) and E4(2) -> position 1  
        'F#4': 3,  // Between F4(3) and G4(4) -> position 3
        'G#4': 4,  // Between G4(4) and A4(5) -> position 4
        'A#4': 5,  // Between A4(5) and B4(6) -> position 5
        'C#5': 7,  // Between C5(7) and D5(8) -> position 7
        'D#5': 8,  // Between D5(8) and E5(9) -> position 8
        'F#5': 10, // Between F5(10) and G5(11) -> position 10
        'G#5': 11, // Between G5(11) and A5(12) -> position 11
        'A#5': 12, // Between A5(12) and B5(13) -> position 12
      };
      return noteMap[note] || 0;
    };
    
    const whiteKeyIndex = getBlackKeyPosition(key.note);
    return { ...key, whiteKeyIndex };
  });

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-1000 ${
      pianoStyle === 'synth' 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black' 
        : 'bg-gradient-to-br from-amber-900 via-yellow-900 to-amber-800'
    }`}>
      
      {/* Style Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex rounded-full p-1 transition-all duration-300 ${
          pianoStyle === 'synth' 
            ? 'bg-gray-800/80 border-2 border-cyan-500' 
            : 'bg-amber-800/80 border-2 border-amber-600'
        }`}>
          <button
            onClick={() => setPianoStyle('grand')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              pianoStyle === 'grand'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            🎹 Grand Piano
          </button>
          <button
            onClick={() => setPianoStyle('synth')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              pianoStyle === 'synth'
                ? 'bg-cyan-500 text-black shadow-lg'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            🎛️ Synth
          </button>
        </div>
      </div>

      {/* Dynamic Background Effects */}
      {pianoStyle === 'synth' ? (
        // Synth Background
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/2 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-bounce" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      ) : (
        // Grand Piano Background
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-600 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-repeat opacity-20" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v-40c11.046 0 20 8.954 20 20zM0 20c0-11.046 8.954-20 20-20v40c-11.046 0-20-8.954-20-20z'/%3E%3C/g%3E%3C/svg%3E")`
               }}>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className="text-center mb-8 relative z-10">
        {pianoStyle === 'synth' ? (
          // Synth Header
          <div className="bg-gradient-to-br from-gray-800 to-black p-6 rounded-2xl shadow-2xl border-2 border-cyan-500 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10"></div>
            <h1 className="text-5xl font-bold text-cyan-400 mb-2 drop-shadow-lg font-mono relative z-10">
              🎛️ DIGITAL SYNTH
            </h1>
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 mb-2 rounded animate-pulse"></div>
            <p className="text-lg text-cyan-300 font-mono">
              "GarageBand Style • Electronic • Future Sound"
            </p>
            <div className="flex justify-center space-x-4 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        ) : (
          // Grand Piano Header
          <div className="bg-gradient-to-b from-amber-100 to-amber-200 p-6 rounded-lg shadow-2xl border-4 border-amber-600 mb-4">
            <h1 className="text-5xl font-bold text-amber-900 mb-2 drop-shadow-lg font-serif">
              🎹 STEINWAY & SONS
            </h1>
            <div className="h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent mb-2"></div>
            <p className="text-lg text-amber-800 font-serif italic">
              "Est. 1853 • New York • Master Craftsmen"
            </p>
          </div>
        )}
        
        <div className={`backdrop-blur-sm rounded-lg p-4 border-2 ${
          pianoStyle === 'synth' 
            ? 'bg-gray-800/80 text-cyan-100 border-cyan-500' 
            : 'bg-amber-800/80 text-amber-100 border-amber-600'
        }`}>
          <p className={`text-xl mb-2 ${pianoStyle === 'synth' ? 'font-mono' : 'font-serif'}`}>
            {pianoStyle === 'synth' ? '⚡ Electronic Synthesizer ⚡' : '✨ America\'s Finest Virtual Grand Piano ✨'}
          </p>
          <p className={`text-sm ${pianoStyle === 'synth' ? 'font-mono' : 'font-serif'}`}>
            <strong>{pianoStyle === 'synth' ? 'Digital Collection:' : 'Premium Collection:'}</strong> QWERTY keyboard keys for {pianoStyle === 'synth' ? 'electronic' : 'elegant'} playing
          </p>
          <p className={`text-xs mt-1 ${pianoStyle === 'synth' ? 'text-cyan-200 font-mono' : 'text-amber-200 font-serif'}`}>
            White keys: Q E T Y I P S D G K Z C B N | Black keys: W R U O A F H L X V
          </p>
        </div>
      </div>

      {/* Piano Container - Dynamic Styling */}
      <div className="relative">
        {pianoStyle === 'synth' ? (
          // Synth Piano Container
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 rounded-3xl shadow-2xl border-4 border-cyan-500 relative overflow-hidden">
            {/* Synth Effects */}
            <div className="absolute inset-0 rounded-3xl opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20"></div>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse"></div>
            </div>
            
            {/* Digital Display */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 via-black to-gray-900 px-6 py-2 rounded-lg border-2 border-cyan-400 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
              <span className="text-cyan-400 font-mono text-sm font-bold animate-pulse relative z-10 drop-shadow-lg" style={{textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff, 0 0 30px #00bfff'}}>● REC SYNTH-X7</span>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 animate-pulse"></div>
            </div>
            
            {/* Volume/Control Indicators */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <div className="w-3 h-8 bg-gray-700 rounded-full relative">
                <div className="w-full h-1/2 bg-gradient-to-t from-green-400 to-yellow-400 rounded-full absolute bottom-0"></div>
              </div>
              <div className="w-3 h-8 bg-gray-700 rounded-full relative">
                <div className="w-full h-3/4 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-full absolute bottom-0"></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-gray-700 to-black p-6 rounded-2xl shadow-inner border-2 border-gray-600 relative">
              <div className="relative flex items-end justify-center piano-container w-full">
                {/* White Keys */}
                <div className="flex w-full justify-center">
                  {whiteKeys.map((keyData) => (
                    <button
                      key={keyData.note}
                      onMouseDown={(e) => {
                        console.log('Synth white key clicked:', keyData.note);
                        e.preventDefault();
                        e.stopPropagation();
                        handleKeyPress(keyData);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleKeyPress(keyData);
                      }}
                      className={`
                        relative w-14 h-44 mx-0.5 rounded-b-lg transition-all duration-150
                        ${pianoStyle === 'synth' ? 'synth-white-key' : 'white-key'} 
                        ${pressedKeys.has(keyData.note) ? 'pressed' : ''}
                        focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer select-none
                      `}
                      style={{ border: 'none', background: 'transparent', padding: 0 }}
                    >
                      <span className={`
                        absolute bottom-2 left-1/2 transform -translate-x-1/2 
                        text-xs font-semibold pointer-events-none select-none
                        ${pressedKeys.has(keyData.note) ? 'text-gray-600' : (pianoStyle === 'synth' ? 'text-cyan-800' : 'text-gray-700')}
                      `}>
                        {keyData.key.toUpperCase()}
                      </span>
                      <span className={`
                        absolute bottom-6 left-1/2 transform -translate-x-1/2 
                        text-xs pointer-events-none select-none
                        ${pressedKeys.has(keyData.note) ? 'text-gray-500' : (pianoStyle === 'synth' ? 'text-cyan-700' : 'text-gray-600')}
                      `}>
                        {keyData.note}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Black Keys */}
                <div className="absolute top-0 left-0 w-full h-full flex justify-center" style={{pointerEvents: 'none'}}>
                  <div className="relative flex">
                    {whiteKeys.map((whiteKey, whiteIndex) => {
                      // Find black key that should be positioned after this white key
                      const blackKey = blackKeys.find(bk => bk.whiteKeyIndex === whiteIndex);
                      
                      return (
                        <div key={`container-${whiteIndex}`} className="relative" style={{ width: '3.5rem', height: '7rem' }}>
                          {blackKey && (
                            <button
                              key={blackKey.note}
                              onMouseDown={(e) => {
                                console.log('Synth black key clicked:', blackKey.note);
                                e.preventDefault();
                                e.stopPropagation();
                                handleKeyPress(blackKey);
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleKeyPress(blackKey);
                              }}
                              className={`
                                absolute right-0 top-0 rounded-b-lg z-10 transition-all duration-150 cursor-pointer
                                transform translate-x-1/2
                                ${pianoStyle === 'synth' ? 'synth-black-key' : 'black-key'} 
                                ${pressedKeys.has(blackKey.note) ? 'pressed' : ''}
                                focus:outline-none focus:ring-2 focus:ring-blue-400 select-none
                              `}
                              style={{
                                height: '7rem',
                                width: '2rem',
                                border: 'none',
                                background: 'transparent',
                                padding: 0,
                                pointerEvents: 'auto'
                              }}
                            >
                              <span className={`
                                absolute bottom-1 left-1/2 transform -translate-x-1/2 
                                text-xs font-semibold pointer-events-none select-none
                                ${pressedKeys.has(blackKey.note) ? 'text-gray-300' : (pianoStyle === 'synth' ? 'text-cyan-300' : 'text-white')}
                              `}>
                                {blackKey.key.toUpperCase()}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Synth Control Panel */}
            <div className="text-center mt-8">
              <div className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg border-2 border-cyan-400">
                <span className="font-bold text-lg font-mono tracking-wide">⚡ DIGITAL SYNTHESIZER X7 ⚡</span>
              </div>
            </div>
          </div>
        ) : (
          // Grand Piano Container
          <div className="bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 p-8 rounded-3xl shadow-2xl border-8 border-amber-600 relative">
            {/* Wood Grain Effect */}
            <div className="absolute inset-0 rounded-3xl opacity-30 bg-gradient-to-r from-amber-800 via-transparent to-amber-800"></div>
            
            <div className="bg-gradient-to-b from-gray-800 to-black p-6 rounded-2xl shadow-inner border-4 border-amber-700 relative">
              {/* Piano Brand Plate */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-yellow-400 to-yellow-600 px-6 py-2 rounded-full border-2 border-yellow-700 shadow-lg">
                <span className="text-black font-bold text-sm font-serif">GRAND VIRTUOSO</span>
              </div>
              
              <div className="relative flex items-end justify-center piano-container w-full">
                {/* White Keys */}
                <div className="flex w-full justify-center">
                  {whiteKeys.map((keyData) => (
                    <button
                      key={keyData.note}
                      onMouseDown={(e) => {
                        console.log('Grand piano white key clicked:', keyData.note);
                        e.preventDefault();
                        e.stopPropagation();
                        handleKeyPress(keyData);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleKeyPress(keyData);
                      }}
                      className={`
                        relative w-14 h-44 mx-0.5 rounded-b-lg transition-all duration-150
                        white-key ${pressedKeys.has(keyData.note) ? 'pressed' : ''}
                        focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer select-none
                      `}
                      style={{ border: 'none', background: 'transparent', padding: 0 }}
                    >
                      <span className={`
                        absolute bottom-2 left-1/2 transform -translate-x-1/2 
                        text-xs font-semibold pointer-events-none select-none
                        ${pressedKeys.has(keyData.note) ? 'text-gray-600' : 'text-gray-700'}
                      `}>
                        {keyData.key.toUpperCase()}
                      </span>
                      <span className={`
                        absolute bottom-6 left-1/2 transform -translate-x-1/2 
                        text-xs pointer-events-none select-none
                        ${pressedKeys.has(keyData.note) ? 'text-gray-500' : 'text-gray-600'}
                      `}>
                        {keyData.note}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Black Keys */}
                <div className="absolute top-0 left-0 w-full h-full flex justify-center" style={{pointerEvents: 'none'}}>
                  <div className="relative flex">
                    {whiteKeys.map((whiteKey, whiteIndex) => {
                      // Find black key that should be positioned after this white key
                      const blackKey = blackKeys.find(bk => bk.whiteKeyIndex === whiteIndex);
                      
                      return (
                        <div key={`container-${whiteIndex}`} className="relative" style={{ width: '3.5rem', height: '7rem' }}>
                          {blackKey && (
                            <button
                              key={blackKey.note}
                              onMouseDown={(e) => {
                                console.log('Grand piano black key clicked:', blackKey.note);
                                e.preventDefault();
                                e.stopPropagation();
                                handleKeyPress(blackKey);
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleKeyPress(blackKey);
                              }}
                              className={`
                                absolute right-0 top-0 rounded-b-lg z-10 transition-all duration-150 cursor-pointer
                                transform translate-x-1/2
                                black-key ${pressedKeys.has(blackKey.note) ? 'pressed' : ''}
                                focus:outline-none focus:ring-2 focus:ring-blue-400 select-none
                              `}
                              style={{
                                height: '7rem',
                                width: '2rem',
                                border: 'none',
                                background: 'transparent',
                                padding: 0,
                                pointerEvents: 'auto'
                              }}
                            >
                              <span className={`
                                absolute bottom-1 left-1/2 transform -translate-x-1/2 
                                text-xs font-semibold pointer-events-none select-none
                                ${pressedKeys.has(blackKey.note) ? 'text-gray-300' : 'text-white'}
                              `}>
                                {blackKey.key.toUpperCase()}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Vintage Piano Legs */}
            <div className="absolute -bottom-6 left-8 w-4 h-12 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-lg shadow-lg"></div>
            <div className="absolute -bottom-6 right-8 w-4 h-12 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-lg shadow-lg"></div>
            
            {/* Piano Brand Signature */}
            <div className="text-center mt-8">
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black px-6 py-3 rounded-full shadow-lg border-2 border-amber-700">
                <span className="font-bold text-lg font-serif tracking-wide">✨ HANDCRAFTED IN NEW YORK ✨</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Instructions Panel */}
      <div className="mt-8 text-center max-w-5xl relative z-10">
        {pianoStyle === 'synth' ? (
          // Synth Instructions
          <div className="bg-gradient-to-br from-gray-800 to-black backdrop-blur-sm rounded-xl p-8 text-cyan-100 border-4 border-cyan-500 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 font-mono text-cyan-400">🎛️ SYNTH CONTROL MANUAL 🎛️</h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-gray-900 rounded-lg p-4 border-2 border-cyan-400 shadow-inner">
                <h4 className="font-bold text-cyan-300 mb-2 font-mono">🖱️ Touch Interface:</h4>
                <p className="font-mono">Click any key for electronic sound</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border-2 border-cyan-400 shadow-inner">
                <h4 className="font-bold text-cyan-300 mb-2 font-mono">⌨️ MIDI Mapping:</h4>
                <p className="font-mono">Use keyboard for digital control</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border-2 border-cyan-400 shadow-inner">
                <h4 className="font-bold text-cyan-300 mb-2 font-mono">🎛️ Synth Range:</h4>
                <p className="font-mono">2 octaves electronic spectrum</p>
              </div>
            </div>
            
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-gradient-to-r from-cyan-800 to-purple-800 text-cyan-100 rounded-lg p-4 border-2 border-cyan-400">
                <strong className="font-mono text-sm">Lower Bank (C4-B4):</strong><br/>
                <span className="font-mono">White: Q E T Y I P S | Black: W R U O A</span>
              </div>
              <div className="bg-gradient-to-r from-purple-800 to-pink-800 text-purple-100 rounded-lg p-4 border-2 border-purple-400">
                <strong className="font-mono text-sm">Upper Bank (C5-C6):</strong><br/>
                <span className="font-mono">White: D G K Z C B N | Black: F H L X V</span>
              </div>
            </div>
            
            <div className="mt-6 bg-gradient-to-r from-cyan-700 to-purple-700 text-white rounded-lg p-4 border-2 border-cyan-500">
              <p className="font-mono text-sm mb-2">🎵 <strong>Electronic Presets:</strong></p>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <p className="font-mono"><strong>"Synth Pop Melody":</strong><br/>
                <span className="font-mono bg-black/30 px-2 py-1 rounded">Q-Q-I-I-P-P-I</span></p>
                <p className="font-mono"><strong>"Electronic Bass Line":</strong><br/>
                <span className="font-mono bg-black/30 px-2 py-1 rounded">T-E-Q-E-T-T-T</span></p>
              </div>
            </div>
            
            {/* Digital Footer */}
            <div className="mt-6 pt-4 border-t-2 border-cyan-400">
              <p className="text-xs text-cyan-300 font-mono">
                "Future Sound Technology" • Digital Era • Electronic Music Production
              </p>
            </div>
          </div>
        ) : (
          // Grand Piano Instructions
          <div className="bg-gradient-to-b from-amber-100 to-amber-200 backdrop-blur-sm rounded-xl p-8 text-amber-900 border-4 border-amber-600 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 font-serif text-amber-800">🎼 Master's Playing Guide 🎼</h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300 shadow-inner">
                <h4 className="font-bold text-amber-800 mb-2 font-serif">🖱️ Touch Method:</h4>
                <p className="font-serif">Gentle click on any key for beautiful tone</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300 shadow-inner">
                <h4 className="font-bold text-amber-800 mb-2 font-serif">⌨️ Keyboard Artistry:</h4>
                <p className="font-serif">Use the elegant letter mapping system</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300 shadow-inner">
                <h4 className="font-bold text-amber-800 mb-2 font-serif">🎹 Tonal Range:</h4>
                <p className="font-serif">2 magnificent octaves (C4 to C6)</p>
              </div>
            </div>
            
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-amber-100 rounded-lg p-4 border-2 border-amber-600">
                <strong className="font-serif text-sm">Lower Register (C4-B4):</strong><br/>
                <span className="font-mono">White: Q E T Y I P S | Black: W R U O A</span>
              </div>
              <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-amber-100 rounded-lg p-4 border-2 border-amber-600">
                <strong className="font-serif text-sm">Upper Register (C5-C6):</strong><br/>
                <span className="font-mono">White: D G K Z C B N | Black: F H L X V</span>
              </div>
            </div>
            
            <div className="mt-6 bg-gradient-to-r from-yellow-700 to-amber-700 text-white rounded-lg p-4 border-2 border-yellow-800">
              <p className="font-serif text-sm mb-2">🎵 <strong>Classical Repertoire Suggestions:</strong></p>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <p className="font-serif"><strong>"Twinkle, Twinkle, Little Star":</strong><br/>
                <span className="font-mono bg-black/20 px-2 py-1 rounded">Q-Q-I-I-P-P-I</span></p>
                <p className="font-serif"><strong>"Mary Had a Little Lamb":</strong><br/>
                <span className="font-mono bg-black/20 px-2 py-1 rounded">T-E-Q-E-T-T-T</span></p>
              </div>
            </div>
            
            {/* Vintage Footer */}
            <div className="mt-6 pt-4 border-t-2 border-amber-400">
              <p className="text-xs text-amber-700 font-serif italic">
                "Where Music Meets American Craftsmanship" • Since 1853 • Premium Virtual Instruments
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
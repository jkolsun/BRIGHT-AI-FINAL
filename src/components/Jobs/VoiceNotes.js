import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

const VoiceNotes = ({ jobId, onTranscript }) => {
  const [recording, setRecording] = useState(false);

  return (
    <button 
      className={`p-2 rounded ${recording ? 'bg-red-500' : 'bg-gray-500'} text-white`}
      onClick={() => {
        setRecording(!recording);
        if (recording) onTranscript('Voice note recorded');
      }}
    >
      {recording ? <Mic size={16} /> : <MicOff size={16} />}
    </button>
  );
};

export default VoiceNotes;
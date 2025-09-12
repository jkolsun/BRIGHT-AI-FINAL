class VoiceCommandService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.initializeRecognition();
  }

  initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
    }
  }

  async startListening() {
    if (!this.recognition) {
      alert('Voice recognition not supported in your browser');
      return null;
    }

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(this.processCommand(transcript));
      };

      this.recognition.onerror = (event) => {
        reject(event.error);
      };

      this.recognition.start();
      this.isListening = true;
    });
  }

  processCommand(transcript) {
    const command = transcript.toLowerCase();
    
    if (command.includes('complete job') || command.includes('job done')) {
      return { action: 'complete_job', transcript };
    }
    if (command.includes('start job') || command.includes('begin job')) {
      return { action: 'start_job', transcript };
    }
    if (command.includes('add note')) {
      return { action: 'add_note', note: transcript.replace('add note', '').trim() };
    }
    if (command.includes('call customer')) {
      return { action: 'call_customer', transcript };
    }
    if (command.includes('next job')) {
      return { action: 'next_job', transcript };
    }
    
    return { action: 'unknown', transcript };
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export { VoiceCommandService };
"use client";
import { useState, useRef } from 'react';

export default function AudioRecorder() {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null); // Add a ref to store the stream

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioStreamRef.current = stream; // Store the stream in the ref
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = event => {
          setAudioBlob(event.data);
          const url = URL.createObjectURL(event.data);
          setAudioUrl(url);
        };
        mediaRecorderRef.current.start();
        setRecording(true);
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null; 
    }
  };

  const uploadAndTranscribe = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      const transcription = data.results.channels[0].alternatives[0].transcript;
      setTranscript(transcription);
    } catch (error: any) {
      console.error('Error uploading file:', error.message);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recording}>Stop Recording</button>
      <button onClick={uploadAndTranscribe} disabled={!audioBlob}>Upload and Transcribe</button>
      {audioUrl && <audio controls src={audioUrl} />}
      {transcript && (
        <div>
          <h2>Transcript</h2>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}

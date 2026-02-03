export function playSound(
  type: 'preset' | 'tts' | undefined,
  url: string | undefined,
  text: string | undefined,
  serverUrl: string
): void {
  if (type === 'preset' && url) {
    // Ensure absolute URL if it's relative
    let playableUrl = url;
    if (url.startsWith('/')) {
      playableUrl = `${serverUrl}${url}`;
    }
    console.log('Playing audio from URL:', playableUrl);
    const audio = new Audio(playableUrl);
    audio.play().catch(err => console.error('Error playing sound', err));
  } else if (type === 'tts' && text) {
    console.log('Playing TTS:', text);
    if (window.speechSynthesis) {
      // Cancel any current speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser.');
    }
  } else {
    console.log('No sound to play (missing type, url, or text)');
  }
}

// Run this in browser console to set female voice:
window.speechSynthesis.getVoices().filter(v => v.gender === 'female' || v.name.toLowerCase().includes('female')).forEach(v => console.log(v.name, v.lang));

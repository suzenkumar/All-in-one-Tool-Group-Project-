const textInput = document.getElementById("text-input");
const voiceSelect = document.getElementById("voice-select");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const rateInput = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");

let speech = new SpeechSynthesisUtterance();
let voices = [];

// Load Voices
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

window.speechSynthesis.onvoiceschanged = loadVoices;

// Speak Function
speakBtn.addEventListener("click", () => {
  if (!textInput.value.trim()) {
    alert("Please enter some text!");
    return;
  }

  speech.text = textInput.value;
  speech.voice = voices[voiceSelect.value];
  speech.rate = rateInput.value;
  speech.pitch = pitchInput.value;

  window.speechSynthesis.cancel(); // reset if speaking
  window.speechSynthesis.speak(speech);
});

// Stop Function
stopBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
});

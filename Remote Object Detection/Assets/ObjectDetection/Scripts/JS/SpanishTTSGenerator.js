// @input Component.AudioComponent audioComponent
// @input Asset.AudioTrackAsset audioOutputAsset
//@ui {"widget":"group_start", "label":"API Configuration"}
//@input string speechifyAPIKey {"hint":"Enter your Speechify API key"}
//@input string voiceId = "alejandro" {"widget":"combobox", "values":[{"label":"Alejandro (Spanish)", "value":"alejandro"}, {"label":"Liv (English)", "value":"liv"}]}
//@input string audioFormat = "wav" {"widget":"combobox", "values":[{"label":"WAV", "value":"wav"}, {"label":"MP3", "value":"mp3"}]}
//@input string language = "es-ES" {"widget":"combobox", "values":[{"label":"Spanish", "value":"es-ES"}, {"label":"English", "value":"en-US"}]}
//@ui {"widget":"group_end"}

var remoteServiceModule = require("LensStudio:RemoteServiceModule");

// Make generateAndPlaySpeech globally accessible
script.api.generateAndPlaySpeech = async function(inputText) {
    if (!inputText) {
        print("No text provided for speech synthesis.");
        return;
    }

    try {
        const requestPayload = {
            input: inputText,
            voice_id: script.voiceId,
            audio_format: script.audioFormat,
            model: "simba-multilingual",
            language: script.language
        };

        const request = new Request("https://api.sws.speechify.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${script.speechifyAPIKey}`,
            },
            body: JSON.stringify(requestPayload),
        });

        print("Sending request to Speechify...");
        
        let response = await remoteServiceModule.fetch(request);
        print("Response status: " + response.status);

        if (response.status === 200) {
            try {
                // First parse the JSON response
                const responseJson = await response.json();
                
                // The audio data is base64 encoded in the audio_data field
                if (!responseJson.audio_data) {
                    throw new Error("No audio data in response");
                }
                
                print("Received audio data, processing...");
                
                if (!script.audioOutputAsset) {
                    throw new Error("Audio Output asset is not assigned");
                }

                // Process the audio data and play it
                await processAndPlayAudio(responseJson.audio_data);
                
                print("Playing speech: " + inputText);
            } catch (processError) {
                print("Error processing audio data: " + processError);
            }
        } else {
            const errorText = await response.text();
            print("API Error: " + response.status + " - " + errorText);
        }
    } catch (error) {
        print("Error generating speech: " + error);
    }
};

// Custom base64 decoder function for Lens Studio
function base64ToByteArray(base64) {
    // Base64 character set
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    // Remove padding if any
    let data = base64.replace(/=+$/, '');
    
    // Calculate output length
    const outputLength = Math.floor(data.length * 3 / 4);
    const bytes = new Uint8Array(outputLength);
    
    // Process input in groups of 4 characters
    let p = 0; // Position in the output array
    for (let i = 0; i < data.length; i += 4) {
        // Convert 4 base64 characters to values 0-63
        const c1 = chars.indexOf(data[i] || 'A');
        const c2 = chars.indexOf(data[i + 1] || 'A');
        const c3 = chars.indexOf(data[i + 2] || 'A');
        const c4 = chars.indexOf(data[i + 3] || 'A');
        
        // Combine into 24 bits (3 bytes)
        const triplet = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
        
        // Extract the 3 bytes
        if (p < outputLength) bytes[p++] = (triplet >> 16) & 0xFF;
        if (p < outputLength) bytes[p++] = (triplet >> 8) & 0xFF;
        if (p < outputLength) bytes[p++] = triplet & 0xFF;
    }
    
    return bytes;
}

// Function to process and play the audio data
async function processAndPlayAudio(base64AudioData) {
    // Make sure the audio component is enabled
    script.audioComponent.enabled = true;
    
    // Set the audio track to the output asset
    script.audioComponent.audioTrack = script.audioOutputAsset;
    
    // Get the audio output control
    const audioOutput = script.audioOutputAsset.control;
    if (!audioOutput) {
        throw new Error("Failed to get audio output control");
    }
    
    // Convert base64 to byte array
    const audioData = base64ToByteArray(base64AudioData);
    print("Decoded audio data length: " + audioData.length);
    
    // Process the audio data based on format
    if (script.audioFormat === "wav") {
        processWavData(audioData, audioOutput);
    } else if (script.audioFormat === "mp3") {
        print("MP3 format requires additional decoding which is not supported directly.");
        print("Consider using WAV format for better compatibility.");
    }
    
    // Play the audio
    script.audioComponent.play(1);
}

// Process WAV data specifically
function processWavData(audioData, audioOutput) {
    // WAV header is typically 44 bytes
    const headerOffset = 44;
    
    // Check if we have enough data
    if (audioData.length <= headerOffset) {
        throw new Error("WAV data too short");
    }
    
    // Extract sample rate from WAV header (bytes 24-27)
    const sampleRate = 
        audioData[24] + 
        (audioData[25] << 8) + 
        (audioData[26] << 16) + 
        (audioData[27] << 24);
    
    print("WAV sample rate: " + sampleRate);
    audioOutput.sampleRate = sampleRate;
    
    // Extract bit depth from WAV header (bytes 34-35)
    const bitsPerSample = audioData[34] + (audioData[35] << 8);
    print("WAV bits per sample: " + bitsPerSample);
    
    // Extract number of channels from WAV header (bytes 22-23)
    const numChannels = audioData[22] + (audioData[23] << 8);
    print("WAV channels: " + numChannels);
    
    // Calculate actual audio data size
    const dataSize = audioData.length - headerOffset;
    
    // Create a Float32Array to hold the audio data
    // For 16-bit audio, each sample is 2 bytes
    const samplesCount = dataSize / (bitsPerSample / 8);
    const data = new Float32Array(samplesCount);
    
    // Convert the audio data to Float32Array based on bit depth
    if (bitsPerSample === 16) {
        // 16-bit PCM
        for (let i = 0, j = headerOffset; i < samplesCount; i++, j += 2) {
            // Convert from Little Endian 16-bit to signed integer
            const sample = ((audioData[j] | (audioData[j + 1] << 8)) << 16) >> 16;
            // Normalize to [-1, 1]
            data[i] = sample / 32768.0;
        }
    } else if (bitsPerSample === 8) {
        // 8-bit PCM
        for (let i = 0, j = headerOffset; i < samplesCount; i++, j++) {
            // 8-bit WAV is unsigned [0, 255], convert to [-1, 1]
            data[i] = (audioData[j] - 128) / 128.0;
        }
    } else {
        throw new Error("Unsupported bit depth: " + bitsPerSample);
    }
    
    // Create the shape for the audio frame
    const shape = new vec3(samplesCount, 1, 1);
    shape.x = audioOutput.getPreferredFrameSize();
    
    // Enqueue audio frames in chunks
    let i = 0;
    while (i < samplesCount) {
        try {
            const chunkSize = Math.min(shape.x, samplesCount - i);
            shape.x = chunkSize;
            audioOutput.enqueueAudioFrame(data.subarray(i, i + chunkSize), shape);
            i += chunkSize;
        } catch (e) {
            print("Failed to enqueue audio frame - " + e);
            break;
        }
    }
}

script.createEvent("OnStartEvent").bind(() => {
    print("Starting Speechify TTS Generator");
    if (!remoteServiceModule || !script.audioComponent || !script.speechifyAPIKey) {
        print("Remote Service Module, Audio Component, or API key is missing.");
        return;
    }

    if (!script.audioOutputAsset) {
        print("Audio Output asset is not assigned. Please assign an Audio Output asset in the Inspector.");
        return;
    }

    // Make sure the audio component is enabled
    script.audioComponent.enabled = true;
    
    // Set the audio track to the output asset
    script.audioComponent.audioTrack = script.audioOutputAsset;

    // Test with a simple greeting
    const language = script.language.startsWith("es") ? "¡Hola! El sistema de texto a voz está listo." : "Hello! The text-to-speech system is ready.";
    script.api.generateAndPlaySpeech(language);
});
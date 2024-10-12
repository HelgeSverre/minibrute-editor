// Credits to Hackabrute for these Sysex strings - https://hackabrute.yusynth.net/MINIBRUTE/standard2SE_en.html
// const SYSEX_CONVERT_VANILLA_TO_SE = "F0 00 20 6B 04 01 75 01 3E 01 F7";
// const SYSEX_CONVERT_SE_TO_VANILLA = "F0 00 20 6B 04 01 46 01 3E 00 F7";

import {
  bytesToVersion,
  extractHexSlice,
  formatMIDIMessage,
  isSysexIdentityReply,
  isSysExMessage,
  SYSEX_IDENTITY_REQUEST,
} from "@/utils.js";

export default () => ({
  parameters: {
    receiveChannel: {
      cc: 102,
      options: [
        ...Array.from({ length: 16 }, (_, i) => ({
          label: `${i + 1}`,
          value: i + 1,
        })),
        { label: "All", value: 17 },
      ],
    },
    // Transmit channel
    sendChannel: {
      cc: 103,
      options: Array.from({ length: 16 }, (_, i) => ({
        label: `${i + 1}`,
        value: i + 1,
      })),
    },
    // seqRetrig: { cc: 104, options: ["Reset", "Legato", "None"] },
    // seqPlayMode: { cc: 105, options: ["Hold", "Note On"] },
    // nextSeqMode: { cc: 106, options: ["End", "Instant Reset", "Instant Continuous"] },
    // seqStepSize: { cc: 107, options: ["1/4", "1/8", "1/16", "1/32"] },
    syncSource: {
      cc: 108,
      options: [
        { label: "Auto", value: 0 },
        { label: "Int", value: 42 },
        { label: "Ext", value: 84 },
      ],
    },
    envLegatoMode: {
      cc: 109,
      options: [
        { label: "Off", value: 0 },
        { label: "On", value: 64 },
      ],
    },
    lfoRetrigMode: {
      cc: 110,
      options: [
        { label: "Off", value: 0 },
        { label: "On", value: 64 },
      ],
    },
    notePriority: {
      cc: 111,
      options: [
        { label: "Last", value: 0 },
        { label: "Low", value: 42 },
        { label: "High", value: 84 },
      ],
    },
    velocityCurve: {
      cc: 112,
      options: [
        { label: "Lin", value: 0 },
        { label: "Log", value: 42 },
        { label: "Anti Log", value: 84 },
      ],
    },
    // gateLength: { cc: 113, options: ["Short", "Med", "Long"] },
    // seqStepGateMode: { cc: 114, options: ["Clk", "Gate/Tap"] },
    audioInThreshold: {
      cc: 115,
      options: [
        { label: "Low", value: 0 },
        { label: "Mid", value: 42 },
        { label: "High", value: 84 },
      ],
    },
    aftertouchCurve: {
      cc: 116,
      options: [
        { label: "Exponential", value: 0 },
        { label: "Logarithmic", value: 42 },
        { label: "Linear", value: 83 },
      ],
    },
    arpeggiatorHold: {
      cc: 117,
      options: [
        { label: "Off", value: 0 },
        { label: "On", value: 64 },
      ],
    },
    localOnOff: {
      cc: 122,
      options: [
        { label: "Off", value: 0 },
        { label: "On", value: 127 },
      ],
    },
  },
  sequences: [
    // "60 60 60 60 60 60 60 60 60 60 60 60 60 60 60 60",
    // "60 60 60 48 60 60 60 72 60 60 60 48 60 60 72 48",
    // "48 60 48 60 48 60 63 51 48 60 48 60 63 51 67 55 48 60 48 60 48 60 63 51 48 60 48 60 63 51 67 61",
    // "60 60 60 60 60 60 57 59 60 60 60 59 60 60 60 60 60 60 62 59 60 62 64 67 69",
    // "48 60 72 70 48 67 60 55 48 x 65 72 48 62 72 62 51 58 63 72 51 70 63 58 51 x 62 72 51 72 62 64",
    // "48 x x 60 48 x 60 x 60 x x 72 60 x 60 x 48 x x 60 48 x 60 x 65 x x",
    // "60 72 48 60 60 x x 48 60 72 x 60 60 x x 73 48 72 60 61 60 x 72 84 72 48 79 82 48 77 81 70",
    // "48 48 x x 72 60 48 48 x x 48 x 72 x 82 x 48 48 x x 72 60 48 48 x x 48 x 72 x 75 x 48 48 x x 72 49 48",
  ],

  deviceVersion: null,

  paramValues: {},
  midiInputs: [],
  midiOutputs: [],
  selectedInput: "",
  selectedOutput: "",
  midiAccess: null,

  consoleOpen: false,
  logMessages: [],

  clearLog() {
    this.logMessages = [];

    this.logToWindow(`Cleared log messages`, "comment");
  },

  // TODO: For debugging only
  playNotes() {
    const gap = 250;
    [60, 62, 64, 65, 67, 69, 71, 72].forEach((note, i) => {
      setTimeout(() => this.playNote(note, gap), i * gap);
    });
  },

  // TODO: For debugging only
  playNote(note = 60, duration = 1000, velocity = 127) {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );

    this.logToWindow(
      `Playing note ${note} for ${duration}ms at velocity ${velocity}`,
      "debug",
    );

    // Note On
    output.send([0x90, note, velocity]);

    // Note Off after duration (1000ms by default)
    setTimeout(() => {
      this.logToWindow(`Note Off: ${note}`, "debug");
      output.send([0x80, note, 0]);
    }, duration);
  },

  getMinNoteWithOctave(sequence) {
    const minNote = Math.min(
      ...sequence
        .split(" ")
        .filter((n) => n !== "x")
        .map(Number),
    );
    return Math.floor(minNote / 12) * 12;
  },

  getMaxNoteWithOctave(sequence) {
    const maxNote = Math.max(
      ...sequence
        .split(" ")
        .filter((n) => n !== "x")
        .map(Number),
    );
    const minNoteWithOctave = this.getMinNoteWithOctave(sequence);
    return Math.max(minNoteWithOctave + 11, maxNote);
  },

  getNoteRange(sequence) {
    const minNote = this.getMinNoteWithOctave(sequence);
    const maxNote = this.getMaxNoteWithOctave(sequence);
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];

    let notes = [];
    for (let i = maxNote; i >= minNote; i--) {
      const octave = Math.floor(i / 12) - 1;
      const noteName = noteNames[i % 12];
      notes.push(`${noteName}${octave}`);
    }

    return notes;
  },

  calculateNotePosition(note, sequence) {
    if (note === "x") return 0;
    const minNote = this.getMinNoteWithOctave(sequence);
    const maxNote = this.getMaxNoteWithOctave(sequence);
    const totalRange = maxNote - minNote;
    return ((Number(note) - minNote) / totalRange) * 100;
  },

  logToWindow(message, type = "info") {
    const entry = {
      timestamp: new Date().toISOString(),
      message: message,
      type: type,
    };
    this.logMessages.push(entry);

    this.$nextTick(() => {
      this.scrollToBottom();
    });
  },

  scrollToBottom() {
    if (this.$refs.logWindow) {
      this.$refs.logWindow.scrollTop = this.$refs.logWindow?.scrollHeight;
    }
  },

  init() {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess({ sysex: true })
        .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
    } else {
      this.logToWindow("WebMIDI is not supported in this browser.", "error");
    }

    this.$watch("consoleOpen", (value) => {
      localStorage.setItem("state:consoleOpen", JSON.stringify(value));
    });
    this.consoleOpen = localStorage.getItem("state:consoleOpen") === "true";

    this.$watch("sequences", (value) => {
      localStorage.setItem("state:sequences", JSON.stringify(value));
    });

    this.sequences =
      JSON.parse(localStorage.getItem("state:sequences")) || this.sequences;
  },

  onMIDISuccess(midiAccess) {
    this.midiAccess = midiAccess;
    this.updateDeviceLists();

    midiAccess.onstatechange = (event) => {
      this.updateDeviceLists();
    };

    // Set up MIDI input listeners
    for (let input of midiAccess.inputs.values()) {
      input.onmidimessage = this.onMIDIMessage.bind(this);
    }

    this.identify();
  },

  onMIDIMessage(event) {
    // "Active Sensing" - ignore, sent every 300ms
    if (event.data[0] === 0xfe) {
      return;
    }

    const isSysex = isSysExMessage(event.data[0]);
    this.logToWindow(formatMIDIMessage(event), isSysex ? "debug" : "info");

    if (isSysexIdentityReply(event.data)) {
      this.handleIdentityReply(event.data);
    }
  },

  getMIDIMessageType(statusByte) {
    const types = [
      "Note Off",
      "Note On",
      "Polyphonic Aftertouch",
      "Control Change",
      "Program Change",
      "Channel Aftertouch",
      "Pitch Bend",
      "System",
    ];
    return types[statusByte - 8] || "Unknown";
  },

  handleIdentityReply(data) {
    // Ex: F0 7E 01 06 02 00 20 6B 04 00 01 01 01 00 03 02 F7
    // Arturia: 00 20 6B
    // Version: 1.1.0.3.2

    // todo: fetch this from a json file on github
    // ex: https://github.com/jeffkamo/midi-manufacturers/blob/main/manufacturers.json
    const manufacturers = {
      "00 20 6B": "Arturia",
      "00 20 33": "Access",
    };

    const manufacturer = extractHexSlice(data, 5, 8);
    const manufacturerName = manufacturers[manufacturer] || "Unknown";
    const family = extractHexSlice(data, 8, 10);
    const model = extractHexSlice(data, 10, 12);
    const version = bytesToVersion(data, 12, 4);

    this.deviceVersion = version;

    const message = `Identity Reply - Manufacturer: ${manufacturer} (${manufacturerName}), Family: ${family}, Model: ${model}, Version: ${version}`;
    this.logToWindow(message, "success");
  },

  identify() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (output) {
      try {
        output.send(SYSEX_IDENTITY_REQUEST);
      } catch (error) {
        this.logToWindow(
          `Error sending MIDI message: ${error.message}`,
          "error",
        );
      }
      this.logToWindow("Sent Identity Request", "info");
    } else {
      this.logToWindow("No MIDI output selected", "warning");
    }
  },

  updateDeviceLists() {
    this.midiInputs = Array.from(this.midiAccess.inputs.values());
    this.midiOutputs = Array.from(this.midiAccess.outputs.values());

    // Auto-select MiniBrute devices
    const miniBruteInput = this.midiInputs.find((device) =>
      device.name.toLowerCase().includes("minibrute"),
    );
    const miniBruteOutput = this.midiOutputs.find((device) =>
      device.name.toLowerCase().includes("minibrute"),
    );

    if (miniBruteInput && this.selectedInput !== miniBruteInput.id) {
      this.selectedInput = miniBruteInput.id;
      this.handleInputChange();
    }
    if (miniBruteOutput && this.selectedOutput !== miniBruteOutput.id) {
      this.selectedOutput = miniBruteOutput.id;
      this.handleOutputChange();
    }
  },

  onMIDIFailure(error) {
    this.logToWindow("Could not access your MIDI devices:", "alert");

    this.logToWindow(error, "error");
  },

  handleInputChange() {
    const selectedDevice = this.midiInputs.find(
      (device) => device.id === this.selectedInput,
    );
    if (selectedDevice) {
      this.logToWindow(`Input changed: ${selectedDevice.name}`, "info");
    }
  },

  clearSequences() {
    this.sequences = [];
    this.logToWindow(
      "Cleared sequences from memory (not the device)",
      "comment",
    );
  },

  async loadSequences() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    const input = this.midiInputs.find(
      (device) => device.id === this.selectedInput,
    );

    if (!output || !input) {
      this.logToWindow("No MIDI input or output selected", "warning");
      return;
    }

    this.sequences = [];

    for (let i = 0; i < 6; i++) {
      try {
        const sequence = await this.requestSequence(input, output, i);
        if (sequence) {
          this.sequences.push(sequence);
          this.logToWindow(`Loaded sequence ${i + 1}`, "success");
        }
      } catch (error) {
        this.logToWindow(
          `Error loading sequence ${i + 1}: ${error.message}`,
          "error",
        );
      }
    }

    this.logToWindow(
      `Completed loading sequences. Total loaded: ${this.sequences.length}`,
      "success",
    );
  },

  requestSequence(input, output, sequenceIndex) {
    return new Promise((resolve, reject) => {
      let fullSequence = "";
      let receivedResponses = 0;

      const handleMessage = (event) => {
        const data = event.data;
        if (
          data[0] !== 0xf0 ||
          data[1] !== 0x00 ||
          data[2] !== 0x20 ||
          data[3] !== 0x6b
        ) {
          this.logToWindow("Received non-Sysex message", "debug");
          return;
        } // Not the expected message

        if (data[7] === 0x23) {
          // Response with sequence data
          const sequence = Array.from(data.slice(12, 44))
            .map((note) => (note === 0 ? "x" : note.toString()))
            .join(" ");
          fullSequence += sequence + " ";
          receivedResponses++;

          if (receivedResponses === 2) {
            // We've received both parts of the sequence
            cleanup();
            resolve(fullSequence.trim());
          }
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        input.removeEventListener("midimessage", handleMessage);
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for sequence ${sequenceIndex + 1}`));
      }, 5000);

      input.addEventListener("midimessage", handleMessage);

      // Send two request messages for each sequence
      for (let j = 0; j < 2; j++) {
        const sequenceCounter = 0x60 + sequenceIndex * 2 + j;
        const requestMessage = [
          0xf0,
          0x00,
          0x20,
          0x6b,
          0x04,
          0x01,
          sequenceCounter,
          0x03,
          0x3b,
          Math.floor(sequenceIndex / 2),
          j * 0x20,
          0x20,
          0xf7,
        ];
        output.send(requestMessage);
        this.logToWindow(
          `Sent request for sequence ${sequenceIndex + 1}, part ${j + 1}`,
          "debug",
        );
      }
    });
  },

  handleOutputChange() {
    const selectedDevice = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (selectedDevice) {
      this.logToWindow(`Output changed: ${selectedDevice.name}`, "info");
    }
  },

  handleParamChange(param, value) {
    return;
    // TODO: implement
  },
});

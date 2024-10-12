// Credits to Hackabrute for these Sysex strings - https://hackabrute.yusynth.net/MINIBRUTE/standard2SE_en.html
const SYSEX_CONVERT_VANILLA_TO_SE = "F0 00 20 6B 04 01 75 01 3E 01 F7";
const SYSEX_CONVERT_SE_TO_VANILLA = "F0 00 20 6B 04 01 46 01 3E 00 F7";

import {
  bytesToHex,
  bytesToVersion,
  extractHexSlice,
  formatMIDIMessage,
  isSysexIdentityReply,
  isSysExMessage,
  midiToNoteName,
  SYSEX_IDENTITY_REQUEST,
} from "@/utils.js";

export default () => ({
  messageCounter: 0,
  sysexData: "f0 00 20 6b 04 00 01 03 01 00 00 00 f7",

  parameterMap: {
    sendChannel: { sysexParam: 0x07, valueMap: (v) => v - 1 },
    receiveChannel: {
      sysexParam: 0x05,
      valueMap: (v) => (v === 17 ? 16 : v - 1),
    },
    audioInThreshold: { sysexParam: 0x09, valueMap: { 0: 0, 42: 1, 84: 2 } },
    lfoRetrigMode: { sysexParam: 0x0f, valueMap: { 0: 0, 64: 1 } },
    aftertouchCurve: { sysexParam: 0x13, valueMap: { 0: 0, 42: 1, 83: 2 } },
    velocityCurve: { sysexParam: 0x11, valueMap: { 0: 0, 42: 1, 84: 2 } },
    envLegatoMode: { sysexParam: 0x0d, valueMap: { 0: 1, 64: 0 } },
    notePriority: { sysexParam: 0x0b, valueMap: { 0: 0, 42: 1, 84: 2 } },
    syncSource: { sysexParam: 0x33, valueMap: { 0: 0, 42: 2, 84: 1 } },
  },

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
  targetVersion: null,
  paramValues: {},
  midiInputs: [],
  midiOutputs: [],
  selectedChannel: 0,
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

  getDetailedSequences() {
    return this.sequences.map((sequence, index) => {
      return {
        raw: sequence,
        index: index + 1,
        notes: this.getNoteRange(sequence),
      };
    });
  },

  getNoteRange(sequence) {
    let notes = sequence
      .split(" ")
      .filter((n) => n !== "x")
      .map(Number);

    const minNote = Math.min(...notes);
    const maxNote = Math.max(...notes);
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

    let range = [];
    for (let i = maxNote; i >= minNote; i--) {
      const octave = Math.floor(i / 12) - 1;
      const noteName = noteNames[i % 12];
      range.push({
        midi: i,
        label: `${noteName}${octave}`,
        key: noteName,
        isBlack: noteName.includes("#"),
        isWhite: !noteName.includes("#"),
      });
    }
    return range;
  },

  getSequenceNotes(sequence) {
    return sequence.split(" ").map((note, index) => {
      const label = midiToNoteName(note);
      return {
        step: index + 1,
        note: note === "x" ? null : Number(note),
        label: label === "x" ? null : label,
        isWhite: note === "x" ? false : label.includes("#"),
        isBlack: note === "x" ? false : !label.includes("#"),
      };
    });
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

    midiAccess.onstatechange = () => this.updateDeviceLists();

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
    const miniBruteInput = this.midiInputs.find(
      (device) =>
        device.name.toLowerCase().includes("minibrute") ||
        device.name.toLowerCase().includes("updater"),
    );
    const miniBruteOutput = this.midiOutputs.find(
      (device) =>
        device.name.toLowerCase().includes("minibrute") ||
        device.name.toLowerCase().includes("updater"),
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
      // Initialize variables to store the sequence and track responses
      let fullSequence = "";
      let receivedResponses = 0;

      // Handler function for incoming MIDI messages
      const handleMessage = (event) => {
        const data = event.data;

        // Check if the message is a SysEx message from the expected device (Arturia MiniBrute)
        if (
          data[0] !== 0xf0 || // SysEx start
          data[1] !== 0x00 || // Manufacturer ID (part 1)
          data[2] !== 0x20 || // Manufacturer ID (part 2)
          data[3] !== 0x6b // Manufacturer ID (part 3, Arturia)
        ) {
          if (data === 0xfe) {
            // Active Sensing message, ignore
            return;
          }

          this.logToWindow("Received non-Sysex message: " + data, "debug");
          return;
        }

        // Check if the message contains sequence data (0x23 indicates sequence data)
        if (data[7] === 0x23) {
          // Extract sequence data from the message
          const sequence = Array.from(data.slice(12, 44))
            .map((note) => (note === 0 || note === 127 ? "x" : note.toString()))
            .join(" ");

          // Add the received sequence part to the full sequence
          fullSequence += sequence + " ";
          receivedResponses++;

          // If we've received both parts of the sequence
          if (receivedResponses === 2) {
            cleanup();
            resolve(fullSequence.trim()); // Resolve the promise with the complete sequence
          }
        }
      };

      // Function to clean up event listeners and timeouts
      const cleanup = () => {
        clearTimeout(timeout);
        input.removeEventListener("midimessage", handleMessage);
      };

      // Set a timeout to reject the promise if we don't receive a response in time
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for sequence ${sequenceIndex + 1}`));
      }, 5000); // 5 second timeout

      // Add the message handler to the MIDI input
      input.addEventListener("midimessage", handleMessage);

      // Send two request messages for each sequence (the sequence is sent in two parts)
      for (let j = 0; j < 2; j++) {
        const sequenceCounter = 0x60 + (sequenceIndex + 1) * 2 + j;

        // Construct the SysEx message to request the sequence part
        const requestMessage = [
          0xf0, // SysEx start
          0x00,
          0x20,
          0x6b, // Manufacturer ID (Arturia)
          0x04,
          0x01, // Product ID (MiniBrute)
          sequenceCounter, // Sequence counter
          0x03, // Message type/command (0x03 for "sequence data request" probably..)
          0x3b, // Parameter ID (sequence data)
          sequenceIndex, // Sequence index (0-5, aka which sequence to get)
          j * 0x20, // Offset (0 for first part, 32 for second part, totaling 64 steps)
          0x20, // Length (32 in decimal, 0x20 in hex)
          0xf7, // SysEx end
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
    const paramInfo = this.parameterMap[param];
    if (!paramInfo) {
      this.logToWindow(`Unknown parameter: ${param}`, "error");
      return;
    }

    const sysexParam = paramInfo.sysexParam;
    let sysexValue;

    if (typeof paramInfo.valueMap === "function") {
      sysexValue = paramInfo.valueMap(Number(value));
    } else {
      sysexValue = paramInfo.valueMap[value];
    }

    if (sysexValue === undefined) {
      this.logToWindow(
        `Invalid value for parameter ${param}: ${value}`,
        "error",
      );
      return;
    }

    this.sendParameterSysEx(sysexParam, sysexValue);
  },

  sendSysex() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    // F0 7E 7F 06 01 F7
    const sysexMessage = this.sysexData.split(" ").map((n) => parseInt(n, 16));

    // F0 7E 06 02 00 20 6B 04 00 01 03 01 00 00 00 F7
    this.logToWindow("Sending: " + bytesToHex(sysexMessage), "info");

    try {
      // output.send(sysexMessage);
    } catch (error) {
      this.logToWindow(`Error sending MIDI message: ${error.message}`, "error");
    }
  },

  sendParameterSysEx(param, value) {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );

    if (!output) {
      this.logToWindow("No MIDI output selected", "error");
      return;
    }

    // Increment the message counter, wrapping around at 0x7F
    this.messageCounter = (this.messageCounter + 1) & 0x7f;

    // F0 7E 7F 06 01 F7
    const sysexMessage = [
      0xf0, // SysEx start
      0x00,
      0x20,
      0x6b, // Arturia manufacturer ID
      0x04,
      0x00, // Hardcoded values
      this.messageCounter++, // Message counter
      param, // Parameter to change
      value, // Parameter value
      0xf7, // SysEx end
    ];

    // F0 7E 06 02 00 20 6B 04 00 01 03 01 00 00 00 F7
    this.logToWindow("Sending: " + bytesToHex(sysexMessage), "info");

    try {
      output.send(sysexMessage);
    } catch (error) {
      this.logToWindow(`Error sending MIDI message: ${error.message}`, "error");
    }
  },

  changeDeviceVersion() {
    if (this.targetVersion === "se") {
      this.sysexData = SYSEX_CONVERT_VANILLA_TO_SE;
    } else if (this.targetVersion === "vanilla") {
      this.sysexData = SYSEX_CONVERT_SE_TO_VANILLA;
    } else {
      this.logToWindow(`Invalid version: ${this.targetVersion}`, "error");
    }

    this.sendSysex();
  },
});

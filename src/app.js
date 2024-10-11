// const SYSEX_CONVERT_VANILLA_TO_SE = "F0 00 20 6B 04 01 75 01 3E 01 F7";
// const SYSEX_CONVERT_SE_TO_VANILLA = "F0 00 20 6B 04 01 46 01 3E 00 F7";

export default () => {
  return {
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
      "60 60 60 60 60 60 60 60 60 60 60 60 60 60 60 60",
      "60 60 60 48 60 60 60 72 60 60 60 48 60 60 72 48",
      "48 60 48 60 48 60 63 51 48 60 48 60 63 51 67 55 48 60 48 60 48 60 63 51 48 60 48 60 63 51 67 61",
      "60 60 60 60 60 60 57 59 60 60 60 59 60 60 60 60 60 60 62 59 60 62 64 67 69",
      "48 60 72 70 48 67 60 55 48 x 65 72 48 62 72 62 51 58 63 72 51 70 63 58 51 x 62 72 51 72 62 64",
      "48 x x 60 48 x 60 x 60 x x 72 60 x 60 x 48 x x 60 48 x 60 x 65 x x",
      "60 72 48 60 60 x x 48 60 72 x 60 60 x x 73 48 72 60 61 60 x 72 84 72 48 79 82 48 77 81 70",
      "48 48 x x 72 60 48 48 x x 48 x 72 x 82 x 48 48 x x 72 60 48 48 x x 48 x 72 x 75 x 48 48 x x 72 49 48",
    ],

    paramValues: {},
    midiInputs: [],
    midiOutputs: [],
    selectedInput: "",
    selectedOutput: "",
    midiAccess: null,

    consoleOpen: true,
    logMessages: [],
    clearLog() {
      this.logMessages = [];

      this.logToWindow(`[DEBUG] ---------- Cleared log ----------`, "info");
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

      this.scrollToBottom();
    },

    scrollToBottom() {
      if (this.$refs.logWindow) {
        this.$refs.logWindow.scrollTop = this.$refs.logWindow?.scrollHeight;
      }
    },

    init() {
      if (navigator.requestMIDIAccess) {
        navigator
          .requestMIDIAccess({
            sysex: true,
          })
          .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
      } else {
        this.logToWindow("WebMIDI is not supported in this browser.", "error");
      }

      // Initialize paramValues with default values
      for (const [name, param] of Object.entries(this.parameters)) {
        this.paramValues[name] = param.options
          ? param.options[0]
          : param.min || 0;
      }
    },

    onMIDISuccess(midiAccess) {
      this.midiAccess = midiAccess;
      this.updateDeviceLists();

      midiAccess.onstatechange = (event) => {
        this.logToWindow("MIDI state change: " + event.port.name, "info");
        this.updateDeviceLists();
      };
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

      if (miniBruteInput) {
        this.selectedInput = miniBruteInput.id;
        this.handleInputChange();
      }
      if (miniBruteOutput) {
        this.selectedOutput = miniBruteOutput.id;
        this.handleOutputChange();
      }
    },

    onMIDIFailure() {
      this.logToWindow("Could not access your MIDI devices.", "error");
    },

    handleInputChange() {
      const selectedDevice = this.midiInputs.find(
        (device) => device.id === this.selectedInput,
      );
      if (selectedDevice) {
        this.logToWindow(`Input changed: ${selectedDevice.name}`, "info");
      }
    },

    handleOutputChange() {
      const selectedDevice = this.midiOutputs.find(
        (device) => device.id === this.selectedOutput,
      );
      if (selectedDevice) {
        this.logToWindow(`Output changed: ${selectedDevice.name}`, "info");
      }
    },

    sendMIDIMessage(cc, value) {
      const output = this.midiOutputs.find(
        (device) => device.id === this.selectedOutput,
      );
      if (output) {
        output.send([0xb0, cc, value]); // Channel 1 CC message
      } else {
        this.logToWindow("No MIDI output selected", "warning");
      }
    },

    handleParamChange(param, value) {
      const { cc, min = 0, max = 127, options } = this.parameters[param];
      let midiValue;

      if (options) {
        midiValue = Math.floor(
          (options.indexOf(value) / (options.length - 1)) * 127,
        );
      } else {
        midiValue = Math.floor(((value - min) / (max - min)) * 127);
      }

      this.sendMIDIMessage(cc, midiValue);
      this.paramValues[param] = value;
    },
  };
};

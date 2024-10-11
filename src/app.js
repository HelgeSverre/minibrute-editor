export default () => {
  return {
    MIDI_CC_PARAMS: {
      "Receive Channel": {
        cc: 102,
        min: 1,
        max: 17,
        options: [...Array(16)].map((_, i) => `${i + 1}`).concat(["All"]),
      },
      "Send Channel": {
        cc: 103,
        min: 1,
        max: 16,
        options: [...Array(16)].map((_, i) => `${i + 1}`),
      },
      "Seq Retrig": { cc: 104, options: ["Reset", "Legato", "None"] },
      "Seq Play Mode": { cc: 105, options: ["Hold", "Note On"] },
      "Next Seq Mode": {
        cc: 106,
        options: ["End", "Instant Reset", "Instant Continuous"],
      },
      "Seq Step Size": {
        cc: 107,
        options: ["1/4", "1/8", "1/16", "1/32"],
      },
      "Sync Source": { cc: 108, options: ["Auto", "Int", "Ext"] },
      "Env Legato Mode": { cc: 109, options: ["Off", "On"] },
      "LFO Retrig Mode": { cc: 110, options: ["Off", "On"] },
      "Note Priority": { cc: 111, options: ["Last", "Low", "High"] },
      "Velocity Curve": { cc: 112, options: ["Lin", "Log", "Anti Log"] },
      "Gate Length": { cc: 113, options: ["Short", "Med", "Long"] },
      "Seq Step/Gate Mode": { cc: 114, options: ["Clk", "Gate/Tap"] },
      "Audio In Threshold": { cc: 115, options: ["Low", "Mid", "High"] },
      "Aftertouch Curve": {
        cc: 116,
        options: ["Exponential", "Logarithmic", "Linear"],
      },
      "Local ON/OFF": { cc: 122, options: ["Off", "On"] },
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

    init() {
      if (navigator.requestMIDIAccess) {
        navigator
          .requestMIDIAccess()
          .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
      } else {
        console.log("WebMIDI is not supported in this browser.");
      }

      // Initialize paramValues with default values
      for (const [name, param] of Object.entries(this.MIDI_CC_PARAMS)) {
        this.paramValues[name] = param.options
          ? param.options[0]
          : param.min || 0;
      }
    },

    onMIDISuccess(midiAccess) {
      this.midiAccess = midiAccess;
      this.updateDeviceLists();

      midiAccess.onstatechange = (event) => {
        console.log("MIDI state change:", event);
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
      console.log("Could not access your MIDI devices.");
    },

    handleInputChange() {
      const selectedDevice = this.midiInputs.find(
        (device) => device.id === this.selectedInput,
      );
      if (selectedDevice) {
        console.log("Selected MIDI input:", selectedDevice.name);
        // Add any input-specific logic here if needed
      }
    },

    handleOutputChange() {
      const selectedDevice = this.midiOutputs.find(
        (device) => device.id === this.selectedOutput,
      );
      if (selectedDevice) {
        console.log("Selected MIDI output:", selectedDevice.name);
        // We don't need to store the output device, as we'll use it directly in sendMIDIMessage
      }
    },

    sendMIDIMessage(cc, value) {
      const output = this.midiOutputs.find(
        (device) => device.id === this.selectedOutput,
      );
      if (output) {
        output.send([0xb0, cc, value]); // Channel 1 CC message
      } else {
        console.log("No MIDI output selected");
      }
    },

    handleParamChange(param, value) {
      const { cc, min = 0, max = 127, options } = this.MIDI_CC_PARAMS[param];
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

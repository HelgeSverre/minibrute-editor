# 🎹 MiniBrute Editor

<a href="https://minibrute-editor.vercel.app"><img src="https://img.shields.io/badge/Try%20it-Live-%23FADE6A.svg?style=for-the-badge"></a>

A web-based editor for the Arturia MiniBrute synthesizer (original and SE). It allows you to edit the MiniBrute's
configuration and sequences. Built with Alpine.js, Tailwind CSS, and Vite.

## 🚀 Getting Started

```shell
git clone https://github.com/HelgeSverre/minibrute-editor.git

cd minibrute-editor

# Install dependencies
yarn install

# Start the development server
yarn dev

# Build the project
yarn build

# Format the code
yarn format
```

## SysEx Documentation

### Parameter Change

Example sysex message

> F0 00 20 6B 04 01 06 01 07 F7

```
# F0 - SYSEX_HEADER
# 00 20 6B -  SYSEX Manufacturer (Arturia)
# 04 01 - Hardcoded values (unsure what they do atm)
# 06 - Counter - Seems to increment +1 every time a value is sent (0x00 - 0x7F, when inspecting midi messages in the "Brute Connection" software)
# 07 -  param to change (transmit channel)
# 01 -  param value
# F7 - SYSEX_END
```

#### Parameters

- `0x07` - MIDI Channel Select - Transmit Channel: 0x0(0) = 1, 0x10 (16)
- `0x05` - MIDI Channel Select - Receive Channel: 0x0(0) = chan 1, 0x 0x0F = chan 16 (val = 15), 0x10 (16) == all (16)
- `0x09` - Keyboard Parameters - Audio Gate Threshold: 0x00 (0) = high, 0x01 (1) = medium, 0x02 (2) = low
- `0x0F` - Keyboard Parameters - LFO Key Retrigger: 0x00 (0) = Off, 0x01 (1) = On
- `0x13` - Module Parameters - Aftertouch Response: 0x00 (0) = linear, 0x01 (1) = logarithmic, 0x02 (2) = exponential
- `0x11` - Module Parameters - Velocity Response: 0x00 (0) = linear, 0x01 (1) = logarithmic, 0x02 (2) = exponential
- `0x0D` - Module Parameters - Envelope legato Mode: 0x00 (0) = On, 0x01 (1) = Off
- `0x0B` - Module Parameters - Note Priority: 0x00 (0) = Last, 0x01 (1) = Low, 0x02 (2) = High
- `0xE2` - Sequencer Control - Play: 0x00 (0) = Hold, 0x01 (1) = Note On
- `0x32` - Sequencer Control - Next Seq: 0x00 (0) = End, 0x01 (1) = Inst. Reset, 0x02 (2) = Inst. Cont.
- `0x33` - Sequencer Control - Sync: 0x00 (0) = Auto, 0x01 (1) = Ext, 0x02 (2) = Int
- `0x3B` - Sequencer Control - Step: 0x00 (0) = Auto, 0x04 (4) 1/4, 0x08 (8) 1/8, 0x10 (16) 1/16

### Dump Sequences (Step Sequencer)

```
# F0 - SYSEX_HEADER
# 00 20 6B -  SYSEX Manufacturer (Arturia)
# TODO...
# F7 - SYSEX_END
```

### Resetting Sequences

```
[F0 00 20 6B 04 01] (08) 23 3A 00 00 10 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 3C 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 [/F7]
[F0 00 20 6B 04 01] (09) 23 3A 01 00 10 3C 3C 3C 30 3C 3C 3C 48 3C 3C 3C 30 3C 3C 48 30 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 [/F7]
[F0 00 20 6B 04 01] (0A) 23 3A 02 00 20 30 3C 30 3C 30 3C 3F 33 30 3C 30 3C 3F 33 43 37 30 3C 30 3C 30 3C 3F 33 30 3C 30 3C 3F 33 43 3D [/F7]
[F0 00 20 6B 04 01] (0B) 23 3A 03 00 20 3C 30 7F 48 3C 7F 48 7F 3C 30 7F 48 3C 7F 48 7F 3C 30 7F 48 3C 7F 48 7F 3F 33 7F 3F 33 7F 41 7F [/F7]
[F0 00 20 6B 04 01] (0C) 23 3A 04 00 20 30 3C 48 46 30 43 3C 37 30 7F 41 48 30 3E 48 3E 33 3A 3F 48 33 46 3F 3A 33 7F 3E 48 33 48 3E 40 [/F7]
[F0 00 20 6B 04 01] (0D) 23 3A 05 00 20 30 7F 7F 3C 30 7F 3C 7F 3C 7F 7F 48 3C 7F 3C 7F 30 7F 7F 3C 30 7F 3C 7F 41 7F 7F 41 7F 7F 44 7F [/F7]
[F0 00 20 6B 04 01] (0E) 23 3A 05 20 20 30 7F 7F 3C 30 7F 3C 7F 3C 7F 7F 48 3C 7F 3C 7F 30 7F 7F 3C 30 7F 3C 7F 35 41 34 40 33 3F 32 31 [/F7]
```

- `[F0 00 20 6B 04 01]` - Sysex header
- `(..)` - Sequence number (incrementing)
- `[..]` - Sequence data (32 steps) midi note numbers
- [/F7] - Sysex end

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

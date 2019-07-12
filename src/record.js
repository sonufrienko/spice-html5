"use strict";
/*
   Copyright (C) 2014 by Jeremy P. White <jwhite@codeweavers.com>

   This file is part of spice-html5.

   spice-html5 is free software: you can redistribute it and/or modify
   it under the terms of the GNU Lesser General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   spice-html5 is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General Public License
   along with spice-html5.  If not, see <http://www.gnu.org/licenses/>.
*/

/*----------------------------------------------------------------------------
**  SpiceRecordConn
**      Drive the Spice Record channel (sound in)
**--------------------------------------------------------------------------*/

import * as Utils from './utils.js';
import * as Messages from './spicemsg.js';
import { Constants } from './enums.js';
import { SpiceConn } from './spiceconn.js';

function SpiceRecordConn()
{
    SpiceConn.apply(this, arguments);

    // Cross browser
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    
    this.audioContext = new AudioContext();
    this.queue = new Array();
    this.append_okay = false;
    this.start_time = 0;
}

SpiceRecordConn.prototype = Object.create(SpiceConn.prototype);
SpiceRecordConn.prototype.process_channel_message = function(msg)
{
    if (!!!navigator.mediaDevices)
    {
        this.log_err('MediaDevices API is not available');
        return false;
    }

    if (msg.type == Constants.SPICE_MSG_RECORD_START)
    {
        var startData = new Messages.SpiceMsgRecordStart(msg.data);
        Utils.DEBUG > 0 && console.log("RECORD_START");
        Utils.DEBUG > 0 && console.log(startData);

        this.send_start_mark_message();
        this.send_mode_message();
        this.start_microphone();

        // Stop a Microphone when we stop WebSocket
        this.ws.addEventListener('close', this.stop_microphone.bind(this));
    }

    if (msg.type == Constants.SPICE_MSG_RECORD_STOP)
    {
        Utils.DEBUG > 0 && console.log("RECORD_STOP");
    }

    return false;
}

SpiceRecordConn.prototype.send_start_mark_message = function() {
    var startTimestamp = Date.now();
    var data = new Messages.SpiceMsgcRecordStartMark(startTimestamp);
    var msg = new Messages.SpiceMiniData();
    msg.build_msg(Constants.SPICE_MSGC_RECORD_START_MARK, data);
    this.send_msg(msg);
}

SpiceRecordConn.prototype.send_mode_message = function() {
    var data = new Messages.SpiceMsgcRecordMode(Constants.SPICE_RECORD_DATA_MODE_RAW);
    var msg = new Messages.SpiceMiniData();
    msg.build_msg(Constants.SPICE_MSGC_RECORD_MODE, data);
    this.send_msg(msg);
}

SpiceRecordConn.prototype.send_data_message = function(dataInUint8Array) {
    var data = new Messages.SpiceMsgcRecordData(new Date(), dataInUint8Array);
    var msg = new Messages.SpiceMiniData();
    msg.build_msg(Constants.SPICE_MSGC_RECORD_DATA, data);
    this.send_msg(msg);
}

SpiceRecordConn.prototype.start_microphone = function() {        
    var constraints = { 
        audio: { 
            echoCancellation: true
        }
    };

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(this.use_microphone_stream.bind(this))
        .catch(this.log_err);
}

SpiceRecordConn.prototype.use_microphone_stream = function(stream) {
    var audioContext = this.audioContext;

    var bufferSize = 2048;

    var gain_node = audioContext.createGain();
    gain_node.connect(audioContext.destination);

    var microphone_stream = audioContext.createMediaStreamSource(stream);
    microphone_stream.connect(gain_node);

    var script_processor_node = audioContext.createScriptProcessor(bufferSize, 1, 1);
    microphone_stream.connect(script_processor_node);

    var script_processor_fft_node = audioContext.createScriptProcessor(bufferSize, 1, 1);
    script_processor_fft_node.connect(gain_node);

    var analyserNode = audioContext.createAnalyser();
    analyserNode.smoothingTimeConstant = 0;
    analyserNode.fftSize = bufferSize;

    microphone_stream.connect(analyserNode);
    analyserNode.connect(script_processor_fft_node);

    script_processor_fft_node.onaudioprocess = this.microphone_onaudioprocess.bind(this, analyserNode);
}

SpiceRecordConn.prototype.microphone_onaudioprocess = function(analyserNode) {
    var array = new Uint8Array(analyserNode.frequencyBinCount);
        
    // copies the current frequency data into a Uint8Array
    analyserNode.getByteFrequencyData(array);
    this.send_data_message(array);
}

SpiceRecordConn.prototype.stop_microphone = function() {
    this.audioContext.close();
}

export {
  SpiceRecordConn
};

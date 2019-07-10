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
import * as Webm from './webm.js';
import * as Messages from './spicemsg.js';
import { Constants } from './enums.js';
import { SpiceConn } from './spiceconn.js';

function SpiceRecordConn()
{
    SpiceConn.apply(this, arguments);

    this.queue = new Array();
    this.append_okay = false;
    this.start_time = 0;
}

SpiceRecordConn.prototype = Object.create(SpiceConn.prototype);
SpiceRecordConn.prototype.process_channel_message = function(msg)
{
    if (msg.type == Constants.SPICE_MSG_RECORD_START)
    {
        Utils.DEBUG > 0 && console.log("RECORD_START");
    }

    if (msg.type == Constants.SPICE_MSG_RECORD_STOP)
    {
        Utils.DEBUG > 0 && console.log("RECORD_STOP");
    }

    return false;
}

export {
  SpiceRecordConn
};

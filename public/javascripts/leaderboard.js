"use strict";

import {
    initNavigationBar,
    updateNavigationBar,
    DYNAMIC_UI_UPDATE_INTERVAL_IN_MS
} from "./lib.js";

async function init ()
{
    initNavigationBar();
    startContentLoop();

}

async function contentLoop()
{
    updateNavigationBar();
}

async function startContentLoop()
{
    setInterval(contentLoop, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
}

window.addEventListener("load", init );
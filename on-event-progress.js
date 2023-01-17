/**
 * Copyright (c) 2023 Thomas von Stetten tvstetten[at]gmail[dot]com
 *
 * @License MIT
 *
 * Implements a [progressbar](progress-bar-js) for the
 * [PerformanceTests](#performancetests-js)-class.
 *
 * The exported function `onEvent` can be assigned to the onEvent-property of
 * a performance-test-object.
 *
 * **Uses** the [progress-bar.js](#progress-bar-js).
 *
 * @summary
 * Exports an onEvent-callback for the `ProgressTests`-class that implements a
 * terminal-progressBar.
 * *Uses* the [progress-bar.js](progress-bar-js).
 * @author Thomas von Stetten
 *
 * Created at     : 2023-01-17 11:29:06
 * Last modified  : 2023-01-17 21:01:06
 */

"use strict"
// @ts-check   Enable TypeScript type checking in VScode Editor

const ProgressBar = require("./progress-bar")

/**
 * Function to be used as a callback for the
 * Performance.js->pPerformanceTest()-class.
 *
 * @param {PerformanceTest} sender
 * @param {string} event
 * @param {number} circle
 * @param {Object} testInfo
 * @param {Number} testIndex
 */
function onEvent(sender, event, circle, testInfo, testIndex) {
    switch (event) {
        case "before_Run":
            sender.progressBar = new ProgressBar(this.maxCount, 80)
            break
        case "after_Warmup":
            sender.progressBar.update(0)
            break
        case "before_EachTests":
            sender.progressBar.update(circle)
            break
        case "after_Run":
            sender.progressBar.finish()
            break
    }
}

module.exports = onEvent

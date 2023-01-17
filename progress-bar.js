/**
 * Copyright (c) 2023 Thomas von Stetten tvstetten[at]gmail[dot]com
 *
 * @License MIT
 *
 * @summary A small class `ProgressBar` to display a Progress-bar on the console.
 * @author Thomas von Stetten
 *
 * Created at     : 2023-01-10 20:38:54
 * Last modified  : 2023-01-17 20:46:10
 */

class ProgressBar {
    constructor(max = 100, length = 80) {
        this.max = max
        this.current = 0
        this.length = length
        this.step = max / length
        this.position = -1
        this.percent = -1
    }

    /**
     * Set or increment the progress-bar.
     * @param {Number} [newVal=-1] if a value is provided the this.current-value is set to that value (where value is >=0<=max). If no value is provided the this.current is incremented by 1
     */
    update(newVal = -1) {
        if (newVal < 0) this.current++
        else this.current = newVal

        if (this.current > this.max) this.current = this.max
        if (this.current < 0) this.current = 0

        const pos = Math.round(this.current / this.step)
        const percent = Math.round((this.current / this.max) * 100)
        if (pos !== this.position || this.percent !== percent) {
            this.position = pos
            this.percent = percent
            const dots = ".".repeat(this.position)
            const left = this.length - this.position
            const empty = " ".repeat(left)

            process.stdout.write(`\r[${dots}${empty}] ${percent}%`)
        }
    }

    /**
     * Force the progressBar to display 100% and a fully filled bar.
     */
    finish() {
        this.update(this.max)
        process.stdout.write("\n")
    }
}

module.exports = ProgressBar

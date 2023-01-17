/**
 * Copyright (c) 2023 Thomas von Stetten tvstetten[at]gmail[dot]com
 *
 * @License MIT
 *
 * Contains the class `PerformanceTest` to measure the performance javascript
 * code.
 *
 * At the moment it is mainly thought to be used to display results on the command-line.
 *
 * @summary Performance-Test-Suite `PerformanceTest()`
 * @author Thomas von Stetten
 *
 * Created at     : 2023-01-17 11:37:41
 * Last modified  : 2023-01-17 21:03:27
 */

"use strict"

// @ts-check   Enable TypeScript type checking in VScode Editor
// spell: ignore: MAXCOUNT

class PerformanceTest {
    // Only for documentation-purposes
    static Events = [
        "before_Run", // this, "before_Run"
        "before_Warmup", // this, "before_Warmup"
        "after_Warmup", // this, "after_Warmup"
        "before_EachTests", // this, "before_EachTests", circle
        "before_EachTest", // this, "before_EachTest, "circle, testInfo, testIndex
        "after_EachTest", // this, "after_EachTest", circle, testInfo, testIndex
        "after_EachTests", // this, "after_EachTests", circle
        "after_Run", // this, "after_Run"
        "before_BuildResults", // this, "before_BuildResults"
        "after_BuildResults", // this, "after_BuildResults"
        "before_BuildTotals", // this, "before_BuildTotals"
        "after_BuildTotals", // this, "after_BuildTotals"
    ]
    static KnownOptionKeys = [
        "decimals",
        "maxCount",
        "maxCountFactor",
        "parameters",
        "padTitle",
        "warmupRounds",
        "filterWarmupAverage",
        "resultsAddColumnTitle",
        "resultsAddFuncResult",
        "onEvent",
        "onLog",
    ]
    static resultColumnTitles = {
        total: "tot:: ",
        average: "avg: ",
        min: "min: ",
        max: "max: ",
        diff: "diff: ",
        funcResult: "\n    => ",
    }

    static DEFAULT_MAXCOUNT = 100000
    constructor(options = undefined) {
        // don't change these values from the outside
        this.tests = []
        this.roundsDone = 0
        this.titleMaxLen = -1
        this.hasDifferentResults = false
        this.totalDifferentResults = []
        this.hasBuiltResults = false
        this.hasbuiltTotals = false

        this.decimals = 7
        this.maxCount = PerformanceTest.DEFAULT_MAXCOUNT
        this.parameters = undefined // for the test-function
        this.padTitle = true
        this.warmupRounds = 10
        this.filterWarmupAverage = false
        this.resultsAddColumnTitle = true
        this.resultsAddFuncResult = true

        this.onEvent = undefined
        this.onLog = undefined

        this.setOptions(options)
    }

    setOptions(options) {
        if (options)
            PerformanceTest.KnownOptionKeys.forEach((key) => {
                if (options.hasOwnProperty(key))
                    if (key === "maxCountFactor")
                        this.maxCount =
                            PerformanceTest.DEFAULT_MAXCOUNT * options[key]
                    else this[key] = options[key]
            })
        return this
    }

    setparameters(value) {
        this.parameters = value
        return this
    }

    setMaxCount(value) {
        this.maxCount = value
        return this
    }

    setMaxCountFactor(value) {
        this.maxCount = PerformanceTest.DEFAULT_MAXCOUNT * value
        return this
    }

    setPadTitle(value = true) {
        this.padTitle = value
        return this
    }

    setOnEvent(callback) {
        this.onEvent = callback
        return this
    }

    setOnLog(callback) {
        this.onLog = callback
        return this
    }

    /**
     *
     * @param {function} func
     * @param {string} [description="test #<index>"]
     * @returns {this}
     */
    add(func, description) {
        this.hasBuiltResults = false
        this.hasbuiltTotals = false
        description =
            description || func.name || `test #${this.tests.length + 1}`
        const testInfo = {
            function: func,
            title: description,
            totalTime: 0,
            totalPercent: 0,
            roundInfos: [],
            rankings: [],
            warmupTimes: undefined,
            warmupAvg: 0,
            warmupSum: 0,
            warmupMin: 0,
            warmupMax: 0,
            bigResultsCount: 0,
            bigResultsSum: 0,
            results: [],
        }
        this.tests.push(testInfo)

        // store the shortest description-length
        if (this.titleMaxLen < description.length)
            this.titleMaxLen = description.length

        return this
    }

    log(...msgs) {
        if (!this.onLog) console.log(...msgs)
        else this.onLog(...msgs)
        return this
    }

    warmup() {
        this.onEvent && this.onEvent(this, "before_Warmup")
        this._shuffle()

        // compile and run several times before the test
        this.log(
            `preparing ${this.tests.length} tests for ${this.maxCount} iterations...`
        )

        let t1, t2
        this.tests.forEach((testInfo) => {
            if (testInfo.rankings.length == 0) {
                testInfo.rankings.length = this.tests.length
                testInfo.rankings.fill(0)
            }
            testInfo.warmupTimes = Array(this.warmupRounds)
            for (let i = 1; i <= this.warmupRounds; i++) {
                t1 = performance.now()
                testInfo.function(this.parameters)
                t2 = performance.now()

                testInfo.warmupTimes[i] = t2 - t1
            }
        })

        this.tests.forEach((testInfo) => {
            let min = 9999999999,
                max = 0,
                sum = 0
            testInfo.warmupTimes.forEach((value) => {
                sum += value
                if (value > max) max = value
                if (value < min) min = value
            })
            sum -= max // ignore the max-value
            testInfo.warmupAvg = sum / (this.warmupRounds - 1) // -1 = maxvalue
            testInfo.warmupSum = sum
            testInfo.warmupMin = min
            testInfo.warmupMax = max

            testInfo.bigResultsCount = 0
            testInfo.bigResultsSum = 0
        })
        this.onEvent && this.onEvent(this, "after_Warmup")
    }

    run() {
        let testLoopResult
        let t1, t2, circle, diff

        this.hasBuiltResults = false
        this.hasbuiltTotals = false
        this.roundsDone++
        this.tests.forEach((testInfo) => {
            const statistics = Array(this.tests.length)
            statistics.fill(0)
            testInfo.results = []
            testInfo.roundInfos.push({
                time: 0,
                timeMin: 999999999999.0,
                timeMax: 0,
                testResult: undefined,
                statistics: statistics,
            })
        })

        this.onEvent && this.onEvent(this, "before_Run")

        this.warmup()

        for (circle = 1; circle <= this.maxCount; circle++) {
            this._shuffle()
            this.onEvent && this.onEvent(this, "before_EachTests", circle)
            const params = this.parameters
            this.tests.forEach((testInfo, teastIdx) => {
                this.onEvent &&
                    this.onEvent(
                        this,
                        "before_EachTest",
                        circle,
                        testInfo,
                        teastIdx
                    )
                const f = testInfo.function
                t1 = performance.now()
                testLoopResult = f(params)
                t2 = performance.now()
                diff = t2 - t1

                const roundInfo = testInfo.roundInfos[this.roundsDone - 1]
                if (roundInfo.timeMin > diff) roundInfo.timeMin = diff
                if (roundInfo.timeMax < diff) roundInfo.timeMax = diff

                roundInfo.testResult = testLoopResult
                roundInfo.statistics[teastIdx]++
                if (
                    this.filterWarmupAverage &&
                    testInfo.warmupAvg > 0 &&
                    diff > testInfo.warmupAvg * 2
                ) {
                    testInfo.bigResultsCount++
                    testInfo.bigResultsSum += diff
                    diff = testInfo.warmupAvg
                }
                roundInfo.time += diff
                testInfo.totalTime += diff

                this.onEvent &&
                    this.onEvent(
                        this,
                        "after_EachTest",
                        circle,
                        testInfo,
                        teastIdx
                    )
            })
            this.onEvent && this.onEvent(this, "after_EachTests", circle)
        }

        this.tests.sort(
            (a, b) =>
                a.roundInfos[this.roundsDone - 1].time -
                b.roundInfos[this.roundsDone - 1].time
        )
        this.tests.forEach((testInfo, index) => testInfo.rankings[index]++)

        this.onEvent && this.onEvent(this, "after_Run", circle)

        return this
    }

    toNumber(number, decimals) {
        decimals = decimals || this.decimals
        let strNum = number.toString()
        if (strNum.indexOf(".") < 0) strNum += ".0"
        return (strNum + "0".repeat(decimals)).substring(0, decimals)
    }

    calculateTitleMaxLen() {
        let result = -1
        let len = 0
        this.tests.forEach((testInfo) => {
            len = testInfo.title.length
            if (len > result) result = len
        })
        this.titleMaxLen = result
    }

    formatTitle(title) {
        title = title + ":"
        if (this.padTitle) {
            const spacesLen = this.titleMaxLen - title.length + 1
            if (spacesLen > 0) {
                const spaces = new Array(spacesLen + 1).join(" ")
                title += spaces
            }
        }
        return title
    }

    buildResults(
        showStatistics = false,
        callResultMaxLen = 50,
        showWarmupInfo = false
    ) {
        let lastResult = undefined
        let nextResult
        let testResultDisplay, roundInfo
        let minTime = 0
        let timeDiff = 0
        let diffStr

        this.hasBuiltResults = true
        this.hasbuiltTotals = false
        this.hasDifferentResults = false
        this.onEvent && this.onEvent(this, "before_BuildResults")
        this.tests.forEach((testInfo, index) => {
            roundInfo = testInfo.roundInfos[this.roundsDone - 1]
            if (!roundInfo) return // return to .forEach

            if (index === 0) {
                minTime = roundInfo.time
                timeDiff = 0.0
            } else {
                timeDiff = (roundInfo.time / minTime - 1) * 100
            }

            const colTitel = PerformanceTest.resultColumnTitles

            testInfo.results = [
                (this.resultsAddColumnTitle ? colTitel.total : "") +
                    this.toNumber(roundInfo.time) +
                    " ms",
                (this.resultsAddColumnTitle ? colTitel.average : "") +
                    this.toNumber(roundInfo.time / this.maxCount) +
                    " ms",
                (this.resultsAddColumnTitle ? colTitel.min : "") +
                    this.toNumber(roundInfo.timeMin) +
                    " ms",
                (this.resultsAddColumnTitle ? colTitel.max : "") +
                    this.toNumber(roundInfo.timeMax) +
                    " ms",
            ]
            if (index !== 0) {
                testInfo.results.push(
                    (this.resultsAddColumnTitle ? colTitel.diff : "") +
                        this.toNumber(timeDiff, 5) +
                        "%"
                )
            }
            if (showWarmupInfo) {
                testInfo.results.push(
                    `(${this.toNumber(testInfo.warmupAvg)}, ${
                        testInfo.bigResultsCount
                    }, ${this.toNumber(testInfo.bigResultsSum)})`
                )
            }
            if (showStatistics) {
                testInfo.results.push(roundInfo.statistics)
            }

            if (this.resultsAddFuncResult) {
                nextResult = "" + roundInfo.testResult
                if (nextResult === undefined || nextResult === lastResult) {
                    testResultDisplay = ""
                } else {
                    if (index > 0) this.hasDifferentResults = true
                    testResultDisplay =
                        (this.resultsAddColumnTitle
                            ? colTitel.funcResult
                            : "") +
                        "'" +
                        (callResultMaxLen > -1
                            ? nextResult.substring(0, callResultMaxLen) +
                              (nextResult.length > callResultMaxLen
                                  ? "..."
                                  : "")
                            : nextResult) +
                        "'"
                    lastResult = nextResult
                }

                testInfo.results.push(testResultDisplay)
            }
        })

        if (this.hasDifferentResults) {
            this.totalDifferentResults.push(this.roundsDone)
        }

        this.onEvent && this.onEvent(this, "after_BuildResults")
        return this
    }

    show(
        showDistribution = false,
        callResultMaxLen = 50,
        showWarmupInfo = false
    ) {
        if (!this.hasBuiltResults)
            this.buildResults(
                showDistribution,
                callResultMaxLen,
                showWarmupInfo
            )
        this.tests.forEach((testInfo) =>
            this.log(
                this.formatTitle(testInfo.title),
                testInfo.results.join(", ")
            )
        )
        return this
    }

    buildTotals() {
        this.hasBuiltResults = false
        this.hasbuiltTotals = true
        this.onEvent && this.onEvent(this, "before_BuildTotals")

        this.tests.sort((a, b) => a.totalTime - b.totalTime)
        let minTime = this.tests[0].totalTime // the first element was the fastest

        this.tests.forEach((testInfo, index) => {
            testInfo.results = [
                "avg:",
                this.toNumber(
                    testInfo.totalTime / (this.maxCount * this.roundsDone)
                ) + " ms",
                index === 0 || minTime === 0
                    ? ""
                    : `+${this.toNumber(
                          (testInfo.totalTime / minTime - 1) * 100,
                          5
                      )} %`,
            ]
        })

        this.onEvent && this.onEvent(this, "after_BuildTotals")
        return this
    }

    buildTotalsHeader(header = "Totals", addTests = true, addRounds = true) {
        header = "" + header
        let attribs = ""
        if (addTests) attribs += `${this.tests.length} Tests`
        if (addRounds)
            attribs += (attribs ? ", " : "") + `${this.roundsDone} Rounds`
        if (attribs) header += " (" + attribs + ")"
        return header + ":"
    }

    showTotals(header = "Totals", addTests = true, addRounds = true) {
        if (!this.hasbuiltTotals) this.buildTotals()

        if (header) {
            this.log(this.buildTotalsHeader(header, addTests, addRounds))
        }
        this.tests.forEach((testInfo) =>
            this.log(
                this.formatTitle(testInfo.title),
                this.toNumber(testInfo.totalTime) + " ms,",
                testInfo.results.join(", ")
            )
        )
        return this
    }

    // ===============================================================================
    //                                                                                   Placements
    // Totals (4 Tests, 4 Rounds):                    Total Time  Avg. Time   Diff.         1.      2.      3.      4.
    // ---------------------------------------------------------------------------------------------------------------
    // escape5_RxExecOrIdxOfWhileStr_g62OrArrayIdx6b: 12.2232 ms, 0.00030 ms                3      1      0      0
    // escape5_RxExecOrIdxOfWhileStr_g62OrArrayIdx6d: 12.4254 ms, 0.00031 ms, +1.654 %      1      2      1      0
    // escapeHtml_npm:                                12.8574 ms, 0.00032 ms, +5.189 %      0      1      2      1

    resetRounds() {
        this.roundsDone = 0
        this.tests.forEach((element) => {
            element.roundInfos = []
            element.rankings = []
        })
    }

    _shuffle() {
        let currentIndex = this.tests.length,
            randomIndex

        // While there remain elements to _shuffle.
        while (currentIndex != 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex--

            // And swap it with the current element.
            ;[this.tests[currentIndex], this.tests[randomIndex]] = [
                this.tests[randomIndex],
                this.tests[currentIndex],
            ]
        }
        return this
    }
}

module.exports = PerformanceTest

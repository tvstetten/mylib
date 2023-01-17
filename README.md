# mylib - contains my personel library with small js-modules

Although the library is public I take no responsibility for any errors and damages the library causes!

## Dependencies

No external libraries needed!

## Content

### performance.js

Contains the class `PerformanceTest` to measure the performance javascript code.

At the moment it is mainly thought to be used to display results on the command-line.

### pn-event-progress.js

Implements a [progressbar](progress-bar-js) for the [PerformanceTests](#performancetests-js)-class.

The exported function `onEvent` can be assigned to the onEvent-property of a performance-test-object.

**Uses** the [progress-bar.js](#progress-bar-js).
 
### progress-bar.js

A small class `ProgressBar` to display a Progress-bar on the console.

## License

MIT
'use strict';

const DEFAULT_OPTS = {
    hoursPerDay: 24,
    daysPerWeek: 7,
    weeksPerMonth: 4,
    monthsPerYear: 12,
    daysPerYear: 365.25
};

const UNIT_MAP = {
    ms: ['ms', 'milli', 'millisecond', 'milliseconds'],
    s: ['s', 'sec', 'secs', 'second', 'seconds'],
    m: ['m', 'min', 'mins', 'minute', 'minutes'],
    h: ['h', 'hr', 'hrs', 'hour', 'hours'],
    d: ['d', 'day', 'days'],
    w: ['w', 'week', 'weeks'],
    mth: ['mon', 'mth', 'mths', 'month', 'months'],
    y: ['y', 'yr', 'yrs', 'year', 'years']
};

export class Time {
    /**
     * Parses a human readable time into miliseconds
     * 
     * @param time string: time in human readable format
     * @returns number: the time in miliseconds
     */
    public static parse(time: string): number {
        return (this.parseTimestring(time) * 1000);
    }

    private static parseTimestring(string, returnUnit?, opts?): number {
        opts = Object.assign({}, DEFAULT_OPTS, opts || {});

        let totalSeconds = 0;
        let unitValues = this.getUnitValues(opts);
        let groups = string
            .toLowerCase()
            .replace(/[^.\w+-]+/g, '')
            .match(/[-+]?[0-9]+[a-z]+/g);

        if (groups !== null) {
            groups.forEach(group => {
                let value = group.match(/[0-9]+/g)[0];
                let unit = group.match(/[a-z]+/g)[0];

                totalSeconds += this.getSeconds(value, unit, unitValues);
            })
        }

        if (returnUnit) {
            return this.convert(totalSeconds, returnUnit, unitValues);
        }

        return totalSeconds;
    }


    private static getUnitValues(opts) {
        let unitValues: any = {
            ms: 0.001,
            s: 1,
            m: 60,
            h: 3600
        };

        unitValues.d = opts.hoursPerDay * unitValues.h;
        unitValues.w = opts.daysPerWeek * unitValues.d;
        unitValues.mth = (opts.daysPerYear / opts.monthsPerYear) * unitValues.d;
        unitValues.y = opts.daysPerYear * unitValues.d;

        return unitValues;
    }

    private static getUnitKey(unit) {
        for (let key of Object.keys(UNIT_MAP)) {
            if (UNIT_MAP[key].indexOf(unit) > -1) {
                return key;
            }
        }

        throw new Error(`The unit [${unit}] is not supported by timestring`);
    }

    private static getSeconds(value, unit, unitValues) {
        return value * unitValues[this.getUnitKey(unit)];
    }

    private static convert(value, unit, unitValues) {
        return value / unitValues[this.getUnitKey(unit)];
    }
}
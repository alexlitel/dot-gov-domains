const fs = require('fs');
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const prompt = Promise.promisifyAll(require('prompt'));


const states = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming"
};

const types = ['statefed', 'nofed', 'nofed-statesonly', 'fed'];
const newJson = JSON.parse(fs.readFileSync('data/18f.json'));
const oldJson = JSON.parse(fs.readFileSync('data/statefed.json'));
const domsList = {
    new: _.map(newJson, 'Domain Name'),
    old: _.map(oldJson, 'Domain Name'),
};
const uniqDoms = {
    old: _.filter(domsList.old, (x) => !domsList.new.includes(x)),
    new: _.filter(domsList.new, (x) => !domsList.old.includes(x)),
};


let newData = {};
newData.statefed = newJson;
newData.fed = _.chain(_.cloneDeep(newData.statefed)).filter((x) => x['Domain Type'] === "Federal Agency").map(x => _.omit(x, 'Domain Type')).value();
newData.nofed = _.chain(_.cloneDeep(newData.statefed))
    .filter(x => x['Domain Type'] !== 'Federal Agency')
    .map(x => _.omit(x, 'Agency'))
    .value();
newData['nofed-statesonly'] = _.chain(_.cloneDeep(newData.nofed))
    .filter((x) => /(State\/Local|City|County)/gi.test(x['Domain Type']) && states.hasOwnProperty(x.State))
    .map(x => {
        x.State = states[x.State];
        return x;
    })
    .value();


let changesText = `CHANGES\n${new Date().toString().slice(0, 15)}\n`;


function fedDomain(obj) {
    this["Domain Name"] = obj["Domain Name"];
    this["Canonical Url"] = "http://" + obj["Domain Name"];
    this.Redirect = false;
    this.Live = false;
    this.Agency = obj.Agency;
    this.City = obj.City;
    this.State = obj.State;
    this["Valid Https"] = false;
    this["Defaults To Https"] = false;
    this["Downgrades Https"] = false;
    this["Strictly Forces Https"] = false;
    this["Broken Root"] = true;
    this["Broken Www"] = true;
}

function createFileChangeText(type, obj) {
    let locText = `\n\n===== ${type.toUpperCase()} ===== \n\n`;
    locText += `ADDED (${obj.add.length} domains)\n${obj.add.sort(function(a,b) {return a.localeCompare(b); }).join('\n')}`;
    locText += `\n\nUPDATED (${obj.update.length} domains)\n${obj.update.join('\n')}`;
    locText += `\n\nREMOVED (${obj.remove.length} domains)\n${obj.remove.sort(function(a,b) {return a.localeCompare(b); }).join('\n')}`;
    return locText;

}

function writeChanges() {
    fs.writeFile('changes ' + moment().format('MMDDYY') + '.txt', changesText);
}

let errs = JSON.parse(fs.readFileSync('data/helpers/gov_errs.json'));
let statefedactions = {};
// function parseDomain(domain,changeObj,data1,data2) {

// }

function iterateFile(type, num) {

    console.log("\n\n===== " + type.toUpperCase() + '===== \n\n');

    let oldData = JSON.parse(fs.readFileSync(`data/${type}.json`, 'utf8'));
    const newData2 = newData[type];
    const oldDoms = _.map(oldData, 'Domain Name');
    const newDoms = _.map(newData2, 'Domain Name');
    const allDoms = _.concat(oldDoms, _.filter(newDoms, (x) => uniqDoms.new.includes(x)));
    let catchall = { error: {}, correct: [] };
    let locChanges = {
        update: [],
        remove: [],
        add: []
    };

    /* conditions 
    1. check if inside newOoms list
        1. if not, check if inside allDoms.new
            1. log new / old vals to console & prompt 4 change if so
        2. if so, check if there are any changed props
            1. if changed props, log new old vals & prompt 4 confirm change
        
    */

    return Promise
        .each(allDoms, function(dom, domNum) {
            const oldInd = oldDoms.indexOf(dom);
            const newInd = newDoms.indexOf(dom);
            let allInd = {};
            allInd.new = domsList.new.indexOf(dom);
            allInd.old = domsList.old.indexOf(dom);
            console.log('\n\n' + dom + '  ' + domNum + '\n');
            console.log(newInd, oldInd);
            if (newInd === -1) {

                if (allInd.new === -1) {
                    console.log('remove');
                    locChanges.remove.push(dom);
                    oldData[oldInd] = null;
                    Promise.resolve(true);
                    return true;
                } else {
                    console.log(allInd.new, allInd.old);
                    console.log('new\n', newData.statefed[allInd.new]);
                    console.log('old\n', oldJson[allInd.old]);
                    return prompt
                        .getAsync({ name: 'Keep domain?', required: true })
                        .then(response => {
                            response = _.values(response)[0].toLowerCase();
                            if (response === 'n') {
                                console.log('remove');
                                locChanges.remove.push(dom);
                                oldData[oldInd] = null;
                                Promise.resolve(true);
                                return true;
                            } else {
                                if (!errs[0][dom]) errs[0][dom] = { missing: [], miscategorized: [], fields: {} }
                                errs[0][dom].missing.push(type);
                            }
                        });
                }
                Promise.resolve(true);
                return true;

            } else if (oldInd === -1) {
                if (allInd.old === -1) {
                    console.log('add');
                    oldData.push(type === 'fed' ? new fedDomain(newData2[newInd]) : newData2[newInd]);
                    locChanges.add.push(dom);
                    Promise.resolve(true);
                    return true;
                } else {
                    console.log('new\n', newData.statefed[allInd.new]);
                    console.log('old\n', oldJson[allInd.old]);

                    return prompt
                        .getAsync({ name: 'Add domain?', required: true })
                        .then(response => {
                            response = _.values(response)[0].toLowerCase();
                            if (response === 'y') {
                                console.log('add');
                                oldData.push(type === 'fed' ? new fedDomain(newData2[newInd]) : newData2[newInd]);
                                locChanges.add.push(dom);
                            } else {
                                if (!errs[0][dom]) errs[0][dom] = { missing: [], miscategorized: [], fields: {} }
                                errs[0][dom].miscategorized.push(type);
                            }
                            Promise.resolve(true);
                            return true;
                        })
                }
                return Promise.resolve(true);
                return true;

            } else {
                let diffs = _.reduce(newData2[newInd], (result, value, key) => {
                    return _.isEqual(value.toLowerCase().trim(), oldData[oldInd][key].toLowerCase().trim()) ?
                        result : result.concat(key);
                }, []);

                let diffs2 = [];
                if (!!diffs.length) {
                    console.log('new\n', newData2[newInd]);
                    console.log('old\n', oldData[oldInd]);
                    console.log(diffs);

                    return Promise.each(diffs, (diff) => {
                        let newVal = newData2[newInd][diff];
                        let oldVal = oldData[oldInd][diff];
                        if (errs[0].hasOwnProperty(dom) && errs[0][dom].fields.hasOwnProperty(diff) && errs[0][dom].fields[diff].toLowerCase() === newVal.toLowerCase()) {
                            console.log(errs[0][dom].fields[diff].toLowerCase());
                            console.log('foo');
                            Promise.resolve(true);
                            return true;
                        }
                        if (type !== 'statefed') {
                            if (statefedactions.hasOwnProperty(dom) && statefedactions[dom].hasOwnProperty(diff)) {
                                if (statefedactions[diff]) {
                                    oldData[oldInd][diff] = newVal;
                                    diffs2.push(diff);
                                }
                            }
                            Promise.resolve(true);
                            return true;
                        }
                        if (type === 'nofed' && diff === 'State' && states.hasOwnProperty(newVal) && states[newVal].toLowerCase() === oldVal.toLowerCase()) {
                            oldData[oldInd][diff] = newVal;
                            diffs2.push(diff);
                            Promise.resolve(true);
                            return true;

                        }
                        if (catchall.correct.includes(newVal) || (catchall.error.hasOwnProperty(newVal) && catchall.error[newVal] === oldVal)) {
                            if (type === 'statefed') {
                                if (!statefedactions[dom]) statefedactions[dom] = {};
                                statefedactions[dom][diff] = catchall.correct.includes(newVal)
                            }
                            if (catchall.correct.includes(newVal)) {
                                oldData[oldInd][diff] = newVal;
                                diffs2.push(diff);
                            } else {
                                if (!errs[0][dom]) errs[0][dom] = { missing: [], miscategorized: [], fields: {} }
                                errs[0][dom].fields[diff] = newVal;

                            }
                            Promise.resolve(true);
                            return true;
                        } else {
                            console.log(`${diff}\nnew:\t${newVal}\nold:\t${oldData[oldInd][diff]}`);
                            return prompt
                                .getAsync({ name: 'Change prop?', required: true })
                                .then(response => {
                                    response = _.values(response)[0].toLowerCase();
                                    if (response === 'y' || response === 'c') {
                                        if (type === 'statefed') {
                                            if (!statefedactions[dom]) statefedactions[dom] = {};
                                            statefedactions[dom][diff] = true
                                        }
                                        if (response === 'c') catchall.correct.push(newVal);
                                        oldData[oldInd][diff] = newVal;
                                        diffs2.push(diff);
                                    } else {
                                        if (type === 'statefed') {
                                            if (!statefedactions[dom]) statefedactions[dom] = {};
                                            statefedactions[dom][diff] = false
                                        }
                                        if (response === 'e') catchall.error[newVal] = oldVal;
                                        if (!errs[0][dom]) errs[0][dom] = { missing: [], miscategorized: [], fields: {} }
                                        errs[0][dom].fields[diff] = newVal;
                                    }
                                    Promise.resolve(true);
                                    return true;
                                });
                        }
                    }).then(function(results) {
                        if (!!diffs2.length) {
                            locChanges.update.push(`${dom} - ${JSON.stringify(diffs2).replace(/(\"|\')/gm,'')}`);
                        }
                    });

                    Promise.resolve(true);
                    return true;
                } else {
                    Promise.resolve(true);
                    return true;
                }
            }

        })
        .then((vals) => {
            if (errs && type === 'fed') fs.writeFile('data/helpers/gov_errs.json', JSON.stringify(errs, null, '\t'), (e) => console.log('done'));
            oldData = oldData.filter(x => x !== null);
            changesText += createFileChangeText(type, locChanges);
            let sortedVals = (type === 'fed') ? _.sortBy(oldData, ['Agency', 'Domain Name']) :
                (type === 'statefed') ? _.sortBy(oldData, ['Domain Type', 'Domain Name']) :
                (type === 'nofed-statesonly') ? _.sortBy(oldData, ['State', 'Domain Name']) : _.sortBy(oldData, ['Domain Name']);

            fs.writeFile(`data2/${type}.json`, JSON.stringify(sortedVals, null, '\t'), (e) => console.log('done'));
            if (type === 'fed' || type == 'nofed-statesonly') {
                let prop = type === 'fed' ? 'Agency' : 'State';
                let sortedData = _.chain(sortedVals)
                    .groupBy(prop)
                    .map((val, key) => {
                        return {
                            [prop]: key,
                            Domains: val.map(x => x['Domain Name']),
                            "Domain Count": val.length
                        }
                    })
                    .value();
                fs.writeFile(`data2/sorted-${prop.toLowerCase()}domains.json`, JSON.stringify(sortedData, null, '\t'), (e) => console.log('done'));

            }
        })

}


Promise
    .each(types, iterateFile)
    .then(writeChanges);

const words = {
    first: [ 'community', 'randy', 'frothing', 'slippery', 'inverted', 'burly', 'serene', 'tidy' ],
    second: [ 'badger', 'bathtub', 'bucket', 'pulpit', 'scone', 'genius', 'witness', 'blanket' ]
}

const shuffle= arr => {
    let i, j, x;
    for (i = arr.length - 1; i; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
    return arr;
}

const idGen = (arr) => {
    return new Promise((resolve, reject) => {
        const len1 = words.first.length;
        const len2 = words.second.length;
        shuffle(words.first);
        shuffle(words.second);
        for (let i = 0; i < len1; i++) {
            for (let j = 0; j < len2; j++) {
                const idArr = [words.first[i], words.second[j]];
                console.log('TRYING ID: ' + idArr.join('_'));
                if (arr.length === 0 || !arr.includes(idArr.join('_'))) {
                    console.log('CHECK ID RESOLVED, SENDING ' + idArr)
                    resolve(idArr.join('-'));
                    return;
                } else {
                    continue;
                }
            }
        }
        resolve(false);
    })
}

module.exports = idGen;